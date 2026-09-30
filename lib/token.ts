/**
 * QR tokens: 6 chars from a 32-symbol alphabet with no look-alikes (no 0/O,
 * 1/I). 32^6 ≈ 1.07 billion — unguessable for a few hundred shirts, and short
 * enough to keep the printed QR small. Uppercase-only so the whole QR URL can
 * be encoded in the QR's compact alphanumeric mode.
 */
export const TOKEN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const TOKEN_LENGTH = 6;

export function generateToken(): string {
  // 256 is a multiple of 32, so `byte % 32` is unbiased.
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH));
  return Array.from(bytes, (b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]).join("");
}

/** A token as scanned: case-insensitive, and null if it can't be one of ours. */
export function parseToken(raw: string): string | null {
  const token = raw.trim().toUpperCase();
  return token.length === TOKEN_LENGTH && [...token].every((c) => TOKEN_ALPHABET.includes(c)) ? token : null;
}
