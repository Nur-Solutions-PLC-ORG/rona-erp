import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.logger.log('resend ready');
    } else {
      this.logger.log('resend api key missing');
    }
  }

  async sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
    const sanitizedEmail = toEmail.toLowerCase().trim().replace(/[<>"'&]/g, '');
    const subject = 'your verification code';
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

    if (this.resend) {
      try {
        const result = await this.resend.emails.send({
          from: process.env.EMAIL_FROM || 'Auth Service <onboarding@resend.dev>',
          to: toEmail,
          subject,
          html,
        });

        if (result.error) {
           this.logger.error(`resend email failed for ${toEmail}: ${result.error.message}`);
           return false;
        }

        this.logger.log(`verification email sent to ${toEmail}`);
        return true;
      } catch (error: any) {
        this.logger.error(`resend email error for ${toEmail}: ${error.message}`);
      }
    }

    this.logger.log(`verification code for ${toEmail}: ${code}`);
    return false;
  }
}
