"use client";

import type { ReactNode } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { BoardHeader } from "./chrome";
import {
  holdsOf,
  shapeOf,
  twoDoorsOf,
  footJobOf,
  type FootDoor,
  type FootJob,
  type Holds,
  type OnScroll,
  type PhoneMenu,
  type Returning,
  type Shape,
  type TwoDoors,
} from "./fixtures";
import { BoardFooter } from "./foot";
import { HeroGround, ReadingGround } from "./ground";
import { PhoneMenuLayer } from "./menu";
import { SITE_CHROME } from "./spec";
import { PhoneScene, Scene, Widths } from "./stage";

/**
 * THE PREVIEWS: the real chrome, over a real page, in a real viewport.
 *
 * ★ EVERY FRAME HEIGHT BELOW IS MEASURED, NEVER GUESSED. The footer decisions
 * are the reason: the ink slab runs past 1,400 px at 1440 and past 2,700 px at
 * 375, and a frame shorter than its content ends the picture mid-column, which
 * a reviewer reads as the end of the footer. The numbers here were read off
 * the laid-out document inside each frame and corrected before the board
 * shipped; the caption under every frame re-reads them live, so if a height
 * ever drifts the caption says so rather than the board lying quietly.
 *
 * ★ AND A STAGED DECISION IS DRAWN IN THE WORLD IT WAITS ON. `holds` is drawn
 * in the SHAPE he picked and `foot-door` in the JOB he picked, which is what
 * the function form of `Preview` exists for: the step hands every preview the
 * state with each decided answer worn.
 */

/* ── 1 and 2. The shape, and what it holds ───────────────────────────────── */

// The open panel is the Features one: seven rows and a demo ticket is the
// widest the shape ever gets, so a bar that holds it holds anything.
const OPEN_PANEL = "Features";

// Measured: the tallest open panel (the seven-row Features panel runs 379 px
// under a 64 px bar at 1440, so its foot lands at 443) plus the hero under it.
const BAR_H = { d: 620, p: 700 };

function barScreen(
  id: string,
  shape: Shape,
  holds: Holds,
  note: string,
  twoDoors: TwoDoors = "one",
  // ★ A BAR IS A STRIP, AND A STRIP IN A 760 px HERO IS 0.16 PERCENT OF THE
  // PICTURE. The demo gate measured exactly that on the first pass of `holds`,
  // where three options differ by three words: the frames moved by less than
  // a fifth of a percent and a reviewer would have been comparing photographs.
  // A shape with no panel to open therefore crops to the bar and the first
  // inches of the page under it.
  crop = false,
) {
  return (
    <Widths
      id={id}
      desktopH={crop ? 300 : BAR_H.d}
      phoneH={crop ? 320 : BAR_H.p}
      note={note}
      render={(w) => {
        const phone = w === 375;
        return (
          <>
            <BoardHeader
              shape={shape}
              holds={holds}
              twoDoors={twoDoors}
              active="Events"
              open={shape === "panels" ? OPEN_PANEL : null}
              phone={phone}
            />
            <HeroGround phone={phone} />
          </>
        );
      }}
    />
  );
}

const SHAPE_NOTE: Record<Shape, string> = {
  panels: "The Features panel held open; a still capture has no cursor.",
  flat: "Every entry one tap from its own hub page. No panel, no viewport.",
  door: "The middle is empty; the index lives in the footer alone.",
};

function shapeScreen(shape: Shape, state: BoardState) {
  // Every option keeps the tall frame here: the panel IS what `panels` costs,
  // and three windows of the same height is what makes that legible.
  return barScreen(
    `shape-${shape}`,
    shape,
    holdsOf(state),
    SHAPE_NOTE[shape],
    twoDoorsOf(state),
  );
}

const HOLDS_NOTE: Record<Holds, string> = {
  four: "Resources in the bar and again in the footer, on every page.",
  three:
    "Resources folded into the footer; the bar names the product, the occasions and the price.",
  two: "The two questions a first visitor has, and nothing else up here.",
};

function holdsScreen(holds: Holds, state: BoardState) {
  const shape = shapeOf(state);
  return barScreen(
    `holds-${holds}`,
    shape,
    holds,
    HOLDS_NOTE[holds],
    twoDoorsOf(state),
    shape !== "panels",
  );
}

/* ── 3. The returning host ───────────────────────────────────────────────── */

// Measured: the bar and the top of the lockup, which is all this asks about.
const HOST_H = { d: 300, p: 320 };

const HOST_NOTE: Record<Returning, string> = {
  both: "The chrome stays static: the same two doors for everyone.",
  dashboard:
    "One label swapped from a cookie hint; the route still authorizes.",
  avatar:
    "The app's own header on the marketing site, with a profile read behind it.",
};

