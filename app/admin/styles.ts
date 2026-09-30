import type { CSSProperties } from "react";

/** Admin is a tool, not a poster: plain, dense, on-brand enough. */
export const adminStyles = {
  page: { background: "var(--paper)", minHeight: "100vh", padding: 24, display: "flex", flexDirection: "column", gap: 16, fontFamily: "var(--font-body)" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "normal", fontSize: 44, lineHeight: 0.82 },
  warn: { margin: 0, background: "var(--signal-error)", color: "var(--paper)", padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: 12 },
  row: { display: "flex", gap: 8, alignItems: "center" },
  input: { height: 36, padding: "0 8px", border: "var(--rule)", fontFamily: "var(--font-mono)", fontSize: 14 },
  button: { height: 36, padding: "0 12px", border: "var(--rule)", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-heavy)", textTransform: "uppercase", cursor: "pointer" },
  table: { borderCollapse: "collapse", width: "100%" },
  th: { textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", borderBottom: "var(--rule)", padding: 8 },
  td: { verticalAlign: "top", borderBottom: "var(--rule-hair)", padding: 8, fontFamily: "var(--font-mono)", fontSize: 13 },
  code: { display: "block", marginTop: 6, fontSize: 11 },
} satisfies Record<string, CSSProperties>;
