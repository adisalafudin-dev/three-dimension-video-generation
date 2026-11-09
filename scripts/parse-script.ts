import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ZodIssue } from "zod";
import {
  FRONTMATTER_KEYS,
  FrontmatterSchema,
  SCENE_KEYS,
  SceneSchema,
  WordsFileSchema,
  KIT_ACTIONS_BY_KIT,
} from "../src/script/schema";
import { checkBeatOverlaps, parseBeatLine } from "./lib/beats";
import { narrationPaths, slugOf } from "./lib/narration";
import { parseKitPartLine, validateKitParts } from "./lib/kits";
import { parseSceneProp } from "./lib/props";
import type { Caption } from "@remotion/captions";
import type {
  Beat,
  CameraKey,
  KitAction,
  KitPart,
  SceneData,
  Storyboard,
} from "../src/script/types";
import { groupChapters } from "../src/script/chapters";
import { enterFrames } from "../src/script/timing";

const [input, output = "src/generated/storyboard.json"] = process.argv.slice(2);
if (!input) {
  console.error(
    "Usage: tsx scripts/parse-script.ts <input.md> [output.json]   (default output: src/generated/storyboard.json)",
  );
  process.exit(1);
}
const slug = slugOf(input);

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

// --- helpers ---------------------------------------------------------------

const distance = (a: string, b: string): number => {
  const d = Array.from(
    { length: a.length + 1 },
    (_, i) => [i, ...Array(b.length).fill(0)] as number[],
  );
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[a.length][b.length];
};

const suggest = (key: string, known: readonly string[]): string | null => {
  const lower = key.toLowerCase();
  const exact = known.find((k) => k.toLowerCase() === lower);
  if (exact) return exact;
  let best: string | null = null;
  let bestD = 3;
  for (const k of known) {
    const d = distance(lower, k.toLowerCase());
    if (d < bestD) {
      best = k;
      bestD = d;
    }
  }
  return best;
};

const describe = (
  issue: ZodIssue,
  raw: Record<string, unknown>,
  known: readonly string[],
): string[] => {
  if (issue.code === "unrecognized_keys") {
    return issue.keys.map((k) => {
      const s = suggest(k, known);
      return `key "${k}": unknown key${s ? ` (did you mean "${s}"?)` : ""}`;
    });
  }
  const key = String(issue.path[0] ?? "");
  const got = key && raw[key] !== undefined ? ` (got "${raw[key]}")` : "";
  return [`key "${key}": ${issue.message}${got}`];
};

// --- frontmatter -----------------------------------------------------------

const { data, content } = matter(fs.readFileSync(input, "utf8"));

const fm = FrontmatterSchema.safeParse(data);
if (!fm.success) {
  for (const issue of fm.error.issues) {
    for (const msg of describe(issue, data, FRONTMATTER_KEYS))
      fail(`Frontmatter: ${msg}`);
  }
}

// --- scenes ----------------------------------------------------------------

const scenes: SceneData[] = [];
const meta: { worldKeys: string[]; camera: boolean; parts: boolean }[] = [];

