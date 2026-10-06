/** Public handles: shown as "mira.k" (never "@mira.k") and used in /mira.k. Set at handover; the owner can rename it from /manage. */
export const HANDLE_PATTERN = /^[a-z0-9._-]{2,30}$/;

/** Paths the app itself owns: a bag there could never be reached. */
const RESERVED = new Set(["admin", "api", "closed", "manage", "my-drops", "s", "favicon.ico"]);

/** A handle as typed: case-insensitive, a stray leading "@" forgiven. */
export function parseHandle(raw: string): string | null {
  const handle = raw.trim().replace(/^@/, "").toLowerCase();
  return HANDLE_PATTERN.test(handle) && !RESERVED.has(handle) ? handle : null;
}

/** The `[slug]` route segment as a handle (old /@handle links included). */
export function handleFromSlug(slug: string): string | null {
  try {
    return parseHandle(decodeURIComponent(slug));
  } catch {
    return null; // a stray "%": not a handle, and a 404 rather than a crash
  }
}

export const bagPath = (handle: string) => `/${handle}`;
