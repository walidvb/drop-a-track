import type { AnchorHTMLAttributes } from "react";
import { sourceCode } from "@/lib/format";
import styles from "./source-link.module.css";

/** A track's original: just ↗, and under the pointer its platform's code instead (BC, SC, YT). Opens in a new tab. */
export function SourceLink({
  url,
  source,
  className = "",
  ...rest
}: { url?: string; source?: string | null } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open on ${source ?? "its site"}`} className={`${styles.link} ${className}`} {...rest}>
      <span className={styles.icon} aria-hidden="true">
        ↗
      </span>
      <span className={styles.code} aria-hidden="true">
        {sourceCode(source)}
      </span>
    </a>
  );
}
