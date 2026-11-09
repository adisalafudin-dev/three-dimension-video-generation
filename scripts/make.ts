// Usage: tsx scripts/make.ts <storyboard.md ...> [--no-voice] [--no-render]
// For each storyboard: voice (cached) -> parse/validate -> render to out/<name>.mp4
// Env: GL=angle (default) | swiftshader | egl ... for the headless Chrome WebGL backend
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { slugOf } from "./lib/narration";

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith("--"));
const noVoice = args.includes("--no-voice");
const noRender = args.includes("--no-render");
const gl = process.env.GL ?? "angle";

if (files.length === 0) {
  console.error(
    "Usage: tsx scripts/make.ts <storyboard.md ...> [--no-voice] [--no-render]",
  );
  process.exit(1);
}

const q = (s: string) => JSON.stringify(s);
const run = (cmd: string) =>
  spawnSync(cmd, { stdio: "inherit", shell: true }).status === 0;

const results: { file: string; ok: boolean; step: string; sec: number }[] = [];

for (const file of files) {
  const start = Date.now();
  const slug = slugOf(file);
  console.log(`\n=== ${file} ===`);
  const done = (ok: boolean, step: string) =>
    results.push({
      file,
      ok,
      step,
      sec: Math.round((Date.now() - start) / 1000),
    });

  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    done(false, "read");
    continue;
  }
  if (!noVoice && !run(`npx tsx scripts/voice.ts ${q(file)}`)) {
    done(false, "voice");
    continue;
  }
  if (!run(`npx tsx scripts/parse-script.ts ${q(file)}`)) {
    done(false, "check");
    continue;
  }
  if (noRender) {
    done(true, "check");
    continue;
  }
  fs.mkdirSync("out", { recursive: true });
  const ok = run(
    `npx remotion render src/index.ts ScriptVideo ${q(`out/${slug}.mp4`)} --gl=${gl}`,
  );
  done(ok, "render");
}

console.log("\n--- summary ---");
for (const r of results) {
  console.log(
    `${r.ok ? "OK  " : "FAIL"} ${r.file} (${r.ok ? "done" : `failed at ${r.step}`}, ${r.sec}s)`,
  );
}
if (results.some((r) => !r.ok)) process.exit(1);
