/**
 * The shirt owner's way into /manage: a password they set on the first scan,
 * then a signed session cookie. No accounts: the shirt number is the username.
 */
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { equal, sign } from "./hmac";

export const PASSWORD_MIN = 8;
/** Long enough for any passphrase, short enough not to hash megabytes. */
export const PASSWORD_MAX = 200;

export const OWNER_COOKIE = "dat_owner";
export const OWNER_SESSION_SECONDS = 30 * 24 * 60 * 60;

/** OWASP's scrypt settings (N=2^15, r=8, p=3): 32 MiB a hash, so maxmem is raised past Node's default. */
const COST = { ln: 15, r: 8, p: 3 };
const KEY_LEN = 32;
const PARAMS = /^ln=(\d+),r=(\d+),p=(\d+)$/;

function derive(password: string, salt: Buffer, ln: number, r: number, p: number): Promise<Buffer> {
  const options: ScryptOptions = { N: 2 ** ln, r, p, maxmem: 256 * 2 ** ln * r };
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LEN, options, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

/** A PHC-style string: `$scrypt$ln=15,r=8,p=3$<salt>$<key>`, base64url. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST.ln, COST.r, COST.p);
  return `$scrypt$ln=${COST.ln},r=${COST.r},p=${COST.p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [empty, scheme, params, salt, key, ...rest] = stored.split("$");
  const cost = params?.match(PARAMS);
  if (empty !== "" || scheme !== "scrypt" || !cost || !salt || !key || rest.length) return false;
  const expected = Buffer.from(key, "base64url");
  const actual = await derive(password, Buffer.from(salt, "base64url"), Number(cost[1]), Number(cost[2]), Number(cost[3]));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * `owner.<shirt id>.<expiry>.<mac>`. The mac also covers the password hash, so a
 * new password (an admin reset) ends every session made with the old one.
 */
export async function issueOwnerSession(qrCodeId: number, passwordHash: string, now = Date.now()): Promise<string> {
  const payload = `owner.${qrCodeId}.${Math.floor(now / 1000) + OWNER_SESSION_SECONDS}`;
  return `${payload}.${await sign(`${payload}.${passwordHash}`)}`;
}

/** Which shirt a session cookie says it's for. Unchecked: verify it against that shirt's hash. */
export function ownerSessionShirt(value: string | undefined): number | null {
  const [kind, id] = value?.split(".") ?? [];
  const n = Number(id);
  return kind === "owner" && Number.isInteger(n) && n > 0 ? n : null;
}

/** True when `value` is an unexpired session for this shirt, made with its current password. */
export async function verifyOwnerSession(
  value: string | undefined,
  qrCodeId: number,
  passwordHash: string | null,
  now = Date.now(),
): Promise<boolean> {
  if (!value || !passwordHash) return false;
  const [kind, id, exp, mac, ...rest] = value.split(".");
  if (kind !== "owner" || rest.length || !id || !exp || !mac) return false;
  if (Number(id) !== qrCodeId || Number(exp) * 1000 <= now) return false;
  return equal(mac, await sign(`owner.${id}.${exp}.${passwordHash}`));
}
