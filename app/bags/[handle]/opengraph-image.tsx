import { notFound } from "next/navigation";
import { connection } from "next/server";
import { handleFromSlug } from "@/lib/handle";
import { loadHome } from "@/lib/home";
import { bagImage } from "@/lib/og";

export { size } from "@/lib/og";
export const alt = "A bag on drop-a-track";
export const contentType = "image/png";

/** The bag's sticker over a wall of its drops' covers. */
export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  await connection(); // the bag as it is now, never prerendered
  const handle = handleFromSlug((await params).handle);
  const bag = handle ? (await loadHome()).bags.find((b) => b.handle === handle) : undefined;
  if (!bag) notFound();
  return bagImage({ number: bag.number, handle: bag.handle, since: bag.since, covers: bag.tracks.map((t) => t.thumbnail ?? null) });
}
