"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  GUESTS,
  GUESTS_BIG,
  PEOPLE,
  TAPPED,
  tappedOf,
  whoOf,
} from "./fixtures";
import {
  arrivedOf,
  HeadAgainShowcase,
  QuickLookShowcase,
  ViewAllPage,
  ViewAllShowcase,
  WayBackShowcase,
} from "./reach";
import {
  Ground,
  measureBack,
  measureCard,
  measureHead,
  measureList,
  Scene,
  screenOf,
} from "./scene";
import { PROFILE_PAGE } from "./spec";

/**
 * THE PREVIEWS, and nothing else: every option is the real guest list or the
 * real profile at a real viewport, phone first, with one thing changed.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE, as round one's was: the
 * screen is a knob all three decisions share, `count` is `view-all`'s own knob
 * (24 or 240), `tapped` is `quick-look`'s (a name with a page, a confirmed
 * account without one, a typed name), `who` picks the page `way-back` draws,
 * and `arrived` is `way-back`'s own (a chip tapped on the wedding, or some
 * other way in). Each knob rides its scene's id, so a caption is measured
 * again the moment the knob moves rather than whenever the frame resizes.
 *
 * ★ NONE OF THE THREE IS STAGED BEHIND ANOTHER. Round one staged four
 * decisions behind `exists` because they were parts of one container; these
 * three are independent components of one nav problem, and Will may answer
 * them in any order.
 */

const screen = (s: BoardState) => screenOf(s.screen as string);
const who = (s: BoardState) => PEOPLE[whoOf(s.who as string)];
const tappedId = (s: BoardState) => tappedOf(s.tapped as string);

/* ── view-all ─────────────────────────────────────────────────────────────── */

function viewAll(
  s: BoardState,
  option: "inline" | "sheet" | "centred" | "page",
) {
  const small = s.count === "small";
  const items = small ? GUESTS : GUESTS_BIG;
  if (option === "page") {
    return (
      <Scene
        id={`view-all-page-${small ? "small" : "big"}`}
        screen={screen(s)}
        title="Its own page"
        measure={measureList}
      >
        <Ground>
          <ViewAllPage items={items} />
        </Ground>
      </Scene>
    );
  }
  return (
    <Scene
      id={`view-all-${option}-${small ? "small" : "big"}`}
      screen={screen(s)}
      title="The full list, from the faces row"
      measure={measureList}
    >
      <Ground>
        <ViewAllShowcase option={option} items={items} />
      </Ground>
    </Scene>
  );
}

/* ── quick-look ───────────────────────────────────────────────────────────── */

function quickLook(s: BoardState, option: "sheet" | "mini-modal" | "none") {
  return (
    <Scene
      id={`quick-look-${option}-${tappedId(s)}`}
      screen={screen(s)}
      title="What a name opens first"
      measure={measureCard}
    >
      <Ground>
        <QuickLookShowcase
          option={option}
          tapped={TAPPED[tappedId(s)]}
          screen={screen(s)}
        />
      </Ground>
    </Scene>
  );
}

/* ── way-back ─────────────────────────────────────────────────────────────── */

function wayBack(s: BoardState, option: "pill" | "menu" | "none") {
  return (
    <Scene
      id={`way-back-${option}-${whoOf(s.who as string)}`}
      screen={screen(s)}
      title="Back to the scanned event"
      measure={measureBack}
    >
      <Ground>
        <WayBackShowcase
          option={option}
          person={who(s)}
          arrived={arrivedOf(s.arrived as string)}
        />
      </Ground>
    </Scene>
  );
}

/* ── head, asked again ────────────────────────────────────────────────────── */

function headAgain(s: BoardState, option: "today" | "quiet" | "bare") {
  return (
    <Scene
      id={`head-${option}-${whoOf(s.who as string)}`}
      screen={screen(s)}
      title="What stands above them"
      measure={measureHead}
    >
      <Ground>
        <HeadAgainShowcase option={option} person={who(s)} />
      </Ground>
    </Scene>
  );
}

const PREVIEWS: PreviewsFor<typeof PROFILE_PAGE> = {
  "view-all.inline": (s) => viewAll(s, "inline"),
  "view-all.sheet": (s) => viewAll(s, "sheet"),
  "view-all.centred": (s) => viewAll(s, "centred"),
  "view-all.page": (s) => viewAll(s, "page"),

  "quick-look.sheet": (s) => quickLook(s, "sheet"),
  "quick-look.mini-modal": (s) => quickLook(s, "mini-modal"),
  "quick-look.none": (s) => quickLook(s, "none"),

  "way-back.pill": (s) => wayBack(s, "pill"),
  "way-back.menu": (s) => wayBack(s, "menu"),
  "way-back.none": (s) => wayBack(s, "none"),

  "head.today": (s) => headAgain(s, "today"),
  "head.quiet": (s) => headAgain(s, "quiet"),
  "head.bare": (s) => headAgain(s, "bare"),
};

export function ProfilePageBoard() {
  return <ExplorationBoard spec={PROFILE_PAGE} previews={PREVIEWS} />;
}
