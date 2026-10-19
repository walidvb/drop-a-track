import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Ui } from "../components/Phone";
import { DropFormScreen } from "../ui/DropForm";
import { SuccessScreen } from "../ui/Success";

// The app itself, full frame: the phone's screen once Scan has zoomed into it.

export function Form() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ui width={1080} height={1920}>
        <DropFormScreen f={f} />
      </Ui>
    </AbsoluteFill>
  );
}

export function Dropped() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ui width={1080} height={1920}>
        <SuccessScreen f={f} />
      </Ui>
    </AbsoluteFill>
  );
}
