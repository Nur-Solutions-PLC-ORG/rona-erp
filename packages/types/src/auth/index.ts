export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  tenant_id: string;
  role?: string;
  eid?: string;
  sex?: string;
  date_of_birth?: string;
  emergency_contacts?: {
    name: string;
    phone: string;
    relation?: string;
  }[];
  photo_url?: string;
};

export type LoginInput = {
  email?: string;
  eid?: string;
  tenant_id?: string;
  password: string;
};

export type VerifyEmailInput = {
  email: string;
  code: string;
};

export type ResendVerificationInput = {
  email: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  code: string;
  newPassword: string;
};

export type EnableMfaInput = {
  code: string;
};

export type VerifyMfaInput = {
  code: string;
};

export type DisableMfaInput = {
  code: string;
};

export type MfaSetupResponse = {
  success: boolean;
  message: string;
};