const blocks = content.split(/^## /m).slice(1); // text before the first "## " is ignored

if (blocks.length === 0)
  fail('No scenes found (each scene starts with a "## Title" line)');

// A scene's exit transition = the entry transition of the next scene (needed for `duration: auto`)
const peekExit = (bi: number): number => {
  const next = blocks[bi + 1];
  if (!next) return 0;
  const t = next.match(/^\s*-\s*transition:\s*(\w+)/m)?.[1];
  if (!t || t === "none") return 0;
  const d = Number(next.match(/^\s*-\s*transitionDuration:\s*([\d.]+)/m)?.[1]);
  return Number.isFinite(d) && d > 0 ? d : 0.5;
};
const AUTO_PADDING = 0.4; // seconds of silence after the last word

const readGlbAnimationNames = (file: string): string[] => {
  const bytes = fs.readFileSync(file);
  if (bytes.toString("ascii", 0, 4) !== "glTF" || bytes.readUInt32LE(4) !== 2) throw new Error("not a GLB 2.0 file");
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    if (length > bytes.length - offset - 8) throw new Error("invalid GLB chunk length");
    if (type === 0x4e4f534a) {
      const json = JSON.parse(bytes.toString("utf8", offset + 8, offset + 8 + length)) as { animations?: { name?: string }[] };
      return (json.animations ?? []).map((clip, i) => clip.name?.trim() || `Animation ${i}`);
    }
    offset += 8 + length;
  }
  throw new Error("GLB has no JSON chunk");
};
const readGlbNodeNames = (file: string): string[] => {
  const bytes = fs.readFileSync(file); let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
    if (length > bytes.length - offset - 8) throw new Error("invalid GLB chunk length");
    if (type === 0x4e4f534a) {
      const json = JSON.parse(bytes.toString("utf8", offset + 8, offset + 8 + length)) as { nodes?: { name?: string }[] };
      return (json.nodes ?? []).flatMap((n) => n.name ? [n.name] : []);
    }
    offset += 8 + length;
  }
  return [];
};

