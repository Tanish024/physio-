# Welcome Email Setup Guide

This guide will help you configure the automated welcome email feature that sends a personalized email to users 30 seconds after they register.

## Overview

When a user successfully registers for an account, the system automatically:
1. Completes the registration with Supabase Auth
2. Schedules a welcome email to be sent after 30 seconds
3. Sends the email via EmailJS with the user's name and email

## Prerequisites

- EmailJS account (free tier works perfectly!)
- Email service connected in EmailJS (Gmail, Outlook, etc.)
- Template ID: `template_rqysnu6`

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **"Sign Up"** (top right)
3. Create a free account (no credit card needed!)
4. Verify your email address

## Step 2: Connect Email Service

1. After logging in, click **"Email Services"** in the left sidebar
2. Click **"Add New Service"**
3. Choose your email provider (Gmail recommended)
4. Click **"Connect Account"** and sign in
5. Copy the **Service ID** (looks like: `service_abc123`)

## Step 3: Create Welcome Email Template

1. Click **"Email Templates"** in the left sidebar
2. Click **"Create New Template"**
3. Set the template name: "Welcome Email"

### Critical: Configure "To Email" Field

⚠️ **MOST IMPORTANT STEP** - At the very top of the template editor, there's a field called **"To Email"**.

**It MUST be set to:**
```
{{to_email}}
```

This tells EmailJS to send the email to the user's registered email address.

### Template Configuration

**Subject:**
```
Welcome to AI Fitness Coach!
```

**Body:**
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

4. Click **"Save Template"**
5. Copy the **Template ID** (should be: `template_rqysnu6`)

## Step 4: Get Your Public Key

1. Click **"Account"** in the left sidebar
2. Click **"General"** tab
3. Find the **"Public Key"** section
4. Copy your **Public Key** (looks like: `abcdefghijklmnop`)

## Step 5: Update Environment Variables

Open your `.env` file and update these values:

```env
VITE_EMAILJS_SERVICE_ID="service_abc123"          # Your Service ID from Step 2
VITE_EMAILJS_WELCOME_TEMPLATE_ID="template_rqysnu6"  # Your Template ID from Step 3
VITE_EMAILJS_PUBLIC_KEY="abcdefghijklmnop"       # Your Public Key from Step 4
VITE_WELCOME_EMAIL_DELAY_MS="30000"              # 30 seconds (optional, can change to 60000 for 1 minute)
```

## Step 6: Test the Feature

1. **Restart your dev server** (important for environment variables to load):
   ```bash
   npm run dev
   ```

2. **Register a new account**:
   - Go to the registration page
   - Fill in your details with YOUR email address
   - Click "Create Account"

3. **Wait 30 seconds** and check your email inbox!

## Template Variables Reference

The EmailJS template uses these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Recipient email address (MUST be in "To Email" field) | user@example.com |
| `{{user_name}}` | User's full name from registration | John Doe |

## Troubleshooting

### Email Not Received?

1. **Check spam folder** - Sometimes welcome emails land in spam
2. **Verify "To Email" field** - Must be set to `{{to_email}}` (most common issue!)
3. **Check browser console** - Open DevTools (F12) and look for error messages
4. **Check EmailJS dashboard** - Go to "Email Log" to see if email was sent
5. **Verify environment variables** - Make sure all IDs are correct and dev server was restarted

### Common Errors

**"The recipients address is empty"**
- Fix: Set the "To Email" field in your template to `{{to_email}}`

**"Service not found"**
- Fix: Verify `VITE_EMAILJS_SERVICE_ID` matches your EmailJS Service ID exactly

**"Template not found"**
- Fix: Verify `VITE_EMAILJS_WELCOME_TEMPLATE_ID` matches your template ID

**"The public key is required"**
- Fix: Verify `VITE_EMAILJS_PUBLIC_KEY` is set correctly

### Testing Tips

1. **Use EmailJS Test Feature**:
   - Go to your template in EmailJS dashboard
   - Click "Test It" button
   - Fill in test values and send
   - If this works, the issue is in your app configuration

2. **Check Console Logs**:
   - Successful send: "Welcome email sent successfully!"
   - Failed send: "Failed to send welcome email:" with error details

3. **Verify Timing**:
   - Email should arrive 30 seconds after registration
   - Check EmailJS dashboard "Email Log" for exact send time

## Configuration Options

### Change Email Delay

To change when the email is sent, update the delay in `.env`:

```env
# 30 seconds (default)
VITE_WELCOME_EMAIL_DELAY_MS="30000"

# 1 minute
VITE_WELCOME_EMAIL_DELAY_MS="60000"

# 2 minutes
VITE_WELCOME_EMAIL_DELAY_MS="120000"
```

Remember to restart your dev server after changing `.env` files!

### Customize Email Content

To customize the welcome email:
1. Go to EmailJS dashboard → Email Templates
2. Click on your template (`template_rqysnu6`)
3. Edit the subject and body
4. Click "Save Template"
5. No code changes needed!

## Free Tier Limits

EmailJS free tier includes:
- ✅ 200 emails per month
- ✅ No credit card required
- ✅ All features included
- ✅ Perfect for testing and small projects

If you need more emails, upgrade to the paid plan ($15/month for 1000 emails).

## Security Notes

- The EmailJS public key is safe to use in frontend code
- Enable domain whitelist in EmailJS dashboard for production
- Monitor EmailJS usage dashboard for unusual activity
- Supabase Auth provides rate limiting to prevent spam registrations

## Need Help?

If you're still having issues:

1. Check the browser console for error messages
2. Check EmailJS dashboard → "Email Log" for send status
3. Verify all environment variables are set correctly
4. Make sure you restarted the dev server after changing `.env`
5. Test the template directly in EmailJS dashboard

## How It Works

The welcome email feature is implemented in:
- **Email Service**: `src/utils/emailService.ts` - Handles email sending logic
- **Auth Component**: `src/pages/Auth.tsx` - Triggers email after registration
- **Configuration**: `.env` - Stores EmailJS credentials

When a user registers:
1. Supabase Auth creates the account
2. `sendDelayedWelcomeEmail()` is called with user's email and name
3. A 30-second timer is started
4. After 30 seconds, EmailJS sends the welcome email
5. Success/failure is logged to console

The email sending happens in the background and doesn't block the registration process. If the email fails to send, the user's registration is still successful.
