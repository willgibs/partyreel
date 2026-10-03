"use client";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import { Dashboard, type Start } from "./dashboard";
import { type HostId, JO_THREE, RAE_TARGET } from "./fixtures";
import { screenOf } from "./knobs";
import {
  type Answers,
  type EventsWay,
  PREFS_DEFAULT,
  type RuleWay,
  type StageWay,
  type View,
} from "./model";
import {
  both,
  type Reader,
  readEvents,
  readRule,
  readStage,
  Scene,
  Story,
} from "./scene";
import { HOST_DASHBOARD } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the dashboard as it ships,
 * production's page for one of six hosts on the same quiet Tuesday, wearing
 * the option's answer and the board's answers to the other two questions (the
 * recommendation until he answers). Every frame is titled with its option's
 * own name, read off the spec, and every caption is read off the frame.
 *
 *  - `events`: five frames scrolled to her events, one per count (1, 3, 10, 40
 *    and 200); Ari's is Try it, Jo's comes back from her three weddings in her
 *    own layout, Rae's is sent back for a 2023 wedding with the control in use.
 *  - `stage`: the top of Nia's page, her wedding just made and the week before.
 *  - `rule`: Nia's three with the control in use, and Try it on Jo's forty.
 */

/* ── reading the board's state ────────────────────────────────────────── */

const pick = <T extends string>(all: readonly T[], v: unknown, d: T): T =>
  all.includes(v as T) ? (v as T) : d;

const answersOf = (s: BoardState): Answers => ({
  events: pick<EventsWay>(["menu", "bar", "views", "find"], s.events, "menu"),
  stage: pick<StageWay>(["lit", "album", "card", "guest"], s.stage, "lit"),
  rule: pick<RuleWay>(
    ["corner", "tabs", "head", "settings"],
    s.rule,
    "corner",
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
  const worn = `${answers.events}-${answers.stage}-${answers.rule}`;
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

/* ── 1. your events, one to two hundred ───────────────────────────────── */

/** Jo's own way of seeing her forty: a table by event date, the latest first. */
const JO_PREFS = { layout: "table", sort: "date", desc: true } as const;

/** A planner's own view: her weddings, a table by date, the latest first. */
const WEDDINGS: View = {
  id: "weddings",
  label: "Weddings",
  hers: true,
  query: "wedding",
  prefs: { ...PREFS_DEFAULT, ...JO_PREFS },
};

/**
 * Where each way's choices stand as Jo comes back and as Rae goes back: the
 * same table by date, set in the option's own place (the menu, the toolbar, a
 * saved view, the field), and for Rae the control drawn open on 2023.
 */
function eventsShots(way: EventsWay): Shot[] {
  const at = { scroll: "events" } as const;
  const jo: Start =
    way === "views"
      ? { collection: { views: [WEDDINGS], view: "weddings" } }
      : way === "find"
        ? { collection: { prefs: JO_PREFS, query: "2025 wedding" } }
        : { collection: { prefs: JO_PREFS } };
  const rae: Start =
    way === "menu"
      ? {
          collection: {
            prefs: { ...JO_PREFS, year: "2023" },
            open: "display",
            recentFolded: true,
          },
        }
      : way === "bar"
        ? {
            collection: {
              prefs: { ...JO_PREFS, year: "2023" },
              open: "filter",
              recentFolded: true,
            },
          }
        : way === "views"
          ? {
              collection: {
                views: [WEDDINGS],
                view: "weddings",
                prefs: { year: "2023" },
                open: "edit",
                recentFolded: true,
              },
            }
          : {
              collection: {
                prefs: JO_PREFS,
                query: "2023 wedding",
                recentFolded: true,
              },
            };
  const shots: Shot[] = [
    { key: "maya", host: "maya", title: "Maya, one event", read: readEvents() },
    { key: "nia", host: "nia", title: "Nia, three", read: readEvents() },
    { key: "ari", host: "ari", title: "Try it, Ari's ten", read: readEvents() },
    {
      key: "jo",
      host: "jo",
      title: "Jo's forty, back from three weddings",
      read: readEvents(JO_THREE[0]),
      start: jo,
    },
    {
      key: "rae",
      host: "rae",
      title: "Rae's two hundred, back to 2023",
      read: readEvents(RAE_TARGET),
      start: rae,
    },
  ];
  return shots.map((shot) => ({ ...shot, start: { ...at, ...shot.start } }));
}

/* ── 2. the stage before its first photo ──────────────────────────────── */

const stageShots: Shot[] = [
  {
    key: "made",
    host: "nia",
    title: "Nia's wedding, just made",
    read: readStage,
    start: { fresh: true },
  },
  {
    key: "week",
    host: "nia-week",
    title: "The week before",
    read: readStage,
  },
];

/* ── 3. the stage's rule ──────────────────────────────────────────────── */

/** Nia's frame draws the control in use: its menu open, its Customize open, or Settings itself. */
const ruleShots = (way: RuleWay): Shot[] => [
  {
    key: "nia",
    host: "nia",
    title:
      way === "settings"
        ? "Nia, in Settings"
        : way === "tabs"
          ? "Nia, Latest photos pressed"
          : "Nia, its menu open",
    read: readRule,
    start:
      way === "settings"
        ? { settings: true }
        : way === "tabs"
          ? { rule: "photos" }
          : { ruleOpen: true },
  },
  {
    key: "jo",
    host: "jo",
    title: "Try it, Jo's forty",
    read: both(readRule, readStage),
  },
];

/* ── the map ──────────────────────────────────────────────────────────── */

function eventsPreview(s: BoardState, way: EventsWay) {
  return <Option s={s} ask="events" option={way} shots={eventsShots(way)} />;
}

function stagePreview(s: BoardState, way: StageWay) {
  return <Option s={s} ask="stage" option={way} shots={stageShots} />;
}

function rulePreview(s: BoardState, way: RuleWay) {
  return <Option s={s} ask="rule" option={way} shots={ruleShots(way)} />;
}

const PREVIEWS: PreviewsFor<typeof HOST_DASHBOARD> = {
  "events.menu": (s) => eventsPreview(s, "menu"),
  "events.bar": (s) => eventsPreview(s, "bar"),
  "events.views": (s) => eventsPreview(s, "views"),
  "events.find": (s) => eventsPreview(s, "find"),

  "stage.lit": (s) => stagePreview(s, "lit"),
  "stage.album": (s) => stagePreview(s, "album"),
  "stage.card": (s) => stagePreview(s, "card"),
  "stage.guest": (s) => stagePreview(s, "guest"),

  "rule.corner": (s) => rulePreview(s, "corner"),
  "rule.tabs": (s) => rulePreview(s, "tabs"),
  "rule.head": (s) => rulePreview(s, "head"),
  "rule.settings": (s) => rulePreview(s, "settings"),
};

export function HostDashboardBoard() {
  return <ExplorationBoard spec={HOST_DASHBOARD} previews={PREVIEWS} />;
}
