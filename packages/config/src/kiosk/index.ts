// Kiosk

export const KIOSK_STATUS_LIST = ["ACTIVE", "INACTIVE"] as const;

export const KIOSK_PASSCODE_LENGTH = 5;

export const KIOSK_SESSION_DURATION = 12 * 60 * 60 * 1000;

export const KIOSK_SESSION_COOKIE = "kiosk_session";

export const KIOSK_PUNCH_ATTEMPT_LIMIT = 30;
export const KIOSK_PUNCH_WINDOW_SECONDS = 5 * 60;

// Maximum Euclidean distance between face descriptors for a match.
// 0.8 is more lenient for better usability in real-world conditions;
// lower is stricter, higher is more lenient.
export const KIOSK_FACE_MATCH_DISTANCE = 0.8;

export const KIOSK_AUTH_ATTEMPT_LIMIT = 10;
export const KIOSK_AUTH_WINDOW_SECONDS = 15 * 60;

export const KIOSK_DEFAULT_PAGE = 1;
export const KIOSK_DEFAULT_PAGE_SIZE = 25;

// Native kiosk terminals (Rona Kiosk app on ZKTeco Android devices)

// How a terminal must verify an employee before a punch is accepted.
// A card alone is never enough.
export const KIOSK_VERIFICATION_POLICY_LIST = [
  "FACE_ONLY",
  "FACE_OR_FINGER",
  "FACE_AND_FINGER",
  "CARD_AND_FACE",
  "CARD_AND_FINGER",
] as const;

export const KIOSK_DEFAULT_VERIFICATION_POLICY = "FACE_OR_FINGER";

export const KIOSK_VERIFICATION_METHOD_LIST = [
  "FACE",
  "FINGER",
  "CARD",
  "PASSCODE",
] as const;

export const KIOSK_ATTESTATION_STATUS_LIST = [
  "NONE",
  "UNVERIFIED",
  "CHAIN_VALID",
] as const;

export const KIOSK_TEMPLATE_KIND_LIST = ["FACE", "FINGER"] as const;

// Templates produced by the simulated engines of the app's dev build.
export const KIOSK_SIM_ALGORITHM_VERSION = "sim-1";

// Request signing: ECDSA P-256 / SHA-256 over
// `${METHOD}\n${PATH_WITH_QUERY}\n${TIMESTAMP_MS}\n${SHA256_HEX(BODY)}`
export const KIOSK_SIGNATURE_HEADER = "x-kiosk-signature";
export const KIOSK_TIMESTAMP_HEADER = "x-kiosk-timestamp";
export const KIOSK_KIOSK_ID_HEADER = "x-kiosk-id";
export const KIOSK_ENROLL_TOKEN_HEADER = "x-kiosk-enroll-token";
export const KIOSK_SIGNATURE_MAX_SKEW_SECONDS = 5 * 60;

export const KIOSK_ENROLL_CODE_LENGTH = 6;
export const KIOSK_ENROLL_CODE_TTL_SECONDS = 10 * 60;
export const KIOSK_ENROLL_SESSION_SECONDS = 15 * 60;

export const KIOSK_ADMIN_PIN_LENGTH = 6;
export const KIOSK_ADMIN_PIN_ATTEMPT_LIMIT = 5;
export const KIOSK_ADMIN_PIN_WINDOW_SECONDS = 15 * 60;

export const KIOSK_PUNCH_BATCH_MAX = 100;
export const KIOSK_OFFLINE_MAX_AGE_HOURS = 72;

// Base64 length of an encoded biometric template (≈ 96 KB raw).
export const KIOSK_TEMPLATE_MAX_BASE64_LENGTH = 131_072;
