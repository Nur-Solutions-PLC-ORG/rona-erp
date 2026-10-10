import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  randomBytes,
  verify,
  X509Certificate,
} from 'node:crypto';
import type {
  KioskAttestationStatus,
  KioskVerificationMethod,
  KioskVerificationPolicy,
} from '@rona/types/kiosk';

// Pure helpers for native kiosk terminals (Rona Kiosk app).

export function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * The exact string a terminal signs (ECDSA P-256 / SHA-256, DER, base64):
 * `${METHOD}\n${PATH_WITH_QUERY}\n${TIMESTAMP_MS}\n${SHA256_HEX(BODY)}`
 */
export function kioskSigningPayload(
  method: string,
  pathWithQuery: string,
  timestamp: string,
  rawBody: Buffer | string | undefined,
): string {
  return [
    method.toUpperCase(),
    pathWithQuery,
    timestamp,
    sha256Hex(rawBody ?? ''),
  ].join('\n');
}

/** Verifies a DER ECDSA signature against a base64 SPKI DER public key. */
export function verifyKioskSignature(
  publicKeyBase64: string,
  payload: string,
  signatureBase64: string,
): boolean {
  try {
    return verify(
      'sha256',
      Buffer.from(payload),
      {
        key: Buffer.from(publicKeyBase64, 'base64'),
        format: 'der',
        type: 'spki',
      },
      Buffer.from(signatureBase64, 'base64'),
    );
  } catch {
    return false;
  }
}

/** Returns true when the base64 string is an SPKI DER EC public key. */
export function isValidEcPublicKey(publicKeyBase64: string): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.from(publicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki',
    });
    return key.asymmetricKeyType === 'ec';
  } catch {
    return false;
  }
}

/**
 * SHA-256 fingerprints (as printed by X509Certificate#fingerprint256) of the
 * Google hardware attestation roots.
 * TODO: fill from https://developer.android.com/privacy-and-security/security-key-attestation#root_certificate
 * before relying on attestation; while empty, CHAIN_VALID only means the chain
 * is internally consistent and certifies the submitted key.
 */
export const KIOSK_ATTESTATION_PINNED_ROOT_FINGERPRINTS: readonly string[] = [];

/**
 * Checks an Android Key Attestation chain (leaf first, DER base64): every
 * certificate must be issued and signed by the next one, the last must be
 * self-signed, and the leaf must certify the submitted public key.
 */
export function evaluateAttestationChain(
  chain: readonly string[],
  publicKeyBase64: string,
  pinnedRoots: readonly string[] = KIOSK_ATTESTATION_PINNED_ROOT_FINGERPRINTS,
): KioskAttestationStatus {
  if (chain.length === 0) return 'NONE';
  try {
    const certs = chain.map(
      (encoded) => new X509Certificate(Buffer.from(encoded, 'base64')),
    );
    for (let i = 0; i < certs.length - 1; i += 1) {
      if (!certs[i].checkIssued(certs[i + 1])) return 'UNVERIFIED';
      if (!certs[i].verify(certs[i + 1].publicKey)) return 'UNVERIFIED';
    }
    const root = certs[certs.length - 1];
    if (!root.verify(root.publicKey)) return 'UNVERIFIED';
    if (pinnedRoots.length > 0 && !pinnedRoots.includes(root.fingerprint256)) {
      return 'UNVERIFIED';
    }

    const leafKey = certs[0].publicKey.export({ type: 'spki', format: 'der' });
    if (!leafKey.equals(Buffer.from(publicKeyBase64, 'base64'))) {
      return 'UNVERIFIED';
    }
    return 'CHAIN_VALID';
  } catch {
    return 'UNVERIFIED';
  }
}

/**
 * Whether the verification methods used on the terminal satisfy the kiosk's
 * policy. A card alone never does, and PASSCODE never counts on terminals.
 */
export function satisfiesVerificationPolicy(
  policy: KioskVerificationPolicy,
  methods: readonly KioskVerificationMethod[],
): boolean {
  const used = new Set(methods);
  const face = used.has('FACE');
  const finger = used.has('FINGER');
  const card = used.has('CARD');

  switch (policy) {
    case 'FACE_ONLY':
      return face;
    case 'FACE_OR_FINGER':
      return face || finger;
    case 'FACE_AND_FINGER':
      return face && finger;
    case 'CARD_AND_FACE':
      return card && face;
    case 'CARD_AND_FINGER':
      return card && finger;
    default:
      return false;
  }
}

/** sha256 hex of `${organizationId}:${UID_UPPERCASE_HEX}` (also computed on terminals). */
export function cardUidHash(organizationId: string, uid: string): string {
  return sha256Hex(`${organizationId}:${uid.toUpperCase()}`);
}

const TEMPLATE_CIPHER_VERSION = 'v1';

/** AES-256-GCM: `v1.<base64(iv | tag | ciphertext)>`. */
export function encryptTemplate(key: Buffer, templateBase64: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(templateBase64, 'base64')),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${TEMPLATE_CIPHER_VERSION}.${Buffer.concat([iv, tag, ciphertext]).toString('base64')}`;
}

export function decryptTemplate(key: Buffer, stored: string): string {
  const [version, encoded] = stored.split('.', 2);
  if (version !== TEMPLATE_CIPHER_VERSION || !encoded) {
    throw new Error('Unsupported template ciphertext');
  }
  const data = Buffer.from(encoded, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([
    decipher.update(data.subarray(28)),
    decipher.final(),
  ]).toString('base64');
}
