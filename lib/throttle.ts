import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Claims `key` if nobody (in any serverless instance) claimed it in the last
 * `intervalMs`. One atomic statement: the upsert only updates — and only
 * returns a row — when the previous claim is old enough.
 */
export async function claim(key: string, intervalMs: number): Promise<boolean> {
  const result = await db.execute(sql`
    INSERT INTO throttles (key, last_at) VALUES (${key}, now())
    ON CONFLICT (key) DO UPDATE SET last_at = now()
    WHERE throttles.last_at < now() - make_interval(secs => ${intervalMs / 1000}::double precision)
    RETURNING key`);
  return result.rows.length > 0;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Waits (polling) for a claim, giving up after `maxWaitMs`. */
export async function waitForClaim(key: string, intervalMs: number, maxWaitMs: number): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    if (await claim(key, intervalMs)) return true;
    const pause = intervalMs / 2 + Math.random() * 250;
    if (Date.now() + pause > deadline) return false;
    await sleep(pause);
  }
}

/**
 * Bandcamp fails requests spaced closer than ~2s (bandcamp-digger BANDCAMP.md),
 * and a flagged IP would break every app on it. At most one page fetch per 2s,
 * app-wide — local dev included, since it shares the database.
 */
export const bandcampThrottle = () => waitForClaim("bandcamp", 2000, 6000);
