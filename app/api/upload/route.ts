import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextRequest } from "next/server";
import { AUDIO_CONTENT_TYPES, MAX_AUDIO_BYTES, uploadPrefix } from "@/lib/audio-file";
import { ticketCookieName, verifyTicket } from "@/lib/ticket";

/**
 * A short-lived token for the browser to upload one audio file straight to Blob
 * storage: a 50 MB file can't pass through a function. Same gate as reading a
 * link, a scan ticket for the bag. The file only becomes a drop when
 * /api/drops takes it.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return Response.json({ error: "Bad request." }, { status: 400 });
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const bagId = Number(clientPayload);
        if (!Number.isInteger(bagId) || !pathname.startsWith(uploadPrefix(bagId))) throw new Error("Bad request.");
        if (!(await verifyTicket(request.cookies.get(ticketCookieName(bagId))?.value, bagId))) {
          throw new Error("Scan the shirt to drop a track.");
        }
        return { allowedContentTypes: AUDIO_CONTENT_TYPES, maximumSizeInBytes: MAX_AUDIO_BYTES, addRandomSuffix: true };
      },
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
