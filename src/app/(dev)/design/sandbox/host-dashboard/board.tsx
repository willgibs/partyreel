"use client";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import { Dashboard, type Start } from "./dashboard";
import type { HostId } from "./fixtures";
import { type ScreenId, screenOf } from "./knobs";
import type { Answers, ChooserWay, DetailsWay } from "./model";
import { both, type Reader, readDetails, readRule, readStage, Scene, Story } from "./scene";
import { HOST_DASHBOARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the dashboard as it ships,
 * production's page for one host on the same quiet Tuesday, wearing the
 * option's answer and the board's answer to the other question (the
 * recommendation until he answers). Every frame is titled with its option's
 * own name, read off the spec, and every caption is read off the frame.
 *
 *  - `chooser`: Nia choosing over her lit wedding, Ari's ten with Latest
 *    photos kept (the control on a photograph), and Try it on Jo's forty, at
 *    the Screen knob's width.
 *  - `details` (H6): Maya's one event and Lena's week, at a phone, where all
 *    four details show (the ring's place differs only there).
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(all: readonly T[], v: unknown, d: T): T =>
  all.includes(v as T) ? (v as T) : d;

const answersOf = (s: BoardState): Answers => ({
  chooser: pick<ChooserWay>(["corner", "words", "deck"], s.chooser, "corner"),
  details: pick<DetailsWay>(
    ["built", "week", "count", "limit", "ring"],
    s.details,
    "built",
  ),
});

/** An option's own name, off the spec, so the frame's title and the tab agree. */
const LABEL = (ask: string, option: string) => {
  const found = HOST_DASHBOARD.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

type Shot = {
  key: string;
  host: HostId;
  title: string;
  read: Reader;
  start?: Start;
};

function Option({
  s,
  ask,
  option,
  shots,
  screen: fixed,
}: {
  s: BoardState;
  ask: keyof Answers;
  option: string;
  shots: Shot[];
  /** A width the ask is always judged at, whatever the Screen knob says. */
  screen?: ScreenId;
}) {
  const screen = fixed ?? screenOf(s.screen);
  const answers = { ...answersOf(s), [ask]: option } as Answers;
  const name = LABEL(ask, option);
  // Every answer the frame wears names it, so a frame is drawn afresh when any of them moves.
  const worn = `${answers.chooser}-${answers.details}`;
  return (
    <Story screen={screen}>
      {shots.map((shot) => {
        const id = `hd-${ask}-${shot.key}-${worn}`;
        return (
          <Scene
            key={`${id}-${screen}`}
            id={id}
            screen={screen}
            title={`${name}: ${shot.title}`}
            measure={shot.read}
          >
            <Dashboard
              hostId={shot.host}
              answers={answers}
              wide={screen === "1440"}
              start={shot.start}
            />
          </Scene>
        );
      })}
    </Story>
  );
}

/* ── 1. choosing what leads ───────────────────────────────────────────── */

const chooserShots: Shot[] = [
  {
    key: "nia",
    host: "nia",
    title: "Nia, choosing",
    read: both(readRule, readStage),
    start: { ruleOpen: true },
  },
  {
    key: "ari",
    host: "ari",
    title: "Ari's ten, Latest photos kept",
    read: both(readRule, readStage),
    start: { rule: "photos" },
  },
  {
    key: "jo",
    host: "jo",
    title: "Try it, Jo's forty",
    read: both(readRule, readStage),
  },
];

/* ── 2. the dashboard's details (H6) ──────────────────────────────────── */

const detailsShots: Shot[] = [
  { key: "maya", host: "maya", title: "Maya's one event", read: readDetails },
  {
    key: "lena",
    host: "lena",
    title: "Lena's week",
    read: readDetails,
    start: { scroll: "week" },
  },
];

/* ── the map ──────────────────────────────────────────────────────────── */

function chooserPreview(s: BoardState, way: ChooserWay) {
  return <Option s={s} ask="chooser" option={way} shots={chooserShots} />;
}

function detailsPreview(s: BoardState, way: DetailsWay) {
  return (
    <Option
      s={s}
      ask="details"
      option={way}
      shots={detailsShots}
      screen="375"
    />
  );
}

const PREVIEWS: PreviewsFor<typeof HOST_DASHBOARD> = {
  "chooser.corner": (s) => chooserPreview(s, "corner"),
  "chooser.words": (s) => chooserPreview(s, "words"),
  "chooser.deck": (s) => chooserPreview(s, "deck"),

  "details.built": (s) => detailsPreview(s, "built"),
  "details.week": (s) => detailsPreview(s, "week"),
  "details.count": (s) => detailsPreview(s, "count"),
  "details.limit": (s) => detailsPreview(s, "limit"),
  "details.ring": (s) => detailsPreview(s, "ring"),
};

export function HostDashboardBoard() {
  return <ExplorationBoard spec={HOST_DASHBOARD} previews={PREVIEWS} />;
}
