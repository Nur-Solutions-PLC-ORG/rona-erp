import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class ItemNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Item not found');
  }
}

export class ItemCodeConflictException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'An item with this code already exists');
  }
}

export class ItemArchivedException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Item is archived and cannot be used in stock operations',
    );
  }
}

export class UnitOfMeasureNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Unit of measure not found');
  }
}

export class WarehouseNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Warehouse not found');
  }
}

export class WarehouseCodeConflictException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'A warehouse with this code already exists');
  }
}

export class WarehouseInactiveException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Warehouse is inactive and cannot be used in stock operations',
    );
  }
}

export class WarehouseLocationNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Warehouse location not found');
  }
}

export class WarehouseLocationCodeConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'A location with this code already exists in this warehouse',
    );
  }
}

export class LotNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Lot not found');
  }
}

export class InsufficientStockException extends ApiException {
  constructor(
    readonly available: string,
    readonly requested: string,
  ) {
    super(
      HttpStatus.CONFLICT,
      `Insufficient stock: requested ${requested}, available ${available}`,
    );
  }
}

export class InvalidStockOperationException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, message);
  }
}

export class ReservationNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Reservation not found');
  }
}

export class ReservationNotActiveException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Reservation is not active and cannot be modified',
    );
  }
}
