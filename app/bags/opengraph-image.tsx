import { connection } from "next/server";
import { loadHome } from "@/lib/home";
import { allBagsImage } from "@/lib/og";

export { size } from "@/lib/og";
export const alt = "All bags on drop-a-track";
export const contentType = "image/png";

/** One column per open bag; the one with the latest drop in magenta. */
export default async function Image() {
  await connection(); // the bags as they are now, never prerendered
  const { bags, drops } = await loadHome();
  return allBagsImage({ live: drops[0]?.bagNumber ?? null, bags });
}
