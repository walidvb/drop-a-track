"use client";

import { useCallback, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { detectProvider, type MediaInfo } from "@cucu/media/core";
import { Button } from "@/components/ds/Button";
import { DropPreview, type DropDraft } from "@/components/ds/DropPreview";
import { monoCaps } from "@/components/ds/styles";
import { Texture } from "@/components/ds/Texture";
import { UrlForm, type UrlFormStatus } from "@/components/ds/UrlForm";
import { FitText } from "@/components/FitText";
import { padNumber, SOURCE_LABEL } from "@/lib/format";
import type { HomeBag, HomeTrack } from "@/lib/home";
import { isSpotify } from "@/lib/spotify";
import { UID_STORAGE_KEY, isUid, newUid } from "@/lib/uid";
import { Browse } from "../Browse";
import bagStyles from "./bag.module.css";
import { DropSuccess } from "./DropSuccess";
import { SpotifyModal } from "./SpotifyModal";

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

/** The wearer's handle, fitted to its line; the cap is --fit-max in bag.module.css (it grows on desktop). */
const handleStyle: CSSProperties = {
  display: "inline-block",
  whiteSpace: "nowrap",
  fontFamily: "var(--font-display-tall)",
  lineHeight: 0.82,
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
};
const looksRight: CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontWeight: "normal", letterSpacing: "-0.02em" };
const wordmark: CSSProperties = { fontFamily: "var(--font-display)", fontSize: "var(--wordmark)", lineHeight: 0.85 };
/** The scan's first screen: who you scanned, their theme if any, and the link field. */
function DropForm({
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
          <span style={{ ...monoCaps, background: "var(--paper)", padding: "3px 6px" }}>You scanned</span>
          <div style={{ alignSelf: "stretch", display: "flex", overflow: "hidden" }}>
            <FitText max={76} min={24} style={handleStyle}>
              {owner.handle}
            </FitText>
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
                ...monoCaps,
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
  cookieUid,
}: {
  owner: Owner;
  bagId: number;
  /** Every bag and drop, as on the home page: shown after a Skip or the drop. */
  home: { bags: HomeBag[]; drops: HomeTrack[] };
  /** Drops this browser's cookie made elsewhere. */
  mine: string[];
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
      />
    );
  }

  const intoBag = `Dropping into ${owner.handle}’s bag`;
  return (
    <div className={bagStyles.shell}>
      <div style={{ flex: 1 }}>
        {shown === "landing" && (
          <DropForm
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
      </div>
    </div>
  );
}
