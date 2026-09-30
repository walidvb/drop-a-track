import type { NextRequest } from "next/server";
import { READ_ERRORS, readLink } from "@/lib/read-link";
import { ticketCookieName, verifyTicket } from "@/lib/ticket";

/**
 * Reads a pasted link for the "Looks right?" step. Only for browsers holding a
 * scan ticket for the bag: this is the one public way to make the server fetch
 * a Bandcamp page, so it's not open to the world.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { url?: unknown; bagId?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.slice(0, 1000) : "";
  const bagId = Number(body?.bagId);
  if (!url || !Number.isInteger(bagId)) return Response.json({ error: "Bad request." }, { status: 400 });

  if (!(await verifyTicket(request.cookies.get(ticketCookieName(bagId))?.value, bagId))) {
    return Response.json({ error: "Scan the shirt to drop a track." }, { status: 403 });
  }

  const outcome = await readLink(url);
  if (outcome.kind !== "ok") {
    const { status, message } = READ_ERRORS[outcome.kind];
    return Response.json({ error: message }, { status });
  }
  return Response.json({ info: outcome.info });
}
