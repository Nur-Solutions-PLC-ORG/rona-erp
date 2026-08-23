import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class AdminOrganizationSettingsNotFoundException extends ApiException {
  constructor() {
    super(
      HttpStatus.NOT_FOUND,
      'The organization settings could not be found.',
    );
  }
}

export class AdminOrganizationSettingsExistsException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Organization settings already exist for this organization.',
    );
  }
}
