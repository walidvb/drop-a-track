"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { upload as uploadBlob } from "@vercel/blob/client";
import { detectProvider, type MediaInfo } from "@cucu/media/core";
import { DropPreview, type DropDraft } from "@/components/ds/DropPreview";
import { monoCaps } from "@/components/ds/styles";
import { Texture } from "@/components/ds/Texture";
import type { UrlFormStatus } from "@/components/ds/UrlForm";
import { uploadPathname } from "@/lib/audio-file";
import { SOURCE_LABEL } from "@/lib/format";
import type { HomeBag, HomeTrack } from "@/lib/home";
import { UID_STORAGE_KEY, isUid, newUid } from "@/lib/uid";
import { Browse } from "../Browse";
import bagStyles from "./bag.module.css";
import { DropForm, type Owner, type PickedAudio } from "./DropForm";
import { DropSuccess } from "./DropSuccess";

const NAME_KEY = "dat-name";
const dropKey = (bagId: number) => `dat-drop:${bagId}`;

// localStorage can throw (private mode, blocked storage): every access is best effort.
const lsGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const lsSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
const noSubscribe = () => () => {};

/** This browser's dropper id: localStorage first, then the cookie's, else a new one. */
function ensureUid(cookieUid: string | null): string {
  const stored = lsGet(UID_STORAGE_KEY);
  if (isUid(stored)) return stored;
  const uid = cookieUid ?? newUid();
  lsSet(UID_STORAGE_KEY, uid);
  return uid;
}

const looksRight: CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontWeight: "normal", letterSpacing: "-0.02em" };
const wordmark: CSSProperties = { fontFamily: "var(--font-display)", fontSize: "var(--wordmark)", lineHeight: 0.85 };

/** A file on its way to Blob storage. */
interface Upload {
  file: File;
  /** 0–100 */
  pct: number;
  /** Set once it's stored. */
  url: string | null;
  error: string | null;
}

/** The draft for a freshly read link. */
function draftFrom(info: MediaInfo, droppedBy: string): DropDraft {
  const bc = info.bandcamp;
  return {
    url: info.url,
    source: SOURCE_LABEL[info.provider],
    title: info.title,
    artist: info.artist,
    thumbnail: info.artworkUrl,
    duration: info.durationSec,
    droppedBy,
    droppedFrom: "",
    lat: null,
    lng: null,
    tracks: bc?.tracks.map((t) => ({ trackId: t.trackId, title: t.title, durationSec: t.durationSec, playable: !!t.streamUrl })),
    trackId: bc?.defaultTrackId ?? null,
  };
}

/**
 * The drop flow, for a fresh scan (the page checked the ticket, and that this browser's
 * cookie hasn't dropped here): drop form → preview → success. After a Skip or the drop,
 * the bag itself is the home view (Browse) with this bag open.
 */
