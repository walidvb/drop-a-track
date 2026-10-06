/**
 * Scan tickets: proof that this browser scanned a shirt recently, which is
 * what lets it drop. A signed, httpOnly cookie per bag — the bag page itself is
 * public, so the ticket (not the URL) is the permission.
 */
import { equal, sign } from "./hmac";

/** How long after a scan you can still drop. One constant: still being tuned. */
export const TICKET_TTL_SECONDS = 24 * 60 * 60;

export const ticketCookieName = (bagId: number) => `dat_t_${bagId}`;

export async function issueTicket(bagId: number, now = Date.now()): Promise<string> {
  const payload = `${bagId}.${Math.floor(now / 1000) + TICKET_TTL_SECONDS}`;
  return `${payload}.${await sign(payload)}`;
}

/** True when `value` is an unexpired ticket for exactly this bag. */
export async function verifyTicket(value: string | undefined, bagId: number, now = Date.now()): Promise<boolean> {
  if (!value) return false;
  const [id, exp, mac, ...rest] = value.split(".");
  if (rest.length || !id || !exp || !mac) return false;
  if (Number(id) !== bagId || Number(exp) * 1000 <= now) return false;
  return equal(mac, await sign(`${id}.${exp}`));
}
