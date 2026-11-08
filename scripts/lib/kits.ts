import {
  KIT_PARTS_BY_KIT,
  KIT_PART_FIELDS,
  KIT_PART_TYPES,
  KitPartSchema,
} from "../../src/script/schema";
import type { KitName, KitPart } from "../../src/script/types";
import { readFields } from "./beats";

type Suggest = (key: string, known: readonly string[]) => string | null;
type Fail = (msg: string) => void;

const shorten = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}...` : s);

// "+ layer name="Tile" color=#e9ecef thickness=0.15"
export const parseKitPartLine = (
  line: string,
  sceneTitle: string,
  suggest: Suggest,
  fail: Fail,
): KitPart | null => {
  const where = `Scene "${sceneTitle}": part "${shorten(line)}"`;
  const head = line.match(/^\+\s*(\w+)\s*(.*)$/);
  if (!head) {
    fail(`${where}: cannot read it (expected: + <part> key="value" ...)`);
    return null;
  }
  const type = head[1];
  if (!(KIT_PART_TYPES as readonly string[]).includes(type)) {
    const s = suggest(type, KIT_PART_TYPES);
    fail(
      `${where}: unknown part "${type}"${s ? ` (did you mean "${s}"?)` : ""}. Parts: ${KIT_PART_TYPES.join(", ")}`,
    );
    return null;
  }
  const known = KIT_PART_FIELDS[type as (typeof KIT_PART_TYPES)[number]];

  const fields = readFields(head[2]);
  if (typeof fields === "string") {
    fail(`${where}: ${fields}`);
    return null;
  }

  const parsed = KitPartSchema.safeParse({ type, ...fields });
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
  return parsed.data as KitPart;
};

// Which parts a kit accepts, and how many
export const validateKitParts = (
  kit: KitName,
  parts: KitPart[],
  sceneTitle: string,
  fail: Fail,
) => {
  const allowed = KIT_PARTS_BY_KIT[kit] as readonly string[];
  for (const p of parts) {
    if (!allowed.includes(p.type)) {
      fail(
        `Scene "${sceneTitle}": part "${p.type}" does not belong to kit "${kit}" (allowed: ${allowed.join(", ")})`,
      );
    }
  }
  if (kit === "layers") {
    const layers = parts.filter((p) => p.type === "layer");
    if (layers.length < 2 || layers.length > 8) {
      fail(
        `Scene "${sceneTitle}": kit "layers" needs 2 to 8 "+ layer ..." lines (got ${layers.length})`,
      );
    }
    const names = layers.map((l) => (l.type === "layer" ? l.name : ""));
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) fail(`Scene "${sceneTitle}": layer name "${dup}" is used twice`);
  }
  if (kit === "road") {
    for (const t of ["rain", "car"] as const) {
      if (parts.filter((p) => p.type === t).length > 1) {
        fail(
          `Scene "${sceneTitle}": kit "road" accepts at most one "+ ${t}" line`,
        );
      }
    }
  }
};
