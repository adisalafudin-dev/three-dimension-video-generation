import type { ReactElement } from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type { Storyboard, TransitionType } from "../script/types";
import { enterFrames, sceneFrames } from "../script/timing";
import { SceneView } from "../scenes/SceneView";

type AnyPresentation = TransitionPresentation<Record<string, unknown>>;

const presentationFor = (t: Exclude<TransitionType, "none">) => {
  switch (t) {
    case "slide":
      return slide({ direction: "from-left" }) as unknown as AnyPresentation;
    case "wipe":
      return wipe({ direction: "from-left" }) as unknown as AnyPresentation;
    default:
      return fade() as unknown as AnyPresentation;
  }
};

export const ScriptVideo: React.FC<{ storyboard: Storyboard }> = ({
  storyboard,
}) => {
  const { scenes, fps } = storyboard;

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const enter = enterFrames(scenes, i, fps);
          const items: ReactElement[] = [];

          if (enter > 0 && scene.transition !== "none") {
            items.push(
              <TransitionSeries.Transition
                key={`t-${i}`}
                presentation={presentationFor(scene.transition)}
                timing={linearTiming({ durationInFrames: enter })}
              />,
            );
          }

          items.push(
            <TransitionSeries.Sequence
              key={`s-${i}`}
              durationInFrames={sceneFrames(scene.duration, fps)}
              name={scene.title}
            >
              <SceneView scene={scene} />
            </TransitionSeries.Sequence>,
          );

          return items;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
