import { Composition } from "remotion";
import { ScriptVideo, sceneFrames } from "./compositions/ScriptVideo";
import storyboardJson from "./generated/storyboard.json";
import type { Storyboard } from "./script/types";

const storyboard = storyboardJson as unknown as Storyboard;

const totalFrames = (sb: Storyboard) =>
  sb.scenes.reduce((sum, s) => sum + sceneFrames(s.duration, sb.fps), 0);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ScriptVideo"
    component={ScriptVideo}
    defaultProps={{ storyboard }}
    fps={storyboard.fps}
    width={storyboard.width}
    height={storyboard.height}
    durationInFrames={Math.max(1, totalFrames(storyboard))}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, totalFrames(props.storyboard)),
      fps: props.storyboard.fps,
      width: props.storyboard.width,
      height: props.storyboard.height,
    })}
  />
);
