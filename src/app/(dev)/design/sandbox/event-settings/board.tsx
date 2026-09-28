"use client";

import "./event-settings.css";

import { UserCheck } from "lucide-react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DoorStep, HeldDoor, WaitingMark, WaitingPage } from "./door";
import {
  EVENT,
  GUESTS,
  HOST,
  JUST_LANDED,
  NEWCOMERS,
  NO_PHOTOS,
  QUEUE,
} from "./fixtures";
import { Face, Hub, hubCards } from "./hub";
import {
  BASE,
  type EditorForm,
  type IdleForm,
  type JoinForm,
  type LockForm,
  type Model,
  type OpensForm,
  type Structure,
} from "./model";
import {
  DoorQueue,
  GuestRow,
  GuestsRoom,
  NewcomerRow,
  ReviewRoom,
  RoomSection,
} from "./rooms";
import {
  cardShown,
  doorLines,
  holds,
  reach,
  Scene,
  ScrollHere,
  screens,
  Several,
} from "./scene";
import { screenOf, type ScreenId } from "./screens";
import { SettingsView } from "./settings";
import { EVENT_SETTINGS } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is Maya's settings (or her
 * door, or her rooms) at a real viewport, drawn from the one model
 * (`model.ts`) with the option's own field changed. A staged ask reads the
 * answers it waits on off the board's state (the structure first of all), so
 * it is drawn in whichever structure he picked, wearing the recommendation of
 * anything he has not answered yet, the kit's own rule.
 *
 * ★ THE STRUCTURE QUESTION HOLDS TODAY'S SETTINGS, NOTHING NEW: Who can see
 * this album as today's three, the lock and idle settings as today draws them
 * (both asks declare `today`), so the five structures are compared holding the
 * same things. The join modes are asked next, in the structure he picks.
 */

/* ── reading the board's state ────────────────────────────────────────────── */

const pick = <T extends string>(
  all: readonly T[],
  v: unknown,
  fallback: T,
): T => (all.includes(v as T) ? (v as T) : fallback);

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

const STRUCTURES: readonly Structure[] = [
  "today",
  "groups",
  "summary",
  "sentences",
  "presets",
];

/** The one model, wearing every answer the board's state holds. */
function modelOf(s: BoardState): Model {
  return {
    ...BASE,
    plan: s.plan === "pro" ? "pro" : "free",
    structure: pick(STRUCTURES, s.structure, "summary"),
    opens: pick<OpensForm>(["page", "inplace"], s.opens, "page"),
    idle: pick<IdleForm>(["hidden", "greyed", "live"], s.idle, "live"),
    lock: pick<LockForm>(["chip", "switch", "line"], s.lock, "chip"),
    join: pick<JoinForm>(["ladder", "two", "steps"], s.join, "ladder"),
    inside: s.inside === "count" ? "count" : "sentence",
    editor: pick<EditorForm>(["one", "paste", "both"], s.editor, "both"),
  };
}

/* ── decision 1: the structure ────────────────────────────────────────────── */

const STRUCTURE_TITLE: Record<Structure, string> = {
  today: "Today's seven cards",
  groups: "Four groups in view",
  summary: "A sentence per group",
  sentences: "The settings as sentences",
  presets: "A kind of event",
};

/**
 * EACH STRUCTURE TWICE: as it opens, measured for how many screens it runs and
 * how many settings a host meets before scrolling; and as Maya pauses uploads
 * mid-party, measured for where the act she needs sits (today's is its Save,
 * two cards below the switch she flipped).
 */
const structure = (s: BoardState, option: Structure) => {
  const scr = screen(s);
  const m: Model = {
    ...modelOf(s),
    structure: option,
    join: "none",
    asBuilt: option === "today",
  };
  const pausing: Model =
    option === "today"
      ? { ...m, focus: "adds", uploads: false, dirty: true, mark: "save" }
      : option === "sentences"
        ? { ...m, focus: "adds", chooser: "uploads" }
        : option === "presets"
          ? { ...m, uploads: false, mark: "uploads" }
          : { ...m, focus: "adds", uploads: false, mark: "uploads" };
  return (
    <Several screen={scr}>
      <Scene
        id={`structure-${option}`}
        screen={scr}
        title={`${STRUCTURE_TITLE[option]}, as it opens`}
        measure={screens}
      >
        <SettingsView m={m} screen={scr} />
      </Scene>
      <Scene
        id={`structure-${option}-pause`}
        screen={scr}
        title={`${STRUCTURE_TITLE[option]}, pausing uploads`}
        measure={reach(
          option === "today"
            ? "Its Save"
            : option === "sentences"
              ? "The choice"
              : "The switch",
        )}
        short
      >
        <SettingsView m={pausing} screen={scr} />
      </Scene>
    </Several>
  );
};

