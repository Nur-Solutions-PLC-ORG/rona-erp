import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class CommissionRuleNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Commission rule not found');
  }
}

export class CommissionRecordNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Commission record not found');
  }
}

export class CommissionRecordStateException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}
