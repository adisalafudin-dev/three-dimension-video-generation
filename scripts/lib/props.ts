import { ScenePropSchema } from "../../src/script/schema";
import type { SceneProp } from "../../src/script/types";
import { readFields } from "./beats";

export const parseSceneProp = (line: string, title: string, fail: (message: string) => void): SceneProp | null => {
  const m = line.match(/^\+\s*(planet|blackhole)\s*(.*)$/);
  if (!m) return null;
  const fields = readFields(m[2]);
  const where = `Scene "${title}": prop "${line}"`;
  if (typeof fields === "string") { fail(`${where}: ${fields}`); return null; }
  const parsed = ScenePropSchema.safeParse({ type: m[1], ...fields });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      fail(`${where}: key "${key}": ${issue.message}${fields[key] ? ` (got "${fields[key]}")` : ""}`);
    }
    return null;
  }
  const p = parsed.data;
  return p.type === "planet"
    ? { ...p, pos: p.pos, radius: p.radius, ring: p.ring === "on" }
    : p;
};
