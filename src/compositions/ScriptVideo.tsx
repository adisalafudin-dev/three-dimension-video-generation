import type { ReactElement } from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type { Storyboard, TransitionType } from "../script/types";
import { enterFrames } from "../script/timing";
import { ChapterView } from "../scenes/ChapterView";
import { groupChapters } from "../script/chapters";

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
  const chapters = groupChapters(scenes, fps);

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {chapters.flatMap((chapter, i) => {
          const scene = chapter.scenes[0]; // a transition belongs to the scene that enters
          const enter = enterFrames(scenes, chapter.firstIndex, fps);
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
              durationInFrames={chapter.frames}
              name={scene.chapter ?? scene.title}
            >
              <ChapterView chapter={chapter} />
            </TransitionSeries.Sequence>,
          );

          return items;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
