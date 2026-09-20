"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { PALETTE_NAME } from "./fixtures";
import type { Look, PaletteMode } from "./gradient";
import type { AfterUpload, CrowdMode, LetterMode, OrbOptions } from "./orb";
import { SEED_AVATAR } from "./spec";
import {
  measureCrowd,
  measureLetters,
  measurePhoto,
  Scene,
  type ScreenId,
  screenOf,
} from "./stage";
import {
  AccountForm,
  Crowd,
  Dashboard,
  GuestBar,
  IdentityRow,
  PhotoProof,
  RenameProof,
  SizeLadder,
} from "./surfaces";

/**
 * THE PREVIEWS: every option on the real avatar surfaces, at 375 with 1440 on the
 * knob, against the grey it replaces.
 *
 * ★ EVERY DECISION IS DRAWN IN THE WORLD THE ONES BEFORE IT SETTLED. Four of the
 * seven are staged behind `look`, and a staged option's preview is a FUNCTION of the
 * board's state (`exploration.ts`), so `the-crowd`, `palette` and `letter` all draw
 * in whatever shape was actually chosen rather than in the one this file defaulted
 * to. Judging the wheel on a sphere when the sphere lost would be judging it on
 * nothing.
 *
 * ★ AND THE THREE INDEPENDENT ONES READ THE STATE TOO. `seed`, `after-upload` and
 * `motion` carry no `after` (they can be answered in any order), but there is no
 * reason to draw them in a shape he has already ruled against, so they wear the
 * board's current `look` and `palette` as well. The cost of reading state a
 * decision does not depend on is nothing; the cost of not reading it is a tile that
 * disagrees with the four above it.
 */

/** The options every frame inherits from what has already been answered. */
function worn(s: BoardState): OrbOptions {
  return {
    look: (s.look as Look) ?? "orb",
    palette: (s.palette as PaletteMode) ?? "wheel",
    letter: (s.letter as LetterMode) ?? "always",
    after: (s["after-upload"] as AfterUpload) ?? "replace",
  };
}

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string | undefined);

/* ── 1. The shape ────────────────────────────────────────────────────────── */

/** The frame's own short name, which is what a capture and a screen reader read.
 *  Kept apart from the option's `means` on purpose: a frame title that is a whole
 *  sentence reads as "The shape, two hues, one straight ramp corner to corner, no
 *  light source., a laptop" in the iframe's title, which is how it read at first. */
const LOOK_TITLE: Record<Look, string> = {
  orb: "a lit sphere",
  diagonal: "two hues on a diagonal",
  aurora: "two hues over a ground",
  flat: "one flat colour",
};

function lookScreen(look: Look, s: BoardState) {
  const sc = screen(s);
  const options = { ...worn(s), look };
  return (
    <Scene
      id={`look-${look}`}
      screen={sc}
      title={`The shape, ${LOOK_TITLE[look]}`}
      measure={measureCrowd}
    >
      {/* The shape big enough to judge as a shape, and then the same shape at the
          24px a guest list actually meets it at. Both, in one frame, because an orb
          that is beautiful at 80 and mud at 24 is a wrong answer that looks right. */}
      <IdentityRow source="account" options={options} />
      <div className="px-5 pb-8">
        <Crowd source="account" options={options} reference />
      </div>
    </Scene>
  );
}

/* ── 2. The crowd ────────────────────────────────────────────────────────── */

const CROWD_NOTE: Record<CrowdMode, string> = {
  full: "The row and the whole opened list, every person at full strength.",
  quiet: "Colour on the six faces, today's grey through the opened list.",
  soft: "Everyone coloured, the chroma held back inside the opened list.",
};

function crowdScreen(crowd: CrowdMode, s: BoardState) {
  return (
    <Scene
      id={`crowd-${crowd}`}
      screen={screen(s)}
      title="The album's guest list"
      measure={measureCrowd}
    >
      <div className="px-5 py-6">
        <p className="mb-5 text-sm text-muted-foreground">{CROWD_NOTE[crowd]}</p>
        <Crowd source="account" options={worn(s)} crowd={crowd} reference />
      </div>
    </Scene>
  );
}

