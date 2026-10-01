"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { detectProvider, type MediaInfo, type MediaRef } from "@cucu/media/core";
import { MediaEngine, usePlayerQueue } from "@cucu/media/react";
import { Button } from "@/components/ds/Button";
import { DropPreview, type DropDraft } from "@/components/ds/DropPreview";
import { Player } from "@/components/ds/Player";
import { Texture } from "@/components/ds/Texture";
import { TrackList } from "@/components/ds/TrackList";
import type { TrackView } from "@/components/ds/types";
import { UrlForm, type UrlFormStatus } from "@/components/ds/UrlForm";
import { padNumber, SOURCE_LABEL } from "@/lib/format";
import { isSpotify } from "@/lib/spotify";
import { UID_STORAGE_KEY, isUid, newUid } from "@/lib/uid";
import bagStyles from "./bag.module.css";
import { DropSuccess } from "./DropSuccess";
import { SpotifyModal } from "./SpotifyModal";

export type BagTrack = TrackView & { media: MediaRef };

interface Owner {
  handle: string;
  number: number;
  since: string;
  /** The wearer's prompt for this bag, if they set one. */
  theme: string | null;
}

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

/** The desktop layout's breakpoint, as in bag.module.css. */
const DESK = "(min-width: 900px)";

/** One line, as big as fits (up to deskMax in the desktop layout). Measures and sets the size directly — no re-render. */
function FitLine({
  text,
  max = 60,
  deskMax = max,
  min = 22,
  style,
}: {
  text: string;
  max?: number;
  deskMax?: number;
  min?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      const top = matchMedia(DESK).matches ? deskMax : max;
      el.style.fontSize = top + "px";
      const w = parent.clientWidth;
      const sw = el.scrollWidth;
      if (w && sw) el.style.fontSize = Math.max(min, Math.min(top, Math.floor((top * w) / sw))) + "px";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [text, max, deskMax, min]);
  return (
    <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
      <div ref={ref} style={{ ...style, fontSize: max, whiteSpace: "nowrap", display: "inline-block" }}>
        {text}
      </div>
    </div>
  );
}

const handleStyle: CSSProperties = {
  fontFamily: "var(--font-display-tall)",
  lineHeight: 0.82,
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
};
const looksRight: CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontWeight: "normal", letterSpacing: "-0.02em" };
const wordmark: CSSProperties = { fontFamily: "var(--font-display)", fontSize: "var(--wordmark)", lineHeight: 0.85 };
const chip: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
};

function Landing({
  owner,
  count,
  status,
  message,
  onSubmitUrl,
  onSkip,
  onError,
}: {
  owner: Owner;
  count: number;
  status: UrlFormStatus;
  message?: string;
  onSubmitUrl: (url: string) => void;
  onSkip: () => void;
  onError: (message?: string) => void;
}) {
  const [val, setVal] = useState("");
  const [spotify, setSpotify] = useState<string | null>(null);
  const submit = (v: string) => {
    if (isSpotify(v)) return setSpotify(v.trim());
    if (!detectProvider(v)) return onError("Bandcamp, SoundCloud or YouTube links only.");
    onSubmitUrl(v.trim());
  };
  const change = (v: string) => {
    const pasted = !val && v.length > 12;
    setVal(v);
    onError(undefined);
    if (pasted && (detectProvider(v) || isSpotify(v))) submit(v);
  };
  const closeSpotify = useCallback(() => {
    setSpotify(null);
    setVal("");
    setTimeout(() => document.getElementById("dat-url")?.focus(), 0);
  }, []);
  return (
    <main className={bagStyles.split}>
      <section className={`${bagStyles.hero} ${bagStyles.landingHero}`} style={{ ["--hero-h" as string]: "360px" }}>
        <Texture color="var(--magenta)" />
        <div style={{ ...wordmark, position: "absolute", left: "var(--pad)", top: "var(--pad)" }}>
          DROP A<br />
          TRACK
        </div>
        <div
          style={{
            position: "absolute",
            right: "var(--pad)",
            top: "var(--pad)",
            fontFamily: "var(--font-display)",
            fontSize: "var(--num)",
            lineHeight: 0.8,
            color: "transparent",
            WebkitTextStroke: "2px var(--ink)",
          }}
        >
          #{padNumber(owner.number)}
        </div>
        <div
          style={{
            position: "absolute",
            left: "var(--pad)",
            right: "var(--pad)",
            bottom: "var(--pad-tight)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <span style={{ ...chip, background: "var(--paper)", padding: "3px 6px" }}>You scanned</span>
          <div style={{ alignSelf: "stretch", display: "flex" }}>
            <FitLine text={owner.handle} max={76} deskMax={190} min={24} style={handleStyle} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--sbag)",
              lineHeight: 0.82,
              background: "var(--ink)",
              color: "var(--paper)",
              padding: "6px 8px 4px",
            }}
          >
            {"’"}S BAG
          </div>
        </div>
      </section>
      <section className={bagStyles.pane}>
        {owner.theme && (
          <div style={{ display: "flex", flexDirection: "column", background: "var(--ink)", color: "var(--paper)" }}>
            <div
              style={{
                ...chip,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "8px 12px",
                borderBottom: "1px solid var(--gray-400)",
              }}
            >
              <span>Theme</span>
              <span style={{ color: "var(--gray-400)" }}>Set by {owner.handle}</span>
            </div>
            <p style={{ margin: 0, padding: "14px 12px 16px", fontWeight: 800, fontSize: 22, lineHeight: 1.15, textWrap: "pretty" }}>{owner.theme}</p>
          </div>
        )}
        <UrlForm
          value={val}
          onChange={change}
          status={status}
          message={message}
          onSubmit={submit}
          hint={owner.theme ? "Stick to the theme, or don’t. Bandcamp, SoundCloud or YouTube." : undefined}
        />
        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
          {count} {count === 1 ? "track" : "tracks"} in the bag. You get one drop {"—"} make it count.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "var(--rule)", paddingTop: 16 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>Just looking?</span>
          <Button variant="outline" iconRight="→" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </section>
      {spotify && <SpotifyModal url={spotify} onClose={closeSpotify} />}
    </main>
  );
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

