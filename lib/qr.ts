/**
 * The URL a shirt's QR encodes. All uppercase: QR's alphanumeric mode only
 * covers A–Z/0–9 and a few symbols, and it makes the code a size smaller
 * (next.config.ts rewrites /S/ back to the scan route).
 */
export const qrUrl = (base: string, token: string) => `${base.replace(/\/$/, "")}/S/${token}`.toUpperCase();
