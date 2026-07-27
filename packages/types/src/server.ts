export type ServerStatus = {
  ok: boolean;
  message: string;
};

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  position?: string;
  tenantId?: string;
  app_metadata?: {
    role: string;
    tenant_id: string;
  };
}
