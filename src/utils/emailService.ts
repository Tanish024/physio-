import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  templateId: import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || 'template_rqysnu6',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
  delayMs: Number(import.meta.env.VITE_WELCOME_EMAIL_DELAY_MS) || 30000, // 30 seconds default
};

/**
 * Validates EmailJS configuration
 * @returns true if configuration is complete, false otherwise
 */
export const validateEmailConfig = (): boolean => {
  if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
    console.warn('EmailJS configuration incomplete. Welcome emails will not be sent.');
    return false;
  }
  return true;
};

export interface WelcomeEmailParams {
  to_email: string;
  user_name: string;
}

/**
 * Sends a delayed welcome email to a newly registered user
 * @param params - Email parameters including recipient email and user name
 * @param delayMs - Delay in milliseconds before sending (default: 30000ms / 30 seconds)
 */
export const sendDelayedWelcomeEmail = (
  params: WelcomeEmailParams,
  delayMs: number = EMAILJS_CONFIG.delayMs
): void => {
  // Validate configuration before scheduling
  if (!validateEmailConfig()) {
    return;
  }

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
        // Fail silently - don't throw error to avoid blocking registration
      });
  }, delayMs);
};
