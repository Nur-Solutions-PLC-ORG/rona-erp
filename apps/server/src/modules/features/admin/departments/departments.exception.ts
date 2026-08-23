import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class AdminDepartmentNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'The department could not be found.');
  }
}
