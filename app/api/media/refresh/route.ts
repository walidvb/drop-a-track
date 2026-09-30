import type { NextRequest } from "next/server";
import { refreshDropStream } from "@/lib/bags";

/** A fresh Bandcamp stream for a drop whose stored one stopped playing. Rate-limited per drop and app-wide. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { dropId?: unknown } | null;
  const dropId = Number(body?.dropId);
  if (!Number.isInteger(dropId)) return Response.json({ error: "Bad request." }, { status: 400 });

  const streamUrl = await refreshDropStream(dropId);
  return streamUrl ? Response.json({ streamUrl }) : Response.json({ error: "No stream right now." }, { status: 503 });
}
