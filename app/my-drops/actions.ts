"use server";

import { cookies } from "next/headers";
import { loadMyDrops } from "@/lib/my-drops";
import { UID_COOKIE, isUid } from "@/lib/uid";

/** This browser's pending and past drops: by its scan tickets, and its uid cookie plus, when given, its localStorage uid. */
export async function myDrops(localUid: string | null) {
  const jar = await cookies();
  const uids = [...new Set([jar.get(UID_COOKIE)?.value, localUid].filter(isUid))];
  return loadMyDrops(jar.getAll(), uids);
}
