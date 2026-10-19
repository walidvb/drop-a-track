import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Chips, ClubLights, Crowd, Words } from "../components/Stage";

/** How far the camera has pushed in on the shirt by the end of the night shot (Scan carries on from it). */
export const NIGHT_ZOOM = 1.3;

/** 02:14, the queue: backlit heads nodding, one white shirt with a code on its back. */
export function Night() {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 105], [1, NIGHT_ZOOM], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <ClubLights frame={f} />
      <Crowd frame={f} zoom={zoom} />
      <Chips items={["Sat · 02:14", "Somewhere in the queue"]} frame={f} />
      <Words lines={["Nice", "shirt."]} at={[15, 30]} frame={f} top={330} />
    </AbsoluteFill>
  );
}