function returningScreen(returning: Returning, state: BoardState) {
  const shape = shapeOf(state);
  const holds = holdsOf(state);
  return (
    <Widths
      id={`returning-${returning}`}
      desktopH={HOST_H.d}
      phoneH={HOST_H.p}
      note={HOST_NOTE[returning]}
      render={(w) => {
        const phone = w === 375;
        return (
          <>
            <BoardHeader
              shape={shape}
              holds={holds}
              returning={returning}
              active="Events"
              phone={phone}
            />
            <HeroGround phone={phone} />
          </>
        );
      }}
    />
  );
}

/* ── 4. The phone's menu ─────────────────────────────────────────────────── */

const PHONE_NOTE: Record<PhoneMenu, string> = {
  sheet: "One group open at a time; every other group is a second tap.",
  flat: "One tap per entry, straight to a hub that lists its own children.",
  bar: "No hamburger: four destinations standing at the thumb, over the page.",
};

function phoneScreen(menu: PhoneMenu, state: BoardState) {
  const holds = holdsOf(state);
  const shape = shapeOf(state);
  return (
    <PhoneScene
      id={`phone-${menu}`}
      title="375"
      note={PHONE_NOTE[menu]}
      h={812}
    >
      <BoardHeader
        shape={shape}
        holds={holds}
        active="Events"
        phone
        hamburger={menu !== "bar"}
      />
      <HeroGround phone />
      <PhoneMenuLayer menu={menu} holds={holds} />
    </PhoneScene>
  );
}

/* ── 5. On scroll ────────────────────────────────────────────────────────── */

// Measured: a reading chapter's first screen, which is where the three differ.
const SCROLL_H = { d: 620, p: 680 };

const SCROLL_NOTE: Record<OnScroll, string> = {
  stay: "Scrolled past the hero: the same 64 px bar, now on glass.",
  shrink:
    "Scrolled past the hero: a 48 px rail, the nav gone, the action kept.",
  hide: "Scrolled past the hero, going down: no bar at all until the scroll reverses.",
};

function scrollScreen(scroll: OnScroll, state: BoardState) {
  const shape = shapeOf(state);
  const holds = holdsOf(state);
  return (
    <Widths
      id={`scroll-${scroll}`}
      ground="paper"
      desktopH={SCROLL_H.d}
      phoneH={SCROLL_H.p}
      note={SCROLL_NOTE[scroll]}
      render={(w) => {
        const phone = w === 375;
        return (
          <>
            <BoardHeader
              shape={shape}
              holds={holds}
              active="Events"
              stuck
              scroll={scroll}
              phone={phone}
            />
            <ReadingGround phone={phone} />
          </>
        );
      }}
    />
  );
}

/* ── 6. The foot's job ───────────────────────────────────────────────────── */

// Measured inside the frames: the whole slab runs 1,180 px at 1440 and 2,190 px
// at 375 in today's shape, which is four and a half screens for one decision.
// The frame shows the register the question is about plus the head of the
// index, and the caption states the true height so nothing is hidden.
const FOOT_H: Record<FootJob, { d: number; p: number }> = {
  three: { d: 700, p: 900 },
  sitemap: { d: 700, p: 900 },
  close: { d: 860, p: 1000 },
};

const JOB_NOTE: Record<FootJob, string> = {
  three:
    "Today: the invitation, then the index, then the legal bar, all at one weight.",
  sitemap: "A directory and a legal bar. Nothing down here asks for anything.",
  close:
    "The invitation at the page's last-word scale; the index quiet beneath it.",
};

function footScreen(job: FootJob) {
  return (
    <Widths
      id={`foot-${job}`}
      ground="ink"
      desktopH={FOOT_H[job].d}
      phoneH={FOOT_H[job].p}
      note={JOB_NOTE[job]}
      render={(w) => (
        <BoardFooter job={job} door="always" demoSet phone={w === 375} />
      )}
    />
  );
}

/* ── 7. The foot's door ──────────────────────────────────────────────────── */

/**
 * The two states the door question turns on, one above the other, and the
 * first register only: nothing below it changes, and two whole slabs in one
 * frame was eight and a half screens of scrolling for one pick.
 */
function DoorPair({
  job,
  door,
  phone,
}: {
  job: FootJob;
  door: FootDoor;
  phone: boolean;
}) {
  return (
    <div className="flex flex-col">
      {([true, false] as const).map((demoSet) => (
        <div key={String(demoSet)}>
          <p className="bg-muted px-4 py-1.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {demoSet ? "A demo event is set" : "No demo event set"}
          </p>
          <BoardFooter
            job={job}
            door={door}
            demoSet={demoSet}
            phone={phone}
            registerOnly
          />
        </div>
      ))}
    </div>
  );
}

