"use client";

import "./admin.css";

import type { ReactNode } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  type ChromeShape,
  type HealthShape,
  type NavShape,
  PortalChrome,
  type Shell,
  shellOf,
} from "./chrome";
import { AdminDestructive, type Grammar } from "./destructive";
import { SURFACES } from "./fixtures";
import { AdminHome, type HomeShape, homeOf } from "./home";
import { AdminJobs } from "./jobs";
import { AdminLists, type Density } from "./lists";
import { ADMIN } from "./spec";
import type { Colour } from "./state-ui";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the portal at a laptop's size.
 *
 * ★ ONE SCREEN, SEVEN DECISIONS, SIX AXES. Every picture below is the same
 * shell around the same fixtures with exactly one axis moved, which is what
 * makes the seven questions one board rather than seven boards in a trench
 * coat: the rail is judged under the bar that was picked, the density inside
 * the nav that was picked, the state colour on the rows the density gave it.
 * `shellOf` reads the board's live state and each preview overrides its own
 * axis, so going back to the home after answering the nav redraws the home in
 * the world he chose rather than the one the board assumed.
 *
 * ★ 1440 BY 900, WHICH IS A LAPTOP, AND THE FOLD IS REAL. An operator is not on
 * a phone, and half of what these decisions decide is how much of a Tuesday
 * fits on one screen: nine cards do not, a ranked list does. A frame taller
 * than the screen would answer that question by cheating, so every page frame
 * is a real laptop viewport and scrolls inside itself exactly as the page will.
 */

const SCREEN_H = 900;

function Screen({
  id,
  h = SCREEN_H,
  caption,
  children,
}: {
  id: string;
  h?: number;
  caption: string;
  children: ReactNode;
}) {
  return (
    <Frame
      id={`admin-${id}`}
      w={1440}
      h={h}
      title={`1440 x ${h}`}
      caption={caption}
    >
      {children}
    </Frame>
  );
}

const shellFor = (s: BoardState, over: Partial<Shell> = {}): Shell => ({
  ...shellOf(s),
  ...over,
});

const OVERVIEW = SURFACES[0];
const SUPPORT = SURFACES.find((x) => x.href === "/admin/support") ?? OVERVIEW;
const JOBS = SURFACES.find((x) => x.href === "/admin/jobs") ?? OVERVIEW;

/* ── The home, worn by four of the seven decisions ───────────────────────── */

function homeScreen(
  id: string,
  s: BoardState,
  over: {
    home?: HomeShape;
    shell?: Partial<Shell>;
    caption: string;
    paletteOpen?: boolean;
  },
) {
  const shell = shellFor(s, over.shell);
  return (
    <Screen id={id} caption={over.caption}>
      <PortalChrome
        shell={shell}
        active={OVERVIEW}
        paletteOpen={over.paletteOpen}
      >
        <AdminHome home={over.home ?? homeOf(s.home)} shell={shell} />
      </PortalChrome>
    </Screen>
  );
}

function homeShapeScreen(v: HomeShape, s: BoardState) {
  return homeScreen(`home-${v}`, s, {
    home: v,
    caption:
      v === "grid"
        ? "Today. Nine doors, and the only sign of the day is three small numbers."
        : v === "console"
          ? "Six open things, ranked. Everything quiet is a chip at the foot."
          : "Four figures and the trend first; the queue starts at the fold.",
  });
}

function navScreen(v: NavShape, s: BoardState) {
  return homeScreen(`nav-${v}`, s, {
    shell: { nav: v },
    paletteOpen: v === "rail-palette",
    caption:
      v === "dropdown"
        ? "Today. The twelve sit behind one control and the page keeps the product's 1280 column."
        : v === "rail"
          ? "Twelve surfaces, four groups and three counts, always readable."
          : "The rail with the palette open on a two-letter query.",
  });
}

