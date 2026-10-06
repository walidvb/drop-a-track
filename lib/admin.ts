import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bags, drops, qrCodes } from "@/db/schema";
import { generateToken } from "./token";

/** Every shirt, with its current bag's theme and drop count. */
export async function listQrCodes() {
  return db
    .select({
      id: qrCodes.id,
      number: qrCodes.number,
      token: qrCodes.token,
      handle: qrCodes.handle,
      /** Whether the owner set a /manage password. */
      claimed: sql<boolean>`${qrCodes.passwordHash} is not null`,
      bagId: qrCodes.currentBagId,
      theme: bags.theme,
      drops: count(drops.id),
    })
    .from(qrCodes)
    .leftJoin(bags, eq(bags.id, qrCodes.currentBagId))
    .leftJoin(drops, eq(drops.bagId, qrCodes.currentBagId))
    .groupBy(qrCodes.id, bags.id)
    .orderBy(asc(qrCodes.number));
}

/** A theme is one short line: longer input is cut, blank clears it. */
export const THEME_MAX = 140;

export async function setBagTheme(bagId: number, theme: string) {
  await db
    .update(bags)
    .set({ theme: theme.trim().slice(0, THEME_MAX) || null })
    .where(eq(bags.id, bagId));
}

/** Everything about a bag's drops, coordinates included — admin only. */
export async function listDrops(bagId: number) {
  return db.select().from(drops).where(eq(drops.bagId, bagId)).orderBy(desc(drops.createdAt));
}

/**
 * One new shirt: a QR code with the next number and its first bag, in one
 * transaction (Neon HTTP batch). Retries on the rare token collision.
 */
export async function createQrCode(): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    const token = generateToken();
    try {
      await db.batch([
        db.insert(qrCodes).values({ token, number: sql`(select coalesce(max(${qrCodes.number}), 0) + 1 from ${qrCodes})` }),
        db.insert(bags).values({ qrCodeId: sql`(select ${qrCodes.id} from ${qrCodes} where ${qrCodes.token} = ${token})`, seq: 1 }),
        db
          .update(qrCodes)
          .set({ currentBagId: sql`(select ${bags.id} from ${bags} where ${bags.qrCodeId} = ${qrCodes.id} and ${bags.seq} = 1)` })
          .where(eq(qrCodes.token, token)),
      ]);
      return;
    } catch (error) {
      if (attempt >= 2) throw error;
    }
  }
}

/** Handles are set here once, at handover. After that only the owner renames it, from /manage. */
export async function assignHandle(qrCodeId: number, handle: string): Promise<"ok" | "taken" | "already-set"> {
  try {
    const updated = await db
      .update(qrCodes)
      .set({ handle })
      .where(sql`${qrCodes.id} = ${qrCodeId} and ${qrCodes.handle} is null`)
      .returning({ id: qrCodes.id });
    return updated.length ? "ok" : "already-set";
  } catch (error) {
    // 23505 = unique violation: another shirt has it. Drizzle wraps the driver's error in `cause`.
    if ((error as { cause?: { code?: string } }).cause?.code === "23505") return "taken";
    throw error;
  }
}

/** Forgotten, or set by the wrong person: the next scan sets a new one, and old sessions end. */
export async function resetOwnerPassword(qrCodeId: number) {
  await db.update(qrCodes).set({ passwordHash: null }).where(eq(qrCodes.id, qrCodeId));
}

export async function deleteDrop(dropId: number) {
  await db.delete(drops).where(eq(drops.id, dropId));
}
