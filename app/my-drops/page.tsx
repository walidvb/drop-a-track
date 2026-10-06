import type { Metadata } from "next";
import { cookies } from "next/headers";
import { UID_COOKIE, isUid } from "@/lib/uid";
import { myDrops } from "./actions";
import { MyDrops } from "./MyDrops";

export const metadata: Metadata = { title: "Your drops · drop-a-track" };

/** Your drops: the bags this phone scanned and can still drop into, then the drops it made. */
export default async function MyDropsPage() {
  const uid = (await cookies()).get(UID_COOKIE)?.value; // per visitor, so never prerendered
  return <MyDrops initial={await myDrops(null)} cookieUid={isUid(uid) ? uid : null} />;
}