for (const [bi, block] of blocks.entries()) {
  const [rawTitle, ...lines] = block.split(/\r?\n/); // \r?\n: safe on Windows (CRLF)
  const title = rawTitle.trim();
  if (!title) {
    fail('A scene has an empty title (use "## Title")');
    continue;
  }

  const kv: Record<string, string> = {};
  const caption: string[] = [];
  const beatLines: string[] = [];
  const partLines: string[] = [];
  const before = errors.length;

  for (const line of lines) {
    const m = line.match(/^\s*-\s*(\w+):\s*(.+)$/);
    if (m) {
      if (m[1] in kv)
        fail(`Scene "${title}": key "${m[1]}": defined more than once`);
      kv[m[1]] = m[2].trim();
    } else if (/^\s*@/.test(line)) {
      beatLines.push(line.trim());
    } else if (/^\s*\+\s/.test(line)) {
      partLines.push(line.trim());
    } else if (/^\s*>/.test(line)) {
      caption.push(line.replace(/^\s*>\s?/, "").trim());
    } else if (/^\s*-[^-]/.test(line)) {
      fail(
        `Scene "${title}": cannot read line "${line.trim()}" (expected "- key: value")`,
      );
    }
  }

  const parsed = SceneSchema.safeParse(kv);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      for (const msg of describe(issue, kv, SCENE_KEYS))
        fail(`Scene "${title}": ${msg}`);
    }
    continue;
  }
  const s = parsed.data;

  if (s.model && !fs.existsSync(path.resolve("public", s.model))) {
    fail(`Scene "${title}": key "model": file not found at public/${s.model}`);
  }
  if (s.model && fs.existsSync(path.resolve("public", s.model)) && s.animation !== undefined) {
    try {
      if (!/\.glb$/i.test(s.model)) throw new Error("embedded animation lookup requires a .glb file");
      const names = readGlbAnimationNames(path.resolve("public", s.model));
      const index = typeof s.animation === "number" ? s.animation : names.indexOf(s.animation);
      if (index < 0 || index >= names.length) fail(`Scene "${title}": key "animation": clip ${JSON.stringify(s.animation)} not found in ${s.model}${names.length ? ` (available: ${names.join(", ")})` : " (model contains no animation clips)"}`);
    } catch (error) { fail(`Scene "${title}": key "animation": cannot read clips from ${s.model}: ${error instanceof Error ? error.message : String(error)}`); }
  }

  // narration: audio and word timings live at a fixed path, made by `npm run voice`
  const auto = narrationPaths(slug, bi + 1);
  const audio = s.narration ? auto.audio : s.audio;
  const wordsKey = s.narration ? auto.words : s.words;
  // "auto" is resolved below from the word timings; until then use a large value so beat checks do not misfire
  let duration = s.duration === "auto" ? 600 : (s.duration ?? 3);
  const audioMissing = !!audio && !fs.existsSync(path.resolve("public", audio));
  if (audioMissing) {
    fail(
      s.narration
        ? `Scene "${title}": narration audio is not generated yet (missing public/${audio}): run "npm run voice -- ${input}"`
        : `Scene "${title}": key "audio": file not found at public/${audio}`,
    );
  }
  if (s.duration === "auto" && !s.narration && !s.words) {
    fail(`Scene "${title}": key "duration": "auto" needs narration (or words)`);
  }

  let words: Caption[] | undefined;
  if (wordsKey) {
    const wordsFile = path.resolve("public", wordsKey);
    if (!fs.existsSync(wordsFile)) {
      if (!s.narration || !audioMissing) {
        fail(
          `Scene "${title}": ${s.narration ? "narration word timings are missing" : 'key "words": file not found'} at public/${wordsKey}${s.narration ? ` (run "npm run voice -- ${input}")` : ""}`,
        );
      }
    } else {
      let json: unknown;
      try {
        json = JSON.parse(fs.readFileSync(wordsFile, "utf8"));
      } catch {
        fail(
          `Scene "${title}": key "words": public/${wordsKey} is not valid JSON`,
        );
      }
      if (json !== undefined) {
        const result = WordsFileSchema.safeParse(json);
        if (!result.success) {
          for (const issue of result.error.issues.slice(0, 5)) {
            const [index, field] = issue.path;
            const where =
              index === undefined
                ? "file"
                : `words[${String(index)}]${field === undefined ? "" : `.${String(field)}`}`;
            fail(`Scene "${title}": key "words": ${where}: ${issue.message}`);
          }
        } else {
          words = result.data.map((w) => ({
            text: w.text,
            startMs: w.startMs,
            endMs: w.endMs,
            timestampMs: w.timestampMs ?? Math.round((w.startMs + w.endMs) / 2),
            confidence: w.confidence ?? null,
          }));
          const lastEndMs = words[words.length - 1].endMs;
          if (s.duration === "auto") {
            duration =
              Math.round(
                (lastEndMs / 1000 + AUTO_PADDING + peekExit(bi)) * 100,
              ) / 100;
          }
          const sceneMs = duration * 1000;
          if (lastEndMs > sceneMs) {
            fail(
              `Scene "${title}": key "words": the last word ends at ${(lastEndMs / 1000).toFixed(2)}s but the scene is only ${(sceneMs / 1000).toFixed(2)}s long (raise duration)`,
            );
          }
        }
      }
    }
  }
  const beats: Beat[] = [];
  const cameraKeys: CameraKey[] = [];
  const kitActions: KitAction[] = [];
  const motion = [];
  const poses = [];
  for (const line of beatLines) {
    const parsedBeat = parseBeatLine(line, title, duration, suggest, fail);
    if (parsedBeat?.kind === "beat") beats.push(parsedBeat.beat);
    if (parsedBeat?.kind === "camera") cameraKeys.push(parsedBeat.key);
    if (parsedBeat?.kind === "action") kitActions.push(parsedBeat.action);
    if (parsedBeat?.kind === "motion") motion.push(parsedBeat.motion);
    if (parsedBeat?.kind === "pose") poses.push(parsedBeat.pose);
  }
  if (poses.length && s.model && fs.existsSync(path.resolve("public", s.model))) {
    try {
      const nodeNames = readGlbNodeNames(path.resolve("public", s.model));
      const hasLimbs = nodeNames.some((n) => /arm|leg|hand|foot|shoulder|hip|knee/i.test(n));
      if (!hasLimbs) {
        console.warn(`Warning: scene "${title}": model has no named limb nodes; pose uses whole-body tumble fallback`);
        poses.forEach((p) => { p.fallbackTumble = true; });
      }
    } catch { console.warn(`Warning: scene "${title}": could not inspect model nodes; pose uses whole-body tumble fallback`); poses.forEach((p) => { p.fallbackTumble = true; }); }
  }
  if (poses.length && s.shape !== "model") fail(`Scene "${title}": pose actions require shape: model`);
  checkBeatOverlaps(beats, title, fail);
  for (let k = 1; k < cameraKeys.length; k++) {
    if (cameraKeys[k].time <= cameraKeys[k - 1].time) {
      fail(
        `Scene "${title}": camera keyframes must be in increasing time order (${cameraKeys[k].time}s comes after ${cameraKeys[k - 1].time}s)`,
      );
    }
  }
  const kitParts: KitPart[] = [];
  const props = [];
  for (const line of partLines) {
    if (/^\+\s*(planet|blackhole)\b/.test(line)) {
      const prop = parseSceneProp(line, title, fail);
      if (prop) props.push(prop);
    } else {
      const part = parseKitPartLine(line, title, suggest, fail);
      if (part) kitParts.push(part);
    }
  }
  if (kitParts.length > 0 && !s.kit) {
    fail(
      `Scene "${title}": "+" lines need a "kit" key (kit: layers or kit: road)`,
    );
  }
  if (s.kit) validateKitParts(s.kit, kitParts, title, fail);
  if (props.length && s.theme !== "space") fail(`Scene "${title}": planet and blackhole props require theme: space`);
  for (const t of ["planet", "blackhole"] as const) if (props.filter((p) => p.type === t).length > 1) fail(`Scene "${title}": at most one + ${t} prop is allowed`);
  if (cameraKeys.length > 0 && s.cameraTo) {
    fail(
      `Scene "${title}": key "cameraTo" cannot be combined with camera keyframes ("@ <s> camera ...")`,
    );
  }
  motion.sort((a, b) => a.start - b.start);
  for (let m = 1; m < motion.length; m++) if (motion[m].start < motion[m - 1].end) fail(`Scene "${title}": motion actions overlap (${motion[m - 1].start}-${motion[m - 1].end}s and ${motion[m].start}-${motion[m].end}s)`);
  if (s.background?.startsWith("image(") && !fs.existsSync(path.resolve("public", s.background.slice(6, -1)))) fail(`Scene "${title}": background image not found at public/${s.background.slice(6, -1)}`);

  if (errors.length > before) continue;

  if (caption.length === 0 && s.narration) caption.push(s.narration);

  meta.push({
    worldKeys: [
      "shape",
      "model",
      "color",
      "background",
      "theme", "themeDetail",
      "rotationSpeed",
      "animation", "animationSpeed", "modelRotate",
      "kit",
    ].filter((k) => k in kv),
    camera: "camera" in kv,
    parts: partLines.length > 0,
  });
  scenes.push({
    title,
    chapter: s.chapter,
    kit: s.kit,
    duration,
    shape: s.shape ?? "box",
    model: s.model,
    animation: s.animation,
    animationSpeed: s.animationSpeed ?? 1,
    modelRotate: s.modelRotate !== "off",
    color: s.color ?? "#ffffff",
    rotationSpeed: s.rotationSpeed ?? 1,
    camera: s.camera ?? [0, 0, 5],
    cameraTo: s.cameraTo,
    cameraEase: s.cameraEase ?? "ease-in-out",
    transition: s.transition ?? "none",
    transitionDuration: s.transitionDuration ?? 0.5,
    audio,
    audioVolume: s.audioVolume ?? 1,
    background: s.background ?? "#000000",
    theme: s.theme,
    themeDetail: s.themeDetail ?? "low",
    motion,
    poses,
    props,
    caption: caption.join("\n"),
    beats: beats.length > 0 ? beats : undefined,
    words,
    cameraKeys: cameraKeys.length > 0 ? cameraKeys : undefined,
    kitParts: kitParts.length > 0 ? kitParts : undefined,
    kitActions: kitActions.length > 0 ? kitActions : undefined,
  });
}

