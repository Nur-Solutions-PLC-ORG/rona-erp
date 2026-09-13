import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class NoActiveMembershipException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      'You are not an active member of any organization',
    );
  }
}

export class OrganizationAccessDeniedException extends ApiException {
  constructor() {
    super(HttpStatus.FORBIDDEN, 'You do not have access to this organization');
  }
}

export class InvalidOrganizationHeaderException extends ApiException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, 'Invalid organization header');
  }
}

export class MembershipNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Membership not found');
  }
}

export class MembershipAlreadyExistsException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'User is already a member of this organization');
  }
}

export class UserNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'User not found');
  }
}

export class LastOwnerMembershipException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Cannot remove or demote the last active OWNER of the organization',
    );
  }
}

export class RoleNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Role not found');
  }
}

export class OrganizationNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Organization not found');
  }
}

export class SystemRoleModificationException extends ApiException {
  constructor(message = 'System roles cannot be modified or deleted') {
    super(HttpStatus.CONFLICT, message);
  }
}
