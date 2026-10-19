import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BEAT, bounce, lerp, prog } from "../anim";
import { Person } from "../components/Person";
import { Phone, Ui } from "../components/Phone";
import { Chips, Words } from "../components/Stage";
import { Texture } from "../components/Texture";
import { BAG } from "../data";
import { BagScreen } from "../ui/Bag";

/** 06:40: the wearer walking home at sunrise, the bag playing on their phone. */
export function WalkHome() {
  const f = useCurrentFrame();
  const rise = prog(f, 42, 14);
  const n = BAG.length;
  return (
    <AbsoluteFill style={{ background: "var(--paper)", overflow: "hidden" }}>
      <Texture name="7" color="var(--magenta)" style={{ inset: "-200px -400px -580px", rotate: `${f * 0.05}deg`, scale: String(1.1 + f * 0.0008) }} />
      <Person
        width={860}
        tee="var(--paper)"
        outline="var(--ink)"
        print
        style={{
          left: -200,
          top: 840 - bounce(f * 2) * 14,
          rotate: `${Math.sin((Math.PI * f) / BEAT) * 1.2}deg`,
          scale: String(1 - f * 0.0004),
          transformOrigin: "50% 100%",
        }}
      />
      <Chips items={["Sun · 06:40", "The walk home"]} frame={f} inverse />
      <Words lines={[`${n} people.`, `${n} tracks.`]} at={[8, 23]} frame={f} top={250} color="var(--ink)" max={130} />
      <Phone x={410} y={lerp(1920, 470, rise)} width={620} rotate={lerp(8, 3, rise) + Math.sin(f / 11) * 0.6}>
        {(screen) => (
          <Ui width={screen.w} height={screen.h}>
            <BagScreen f={f - 50} />
          </Ui>
        )}
      </Phone>
    </AbsoluteFill>
  );
}
