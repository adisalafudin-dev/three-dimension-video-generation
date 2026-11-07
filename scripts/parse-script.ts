import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ZodIssue } from "zod";
import {
  FRONTMATTER_KEYS,
  FrontmatterSchema,
  SCENE_KEYS,
  SceneSchema,
} from "../src/script/schema";
import type { SceneData, Storyboard } from "../src/script/types";

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
    background: s.background ?? "#000000",
    caption: caption.join("\n"),
  });
}

// --- result ----------------------------------------------------------------

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
