import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

// The reader is `server-only` (node:fs at request time); the unit project has
// no react-server condition, so the marker module is stubbed out here.
vi.mock("server-only", () => ({}));

import { __manifestParsers, readTrackStates, trackList } from "./tracks";

const { goalOf, lookAtFirstOf, firstSentence, plain } = __manifestParsers;

/**
 * THE MANIFEST READER (the Library x Lab round, 2026-09-15). The desk quotes
 * two sentences out of every manifest rather than restating them, so the two
 * parsers are the thing that can silently go wrong: they are pinned here on
 * written fixtures AND on the real directory, which is the only way to catch a
 * manifest style that the regexes do not survive.
 */

describe("the manifest's sentences", () => {
  it("takes the Goal's first sentence, de-wrapped and plain", () => {
    expect(
      goalOf(
        [
          "# lp/x",
          "",
          "**Goal.** The desk as Will's queue, the review session, the",
          "transcription script. (1) The desk (`/design/lab`): every standing board.",
          "",
          "**Binds.** The bible.",
        ].join("\n"),
      ),
    ).toBe(
      "The desk as Will's queue, the review session, the transcription script.",
    );
  });

  it("has no goal when the manifest states none", () => {
    expect(goalOf("# lp/x\n\nSome prose.")).toBeNull();
  });

  it("takes the LAST handoff's look-at-first line", () => {
    expect(
      lookAtFirstOf(
        [
          "## Handoff (round 1)",
          "- Look at first: part B, the aurora at accent on cinema.",
          "## Handoff (round 2)",
          "- Look at first: the composer, which is the whole answer this",
          "  round. Then part A.",
        ].join("\n"),
      ),
    ).toBe("the composer, which is the whole answer this round.");
  });

  it("skips the template's unfilled line", () => {
    expect(lookAtFirstOf("- Look at first: ...")).toBeNull();
  });

  it("does not cut a sentence at an abbreviation or a lower-case start", () => {
    expect(firstSentence("Tuned e.g. the dock. Then the rest.")).toBe(
      "Tuned e.g. the dock.",
    );
    expect(firstSentence("No terminator here")).toBe("No terminator here");
  });

  it("lifts bold, code and link syntax off a line meant to be read", () => {
    expect(plain("**Goal.** The `desk` and [the record](docs/x.md).")).toBe(
      "Goal. The desk and the record.",
    );
  });
});

describe("the manifests on disk", () => {
  const tracks = trackList();

  it("reads every manifest in docs/tracks", () => {
    expect(tracks.length).toBeGreaterThan(0);
    expect(readTrackStates().get(tracks[0].track)).toBeDefined();
  });

  it("finds a goal in exactly the manifests that state one", () => {
    // The parser's contract against the real files, not a rule about how a
    // manifest is written: a body carrying `**Goal.**` must yield a sentence,
    // and one without (the orchestrator's own record, a manifest that opens
    // with its review notes) must yield null rather than a wrong guess.
    const dir = join(process.cwd(), "docs", "tracks");
    const stated = new Set(
      readdirSync(dir)
        .filter((f) => f.endsWith(".md") && f !== "README.md")
        .filter((f) =>
          /^\*\*Goal\.\*\*/m.test(readFileSync(join(dir, f), "utf8")),
        )
        .map((f) => f.replace(/\.md$/, "")),
    );
    expect(stated.size).toBeGreaterThan(0);
    for (const t of tracks) {
      expect(Boolean(t.goal), `${t.track}`).toBe(stated.has(t.track));
    }
  });

  it("orders open, then handed off, then integrated", () => {
    const rank = { open: 0, "handed-off": 1, integrated: 2 } as Record<
      string,
      number
    >;
    const ranks = tracks.map((t) => rank[t.status] ?? 9);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("keeps a merged track's round count above zero", () => {
    for (const t of tracks.filter((x) => x.merged)) {
      expect(
        t.rounds,
        `${t.track} is merged but counts no round`,
      ).toBeGreaterThan(0);
    }
  });
});
