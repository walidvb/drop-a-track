import { notFound, permanentRedirect } from "next/navigation";
import { bagPath, handleFromSlug } from "@/lib/handle";

/** Bags used to live at /mira.k: old links (and /@mira.k) go on to /bags/mira.k. */
export default async function OldBagPage({ params }: PageProps<"/[slug]">) {
  const handle = handleFromSlug((await params).slug);
  if (!handle) notFound();
  permanentRedirect(bagPath(handle));
}
