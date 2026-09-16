import { MARKETING_REELS } from "@/lib/constants/marketing-media";

/**
 * THE RE-RENDER RUNBOOK (the media-kit track, round two).
 *
 * ★ ROUND ONE SAID THIS NEEDED A CODE EDIT. It does not, and that is the round's
 * second correction. The survey read `FIXTURES` at the top of `reel-parity.tsx`,
 * saw eight hardcoded ids and wrote "this is a code edit, not a control". Twenty
 * lines further down the same file there is a `CLIP_SETS` picker, and both
 * recorded recipes are already in it, in order:
 *
 *   hero-candidate-01  =  "Marketing: mixed 6"       (its six clip ids, in order)
 *   hero-candidate-02  =  "Marketing: festival arc"  (its four clip ids, in order)
 *
 * `matchClipSet` below checks that claim against the manifest rather than
 * asserting it, and `runbook.test.ts` fails the suite the day either list drifts,
 * which is the whole friction that is left: the pairing is true and nothing in
 * the tree says so, so the next person to re-render rediscovers it or edits code
 * they did not need to edit.
 *
 * ★ The engine encodes IN A BROWSER (WebCodecs, `reel/engine/encode.ts`); the
 * Lambda path was torn down 2026-07-08. There is no headless renderer to point at
 * a file, so a re-render is a person at a machine with Chrome. Budget for it.
 *
 * ★ IT OUTLIVED THE BOARD SECTION THAT RENDERED IT (round six, the catalog,
 * 2026-09-16). The runbook section left the board with ten others; this module
 * and its suite stay, because docs/specs/media-kit.md section 6 claims both
 * recipes are already in the parity page's own clip-set picker, and the claim
 * has to keep being true. Nothing renders it now: `matchClipSet` reads the
 * page's real picker and `runbook.test.ts` fails the day either list drifts.
 */

/** The clip sets the parity page offers today, transcribed from its own literal. */
export const CLIP_SETS: Readonly<Record<string, readonly string[]>> = {
  "Lab pack (current)": [
    "wedding-golden",
    "wedding-petals",
    "reception-table",
    "concert-confetti",
    "festival-crowd",
    "wedding-toast",
    "reception-hall",
    "party-dj",
  ],
  "Marketing: wedding arc": [
    "wedding-golden",
    "wedding-rings",
    "wedding-arch",
    "wedding-petals",
    "wedding-toast",
    "reception-table",
  ],
  "Marketing: party arc": [
    "party-balloons",
    "reception-hall",
    "party-dj",
    "concert-confetti",
  ],
  "Marketing: festival arc": [
    "festival-lights",
    "festival-crowd",
    "concert-confetti",
    "party-dj",
  ],
  "Marketing: mixed 6": [
    "wedding-golden",
    "party-balloons",
    "festival-crowd",
    "wedding-petals",
    "party-dj",
    "wedding-toast",
  ],
};

/** The set whose clips are the recipe's, in order, or null if a code edit is needed. */
export function matchClipSet(clipIds: readonly string[]): string | null {
  for (const [label, ids] of Object.entries(CLIP_SETS)) {
    if (
      ids.length === clipIds.length &&
      ids.every((id, i) => id === clipIds[i])
    ) {
      return label;
    }
  }
  return null;
}

export type RunbookStep = {
  n: number;
  do: string;
  /** What is on screen, or the exact value, so the step can be followed once. */
  detail: string;
  /** Where this step is friction rather than work. */
  friction?: string;
};

export function runbookFor(reelId: string): RunbookStep[] {
  const reel = MARKETING_REELS.find((r) => r.id === reelId);
  if (!reel) return [];
  const set = matchClipSet(reel.recipe.clipIds);
  return [
    {
      n: 1,
      do: "Open the parity page in Chrome",
      detail:
        "/design/lab/tools/reel-parity with the lab key. WebCodecs has to be available; the page probes on mount and disables Encode if it is not",
    },
    {
      n: 2,
      do: "Pick the clip set",
      detail: set
        ? `"${set}". Its clips are this recipe's clipIds in order, checked against the manifest by matchClipSet`
        : "No set matches this recipe, so CLIP_SETS in reel-parity.tsx needs the list adding",
      friction: set
        ? "Nothing in the tree says which set is which recipe. The parity page should read the list off a MARKETING_REELS recipe instead of carrying its own copy"
        : "This is the code edit the survey described, and it is real for any recipe not already in the picker",
    },
    {
      n: 3,
      do: "Set the style",
      detail: `Style "${reel.recipe.styleId}", seed ${reel.recipe.seed}, orientation ${reel.orientation}. Seed defaults to 73, which both recipes use`,
    },
    {
      n: 4,
      do: "Set the bitrate",
      detail: `${reel.recipe.sourceBitrate / 1e6} Mbps. The page defaults to 5, so this is a click`,
      friction:
        "DEFAULT_BITRATE is 5 Mbps and both recipes were rendered at 4. A default that does not match the recorded source is a silent way to lose determinism",
    },
    {
      n: 5,
      do: "Encode and download",
      detail:
        "The engine is deterministic per (clips, styleId, seed, orientation), so those four reproduce the source exactly",
    },
    {
      n: 6,
      do: "Run the finish, verbatim",
      detail: reel.recipe.finish,
      friction:
        "Recorded as prose, not as a command. A wiring round should record it as the argv it actually is so it can be pasted",
    },
    {
      n: 7,
      do: "Update the entry",
      detail:
        "Poster from the first graded frame, durationSeconds, shotBoundaries (transition midpoints, exact 1/24 s multiples, read off planReel) and renderedAt",
    },
  ];
}

/** What the wiring round has to add, in the order it bites. */
export const WIRING_ADDS: readonly string[] = [
  "A clip set that reads a MARKETING_REELS recipe rather than a literal, so a recorded loop re-renders from its own record and cannot drift from it.",
  "The bitrate preselected from the recipe's sourceBitrate rather than from DEFAULT_BITRATE.",
  "The finish step recorded as argv rather than as a sentence, so step 6 is a paste.",
  "A note on the entry saying which clip set reproduces it, until the first item lands.",
  "If ASSETS row 1 is delivered as a real cut, the landscape reel stops being a render at all and becomes a file. Only the portrait reel still needs this loop.",
];
