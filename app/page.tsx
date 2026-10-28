import { cookies } from "next/headers";
import { getDropIdsBy } from "@/lib/bags";
import { loadHome } from "@/lib/home";
import { UID_COOKIE, isUid } from "@/lib/uid";
import { pendingDrops } from "@/lib/my-drops";
import { prototypeHome } from "@/lib/prototype-fixtures";
import { Browse } from "./Browse";
import { HomeVariants } from "./prototype/HomeVariants";

/** The poster, and the latest drops from every open bag (no QR codes: dropping still takes a scan of the shirt). */
export default async function Home({ searchParams }: PageProps<"/">) {
  const { variant } = await searchParams;
  // PROTOTYPE: sample data when there's no database, and design variants behind ?variant=.
  if (process.env.PROTOTYPE_FIXTURES) return <HomeVariants variant={String(variant ?? "current")} {...prototypeHome()} pendingDrops={2} />;
  const jar = await cookies(); // per visitor, so never prerendered
  const uid = jar.get(UID_COOKIE)?.value;
  const [home, mine] = await Promise.all([loadHome(), isUid(uid) ? getDropIdsBy(uid) : ([] as string[])]);
  const pending = await pendingDrops(jar.getAll(), home.bags, mine);
  if (variant) return <HomeVariants variant={String(variant)} {...home} mine={mine} pendingDrops={pending.length} />;
  return <Browse {...home} mine={mine} pendingDrops={pending.length} />;
}
