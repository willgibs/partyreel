"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { PEOPLE, whoOf } from "./fixtures";
import { arrivedOf, HeadAgainShowcase, WayBackShowcase } from "./reach";
import { Ground, measureBack, measureHead, Scene, screenOf } from "./scene";
import { PROFILE_PAGE } from "./spec";

/**
 * THE PREVIEWS, and nothing else: every option is the real profile at a real
 * viewport, phone first, with one thing changed.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE, as round one's was: the
 * screen is a knob both decisions share, `who` picks the page they draw, and
 * `arrived` is `way-back`'s own (a chip tapped on the wedding, or some other
 * way in). Each knob rides its scene's id, so a caption is measured again the
 * moment the knob moves rather than whenever the frame resizes.
 *
 * ★ NEITHER IS STAGED BEHIND THE OTHER: they are independent components of
 * one nav problem, and Will may answer them in any order. (`view-all` and
 * `quick-look` moved to the `popups` board, every option kept.)
 */

const screen = (s: BoardState) => screenOf(s.screen as string);
const who = (s: BoardState) => PEOPLE[whoOf(s.who as string)];

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
