export interface JwtPayload {
  sub: string;
  email: string;
  session_id?: string;
  role?: string;
  position?: string;
  tenantId?: string;
  app_metadata?: {
    role: string;
    tenant_id: string;
  };
}

