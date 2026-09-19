"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  AccountPage,
  Dashboard,
  type Doors,
  EventSettings,
  HostApp,
  LockedRowNote,
  Receipt,
  Screen,
  type Size,
  type Words,
  doorsOf,
  fixtureOf,
  sizeOf,
  wordsOf,
} from "./chrome";
import { FIXTURES, PRO_SIZES, type Trigger, triggerOf } from "./fixtures";
import { APP_PRICING } from "./spec";
import {
  type Carry,
  type First,
  type Learn,
  PanelSurface,
  type PassWeight,
  type Shape,
  Surface,
  type World,
  carryOf,
  firstOf,
  learnOf,
  passOf,
  shapeOf,
} from "./surface";

/**
 * THE PREVIEWS, AND NOTHING ELSE: eight decisions, one surface, one app.
 *
 * ★ ONE WORLD, EIGHT AXES. Every picture is the same shell around the same
 * host with exactly one axis moved, which is what makes eight questions one
 * board: how much the surface carries is judged in the shape he picked, at the
 * first view he picked, for the host the knob says; the words at a gate are
 * judged knowing what the surface will say. Each preview reads the live state
 * and overrides only its own axis, so answering the object redraws every later
 * question inside that answer.
 *
 * ★ 1440 AND 375, AND FOUR HOSTS. Two knobs ride every decision's strip: the
 * window, because a host buys on a phone at the party and on a laptop the
 * morning after, and who clicked, because a pricing surface is only as good as
 * its worst moment. The two decisions that only exist for one host (the words
 * at a locked control, and what Checkout comes back to) pin the host and say so.
 *
 * ★ NOTHING HERE REACHES STRIPE. Every buy button is a plain Button and the
 * shipped meter is drawn with `hasBilling` false, which is the flag its
 * CheckoutButton and ManageBillingButton hang on. See surface.tsx.
 */

type W = {
  size: Size;
  trigger: Trigger;
  shape: Shape;
  first: First;
  carry: Carry;
  learn: Learn;
  pass: PassWeight;
  doors: Doors;
  words: Words;
  back: string;
};

const worldOf = (s: BoardState, over: Partial<W> = {}): W => ({
  size: sizeOf(s.size),
  trigger: triggerOf(s.from),
  shape: shapeOf(s.object),
  first: firstOf(s.first),
  carry: carryOf(s.carry),
  learn: learnOf(s.learn),
  pass: passOf(s.pass),
  doors: doorsOf(s.doors),
  words: wordsOf(s.words),
  back: s.back ?? "toast",
  ...over,
});

/** The surface's own state, assembled out of the board's world. */
const surfaceOf = (w: W, over: Partial<World> = {}): World => ({
  f: FIXTURES[w.trigger],
  trigger: w.trigger,
  phone: w.size === "phone",
  shape: w.shape,
  first: w.first,
  carry: w.carry,
  learn: w.learn,
  pass: w.pass,
  ...over,
});

/**
 * ONE PICTURE: the page the door is on, with the surface in the shape the world
 * says. The panel option is the reason this is one function rather than two:
 * it has no overlay, so the page itself has to make room for it, in the place
 * the door was. That coupling IS the panel's cost and the board draws it.
 */
function Door({
  id,
  w,
  caption,
  over,
  title,
}: {
  id: string;
  w: W;
  caption: string;
  title: string;
  over?: Partial<World>;
}) {
  const sw = surfaceOf(w, over);
  const panel = sw.shape === "panel";
  const inline = panel ? <PanelSurface w={sw} /> : undefined;
  const page =
    w.trigger === "feature" ? (
      <EventSettings f={sw.f} words={w.words} inline={inline} />
    ) : (
      <Dashboard f={sw.f} trigger={w.trigger} inline={inline} />
    );
  return (
    <Screen id={id} size={w.size} title={title} caption={caption}>
      <HostApp f={sw.f} overlay={panel ? undefined : <Surface w={sw} />}>
        {page}
      </HostApp>
    </Screen>
  );
}

/** The words over each frame: the option, in its own language. */
const TITLES: Record<string, string> = {
  "object-dialog": "A centred dialog, the same at both sizes",
  "object-sheet": "A sheet in a hand, a dialog at a laptop",
  "object-panel": "The door's own surface opens in place",
  "first-plans": "The plans, the same every time",
  "first-trigger": "The reason they clicked, then the plans",
  "first-yours": "Your plan today, and what changes",
  "carry-cards": "The plans and a price, nothing else",
  "carry-fitted": "The plans, the toggles, the relevant lines",
  "carry-parity": "Everything the marketing page says",
  "learn-foot": "A quiet line under the buttons",
  "learn-door": "A second button that leaves on purpose",
  "learn-inside": "The comparison opens inside the surface",
  "pass-full": "Its own card, everything the page says",
  "pass-line": "One line and a button",
  "pass-none": "Not in the surface at all",
  "doors-same": "The eleven doors, retargeted",
  "doors-menu": "And a plan row in the user menu",
  "doors-page": "And a plan card on the account page",
  "words-each": "Each site keeps its own sentence",
  "words-one": "One sentence, one source",
  "words-chip": "A lock chip, and the surface explains",
  "back-toast": "A receipt on the dashboard, as today",
  "back-reopen": "The surface returns, holding the receipt",
  "back-finish": "It finishes the job",
};

