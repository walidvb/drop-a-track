import { head } from "@vercel/blob";
import { AUDIO_CONTENT_TYPES, MAX_AUDIO_BYTES, uploadPrefix } from "./audio-file";

/**
 * The upload behind a file drop, if it's real: in our Blob store (head() only
 * finds our own blobs), uploaded for this bag, of a type that plays.
 */
export async function findUpload(url: string, bagId: number): Promise<{ url: string } | null> {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!host.endsWith(".public.blob.vercel-storage.com")) return null;
  const blob = await head(url).catch(() => null);
  if (!blob || !blob.pathname.startsWith(uploadPrefix(bagId))) return null;
  if (!AUDIO_CONTENT_TYPES.includes(blob.contentType) || blob.size > MAX_AUDIO_BYTES) return null;
  return { url: blob.url };
}
