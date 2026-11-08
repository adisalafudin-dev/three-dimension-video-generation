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
} from "../src/script/schema";
import type { SceneData, Storyboard } from "../src/script/types";
import type { Caption } from "@remotion/captions";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: tsx scripts/parse-script.ts <input.md> <output.json>");
  process.exit(1);
}

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
const blocks = content.split(/^## /m).slice(1); // text before the first "## " is ignored

if (blocks.length === 0)
  fail('No scenes found (each scene starts with a "## Title" line)');

for (const block of blocks) {
  const [rawTitle, ...lines] = block.split(/\r?\n/); // \r?\n: safe on Windows (CRLF)
  const title = rawTitle.trim();
  if (!title) {
    fail('A scene has an empty title (use "## Title")');
    continue;
  }

  const kv: Record<string, string> = {};
  const caption: string[] = [];
  const before = errors.length;

  for (const line of lines) {
    const m = line.match(/^\s*-\s*(\w+):\s*(.+)$/);
    if (m) {
      if (m[1] in kv)
        fail(`Scene "${title}": key "${m[1]}": defined more than once`);
      kv[m[1]] = m[2].trim();
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

  if (s.audio && !fs.existsSync(path.resolve("public", s.audio))) {
    fail(`Scene "${title}": key "audio": file not found at public/${s.audio}`);
  }

  let words: Caption[] | undefined;
  if (s.words) {
    const wordsFile = path.resolve("public", s.words);
    if (!fs.existsSync(wordsFile)) {
      fail(
        `Scene "${title}": key "words": file not found at public/${s.words}`,
      );
    } else {
      let json: unknown;
      try {
        json = JSON.parse(fs.readFileSync(wordsFile, "utf8"));
      } catch {
        fail(
          `Scene "${title}": key "words": public/${s.words} is not valid JSON`,
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
          const sceneMs = (s.duration ?? 3) * 1000;
          if (lastEndMs > sceneMs) {
            fail(
              `Scene "${title}": key "words": the last word ends at ${(lastEndMs / 1000).toFixed(2)}s but the scene is only ${(sceneMs / 1000).toFixed(2)}s long (raise duration)`,
            );
          }
        }
      }
    }
  }

  if (errors.length > before) continue;

  if (caption.length === 0) {
    console.warn(
      `Warning: scene "${title}" has no caption (expected a line starting with ">")`,
    );
  }

  scenes.push({
    title,
    duration: s.duration ?? 3,
    shape: s.shape ?? "box",
    model: s.model,
    color: s.color ?? "#ffffff",
    rotationSpeed: s.rotationSpeed ?? 1,
    camera: s.camera ?? [0, 0, 5],
    cameraTo: s.cameraTo,
    cameraEase: s.cameraEase ?? "ease-in-out",
    transition: s.transition ?? "none",
    transitionDuration: s.transitionDuration ?? 0.5,
    audio: s.audio,
    audioVolume: s.audioVolume ?? 1,
    background: s.background ?? "#000000",
    caption: caption.join("\n"),
  });
}

// --- cross-scene checks (a transition overlaps its neighbours) --------------

if (errors.length === 0) {
  const fps = fm.success ? (fm.data.fps ?? 30) : 30;
  const frames = (sec: number) => Math.round(sec * fps);
  const tIn = (i: number) =>
    i > 0 && scenes[i].transition !== "none"
      ? frames(scenes[i].transitionDuration)
      : 0;

  scenes.forEach((s, i) => {
    if (s.transition !== "none" && i === 0) {
      fail(
        `Scene "${s.title}": key "transition": the first scene has nothing to transition from`,
      );
      return;
    }
    const own = frames(s.duration);
    if (tIn(i) > 0 && tIn(i) >= frames(scenes[i - 1].duration)) {
      fail(
        `Scene "${s.title}": key "transitionDuration": must be shorter than the previous scene "${scenes[i - 1].title}" (${scenes[i - 1].duration}s)`,
      );
    }
    if (tIn(i) > 0 && tIn(i) >= own) {
      fail(
        `Scene "${s.title}": key "transitionDuration": must be shorter than the scene itself (${s.duration}s)`,
      );
    }

    const out = i + 1 < scenes.length ? tIn(i + 1) : 0;

    if (s.words) {
      const voiceEnd = s.words[s.words.length - 1].endMs / 1000;
      if (voiceEnd + out / fps > s.duration) {
        console.warn(
          `Warning: scene "${s.title}": the voice ends at ${voiceEnd.toFixed(2)}s and the next transition starts at ${(s.duration - out / fps).toFixed(2)}s (raise duration so the voice is not cut off)`,
        );
      }
    }
    if (tIn(i) > 0 && out > 0 && tIn(i) + out >= own) {
      fail(
        `Scene "${s.title}": entry and exit transitions together must be shorter than the scene (${s.duration}s)`,
      );
    }
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
    const shorter = Math.min(scenes[i - 1].duration, s.duration);
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
