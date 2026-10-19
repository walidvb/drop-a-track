import { prog } from "../anim";
import { BAG, DROP, WEARER, type Track } from "../data";
import { FAMILY, useFit } from "../theme";
import { UI_W } from "../components/Phone";
import { Cover, ellipsis, fmtTime, monoCaps, padNumber, sourceCode } from "./kit";

/** components/ds/TrackRow.tsx, inside a bag (ruled): inverted while it plays. */
function Row({ track, index, active }: { track: Track; index: number; active: boolean }) {
  const who = `${track.droppedBy}, ${track.droppedFrom}`;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px 48px minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 12,
        minHeight: "var(--row-h)",
        padding: "8px 0 8px 12px",
        borderBottom: "var(--rule)",
        background: active ? "var(--ink)" : "var(--paper)",
        color: active ? "var(--paper)" : "var(--ink)",
      }}
    >
      <span style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 0.85, WebkitTextFillColor: active ? "currentColor" : "transparent", WebkitTextStroke: "1.5px currentColor" }}>
        {active ? "▶︎" : String(index).padStart(2, "0")}
      </span>
      <Cover track={track} size={48} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
        <span style={{ ...ellipsis, fontFamily: "var(--font-display-wide)", fontSize: 15, lineHeight: 1.05, textTransform: "uppercase" }}>{track.title}</span>
        <span style={{ ...ellipsis, fontWeight: 700, fontSize: 13 }}>{track.artist}</span>
        <span style={{ ...ellipsis, fontFamily: "var(--font-mono)", fontSize: 11 }}>{`${who} · ${track.droppedAt}`}</span>
      </div>
      <span style={{ ...monoCaps, alignSelf: "stretch", display: "flex", alignItems: "center", minWidth: 44, padding: "0 12px", borderLeft: "1px solid currentColor", whiteSpace: "nowrap" }}>
        {sourceCode(track.source)} ↗
      </span>
    </div>
  );
}

/**
 * The wearer's bag, playing (app/Browse.tsx with a bag open, and the player docked
 * under it). Rows slide down one after the other, 200ms apart, as in the app.
 */
export function BagScreen({ f }: { f: number }) {
  const handleSize = useFit([WEARER.handle], FAMILY.display, UI_W - 24, 96);
  const played = 84 + Math.max(0, f - 30) / 30;
  const player = prog(f, 30, 9);
  const pct = Math.min(100, (played / DROP.duration) * 100);
  return (
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--ink)", color: "var(--paper)", display: "flex", flexDirection: "column", gap: 16, padding: "12px 12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ ...monoCaps, fontSize: 12, minHeight: 44, display: "flex", alignItems: "center" }}>← Latest drops</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 48, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "1.5px var(--paper)" }}>
            #{padNumber(WEARER.number)}
          </span>
        </div>
        <h2 style={{ margin: 0, fontWeight: "normal", fontFamily: "var(--font-display)", fontSize: handleSize, lineHeight: 0.82, letterSpacing: "-0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {WEARER.handle}
        </h2>
        <span style={{ ...monoCaps, fontSize: 12, color: "var(--gray-400)" }}>
          Since {WEARER.since} · {padNumber(BAG.length)} tracks
        </span>
      </header>
      {BAG.map((t, i) => {
        const p = prog(f, 4 + i * 6, 9);
        return (
          <div key={t.title} style={{ opacity: p, translate: `0 ${-10 * (1 - p)}px` }}>
            <Row track={t} index={BAG.length - i} active={i === 0 && f >= 30} />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, translate: `0 ${100 * (1 - player)}%` }}>
        <div style={{ ...monoCaps, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "var(--ink)", color: "var(--paper)", padding: "0 12px", minHeight: 32 }}>
          <span style={{ whiteSpace: "nowrap" }}>From {WEARER.handle}{"’"}s bag →</span>
          <span style={{ ...ellipsis, minWidth: 0, color: "var(--gray-400)" }}>{`${DROP.droppedBy}, ${DROP.droppedFrom} · ${DROP.droppedAt}`}</span>
        </div>
        <div style={{ background: "var(--ink)", color: "var(--paper)", display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", alignItems: "center", gap: 12, padding: "10px 12px", borderTop: "var(--border-w) solid var(--magenta)" }}>
          <Cover track={DROP} size={44} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ ...ellipsis, fontFamily: "var(--font-display-wide)", fontSize: 14, lineHeight: 1.05, textTransform: "uppercase" }}>{DROP.title}</span>
            <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gray-400)", whiteSpace: "nowrap" }}>
              <span>{DROP.artist}</span>
              <span>
                {fmtTime(played)} / {fmtTime(DROP.duration)}
              </span>
            </span>
            <div style={{ position: "relative", height: 14, display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "var(--gray-600)" }} />
              <div style={{ position: "absolute", left: 0, width: pct + "%", height: 4, background: "var(--magenta)" }} />
              <div style={{ position: "absolute", left: `calc(${pct}% - 2px)`, width: 4, height: 14, background: "var(--paper)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["❚❚", "▶︎▶︎"].map((g, i) => (
              <div
                key={g}
                style={{
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "var(--border-w) solid var(--paper)",
                  background: i === 0 ? "var(--magenta)" : "transparent",
                  color: i === 0 ? "var(--ink)" : "var(--paper)",
                  fontSize: i === 0 ? 16 : 12,
                  letterSpacing: "-2px",
                }}
              >
                {g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
