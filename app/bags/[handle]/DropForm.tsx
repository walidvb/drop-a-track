"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { detectProvider } from "@cucu/media/core";
import { Button } from "@/components/ds/Button";
import { ellipsis, monoCaps } from "@/components/ds/styles";
import { Texture } from "@/components/ds/Texture";
import { fmtTime } from "@/components/ds/types";
import { UrlForm, type UrlFormStatus } from "@/components/ds/UrlForm";
import { FitText } from "@/components/FitText";
import { checkAudioFile, MAX_RECORDING_SEC, namesFromFile } from "@/lib/audio-file";
import { padNumber } from "@/lib/format";
import { isSpotify } from "@/lib/spotify";
import bagStyles from "./bag.module.css";
import styles from "./drop-form.module.css";
import { SpotifyModal } from "./SpotifyModal";

export interface Owner {
  handle: string;
  number: number;
  since: string;
  /** The wearer's prompt for this bag, if they set one. */
  theme: string | null;
}

/** An audio file ready for the details step: picked from disk, or recorded here. */
export interface PickedAudio {
  kind: "upload" | "record";
  file: File;
  /** What it's stored as: see lib/audio-file. */
  extension: string;
  contentType: string;
  /** Suggestions for the details step. */
  title: string;
  artist: string;
  durationSec: number | null;
}

type Mode = "link" | "upload" | "record";
const TABS: [Mode, string][] = [
  ["link", "Link"],
  ["upload", "Upload"],
  ["record", "Record"],
];

/** Recorder formats, best first: AAC plays everywhere; WebM is what Firefox (and older Chrome) can make. */
const RECORDING_TYPES = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
const NO_RECORDING = "Recording doesn’t work in this browser. Upload a file instead.";

/** A picked file or a take, with the object URL it previews from. */
type Local = { audio: PickedAudio; src: string };

