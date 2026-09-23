"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  footAfterOf,
  type FootAfter,
  type FootAlone,
  type FootPhone,
} from "./fixtures";
import { BoardFooter } from "./foot";
import { AboutCloseGround, CtaCloseGround } from "./ground";
import { SITE_CHROME } from "./spec";
import { PhoneScene, Widths } from "./stage";

/**
 * THE PREVIEWS, ROUND TWO: every option under one of the two contexts every
 * marketing route actually ends in today, at 1440 and 375 (`Widths`), or at
 * 375 alone where the question IS the phone (`foot-phone`'s own
 * `tile: "phone"`, drawn with `PhoneScene`, round one's own convention for a
 * question whose evidence is a column rather than a page).
 *
 * ★ HEIGHTS ARE MEASURED, NEVER GUESSED (round one's convention, kept): the
 * frame shows the close plus the register the question is about plus the head
 * of the index below it, and `Scene`'s own caption re-reads the true height
 * live off the laid-out document, so a number that drifts says so rather than
 * lying quietly.
 */

/* ── 1. The foot after a close ───────────────────────────────────────────── */

const AFTER_H: Record<FootAfter, { d: number; p: number }> = {
  today: { d: 1260, p: 1900 },
  quiet: { d: 940, p: 1420 },
  merged: { d: 760, p: 1180 },
  tucked: { d: 760, p: 1180 },
};

const AFTER_NOTE: Record<FootAfter, string> = {
  today:
    "The framed photograph, its corner code, heading and copy, directly under the close above it.",
  quiet: "One slim row, a small code and a line: no section of its own.",
  merged:
    "One ink background, no seam; the close's own demo line is the only one.",
  tucked:
    "No register here either; a small demo line rides the legal bar instead.",
};

function footAfterScreen(after: FootAfter) {
  return (
    <Widths
      id={`foot-after-${after}`}
      ground="cinema"
      desktopH={AFTER_H[after].d}
      phoneH={AFTER_H[after].p}
      note={AFTER_NOTE[after]}
      render={(w) => (
        <>
          <CtaCloseGround ink={after === "merged"} />
          <BoardFooter register={after} phone={w === 375} />
        </>
      )}
    />
  );
}

/* ── 2. The foot where nothing closes the page ───────────────────────────── */

// One height for both options: "same" draws whatever `foot-after` resolved
// to, which this ask cannot know in advance, so the frame is sized for the
// tallest register either option could show.
const ALONE_H = { d: 1180, p: 1820 };

const ALONE_NOTE: Record<FootAlone, string> = {
  full: "Today's whole invitation, whatever a closed page picks instead.",
  same: "The same footer this board is drawing everywhere else this round.",
};

function footAloneScreen(alone: FootAlone, state: BoardState) {
  const register = alone === "full" ? "today" : footAfterOf(state);
  return (
    <Widths
      id={`foot-alone-${alone}`}
      ground="paper"
      desktopH={ALONE_H.d}
      phoneH={ALONE_H.p}
      note={ALONE_NOTE[alone]}
      render={(w) => (
        <>
          <AboutCloseGround />
          <BoardFooter register={register} phone={w === 375} />
        </>
      )}
    />
  );
}

/* ── 3. The phone's foot ──────────────────────────────────────────────────── */

const PHONE_H = 1900;

const PHONE_NOTE: Record<FootPhone, string> = {
  hidden:
    "As today: no code (nobody can scan their own screen), a link instead.",
  small:
    "The code stays, small: decoration now by ruling (first-event r1), not just a guess.",
  none: "No demo mention at all on this width: straight into the index.",
};

function footPhoneScreen(mode: FootPhone) {
  return (
    <PhoneScene
      id={`foot-phone-${mode}`}
      title="375"
      ground="cinema"
      h={PHONE_H}
      note={PHONE_NOTE[mode]}
    >
      <CtaCloseGround />
      <BoardFooter register="today" phone frameMode={mode} />
    </PhoneScene>
  );
}

/* ── The map ─────────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof SITE_CHROME> = {
  "foot-after.today": footAfterScreen("today"),
  "foot-after.quiet": footAfterScreen("quiet"),
  "foot-after.merged": footAfterScreen("merged"),
  "foot-after.tucked": footAfterScreen("tucked"),

  "foot-alone.full": (s) => footAloneScreen("full", s),
  "foot-alone.same": (s) => footAloneScreen("same", s),

  "foot-phone.hidden": footPhoneScreen("hidden"),
  "foot-phone.small": footPhoneScreen("small"),
  "foot-phone.none": footPhoneScreen("none"),
};

export function SiteChromeBoard(): ReactNode {
  return <ExplorationBoard spec={SITE_CHROME} previews={PREVIEWS} />;
}
