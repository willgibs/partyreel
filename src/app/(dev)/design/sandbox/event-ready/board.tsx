"use client";

import type { ReactNode } from "react";

import {
  LaunchList,
  launchItems,
} from "@/components/app/event-feed/launch-list";
import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";
import { doorLabel } from "@/lib/events/visibility-labels";

import { HostPage } from "./app";
import { ReadyLine, ReadyList } from "./checklist";
import { CodeDoor, type CodeVariant } from "./code";
import { HandingBeat, SharedStep, SHARED_STEPS, TodayBeat } from "./create";
import { Dashboard, type NeedsVariant } from "./dashboard";
import {
  DAY_ORDER,
  DAYS,
  DOOR_STATES,
  type Moment,
  MOMENT_ORDER,
  MOMENTS,
  THIRTIETH_ID,
} from "./fixtures";
import { EmptyAlbum, Hub, type HubSlots } from "./hub";
import { readiness } from "./readiness";
import {
  measureCode,
  measureCreate,
  measureDash,
  measureReady,
  measureSettings,
  type ScreenId,
  screenOf,
  Strip,
} from "./scene";
import {
  PassEntry,
  PassStep,
  Provided,
  SettingsPanel,
  StepPage,
  StepRail,
  TodayRows,
} from "./settings";
import { EVENT_READY } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is Maya's own screens at the
 * width the Screen knob names, drawn from production's components fed the
 * board's fixtures, with the one thing an option changes handed in as a slot
 * (`hub.tsx`'s `HubSlots`, the settings panel's body, Create's last screen,
 * the band's chips, the code's mat).
 *
 * ★ ONE WORLD. The staged asks are drawn in the answers they wait on: `guide`
 * in the checklist home `list` holds, `create` in the walk `guide` holds, so a
 * walk is judged in the home it will live beside and Create's hand-off leads
 * where the walk begins. Every checklist anywhere is `readiness()` over the
 * moment, so a tick in one drawing is a tick in all of them.
 */

type Home = "album" | "head" | "settings";
type Walk = "rows" | "steps" | "pass";

const pick = <T extends string>(ids: readonly T[], v: unknown, d: T): T =>
  (ids as readonly string[]).includes(v as string) ? (v as T) : d;

const homeOf = (s: BoardState): Home =>
  pick(["album", "head", "settings"] as const, s.list, "album");
const walkOf = (s: BoardState): Walk =>
  pick(["rows", "steps", "pass"] as const, s.guide, "rows");

