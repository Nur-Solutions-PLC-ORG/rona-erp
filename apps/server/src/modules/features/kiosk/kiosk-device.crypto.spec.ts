import {
  generateKeyPairSync,
  randomBytes,
  sign,
  X509Certificate,
} from 'node:crypto';
import type {
  KioskVerificationMethod,
  KioskVerificationPolicy,
} from '@rona/types/kiosk';
import {
  cardUidHash,
  decryptTemplate,
  encryptTemplate,
  evaluateAttestationChain,
  isValidEcPublicKey,
  kioskSigningPayload,
  satisfiesVerificationPolicy,
  sha256Hex,
  verifyKioskSignature,
} from './kiosk-device.crypto';
import { resolveTemplateKey } from './kiosk-credentials.service';
import {
  TEST_ATTESTATION_LEAF_CERT,
  TEST_ATTESTATION_ROOT_CERT,
} from './kiosk-attestation.spec-harness';

function deviceKey() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });
  return {
    publicKey: publicKey
      .export({ type: 'spki', format: 'der' })
      .toString('base64'),
    sign: (payload: string) =>
      sign('sha256', Buffer.from(payload), privateKey).toString('base64'),
  };
}

function leafPublicKey(): string {
  return new X509Certificate(
    Buffer.from(TEST_ATTESTATION_LEAF_CERT, 'base64'),
  ).publicKey
    .export({ type: 'spki', format: 'der' })
    .toString('base64');
}

describe('satisfiesVerificationPolicy', () => {
  const cases: [KioskVerificationPolicy, KioskVerificationMethod[], boolean][] =
    [
      ['FACE_ONLY', ['FACE'], true],
      ['FACE_ONLY', ['FINGER'], false],
      ['FACE_OR_FINGER', ['FACE'], true],
      ['FACE_OR_FINGER', ['FINGER'], true],
      ['FACE_OR_FINGER', ['CARD'], false],
      ['FACE_AND_FINGER', ['FACE'], false],
      ['FACE_AND_FINGER', ['FACE', 'FINGER'], true],
      ['CARD_AND_FACE', ['CARD'], false],
      ['CARD_AND_FACE', ['FACE'], false],
      ['CARD_AND_FACE', ['CARD', 'FACE'], true],
      ['CARD_AND_FINGER', ['CARD', 'FINGER'], true],
      ['CARD_AND_FINGER', ['CARD', 'FACE'], false],
      ['FACE_ONLY', ['PASSCODE'], false],
      ['FACE_OR_FINGER', ['PASSCODE', 'CARD'], false],
    ];

  it.each(cases)('%s with %j → %s', (policy, methods, expected) => {
    expect(satisfiesVerificationPolicy(policy, methods)).toBe(expected);
  });

  it('never accepts a card alone under any policy', () => {
    const policies: KioskVerificationPolicy[] = [
      'FACE_ONLY',
      'FACE_OR_FINGER',
      'FACE_AND_FINGER',
      'CARD_AND_FACE',
      'CARD_AND_FINGER',
    ];
    for (const policy of policies) {
      expect(satisfiesVerificationPolicy(policy, ['CARD'])).toBe(false);
    }
  });
});

describe('request signatures', () => {
  it('builds the canonical payload with the body hash', () => {
    expect(
      kioskSigningPayload(
        'post',
        '/api/kiosk/device/punch',
        '1700000000000',
        '{"a":1}',
      ),
    ).toBe(
      `POST\n/api/kiosk/device/punch\n1700000000000\n${sha256Hex('{"a":1}')}`,
    );
    expect(kioskSigningPayload('GET', '/x', '1', undefined)).toBe(
      `GET\n/x\n1\n${sha256Hex('')}`,
    );
  });

  it('verifies a DER ECDSA signature from the device key', () => {
    const key = deviceKey();
    const payload = kioskSigningPayload(
      'GET',
      '/api/kiosk/device/roster',
      '1',
      undefined,
    );
    expect(
      verifyKioskSignature(key.publicKey, payload, key.sign(payload)),
    ).toBe(true);
  });

  it('rejects a signature over a different payload or from another key', () => {
    const key = deviceKey();
    const other = deviceKey();
    const payload = 'GET\n/a\n1\nx';
    expect(
      verifyKioskSignature(key.publicKey, 'GET\n/b\n1\nx', key.sign(payload)),
    ).toBe(false);
    expect(
      verifyKioskSignature(key.publicKey, payload, other.sign(payload)),
    ).toBe(false);
    expect(verifyKioskSignature(key.publicKey, payload, 'not-base64!')).toBe(
      false,
    );
  });

  it('accepts only EC SPKI public keys', () => {
    expect(isValidEcPublicKey(deviceKey().publicKey)).toBe(true);
    const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 })
      .publicKey.export({ type: 'spki', format: 'der' })
      .toString('base64');
    expect(isValidEcPublicKey(rsa)).toBe(false);
    expect(isValidEcPublicKey('AAAA')).toBe(false);
  });
});

