import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@rona/types/tenancy';

export const PERMISSIONS_KEY = 'tenancy:permissions';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
