import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CLIP_SETS, matchClipSet, runbookFor } from "./runbook";

import { MARKETING_REELS } from "@/lib/constants/marketing-media";

/**
 * THE RUNBOOK, CHECKED (the media-kit track, round two).
 *
 * The runbook's whole claim is that both recorded reel recipes can be reproduced
 * from the parity page's own controls, with no code edit. A claim like that goes
 * stale the moment somebody reorders a clip set, so it is a test rather than a
 * sentence: the transcribed sets have to match the page's literal, and each
 * recipe has to match a set exactly, in order.
 */

const PARITY = join(
  process.cwd(),
  "src",
  "app",
  "(dev)",
  "design",
  "(shell)",
  "lab",
  "tools",
  "reel-parity",
  "parity.tsx",
);

describe("the reel re-render runbook", () => {
  it("every transcribed clip set is a set the parity page really offers", () => {
    const source = readFileSync(PARITY, "utf8");
    for (const [label, ids] of Object.entries(CLIP_SETS)) {
      expect(source.includes(`label: "${label}"`), label).toBe(true);
      for (const id of ids) {
        expect(source.includes(`"${id}"`), `${label} / ${id}`).toBe(true);
      }
    }
  });

  it("the page offers exactly the sets transcribed here, and no more", () => {
    const source = readFileSync(PARITY, "utf8");
    const labels = [...source.matchAll(/label: "([^"]+)"/g)].map((m) => m[1]);
    expect(labels.sort()).toEqual(Object.keys(CLIP_SETS).sort());
  });

  it("both recorded recipes are reachable from the picker, in order", () => {
    // Round one said re-rendering needed a code edit. It does not, and this is
    // the assertion that keeps that true.
    for (const reel of MARKETING_REELS) {
      expect(matchClipSet(reel.recipe.clipIds), reel.id).not.toBeNull();
    }
    expect(matchClipSet(MARKETING_REELS[0].recipe.clipIds)).toBe(
      "Marketing: mixed 6",
    );
    expect(matchClipSet(MARKETING_REELS[1].recipe.clipIds)).toBe(
      "Marketing: festival arc",
    );
  });

  it("every step names a real value from the recipe it is written for", () => {
    for (const reel of MARKETING_REELS) {
      const steps = runbookFor(reel.id);
      expect(steps.length, reel.id).toBe(7);
      const all = steps.map((s) => s.detail).join(" ");
      expect(all, reel.id).toContain(reel.recipe.styleId);
      expect(all, reel.id).toContain(String(reel.recipe.seed));
      expect(all, reel.id).toContain(reel.orientation);
      expect(all, reel.id).toContain(reel.recipe.finish);
    }
  });

  it("an unknown reel id yields no steps rather than a broken runbook", () => {
    expect(runbookFor("nope")).toEqual([]);
  });
});
