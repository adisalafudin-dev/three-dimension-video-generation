import type { Caption } from "@remotion/captions";

// Edge TTS reports times in 100-nanosecond ticks: 10,000 ticks = 1 ms.
// narrate.ts double-checks this against the audio length, so a wrong unit is caught.
const TICKS_PER_MS = 10_000;

type RawEntry = {
  Type?: string;
  Data?: {
    Offset?: number;
    Duration?: number;
    Text?: string;
    text?: string | { Text?: string };
  };
};

export type WordsResult = {
  captions: Caption[];
  mode: "word" | "sentence-estimate";
};

const isPunctuation = (s: string) => /^[\p{P}\p{S}]+$/u.test(s);

const entryText = (e: RawEntry): string => {
  const d = e.Data ?? {};
  const t =
    typeof d.text === "string" ? d.text : (d.text?.Text ?? d.Text ?? "");
  return t.trim();
};

const makeCaption = (
  text: string,
  startMs: number,
  endMs: number,
): Caption => ({
  text,
  startMs,
  endMs,
  timestampMs: Math.round((startMs + endMs) / 2),
  confidence: null,
});

// Word-level timings straight from Edge's WordBoundary events.
const fromWordBoundaries = (entries: RawEntry[]): Caption[] => {
  const out: Caption[] = [];
  for (const e of entries) {
    const text = entryText(e);
    const { Offset, Duration } = e.Data ?? {};
    if (!text || Offset === undefined || Duration === undefined) continue;
    const startMs = Math.round(Offset / TICKS_PER_MS);
    const endMs = Math.round((Offset + Duration) / TICKS_PER_MS);
    const prev = out[out.length - 1];
    if (prev && isPunctuation(text)) {
      // Attach stray punctuation to the previous word instead of making it a word of its own
      prev.text += text;
      prev.endMs = Math.max(prev.endMs, endMs);
      prev.timestampMs = Math.round((prev.startMs + prev.endMs) / 2);
      continue;
    }
    out.push(makeCaption(` ${text}`, startMs, endMs)); // leading space marks a new word (Remotion convention)
  }
  return out;
};

// Fallback when the service only sends sentence boundaries: spread each sentence's
// time over its words, weighted by word length. Approximate, not exact.
const fromSentenceBoundaries = (entries: RawEntry[]): Caption[] => {
  const out: Caption[] = [];
  for (const e of entries) {
    const text = entryText(e);
    const { Offset, Duration } = e.Data ?? {};
    if (!text || Offset === undefined || Duration === undefined) continue;
    const start = Offset / TICKS_PER_MS;
    const total = Duration / TICKS_PER_MS;
    const words = text.split(/\s+/).filter(Boolean);
    const weights = words.map((w) => w.length + 1);
    const sum = weights.reduce((a, b) => a + b, 0);
    let cursor = start;
    words.forEach((w, i) => {
      const len = (weights[i] / sum) * total;
      out.push(
        makeCaption(` ${w}`, Math.round(cursor), Math.round(cursor + len)),
      );
      cursor += len;
    });
  }
  return out;
};

// A word may not start before the previous one ends; every word needs a positive length.
const tidy = (captions: Caption[]): Caption[] => {
  for (let i = 1; i < captions.length; i++) {
    if (captions[i].startMs < captions[i - 1].endMs) {
      captions[i - 1].endMs = Math.max(
        captions[i - 1].startMs + 1,
        captions[i].startMs,
      );
    }
  }
  return captions.map((c) => ({
    ...c,
    endMs: Math.max(c.endMs, c.startMs + 1),
    timestampMs: Math.round((c.startMs + Math.max(c.endMs, c.startMs + 1)) / 2),
  }));
};

export const edgeMetadataToCaptions = (raw: unknown): WordsResult => {
  const entries: RawEntry[] = Array.isArray(raw)
    ? (raw as RawEntry[])
    : ((raw as { Metadata?: RawEntry[] } | null)?.Metadata ?? []);

  const words = fromWordBoundaries(
    entries.filter((e) => e.Type === "WordBoundary"),
  );
  if (words.length > 0) return { captions: tidy(words), mode: "word" };

  const sentences = fromSentenceBoundaries(
    entries.filter((e) => e.Type === "SentenceBoundary"),
  );
  if (sentences.length > 0)
    return { captions: tidy(sentences), mode: "sentence-estimate" };

  const types =
    [...new Set(entries.map((e) => e.Type ?? "?"))].join(", ") || "none";
  throw new Error(
    `No WordBoundary or SentenceBoundary entries found (entry types seen: ${types})`,
  );
};