/** An option's own name off the spec, so a row's lede and the stage head agree. */
const LABEL = (ask: string, option: string) => {
  const found = EVENT_READY.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* ── the checklist in its home ───────────────────────────────────────────── */

/** Settings as it opens, in a home and a walk: the checklist, the rail, or the rows. */
function SettingsBody({
  m,
  home,
  walk,
}: {
  m: Moment;
  home: Home;
  walk: Walk;
}) {
  const r = readiness(m.facts);
  if (walk === "steps") return <StepRail r={r} />;
  return (
    <>
      {walk === "pass" ? <PassEntry r={r} /> : null}
      {home === "settings" && r.left.length > 0 ? (
        <ReadyList r={r} home="at the top of Settings" />
      ) : null}
      <TodayRows />
    </>
  );
}

/** The hub's slots for a checklist home at a moment. */
function slotsFor(home: Home, m: Moment, overlay?: ReactNode): HubSlots {
  const r = readiness(m.facts);
  const code = (
    <CodeDoor
      variant="today"
      d={{
        door: m.facts.door,
        acceptingUploads: m.facts.acceptingUploads,
        waiting: 0,
      }}
    />
  );
  if (home === "album") {
    const launch = launchItems({
      eventId: THIRTIETH_ID,
      eventDate: m.facts.eventDate,
      description: m.facts.description,
    });
    return {
      code,
      overlay,
      empty: (
        <div data-er-launch>
          {launch.map((i) => (
            <span key={i.id} data-er-launch-item hidden />
          ))}
          <LaunchList
            eventId={THIRTIETH_ID}
            eventDate={m.facts.eventDate}
            description={m.facts.description}
          />
        </div>
      ),
      emptyHeader: { label: "Before the first photo", count: launch.length },
    };
  }
  if (home === "head") {
    return {
      code,
      overlay,
      lead:
        r.left.length === 0 ? null : m.photos.length > 0 ? (
          <ReadyLine r={r} home="at the head of the hub" />
        ) : (
          <ReadyList r={r} home="at the head of the hub" />
        ),
      empty: <EmptyAlbum />,
    };
  }
  return {
    code,
    overlay,
    // What a guest still needs, counted, until she is ready; then the door again.
    settingsValue: r.ready
      ? { text: doorLabel(m.facts.door) }
      : { text: `${r.needed.of - r.needed.done} left`, count: true },
    empty: <EmptyAlbum />,
  };
}

/** The hub she meets at a moment, in a checklist home. */
function HubAt({
  home,
  m,
  overlay,
}: {
  home: Home;
  m: Moment;
  overlay?: ReactNode;
}) {
  return <Hub m={m} slots={slotsFor(home, m, overlay)} />;
}

/**
 * SETTINGS OPEN OVER THE HUB: a panel over the page at a desk, the whole
 * screen in a hand (drawn over an empty page, since it covers the page).
 */
function SettingsOver({
  screen,
  home,
  m,
  title,
  up,
  children,
}: {
  screen: ScreenId;
  home: Home;
  m: Moment;
  title: string;
  up?: string;
  children: ReactNode;
}) {
  const panel = (
    <SettingsPanel screen={screen} title={title} up={up}>
      {children}
    </SettingsPanel>
  );
  return (
    <Provided m={m}>
      {screen === "1440" ? (
        <HubAt home={home} m={m} overlay={panel} />
      ) : (
        <HostPage trail="Maya's 30th" overlay={panel}>
          <span />
        </HostPage>
      )}
    </Provided>
  );
}

/** The checklist's home at one moment, as she meets it. */
function ListAt({
  home,
  m,
  screen,
}: {
  home: Home;
  m: Moment;
  screen: ScreenId;
}) {
  if (home === "settings" && m.id === "fresh") {
    return (
      <SettingsOver screen={screen} home={home} m={m} title="Settings">
        <SettingsBody m={m} home={home} walk="rows" />
      </SettingsOver>
    );
  }
  return <HubAt home={home} m={m} />;
}

const FRAME_TITLE: Record<Home, Partial<Record<Moment["id"], string>>> = {
  album: {},
  head: {},
  settings: { fresh: "An hour after Create, Settings open" },
};

function ListStrip({ s, home }: { s: BoardState; home: Home }) {
  const screen = screenOf(s);
  return (
    <Strip
      screen={screen}
      measure={measureReady}
      lede={`${LABEL("list", home)}: Maya's 30th an hour after Create, three photos in with the code never opened, and the night before.`}
      frames={MOMENT_ORDER.map((id) => {
        const m = MOMENTS[id];
        return {
          id: `er-list-${home}-${id}`,
          title: FRAME_TITLE[home][id] ?? m.title,
          node: <ListAt home={home} m={m} screen={screen} />,
        };
      })}
    />
  );
}

/* ── a walk through Settings ─────────────────────────────────────────────── */

/** One page in, in a walk's own shape. */
function PageIn({
  screen,
  home,
  walk,
}: {
  screen: ScreenId;
  home: Home;
  walk: Walk;
}) {
  const m = MOMENTS.fresh;
  if (walk === "pass")
    return (
      <SettingsOver
        screen={screen}
        home={home}
        m={m}
        title="Set it up"
        up="Settings"
      >
        <PassStep step={1} />
      </SettingsOver>
    );
  return (
    <SettingsOver
      screen={screen}
      home={home}
      m={m}
      title="Who can get in"
      up="Settings"
    >
      {walk === "steps" ? (
        <StepPage group="door" n={1} />
      ) : (
        <DoorPage guestsHref="#guests" />
      )}
    </SettingsOver>
  );
}

function GuideStrip({ s, walk }: { s: BoardState; walk: Walk }) {
  const screen = screenOf(s);
  const home = homeOf(s);
  const m = MOMENTS.fresh;
  return (
    <Strip
      screen={screen}
      measure={measureSettings}
      lede={`${LABEL("guide", walk)}, with the checklist ${lower(LABEL("list", home))}: Settings as Maya opens it on her new 30th, then one page in.`}
      frames={[
        {
          id: `er-guide-${walk}-${home}-open`,
          title: "Settings as it opens",
          node: (
            <SettingsOver screen={screen} home={home} m={m} title="Settings">
              <SettingsBody m={m} home={home} walk={walk} />
            </SettingsOver>
          ),
        },
        {
          id: `er-guide-${walk}-${home}-page`,
          title:
            walk === "pass"
              ? "Set it up, its first step"
              : "One page in: Who can get in",
          node: <PageIn screen={screen} home={home} walk={walk} />,
        },
      ]}
    />
  );
}

/* ── Create's hand-off ───────────────────────────────────────────────────── */

type Handoff = "beat" | "hand" | "share";

/**
 * Where Get it ready leads: the first step of the walk she picked, over the
 * hub in the home she picked (with no walk, Settings as it opens).
 */
function FirstStep({
  screen,
  walk,
  home,
}: {
  screen: ScreenId;
  walk: Walk;
  home: Home;
}) {
  if (walk === "rows") {
    const m = MOMENTS.fresh;
    return (
      <SettingsOver screen={screen} home={home} m={m} title="Settings">
        <SettingsBody m={m} home={home} walk="rows" />
      </SettingsOver>
    );
  }
  return <PageIn screen={screen} home={home} walk={walk} />;
}

function CreateStrip({ s, handoff }: { s: BoardState; handoff: Handoff }) {
  const screen = screenOf(s);
  const walk = walkOf(s);
  const home = homeOf(s);
  const m = MOMENTS.fresh;
  const r = readiness(m.facts);
  const frames =
    handoff === "beat"
      ? [
          {
            id: "er-create-beat",
            title: "The last screen: the beat",
            node: <TodayBeat />,
          },
          {
            id: `er-create-beat-next-${home}`,
            title: "Go to your event: the hub",
            node: <HubAt home={home} m={m} />,
          },
        ]
      : handoff === "hand"
        ? [
            {
              id: `er-create-hand-${walk}`,
              title: "The last screen: the beat, handing over",
              node: (
                <HandingBeat
                  r={r}
                  into={walk === "pass" ? "Set it up" : "Get it ready"}
                />
              ),
            },
            {
              id: `er-create-hand-next-${walk}`,
              title: "Get it ready: where the walk begins",
              node: <FirstStep screen={screen} walk={walk} home={home} />,
            },
          ]
        : [
            {
              id: "er-create-share-door",
              title: "Create's third step: who can get in",
              node: (
                <Provided m={m}>
                  <SharedStep
                    at={3}
                    title="Who can get in?"
                    line="The door every guest meets. It saves as you choose, and Settings keeps it."
                  >
                    <DoorPage guestsHref="#guests" />
                  </SharedStep>
                </Provided>
              ),
            },
            {
              id: "er-create-share-welcome",
              title: "Create's fourth step: the welcome",
              node: (
                <Provided m={m}>
                  <SharedStep
                    at={4}
                    title="The date and a note"
                    line="What guests read first, under the name. Skip it and add it later."
                  >
                    <EventPage />
                  </SharedStep>
                </Provided>
              ),
            },
            {
              id: "er-create-share-beat",
              title: "The last screen: the beat",
              node: <TodayBeat steps={SHARED_STEPS} />,
            },
          ];
  return (
    <Strip
      screen={screen}
      measure={measureCreate}
      lede={`${LABEL("create", handoff)}, in the walk ${lower(LABEL("guide", walk))}: Maya has just pressed Create.`}
      frames={frames}
    />
  );
}

/* ── What needs you ──────────────────────────────────────────────────────── */

function NeedsStrip({ s, variant }: { s: BoardState; variant: NeedsVariant }) {
  const screen = screenOf(s);
  return (
    <Strip
      screen={screen}
      measure={measureDash}
      lede={`${LABEL("needs", variant)}: Maya's dashboard on a quiet Friday, then on her 30th's night.`}
      frames={DAY_ORDER.map((id) => ({
        id: `er-needs-${variant}-${id}`,
        title: DAYS[id].title,
        node: (
          <Dashboard
            variant={variant}
            events={DAYS[id].events}
            storagePct={DAYS[id].storagePct}
          />
        ),
      }))}
    />
  );
}

/* ── the code as the door ────────────────────────────────────────────────── */

function DoorStrip({ s, variant }: { s: BoardState; variant: CodeVariant }) {
  const screen = screenOf(s);
  const base = MOMENTS.ready;
  return (
    <Strip
      screen={screen}
      measure={measureCode}
      h={screen === "1440" ? 400 : 460}
      perRow={3}
      lede={`${LABEL("door", variant)}: the hub's header in each of five doors, the rooms row under it.`}
      frames={DOOR_STATES.map((d) => {
        const m: Moment = {
          ...base,
          facts: {
            ...base.facts,
            door: d.door,
            acceptingUploads: d.acceptingUploads,
          },
        };
        return {
          id: `er-door-${variant}-${d.id}`,
          title: d.title,
          node: (
            <Hub
              m={m}
              slots={{
                code: <CodeDoor variant={variant} d={d} />,
                waiting: d.waiting,
                empty: <EmptyAlbum />,
              }}
            />
          ),
        };
      })}
    />
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof EVENT_READY> = {
  "list.album": (s) => <ListStrip s={s} home="album" />,
  "list.head": (s) => <ListStrip s={s} home="head" />,
  "list.settings": (s) => <ListStrip s={s} home="settings" />,

  "guide.rows": (s) => <GuideStrip s={s} walk="rows" />,
  "guide.steps": (s) => <GuideStrip s={s} walk="steps" />,
  "guide.pass": (s) => <GuideStrip s={s} walk="pass" />,

  "create.beat": (s) => <CreateStrip s={s} handoff="beat" />,
  "create.hand": (s) => <CreateStrip s={s} handoff="hand" />,
  "create.share": (s) => <CreateStrip s={s} handoff="share" />,

  "needs.quiet": (s) => <NeedsStrip s={s} variant="quiet" />,
  "needs.job": (s) => <NeedsStrip s={s} variant="job" />,
  "needs.count": (s) => <NeedsStrip s={s} variant="count" />,

  "door.today": (s) => <DoorStrip s={s} variant="today" />,
  "door.mark": (s) => <DoorStrip s={s} variant="mark" />,
  "door.sign": (s) => <DoorStrip s={s} variant="sign" />,
};

export function EventReadyBoard() {
  return <ExplorationBoard spec={EVENT_READY} previews={PREVIEWS} />;
}
