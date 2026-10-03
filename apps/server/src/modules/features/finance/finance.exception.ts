import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class InvoiceNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Invoice not found');
  }
}

export class InvoiceStateException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}

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

export class CostNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Cost not found');
  }
}

export class PaymentNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Payment not found');
  }
}

export class PaymentOverpayException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Payment amount exceeds the invoice outstanding balance',
    );
  }
}
