// Kiosk

export const KIOSK_STATUS_LIST = ["ACTIVE", "INACTIVE"] as const;

export const KIOSK_PASSCODE_LENGTH = 5;

export const KIOSK_SESSION_DURATION = 12 * 60 * 60 * 1000;

export const KIOSK_SESSION_COOKIE = "kiosk_session";

export const KIOSK_PUNCH_ATTEMPT_LIMIT = 30;
export const KIOSK_PUNCH_WINDOW_SECONDS = 5 * 60;

export const KIOSK_AUTH_ATTEMPT_LIMIT = 10;
export const KIOSK_AUTH_WINDOW_SECONDS = 15 * 60;

export const KIOSK_DEFAULT_PAGE = 1;
export const KIOSK_DEFAULT_PAGE_SIZE = 25;
