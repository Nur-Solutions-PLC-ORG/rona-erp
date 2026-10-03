export const getVerificationEmailTemplate = (code: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
    <h2 style="text-align: center; color: #111827;">Your Verification Code</h2>
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

export const getPasswordResetEmailTemplate = (code: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
    <h2 style="text-align: center; color: #111827;">Your Password Reset Code</h2>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background: #e5e7eb; padding: 12px 24px; border-radius: 8px;">
        ${code}
      </span>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 12px;">
      This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.
    </p>
  </div>
`;

export const getAccountCredentialsEmailTemplate = ({
  email,
  password,
  fullName,
}: {
  email: string;
  password: string;
  fullName?: string;
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
    <h2 style="text-align: center; color: #111827;">Welcome to Rona ERP${
      fullName ? `, ${fullName}` : ''
    }</h2>
    <p style="color: #374151; font-size: 14px;">
      Your account has been created. Use the one-time credentials below to sign in. You will be
      required to set a new password on your first sign-in.
    </p>
    <div style="margin: 24px 0;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">Email</p>
      <div style="font-size: 16px; font-weight: bold; color: #111827; background: #e5e7eb; padding: 12px 16px; border-radius: 8px; word-break: break-all;">
        ${email}
      </div>
      <p style="color: #6b7280; font-size: 12px; margin: 16px 0 4px;">One-time password</p>
      <div style="font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #111827; background: #e5e7eb; padding: 12px 16px; border-radius: 8px; word-break: break-all;">
        ${password}
      </div>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 12px;">
      For your security, change this password after signing in. If you weren't expecting this
      account, you can safely ignore this email.
    </p>
  </div>
`;
