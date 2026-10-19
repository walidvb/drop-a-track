import { Composition } from "remotion";
import { FPS } from "./anim";
import { DropATrack, DURATION } from "./DropATrack";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="DropATrack" component={DropATrack} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
  );
};
