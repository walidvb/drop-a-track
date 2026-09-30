/**
 * The dropper id: a random id per browser, in localStorage (`dat-uid`) and
 * mirrored in a long-lived cookie, so clearing just one doesn't buy another
 * drop. Best effort by design — no accounts.
 */
export const UID_COOKIE = "dat_uid";
export const UID_STORAGE_KEY = "dat-uid";
/** Browsers cap cookie lifetime at 400 days. */
export const UID_MAX_AGE = 400 * 24 * 60 * 60;

const UID_PATTERN = /^[0-9a-f-]{36}$/;

export const newUid = () => crypto.randomUUID();
export const isUid = (v: unknown): v is string => typeof v === "string" && UID_PATTERN.test(v);