export function BagApp({
  owner,
  bagId,
  initialTracks,
  ticketValid,
  serverDropId,
  cookieUid,
}: {
  owner: Owner;
  bagId: number;
  initialTracks: BagTrack[];
  ticketValid: boolean;
  serverDropId: string | null;
  cookieUid: string | null;
}) {
  const storedDropId = useSyncExternalStore(noSubscribe, () => lsGet(dropKey(bagId)), () => null);
  const [tracks, setTracks] = useState(initialTracks);
  const [newDropId, setNewDropId] = useState<string | null>(null);
  // Only highlight a stored drop that's still in the bag (an admin may have removed it).
  const myDropId = newDropId ?? serverDropId ?? (tracks.some((t) => t.id === storedDropId) ? storedDropId : null);
  const [ticketSpent, setTicketSpent] = useState(false);
  const canDrop = ticketValid && !ticketSpent && !myDropId;

  const [view, setView] = useState<"landing" | "preview" | "success" | "bag">(canDrop ? "landing" : "bag");
  // The drop screens need a drop left; the success screen comes right after spending it.
  const shown = (view === "landing" || view === "preview") && !canDrop ? "bag" : view;
  const [success, setSuccess] = useState<{ track: BagTrack; position: number } | null>(null);

  const [urlStatus, setUrlStatus] = useState<UrlFormStatus>("idle");
  const [urlMessage, setUrlMessage] = useState<string>();
  const [draft, setDraft] = useState<DropDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; line: string } | null>(null);
  const readSeq = useRef(0);

  const items = useMemo(() => tracks.map((t) => ({ id: t.id, media: t.media })), [tracks]);
  const refreshStream = async (media: MediaRef) => {
    const t = tracks.find((x) => x.media === media);
    if (!t) return null;
    const res = await fetch("/api/media/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropId: Number(t.id) }),
    });
    return res.ok ? ((await res.json()) as { streamUrl: string }).streamUrl : null;
  };
  const queue = usePlayerQueue(items, { initialId: myDropId ?? tracks[0]?.id, refreshStream });
  const current = tracks.find((t) => t.id === queue.currentId) ?? null;

  const showError = (message?: string) => {
    setUrlStatus(message ? "error" : "idle");
    setUrlMessage(message);
  };

  const readUrl = async (url: string) => {
    const seq = ++readSeq.current;
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
    if (!draft) return;
    setDropping(true);
    setDropError(null);
    try {
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bagId,
          uid: ensureUid(cookieUid),
          url: draft.url,
          trackId: draft.trackId,
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
        const t: BagTrack = {
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
        };
        lsSet(dropKey(bagId), t.id);
        lsSet(NAME_KEY, draft.droppedBy.trim());
        setTracks((prev) => [t, ...prev]);
        setNewDropId(t.id);
        setTicketSpent(true);
        setSuccess({ track: t, position: body.position });
        setNotice({ title: "DROPPED.", line: `You’re #${padNumber(body.position)} in ${owner.handle}’s bag. That was your one.` });
        queue.cue(t.id);
        setView("success");
        window.scrollTo(0, 0);
      } else if (res.status === 409 || res.status === 403) {
        setTicketSpent(true);
        setNotice({ title: res.status === 409 ? "ALREADY DROPPED." : "SCAN AGAIN.", line: body.error });
        setView("bag");
        window.scrollTo(0, 0);
      } else {
        setDropError(body.error ?? "Couldn’t drop that. Try again.");
      }
    } catch {
      setDropError("No connection. Try again.");
    } finally {
      setDropping(false);
    }
  };

  const intoBag = `Dropping into ${owner.handle}’s bag`;
  return (
    <div className={bagStyles.shell}>
      <div style={{ flex: 1 }}>
        {shown === "landing" && (
          <Landing
            owner={owner}
            count={tracks.length}
            status={urlStatus}
            message={urlMessage}
            onSubmitUrl={readUrl}
            onSkip={() => setView("bag")}
            onError={showError}
          />
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
                <span style={{ ...chip, background: "var(--paper)", padding: "3px 6px" }}>{intoBag}</span>
                <h1 style={{ ...looksRight, fontSize: "min(15vh,15cqw)", lineHeight: 0.8 }}>
                  LOOKS
                  <br />
                  RIGHT?
                </h1>
              </div>
            </aside>
            <section className={bagStyles.pane}>
              <div className={bagStyles.mob} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={chip}>{intoBag}</span>
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
                error={dropError}
                onChange={(update) => setDraft((d) => d && update(d))}
                onDrop={drop}
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
            onOpenBag={() => {
              setView("bag");
              window.scrollTo(0, 0);
            }}
          />
        )}
        {shown === "bag" && (
          <main className={`${bagStyles.split} ${bagStyles.bagView}`}>
            <header className={`${bagStyles.hero} ${bagStyles.bagHero}`} style={{ ["--hero-h" as string]: "260px" }}>
              <Texture color="var(--magenta)" />
              <div style={{ ...wordmark, position: "absolute", left: "var(--pad)", top: "var(--pad)" }}>
                DROP A<br />
                TRACK
              </div>
              <div
                style={{
                  position: "absolute",
                  right: -4,
                  top: 0,
                  bottom: 0,
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--bag)",
                  lineHeight: 0.8,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                BAG
              </div>
              <div
                style={{
                  position: "absolute",
                  right: "var(--edge)",
                  top: "var(--pad-tight)",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--num)",
                  lineHeight: 0.8,
                  color: "transparent",
                  WebkitTextStroke: "2px var(--ink)",
                }}
              >
                #{padNumber(owner.number)}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "var(--pad)",
                  right: "var(--edge-text)",
                  bottom: "var(--pad-tight)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <span style={{ ...chip, background: "var(--paper)", padding: "3px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Since {owner.since} · {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
                </span>
                <div style={{ alignSelf: "stretch", display: "flex", background: "var(--ink)", color: "var(--paper)", padding: "8px 10px 4px" }}>
                  <FitLine text={owner.handle} max={60} deskMax={150} min={22} style={handleStyle} />
                </div>
              </div>
            </header>
            <div className={bagStyles.col}>
              {notice && (
                <div role="status" style={{ background: "var(--ink)", color: "var(--paper)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 0.9 }}>{notice.title}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gray-400)" }}>{notice.line}</span>
                </div>
              )}
              {canDrop && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px" }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight="→"
                    onClick={() => {
                      if (queue.playing) queue.toggle(); // the controls stay behind in the bag
                      setView("landing");
                    }}
                    style={{ padding: 0 }}
                  >
                    Still want to drop?
                  </Button>
                </div>
              )}
              {/* A drop from this visit slides in at the top. */}
              <div className={newDropId ? bagStyles.rowIn : undefined}>
                <TrackList
                  title={null}
                  tracks={tracks}
                  highlightId={myDropId}
                  activeId={queue.currentId}
                  playing={queue.playing}
                  onSelect={(t) => queue.toggle(t.id)}
                />
              </div>
              <div style={{ flex: 1, minHeight: 24 }} />
              {tracks.length > 0 && (
                <div style={{ position: "sticky", bottom: 0, zIndex: 10 }}>
                  <Player
                    track={current}
                    playing={queue.playing}
                    buffering={queue.buffering}
                    position={queue.progress.playedSeconds}
                    duration={queue.progress.duration}
                    onToggle={() => queue.toggle()}
                    onNext={tracks.length > 1 ? queue.next : undefined}
                    seekInputProps={queue.seekInputProps}
                  />
                </div>
              )}
            </div>
          </main>
        )}
      </div>
      {/* Mounted on every view, paused: the provider is loaded before the first
          tap (iOS only plays inside a gesture), and leaving the bag doesn't cut it. */}
      {tracks.length > 0 && <MediaEngine {...queue.engineProps} />}
    </div>
  );
}