function healthScreen(v: HealthShape, s: BoardState) {
  return homeScreen(`health-${v}`, s, {
    shell: { health: v },
    caption:
      v === "none"
        ? "Today. Two jobs are down and nothing on this page says so."
        : v === "portal"
          ? "A band under the bar, on this page and the eleven others."
          : "A panel above the home's own content, and nowhere else.",
  });
}

function chromeScreen(v: ChromeShape, s: BoardState) {
  return homeScreen(`chrome-${v}`, s, {
    shell: { chrome: v },
    caption:
      v === "today"
        ? "Today. 56 px, the Ops chip, the address in full and a Sign out button."
        : v === "plain"
          ? "56 px and the wordmark alone; the heading names the surface."
          : "44 px, a breadcrumb, a live tag, the health chip and an initial.",
  });
}

/* ── The two other pages ─────────────────────────────────────────────────── */

function listScreen(v: Density, s: BoardState) {
  const shell = shellFor(s);
  return (
    <Screen
      id={`density-${v}`}
      caption={
        v === "cards"
          ? "Today. Four and a half of the nine messages fit; the accounts are far below the fold."
          : v === "table"
            ? "All nine and all six on one screen, with a bulk bar over the selection."
            : "The inbox as a list beside what you are reading; accounts as a table."
      }
    >
      <PortalChrome shell={shell} active={SUPPORT}>
        <AdminLists density={v} colour={shell.colour} />
      </PortalChrome>
    </Screen>
  );
}

function jobScreen(v: Colour, s: BoardState) {
  const shell = shellFor(s, { colour: v });
  return (
    <Screen
      id={`colour-${v}`}
      caption={
        v === "achromatic"
          ? "Today. Healthy, paused and overdue-but-not-failed all read the same."
          : v === "badges"
            ? "Four states told apart in the chip; the rows stay achromatic."
            : "The failed run tints its row, so it is found without reading."
      }
    >
      <PortalChrome shell={shell} active={JOBS}>
        <AdminJobs colour={v} />
      </PortalChrome>
    </Screen>
  );
}

function actScreen(v: Grammar, s: BoardState) {
  return (
    <Screen
      id={`destructive-${v}`}
      h={760}
      caption={
        v === "mixed"
          ? "Today. Three acts, three grammars, and the cheapest click is the switch."
          : v === "sheet"
            ? "One panel each, listing what the act touches; only the account makes you type."
            : "Nothing opens: each button arms, and the page keeps a record of what you did."
      }
    >
      <AdminDestructive grammar={v} colour={shellFor(s).colour} />
    </Screen>
  );
}

/* ── The map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof ADMIN> = {
  "home.grid": (s) => homeShapeScreen("grid", s),
  "home.console": (s) => homeShapeScreen("console", s),
  "home.kpi": (s) => homeShapeScreen("kpi", s),

  "nav.dropdown": (s) => navScreen("dropdown", s),
  "nav.rail": (s) => navScreen("rail", s),
  "nav.rail-palette": (s) => navScreen("rail-palette", s),

  "density.cards": (s) => listScreen("cards", s),
  "density.table": (s) => listScreen("table", s),
  "density.hybrid": (s) => listScreen("hybrid", s),

  "colour.achromatic": (s) => jobScreen("achromatic", s),
  "colour.badges": (s) => jobScreen("badges", s),
  "colour.rows": (s) => jobScreen("rows", s),

  "destructive.mixed": (s) => actScreen("mixed", s),
  "destructive.sheet": (s) => actScreen("sheet", s),
  "destructive.arm": (s) => actScreen("arm", s),

  "health.none": (s) => healthScreen("none", s),
  "health.portal": (s) => healthScreen("portal", s),
  "health.home": (s) => healthScreen("home", s),

  "chrome.today": (s) => chromeScreen("today", s),
  "chrome.plain": (s) => chromeScreen("plain", s),
  "chrome.devtool": (s) => chromeScreen("devtool", s),
};

export function AdminBoard() {
  return <ExplorationBoard spec={ADMIN} previews={PREVIEWS} />;
}
