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
    chapter: z.string().optional(),
    fps: z.number(),
    width: z.number(),
    height: z.number(),
    scenes: z.array(
      z.object({
        title: z.string(),
        duration: z.preprocess(
          (val) =>
            typeof val === "string"
              ? val.trim() === "auto"
                ? "auto"
                : Number(val)
              : val,
          z.union([z.number(), z.literal("auto")]),
        ),
        shape: z.enum(["box", "sphere", "torus", "model"]),
        model: z.string().optional(),
        animation: z.union([z.string(), z.number()]).optional(),
        animationSpeed: z.number(),
        modelRotate: z.boolean(),
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
        theme: z.enum(["space", "farm"]).optional(),
        themeDetail: z.enum(["low", "high"]),
        motion: z.array(z.object({ start: z.number(), end: z.number(), preset: z.enum(["fall-into", "launch", "fly-to", "drive", "orbit", "float"]), target: z.array(z.number()).optional(), from: z.array(z.number()).optional(), ease: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"]), turns: z.number(), tumble: z.number(), loop: z.boolean() })),
        poses: z.array(z.object({ start: z.number(), end: z.number(), style: z.enum(["flail", "float", "run", "wave"]), amount: z.number(), fallbackTumble: z.boolean() })),
        props: z.array(z.discriminatedUnion("type", [z.object({ type: z.literal("planet"), color: z.string(), radius: z.number(), pos: z.array(z.number()), ring: z.boolean() }), z.object({ type: z.literal("blackhole"), radius: z.number(), pos: z.array(z.number()) })])),
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
        cameraKeys: z // before `beats`
          .array(
            z.object({
              time: z.number(),
              pos: z.array(z.number()),
              ease: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"]),
            }),
          )
          .optional(),
        beats: z
          .array(
            z.object({
              type: z.enum([
                "title",
                "tag",
                "badge",
                "quote",
                "stat",
                "checklist",
                "callout",
              ]),
              start: z.number(),
              end: z.number(),
              text: z.string().optional(),
              eyebrow: z.string().optional(),
              by: z.string().optional(),
              value: z.string().optional(),
              label: z.string().optional(),
              items: z.array(z.string()).optional(),
              x: z.number().optional(),
              y: z.number().optional(),
              at: z.array(z.number()).optional(),
            }),
          )
          .optional(),
        kit: z.enum(["layers", "road"]).optional(), // setelah `chapter`
        kitParts: z // sebelum `cameraKeys`
          .array(
            z.object({
              type: z.enum(["layer", "rain", "car"]),
              name: z.string().optional(),
              color: z.string().optional(),
              thickness: z.number().optional(),
              intensity: z.number().optional(),
            }),
          )
          .optional(),
        kitActions: z
          .array(
            z.object({
              type: z.enum(["explode", "highlight", "drive", "rain"]),
              start: z.number(),
              end: z.number(),
              amount: z.number().optional(),
              layer: z.string().optional(),
              to: z.number().optional(),
              intensity: z.number().optional(),
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