/* ── decision 2: how a group opens (asked after `structure=summary`) ──────── */

const OPENS_TITLE: Record<OpensForm, string> = {
  page: "Who can get in, its own page",
  inplace: "Who can get in, open in place",
};

const opens = (s: BoardState, option: OpensForm) => {
  const scr = screen(s);
  const m: Model = {
    ...modelOf(s),
    structure: "summary",
    opens: option,
    focus: "access",
  };
  return (
    <Scene
      id={`opens-${option}`}
      screen={scr}
      title={OPENS_TITLE[option]}
      measure={screens}
    >
      <SettingsView m={m} screen={scr} />
    </Scene>
  );
};

/* ── decision 3: a setting that does nothing yet ──────────────────────────── */

const IDLE_TITLE: Record<IdleForm, string> = {
  hidden: "Gone until it applies",
  greyed: "Greyed, with its reason",
  live: "Live, with a note",
};

/**
 * THE TWO CASES SIDE BY SIDE, in the picked structure: the reel off (its look
 * and hold idle) and uploads paused with A photo first on (the gate idle).
 * Today keeps A photo first in Guest uploads, beside the pause; every new
 * structure keeps it in Who can get in, one group away.
 */
const idle = (s: BoardState, option: IdleForm) => {
  const scr = screen(s);
  const m: Model = { ...modelOf(s), idle: option };
  const gateGroup = m.structure === "today" ? "adds" : "access";
  return (
    <Several screen={scr}>
      <Scene
        id={`idle-${option}-reel-${m.structure}`}
        screen={scr}
        title={`${IDLE_TITLE[option]}: the reel off`}
        measure={holds("reel", "The reel")}
        short
      >
        <SettingsView m={{ ...m, reel: false, focus: "reel" }} screen={scr} />
      </Scene>
      <Scene
        id={`idle-${option}-paused-${m.structure}`}
        screen={scr}
        title={`${IDLE_TITLE[option]}: uploads paused`}
        measure={holds(
          gateGroup,
          gateGroup === "adds" ? "Guest uploads" : "Who can get in",
        )}
        short
      >
        <SettingsView
          m={{ ...m, uploads: false, photoFirst: true, focus: gateGroup }}
          screen={scr}
        />
      </Scene>
    </Several>
  );
};

/* ── decision 4: the one Pro lock (reads the plan knob) ───────────────────── */

const LOCK_TITLE: Record<LockForm, string> = {
  chip: "Videos, today's lock chip",
  switch: "Videos, a switch that opens the plans",
  line: "Videos, one quiet line",
};

const lock = (s: BoardState, option: LockForm) => {
  const scr = screen(s);
  const m: Model = { ...modelOf(s), lock: option, focus: "adds", mark: "lock" };
  return (
    <Scene
      id={`lock-${option}-${m.plan}-${m.structure}`}
      screen={scr}
      title={`${LOCK_TITLE[option]}, on ${m.plan === "pro" ? "Pro" : "Free"}`}
      measure={
        m.plan === "pro"
          ? holds("adds", "What guests can add")
          : reach("The lock")
      }
    >
      <SettingsView m={m} screen={scr} />
    </Scene>
  );
};

/* ── decision 5: who can get in (the port of event-safety's `choose`) ─────── */

const JOIN_TITLE: Record<JoinForm, string> = {
  ladder: "Who can get in, one choice of six",
  two: "Who can see, then who can join",
  steps: "The door, step by step",
};

/** Drawn on People you let in, so the email switch it holds on shows too. */
const join = (s: BoardState, option: JoinForm) => {
  const scr = screen(s);
  const m: Model = {
    ...modelOf(s),
    join: option,
    rung: "approve",
    focus: "access",
    mark: "choice",
  };
  return (
    <Scene
      id={`join-${option}-${m.structure}`}
      screen={scr}
      title={JOIN_TITLE[option]}
      measure={reach("The choice")}
    >
      <SettingsView m={m} screen={scr} />
    </Scene>
  );
};

/* ── decision 6: waiting at the door (after `join`) ───────────────────────── */

type Waiting = "held" | "page";