// --- chapters: consecutive scenes with the same `chapter` share one 3D world ----

if (errors.length === 0) {
  const seen = new Set<string>();
  scenes.forEach((s, i) => {
    if (!s.chapter) return;
    const continues = i > 0 && scenes[i - 1].chapter === s.chapter;
    if (!continues) {
      if (seen.has(s.chapter)) {
        fail(
          `Scene "${s.title}": key "chapter": "${s.chapter}" was already used by earlier scenes that are not directly before this one (a chapter must be consecutive)`,
        );
      }
      seen.add(s.chapter);
      return;
    }
    const first = scenes.find((x) => x.chapter === s.chapter) as SceneData;
    for (const k of meta[i].worldKeys) {
      fail(
        `Scene "${s.title}": key "${k}": inside chapter "${s.chapter}" the world comes from its first scene "${first.title}" (remove this key)`,
      );
    }
    if (meta[i].camera) {
      fail(
        `Scene "${s.title}": key "camera": inside chapter "${s.chapter}" the camera continues from the previous scene (use "@  camera pos=..." to move it)`,
      );
    }
    if (meta[i].parts) {
      fail(
        `Scene "${s.title}": "+" lines: inside chapter "${s.chapter}" the kit parts come from its first scene "${first.title}" (remove them)`,
      );
    }
    if (s.transition !== "none") {
      fail(
        `Scene "${s.title}": key "transition": only the first scene of a chapter can have a transition`,
      );
    }
    // inherit the world and the camera position from the previous scene
    s.shape = first.shape;
    s.model = first.model;
    s.animation = first.animation;
    s.animationSpeed = first.animationSpeed;
    s.modelRotate = first.modelRotate;
    s.theme = first.theme;
    s.themeDetail = first.themeDetail;
    s.props = first.props;
    s.color = first.color;
    s.background = first.background;
    s.rotationSpeed = first.rotationSpeed;
    s.kit = first.kit;
    s.kitParts = first.kitParts;
    const prev = scenes[i - 1];
    s.camera = prev.cameraKeys?.length
      ? prev.cameraKeys[prev.cameraKeys.length - 1].pos
      : (prev.cameraTo ?? prev.camera);
  });
}

