/**
 * Scan tickets: proof that this browser scanned a shirt, which is what lets it
 * drop. A signed, httpOnly cookie per bag — the bag page itself is public, so
 * the ticket (not the URL) is the permission. A ticket keeps until it's spent
 * on a drop (or the browser drops the cookie).
 */
import { equal, sign } from "./hmac";

/** The cookie lives as long as browsers allow (400 days). */
export const TICKET_MAX_AGE = 400 * 24 * 60 * 60;
/** Setting an unclaimed shirt's password takes a scan from the last day, not any old one. */
export const CLAIM_WINDOW_SECONDS = 24 * 60 * 60;

const TICKET_PREFIX = "dat_t_";
export const ticketCookieName = (bagId: number) => `${TICKET_PREFIX}${bagId}`;

export async function issueTicket(bagId: number, now = Date.now()): Promise<string> {
  const payload = `${bagId}.${Math.floor(now / 1000)}`;
  return `${payload}.${await sign(payload)}`;
}

/** The bag an untampered ticket opens, and when it was scanned. */
export async function readTicket(value: string | undefined): Promise<{ bagId: number; scannedAt: Date } | null> {
  if (!value) return null;
  const [id, at, mac, ...rest] = value.split(".");
  if (rest.length || !id || !at || !mac) return null;
  if (!equal(mac, await sign(`${id}.${at}`))) return null;
  return { bagId: Number(id), scannedAt: new Date(Number(at) * 1000) };
}

/** True when `value` is a ticket for exactly this bag. */
export async function verifyTicket(value: string | undefined, bagId: number): Promise<boolean> {
  return (await readTicket(value))?.bagId === bagId;
}

/** A ticket for this bag from a scan within the claim window. */
export async function verifyFreshTicket(value: string | undefined, bagId: number, now = Date.now()): Promise<boolean> {
  const t = await readTicket(value);
  return t?.bagId === bagId && now - t.scannedAt.getTime() < CLAIM_WINDOW_SECONDS * 1000;
}

/** Every valid ticket among this browser's cookies: the bags it can still drop into. */
export async function readTickets(cookies: { name: string; value: string }[]) {
  const tickets = await Promise.all(
    cookies
      .filter((c) => c.name.startsWith(TICKET_PREFIX))
      .map(async (c) => {
        const t = await readTicket(c.value);
        return t && ticketCookieName(t.bagId) === c.name ? t : null;
      }),
  );
  return tickets.filter((t) => t !== null);
}
