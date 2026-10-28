"use client";
// PROTOTYPE, wipe me: flips ?variant= with the arrows (or ← →). Never in production builds.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function Switcher({ variants }: { variants: [key: string, name: string][] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const i = Math.max(0, variants.findIndex(([k]) => k === (params.get("variant") ?? variants[0][0])));
  const go = (d: number) => {
    const q = new URLSearchParams(params);
    q.set("variant", variants[(i + d + variants.length) % variants.length][0]);
    router.replace(`${path}?${q}`, { scroll: false });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,[contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });
  if (process.env.NODE_ENV === "production") return null;
  const btn = { width: 32, height: 32, border: 0, borderRadius: 16, background: "#333", color: "#fff", cursor: "pointer" };
  return (
    <div
      style={{
        position: "fixed", left: "50%", top: 10, translate: "-50% 0", zIndex: 100,
        display: "flex", alignItems: "center", gap: 8, padding: 4, borderRadius: 20,
        background: "#0a0a0a", color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,.4)",
        font: "600 12px/1 system-ui", whiteSpace: "nowrap",
      }}
    >
      <button type="button" style={btn} onClick={() => go(-1)} aria-label="Previous variant">←</button>
      <span style={{ minWidth: 150, textAlign: "center" }}>{variants[i][0]} · {variants[i][1]}</span>
      <button type="button" style={btn} onClick={() => go(1)} aria-label="Next variant">→</button>
    </div>
  );
}
