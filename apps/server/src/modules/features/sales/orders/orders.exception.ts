import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class SalesOrderNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Sales order not found');
  }
}

export class SalesOrderStateException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}
