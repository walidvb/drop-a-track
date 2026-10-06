/** Signing for the app's own cookies (scan tickets, owner sessions), keyed by TICKET_SECRET. */

const encoder = new TextEncoder();

function secret(): string {
  const s = process.env.TICKET_SECRET;
  if (!s || s.length < 32) throw new Error("TICKET_SECRET must be set (32+ chars)");
  return s;
}

export async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  return Buffer.from(mac).toString("base64url");
}

/** Constant-time string comparison. */
export function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
