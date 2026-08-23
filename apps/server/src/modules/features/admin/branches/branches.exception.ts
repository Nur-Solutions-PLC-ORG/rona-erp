import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class AdminBranchNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'The branch could not be found.');
  }
}
