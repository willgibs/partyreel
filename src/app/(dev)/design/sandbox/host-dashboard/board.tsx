"use client";

import "./host-dashboard.css";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
} from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  type Answers,
  type ArrivalsWay,
  type CollectionView,
  Dashboard,
  type Purpose,
} from "./dashboard";
import type { HostId } from "./fixtures";
import { momentOf, screenOf } from "./knobs";
import type { Rule } from "./model";
import {
  both,
  onFirstScreen,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";
import { HOST_DASHBOARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the whole dashboard, drawn
 * for Maya (one event) and for Jo (forty) on the day the Day knob names, at
 * the Screen knob's width. A staged question is drawn wearing the answers it
 * waits on (the step hands each preview the board's state), so What asks for
 * attention is judged inside the page Will picked for What it is for.
 *
 * Every frame is titled with its option's own name, read off the spec, and
 * every caption is read off the frame.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(
  all: readonly T[],
  v: unknown,
  fallback: T,
): T => (all.includes(v as T) ? (v as T) : fallback);

function answersOf(s: BoardState): Answers {
  return {
    purpose: pick<Purpose>(["stage", "shelf", "desk"], s.purpose, "stage"),
    needs: pick<Rule>(["bell", "week", "three"], s.needs, "week"),
    events: pick<CollectionView>(
      ["covers", "seasons", "index"],
      s.events,
      "seasons",
    ),
    arrivals: pick<ArrivalsWay>(["none", "live", "since"], s.arrivals, "live"),
  };
}

/** An option's own name, off the spec, so the frame's title and the tile agree. */
const LABEL = (ask: string, option: string) => {
  const found = HOST_DASHBOARD.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

const HOSTS: { id: HostId; who: string }[] = [
  { id: "maya", who: "Maya, one event" },
  { id: "jo", who: "Jo, forty events" },
];

/* ── what the frames read ─────────────────────────────────────────────── */

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** What leads the page's first screen. */
const leads: Reader = (root) => {
  const stage = root.querySelector<HTMLElement>("[data-hd-stage]");
  if (stage) {
    const name = textOf(stage.querySelector("[data-hd-stage-name]"));
    return `Leads with the stage: ${name} (${stage.dataset.hdStage})`;
  }
  const desk = root.querySelector<HTMLElement>("[data-hd-desk]");
  if (desk)
    return `Leads with a list of ${plural(Number(desk.dataset.hdDesk), "step", "steps")}`;
  const tiles = root.querySelectorAll("[data-hd-tile], [data-hd-row]").length;
  return tiles ? "Leads with the events" : null;
};

/** How many things on the first screen ask for an act: the at-forty number. */
const asks: Reader = (root, win) => {
  if (!root.querySelector("[data-hd-page]")) return null;
  const acts = onFirstScreen(root, win, "[data-hd-act]").length;
  const stageAct =
    root.querySelector<HTMLElement>("[data-hd-acts]")?.dataset.hdActs;
  const n = acts + (stageAct && stageAct !== "none" ? 1 : 0);
  return `${plural(n, "thing asks", "things ask")} for an act on the first screen`;
};

/** What the bell holds, read off its drawn panel or its badge. */
const bellHolds: Reader = (root) => {
  const panel = root.ownerDocument.querySelector<HTMLElement>("[data-hd-bell]");
  if (panel)
    return `the bell holds ${plural(Number(panel.dataset.hdBell), "row", "rows")}`;
  const badge = textOf(
    root.ownerDocument.querySelector(
      "header [aria-label^='Notifications'] span",
    ),
  );
  return badge ? `the bell's badge reads ${badge}` : "the bell is empty";
};

/** How many events the first screen draws, of how many. */
const eventsShown: Reader = (root, win) => {
  const all = root.querySelectorAll("[data-hd-tile], [data-hd-row]").length;
  if (!all) return null;
  const seen = onFirstScreen(root, win, "[data-hd-tile], [data-hd-row]").length;
  const folded = [
    ...root.querySelectorAll<HTMLElement>("[data-hd-folded]"),
  ].reduce((n, el) => n + Number(el.dataset.hdFolded ?? 0), 0);
  return `${seen} of the events on the first screen${folded ? `, ${folded} more folded by year` : ""}`;
};

/** How many photographs on the first screen are arriving (no `data-static`). */
const arriving: Reader = (root, win) => {
  if (!root.querySelector("[data-hd-page]")) return null;
  const n = onFirstScreen(
    root,
    win,
    "[data-media-tile]:not([data-static])",
  ).length;
  return n === 0
    ? "No photographs arriving on the first screen"
    : `${plural(n, "photograph", "photographs")} arriving on the first screen`;
};

/* ── one option, both hosts ───────────────────────────────────────────── */

function Option({
  ask,
  option,
  s,
  measure,
  bellOpen = false,
  focus = "top",
}: {
  ask: keyof Answers;
  option: string;
  s: BoardState;
  measure: Reader;
  bellOpen?: boolean;
  focus?: "top" | "collection";
}): ReactNode {
  const answers = { ...answersOf(s), [ask]: option } as Answers;
  const moment = momentOf(s.moment);
  const screen = screenOf(s.screen);
  const name = LABEL(ask, option);
  return (
    <Story>
      {HOSTS.map((h) => (
        <Scene
          key={h.id}
          id={`hd-${ask}-${option}-${h.id}-${moment}`}
          screen={screen}
          title={`${name}: ${h.who}`}
          measure={measure}
        >
          <Dashboard
            hostId={h.id}
            moment={moment}
            answers={answers}
            bellOpen={bellOpen && h.id === "jo"}
            focus={focus}
          />
        </Scene>
      ))}
    </Story>
  );
}

/** Each question's frames, with what its captions read. */
const READS: Record<
  keyof Answers,
  { measure: Reader; bellOpen?: boolean; focus?: "top" | "collection" }
> = {
  purpose: { measure: both(leads, asks) },
  needs: { measure: both(asks, bellHolds), bellOpen: true },
  events: { measure: eventsShown, focus: "collection" },
  arrivals: { measure: arriving },
};

function preview(s: BoardState, ask: keyof Answers, option: string): ReactNode {
  return <Option ask={ask} option={option} s={s} {...READS[ask]} />;
}

/* ── the map ──────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof HOST_DASHBOARD> = {
  "purpose.stage": (s) => preview(s, "purpose", "stage"),
  "purpose.shelf": (s) => preview(s, "purpose", "shelf"),
  "purpose.desk": (s) => preview(s, "purpose", "desk"),

  "needs.bell": (s) => preview(s, "needs", "bell"),
  "needs.week": (s) => preview(s, "needs", "week"),
  "needs.three": (s) => preview(s, "needs", "three"),

  "events.covers": (s) => preview(s, "events", "covers"),
  "events.seasons": (s) => preview(s, "events", "seasons"),
  "events.index": (s) => preview(s, "events", "index"),

  "arrivals.none": (s) => preview(s, "arrivals", "none"),
  "arrivals.live": (s) => preview(s, "arrivals", "live"),
  "arrivals.since": (s) => preview(s, "arrivals", "since"),
};

export function HostDashboardBoard() {
  return <ExplorationBoard spec={HOST_DASHBOARD} previews={PREVIEWS} />;
}
