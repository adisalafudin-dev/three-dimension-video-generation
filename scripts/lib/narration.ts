import fs from "node:fs";
import matter from "gray-matter";

export const DEFAULT_VOICE = "en-US-GuyNeural";

// Fixed convention: scene N (1-based position in the file) of "<slug>.md" gets these files under public/
export const narrationPaths = (slug: string, sceneNo: number) => ({
  audio: `audio/${slug}/scene${sceneNo}.mp3`,
  words: `audio/${slug}/scene${sceneNo}.words.json`,
  meta: `audio/${slug}/scene${sceneNo}.meta.json`,
});

export const slugOf = (file: string) =>
  (file.split(/[\\/]/).pop() ?? file).replace(/\.md$/i, "");

export const stripQuotes = (s: string) =>
  s
    .trim()
    .replace(/^"([\s\S]*)"$/, "$1")
    .trim();

// Light read (no validation: the parser does that) of every scene's `narration` line
export const readNarrations = (file: string) => {
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const voice =
    typeof data.voice === "string" && data.voice ? data.voice : DEFAULT_VOICE;
  const blocks = content.split(/^## /m).slice(1);
  const items: { no: number; title: string; text: string }[] = [];
  blocks.forEach((block, i) => {
    const [title, ...lines] = block.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*-\s*narration:\s*(.+)$/);
      if (m) {
        items.push({ no: i + 1, title: title.trim(), text: stripQuotes(m[1]) });
        break;
      }
    }
  });
  return { slug: slugOf(file), voice, items };
};