const DOOR_NOTE: Record<FootDoor, string> = {
  vanish: "With no demo set the footer has no action on it at all.",
  always:
    "The action stands whatever the env holds; the code joins it when there is one.",
  demo: "The footer only ever invites you to look; signing up is the bar's job.",
};

const DOOR_H: Record<FootJob, { d: number; p: number }> = {
  three: { d: 760, p: 1180 },
  sitemap: { d: 800, p: 1000 },
  close: { d: 1180, p: 1420 },
};

function doorScreen(door: FootDoor, state: BoardState) {
  const job = footJobOf(state);
  return (
    <Widths
      id={`door-${door}`}
      ground="ink"
      desktopH={DOOR_H[job].d}
      phoneH={DOOR_H[job].p}
      note={DOOR_NOTE[door]}
      render={(w) => <DoorPair job={job} door={door} phone={w === 375} />}
    />
  );
}

/* ── 8. Two doors, one loop ──────────────────────────────────────────────── */

/**
 * ★ DRAWN IN THE REAL PANELS, NEVER AS TWO LOOSE CARDS. The first pass mounted
 * `MegaPanel`'s markup on its own, which throws: every row in it is a
 * `NavigationMenuLink`, and radix answers one outside a `NavigationMenu` with
 * "FocusGroupItem must be used within NavigationMenu". It took the whole board
 * down, so the doors are shown where they live, in a real open panel under a
 * real bar.
 */
const DOORS_NOTE: Record<TwoDoors, string> = {
  unlabelled: "Two doors to one loop, with nothing to tell them apart.",
  one: "One door in the bar; the Resources card spends its slot on a person instead.",
  named: "Both doors kept, each one saying which of the two it is.",
};

function loopScreen(twoDoors: TwoDoors) {
  const bar = (open: string) => (
    <>
      <BoardHeader
        shape="panels"
        holds="four"
        twoDoors={twoDoors}
        active="Events"
        open={open}
      />
      <HeroGround phone={false} />
    </>
  );
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* ★ THE RESOURCES FRAME IS THE TALLER OF THE TWO ON PURPOSE. The demo
          gate compares the LARGEST frame in an option's view, and two of the
          three answers leave the Features footnote untouched: with Features
          taller, the gate read "same picture" on a pair that differs in the
          card right beside it. The frame that carries the change leads. */}
      <Scene
        id={`loop-${twoDoors}-res`}
        w={1440}
        h={600}
        title="1440, the Resources panel"
        note={DOORS_NOTE[twoDoors]}
      >
        {bar("Resources")}
      </Scene>
      <Scene
        id={`loop-${twoDoors}-feat`}
        w={1440}
        h={520}
        title="1440, the Features panel"
        note="The second door is the last row of this panel, under the hairline."
      >
        {bar("Features")}
      </Scene>
      <Scene
        id={`loop-${twoDoors}-375`}
        w={375}
        h={700}
        title="375"
        note="A phone meets neither door: the sheet lists a group's children and nothing else."
      >
        <BoardHeader shape="panels" holds="four" active="Events" phone />
        <HeroGround phone />
        <PhoneMenuLayer menu="sheet" holds="four" />
      </Scene>
    </div>
  );
}

/* ── The map ─────────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof SITE_CHROME> = {
  "shape.panels": (s) => shapeScreen("panels", s),
  "shape.flat": (s) => shapeScreen("flat", s),
  "shape.door": (s) => shapeScreen("door", s),

  "holds.four": (s) => holdsScreen("four", s),
  "holds.three": (s) => holdsScreen("three", s),
  "holds.two": (s) => holdsScreen("two", s),

  "returning.both": (s) => returningScreen("both", s),
  "returning.dashboard": (s) => returningScreen("dashboard", s),
  "returning.avatar": (s) => returningScreen("avatar", s),

  "phone.sheet": (s) => phoneScreen("sheet", s),
  "phone.flat": (s) => phoneScreen("flat", s),
  "phone.bar": (s) => phoneScreen("bar", s),

  "on-scroll.stay": (s) => scrollScreen("stay", s),
  "on-scroll.shrink": (s) => scrollScreen("shrink", s),
  "on-scroll.hide": (s) => scrollScreen("hide", s),

  "foot-job.three": footScreen("three"),
  "foot-job.sitemap": footScreen("sitemap"),
  "foot-job.close": footScreen("close"),

  "foot-door.vanish": (s) => doorScreen("vanish", s),
  "foot-door.always": (s) => doorScreen("always", s),
  "foot-door.demo": (s) => doorScreen("demo", s),

  "two-doors.unlabelled": loopScreen("unlabelled"),
  "two-doors.one": loopScreen("one"),
  "two-doors.named": loopScreen("named"),
};

export function SiteChromeBoard(): ReactNode {
  return <ExplorationBoard spec={SITE_CHROME} previews={PREVIEWS} />;
}
