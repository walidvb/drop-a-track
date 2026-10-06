import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { OWNER_COOKIE, ownerSessionShirt, verifyOwnerSession } from "./owner-auth";

const shirt = {
  qrCodeId: qrCodes.id,
  number: qrCodes.number,
  handle: qrCodes.handle,
  bagId: qrCodes.currentBagId,
  passwordHash: qrCodes.passwordHash,
};

export async function getShirtByNumber(number: number) {
  const [row] = await db.select(shirt).from(qrCodes).where(eq(qrCodes.number, number)).limit(1);
  return row ?? null;
}

/** The shirt this browser is logged in to /manage as, if any. */
export async function getOwner() {
  const value = (await cookies()).get(OWNER_COOKIE)?.value;
  const id = ownerSessionShirt(value);
  if (!id) return null;
  const [row] = await db.select(shirt).from(qrCodes).where(eq(qrCodes.id, id)).limit(1);
  return row?.handle && (await verifyOwnerSession(value, row.qrCodeId, row.passwordHash)) ? { ...row, handle: row.handle } : null;
}

/** Shirt numbers as people type them: 14, 014, #014. */
export function parseShirtNumber(raw: string): number | null {
  const n = Number(raw.trim().replace(/^#/, ""));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** The first scan's password. Set once: false when someone already has (an admin reset clears it). */
export async function setOwnerPassword(qrCodeId: number, passwordHash: string): Promise<boolean> {
  const updated = await db
    .update(qrCodes)
    .set({ passwordHash })
    .where(and(eq(qrCodes.id, qrCodeId), isNull(qrCodes.passwordHash)))
    .returning({ id: qrCodes.id });
  return updated.length > 0;
}

/** The owner's rename. The bag moves to /<new handle>; the QR keeps working. */
export async function renameShirt(qrCodeId: number, handle: string): Promise<"ok" | "taken"> {
  try {
    await db.update(qrCodes).set({ handle }).where(eq(qrCodes.id, qrCodeId));
    return "ok";
  } catch (error) {
    // 23505 = unique violation: another shirt has it. Drizzle wraps the driver's error in `cause`.
    if ((error as { cause?: { code?: string } }).cause?.code === "23505") return "taken";
    throw error;
  }
}
