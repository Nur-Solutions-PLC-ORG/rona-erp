export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  tenantId?: string;
  app_metadata?: {
    role: string;
    tenant_id: string;
  };
}