// Usage: tsx scripts/narrate.ts <name> "<text>" [voice]
// Writes public/audio/<name>.mp3 and public/audio/<name>.words.json
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { edgeMetadataToCaptions } from "./lib/edge-words";

const [name, text, voice = "en-US-GuyNeural"] = process.argv.slice(2);
if (!name || !text || !/^[\w-]+(\/[\w-]+)*$/.test(name)) {
  console.error(
    'Usage: tsx scripts/narrate.ts <name> "<text>" [voice]   (name: letters, digits, - and _, optional subfolders like rv/scene1)',
  );
  process.exit(1);
}

const BITRATE_KBPS = 96; // matches OUTPUT_FORMAT below, used to estimate the audio length
const audioDir = path.resolve("public", "audio");
const rawDir = path.resolve("scripts", "out");
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(rawDir, { recursive: true });

const main = async () => {
  // toFile() always writes "audio.mp3" + "metadata.json", so use a temp folder and move the results
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "narrate-"));
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
    sentenceBoundaryEnabled: true,
  });
  const { audioFilePath, metadataFilePath } = await tts.toFile(tmp, text);
  tts.close();
  if (!metadataFilePath) throw new Error("The service returned no metadata");

  const mp3 = path.join(audioDir, `${name}.mp3`);
  const raw = path.join(rawDir, `${name}.raw.json`);

  fs.mkdirSync(path.dirname(mp3), { recursive: true });
  fs.mkdirSync(path.dirname(raw), { recursive: true });
  fs.copyFileSync(audioFilePath, mp3);
  fs.copyFileSync(metadataFilePath, raw); // kept for debugging
  fs.rmSync(tmp, { recursive: true, force: true });

  const metadata = JSON.parse(fs.readFileSync(raw, "utf8"));
  const types = [
    ...new Set((metadata.Metadata ?? []).map((m: { Type: string }) => m.Type)),
  ];
  console.log(`Metadata entry types received: ${types.join(", ")}`);

  const { captions, mode } = edgeMetadataToCaptions(metadata);
  const wordsPath = path.join(audioDir, `${name}.words.json`);
  fs.writeFileSync(wordsPath, JSON.stringify(captions, null, 2));

  // Sanity check: the last word should end about when the audio ends (catches a wrong time unit)
  const audioSec = (fs.statSync(mp3).size * 8) / (BITRATE_KBPS * 1000);
  const lastEndSec = captions[captions.length - 1].endMs / 1000;
  console.log(`Mode:           ${mode}`);
  console.log(`Words:          ${captions.length}`);
  console.log(
    `First word:     "${captions[0].text.trim()}" at ${(captions[0].startMs / 1000).toFixed(2)}s`,
  );
  console.log(`Last word ends: ${lastEndSec.toFixed(2)}s`);
  console.log(
    `Audio length:   ~${audioSec.toFixed(2)}s (estimated from file size)`,
  );
  if (mode === "sentence-estimate") {
    console.warn(
      "WARNING: the service sent no WordBoundary events; word timings are ESTIMATED from sentences.",
    );
  }
  if (lastEndSec > audioSec + 0.5 || lastEndSec < audioSec - 2) {
    console.warn(
      "WARNING: last word and audio length disagree; the time unit or the data looks wrong.",
    );
  }
  console.log(
    `Wrote ${path.relative(".", mp3)} and ${path.relative(".", wordsPath)}`,
  );
};

main().catch((e) => {
  console.error("narrate failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
