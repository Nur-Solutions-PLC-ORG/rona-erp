import { Injectable, Logger } from '@nestjs/common';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { pooledDb } from '@/db';
import { webAuthnConfigProvider } from '@/configs/webauthn';
import { AuditService } from '@/modules/audit/audit.service';
import {
  WebAuthnChallengeInvalidException,
  WebAuthnCredentialAlreadyExistsException,
  WebAuthnCredentialNotFoundException,
  WebAuthnVerificationFailedException,
} from './kiosk.exception';
import { WebAuthnChallengeStore } from './webauthn-challenge.store';
import {
  WebAuthnCredentialRepository,
  type WebAuthnCredentialRecord,
} from './webauthn.repository';

export interface WebAuthnRegistrationChallengeResult {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}

export interface WebAuthnRegisteredCredential {
  credentialId: string;
  deviceType: string;
  counter: number;
  employeeId: string;
}

export interface WebAuthnAuthenticationChallengeResult {
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}

export interface WebAuthnAuthenticatedSession {
  employeeId: string;
  credentialId: string;
  newCounter: number;
}

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name);

  private readonly rpId: string;
  private readonly rpName: string;
  private readonly origins: string[];

  constructor(
    private readonly credentialRepository: WebAuthnCredentialRepository,
    private readonly challengeStore: WebAuthnChallengeStore,
    private readonly auditService: AuditService,
  ) {
    const config = webAuthnConfigProvider();
    this.rpId = config.rpId;
    this.rpName = config.rpName;
    this.origins = config.origins;
  }

  async createRegistrationChallenge(input: {
    organizationId: string;
    employeeId: string;
    employeeName?: string;
  }): Promise<WebAuthnRegistrationChallengeResult> {
    const existing = await this.credentialRepository.listActiveCredentialIds(
      input.organizationId,
      input.employeeId,
    );
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userName: input.employeeName ?? input.employeeId,
      userID: new TextEncoder().encode(input.employeeId),
      attestationType: 'none',
      excludeCredentials: existing.map(({ credentialId }) => ({
        id: credentialId,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    await this.challengeStore.issue(options.challenge, {
      purpose: 'registration',
      organizationId: input.organizationId,
      employeeId: input.employeeId,
    });

    return { challengeId: options.challenge, options };
  }

  async verifyRegistration(input: {
    organizationId: string;
    employeeId: string;
    challenge: string;
    response: RegistrationResponseJSON;
  }): Promise<WebAuthnRegisteredCredential> {
    const challenge = await this.challengeStore.consume(input.challenge);
    if (
      !challenge ||
      challenge.purpose !== 'registration' ||
      challenge.organizationId !== input.organizationId ||
      challenge.employeeId !== input.employeeId
    ) {
      throw new WebAuthnChallengeInvalidException();
    }

    let registrationInfo: Awaited<
      ReturnType<typeof verifyRegistrationResponse>
    >['registrationInfo'];
    try {
      const verification = await verifyRegistrationResponse({
        response: input.response,
        expectedChallenge: input.challenge,
        expectedOrigin: this.origins,
        expectedRPID: this.rpId,
      });
      if (!verification.verified || !verification.registrationInfo) {
        throw new WebAuthnVerificationFailedException();
      }
      registrationInfo = verification.registrationInfo;
    } catch (error) {
      if (error instanceof WebAuthnVerificationFailedException) throw error;
      this.logger.warn(
        `WebAuthn registration verification failed: ${this.errorMessage(error)}`,
      );
      throw new WebAuthnVerificationFailedException();
    }

    const { credential, credentialDeviceType } = registrationInfo;

    const created = await pooledDb.transaction(async (tx) => {
      let row: WebAuthnCredentialRecord;
      try {
        row = await this.credentialRepository.insert(
          {
            organizationId: input.organizationId,
            employeeId: input.employeeId,
            credentialId: credential.id,
            publicKey: this.encodePublicKey(credential.publicKey),
            counter: credential.counter,
            deviceType: credentialDeviceType,
          },
          tx,
        );
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          throw new WebAuthnCredentialAlreadyExistsException();
        }
        throw error;
      }
      await this.auditService.record(
        {
          organizationId: input.organizationId,
          action: 'kiosk.webauthn.register',
          entityType: 'employee_webauthn_credential',
          entityId: row.id,
          after: { employeeId: input.employeeId },
        },
        tx,
      );
      return row;
    });

    return {
      credentialId: credential.id,
      deviceType: credentialDeviceType,
      counter: created.counter,
      employeeId: created.employeeId,
    };
  }

  async createAuthenticationChallenge(input: {
    organizationId: string;
  }): Promise<WebAuthnAuthenticationChallengeResult> {
    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials: [],
      userVerification: 'required',
    });

    await this.challengeStore.issue(options.challenge, {
      purpose: 'authentication',
      organizationId: input.organizationId,
    });

    return { challengeId: options.challenge, options };
  }

  async verifyAuthentication(input: {
    organizationId: string;
    challenge: string;
    response: AuthenticationResponseJSON;
  }): Promise<WebAuthnAuthenticatedSession> {
    const challenge = await this.challengeStore.consume(input.challenge);
    if (
      !challenge ||
      challenge.purpose !== 'authentication' ||
      challenge.organizationId !== input.organizationId
    ) {
      throw new WebAuthnChallengeInvalidException();
    }

    const credential = await this.credentialRepository.findActiveByCredentialId(
      input.organizationId,
      input.response.id,
    );
    if (!credential) {
      throw new WebAuthnCredentialNotFoundException();
    }

    let authenticationInfo: Awaited<
      ReturnType<typeof verifyAuthenticationResponse>
    >['authenticationInfo'];
    try {
      const verification = await verifyAuthenticationResponse({
        response: input.response,
        expectedChallenge: input.challenge,
        expectedOrigin: this.origins,
        expectedRPID: this.rpId,
        credential: {
          id: credential.credentialId,
          publicKey: this.decodePublicKey(credential.publicKey),
          counter: credential.counter,
        },
      });
      if (!verification.verified) {
        throw new WebAuthnVerificationFailedException();
      }
      authenticationInfo = verification.authenticationInfo;
      if (authenticationInfo.userVerified !== true) {
        throw new WebAuthnVerificationFailedException();
      }
    } catch (error) {
      if (error instanceof WebAuthnVerificationFailedException) throw error;
      this.logger.warn(
        `WebAuthn authentication verification failed: ${this.errorMessage(error)}`,
      );
      throw new WebAuthnVerificationFailedException();
    }

    await this.credentialRepository.updateCounter(
      input.organizationId,
      authenticationInfo.credentialID,
      authenticationInfo.newCounter,
    );

    try {
      await this.auditService.record({
        organizationId: input.organizationId,
        action: 'kiosk.webauthn.authenticate',
        entityType: 'employee_webauthn_credential',
        entityId: credential.id,
        after: { employeeId: credential.employeeId },
      });
    } catch (error) {
      this.logger.warn(
        `WebAuthn authentication audit failed: ${String(error)}`,
      );
    }

    return {
      employeeId: credential.employeeId,
      credentialId: authenticationInfo.credentialID,
      newCounter: authenticationInfo.newCounter,
    };
  }

  private encodePublicKey(publicKey: Uint8Array): string {
    return Buffer.from(publicKey).toString('base64url');
  }

  private decodePublicKey(publicKey: string): Uint8Array<ArrayBuffer> {
    return Buffer.from(publicKey, 'base64url');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (error as { code?: string } | null)?.code === '23505';
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error';
  }
}
