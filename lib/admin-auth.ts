/** Checks an `Authorization: Basic …` header against ADMIN_USER / ADMIN_PASSWORD. Closed when unset. */
export function isAdminAuthorization(header: string | null): boolean {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password || !header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const expected = `${user}:${password}`;
  // Constant-time comparison.
  if (decoded.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= decoded.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
