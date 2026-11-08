// Usage: tsx scripts/words-from-edge.ts <raw-metadata.json> <out.words.json>
import fs from "node:fs";
import path from "node:path";
import { edgeMetadataToCaptions } from "./lib/edge-words";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    "Usage: tsx scripts/words-from-edge.ts <raw-metadata.json> <out.words.json>",
  );
  process.exit(1);
}

const { captions, mode } = edgeMetadataToCaptions(
  JSON.parse(fs.readFileSync(input, "utf8")),
);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(captions, null, 2));
console.log(`${captions.length} words (${mode}) -> ${output}`);
if (mode === "sentence-estimate")
  console.warn(
    "Warning: only sentence timings were available; word timings are estimated.",
  );
