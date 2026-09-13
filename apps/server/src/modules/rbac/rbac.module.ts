import { Module } from '@nestjs/common';
import { RbacRepository } from './rbac.repository';
import { RbacService } from './rbac.service';
import { PermissionGuard } from './permission.guard';

@Module({
  providers: [RbacRepository, RbacService, PermissionGuard],
  exports: [RbacRepository, RbacService, PermissionGuard],
})
export class RbacModule {}
