import { AbsoluteFill, Series } from "remotion";
import "./theme";
import { Preload } from "./components/Texture";
import { Night } from "./scenes/Night";
import { Outro } from "./scenes/Outro";
import { Scan } from "./scenes/Scan";
import { Dropped, Form } from "./scenes/Screens";
import { WalkHome } from "./scenes/WalkHome";

/** The story, shot by shot. Lengths are whole beats at 120 BPM (15 frames). */
const SCENES = [
  { name: "Night", frames: 105, Scene: Night },
  { name: "Scan", frames: 105, Scene: Scan },
  { name: "Form", frames: 90, Scene: Form },
  { name: "Dropped", frames: 105, Scene: Dropped },
  { name: "Walk home", frames: 150, Scene: WalkHome },
  { name: "Outro", frames: 225, Scene: Outro },
];

export const DURATION = SCENES.reduce((n, s) => n + s.frames, 0);

export function DropATrack() {
  return (
    <AbsoluteFill style={{ background: "var(--ink)", fontFamily: "var(--font-body)" }}>
      <Preload />
      <Series>
        {SCENES.map(({ name, frames, Scene }) => (
          <Series.Sequence key={name} name={name} durationInFrames={frames}>
            <Scene />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
}
