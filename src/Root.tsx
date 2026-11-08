import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { ScriptVideo } from "./compositions/ScriptVideo";
import storyboardJson from "./generated/storyboard.json";
import type { Storyboard } from "./script/types";
import { totalFrames } from "./script/timing";

const storyboard = storyboardJson as unknown as Storyboard;

type Props = { storyboard: Storyboard };

const calculateMetadata: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: Math.max(1, totalFrames(props.storyboard)),
  fps: props.storyboard.fps,
  width: props.storyboard.width,
  height: props.storyboard.height,
});

// Explicit Zod schema for the composition props.
// Prevents Remotion Studio from inferring a schema from `defaultProps`,
// which would mix Zod v3 (project) and Zod v4 (@remotion/studio) schemas
// and throw: `Invalid element at key "color": expected a Zod schema`.
const ScriptVideoSchema = z.object({
  storyboard: z.object({
    title: z.string(),
    fps: z.number(),
    width: z.number(),
    height: z.number(),
    scenes: z.array(
      z.object({
        title: z.string(),
        duration: z.number(),
        shape: z.enum(["box", "sphere", "torus", "model"]),
        model: z.string().optional(),
        color: z.string(),
        rotationSpeed: z.number(),
        camera: z.array(z.number()),
        cameraTo: z.array(z.number()).optional(),
        cameraEase: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"]),
        transition: z.enum(["none", "fade", "slide", "wipe"]),
        transitionDuration: z.number(),
        audio: z.string().optional(),
        audioVolume: z.number(),
        background: z.string(),
        caption: z.string(),
        words: z
          .array(
            z.object({
              text: z.string(),
              startMs: z.number(),
              endMs: z.number(),
              timestampMs: z.number().nullable(),
              confidence: z.number().nullable(),
            }),
          )
          .optional(),
      }),
    ),
  }),
});

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ScriptVideo"
    component={ScriptVideo}
    defaultProps={{ storyboard }}
    schema={ScriptVideoSchema}
    fps={storyboard.fps}
    width={storyboard.width}
    height={storyboard.height}
    durationInFrames={Math.max(1, totalFrames(storyboard))}
    calculateMetadata={calculateMetadata}
  />
);
