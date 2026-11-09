import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { edgeMetadataToCaptions } from "./edge-words";

const BITRATE_KBPS = 96; // matches OUTPUT_FORMAT below

export type TtsResult = {
  mode: "word" | "sentence-estimate";
  words: number;
  lastEndSec: number;
  audioSec: number;
};

// text -> mp3 + word timings (Remotion Caption[] JSON). Paths are absolute.
export const synthesize = async (
  text: string,
  voice: string,
  mp3Path: string,
  wordsPath: string,
  rawPath?: string,
): Promise<TtsResult> => {
  // toFile() always writes "audio.mp3" + "metadata.json", so use a temp folder and move the results
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tts-"));
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
      {
        wordBoundaryEnabled: true,
        sentenceBoundaryEnabled: true,
      },
    );
    const { audioFilePath, metadataFilePath } = await tts.toFile(tmp, text);
    tts.close();
    if (!metadataFilePath) throw new Error("The service returned no metadata");

    fs.mkdirSync(path.dirname(mp3Path), { recursive: true });
    fs.copyFileSync(audioFilePath, mp3Path);
    if (rawPath) {
      fs.mkdirSync(path.dirname(rawPath), { recursive: true });
      fs.copyFileSync(metadataFilePath, rawPath); // kept for debugging
    }

    const metadata = JSON.parse(fs.readFileSync(metadataFilePath, "utf8"));
    const { captions, mode } = edgeMetadataToCaptions(metadata);
    fs.writeFileSync(wordsPath, JSON.stringify(captions, null, 2));

    return {
      mode,
      words: captions.length,
      lastEndSec: captions[captions.length - 1].endMs / 1000,
      audioSec: (fs.statSync(mp3Path).size * 8) / (BITRATE_KBPS * 1000),
    };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
};
