"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { captionFor, type RichLook } from "./looks";
import type { OrbOptions } from "./orb";
import { SEED_AVATAR } from "./spec";
import { Scene, type ScreenId, screenOf } from "./stage";
import {
  Crowd,
  Dashboard,
  GuestBar,
  IdentityRow,
  SizeLadder,
} from "./surfaces";

/**
 * ROUND TWO'S PREVIEWS: ONE DECISION, FOUR LOOKS, ON THE SAME REAL SURFACES.
 *
 * Round one's six retired screens (crowd, palette, letter, seed, after-upload,
 * motion) are gone with their asks (the `profile-page` r2 precedent: a round
 * replaces its questions, it does not accrete them; their answers stand in
 * docs/reviews/seed-avatar.json and rulings.md for good). What is left is the
 * one open question, drawn on exactly the surfaces the brief named: the
 * `Avatar` at 24, 32, 40 (`SizeLadder`) and 80 (`IdentityRow`, in the menus
 * scene below) with the initial, the guest list's faces row, the user menu
 * and the profile identity row — every one of them the real component,
 * `surfaces.tsx` quoting the shipped markup exactly as round one's did.
 */

const screen = (s: BoardState): ScreenId =>
  screenOf(s.screen as string | undefined);

const LOOK_TITLE: Record<RichLook, string> = {
  diagonal: "the diagonal, as wired",
  mesh: "hashvatar's own register",
  throw: "two pools of light",
  "lit-seam": "a lit seam on the ramp",
};

function optionsFor(look: RichLook): OrbOptions {
  return { look, palette: "wheel", letter: "always", after: "under" };
}

/** The primary evidence: every size the contract names, and the numbers on
 *  the frame ("measured, not hidden": `captionFor`, `looks.ts`). */
function sizesScreen(look: RichLook, s: BoardState) {
  const options = optionsFor(look);
  return (
    <Scene
      id={`sizes-${look}`}
      screen={screen(s)}
      title={`Every size, ${LOOK_TITLE[look]}`}
      caption={captionFor(look)}
    >
      <div className="px-5 py-6">
        <SizeLadder source="account" options={options} />
      </div>
    </Scene>
  );
}

/** The guest list a wedding actually wraps into: the faces row and the
 *  opened list, full colour (the-crowd=full, ruled), against today's grey. */
function crowdScreen(look: RichLook, s: BoardState) {
  const options = optionsFor(look);
  return (
    <Scene
      id={`crowd-${look}`}
      screen={screen(s)}
      title={`The guest list, ${LOOK_TITLE[look]}`}
    >
      <div className="px-5 py-6">
        <Crowd source="account" options={options} reference />
      </div>
    </Scene>
  );
}

/** The two account menus (32px) and a profile's own identity row (80px). Its
 *  own frame stays at 375 regardless of the screen knob, as round one's did:
 *  the menus are a phone-width surface with nothing to compare at 1440. */
function menusScreen(look: RichLook) {
  const options = optionsFor(look);
  return (
    <Scene
      id={`menus-${look}`}
      screen="375"
      title={`The account menu and a profile, ${LOOK_TITLE[look]}`}
      short
      caption="The 32px avatar on the host's dashboard and a guest's event page; the 80px identity row on a profile."
    >
      <Dashboard source="account" options={options} />
      <div className="border-t border-border">
        <GuestBar source="account" options={options} />
      </div>
      <IdentityRow source="account" options={options} />
    </Scene>
  );
}

const PREVIEWS: PreviewsFor<typeof SEED_AVATAR> = {
  "look.diagonal": (s) => (
    <>
      {sizesScreen("diagonal", s)}
      {crowdScreen("diagonal", s)}
      {menusScreen("diagonal")}
    </>
  ),
  "look.mesh": (s) => (
    <>
      {sizesScreen("mesh", s)}
      {crowdScreen("mesh", s)}
      {menusScreen("mesh")}
    </>
  ),
  "look.throw": (s) => (
    <>
      {sizesScreen("throw", s)}
      {crowdScreen("throw", s)}
      {menusScreen("throw")}
    </>
  ),
  "look.lit-seam": (s) => (
    <>
      {sizesScreen("lit-seam", s)}
      {crowdScreen("lit-seam", s)}
      {menusScreen("lit-seam")}
    </>
  ),
};

export function SeedAvatarBoard(): ReactNode {
  return <ExplorationBoard spec={SEED_AVATAR} previews={PREVIEWS} />;
}