/** The record tab: the mic, a 3:00 cap, and the take. Releases the mic when the form goes. */
function useRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [secs, setSecs] = useState(0);
  const [take, setTake] = useState<Local | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = useRef<{ recorder: MediaRecorder; stream: MediaStream; timer: number } | null>(null);

  const stop = useCallback(() => {
    const r = live.current;
    if (!r) return;
    clearInterval(r.timer);
    if (r.recorder.state !== "inactive") r.recorder.stop();
  }, []);

  const start = async () => {
    if (live.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return setError(NO_RECORDING);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setError("No mic access. Allow it in your browser, or upload a file.");
    }
    const mimeType = RECORDING_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const t0 = Date.now();
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      live.current = null;
      const type = recorder.mimeType || mimeType || "audio/webm";
      const file = new File(chunks, `recording.${type.startsWith("audio/mp4") ? "m4a" : "webm"}`, { type });
      const check = checkAudioFile(file);
      if (!check.ok) {
        setState("idle");
        return setError(NO_RECORDING);
      }
      const durationSec = Math.min((Date.now() - t0) / 1000, MAX_RECORDING_SEC);
      const { extension, contentType } = check;
      const audio: PickedAudio = { kind: "record", file, extension, contentType, title: "Voice note", artist: "", durationSec };
      setTake({ audio, src: URL.createObjectURL(file) });
      setSecs(durationSec);
      setState("done");
    };
    recorder.start();
    const timer = window.setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      setSecs(Math.min(s, MAX_RECORDING_SEC));
      if (s >= MAX_RECORDING_SEC) stop();
    }, 200);
    live.current = { recorder, stream, timer };
    setError(null);
    setSecs(0);
    setState("recording");
  };

  const reset = () => {
    if (take) URL.revokeObjectURL(take.src);
    setTake(null);
    setSecs(0);
    setState("idle");
  };

  useEffect(
    () => () => {
      const r = live.current;
      if (!r) return;
      clearInterval(r.timer);
      r.recorder.onstop = null;
      if (r.recorder.state !== "inactive") r.recorder.stop();
      r.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return { state, secs, take, error, start, stop, reset };
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
const wordmark: CSSProperties = { fontFamily: "var(--font-display)", fontSize: "var(--wordmark)", lineHeight: 0.85 };
const mono: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 12 };
const errorLine: CSSProperties = { ...mono, color: "var(--signal-error)" };
const ACCEPT = "audio/*,.mp3,.wav,.flac,.m4a,.aac";

/**
 * The scan's first screen: who you scanned, their theme if any, and three ways
 * to drop: paste a link, upload a file, or record one here. A file or a take
 * goes on to the same details step as a link (onSubmitFile).
 */
export function DropForm({
  owner,
  count,
  status,
  message,
  onSubmitUrl,
  onSubmitFile,
  onSkip,
  onError,
}: {
  owner: Owner;
  count: number;
  status: UrlFormStatus;
  message?: string;
  onSubmitUrl: (url: string) => void;
  onSubmitFile: (audio: PickedAudio) => void;
  onSkip: () => void;
  onError: (message?: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("link");
  const [val, setVal] = useState("");
  const [spotify, setSpotify] = useState<string | null>(null);
  const [upload, setUpload] = useState<Local | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const rec = useRecorder();
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

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

  const selectMode = (m: Mode) => {
    if (rec.state === "recording") rec.stop();
    setMode(m);
  };

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const check = checkAudioFile(file);
    if (!check.ok) return setFileError(check.error);
    if (upload) URL.revokeObjectURL(upload.src);
    setFileError(null);
    const { extension, contentType } = check;
    const audio: PickedAudio = { kind: "upload", file, extension, contentType, ...namesFromFile(file.name), durationSec: null };
    setUpload({ audio, src: URL.createObjectURL(file) });
  };

  // One preview player: the picked file on Upload, the take on Record. Changing source stops it.
  const local = mode === "upload" ? upload : mode === "record" ? rec.take : null;
  const togglePlay = () => {
    const a = player.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  };
  // A file the browser can't decode won't play for anyone either.
  const unplayable = () => {
    if (mode !== "upload" || !upload) return;
    URL.revokeObjectURL(upload.src);
    setUpload(null);
    setFileError("Can’t play that file. Try MP3, WAV or FLAC.");
  };
  const gotDuration = () => {
    const d = player.current?.duration;
    if (mode !== "upload" || !d || !Number.isFinite(d)) return;
    setUpload((u) => u && { ...u, audio: { ...u.audio, durationSec: d } });
  };

  const ready = mode === "upload" ? upload : mode === "record" && rec.state === "done" ? rec.take : null;
  const next = () => {
    if (!ready) return;
    player.current?.pause();
    setFileError(null);
    onSubmitFile(ready.audio);
  };

  const themeLead = owner.theme ? "Stick to the theme, or don’t. " : "";
  const fileMeta = upload
    ? [
        upload.audio.extension.toUpperCase(),
        `${(upload.audio.file.size / 1e6).toFixed(1)} MB`,
        upload.audio.durationSec ? fmtTime(upload.audio.durationSec, true) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

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

        <div role="tablist" aria-label="How to drop" className={styles.tabs}>
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`dat-tab-${id}`}
              aria-selected={mode === id}
              aria-controls="dat-panel"
              className={styles.tab}
              onClick={() => selectMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div id="dat-panel" role="tabpanel" aria-labelledby={`dat-tab-${mode}`} style={{ minHeight: 232, display: "flex", flexDirection: "column" }}>
          {mode === "link" && (
            <UrlForm
              value={val}
              onChange={change}
              status={status}
              message={message}
              onSubmit={submit}
              hint={owner.theme ? "Stick to the theme, or don’t. Bandcamp, SoundCloud or YouTube." : undefined}
            />
          )}

          {mode === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upload ? (
                <div style={{ display: "flex", flexDirection: "column", border: "var(--rule)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}>
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={playing ? "Pause" : "Play"}
                      style={{ flex: "none", width: 48, height: 48, border: 0, background: "var(--magenta)", color: "var(--ink)", fontSize: 18, cursor: "pointer" }}
                    >
                      {playing ? "❚❚" : "▶︎"}
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ ...ellipsis, fontFamily: "var(--font-display-wide)", fontSize: 16, textTransform: "uppercase" }}>
                        {upload.audio.file.name.replace(/\.[^.]+$/, "")}
                      </span>
                      <span style={mono}>{fileMeta}</span>
                    </div>
                  </div>
                  <label className={styles.replace}>
                    <input type="file" accept={ACCEPT} onChange={pickFile} className={styles.fileInput} />
                    Replace file
                  </label>
                </div>
              ) : (
                <label className={styles.pick}>
                  <input type="file" accept={ACCEPT} onChange={pickFile} className={styles.fileInput} />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 0.85, textTransform: "uppercase" }}>Choose a file</span>
                  <span style={mono}>MP3, WAV, FLAC, M4A · 50 MB max</span>
                </label>
              )}
              {fileError && (
                <span role="alert" style={errorLine}>
                  {fileError}
                </span>
              )}
              <span style={mono}>{themeLead}Your own music, or something you have the right to share.</span>
            </div>
          )}

          {mode === "record" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", border: "var(--rule)" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, padding: "16px 12px 12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={monoCaps}>{rec.state === "recording" ? "● Recording" : rec.state === "done" ? "Take" : "Ready"}</span>
                    <span
                      role="timer"
                      style={{ fontFamily: "var(--font-display)", fontSize: "min(56px, 13.5vw)", lineHeight: 0.82, fontVariantNumeric: "tabular-nums" }}
                    >
                      {fmtTime(rec.secs, true)}
                    </span>
                  </div>
                  <span style={{ ...mono, whiteSpace: "nowrap" }}>/ {fmtTime(MAX_RECORDING_SEC, true)}</span>
                </div>
                <div style={{ height: 6, background: "var(--gray-200)", borderTop: "1px solid var(--ink)" }}>
                  <div style={{ height: "100%", width: `${((rec.secs / MAX_RECORDING_SEC) * 100).toFixed(1)}%`, background: "var(--magenta)" }} />
                </div>
                <div style={{ display: "flex", borderTop: "var(--rule)" }}>
                  {rec.state === "idle" && (
                    <button type="button" onClick={rec.start} className={`${styles.big} ${styles.record}`}>
                      <span aria-hidden style={{ width: 14, height: 14, background: "var(--magenta)" }} />
                      Record
                    </button>
                  )}
                  {rec.state === "recording" && (
                    <button type="button" onClick={rec.stop} className={`${styles.big} ${styles.stop}`}>
                      <span aria-hidden style={{ width: 14, height: 14, background: "var(--ink)" }} />
                      Stop
                    </button>
                  )}
                  {rec.state === "done" && (
                    <>
                      <button type="button" onClick={togglePlay} className={styles.big}>
                        {playing ? "❚❚ Pause" : "▶︎ Play"}
                      </button>
                      <button type="button" onClick={rec.reset} className={styles.big}>
                        Redo
                      </button>
                    </>
                  )}
                </div>
              </div>
              {rec.error && (
                <span role="alert" style={errorLine}>
                  {rec.error}
                </span>
              )}
              <span style={mono}>{themeLead}Hum it, play it, say why. Three minutes max.</span>
            </div>
          )}
        </div>

        {ready && (
          <Button variant="accent" size="lg" fullWidth iconRight="→" onClick={next}>
            Next
          </Button>
        )}

        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
          {count} {count === 1 ? "track" : "tracks"} in the bag. You get one drop {"—"} make it count.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "var(--rule)", paddingTop: 16 }}>
          <span style={mono}>Just looking?</span>
          <Button variant="outline" iconRight="→" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </section>
      <audio
        ref={player}
        src={local?.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEmptied={() => setPlaying(false)}
        onLoadedMetadata={gotDuration}
        onError={unplayable}
        hidden
      />
      {spotify && <SpotifyModal url={spotify} onClose={closeSpotify} />}
    </main>
  );
}
