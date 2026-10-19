import { ms, prog } from "../anim";
import { Qr } from "../components/Qr";
import { Texture } from "../components/Texture";
import { SITE } from "../data";
import { FAMILY, useFit } from "../theme";
import { UI_W } from "../components/Phone";
import { Button, monoCaps } from "./kit";

const STEPS = [
  ["01", "Flex your code.", "Your own QR code, printed on the back."],
  ["02", "Get scanned.", "Likeminded people point a phone at you."],
  ["03", "Get a drop", "They drop a single link into your bag. One per person."],
];

/**
 * The D.A.T poster (app/Poster.tsx) at phone size, coming in as on the home page:
 * DROP A up, TRACK right to left, then the rest fades in. For the end card, the
 * header holds a scannable QR and the address instead of the buttons.
 */
export function PosterScreen({ f, height }: { f: number; height: number }) {
  // TRACK fills the height, its column is as wide as the word is tall, DROP A fills what's left.
  const trackSize = useFit(["TRACK"], FAMILY.display, height, 400, "0em");
  const leftW = UI_W - trackSize * 0.76;
  const dropSize = useFit(["DROP A"], FAMILY.display, leftW - 32, 260);
  const word = (delay: number) => prog(f, ms(delay), ms(560));
  const drop = word(0);
  const track = word(140);
  const reveal = prog(f, ms(560), ms(280), (t) => t);
  return (
    <main
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) auto",
        background: "var(--paper)",
      }}
    >
      <Texture name="b" color="var(--magenta)" style={{ inset: "-10%", transform: `scale(${1.05 + f * 0.0012}) rotate(${f * 0.03}deg)` }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "20px 16px 16px", gap: 20, minWidth: 0 }}>
        <header style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, opacity: reveal }}>
          <span style={{ ...monoCaps, fontSize: 10, background: "var(--paper)", padding: "3px 8px" }}>© A Diggers Delights project</span>
          <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
            <div style={{ background: "var(--paper)", border: "var(--rule)", padding: 8, boxShadow: "var(--shadow-hard-accent)", display: "flex" }}>
              <Qr size={92} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 38, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "2px var(--ink)" }}>D.A.T</span>
          </div>
          <Button variant="primary" size="md" iconRight="→" style={{ marginTop: 4 }}>
            {SITE}
          </Button>
        </header>
        <div style={{ flex: 1 }} />
        <section style={{ background: "var(--paper)", display: "flex", flexDirection: "column", opacity: reveal }}>
          <p style={{ margin: 0, padding: "12px 14px", fontWeight: 500, fontSize: 15, lineHeight: 1.25 }}>
            Inspired by mixtapes passed hand to hand in simpler times, the D.A.T club is a participatory project by and for music lovers.
          </p>
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--ink)" }}>
            {STEPS.map(([n, title, detail], i) => (
              <div key={n} style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4, borderTop: i ? "1px solid var(--ink)" : 0 }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "1.2px var(--ink)" }}>{n}</span>
                  <span style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15 }}>{title}</span>
                </span>
                <span style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.3, color: "var(--text-secondary)" }}>{detail}</span>
              </div>
            ))}
          </div>
        </section>
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: "inline-block",
              fontFamily: "var(--font-display)",
              fontSize: dropSize,
              lineHeight: 0.8,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              marginBottom: "-0.06em",
              opacity: drop,
              translate: `0 ${0.9 * (1 - drop)}em`,
            }}
          >
            DROP A
          </span>
        </div>
      </div>
      <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "flex-end" }}>
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontFamily: "var(--font-display)",
            fontSize: trackSize,
            lineHeight: 0.8,
            whiteSpace: "nowrap",
            marginLeft: "-0.04em",
            opacity: track,
            translate: `${0.9 * (1 - track)}em 0`,
          }}
        >
          TRACK
        </span>
      </div>
    </main>
  );
}
