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
