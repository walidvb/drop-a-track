import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getBagByHandle, getDropIdsBy } from "@/lib/bags";
import { monthYear } from "@/lib/format";
import { bagPath, handleFromSlug } from "@/lib/handle";
import { loadHome } from "@/lib/home";
import { UID_COOKIE, isUid } from "@/lib/uid";
import { pendingDrops } from "@/lib/my-drops";
import { Browse } from "../Browse";
import { BagApp } from "./BagApp";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const handle = handleFromSlug((await params).slug);
  return { title: handle ? `${handle}’s bag · drop-a-track` : "drop-a-track" };
}

/**
 * A shirt's current bag. With a fresh scan (a ticket cookie) and no drop yet, a pending drop: the
 * drop flow. Otherwise it's the home page with this bag open in its column, as when opened from there.
 */
export default async function BagPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const handle = handleFromSlug(slug);
  if (!handle) notFound();
  if (slug !== handle) redirect(bagPath(handle)); // /@mira.k, /Mira.K → /mira.k
  const bag = await getBagByHandle(handle);
  if (!bag) notFound();

  const jar = await cookies();
  const uid = jar.get(UID_COOKIE)?.value;
  const [home, mine] = await Promise.all([loadHome(), isUid(uid) ? getDropIdsBy(uid) : ([] as string[])]);
  const pending = await pendingDrops(jar.getAll(), home.bags, mine);
  if (!pending.some((o) => o.handle === bag.handle)) return <Browse {...home} initialView={bag.handle} mine={mine} pendingDrops={pending.length} />;

  return (
    <BagApp
      owner={{ handle: bag.handle, number: bag.number, since: monthYear(bag.bagCreatedAt), theme: bag.theme }}
      bagId={bag.bagId}
      home={home}
      mine={mine}
      stillPending={pending.filter((o) => o.handle !== bag.handle).map((o) => o.handle)}
      cookieUid={isUid(uid) ? uid : null}
    />
  );
}
