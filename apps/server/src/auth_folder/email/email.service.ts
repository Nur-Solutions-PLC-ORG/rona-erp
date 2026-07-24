import {Injectable, Logger} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.logger.log(`SMTP transporter initialized with host: ${process.env.SMTP_HOST}`);
    } else {
      this.logger.log('SMTP credentials not configured. Verification codes will be output to server logs and API responses in dev mode.');
    }
  }

  async sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
    const subject = 'Your Email Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a73e8; text-align: center;">Verify Your Email Address</h2>
        <p>Thank you for registering. Please use the following 6-digit verification code to complete your signup:</p>
        <div style="background-color: #f1f3f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #202124; border-radius: 6px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 13px; color: #5f6368;">This code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Auth Service" <noreply@example.com>',
          to: toEmail,
          subject,
          html,
        });
        this.logger.log(`Email verification sent via SMTP to: ${toEmail}`);
        return true;
      } catch (error: any) {
        this.logger.error(`Failed to send SMTP email to ${toEmail}: ${error.message}`);
      }
    }

    this.logger.log(`📧 [EMAIL VERIFICATION CODE] To: ${toEmail} | Code: ${code}`);
    return false;
  }
}