/* ── 3. The wheel ────────────────────────────────────────────────────────── */

function paletteScreen(palette: PaletteMode, s: BoardState) {
  const options = { ...worn(s), palette };
  return (
    <Scene
      id={`palette-${palette}`}
      screen={screen(s)}
      title={`The wheel, ${PALETTE_NAME[palette]}`}
      measure={measureCrowd}
    >
      <div className="px-5 py-6">
        {/* Twenty-four in one list is the only frame this question has: the whole
            argument is about what two strangers next to each other look like. */}
        <Crowd source="account" options={options} reference />
      </div>
    </Scene>
  );
}

/* ── 4. The initial ──────────────────────────────────────────────────────── */

const LETTER_NOTE: Record<LetterMode, string> = {
  always: "24, 32 and 40 all carry the initial.",
  never: "No letter at any size: the colour is the whole mark.",
  large: "Only 40 keeps it; a guest list's chips are colour alone.",
};

function letterScreen(letter: LetterMode, s: BoardState) {
  const options = { ...worn(s), letter };
  return (
    <Scene
      id={`letter-${letter}`}
      screen={screen(s)}
      title="The initial, at every size the contract names"
      measure={measureLetters}
    >
      <div className="px-5 py-6">
        <p className="mb-5 text-sm text-muted-foreground">{LETTER_NOTE[letter]}</p>
        <SizeLadder source="account" options={options} />
        <div className="mt-8">
          {/* Twelve, not twenty-four: below the threshold the shipped list draws
              chips with a name beside every face, which is the case where a letter
              has the least to do. The faces row above it is the case where it has
              the most, and the two sit in one frame on purpose. */}
          <Crowd source="account" options={options} short />
        </div>
      </div>
    </Scene>
  );
}

/* ── 5. The seed ─────────────────────────────────────────────────────────── */

const SEED_NOTE = {
  account: "The account id: nothing a person can edit moves the colour.",
  name: "The display name: the colour follows every edit to it.",
  handle: "The handle where there is one, the account id where there is not.",
} as const;

type SeedOption = keyof typeof SEED_NOTE;

function seedScreen(source: SeedOption, s: BoardState) {
  const options = worn(s);
  return (
    <Scene
      id={`seed-${source}`}
      screen={screen(s)}
      title="One person, three moments"
      short
      caption={SEED_NOTE[source]}
    >
      <div className="px-5 py-6">
        <p className="mb-5 text-sm text-muted-foreground">{SEED_NOTE[source]}</p>
        <RenameProof source={source} options={options} />
        <div className="mt-8 border-t border-border/60 pt-6">
          <Crowd source={source} options={options} short />
        </div>
      </div>
    </Scene>
  );
}

/* ── 6. After a photograph ───────────────────────────────────────────────── */

const AFTER_NOTE: Record<AfterUpload, string> = {
  replace: "The colour unmounts the moment the photograph decodes.",
  rim: "Two pixels of the person's own hue survive around their face.",
  under: "The photograph paints over the colour rather than instead of it.",
};

function afterScreen(after: AfterUpload, s: BoardState) {
  const options = { ...worn(s), after };
  return (
    <Scene
      id={`after-${after}`}
      screen={screen(s)}
      title="Every surface that can hold a face"
      measure={measurePhoto}
    >
      <div className="px-5 py-6">
        <p className="mb-5 text-sm text-muted-foreground">{AFTER_NOTE[after]}</p>
        <PhotoProof source="account" options={options} />
      </div>
    </Scene>
  );
}

/* ── 7. Motion ───────────────────────────────────────────────────────────── */

const MOTION_NOTE = {
  none: "Nothing moves. One paint, no loop, no frame budget spent.",
  page: "The 80px avatar drifts over 14 seconds; the list below it is still.",
  hover: "The light shifts under a pointer, and never on a phone.",
} as const;

