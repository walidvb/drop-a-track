import type { Provider } from "@cucu/media/core";

export const SOURCE_LABEL: Record<Provider, string> = {
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
};

/** The short code shown on rows and placeholder covers ("BC"), from a provider's display name. */
const SOURCE_CODE: Record<Provider, string> = { youtube: "YT", soundcloud: "SC", bandcamp: "BC" };
export const sourceCode = (source?: string | null) =>
  SOURCE_CODE[(source ?? "").toLowerCase().replace(/[^a-z]/g, "") as Provider] ?? (source ? source.slice(0, 2).toUpperCase() : "--");

export const padNumber = (n: number) => String(n).padStart(3, "0");

/** "06.2026", as on the poster. */
export const monthYear = (d: Date) => `${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;

/** "Just now", "5m ago", "3h ago", "2d ago", "3w ago", then "06.2026". */
export function relativeTime(d: Date, now = new Date()): string {
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  if (s < 8 * 7 * 86400) return `${Math.floor(s / (7 * 86400))}w ago`;
  return monthYear(d);
}
