import { Resend } from 'resend';
import {
  getPasswordResetEmailTemplate,
  getVerificationEmailTemplate,
} from './templates/auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev';

export const sendVerificationEmail = async (email: string, code: string) => {
  const data = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Your Login Verification Code',
    html: getVerificationEmailTemplate(code),
  });

  if (!data || data.error) {
    console.error('Error sending email:', data?.error);
    throw new Error('Failed to send verification email.');
  }

  return data;
};

export const sendPasswordResetEmail = async (email: string, code: string) => {
  const data = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Your Password Reset Code',
    html: getPasswordResetEmailTemplate(code),
  });

  if (!data || data.error) {
    console.error('Error sending password reset email:', data?.error);
    throw new Error('Failed to send password reset email.');
  }

  return data;
};
