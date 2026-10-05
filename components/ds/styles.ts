import type { CSSProperties } from "react";

/** Small mono caps: chips, labels, metadata. */
export const monoCaps: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
};

/** One line, cut with "…". */
export const ellipsis: CSSProperties = { maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
