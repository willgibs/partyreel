"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { GUESTS, GUESTS_BIG, PEOPLE, whoOf } from "./fixtures";
import {
  arrivedOf,
  QuickLookShowcase,
  ViewAllPage,
  ViewAllShowcase,
  WayBackShowcase,
} from "./reach";
import {
  Ground,
  measureBack,
  measureCard,
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
 * screen is a knob all three decisions share, `who` picks the profile
 * `quick-look` and `way-back` draw, `count` is `view-all`'s own knob (24 or
 * 240), and `arrived` is `way-back`'s own (a chip tapped on the wedding, or
 * some other way in).
 *
 * ★ NONE OF THE THREE IS STAGED BEHIND ANOTHER. Round one staged four
 * decisions behind `exists` because they were parts of one container; these
 * three are independent components of one nav problem, and Will may answer
 * them in any order.
 */

const screen = (s: BoardState) => screenOf(s.screen as string);
const who = (s: BoardState) => PEOPLE[whoOf(s.who as string)];

/* ── view-all ─────────────────────────────────────────────────────────────── */

function viewAll(
  s: BoardState,
  option: "inline" | "sheet" | "modal" | "page",
) {
  const items = s.count === "small" ? GUESTS : GUESTS_BIG;
  if (option === "page") {
    return (
      <Scene
        id="view-all-page"
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
      id={`view-all-${option}`}
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

function quickLook(s: BoardState, option: "sheet" | "adaptive" | "none") {
  return (
    <Scene
      id={`quick-look-${option}`}
      screen={screen(s)}
      title="What a name opens first"
      measure={measureCard}
    >
      <Ground>
        <QuickLookShowcase
          option={option}
          person={who(s)}
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
      id={`way-back-${option}`}
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

const PREVIEWS: PreviewsFor<typeof PROFILE_PAGE> = {
  "view-all.inline": (s) => viewAll(s, "inline"),
  "view-all.sheet": (s) => viewAll(s, "sheet"),
  "view-all.modal": (s) => viewAll(s, "modal"),
  "view-all.page": (s) => viewAll(s, "page"),

  "quick-look.sheet": (s) => quickLook(s, "sheet"),
  "quick-look.adaptive": (s) => quickLook(s, "adaptive"),
  "quick-look.none": (s) => quickLook(s, "none"),

  "way-back.pill": (s) => wayBack(s, "pill"),
  "way-back.menu": (s) => wayBack(s, "menu"),
  "way-back.none": (s) => wayBack(s, "none"),
};

export function ProfilePageBoard() {
  return <ExplorationBoard spec={PROFILE_PAGE} previews={PREVIEWS} />;
}
