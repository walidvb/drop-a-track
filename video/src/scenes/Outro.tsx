import { AbsoluteFill, useCurrentFrame } from "remotion";
import { enter } from "../anim";
import { Ui } from "../components/Phone";
import { Words } from "../components/Stage";
import { Texture } from "../components/Texture";
import { PosterScreen } from "../ui/Poster";

/** How long the club's line holds before the poster: long enough to read it. */
const PITCH = 120;

/** What the D.A.T club is, then the poster as the home page shows it, with a code to scan. */
export function Outro() {
  const f = useCurrentFrame();
  if (f >= PITCH) {
    return (
      <AbsoluteFill>
        <Ui width={1080} height={1920}>
          <PosterScreen f={f - PITCH} height={1920 / (1080 / 432)} />
        </Ui>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "var(--ink)", color: "var(--paper)", overflow: "hidden" }}>
      <Texture name="17" color="var(--paper)" opacity={0.18} style={{ inset: "-20% -60%", scale: String(1 + f * 0.0015) }} />
      <AbsoluteFill style={{ padding: 64, justifyContent: "center", gap: 56 }}>
        <Words lines={["The D.A.T", "club"]} at={[4, 15]} frame={f} />
        <p style={{ margin: 0, maxWidth: 952, fontWeight: 800, fontSize: 64, lineHeight: 1.12, letterSpacing: "-0.01em", ...enter(f, 26, [0, 30], 12) }}>
          A participatory project by and for music lovers, inspired by{" "}
          <span style={{ color: "var(--magenta)" }}>mixtapes passed hand to hand</span> in simpler times.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
