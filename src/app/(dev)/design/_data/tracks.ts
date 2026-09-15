import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";

/**
 * The desk's view of docs/tracks/: every manifest's track, status and preview
 * flag, read at request time (next.config traces the directory into the
 * /design/ functions). The manifests are the record; this reads, never writes.
 */
export type TrackState = {
  track: string;
  status: "open" | "handed-off" | "integrated" | string;
  preview: boolean;
  /** Rounds integrated so far: the `merged_round_N` keys plus the current `merged`. */
  rounds: number;
};

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
    const data = matter(readFileSync(join(dir, f), "utf8"))
      .data as Partial<TrackState>;
    if (typeof data.track !== "string") continue;
    const past = Object.keys(data)
      .map((k) => /^merged_round_(\d+)$/.exec(k))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => Number(m[1]));
    const rounds =
      (past.length ? Math.max(...past) : 0) +
      (typeof (data as { merged?: unknown }).merged === "string" ? 1 : 0);
    out.set(data.track, {
      track: data.track,
      status: typeof data.status === "string" ? data.status : "open",
      preview: data.preview === true,
      rounds,
    });
  }
  return out;
}

/** The review alias every lp/<track> push builds while its manifest says so. */
export function trackAlias(track: string): string {
  return `https://partyreel-git-lp-${track}-partyreel.vercel.app`;
}
