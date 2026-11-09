// Usage: tsx scripts/voice.ts <storyboard.md> [--force]
// For every scene with `narration`, writes public/audio/<slug>/sceneN.mp3 + .words.json.
// Cached by a hash of (voice + text): unchanged scenes are skipped.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { narrationPaths, readNarrations } from "./lib/narration";
import { synthesize } from "./lib/tts";

const args = process.argv.slice(2);
const force = args.includes("--force");
const file = args.find((a) => !a.startsWith("--"));
if (!file || !fs.existsSync(file)) {
  console.error("Usage: tsx scripts/voice.ts <storyboard.md> [--force]");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pub = (p: string) => path.resolve("public", p);

const main = async () => {
  const { slug, voice, items } = readNarrations(file);
  if (items.length === 0) {
    console.log(`No "narration" keys in ${file}: nothing to do.`);
    return;
  }
  console.log(`Voice: ${voice} | ${items.length} scene(s) with narration`);

  let failed = 0;
  for (const item of items) {
    const p = narrationPaths(slug, item.no);
    const hash = crypto
      .createHash("sha1")
      .update(`${voice}\n${item.text}`)
      .digest("hex")
      .slice(0, 16);
    const metaFile = pub(p.meta);
    let cached = false;
    try {
      cached =
        !force &&
        fs.existsSync(pub(p.audio)) &&
        fs.existsSync(pub(p.words)) &&
        JSON.parse(fs.readFileSync(metaFile, "utf8")).hash === hash;
    } catch {
      cached = false;
    }
    const label = `scene ${item.no} "${item.title}"`;
    if (cached) {
      console.log(`  cached   ${label}`);
      continue;
    }

    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const r = await synthesize(
          item.text,
          voice,
          pub(p.audio),
          pub(p.words),
          path.resolve("scripts", "out", `${slug}-scene${item.no}.raw.json`),
        );
        fs.writeFileSync(
          metaFile,
          JSON.stringify({ hash, voice, text: item.text }, null, 2),
        );
        console.log(
          `  voiced   ${label}: ${r.words} words, ends at ${r.lastEndSec.toFixed(2)}s${r.mode === "sentence-estimate" ? " (ESTIMATED timings)" : ""}`,
        );
        if (r.lastEndSec > r.audioSec + 0.5 || r.lastEndSec < r.audioSec - 2) {
          console.warn(
            `  WARNING  ${label}: last word and audio length disagree`,
          );
        }
        ok = true;
      } catch (e) {
        console.warn(
          `  retry ${attempt}/3 ${label}: ${e instanceof Error ? e.message : e}`,
        );
        await sleep(1500 * attempt);
      }
    }
    if (!ok) {
      failed++;
      console.error(`  FAILED   ${label}`);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} scene(s) could not be voiced.`);
    process.exit(1);
  }
};

main();
