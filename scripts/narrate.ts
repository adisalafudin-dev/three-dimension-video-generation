// Usage: tsx scripts/narrate.ts <name> "<text>" [voice]
// Writes public/audio/<name>.mp3 and public/audio/<name>.words.json
import path from "node:path";
import { DEFAULT_VOICE } from "./lib/narration";
import { synthesize } from "./lib/tts";

const [name, text, voice = DEFAULT_VOICE] = process.argv.slice(2);
if (!name || !text || !/^[\w-]+(\/[\w-]+)*$/.test(name)) {
  console.error(
    'Usage: tsx scripts/narrate.ts <name> "<text>" [voice]   (name: letters, digits, - and _, optional subfolders like rv/scene1)',
  );
  process.exit(1);
}

const audio = (ext: string) => path.resolve("public", "audio", `${name}${ext}`);

synthesize(
  text,
  voice,
  audio(".mp3"),
  audio(".words.json"),
  path.resolve("scripts", "out", `${name}.raw.json`),
)
  .then((r) => {
    console.log(`Mode:           ${r.mode}`);
    console.log(`Words:          ${r.words}`);
    console.log(`Last word ends: ${r.lastEndSec.toFixed(2)}s`);
    console.log(
      `Audio length:   ~${r.audioSec.toFixed(2)}s (estimated from file size)`,
    );
    if (r.mode === "sentence-estimate") {
      console.warn(
        "WARNING: no WordBoundary events; word timings are ESTIMATED from sentences.",
      );
    }
    if (r.lastEndSec > r.audioSec + 0.5 || r.lastEndSec < r.audioSec - 2) {
      console.warn(
        "WARNING: last word and audio length disagree; the time unit or the data looks wrong.",
      );
    }
    console.log(
      `Wrote public/audio/${name}.mp3 and public/audio/${name}.words.json`,
    );
  })
  .catch((e) => {
    console.error("narrate failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
