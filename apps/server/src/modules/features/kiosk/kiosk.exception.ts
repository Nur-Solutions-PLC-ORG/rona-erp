import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class KioskNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Kiosk not found');
  }
}

export class KioskAlreadyActiveException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Kiosk is already active');
  }
}

export class KioskAlreadyInactiveException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Kiosk is already inactive');
  }
}

export class KioskAuthenticationException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'This device is not registered or is not allowed to use kiosk terminals.',
    );
  }
}

export class KioskTokenConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'This device credential is already in use. Choose a different one.',
    );
  }
}

export class KioskEmployeeNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'No employee found with this Employee ID.');
  }
}

export class KioskEmployeeInactiveException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      'This employee is not active and cannot record attendance.',
    );
  }
}

export class KioskInvalidPasscodeException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'The passcode is invalid. Confirm the employee has a kiosk passcode set up.',
    );
  }
}

export class KioskFaceNotRecognizedException extends ApiException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, 'Face does not match EID.');
  }
}

export class WebAuthnChallengeInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'The WebAuthn challenge is expired or invalid. Please try again.',
    );
  }
}

export class WebAuthnCredentialNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'No WebAuthn credential matches this request.');
  }
}

export class WebAuthnVerificationFailedException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'The WebAuthn response could not be verified.',
    );
  }
}

export class WebAuthnCredentialAlreadyExistsException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'This WebAuthn credential is already registered.',
    );
  }
}

// Native kiosk terminals (Rona Kiosk app)

export class KioskSignatureInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'The terminal request signature is missing, expired or invalid.',
    );
  }
}

export class KioskNotPairedException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'This terminal is not paired. Pair it again with a device token.',
    );
  }
}

export class KioskPublicKeyInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'The terminal public key must be an EC key in SPKI DER format.',
    );
  }
}

export class KioskPolicyNotSatisfiedException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      "The verification methods used do not satisfy this kiosk's verification policy.",
    );
  }
}

export class KioskEventTooOldException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'This offline attendance event is too old to be recorded.',
    );
  }
}

export class KioskEnrollUnauthorizedException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'The enrollment session is missing, expired or invalid.',
    );
  }
}

export class KioskEnrollCodeInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'The enrollment code is invalid or has expired.',
    );
  }
}

export class KioskEnrollCodeUnavailableException extends ApiException {
  constructor() {
    super(
      HttpStatus.SERVICE_UNAVAILABLE,
      'Could not create an enrollment code. Please try again.',
    );
  }
}

export class KioskAdminPinInvalidException extends ApiException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'The admin PIN is incorrect.');
  }
}

export class KioskTemplateNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Biometric template not found.');
  }
}

export class KioskCardNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Card not found.');
  }
}

export class KioskCardConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'This card is already assigned to another employee.',
    );
  }
}
