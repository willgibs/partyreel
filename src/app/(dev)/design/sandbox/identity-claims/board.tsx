"use client";

import "./identity-claims.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { type Fact, measureOf, Scene, Trio } from "./scene";
import { SCREENS, screenOf } from "./screens";
import { IDENTITY_CLAIMS } from "./spec";
import { ClaimsWorld, type Pointer } from "./world";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each of `pointer`'s five answers played as a
 * strategy, three frames read in the order time runs (`Trio`: a row of phones,
 * a column of laptops).
 *
 *   1. NOW, AT MAYA & JAY: the moment card as she confirms (and, for `bell`,
 *      her avatar). Live: its button does what the option does.
 *   2. WHERE SHE SORTS THEM: the one review, open where the option opens it
 *      (over the album, or on her dashboard), or for `bell` the bell's panel
 *      one tap before it. In a hand the panel's Back names the page under it.
 *   3. A WEEK ON, IF SHE NEVER DOES: her dashboard with all four still
 *      waiting, which is where every option leaves them (the banner, settled;
 *      `bell`'s count beside it). Four of the five land on the same third
 *      frame, and that is the finding the frame is there to show.
 *
 * ★ EVERY FRAME IS A SCRIPT, NOT A PICTURE (`batch.ts`): the frame opens where
 * the machine lands and is live from there, so a Claim in frame 2 settles a
 * Guest card into Your events and the caption, read off the frame, follows.
 */

type Moment = {
  title: string;
  start: "album" | "dashboard";
  open?: boolean;
  bell?: boolean;
  measure: Fact[];
};

/*
 * What each frame's caption reads, in the order it leads with. Every frame
 * asks for every fact and `measureOf` says only what is on show (a fact about
 * a page the frame is not showing, or about the page under an open review, is
 * skipped), so a press that turns an album into the dashboard, or closes the
 * review, is described as it lands.
 */
const NOW: Fact[] = [
  "moment",
  "avatar",
  "menu",
  "banner",
  "events",
  "bell",
  "review",
  "dialog",
  "toast",
];
const SORTING: Fact[] = [
  "bell",
  "review",
  "moment",
  "avatar",
  "menu",
  "banner",
  "events",
  "dialog",
  "toast",
];
const LATER: Fact[] = [
  "banner",
  "bell",
  "events",
  "review",
  "moment",
  "avatar",
  "menu",
  "dialog",
  "toast",
];

/** Where each option has her sort the four, and when. */
const SORTS: Record<Pointer, Moment> = {
  quiet: {
    title: "Whenever she next opens her dashboard",
    start: "dashboard",
    open: true,
    measure: SORTING,
  },
  line: {
    title: "When she taps Review all 4",
    start: "dashboard",
    open: true,
    measure: SORTING,
  },
  here: {
    title: "When she taps Review all 4",
    start: "album",
    open: true,
    measure: SORTING,
  },
  named: {
    title: "When she taps Review all 4",
    start: "album",
    open: true,
    measure: SORTING,
  },
  bell: {
    title: "Whenever she opens the bell",
    start: "dashboard",
    bell: true,
    measure: SORTING,
  },
};

function momentsOf(pointer: Pointer): Moment[] {
  return [
    { title: "Now, at Maya & Jay", start: "album", measure: NOW },
    SORTS[pointer],
    {
      title: "Her dashboard a week on, never sorted",
      start: "dashboard",
      measure: LATER,
    },
  ];
}

function pointerScreen(pointer: Pointer, s: BoardState) {
  const screen = screenOf(s.screen);
  const size = SCREENS[screen].size;
  return (
    <Trio row={size === "phone"}>
      {momentsOf(pointer).map((m, i) => (
        <Scene
          key={i}
          id={`pointer-${pointer}-${i + 1}`}
          screen={screen}
          title={m.title}
          measure={measureOf(...m.measure)}
        >
          <ClaimsWorld
            // A world keyed by everything that shapes it, so a new option or
            // a new screen starts fresh rather than mid-press.
            key={`${pointer}-${i}-${screen}`}
            pointer={pointer}
            size={size}
            start={m.start}
            open={m.open}
            bell={m.bell}
          />
        </Scene>
      ))}
    </Trio>
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY_CLAIMS> = {
  "pointer.quiet": (s) => pointerScreen("quiet", s),
  "pointer.line": (s) => pointerScreen("line", s),
  "pointer.here": (s) => pointerScreen("here", s),
  "pointer.named": (s) => pointerScreen("named", s),
  "pointer.bell": (s) => pointerScreen("bell", s),
};

export function IdentityClaimsBoard() {
  return <ExplorationBoard spec={IDENTITY_CLAIMS} previews={PREVIEWS} />;
}