const WAITING_TITLE: Record<Waiting, string> = {
  held: "Waiting on the lit door",
  page: "Waiting on a page in the closed door's family",
};

const waiting = (s: BoardState, option: Waiting) => {
  const scr = screen(s);
  return (
    <Scene
      id={`waiting-${option}`}
      screen={scr}
      title={WAITING_TITLE[option]}
      measure={doorLines}
    >
      {option === "page" ? (
        <WaitingPage />
      ) : (
        <HeldDoor screen={scr}>
          <DoorStep
            almost
            eyebrow={EVENT.name}
            words={{
              title: `Waiting for ${HOST.first}`,
              line: `This opens by itself the moment ${HOST.first} lets you in.`,
            }}
          >
            <span className="flex">
              <WaitingMark label="Asked 2 min ago" />
            </span>
          </DoorStep>
        </HeldDoor>
      )}
    </Scene>
  );
};

/* ── decision 7: letting newcomers in (after `waiting`) ───────────────────── */

type Queue = "room" | "review" | "hub";

/** The strip on the hub: who is waiting, and Let in right there. */
function HubStrip({ scr }: { scr: ScreenId }) {
  const phone = scr === "375";
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3",
        phone ? "flex-col" : "items-center",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex -space-x-2">
          {NEWCOMERS.map((n) => (
            <span key={n.id} className="rounded-full ring-2 ring-background">
              <Face
                person={{ name: n.name, verified: true, seed: n.seed }}
                size="sm"
              />
            </span>
          ))}
        </span>
        <p className="min-w-0 text-sm">
          <span className="font-medium">
            {`${NEWCOMERS[0].name} and ${NEWCOMERS[1].name}`}
          </span>
          <span className="text-muted-foreground"> are waiting to join.</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" tabIndex={-1}>
          See all
        </Button>
        <Button size="sm" tabIndex={-1} data-set-reach>
          <UserCheck /> Let both in
        </Button>
      </div>
    </div>
  );
}

const QUEUE_TITLE: Record<Queue, string> = {
  room: "The Guests room's At the door",
  review: "Review, people above the photographs",
  hub: "A strip on the hub",
};

/**
 * REVIEW WITH PEOPLE IN IT, IN HIS CURATION PICKS (event-safety's, carried):
 * the people waiting first, then his `arrivals=prompt` line on the grid, the
 * arrows on its first photograph (`keys=arrows`). The keys reach photographs
 * only, so a person is a tap on Let in or Decline.
 */
function ReviewWithPeople({ scr }: { scr: ScreenId }) {
  return (
    <ReviewRoom
      screen={scr}
      items={QUEUE}
      keys
      above={
        <RoomSection
          label="Waiting to join"
          count={NEWCOMERS.length}
          tone="amber"
          note="Declining someone blocks them. You can let them back from Blocked."
        >
          {NEWCOMERS.map((n, i) => (
            <NewcomerRow key={n.id} n={n} screen={scr} reachable={i === 0} />
          ))}
        </RoomSection>
      }
      prompt={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          tabIndex={-1}
        >
          {`${JUST_LANDED} new`}
        </Button>
      }
    />
  );
}

const queue = (s: BoardState, option: Queue) => {
  const scr = screen(s);
  if (option === "hub") {
    return (
      <Scene
        id="queue-hub"
        screen={scr}
        title={QUEUE_TITLE.hub}
        measure={reach("Let both in")}
      >
        <Hub screen={scr} strip={<HubStrip scr={scr} />} />
      </Scene>
    );
  }
  const cards =
    option === "room"
      ? hubCards({ guests: { value: "2 at the door", amber: true } })
      : hubCards({
          review: {
            value: `${QUEUE.length} photos, ${NEWCOMERS.length} people`,
            amber: true,
          },
        });
  return (
    <Several screen={scr}>
      <Scene
        id={`queue-${option}`}
        screen={scr}
        title={QUEUE_TITLE[option]}
        measure={reach("Let in")}
        short
      >
        {option === "room" ? (
          <GuestsRoom
            screen={scr}
            people={GUESTS}
            top={<DoorQueue screen={scr} />}
          />
        ) : (
          <ReviewWithPeople scr={scr} />
        )}
      </Scene>
      <Scene
        id={`queue-${option}-hub`}
        screen={scr}
        title="The hub, counting who waits"
        measure={cardShown(option === "room" ? "guests" : "review")}
        short
      >
        <Hub screen={scr} cards={cards} />
      </Scene>
    </Several>
  );
};

