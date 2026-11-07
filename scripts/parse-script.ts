import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { SceneData, Storyboard, Vec3 } from "../src/script/types";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: tsx scripts/parse-script.ts <input.md> <output.json>");
  process.exit(1);
}

const { data, content } = matter(fs.readFileSync(input, "utf8"));

const scenes: SceneData[] = content
  .split(/^## /m)
  .slice(1) // everything before the first "## " is ignored
  .map((block) => {
    const [title, ...lines] = block.split(/\r?\n/); // \r?\n: safe on Windows (CRLF)
    const kv: Record<string, string> = {};
    const caption: string[] = [];

    for (const line of lines) {
      const m = line.match(/^-\s*(\w+):\s*(.+)$/);
      if (m) kv[m[1]] = m[2].trim();
      else if (/^\s*>/.test(line))
        caption.push(line.replace(/^\s*>\s?/, "").trim());
    }

    return {
      title: title.trim(),
      duration: Number(kv.duration ?? 3),
      shape: (kv.shape as SceneData["shape"]) ?? "box",
      model: kv.model,
      color: kv.color ?? "#ffffff",
      rotationSpeed: Number(kv.rotationSpeed ?? 1),
      camera: (kv.camera ?? "0, 0, 5").split(",").map(Number) as Vec3,
      background: kv.background ?? "#000000",
      caption: caption.join("\n"),
    };
  });

scenes.forEach((s) => {
  if (!s.caption)
    console.warn(
      `Warning: scene "${s.title}" has no caption (expected a line starting with ">")`,
    );
});

const storyboard: Storyboard = {
  title: data.title ?? "Untitled",
  fps: data.fps ?? 30,
  width: data.width ?? 1920,
  height: data.height ?? 1080,
  scenes,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(storyboard, null, 2));
console.log(`Parsed ${scenes.length} scenes -> ${output}`);
