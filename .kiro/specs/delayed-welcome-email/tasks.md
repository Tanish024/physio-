# Implementation Plan: Delayed Welcome Email

- [x] 1. Set up EmailJS configuration constants


  - Create configuration object with service ID, template ID (template_rqysnu6), public key, and delay duration
  - Add environment variable support for EmailJS credentials
  - Implement configuration validation function to check for missing values
  - _Requirements: 2.1, 2.2, 5.1, 5.4_


- [ ] 2. Create email sending utility function
  - Implement `sendDelayedWelcomeEmail` function that accepts email and user name parameters
  - Use `setTimeout` to delay email sending by configurable duration (default 30 seconds)
  - Call `emailjs.send()` with correct service ID, template ID, email parameters, and public key
  - Add console logging for successful email sends
  - Add error handling with console logging for failed sends
  - Ensure errors don't throw exceptions (fail silently)


  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2_

- [ ] 3. Integrate delayed email into registration flow
  - Import emailjs library and email utility function into Auth.tsx
  - Locate the successful registration block in `handleAuth` function (non-login flow)
  - Add call to `sendDelayedWelcomeEmail` after successful `supabase.auth.signUp()`
  - Pass user's email and full name as parameters


  - Ensure email is only triggered on successful registration, not on login
  - Ensure email is not triggered if registration fails
  - _Requirements: 1.1, 1.3, 1.4, 4.1_

- [ ] 4. Add environment variables for EmailJS configuration
  - Update `.env` file with EmailJS service ID, template ID, and public key placeholders
  - Create `.env.example` file with example EmailJS configuration
  - Document required environment variables
  - _Requirements: 5.4_

- [ ] 5. Write unit tests for email utility function
  - Create test file for email utility
  - Mock `emailjs.send()` function
  - Test that email function is called with correct parameters (to_email, user_name)
  - Test that delay timer is set correctly (30000ms)
  - Test configuration validation catches missing credentials
  - Test error handling doesn't throw exceptions
  - Use fake timers to test delayed execution
  - _Requirements: 2.3, 2.4, 4.2, 5.2, 5.3_

- [ ] 6. Create integration test for registration flow
  - Write test that simulates successful user registration



  - Verify email sending function is called after registration
  - Verify email is NOT called during login flow
  - Verify email is NOT called when registration fails
  - Test that registration succeeds even if email sending fails
  - _Requirements: 1.1, 1.3, 4.1, 5.2_

- [ ] 7. Add documentation for EmailJS template setup
  - Document required EmailJS template configuration (template_rqysnu6)
  - Specify template variables: {{to_email}} and {{user_name}}
  - Provide recommended welcome email template content
  - Document "To Email" field must be set to {{to_email}}
  - Add troubleshooting guide for common EmailJS issues
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.2_
