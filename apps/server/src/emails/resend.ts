import { Resend } from 'resend';
import {
  getPasswordResetEmailTemplate,
  getVerificationEmailTemplate,
} from './templates/auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev';

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

export const sendPasswordResetEmail = async (email: string, token: string) => {
  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: getPasswordResetEmailTemplate(token),
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};
