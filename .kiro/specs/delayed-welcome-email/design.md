# Design Document: Delayed Welcome Email

## Overview

This feature adds an automated welcome email system that sends personalized emails to newly registered users after a configurable delay (30-60 seconds). The implementation leverages the existing EmailJS integration (already installed via `@emailjs/browser` package) and integrates seamlessly with the current authentication flow in `src/pages/Auth.tsx`.

The delayed approach ensures users complete their initial registration flow and land on the pose-match page before receiving the welcome email, creating a better user experience and reducing the chance of the email being missed during the registration process.

## Architecture

### High-Level Flow

```
User Registration → Supabase Auth → Success → Schedule Delayed Email → Wait (30-60s) → Send via EmailJS
```

### Component Integration

The feature will be implemented entirely within the existing `Auth.tsx` component by:
1. Detecting successful registration (non-login flow)
2. Scheduling a delayed email using `setTimeout`
3. Calling EmailJS API with user registration data
4. Handling success/failure logging

### Technology Stack

- **EmailJS**: Third-party email service (already installed)
- **React**: Component state and lifecycle management
- **TypeScript**: Type-safe implementation
- **Supabase Auth**: Provides user registration data

## Components and Interfaces

### 1. EmailJS Service Configuration

**Location**: Environment variables or constants file

```typescript
// Option 1: Environment variables (recommended)
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || 'template_rqysnu6',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  delayMs: 30000 // 30 seconds (configurable)
};

// Option 2: Direct constants (for quick implementation)
const EMAILJS_CONFIG = {
  serviceId: 'service_xxxxx',
  templateId: 'template_rqysnu6',
  publicKey: 'your_public_key',
  delayMs: 30000
};
```

### 2. Email Sending Function

**Location**: `src/pages/Auth.tsx` or new utility file `src/utils/emailService.ts`

```typescript
import emailjs from '@emailjs/browser';

interface WelcomeEmailParams {
  to_email: string;
  user_name: string;
}

const sendDelayedWelcomeEmail = (
  params: WelcomeEmailParams,
  delayMs: number = 30000
): void => {
  setTimeout(() => {
    emailjs
      .send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          to_email: params.to_email,
          user_name: params.user_name,
        },
        EMAILJS_CONFIG.publicKey
      )
      .then((response) => {
        console.log('Welcome email sent successfully!', response.status, response.text);
      })
      .catch((error) => {
        console.error('Failed to send welcome email:', error);
      });
  }, delayMs);
};
```

### 3. Integration with Auth Component

**Modification Point**: `src/pages/Auth.tsx` - `handleAuth` function

The email sending will be triggered after successful registration:

```typescript
// Inside handleAuth function, after successful signUp
if (!isLogin) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        height: height,
        age: age,
      },
    },
  });

  if (error) throw error;
  
  // NEW: Schedule delayed welcome email
  sendDelayedWelcomeEmail({
    to_email: email,
    user_name: fullName
  });
  
  toast.success("Account created! Please check your email.");
  navigate("/pose-match");
}
```

## Data Models

### EmailJS Template Variables

The EmailJS template (template_rqysnu6) must be configured with the following variables:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `to_email` | string | Recipient email address | "user@example.com" |
| `user_name` | string | User's full name | "John Doe" |

### EmailJS Template Configuration

**Template ID**: `template_rqysnu6`

**Required Template Settings**:
- **To Email Field**: Must be set to `{{to_email}}` (critical for dynamic recipient)
- **Subject**: "Welcome to AI Fitness Coach!"
- **Body**: Warm welcome message with personalization

**Recommended Template Content**:
```
Hi {{user_name}},

Welcome to AI Fitness Coach! 🎉

We're excited to have you on board. Our AI-powered platform will help you perfect your workout form and achieve your fitness goals.

Here's what you can do next:
• Start your first pose-matching session
• Track your workout progress
• Explore personalized training plans

If you have any questions or need help getting started, just reply to this email - we're here to help!

Let's get moving! 💪

Best regards,
The AI Fitness Coach Team
```

## Error Handling

### 1. EmailJS API Failures

**Strategy**: Fail silently with logging

- Email failures should NOT block user registration
- Log errors to console for debugging
- No user-facing error messages (email is supplementary)

```typescript
.catch((error) => {
  console.error('Failed to send welcome email:', error);
  // Do NOT show toast error to user
  // Do NOT throw error
});
```

### 2. Missing Configuration

**Strategy**: Early validation with warnings

```typescript
const validateEmailConfig = (): boolean => {
  if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
    console.warn('EmailJS configuration incomplete. Welcome emails will not be sent.');
    return false;
  }
  return true;
};

// Use before scheduling email
if (validateEmailConfig()) {
  sendDelayedWelcomeEmail({ to_email: email, user_name: fullName });
}
```

### 3. Timer Management

**Strategy**: No cleanup needed for setTimeout

