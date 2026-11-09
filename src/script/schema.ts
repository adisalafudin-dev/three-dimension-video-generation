// Used only by scripts/parse-script.ts (Node). Do not import this from React code.
import { z } from "zod";
import type { Vec3 } from "./types";

export const SCENE_KEYS = [
  "duration",
  "shape",
  "model",
  "animation",
  "animationSpeed",
  "modelRotate",
  "color",
  "chapter",
  "kit",
  "narration",
  "rotationSpeed",
  "camera",
  "cameraTo",
  "cameraEase",
  "background",
  "theme",
  "themeDetail",
  "time",
  "weather",
  "transition",
  "transitionDuration",
  "audio",
  "audioVolume",
  "words",
] as const;
export const FRONTMATTER_KEYS = [
  "title",
  "fps",
  "width",
  "height",
  "voice",
] as const;

export const BEAT_TYPES = [
  "title",
  "tag",
  "badge",
  "quote",
  "stat",
  "checklist",
  "callout",
  "camera",
  "explode",
  "highlight",
  "drive",
  "rain",
  "motion",
  "pose",
] as const;

const hexColor = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    "must be a hex color like #ff6b6b",
  );

export const BEAT_FIELDS: Record<
  (typeof BEAT_TYPES)[number],
  readonly string[]
> = {
  title: ["eyebrow", "text", "for"],
  tag: ["text", "for"],
  badge: ["text", "for"],
  quote: ["text", "by", "for"],
  stat: ["value", "label", "for"],
  checklist: ["items", "for"],
  callout: ["text", "x", "y", "at", "for"],
  camera: ["pos", "ease"],
  explode: ["amount", "for"],
  highlight: ["layer", "for"],
  drive: ["to", "for"],
  rain: ["intensity", "for"],
  motion: ["preset", "target", "from", "for", "ease", "turns", "tumble", "loop"],
  pose: ["style", "for", "amount"],
};

const beatText = z.string().min(1, "must not be empty");

const num = z
  .string()
  .transform((s) => Number(s))
  .refine((n) => Number.isFinite(n), "must be a number");

const beatFor = num
  .refine((n) => n >= 0.2, "must be at least 0.2 seconds")
  .optional();
const percent = num.refine(
  (n) => n >= 0 && n <= 100,
  "must be between 0 and 100",
);
const items = z
  .string()
  .transform((s) =>
    s
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean),
  )
  .refine(
    (v) => v.length >= 1 && v.length <= 5,
    'must be 1 to 5 items separated by "|", like "one | two | three"',
  );

const vec3 = z
  .string()
  .transform((s) => s.split(",").map((p) => Number(p.trim())))
  .refine(
    (v): v is Vec3 => v.length === 3 && v.every((n) => Number.isFinite(n)),
    'must be exactly 3 numbers, like "0, 1, 5"',
  );

export const BeatSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("title"),
      eyebrow: beatText.optional(),
      text: beatText,
      for: beatFor,
    })
    .strict(),
  z.object({ type: z.literal("tag"), text: beatText, for: beatFor }).strict(),
  z.object({ type: z.literal("badge"), text: beatText, for: beatFor }).strict(),
  z
    .object({
      type: z.literal("quote"),
      text: beatText,
      by: beatText.optional(),
      for: beatFor,
    })
    .strict(),
  z
    .object({
      type: z.literal("stat"),
      value: beatText,
      label: beatText,
      for: beatFor,
    })
    .strict(),
  z.object({ type: z.literal("checklist"), items, for: beatFor }).strict(),
  z
    .object({
      type: z.literal("callout"),
      text: beatText,
      x: percent.optional(),
      y: percent.optional(),
      at: vec3.optional(),
      for: beatFor,
    })
    .strict(),
  z
    .object({
      type: z.literal("explode"),
      amount: num.refine((n) => n >= 0 && n <= 3, "must be between 0 and 3"),
      for: beatFor,
    })
    .strict(),
  z
    .object({ type: z.literal("highlight"), layer: beatText, for: beatFor })
    .strict(),
  z
    .object({
      type: z.literal("drive"),
      to: num.refine((n) => n >= -8 && n <= 8, "must be between -8 and 8"),
      for: beatFor,
    })
    .strict(),
  z
    .object({
      type: z.literal("rain"),
      intensity: num.refine((n) => n >= 0 && n <= 1, "must be between 0 and 1"),
      for: beatFor,
    })
    .strict(),
  z
    .object({
      type: z.literal("camera"),
      pos: vec3,
      ease: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"]).optional(),
    })
    .strict(),
  z.object({
    type: z.literal("motion"),
    preset: z.enum(["fall-into", "launch", "fly-to", "drive", "orbit", "float"]),
    target: vec3.optional(), from: vec3.optional(), for: num.refine((n) => n >= 0.2, "must be at least 0.2 seconds"),
    ease: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"]).optional(),
    turns: num.refine((n) => n >= 0 && n <= 20, "must be between 0 and 20").optional(),
    tumble: num.refine((n) => n >= 0 && n <= 1, "must be between 0 and 1").optional(),
    loop: z.enum(["on", "off"]).optional(),
  }).strict(),
  z.object({
    type: z.literal("pose"),
    style: z.enum(["flail", "float", "run", "wave"]),
    for: beatFor,
    amount: num.refine((n) => n >= 0 && n <= 1, "must be between 0 and 1").optional(),
  }).strict(),
]);

