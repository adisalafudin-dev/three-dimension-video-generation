import { BEAT_FIELDS, BEAT_TYPES, BeatSchema } from "../../src/script/schema";
import type { Beat, CameraKey } from "../../src/script/types";

type Suggest = (key: string, known: readonly string[]) => string | null;
type Fail = (msg: string) => void;
export type ParsedBeat =
  | { kind: "beat"; beat: Beat }
  | { kind: "camera"; key: CameraKey };

const shorten = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}...` : s);

// key="quoted value" or key=bare ; returns an error string when something cannot be read
const readFields = (rest: string): Record<string, string> | string => {
  const out: Record<string, string> = {};
  const re = /\s*(\w+)=("(?:[^"\\]|\\.)*"|[^\s"]+)/y;
  let pos = 0;
  for (;;) {
    re.lastIndex = pos;
    const m = re.exec(rest);
    if (!m) break;
    if (m[1] in out) return `key "${m[1]}": defined more than once`;
    out[m[1]] = m[2].startsWith('"')
      ? m[2].slice(1, -1).replace(/\\(.)/g, "$1")
      : m[2];
    pos = re.lastIndex;
  }
  const left = rest.slice(pos).trim();
  if (left)
    return `cannot read "${shorten(left)}" (values with spaces need double quotes: key="some text")`;
  return out;
};

export const parseBeatLine = (
  line: string,
  sceneTitle: string,
  sceneDuration: number,
  suggest: Suggest,
  fail: Fail,
): ParsedBeat | null => {
  const where = `Scene "${sceneTitle}": beat "${shorten(line)}"`;
  const head = line.match(/^@\s*(\d+(?:\.\d+)?)s?\s+(\w+)\s*(.*)$/);
  if (!head) {
    fail(
      `${where}: cannot read it (expected: @ <seconds> <type> key="value" ...)`,
    );
    return null;
  }
  const start = Number(head[1]);
  const type = head[2];

  if (!(BEAT_TYPES as readonly string[]).includes(type)) {
    const s = suggest(type, BEAT_TYPES);
    fail(
      `${where}: unknown beat type "${type}"${s ? ` (did you mean "${s}"?)` : ""}. Types: ${BEAT_TYPES.join(", ")}`,
    );
    return null;
  }
  const known = BEAT_FIELDS[type as (typeof BEAT_TYPES)[number]];

  const fields = readFields(head[3]);
  if (typeof fields === "string") {
    fail(`${where}: ${fields}`);
    return null;
  }

  const parsed = BeatSchema.safeParse({ type, ...fields });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.code === "unrecognized_keys") {
        for (const k of issue.keys) {
          const s = suggest(k, known);
          fail(
            `${where}: key "${k}": not allowed for "${type}"${s ? ` (did you mean "${s}"?)` : ""}. Allowed: ${known.join(", ")}`,
          );
        }
        continue;
      }
      const key = String(issue.path[0] ?? "");
      if (issue.code === "invalid_type" && fields[key] === undefined) {
        fail(`${where}: key "${key}": required for "${type}"`);
      } else {
        const got = fields[key] !== undefined ? ` (got "${fields[key]}")` : "";
        fail(`${where}: key "${key}": ${issue.message}${got}`);
      }
    }
    return null;
  }

  const data = parsed.data;

  // Camera keyframe: not an overlay; the camera arrives at `pos` at `start` seconds
  if (data.type === "camera") {
    if (start <= 0 || start > sceneDuration + 1e-6) {
      fail(
        `${where}: a camera keyframe must be between 0 and the scene length (${sceneDuration}s), got ${start}s`,
      );
      return null;
    }
    return {
      kind: "camera",
      key: { time: start, pos: data.pos, ease: data.ease ?? "ease-in-out" },
    };
  }

  // Callout needs a position: screen (x and y) or a 3D point (at), not both
  if (data.type === "callout") {
    const hasX = data.x !== undefined;
    const hasY = data.y !== undefined;
    if (data.at && (hasX || hasY)) {
      fail(`${where}: use either "at" (3D point) or "x" and "y" (screen %), not both`);
      return null;
    }
    if (!data.at && !(hasX && hasY)) {
      fail(`${where}: a callout needs "x" and "y" (screen %) or "at" (3D point like "0.5, 1, 0")`);
      return null;
    }
  }

  const forSec = (data as { for?: number }).for;
  const rest = data as any;
  delete rest.for;
  const end = start + (forSec ?? sceneDuration - start);
  let ok = true;
  if (start >= sceneDuration) {
    fail(`${where}: starts at ${start}s but the scene is only ${sceneDuration}s long`);
    ok = false;
  } else if (end > sceneDuration + 1e-6) {
    fail(
      `${where}: ends at ${end.toFixed(2)}s but the scene is only ${sceneDuration}s long (shorten "for" or raise duration)`,
    );
    ok = false;
  }
  if (!ok) return null;
  return { kind: "beat", beat: { start, end, ...rest } as Beat };
};

// Beats that share one screen slot may not overlap in time (callouts are free-positioned)
const slotOf = (t: Beat["type"]): string | null =>
  t === "quote" || t === "stat" || t === "checklist"
    ? "card"
    : t === "callout"
      ? null
      : t;

export const checkBeatOverlaps = (
  beats: Beat[],
  sceneTitle: string,
  fail: Fail,
) => {
  for (let i = 0; i < beats.length; i++) {
    for (let j = i + 1; j < beats.length; j++) {
      const a = beats[i];
      const b = beats[j];
      const slot = slotOf(a.type);
      if (!slot || slot !== slotOf(b.type)) continue;
      if (a.start < b.end && b.start < a.end) {
        fail(
          `Scene "${sceneTitle}": beats "${a.type}" (${a.start}s) and "${b.type}" (${b.start}s) use the same screen slot (${slot}) and overlap in time`,
        );
      }
    }
  }
};