describe('evaluateAttestationChain', () => {
  it('returns NONE without a chain', () => {
    expect(evaluateAttestationChain([], deviceKey().publicKey)).toBe('NONE');
  });

  it('returns CHAIN_VALID when the chain is consistent and certifies the key', () => {
    expect(
      evaluateAttestationChain(
        [TEST_ATTESTATION_LEAF_CERT, TEST_ATTESTATION_ROOT_CERT],
        leafPublicKey(),
      ),
    ).toBe('CHAIN_VALID');
  });

  it('returns UNVERIFIED when the leaf does not certify the submitted key', () => {
    expect(
      evaluateAttestationChain(
        [TEST_ATTESTATION_LEAF_CERT, TEST_ATTESTATION_ROOT_CERT],
        deviceKey().publicKey,
      ),
    ).toBe('UNVERIFIED');
  });

  it('returns UNVERIFIED for a broken order, a garbage cert or an unpinned root', () => {
    const key = leafPublicKey();
    expect(
      evaluateAttestationChain(
        [TEST_ATTESTATION_ROOT_CERT, TEST_ATTESTATION_LEAF_CERT],
        key,
      ),
    ).toBe('UNVERIFIED');
    expect(evaluateAttestationChain(['AAAA'], key)).toBe('UNVERIFIED');
    expect(
      evaluateAttestationChain(
        [TEST_ATTESTATION_LEAF_CERT, TEST_ATTESTATION_ROOT_CERT],
        key,
        ['00:11'],
      ),
    ).toBe('UNVERIFIED');
  });
});

describe('templates and cards', () => {
  it('round-trips templates through AES-256-GCM without storing plaintext', () => {
    const key = randomBytes(32);
    const template = randomBytes(512).toString('base64');
    const stored = encryptTemplate(key, template);
    expect(stored.startsWith('v1.')).toBe(true);
    expect(stored).not.toContain(template.slice(0, 32));
    expect(decryptTemplate(key, stored)).toBe(template);
  });

  it('fails to decrypt with another key or tampered data', () => {
    const stored = encryptTemplate(randomBytes(32), 'AAAA');
    expect(() => decryptTemplate(randomBytes(32), stored)).toThrow();
    expect(() => decryptTemplate(randomBytes(32), 'v2.AAAA')).toThrow();
  });

  it('hashes card UIDs per organization, case-insensitively', () => {
    expect(cardUidHash('org-1', 'a1b2c3d4')).toBe(sha256Hex('org-1:A1B2C3D4'));
    expect(cardUidHash('org-1', 'A1B2C3D4')).not.toBe(
      cardUidHash('org-2', 'A1B2C3D4'),
    );
  });

  it('resolves the template key from env, or derives one outside production', () => {
    const configured = randomBytes(32);
    expect(
      resolveTemplateKey({
        KIOSK_TEMPLATE_ENCRYPTION_KEY: configured.toString('base64'),
      }),
    ).toEqual(configured);
    expect(() =>
      resolveTemplateKey({ KIOSK_TEMPLATE_ENCRYPTION_KEY: 'c2hvcnQ=' }),
    ).toThrow();
    expect(() => resolveTemplateKey({ NODE_ENV: 'production' })).toThrow();

    const warn = jest.fn();
    const derived = resolveTemplateKey(
      { NODE_ENV: 'development', JWT_SECRET: 's' },
      warn,
    );
    expect(derived).toHaveLength(32);
    expect(warn).toHaveBeenCalled();
  });
});
