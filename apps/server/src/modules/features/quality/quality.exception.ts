import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class InspectionNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Inspection not found');
  }
}

export class InspectionNumberConflictException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'An inspection with this number already exists');
  }
}

export class InspectionTestNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Inspection test not found');
  }
}

export class InspectionStatusException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}

export class InspectionAlreadyReviewedException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'This inspection has already been reviewed');
  }
}

export class TestResultConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'A result has already been recorded for this test',
    );
  }
}

export class InspectionResultConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Inspection aggregate result is FAIL; the lot cannot be released',
    );
  }
}

export class LotNotQuarantinedException extends ApiException {
  constructor(currentStatus: string) {
    super(
      HttpStatus.CONFLICT,
      `Lot is not quarantined (current status: ${currentStatus}); only quarantined lots can be released or rejected`,
    );
  }
}