export function BagApp({
  owner,
  bagId,
  home,
  mine,
  stillPending,
  cookieUid,
}: {
  owner: Owner;
  bagId: number;
  /** Every bag and drop, as on the home page: shown after a Skip or the drop. */
  home: { bags: HomeBag[]; drops: HomeTrack[] };
  /** Drops this browser's cookie made elsewhere. */
  mine: string[];
  /** The other bags this browser can still drop into, by handle. */
  stillPending: string[];
  cookieUid: string | null;
}) {
  const storedDropId = useSyncExternalStore(noSubscribe, () => lsGet(dropKey(bagId)), () => null);
  const [data, setData] = useState(home);
  const tracks = data.bags.find((b) => b.handle === owner.handle)?.tracks ?? [];
  const [newDropId, setNewDropId] = useState<string | null>(null);
  // The cookie's uid hasn't dropped here, but this browser's stored one may have: only a drop
  // still in the bag counts (an admin may have removed it).
  const myDropId = newDropId ?? (tracks.some((t) => t.id === storedDropId) ? storedDropId : null);
  const [ticketSpent, setTicketSpent] = useState(false);
  const canDrop = !ticketSpent && !myDropId;

  const [view, setView] = useState<"landing" | "preview" | "success" | "bag">(canDrop ? "landing" : "bag");
  // The drop screens need a drop left; the success screen comes right after spending it.
  const shown = (view === "landing" || view === "preview") && !canDrop ? "bag" : view;
  const [success, setSuccess] = useState<{ track: HomeTrack; position: number } | null>(null);

  const [urlStatus, setUrlStatus] = useState<UrlFormStatus>("idle");
  const [urlMessage, setUrlMessage] = useState<string>();
  const [draft, setDraft] = useState<DropDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const readSeq = useRef(0);
  // A file drop: the picked file or take, and its upload, started on the way to the details step.
  const [picked, setPicked] = useState<PickedAudio | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const uploadAbort = useRef<AbortController | null>(null);

  const showError = (message?: string) => {
    setUrlStatus(message ? "error" : "idle");
    setUrlMessage(message);
  };

  const startUpload = async (audio: PickedAudio) => {
    uploadAbort.current?.abort();
    const ctl = new AbortController();
    uploadAbort.current = ctl;
    const { file } = audio;
    // Only ever about this file: a later pick replaces the whole upload.
    const update = (u: Partial<Upload>) => setUpload((prev) => (prev?.file === file ? { ...prev, ...u } : prev));
    setUpload({ file, pct: 0, url: null, error: null });
    try {
      const blob = await uploadBlob(uploadPathname(bagId, file.name, audio.extension), file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: String(bagId),
        contentType: audio.contentType,
        multipart: file.size > 8e6,
        abortSignal: ctl.signal,
        onUploadProgress: ({ percentage }) => update({ pct: percentage }),
      });
      update({ pct: 100, url: blob.url });
    } catch {
      if (!ctl.signal.aborted) update({ error: "Upload failed. Check your connection and try again." });
    }
  };

  /** Upload or Record → the details step. The same file again (after a Back) keeps its upload. */
  const readFile = (audio: PickedAudio) => {
    readSeq.current++; // a link still being read no longer counts
    setLoading(false);
    setPicked(audio);
    setDraft({
      url: audio.kind === "record" ? "Recorded just now" : audio.file.name,
      source: SOURCE_LABEL.file,
      title: audio.title,
      artist: audio.artist,
      thumbnail: null,
      duration: audio.durationSec,
      droppedBy: lsGet(NAME_KEY) ?? "",
      droppedFrom: "",
      lat: null,
      lng: null,
    });
    setDropError(null);
    if (upload?.file !== audio.file || upload.error) void startUpload(audio);
    setView("preview");
    window.scrollTo(0, 0);
  };

  const readUrl = async (url: string) => {
    const seq = ++readSeq.current;
    setPicked(null);
    const provider = detectProvider(url)!;
    const name = lsGet(NAME_KEY) ?? "";
    setDraft({ url, source: SOURCE_LABEL[provider], title: "", artist: "", thumbnail: null, duration: null, droppedBy: name, droppedFrom: "", lat: null, lng: null });
    setDropError(null);
    setLoading(true);
    setView("preview");
    window.scrollTo(0, 0);
    try {
      const res = await fetch("/api/read-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, bagId }),
      });
      const body = (await res.json()) as { info?: MediaInfo; error?: string };
      if (seq !== readSeq.current) return; // they went back and pasted something else
      if (!res.ok || !body.info) {
        setView("landing");
        showError(body.error ?? "Couldn’t read that link.");
        return;
      }
      setDraft(draftFrom(body.info, name));
    } catch {
      if (seq !== readSeq.current) return;
      setView("landing");
      showError("No connection. Try again.");
    } finally {
      if (seq === readSeq.current) setLoading(false);
    }
  };

  const drop = async () => {
    if (!draft || (picked && !upload?.url)) return;
    setDropping(true);
    setDropError(null);
    try {
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bagId,
          uid: ensureUid(cookieUid),
          ...(picked ? { fileUrl: upload?.url, durationSec: draft.duration } : { url: draft.url, trackId: draft.trackId }),
          title: draft.title,
          artist: draft.artist,
          droppedBy: draft.droppedBy,
          droppedFrom: draft.droppedFrom,
          lat: draft.lat,
          lng: draft.lng,
        }),
      });
      const body = await res.json();
      if (res.status === 201) {
        const d = body.drop;
        const t: HomeTrack = {
          id: String(d.id),
          title: d.title,
          artist: d.artist,
          thumbnail: d.artworkUrl,
          source: SOURCE_LABEL[d.provider as keyof typeof SOURCE_LABEL],
          duration: d.durationSec,
          droppedBy: d.droppedBy,
          droppedFrom: d.droppedFrom,
          droppedAt: "Just now",
          url: d.url,
          media: { provider: d.provider, url: d.url, providerTrackId: d.providerTrackId, streamUrl: d.streamUrl },
          handle: owner.handle,
          bagNumber: owner.number,
        };
        lsSet(dropKey(bagId), t.id);
        lsSet(NAME_KEY, draft.droppedBy.trim());
        // Into the bag and the latest drops, so the bag shows it straight after.
        setData((d) => ({
          bags: d.bags.map((b) => (b.handle === owner.handle ? { ...b, tracks: [t, ...b.tracks] } : b)),
          drops: [t, ...d.drops],
        }));
        setNewDropId(t.id);
        setTicketSpent(true);
        setSuccess({ track: t, position: body.position });
        setView("success");
        window.scrollTo(0, 0);
      } else {
        // Including "already dropped" (409) and "scan again" (403): said under the DROP! button.
        setDropError(body.error ?? "Couldn’t drop that. Try again.");
      }
    } catch {
      setDropError("No connection. Try again.");
    } finally {
      setDropping(false);
    }
  };

  if (shown === "bag") {
    const myDrops = myDropId && !mine.includes(myDropId) ? [...mine, myDropId] : mine;
    const backToDrop = () => {
      setView("landing");
      window.scrollTo(0, 0);
    };
    return (
      <Browse
        {...data}
        initialView={owner.handle}
        mine={myDrops}
        drop={canDrop ? { handle: owner.handle, onDrop: backToDrop } : undefined}
        pendingDrops={stillPending.length + (canDrop ? 1 : 0)}
      />
    );
  }

  const intoBag = `Dropping into ${owner.handle}’s bag`;
  const uploading = picked && upload && !upload.url && !upload.error ? `Uploading… ${Math.round(upload.pct)}%` : null;
  const uploadFailed = picked && upload?.error ? upload.error : null;
  return (
    <div className={bagStyles.shell}>
      <div style={{ flex: 1 }}>
        {/* Kept mounted under the details step, so Back finds the link, file or take still there. */}
        {(shown === "landing" || shown === "preview") && (
          <div hidden={shown !== "landing"}>
            <DropForm
              owner={owner}
              count={tracks.length}
              status={urlStatus}
              message={urlMessage}
              onSubmitUrl={readUrl}
              onSubmitFile={readFile}
              onSkip={() => setView("bag")}
              onError={showError}
            />
          </div>
        )}
        {shown === "preview" && (
          <main className={bagStyles.split}>
            <aside className={`${bagStyles.hero} ${bagStyles.desk}`}>
              <Texture color="var(--magenta)" />
              <div style={{ ...wordmark, position: "absolute", left: "var(--pad)", top: "var(--pad)" }}>
                DROP A<br />
                TRACK
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "var(--pad)",
                  right: "var(--pad)",
                  bottom: "var(--pad)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <span style={{ ...monoCaps, background: "var(--paper)", padding: "3px 6px" }}>{intoBag}</span>
                <h1 style={{ ...looksRight, fontSize: "min(15vh,15cqw)", lineHeight: 0.8 }}>
                  LOOKS
                  <br />
                  RIGHT?
                </h1>
              </div>
            </aside>
            <section className={bagStyles.pane}>
              <div className={bagStyles.mob} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={monoCaps}>{intoBag}</span>
                <h1 style={{ ...looksRight, fontSize: 44, lineHeight: 0.82 }}>
                  LOOKS
                  <br />
                  RIGHT?
                </h1>
              </div>
              <DropPreview
                draft={draft}
                loading={loading}
                dropping={dropping}
                error={dropError ?? uploadFailed}
                pendingLabel={uploading}
                dropLabel={uploadFailed ? "Retry upload" : undefined}
                backLabel={picked ? (picked.kind === "record" ? "Back to recording" : "Change file") : undefined}
                fieldsNote={
                  picked
                    ? picked.kind === "record"
                      ? "Give your recording a name. Artist’s optional."
                      : "From the file name. Fix it if it’s wrong."
                    : undefined
                }
                onChange={(update) => setDraft((d) => d && update(d))}
                onDrop={uploadFailed && picked ? () => void startUpload(picked) : drop}
                onBack={() => {
                  readSeq.current++;
                  setLoading(false);
                  setView("landing");
                }}
              />
            </section>
          </main>
        )}
        {shown === "success" && success && (
          <DropSuccess
            handle={owner.handle}
            position={success.position}
            track={success.track}
            stillPending={stillPending}
            onOpenBag={() => {
              setView("bag");
              window.scrollTo(0, 0);
            }}
          />
        )}
      </div>
    </div>
  );
}
