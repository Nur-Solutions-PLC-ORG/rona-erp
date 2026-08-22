import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class AdminUserNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'The user could not be found.');
  }
}

export class AdminUserEmailExistsException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'A user with this email already exists.');
  }
}
