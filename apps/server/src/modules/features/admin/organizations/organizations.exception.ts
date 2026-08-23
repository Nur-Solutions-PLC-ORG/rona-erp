import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class AdminOrganizationNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'The organization could not be found.');
  }
}

export class AdminOrganizationSlugExistsException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'An organization with this slug already exists.',
    );
  }
}