// --- kit actions must belong to the chapter's kit --------------------------------

if (errors.length === 0) {
  scenes.forEach((s, i) => {
    if (!s.kitActions) return;
    let f = i;
    while (f > 0 && s.chapter && scenes[f - 1].chapter === s.chapter) f--;
    const first = scenes[f];
    for (const a of s.kitActions) {
      if (!first.kit) {
        fail(
          `Scene "${s.title}": action "${a.type}" needs a kit (set "kit: layers" or "kit: road" on the chapter's first scene)`,
        );
        continue;
      }
      const allowed = KIT_ACTIONS_BY_KIT[first.kit] as readonly string[];
      if (!allowed.includes(a.type)) {
        fail(
          `Scene "${s.title}": action "${a.type}" does not belong to kit "${first.kit}" (allowed: ${allowed.join(", ")})`,
        );
      }
      if (a.type === "highlight") {
        const names = (first.kitParts ?? []).flatMap((p) =>
          p.type === "layer" ? [p.name] : [],
        );
        if (!names.includes(a.layer)) {
          const sug = suggest(a.layer, names);
          fail(
            `Scene "${s.title}": action "highlight": no layer named "${a.layer}"${sug ? ` (did you mean "${sug}"?)` : ""}. Layers: ${names.join(", ")}`,
          );
        }
      }
    }
  });
}

// --- cross-chapter checks (a transition overlaps its neighbours) ------------