- Since the timer is short (30-60s) and fires once, no cleanup is required
- If user navigates away, timer continues in background (desired behavior)
- No memory leak concerns for single-use timers

### 4. Network Issues

**Strategy**: Rely on EmailJS retry logic

- EmailJS handles network retries internally
- If email fails, it will be logged but not retried by our code
- User can request resend through support if needed

## Testing Strategy

### 1. Unit Testing

**Test Cases**:
- Email sending function is called with correct parameters
- Delay timer is set correctly (30s vs 60s)
- Configuration validation works properly
- Error handling doesn't throw exceptions

**Mock Strategy**:
```typescript
// Mock emailjs.send
jest.mock('@emailjs/browser', () => ({
  send: jest.fn().mockResolvedValue({ status: 200, text: 'OK' })
}));

// Test delayed execution
jest.useFakeTimers();
sendDelayedWelcomeEmail({ to_email: 'test@example.com', user_name: 'Test' });
jest.advanceTimersByTime(30000);
expect(emailjs.send).toHaveBeenCalled();
```

### 2. Integration Testing

**Test Scenarios**:
1. **Successful Registration Flow**
   - Register new user
   - Wait 30 seconds
   - Verify email received in inbox
   - Check email contains correct user name

2. **Login Flow (No Email)**
   - Login with existing account
   - Wait 30 seconds
   - Verify NO email is sent

3. **Registration Error (No Email)**
   - Attempt registration with existing email
   - Verify NO email is scheduled

4. **EmailJS Failure**
   - Use invalid EmailJS credentials
   - Register new user
   - Verify registration still succeeds
   - Check console for error log

### 3. Manual Testing Checklist

- [ ] Register with valid email and receive welcome email after 30s
- [ ] Verify email arrives in inbox (not spam)
- [ ] Check email personalization (correct name)
- [ ] Test with 60s delay configuration
- [ ] Verify login doesn't trigger email
- [ ] Test registration failure doesn't send email
- [ ] Check browser console for success/error logs
- [ ] Verify navigation away doesn't break email sending

### 4. EmailJS Dashboard Testing

**Steps**:
1. Go to EmailJS Dashboard → Email Log
2. Register test user
3. Wait for delay period
4. Check log for sent email
5. Verify status is "Sent" (green)
6. Check recipient address matches

## Configuration Management

### Environment Variables

Add to `.env` file:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_WELCOME_TEMPLATE_ID=template_rqysnu6
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here

# Optional: Configure delay (milliseconds)
VITE_WELCOME_EMAIL_DELAY_MS=30000
```

### Configuration Priority

1. Environment variables (production)
2. Default constants (development/fallback)

### Deployment Considerations

- Ensure `.env` is in `.gitignore` (already should be)
- Document required environment variables in README
- Provide example `.env.example` file
- Verify EmailJS free tier limits (200 emails/month)

## Security Considerations

### 1. API Key Exposure

**Risk**: Public key is exposed in frontend code
**Mitigation**: EmailJS public keys are designed for frontend use and have domain restrictions

**Best Practices**:
- Enable domain whitelist in EmailJS dashboard
- Restrict to production domain only
- Monitor EmailJS usage dashboard for abuse

### 2. Email Injection

**Risk**: User-provided data in email template
**Mitigation**: EmailJS sanitizes template variables automatically

**Validation**:
- Email address validated by Supabase Auth
- Full name validated by HTML form (required field)
- No additional sanitization needed

### 3. Rate Limiting

**Risk**: Spam registrations could exhaust email quota
**Mitigation**: 
- Supabase Auth has built-in rate limiting
- EmailJS free tier limit (200/month) acts as safety net
- Monitor EmailJS dashboard for unusual activity

## Performance Considerations

### 1. Non-Blocking Execution

- Email sending is asynchronous and doesn't block UI
- User navigates to pose-match immediately
- Email sends in background

### 2. Delay Impact

- 30-60s delay has no performance impact
- Timer runs in browser event loop
- No server resources consumed

### 3. Bundle Size

- EmailJS library already installed (no additional cost)
- New code adds ~50 lines (negligible)

## Future Enhancements

### Potential Improvements

1. **Email Preferences**
   - Allow users to opt-out of welcome emails
   - Store preference in Supabase user metadata

2. **Email Templates**
   - Multiple templates for different user types
   - A/B testing different welcome messages

3. **Email Analytics**
   - Track open rates via EmailJS
   - Measure engagement with welcome emails

4. **Retry Logic**
   - Implement exponential backoff for failures
   - Store failed emails in Supabase for retry

5. **Email Queue**
   - Move to server-side email queue (Supabase Edge Functions)
   - More reliable delivery
   - Better error handling

### Migration Path

If email volume exceeds EmailJS free tier:
1. Upgrade to EmailJS paid plan ($15/month for 1000 emails)
2. Migrate to Supabase Edge Functions with SendGrid/Mailgun
3. Implement server-side email queue with retry logic
