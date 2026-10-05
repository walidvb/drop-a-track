import { cookies } from "next/headers";
import { getDropIdsBy } from "@/lib/bags";
import { loadHome } from "@/lib/home";
import { UID_COOKIE, isUid } from "@/lib/uid";
import { Browse } from "./Browse";

/** The poster, and the latest drops from every open bag (no QR codes: dropping still takes a scan of the shirt). */
export default async function Home() {
  const uid = (await cookies()).get(UID_COOKIE)?.value; // per visitor, so never prerendered
  const [home, mine] = await Promise.all([loadHome(), isUid(uid) ? getDropIdsBy(uid) : ([] as string[])]);
  return <Browse {...home} mine={mine} />;
}
