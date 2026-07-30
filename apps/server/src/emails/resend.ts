import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev';

// Verification Email
const getVerificationEmailTemplate = (code: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
    <h2 style="text-align: center; color: #111827;">Your Verification Code</h2>
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      Use the code below to complete your sign-in. This code will expire in 10 minutes.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background: #e5e7eb; padding: 12px 24px; border-radius: 8px;">
        ${code}
      </span>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 12px;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  </div>
`;

export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your Login Verification Code',
      html: getVerificationEmailTemplate(code),
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

// Password reset email template
const getPasswordResetEmailTemplate = (resetUrl: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
    <h2 style="text-align: center; color: #111827;">Password Reset Request</h2>
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      You requested a password reset. Click the button below to set a new password.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 12px;">
      This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
    </p>
  </div>
`;

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
) => {
  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: getPasswordResetEmailTemplate(resetUrl),
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};