/* ── The object, the first view, how much it carries, the second layer ────── */

const SHAPE_CAPTION: Record<Shape, string> = {
  dialog:
    "Centred in a 375 screen: read where the buy button lands against where a thumb rests, and what is left of the page.",
  sheet:
    "It rises off the bottom edge and the button is the lowest thing on screen. At a laptop this option IS the dialog.",
  panel:
    "No scrim and no box: the page made room for it where the door was, and everything under it moved down.",
};

const FIRST_CAPTION: Record<First, string> = {
  plans:
    "The same opening whoever clicked and whatever refused them: the marketing page's first screen, smaller.",
  trigger:
    "Read the top line against the who knob: it names the feature, the bytes, the subscription or the pass.",
  yours:
    "It opens on what this host already holds and what the next step adds, whatever brought them here.",
};

const CARRY_CAPTION: Record<Carry, string> = {
  cards:
    "Two cards and two prices. Everything about choosing between three storage sizes happens somewhere else.",
  fitted:
    "The size selector, the cadence, and three lines chosen by the trigger. Read the measured height against parity's.",
  parity:
    "Everything /pricing holds, honestly drawn. The measured height, and whether the caption says it scrolls, is the argument.",
};

const LEARN_CAPTION: Record<Learn, string> = {
  foot: "One line under the buttons, and the sentence says the tab will be a new one.",
  door: "Two buttons of equal weight: read how many hosts this sends to the marketing site.",
  inside:
    "The second screen of the same surface, drawn open: the table and the FAQ, and nothing left the app.",
};

const PASS_CAPTION: Record<PassWeight, string> = {
  full: "Six lines and a price beside Pro's. Two billing models on one screen, at one weight.",
  line: "One sentence and a button. Read it against the full card for what a host loses.",
  none: "Pro only. On the pass knob, read what a pass holder is now being offered instead.",
};

function firstScreen(s: BoardState, first: First) {
  const w = worldOf(s, { first });
  return door(
    s,
    `first-${first}`,
    { first },
    `${FIXTURES[w.trigger].knows} ${FIRST_CAPTION[first]}`,
  );
}

/* ── The doors ────────────────────────────────────────────────────────────── */

const DOORS_CAPTION: Record<Doors, string> = {
  same: "The shipped menu, held open: Account, Theme, Back to site, Help center, Sign out. Nothing about money.",
  menu: "One row added above Account, carrying the plan's name. Count the pixels it costs.",
  page: "The menu row and a card at the top of /account, the page a host reaches from it.",
};

function doorsScreen(s: BoardState, doors: Doors) {
  const w = worldOf(s, { doors });
  const f = fixtureOf(w.trigger);
  return (
    <Screen
      id={`doors-${doors}`}
      size={w.size}
      title={TITLES[`doors-${doors}`]}
      caption={DOORS_CAPTION[doors]}
    >
      <HostApp f={f} menu={doors !== "same"} openMenu>
        {doors === "page" ? (
          <AccountPage f={f} card />
        ) : (
          <Dashboard f={f} trigger={w.trigger} />
        )}
      </HostApp>
    </Screen>
  );
}

/* ── The words at a gate ──────────────────────────────────────────────────── */

const WORDS_CAPTION: Record<Words, string> = {
  each: "The shipped components in their locked branches: three sentences, three shapes, one rule.",
  one: "One sentence shape, the feature's name swapped in. Read the three rows as a column.",
  chip: "Three chips and no explanation, because the surface they open carries it. The rows are controls again.",
};

/** Pinned to the Free host: these controls do not exist for anyone else. */
function wordsScreen(s: BoardState, words: Words) {
  const w = worldOf(s, { words, trigger: "feature" });
  return (
    <Screen
      id={`words-${words}`}
      size={w.size}
      title={TITLES[`words-${words}`]}
      caption={WORDS_CAPTION[words]}
    >
      <HostApp f={FIXTURES.feature}>
        <EventSettings f={FIXTURES.feature} words={words} />
      </HostApp>
    </Screen>
  );
}

/* ── Coming back from Checkout ────────────────────────────────────────────── */

const BACK_CAPTION: Record<string, string> = {
  toast:
    "The dashboard, a receipt, and the password field on an event two clicks from here.",
  reopen:
    "The control is open behind it, and the surface is the one thing still standing between her and it.",
  finish:
    "The control she was refused at, open and ringed, with the receipt above it. Nothing to find.",
};