export const SceneSchema = z
  .object({
    duration: z
      .string()
      .transform((s) => (s.trim() === "auto" ? ("auto" as const) : Number(s)))
      .refine(
        (v) => v === "auto" || (Number.isFinite(v) && v >= 0.1),
        'must be a number of at least 0.1 seconds, or "auto" (needs narration)',
      )
      .optional(),
    shape: z.enum(["box", "sphere", "torus", "model"]).optional(),
    model: z
      .string()
      .regex(
        /\.(glb|gltf)$/i,
        "must be a .glb or .gltf path under public/, like models/duck.glb",
      )
      .optional(),
    animation: z.union([z.string().min(1), num.refine((n) => Number.isInteger(n) && n >= 0, "must be a zero-based clip index")]).optional(),
    animationSpeed: num.refine((n) => n > 0, "must be greater than 0").optional(),
    modelRotate: z.enum(["on", "off"]).optional(),
    color: hexColor.optional(),
    chapter: z
      .string()
      .regex(/^[\w-]+$/, "must use letters, digits, - and _ only")
      .optional(),
    kit: z.enum(["layers", "road"]).optional(),
    narration: z
      .string()
      .transform((s) =>
        s
          .trim()
          .replace(/^"([\s\S]*)"$/, "$1")
          .trim(),
      )
      .refine((t) => t.length > 0, "must not be empty")
      .refine(
        (t) => t.length <= 400,
        "must be at most 400 characters (split it into more scenes)",
      )
      .optional(),
    rotationSpeed: num.optional(),
    camera: vec3.optional(),
    cameraTo: vec3.optional(),
    cameraEase: z
      .enum(["linear", "ease-in", "ease-out", "ease-in-out"])
      .optional(),
    background: z.string().refine((v) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) || /^gradient\(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}),\s*#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}),\s*\d+(?:\.\d+)?deg\)$/.test(v) || /^image\([\w./-]+\.(?:png|jpe?g|webp)\)$/i.test(v), "must be a hex color, gradient(#hex, #hex, 180deg), or image(images/file.jpg)").optional(),
    theme: z.enum(["space", "farm", "city", "ocean", "forest", "desert", "indoor", "lab", "highway"]).optional(),
    themeDetail: z.enum(["low", "high"]).optional(),
    time: z.enum(["dawn", "day", "dusk", "night"]).optional(),
    weather: z.enum(["clear", "rain", "fog", "snow", "dust"]).optional(),
    transition: z.enum(["none", "fade", "slide", "wipe"]).optional(),
    transitionDuration: num
      .refine((n) => n >= 0.1, "must be at least 0.1 seconds")
      .optional(),
    audio: z
      .string()
      .regex(
        /\.(mp3|wav|m4a|aac|ogg)$/i,
        "must be an audio path under public/, like audio/intro.mp3",
      )
      .optional(),
    audioVolume: num
      .refine((n) => n >= 0 && n <= 1, "must be between 0 and 1")
      .optional(),
    words: z
      .string()
      .regex(
        /\.json$/i,
        "must be a .json path under public/, like audio/scene1.words.json",
      )
      .optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.kit) {
      for (const k of ["shape", "model", "animation", "animationSpeed", "modelRotate", "color", "rotationSpeed"] as const) {
        if (s[k] !== undefined) {
          ctx.addIssue({
            code: "custom",
            path: [k],
            message: `not allowed with kit "${s.kit}" (kits have their own look)`,
          });
        }
      }
    }
    if (s.theme && s.background) ctx.addIssue({ code: "custom", path: ["background"], message: 'cannot be combined with "theme"' });
    if (s.themeDetail && !s.theme) ctx.addIssue({ code: "custom", path: ["themeDetail"], message: 'requires "theme"' });
    if (s.time && !s.theme) ctx.addIssue({ code: "custom", path: ["time"], message: 'requires "theme"' });
    if (s.weather && !s.theme) ctx.addIssue({ code: "custom", path: ["weather"], message: 'requires "theme"' });
    if (s.words && !s.audio) {
      ctx.addIssue({
        code: "custom",
        path: ["words"],
        message: "has no effect without audio",
      });
    }
    if (s.shape === "model" && !s.model) {
      ctx.addIssue({
        code: "custom",
        path: ["model"],
        message: 'required when shape is "model"',
      });
    }
    if (s.model && s.shape !== "model") {
      ctx.addIssue({
        code: "custom",
        path: ["model"],
        message: 'only used when shape is "model"',
      });
    }
    for (const k of ["animation", "animationSpeed", "modelRotate"] as const) {
      if (s[k] !== undefined && s.shape !== "model") ctx.addIssue({ code: "custom", path: [k], message: 'only used when shape is "model"' });
    }
    if (s.animationSpeed !== undefined && s.animation === undefined) ctx.addIssue({ code: "custom", path: ["animationSpeed"], message: 'requires an "animation" clip' });
    if (s.cameraEase && !s.cameraTo) {
      ctx.addIssue({
        code: "custom",
        path: ["cameraEase"],
        message: "has no effect without cameraTo",
      });
    }
    if (
      s.transitionDuration !== undefined &&
      (!s.transition || s.transition === "none")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["transitionDuration"],
        message: 'has no effect without a transition other than "none"',
      });
    }
    if (s.narration && (s.audio || s.words)) {
      for (const k of ["audio", "words"] as const) {
        if (s[k]) {
          ctx.addIssue({
            code: "custom",
            path: [k],
            message:
              "not allowed with narration (audio and word timings come from npm run voice)",
          });
        }
      }
    }
    if (s.audioVolume !== undefined && !s.audio && !s.narration) {
      ctx.addIssue({
        code: "custom",
        path: ["audioVolume"],
        message: "has no effect without audio",
      });
    }
  });

