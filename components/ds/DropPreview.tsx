"use client";

import { useState } from "react";
import { Artwork } from "./Artwork";
import { Button } from "./Button";
import { fmtTime } from "./types";

/** The draft a dropper confirms. Artwork, source, length come from the link; the rest is editable. */
export interface DropDraft {
  url: string;
  source: string;
  title: string;
  artist: string;
  thumbnail: string | null;
  duration: number | null;
  droppedBy: string;
  droppedFrom: string;
  lat: number | null;
  lng: number | null;
  /** Bandcamp album links: the release's tracks, and which one is being dropped. */
  tracks?: { trackId: string; title: string; durationSec: number | null; playable: boolean }[];
  trackId?: string | null;
}

const labelStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase" as const,
};

const inputStyle = (focused: boolean) => ({
  height: "var(--control-h)",
  padding: "0 12px",
  border: "var(--border-w) solid " + (focused ? "var(--magenta)" : "var(--ink)"),
  borderRadius: 0,
  outline: 0,
  background: "var(--paper)",
  color: "var(--ink)",
  minWidth: 0,
  width: "100%",
  fontWeight: 700,
  fontSize: "16px",
});

function Field({
  label,
  value,
  onChange,
  font,
  upper,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  font?: string;
  upper?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [f, setF] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={200}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{ ...inputStyle(f), fontFamily: font || "var(--font-body)", textTransform: upper ? "uppercase" : "none" }}
      />
    </label>
  );
}

function TrackPicker({
  tracks,
  value,
  onChange,
}: {
  tracks: NonNullable<DropDraft["tracks"]>;
  value: string | null | undefined;
  onChange: (trackId: string) => void;
}) {
  const [f, setF] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
      <span style={labelStyle}>Which track?</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{ ...inputStyle(f), fontFamily: "var(--font-body)", appearance: "none" }}
      >
        {tracks.map((t, i) => (
          <option key={t.trackId} value={t.trackId} disabled={!t.playable}>
            {String(i + 1).padStart(2, "0")} · {t.title}
            {t.playable ? "" : " (not streamable)"}
          </option>
        ))}
      </select>
    </label>
  );
}

async function reverseGeocode(lat: number, lon: number) {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    ).then((res) => res.json());
    const place = r.city || r.locality || r.principalSubdivision;
    const parts = [place, r.countryName].filter(Boolean);
    if (parts.length) return parts.join(", ");
  } catch {}
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

type LocateStatus = "idle" | "locating" | "done" | "denied" | "error";

function LocateButton({
  status,
  onStatus,
  onLocated,
}: {
  status: LocateStatus;
  onStatus: (s: LocateStatus) => void;
  onLocated: (label: string, lat: number, lng: number) => void;
}) {
  const [hv, setHv] = useState(false);
  const busy = status === "locating";
  const supported = typeof navigator !== "undefined" && !!navigator.geolocation;
  const go = () => {
    if (!supported || busy) return;
    onStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude, longitude } = p.coords;
        onLocated(await reverseGeocode(latitude, longitude), latitude, longitude);
        onStatus("done");
      },
      (e) => onStatus(e && e.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };
  return (
    <button
      type="button"
      onClick={go}
      disabled={!supported || busy}
      aria-label="Share my location"
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      style={{
        height: "var(--control-h)",
        padding: "0 12px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        border: "var(--border-w) solid var(--ink)",
        borderLeft: 0,
        borderRadius: 0,
        background: busy ? "var(--magenta)" : hv ? "var(--ink)" : "var(--paper)",
        color: hv && !busy ? "var(--paper)" : "var(--ink)",
        cursor: supported && !busy ? "pointer" : "not-allowed",
        ...labelStyle,
        whiteSpace: "nowrap",
        transition: "background var(--dur-fast) var(--ease-snap)",
      }}
    >
      <span aria-hidden style={{ fontSize: "14px", letterSpacing: 0 }}>
        {"◎"}
      </span>
      {busy ? "Locating…" : "Share location"}
    </button>
  );
}

function LocField({
  value,
  onChange,
  onLocated,
}: {
  value: string;
  onChange: (v: string) => void;
  onLocated: (label: string, lat: number, lng: number) => void;
}) {
  const [f, setF] = useState(false);
  const [st, setSt] = useState<LocateStatus>("idle");
  const msg =
    st === "denied"
      ? "Location blocked. Type it instead."
      : st === "error"
        ? "Couldn’t get a fix. Type it instead."
        : st === "done"
          ? "From your browser. Edit if it’s off."
          : "Share it, or just type it in.";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
      <label htmlFor="dat-loc" style={labelStyle}>
        Where are you?
      </label>
      <div style={{ display: "flex", minWidth: 0 }}>
        <input
          id="dat-loc"
          value={value}
          placeholder="Berghain, Berlin"
          maxLength={120}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setF(true)}
          onBlur={() => setF(false)}
          style={{ ...inputStyle(f), flex: 1, fontFamily: "var(--font-body)" }}
        />
        <LocateButton status={st} onStatus={setSt} onLocated={onLocated} />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: st === "denied" || st === "error" ? "var(--signal-error)" : "var(--text-secondary)",
        }}
      >
        {msg}
      </span>
    </div>
  );
}

