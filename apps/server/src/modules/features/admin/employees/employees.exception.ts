import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class AdminEmployeeNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'The employee could not be found.');
  }
}

export class AdminEmployeeIdExistsException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'An employee with this ID already exists.');
  }
}
