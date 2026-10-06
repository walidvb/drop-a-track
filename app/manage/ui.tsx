import Link from "next/link";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { monoCaps } from "@/components/ds/styles";
import { PASSWORD_MIN } from "@/lib/owner-auth";
import styles from "./manage.module.css";

/** What the actions redirect back with, as `?error=`. Codes, so a link can't put words on the page. */
const MESSAGES = {
  wrong: "Wrong shirt number or password.",
  slow: "Too many tries. Wait a few seconds and try again.",
  scan: "Scan your shirt again to set a password.",
  short: `Make it at least ${PASSWORD_MIN} characters.`,
  long: "That’s too long for a password.",
  mismatch: "The two passwords don’t match.",
  handle: "Names are 2–30 characters: a–z, 0–9, dot, dash, underscore.",
  taken: "Another shirt has that name.",
};
export type ManageError = keyof typeof MESSAGES;

export const mono: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 12 };
export const heading: CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontWeight: "normal", fontSize: 44, lineHeight: 0.82, letterSpacing: "-0.02em" };
export const lead: CSSProperties = { margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.2 };
export const outlined: CSSProperties = { fontFamily: "var(--font-display)", fontSize: 72, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "2px var(--ink)" };

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 0.85, color: "var(--ink)", textDecoration: "none" }}>
        DROP A<br />
        TRACK
      </Link>
      {children}
    </main>
  );
}

export function Field({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={styles.field}>
      <span style={monoCaps}>{label}</span>
      <input className={styles.input} {...input} />
    </label>
  );
}

/** The `?error=` line, if it's one of ours. */
export function ErrorLine({ code }: { code: string | string[] | undefined }) {
  const message = typeof code === "string" && code in MESSAGES ? MESSAGES[code as ManageError] : null;
  return message ? (
    <span role="alert" style={{ ...mono, color: "var(--signal-error)" }}>
      {message}
    </span>
  ) : null;
}

export const formClass = styles.form;
export const linkClass = styles.link;