if (errors.length === 0) {
  const fps = fm.success ? (fm.data.fps ?? 30) : 30;
  const chapters = groupChapters(scenes, fps);
  const label = (c: (typeof chapters)[number]) =>
    c.scenes[0].chapter
      ? `chapter "${c.scenes[0].chapter}"`
      : `scene "${c.scenes[0].title}"`;

  chapters.forEach((c, k) => {
    const first = c.scenes[0];
    if (first.transition !== "none" && k === 0) {
      fail(
        `Scene "${first.title}": key "transition": the first scene has nothing to transition from`,
      );
      return;
    }
    const enter = enterFrames(scenes, c.firstIndex, fps);
    const exit =
      k + 1 < chapters.length
        ? enterFrames(scenes, chapters[k + 1].firstIndex, fps)
        : 0;
    if (enter > 0 && enter >= chapters[k - 1].frames) {
      fail(
        `Scene "${first.title}": key "transitionDuration": must be shorter than the previous ${label(chapters[k - 1])} (${(chapters[k - 1].frames / fps).toFixed(1)}s)`,
      );
    }
    if (enter > 0 && enter >= c.frames) {
      fail(
        `Scene "${first.title}": key "transitionDuration": must be shorter than its own ${label(c)} (${(c.frames / fps).toFixed(1)}s)`,
      );
    }
    if (enter > 0 && exit > 0 && enter + exit >= c.frames) {
      fail(
        `Scene "${first.title}": entry and exit transitions together must be shorter than its ${label(c)} (${(c.frames / fps).toFixed(1)}s)`,
      );
    }
  });

  // The voice of a chapter's last scene must end before the next transition starts
  chapters.forEach((c, k) => {
    c.scenes.forEach((s, j) => {
      if (!s.words) return;
      const out =
        j === c.scenes.length - 1 && k + 1 < chapters.length
          ? enterFrames(scenes, chapters[k + 1].firstIndex, fps)
          : 0;
      const d = s.duration === "auto" ? 3 : s.duration;
      const voiceEnd = s.words[s.words.length - 1].endMs / 1000;
      if (voiceEnd + out / fps > d) {
        console.warn(
          `Warning: scene "${s.title}": the voice ends at ${voiceEnd.toFixed(2)}s and the next transition starts at ${(d - out / fps).toFixed(2)}s (raise duration so the voice is not cut off)`,
        );
      }
    });
  });
}

// --- result ----------------------------------------------------------------
// cross-scene checks
scenes.forEach((s, i) => {
  if (i === 0 && s.transition !== "none") {
    fail(
      `Scene "${s.title}": key "transition": the first scene has nothing to transition from`,
    );
  }
  if (i > 0 && s.transition !== "none") {
    const d1 = Number(
      scenes[i - 1].duration === "auto" ? 3 : (scenes[i - 1].duration ?? 3),
    );
    const d2 = Number(s.duration === "auto" ? 3 : (s.duration ?? 3));
    const shorter = Math.min(d1, d2);
    if (s.transitionDuration >= shorter) {
      fail(
        `Scene "${s.title}": key "transitionDuration": must be shorter than both neighboring scenes (${shorter}s)`,
      );
    }
  }
  if (s.audio && !fs.existsSync(path.resolve("public", s.audio))) {
    fail(
      `Scene "${s.title}": key "audio": file not found at public/${s.audio}`,
    );
  }
});

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s) in ${input}:`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error("\nNothing was written. Fix the storyboard and run again.");
  process.exit(1);
}

const storyboard: Storyboard = {
  title: fm.success ? (fm.data.title ?? "Untitled") : "Untitled",
  fps: fm.success ? (fm.data.fps ?? 30) : 30,
  width: fm.success ? (fm.data.width ?? 1920) : 1920,
  height: fm.success ? (fm.data.height ?? 1080) : 1080,
  scenes,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(storyboard, null, 2));
console.log(`Parsed ${scenes.length} scenes -> ${output}`);