function backScreen(s: BoardState, back: string) {
  const w = worldOf(s, { back, trigger: "feature" });
  // ★ THE HOST HAS PAID BY THIS FRAME, so the app around the receipt has to
  // say so: the first capture drew "You're on Pro 100 GB" over a dashboard
  // still reading 2 GB and one event, which a reviewer reads as a bug rather
  // than as the question. The cap and the plan name come from tiers.ts.
  const bought = PRO_SIZES[0];
  const f = {
    ...FIXTURES.feature,
    tier: "pro" as const,
    planName: bought.name,
    cap: bought.storageBytes,
    hasBilling: true,
  };
  const receipt = <Receipt plan={bought.name} />;
  const body =
    back === "toast" ? (
      <Dashboard
        f={f}
        trigger="feature"
        receipt={
          <div className="space-y-3">
            {receipt}
            <LockedRowNote />
          </div>
        }
      />
    ) : (
      <EventSettings
        f={f}
        words={w.words}
        receipt={back === "finish" ? receipt : undefined}
        unlocked
      />
    );
  const sw = surfaceOf({ ...w, trigger: "feature" }, { bought: true });
  return (
    <Screen
      id={`back-${back}`}
      size={w.size}
      title={TITLES[`back-${back}`]}
      caption={BACK_CAPTION[back]}
    >
      <HostApp
        f={f}
        overlay={
          back === "reopen" && sw.shape !== "panel" ? (
            <Surface w={sw} />
          ) : undefined
        }
      >
        {back === "reopen" && sw.shape === "panel" ? (
          <EventSettings
            f={f}
            words={w.words}
            unlocked
            inline={<PanelSurface w={sw} />}
          />
        ) : (
          body
        )}
      </HostApp>
    </Screen>
  );
}

/* ── The map the step draws from ──────────────────────────────────────────── */

/** One preview: the id the step names it by, and the one axis it moves. */
const door = (
  s: BoardState,
  id: string,
  over: Partial<W>,
  caption: string,
): ReactNode => (
  <Door id={id} w={worldOf(s, over)} title={TITLES[id]} caption={caption} />
);

const PREVIEWS: PreviewsFor<typeof APP_PRICING> = {
  // ★ THE OBJECT IS ASKED AT 375, WHATEVER THE WINDOW KNOB SAYS. At a laptop the
  // sheet and the dialog are the same picture by definition, and `lab:demo`
  // reported them identical on the first run: two of the three tiles were the
  // same thing, which is a wasted minute rather than a decision. In a hand all
  // three separate, and that is also where a host is when they hit a gate.
  "object.dialog": (s) =>
    door(
      s,
      "object-dialog",
      { shape: "dialog", size: "phone" },
      SHAPE_CAPTION.dialog,
    ),
  "object.sheet": (s) =>
    door(
      s,
      "object-sheet",
      { shape: "sheet", size: "phone" },
      SHAPE_CAPTION.sheet,
    ),
  "object.panel": (s) =>
    door(
      s,
      "object-panel",
      { shape: "panel", size: "phone" },
      SHAPE_CAPTION.panel,
    ),

  // ★ THE FIRST-VIEW STEP SAYS WHAT THIS HOST'S SITUATION IS, under every tile,
  // because the whole question is whether the surface should know it.
  "first.plans": (s) => firstScreen(s, "plans"),
  "first.trigger": (s) => firstScreen(s, "trigger"),
  "first.yours": (s) => firstScreen(s, "yours"),

  "carry.cards": (s) =>
    door(s, "carry-cards", { carry: "cards" }, CARRY_CAPTION.cards),
  "carry.fitted": (s) =>
    door(s, "carry-fitted", { carry: "fitted" }, CARRY_CAPTION.fitted),
  "carry.parity": (s) =>
    door(s, "carry-parity", { carry: "parity" }, CARRY_CAPTION.parity),

  "learn.foot": (s) =>
    door(s, "learn-foot", { learn: "foot" }, LEARN_CAPTION.foot),
  "learn.door": (s) =>
    door(s, "learn-door", { learn: "door" }, LEARN_CAPTION.door),
  // The second screen IS the option, so it is drawn open rather than described.
  "learn.inside": (s) => {
    const w = worldOf(s, { learn: "inside" });
    return (
      <Door
        id="learn-inside"
        w={w}
        title={TITLES["learn-inside"]}
        caption={LEARN_CAPTION.inside}
        over={{ second: true }}
      />
    );
  },

  "pass.full": (s) => door(s, "pass-full", { pass: "full" }, PASS_CAPTION.full),
  "pass.line": (s) => door(s, "pass-line", { pass: "line" }, PASS_CAPTION.line),
  "pass.none": (s) => door(s, "pass-none", { pass: "none" }, PASS_CAPTION.none),

  "doors.same": (s) => doorsScreen(s, "same"),
  "doors.menu": (s) => doorsScreen(s, "menu"),
  "doors.page": (s) => doorsScreen(s, "page"),

  "words.each": (s) => wordsScreen(s, "each"),
  "words.one": (s) => wordsScreen(s, "one"),
  "words.chip": (s) => wordsScreen(s, "chip"),

  "back.toast": (s) => backScreen(s, "toast"),
  "back.reopen": (s) => backScreen(s, "reopen"),
  "back.finish": (s) => backScreen(s, "finish"),
};

export function AppPricingBoard() {
  return <ExplorationBoard spec={APP_PRICING} previews={PREVIEWS} />;
}
