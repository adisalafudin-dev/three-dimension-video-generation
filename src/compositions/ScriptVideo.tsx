import { AbsoluteFill, Sequence } from "remotion";
import type { Storyboard } from "../script/types";
import { SceneView } from "../scenes/SceneView";

export const sceneFrames = (duration: number, fps: number) =>
  Math.round(duration * fps);

export const ScriptVideo: React.FC<{ storyboard: Storyboard }> = ({
  storyboard,
}) => {
  const { scenes, fps } = storyboard;

  // Start frame of each scene = sum of the frames of all previous scenes
  const starts = scenes.reduce<number[]>((acc, scene, i) => {
    acc.push(
      i === 0 ? 0 : acc[i - 1] + sceneFrames(scenes[i - 1].duration, fps),
    );
    return acc;
  }, []);

  return (
    <AbsoluteFill>
      {scenes.map((scene, i) => (
        <Sequence
          key={i}
          from={starts[i]}
          durationInFrames={sceneFrames(scene.duration, fps)}
          name={scene.title}
        >
          <SceneView scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
