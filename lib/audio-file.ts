/**
 * Uploaded and recorded tracks: which audio files we take, and the content type
 * each is stored under. Only formats every browser plays: an AIFF plays in
 * Safari and nowhere else, so it's turned away rather than dropped silent.
 * Isomorphic: the form checks a file before uploading, the server checks the stored blob.
 */

/** "50 MB", as the form says it. */
export const MAX_AUDIO_BYTES = 50 * 1000 * 1000;
/** Recordings stop themselves at 3:00. */
export const MAX_RECORDING_SEC = 180;

/** Extension → stored content type. `webm` is what Chrome and Firefox record. */
const BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4",
  aac: "audio/aac",
  webm: "audio/webm",
};
/** For files with no (or an odd) extension: the types browsers report for them. */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/vnd.wave": "wav",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/webm": "webm",
};

/** Every content type a stored track may have: the upload token and the drop both check it. */
export const AUDIO_CONTENT_TYPES = [...new Set(Object.values(BY_EXTENSION))];

export type AudioFileCheck = { ok: true; extension: string; contentType: string } | { ok: false; error: string };

/** Whether this file can become a drop, and the extension and content type it's stored with. */
export function checkAudioFile(file: { name: string; type: string; size: number }): AudioFileCheck {
  const type = file.type.split(";")[0].trim().toLowerCase();
  const named = /\.([a-z0-9]+)$/i.exec(file.name)?.[1].toLowerCase() ?? "";
  if (/^aif[fc]?$/.test(named) || /aiff/.test(type)) {
    return { ok: false, error: "AIFF won’t play for most people. Try MP3, WAV or FLAC." };
  }
  const extension = BY_EXTENSION[named] ? named : EXTENSION_BY_TYPE[type];
  if (!extension) {
    return {
      ok: false,
      error: type.startsWith("audio/") ? "That format won’t play for everyone. Try MP3, WAV or FLAC." : "Audio files only.",
    };
  }
  if (file.size > MAX_AUDIO_BYTES) return { ok: false, error: "Too big. 50 MB max." };
  return { ok: true, extension, contentType: BY_EXTENSION[extension] };
}

/** Where a bag's uploads live in Blob storage; the drop only takes files from here. */
export const uploadPrefix = (bagId: number) => `drops/${bagId}/`;

/** The Blob pathname for an upload: readable, safe, under its bag. Blob adds a random suffix. */
export function uploadPathname(bagId: number, name: string, extension: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${uploadPrefix(bagId)}${base || "track"}.${extension}`;
}

/** A suggested title and artist from a file name: "Artist - Title.mp3" splits, anything else is the title. */
export function namesFromFile(name: string): { title: string; artist: string } {
  const base = name.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();
  const parts = /^(.+?)\s+[-–—]\s+(.+)$/.exec(base);
  return parts ? { artist: parts[1].trim(), title: parts[2].trim() } : { title: base, artist: "" };
}
