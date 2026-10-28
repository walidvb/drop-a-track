import type { Metadata } from "next";
import { connection } from "next/server";
import { loadHome } from "@/lib/home";
import { AllBags } from "./AllBags";

export const metadata: Metadata = { title: "All bags · drop-a-track" };

/** Every open bag, one under the other, each playable from here. */
export default async function BagsPage() {
  await connection(); // the bags as they are now, never prerendered
  // PROTOTYPE: sample data when there's no database (pnpm prototype), as on the home page.
  const { bags } = process.env.PROTOTYPE_FIXTURES ? (await import("@/lib/prototype-fixtures")).prototypeHome() : await loadHome();
  return <AllBags bags={bags} />;
}
