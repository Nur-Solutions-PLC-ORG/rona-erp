import { createTransport, type Transporter } from 'nodemailer';
import {
  getAccountCredentialsEmailTemplate,
  getPasswordResetEmailTemplate,
  getVerificationEmailTemplate,
} from './templates/auth';

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.',
    );
  }

  transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function getMailFrom(): string {
  const value = process.env.MAIL_FROM || process.env.SMTP_USER || '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

async function sendMail(to: string, subject: string, html: string) {
  try {
    return await getTransporter().sendMail({
      from: getMailFrom(),
      to,
      subject,
      html,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`Error sending email to ${to}:`, detail);
    throw new Error(`Failed to send email: ${detail}`);
  }
}

export const sendVerificationEmail = async (email: string, code: string) => {
  return sendMail(email, 'Your Login Verification Code', getVerificationEmailTemplate(code));
};

export const sendPasswordResetEmail = async (email: string, code: string) => {
  return sendMail(email, 'Your Password Reset Code', getPasswordResetEmailTemplate(code));
};

export const sendAccountCredentialsEmail = async (
  email: string,
  password: string,
  fullName?: string,
) => {
  return sendMail(
    email,
    'Your Rona ERP Account Credentials',
    getAccountCredentialsEmailTemplate({ email, password, fullName }),
  );
};
