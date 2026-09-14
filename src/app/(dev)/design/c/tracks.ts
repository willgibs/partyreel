import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";

/**
 * The desk's view of docs/tracks/: every manifest's track, status and preview
 * flag, read at request time (next.config traces the directory into the
 * /design/c function). The manifests are the record; this reads, never writes.
 */
export type TrackState = {
  track: string;
  status: "open" | "handed-off" | "integrated" | string;
  preview: boolean;
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
    out.set(data.track, {
      track: data.track,
      status: typeof data.status === "string" ? data.status : "open",
      preview: data.preview === true,
    });
  }
  return out;
}

/** The review alias every lp/<track> push builds while its manifest says so. */
export function trackAlias(track: string): string {
  return `https://partyreel-git-lp-${track}-partyreel.vercel.app`;
}
