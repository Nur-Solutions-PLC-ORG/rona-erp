import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class BomNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'BOM not found');
  }
}

export class BomCodeConflictException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'A BOM with this code already exists');
  }
}

export class BomVersionNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'BOM version not found');
  }
}

export class BomVersionNotDraftException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Only DRAFT BOM versions can be modified');
  }
}

export class BomVersionNotApprovedException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'BOM version is not APPROVED and cannot be used in production',
    );
  }
}

export class BomVersionImmutableException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'BOM version has been used in production and cannot be modified',
    );
  }
}

export class BomVersionAlreadyApprovedException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'BOM version is already APPROVED');
  }
}

export class BomDraftVersionExistsException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'BOM already has a DRAFT version; edit or approve it before creating another',
    );
  }
}

export class BomNoApprovedVersionException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'BOM has no APPROVED version; approve a version first',
    );
  }
}

export class BomRetiredException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'BOM is retired and cannot be used in production',
    );
  }
}

export class BomInactiveException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'BOM is inactive and cannot be used in production',
    );
  }
}

export class ProductionOrderNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Production order not found');
  }
}

export class ProductionOrderNumberConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'A production order with this number already exists',
    );
  }
}

export class ProductionOrderInvalidStatusException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}

export class ProductionBatchNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Production batch not found');
  }
}

export class ProductionBatchNumberConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'A production batch with this number already exists',
    );
  }
}

export class ProductionBatchNotInProgressException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Production batch is not IN_PROGRESS');
  }
}

export class MaterialNotInOrderException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Material is not part of this production order',
    );
  }
}

export class ConsumptionExceedsReservationException extends ApiException {
  constructor(
    readonly available: string,
    readonly requested: string,
  ) {
    super(
      HttpStatus.CONFLICT,
      `Consumption exceeds reserved quantity: requested ${requested}, reserved ${available}`,
    );
  }
}

export class ReturnExceedsConsumptionException extends ApiException {
  constructor(
    readonly returnable: string,
    readonly requested: string,
  ) {
    super(
      HttpStatus.CONFLICT,
      `Return exceeds consumed quantity: requested ${requested}, returnable ${returnable}`,
    );
  }
}

export class ProductionOutputFailedException extends ApiException {
  constructor() {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to record the finished-goods receipt',
    );
  }
}
