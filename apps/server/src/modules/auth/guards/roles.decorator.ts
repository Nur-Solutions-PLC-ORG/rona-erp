import { SetMetadata } from '@nestjs/common';
import { Position } from '@rona/types/auth';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Position[]) => SetMetadata(ROLES_KEY, roles);