/* ── decision 8: who is already in (after `join`) ─────────────────────────── */

type Inside = "sentence" | "count" | "list";

const INSIDE_TITLE: Record<Inside, string> = {
  sentence: "Closed, said in a sentence",
  count: "Closed, with a count of who is in",
  list: "Closed, the room lists who has no photos yet",
};

const inside = (s: BoardState, option: Inside) => {
  const scr = screen(s);
  if (option === "list") {
    return (
      <Scene
        id="inside-list"
        screen={scr}
        title={INSIDE_TITLE.list}
        measure={reach("The list")}
      >
        <GuestsRoom
          screen={scr}
          people={GUESTS}
          foot={
            <>
              <ScrollHere offset={72} />
              <div data-set-reach>
                <RoomSection
                  label="In, no photos yet"
                  count={17}
                  tone="quiet"
                  note="Past the door before you closed it. They can still add."
                >
                  {NO_PHOTOS.map((p) => (
                    <GuestRow
                      key={p.id}
                      person={p}
                      screen={scr}
                      muted
                      trailing={
                        <span className="text-xs text-muted-foreground">
                          No photos
                        </span>
                      }
                    />
                  ))}
                  <li className="px-4 py-2.5 text-xs text-muted-foreground">
                    {`${17 - NO_PHOTOS.length} more`}
                  </li>
                </RoomSection>
              </div>
            </>
          }
        />
      </Scene>
    );
  }
  const m: Model = {
    ...modelOf(s),
    rung: "closed",
    inside: option,
    focus: "access",
    mark: option === "count" ? "extra" : "choice",
  };
  return (
    <Scene
      id={`inside-${option}-${m.structure}-${m.join}`}
      screen={scr}
      title={INSIDE_TITLE[option]}
      measure={reach(option === "count" ? "The count" : "The choice")}
    >
      <SettingsView m={m} screen={scr} />
    </Scene>
  );
};

/* ── decision 9: the invite list's editor (after `join`) ──────────────────── */

const EDITOR_TITLE: Record<EditorForm, string> = {
  one: "The invite list, one at a time",
  paste: "The invite list, a box to paste",
  both: "The invite list, one field for both",
};

const editor = (s: BoardState, option: EditorForm) => {
  const scr = screen(s);
  const m: Model = {
    ...modelOf(s),
    rung: "list",
    editor: option,
    focus: "access",
    mark: "extra",
  };
  return (
    <Scene
      id={`editor-${option}-${m.structure}-${m.join}`}
      screen={scr}
      title={EDITOR_TITLE[option]}
      measure={reach("The list")}
    >
      <SettingsView m={m} screen={scr} />
    </Scene>
  );
};

/* ── the map ──────────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof EVENT_SETTINGS> = {
  "structure.today": (s) => structure(s, "today"),
  "structure.groups": (s) => structure(s, "groups"),
  "structure.summary": (s) => structure(s, "summary"),
  "structure.sentences": (s) => structure(s, "sentences"),
  "structure.presets": (s) => structure(s, "presets"),
  "opens.page": (s) => opens(s, "page"),
  "opens.inplace": (s) => opens(s, "inplace"),
  "idle.hidden": (s) => idle(s, "hidden"),
  "idle.greyed": (s) => idle(s, "greyed"),
  "idle.live": (s) => idle(s, "live"),
  "lock.chip": (s) => lock(s, "chip"),
  "lock.switch": (s) => lock(s, "switch"),
  "lock.line": (s) => lock(s, "line"),
  "join.ladder": (s) => join(s, "ladder"),
  "join.two": (s) => join(s, "two"),
  "join.steps": (s) => join(s, "steps"),
  "waiting.held": (s) => waiting(s, "held"),
  "waiting.page": (s) => waiting(s, "page"),
  "queue.room": (s) => queue(s, "room"),
  "queue.review": (s) => queue(s, "review"),
  "queue.hub": (s) => queue(s, "hub"),
  "inside.sentence": (s) => inside(s, "sentence"),
  "inside.count": (s) => inside(s, "count"),
  "inside.list": (s) => inside(s, "list"),
  "editor.one": (s) => editor(s, "one"),
  "editor.paste": (s) => editor(s, "paste"),
  "editor.both": (s) => editor(s, "both"),
};

export function EventSettingsBoard() {
  return <ExplorationBoard spec={EVENT_SETTINGS} previews={PREVIEWS} />;
}
