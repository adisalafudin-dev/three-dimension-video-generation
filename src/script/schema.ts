// Used only by scripts/parse-script.ts (Node). Do not import this from React code.
import { z } from "zod";
import type { Vec3 } from "./types";

export const SCENE_KEYS = [
  "duration",
  "shape",
  "model",
  "color",
  "rotationSpeed",
  "camera",
  "cameraTo",
  "cameraEase",
  "background",
] as const;

export const FRONTMATTER_KEYS = ["title", "fps", "width", "height"] as const;

const hexColor = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    "must be a hex color like #ff6b6b",
  );

const num = z
  .string()
  .transform((s) => Number(s))
  .refine((n) => Number.isFinite(n), "must be a number");

const vec3 = z
  .string()
  .transform((s) => s.split(",").map((p) => Number(p.trim())))
  .refine(
    (v): v is Vec3 => v.length === 3 && v.every((n) => Number.isFinite(n)),
    'must be exactly 3 numbers, like "0, 1, 5"',
  );

export const SceneSchema = z
  .object({
    duration: num
      .refine((n) => n >= 0.1, "must be at least 0.1 seconds")
      .optional(),
    shape: z
      .enum(["box", "sphere", "torus", "model"], {
        errorMap: () => ({
          message: "must be one of: box, sphere, torus, model",
        }),
      })
      .optional(),
    model: z
      .string()
      .regex(
        /\.(glb|gltf)$/i,
        "must be a .glb or .gltf path under public/, like models/duck.glb",
      )
      .optional(),
    color: hexColor.optional(),
    rotationSpeed: num.optional(),
    camera: vec3.optional(),
    cameraTo: vec3.optional(),
    cameraEase: z
      .enum(["linear", "ease-in", "ease-out", "ease-in-out"], {
        errorMap: () => ({
          message: "must be one of: linear, ease-in, ease-out, ease-in-out",
        }),
      })
      .optional(),
    background: hexColor.optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
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
    if (s.cameraEase && !s.cameraTo) {
      ctx.addIssue({
        code: "custom",
        path: ["cameraEase"],
        message: "has no effect without cameraTo",
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
  })
  .strict();