const Bar = ({ w, h }: { w: string; h?: number }) => <div style={{ width: w, height: h || 14, background: "var(--gray-100)" }} />;

export function DropPreview({
  draft,
  loading = false,
  dropping = false,
  error,
  onChange,
  onDrop,
  onBack,
  dropLabel = "Drop!",
  note = "One drop per person. No take-backs.",
}: {
  draft: DropDraft | null;
  loading?: boolean;
  dropping?: boolean;
  error?: string | null;
  /** Takes an update, not a draft: Share location lands seconds later, onto whatever was typed meanwhile. */
  onChange: (update: (draft: DropDraft) => DropDraft) => void;
  onDrop: () => void;
  onBack?: () => void;
  dropLabel?: string;
  note?: string;
}) {
  const d = draft;
  const set = <K extends keyof DropDraft>(k: K, v: DropDraft[K]) => onChange((prev) => ({ ...prev, [k]: v }));
  const pickTrack = (trackId: string) =>
    onChange((prev) => {
      const t = prev.tracks?.find((x) => x.trackId === trackId);
      return t ? { ...prev, trackId, title: t.title, duration: t.durationSec } : prev;
    });
  const ready = !!(d && d.title.trim() && d.droppedBy.trim() && d.droppedFrom.trim());
  const busy = loading || !d;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", color: "var(--ink)" }}>
      <div style={{ display: "flex", gap: "14px", alignItems: "stretch" }}>
        {busy ? (
          <div style={{ width: 96, height: 96, background: "var(--gray-100)", flexShrink: 0 }} />
        ) : (
          <Artwork src={d.thumbnail} source={d.source} size={96} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, justifyContent: "center" }}>
          <span style={{ ...labelStyle, alignSelf: "flex-start", background: "var(--ink)", color: "var(--paper)", padding: "3px 7px" }}>
            {busy ? "Reading link…" : [d.source || "Link", d.duration ? fmtTime(d.duration) : null].filter(Boolean).join(" · ")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              wordBreak: "break-all",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {d?.url ?? ""}
          </span>
        </div>
      </div>

      {busy ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Bar w="40%" h={11} />
          <Bar w="100%" h={48} />
          <Bar w="30%" h={11} />
          <Bar w="100%" h={48} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {d.tracks && d.tracks.length > 1 ? <TrackPicker tracks={d.tracks} value={d.trackId} onChange={pickTrack} /> : null}
          <Field label="Title" value={d.title} onChange={(v) => set("title", v)} font="var(--font-display-wide)" upper />
          <Field label="Artist" value={d.artist} onChange={(v) => set("artist", v)} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "-6px" }}>
            Pulled from the link. Fix it if it{"’"}s wrong.
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              borderTop: "var(--border-w-heavy) solid var(--ink)",
              paddingTop: "14px",
              marginTop: "4px",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", lineHeight: 0.85 }}>WHO{"’"}S DROPPING?</span>
            <Field label="Your name" value={d.droppedBy} onChange={(v) => set("droppedBy", v)} placeholder="Ana" autoComplete="given-name" />
            <LocField
              value={d.droppedFrom}
              onChange={(v) => set("droppedFrom", v)}
              onLocated={(label, lat, lng) => onChange((prev) => ({ ...prev, droppedFrom: label, lat, lng }))}
            />
          </div>
        </div>
      )}

      {error ? (
        <div role="alert" style={{ ...labelStyle, color: "var(--signal-error)" }}>
          {error}
        </div>
      ) : null}

      <Button
        variant="accent"
        size="lg"
        fullWidth
        disabled={busy || dropping || !ready}
        onClick={onDrop}
        style={{ fontSize: "24px", fontFamily: "var(--font-display)" }}
      >
        {dropping ? "Dropping…" : dropLabel}
      </Button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        {onBack ? (
          <Button variant="ghost" size="sm" iconLeft={"←"} onClick={onBack} style={{ padding: 0 }}>
            Change link
          </Button>
        ) : (
          <span />
        )}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", textAlign: "right" }}>{note}</span>
      </div>
    </div>
  );
}