type MotionOption = keyof typeof MOTION_NOTE;

const DRIFT: Record<MotionOption, OrbOptions["drift"]> = {
  none: "none",
  page: "always",
  hover: "hover",
};

function motionScreen(motion: MotionOption, s: BoardState) {
  const base = worn(s);
  return (
    <Scene
      id={`motion-${motion}`}
      screen={screen(s)}
      title="A profile, and the list on the album it came from"
      caption={MOTION_NOTE[motion]}
    >
      {/* The drift is only ever on the profile's own 80px disc in the `page`
          option, so the list under it carries the hover option and nothing else:
          the frame shows exactly which avatars would move and which would not. */}
      <IdentityRow
        source="account"
        options={{ ...base, drift: motion === "hover" ? "hover" : DRIFT[motion] }}
      />
      <div className="px-5 pb-8">
        <Crowd
          source="account"
          options={{ ...base, drift: motion === "page" ? "none" : DRIFT[motion] }}
          short
        />
      </div>
    </Scene>
  );
}

/* ── The two menus, shown under the shape question's own frames ──────────── */

/**
 * ★ THE MENUS ARE NOT A DECISION OF THEIR OWN, and that is a deliberate cut. Both
 * account menus draw one 32px avatar and nothing about them varies per option, so
 * asking about them would be asking the same question twice. They ride `look`'s
 * 1440 frame instead, where there is room beside the crowd, so the two surfaces a
 * host and a guest meet every session are still SEEN before anything is picked.
 */
function menusScreen(look: Look, s: BoardState) {
  const options = { ...worn(s), look };
  return (
    <Scene
      id={`menus-${look}`}
      screen="375"
      title="The two account menus"
      short
      caption="The same 32px avatar on the host's dashboard and a guest's event page."
    >
      <Dashboard source="account" options={options} />
      <div className="border-t border-border">
        <GuestBar source="account" options={options} />
      </div>
      <AccountForm source="account" options={options} />
    </Scene>
  );
}

/* ── The map ─────────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof SEED_AVATAR> = {
  "look.orb": (s) => (
    <>
      {lookScreen("orb", s)}
      {menusScreen("orb", s)}
    </>
  ),
  "look.diagonal": (s) => (
    <>
      {lookScreen("diagonal", s)}
      {menusScreen("diagonal", s)}
    </>
  ),
  "look.aurora": (s) => (
    <>
      {lookScreen("aurora", s)}
      {menusScreen("aurora", s)}
    </>
  ),
  "look.flat": (s) => (
    <>
      {lookScreen("flat", s)}
      {menusScreen("flat", s)}
    </>
  ),

  "the-crowd.full": (s) => crowdScreen("full", s),
  "the-crowd.quiet": (s) => crowdScreen("quiet", s),
  "the-crowd.soft": (s) => crowdScreen("soft", s),

  "palette.wheel": (s) => paletteScreen("wheel", s),
  "palette.curated": (s) => paletteScreen("curated", s),
  "palette.warm": (s) => paletteScreen("warm", s),

  "letter.always": (s) => letterScreen("always", s),
  "letter.never": (s) => letterScreen("never", s),
  "letter.large": (s) => letterScreen("large", s),

  "seed.account": (s) => seedScreen("account", s),
  "seed.name": (s) => seedScreen("name", s),
  "seed.handle": (s) => seedScreen("handle", s),

  "after-upload.replace": (s) => afterScreen("replace", s),
  "after-upload.rim": (s) => afterScreen("rim", s),
  "after-upload.under": (s) => afterScreen("under", s),

  "motion.none": (s) => motionScreen("none", s),
  "motion.page": (s) => motionScreen("page", s),
  "motion.hover": (s) => motionScreen("hover", s),
};

export function SeedAvatarBoard(): ReactNode {
  return <ExplorationBoard spec={SEED_AVATAR} previews={PREVIEWS} />;
}
