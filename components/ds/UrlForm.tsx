"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";

export type UrlFormStatus = "idle" | "loading" | "success" | "error";

export function UrlForm({
  label = "Drop a track",
  hint = "Paste a Bandcamp, SoundCloud or YouTube link.",
  placeholder = "https://",
  value,
  onChange,
  onSubmit,
  status = "idle",
  message,
  submitLabel = "Next",
  inverse = false,
}: {
  label?: string | null;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  status?: UrlFormStatus;
  message?: string;
  submitLabel?: string;
  inverse?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  const fg = inverse ? "var(--paper)" : "var(--ink)";
  const bg = inverse ? "var(--ink)" : "var(--paper)";
  const bd = status === "error" ? "var(--signal-error)" : focus ? "var(--magenta)" : fg;
  const msgColor =
    status === "error"
      ? "var(--signal-error)"
      : status === "success"
        ? inverse
          ? "var(--signal-ok)"
          : "var(--ink)"
        : inverse
          ? "var(--text-muted-inverse)"
          : "var(--text-secondary)";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };
  return (
    <form
      // The caller validates links (scheme-less ones included); the browser's type=url check would block those.
      noValidate
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: "12px", color: fg, background: bg, fontFamily: "var(--font-body)" }}
    >
      {label ? (
        <label
          htmlFor="dat-url"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            lineHeight: "var(--lh-crush)",
            letterSpacing: "var(--tracking-display)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
      ) : null}
      <div style={{ display: "flex", border: "var(--border-w) solid " + bd, transition: "border-color var(--dur-fast) var(--ease-snap)" }}>
        <span
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            borderRight: "var(--border-w) solid " + bd,
            background: focus ? "var(--magenta)" : "transparent",
            color: focus ? "var(--ink)" : fg,
          }}
        >
          URL
        </span>
        <input
          id="dat-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            height: "var(--control-h-lg)",
            padding: "0 16px",
            border: 0,
            outline: 0,
            background: "transparent",
            color: fg,
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            letterSpacing: "var(--tracking-mono)",
          }}
        />
        <Button
          type="submit"
          variant={inverse ? "accent" : "primary"}
          size="lg"
          iconRight="→"
          disabled={status === "loading"}
          style={{ border: 0, borderLeft: "var(--border-w) solid " + bd }}
        >
          {status === "loading" ? "Reading…" : submitLabel}
        </Button>
      </div>
      <div
        role={status === "error" ? "alert" : undefined}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          letterSpacing: "var(--tracking-mono)",
          color: msgColor,
          textTransform: status === "idle" ? "none" : "uppercase",
        }}
      >
        {message || hint}
      </div>
    </form>
  );
}
