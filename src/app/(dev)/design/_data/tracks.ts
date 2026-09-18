import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";

/**
 * THE DESK'S VIEW OF docs/tracks/ (the Library x Lab round, 2026-09-15): every
 * manifest's front matter plus the two lines the desk needs out of its body,
 * read at request time (next.config traces the directory into the /design/
 * functions). The manifests are the record; this reads, never writes, and
 * never restates a fact it could quote: `goal` and `lookAtFirst` are the
 * manifest's own sentences, lifted, so a track says here exactly what it says
 * there.
 *
 * `nav.ts` and `docs.ts` both read `readTrackStates`, so the four original
 * fields (track, status, preview, rounds) keep their names and meaning; the
 * rest is additive.
 */
export type TrackState = {
  track: string;
  status: "open" | "handed-off" | "integrated" | string;
  preview: boolean;
  /** Rounds integrated so far: the `merged_round_N` keys plus the current `merged`. */
  rounds: number;
  /** The launch-prep SHA the branch was cut from; null while the stub is unfilled. */
  cut: string | null;
  /** The branch head the Orchestrator merged, when it has. */
  merged: string | null;
  /** The manifest's Goal, first sentence: what the track is for, in one line. */
  goal: string | null;
  /** The last Handoff's "Look at first" line: where a reviewer starts. */
  lookAtFirst: string | null;
  /** The claimed path prefixes and the shared single-sources it reads. */
  owns: string[];
  reads: string[];
};

/** The review alias every lp/<track> push builds while its manifest says so. */
export function trackAlias(track: string): string {
  return `https://partyreel-git-lp-${track}-partyreel.vercel.app`;
}

// ── The body's two lines ─────────────────────────────────────────────────────

/**
 * A markdown paragraph starting at `from`: every line until a blank one, a
 * heading or a new list item, joined and de-wrapped. The manifests hard-wrap
 * at about 100 columns, so a sentence almost always spans lines.
 */
function paragraphAt(lines: string[], from: number): string {
  const out: string[] = [];
  for (let i = from; i < lines.length; i++) {
    const line = lines[i];
    const breaks = /^\s*$/.test(line) || /^\s*(#|[-*+]\s|\d+[.)]\s)/.test(line);
    if (i > from && breaks) break;
    out.push(line.trim());
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/** Bold, italic, code and link syntax lifted off a line meant to be read as text. */
function plain(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\W)\*([^*]+)\*/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The first sentence of a paragraph. A period ends one only when a space and a
 * capital (or a quote, a bracket, or nothing) follow, so "e.g. the dock" and a
 * mid-sentence "1440 x 900." stay whole.
 */
function firstSentence(text: string): string {
  const m = /^([\s\S]+?[.!?])(\s+["'(A-Z]|\s*$)/.exec(text);
  return (m ? m[1] : text).trim();
}

/** The manifest's `**Goal.**` paragraph, first sentence, as plain text. */
function goalOf(body: string): string | null {
  const lines = body.split("\n");
  const at = lines.findIndex((l) => /^\*\*Goal\.\*\*/.test(l));
  if (at < 0) return null;
  const para = paragraphAt(lines, at).replace(/^\*\*Goal\.\*\*\s*/, "");
  return firstSentence(plain(para)) || null;
}

/**
 * The LAST Handoff's "Look at first" line (a manifest carries one per round),
 * first sentence. This is the one line that says where a review starts, and
 * the desk's whole reason to read a body at all. An unfilled template line
 * ("Look at first: ...") is not an answer, so it is skipped.
 */
function lookAtFirstOf(body: string): string | null {
  const lines = body.split("\n");
  const label = /^\s*[-*+]\s*\*{0,2}Look at first\*{0,2}:?\s*/i;
  let found: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    if (!label.test(lines[i])) continue;
    const rest = paragraphAt(lines, i).replace(label, "");
    const text = firstSentence(plain(rest));
    if (text && !/^\.{2,}$/.test(text)) found = text;
  }
  return found;
}

// ── Reading ──────────────────────────────────────────────────────────────────

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

function stateOf(raw: string): TrackState | null {
  const { data, content } = matter(raw);
  const front = data as Record<string, unknown>;
  if (typeof front.track !== "string") return null;
  const past = Object.keys(front)
    .map((k) => /^merged_round_(\d+)$/.exec(k))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  const merged = typeof front.merged === "string" ? front.merged : null;
  return {
    track: front.track,
    status: typeof front.status === "string" ? front.status : "open",
    preview: front.preview === true,
    rounds: (past.length ? Math.max(...past) : 0) + (merged ? 1 : 0),
    // A stub's `cut` is still the angle-bracket placeholder; treat it as unset.
    cut:
      typeof front.cut === "string" && !front.cut.startsWith("<")
        ? front.cut
        : null,
    merged,
    goal: goalOf(content),
    lookAtFirst: lookAtFirstOf(content),
    owns: stringList(front.owns),
    reads: stringList(front.reads),
  };
}

export function readTrackStates(): Map<string, TrackState> {
  const dir = join(process.cwd(), "docs", "tracks");
  const out = new Map<string, TrackState>();
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(
      (f) => f.endsWith(".md") && f !== "README.md",
    );
  } catch {
    return out;
  }
  for (const f of files) {
    const state = stateOf(readFileSync(join(dir, f), "utf8"));
    if (state) out.set(state.track, state);
  }
  return out;
}

/** The manifests in reading order: open, then handed off, then integrated. */
export function trackList(): TrackState[] {
  const rank = (t: TrackState) =>
    t.status === "open" ? 0 : t.status === "handed-off" ? 1 : 2;
  return [...readTrackStates().values()].sort(
    (a, b) => rank(a) - rank(b) || a.track.localeCompare(b.track),
  );
}

/** The body parsers, exported for the desk's test; the manifests are its fixtures. */
export const __manifestParsers = {
  goalOf,
  lookAtFirstOf,
  firstSentence,
  plain,
};
