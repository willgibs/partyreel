"use client";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import { Dashboard, type Start } from "./dashboard";
import { type HostId, JO_THREE } from "./fixtures";
import { screenOf } from "./knobs";
import type { Answers, EventsWay, PickWay, QuietRule } from "./model";
import { type Reader, readEvents, readStage, Scene, Story } from "./scene";
import { HOST_DASHBOARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the dashboard as it ships,
 * production's page for one of three hosts on the same quiet Tuesday, wearing
 * the option's answer and the board's answers to the other two questions (as
 * built until he answers, `today`). Every frame is titled with its option's own
 * name, read off the spec, and every caption is read off the frame.
 *
 *  - `events`: Try it on Jo's forty, the page as she comes back from Theo &
 *    Ana's 2025 wedding (played by the page: the year opened, the wedding
 *    pressed, Your events), and Maya with her one event.
 *  - `lead` and `pick`: Nia's three undated events, and Try it on Jo's forty.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(all: readonly T[], v: unknown, d: T): T =>
  all.includes(v as T) ? (v as T) : d;

const answersOf = (s: BoardState): Answers => ({
  events: pick<EventsWay>(
    ["built", "recent", "display", "index"],
    s.events,
    "built",
  ),
  lead: pick<QuietRule>(["time", "made", "left", "rest"], s.lead, "time"),
  pick: pick<PickWay>(["none", "kept", "step"], s.pick, "none"),
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
}: {
  s: BoardState;
  ask: keyof Answers;
  option: string;
  shots: Shot[];
}) {
  const screen = screenOf(s.screen);
  const answers = { ...answersOf(s), [ask]: option } as Answers;
  const name = LABEL(ask, option);
  // Every answer the frame wears names it, so a frame is drawn afresh when any of them moves.
  const worn = `${answers.events}-${answers.lead}-${answers.pick}`;
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

/* ── 1. your events at forty ──────────────────────────────────────────── */

/**
 * Jo's own Display where the option draws one: a planner's, set once (a list
 * by year), with its menu open in Try it so the menu is seen where it lives.
 */
function eventsShots(way: EventsWay): Shot[] {
  const hers: Start =
    way === "display"
      ? { display: { show: "list", group: "year", order: "date" } }
      : {};
  return [
    {
      key: "try",
      host: "jo",
      title: "Try it, Jo's forty",
      read: readEvents(),
      start: way === "display" ? { ...hers, displayOpen: true } : hers,
    },
    {
      key: "back",
      host: "jo",
      title: "Jo, back from Theo & Ana's",
      read: readEvents(JO_THREE),
      start: { ...hers, journey: { back: "jo-theo-ana", year: "year-2025" } },
    },
    { key: "maya", host: "maya", title: "Maya, one event", read: readEvents() },
  ];
}

/* ── 2 and 3. the stage ───────────────────────────────────────────────── */

const stageShots = (open: boolean): Shot[] => [
  {
    key: "nia",
    host: "nia",
    title: "Nia, three undated",
    read: readStage,
    start: open ? { pickOpen: true } : undefined,
  },
  { key: "jo", host: "jo", title: "Try it, Jo's forty", read: readStage },
];

/* ── the map ──────────────────────────────────────────────────────────── */

function eventsPreview(s: BoardState, way: EventsWay) {
  return <Option s={s} ask="events" option={way} shots={eventsShots(way)} />;
}

function leadPreview(s: BoardState, rule: QuietRule) {
  return <Option s={s} ask="lead" option={rule} shots={stageShots(false)} />;
}

function pickPreview(s: BoardState, way: PickWay) {
  return (
    <Option s={s} ask="pick" option={way} shots={stageShots(way === "kept")} />
  );
}

const PREVIEWS: PreviewsFor<typeof HOST_DASHBOARD> = {
  "events.built": (s) => eventsPreview(s, "built"),
  "events.recent": (s) => eventsPreview(s, "recent"),
  "events.display": (s) => eventsPreview(s, "display"),
  "events.index": (s) => eventsPreview(s, "index"),

  "lead.time": (s) => leadPreview(s, "time"),
  "lead.made": (s) => leadPreview(s, "made"),
  "lead.left": (s) => leadPreview(s, "left"),
  "lead.rest": (s) => leadPreview(s, "rest"),

  "pick.none": (s) => pickPreview(s, "none"),
  "pick.kept": (s) => pickPreview(s, "kept"),
  "pick.step": (s) => pickPreview(s, "step"),
};

export function HostDashboardBoard() {
  return <ExplorationBoard spec={HOST_DASHBOARD} previews={PREVIEWS} />;
}
