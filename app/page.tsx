import { cookies } from "next/headers";
import { getDropIdsBy } from "@/lib/bags";
import { loadHome } from "@/lib/home";
import { UID_COOKIE, isUid } from "@/lib/uid";
import { pendingDrops } from "@/lib/my-drops";
import { Browse } from "./Browse";

/** The poster, and the latest drops from every open bag (no QR codes: dropping still takes a scan of the shirt). */
export default async function Home() {
  const jar = await cookies(); // per visitor, so never prerendered
  const uid = jar.get(UID_COOKIE)?.value;
  const [home, mine] = await Promise.all([loadHome(), isUid(uid) ? getDropIdsBy(uid) : ([] as string[])]);
  const pending = await pendingDrops(jar.getAll(), home.bags, mine);
  return <Browse {...home} mine={mine} pendingDrops={pending.length} />;
}