const evenInt = () =>
  z
    .number()
    .int()
    .positive()
    .refine((n) => n % 2 === 0, "must be an even number (H.264 requirement)");

export const FrontmatterSchema = z
  .object({
    title: z.coerce.string().optional(),
    fps: z.number().int().min(1).max(120).optional(),
    width: evenInt().optional(),
    height: evenInt().optional(),
    voice: z
      .string()
      .regex(/^[\w-]+$/, "must be an Edge voice name like en-US-GuyNeural")
      .optional(),
  })
  .strict();

const wordSchema = z
  .object({
    text: z.string().min(1),
    startMs: z.number().min(0),
    endMs: z.number().min(0),
    timestampMs: z.number().nullable().optional(),
    confidence: z.number().nullable().optional(),
  })
  .refine((w) => w.endMs > w.startMs, {
    error: "endMs must be greater than startMs",
    path: ["endMs"],
  });

export const WordsFileSchema = z
  .array(wordSchema)
  .min(1, "must contain at least one word")
  .superRefine((words, ctx) => {
    for (let i = 1; i < words.length; i++) {
      if (words[i].startMs < words[i - 1].startMs) {
        ctx.addIssue({
          code: "custom",
          path: [i, "startMs"],
          message: "must not be earlier than the previous word",
        });
      }
    }
  });

// --- Kits: static parts ("+ <part> key=value ...") and which parts/actions each kit accepts ---
export const KIT_PART_FIELDS = {
  layer: ["name", "color", "thickness"],
  rain: ["intensity"],
  car: ["color"],
} as const;
export const KIT_PART_TYPES = ["layer", "rain", "car"] as const;

export const KIT_PARTS_BY_KIT = {
  layers: ["layer"],
  road: ["rain", "car"],
} as const;

export const KIT_ACTIONS_BY_KIT = {
  layers: ["explode", "highlight"],
  road: ["drive", "rain"],
} as const;

export const KitPartSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("layer"),
      name: beatText,
      color: hexColor,
      thickness: num.refine(
        (n) => n >= 0.05 && n <= 1,
        "must be between 0.05 and 1",
      ),
    })
    .strict(),
  z
    .object({
      type: z.literal("rain"),
      intensity: num.refine((n) => n >= 0 && n <= 1, "must be between 0 and 1"),
    })
    .strict(),
  z.object({ type: z.literal("car"), color: hexColor }).strict(),
]);

export const ScenePropSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("planet"), color: hexColor, radius: num.refine((n) => n > 0, "must be greater than 0"), pos: vec3, ring: z.enum(["on", "off"]).optional() }).strict(),
  z.object({ type: z.literal("blackhole"), radius: num.refine((n) => n > 0, "must be greater than 0"), pos: vec3 }).strict(),
]);
