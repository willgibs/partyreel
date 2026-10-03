"use client";

import type { ReactNode } from "react";
import {
  Bell,
  Clapperboard,
  Eye,
  EyeOff,
  Hand,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";

import { HubCover } from "@/components/app/event-feed/event-hub-head";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  reviewCardFace,
  roomCardSize,
  roomRowLayout,
} from "@/components/app/event-feed/room-card";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { REEL_MINIMUM } from "@/lib/event/reel-progress";
import { EVENT_ROOMS, type EventRoomId } from "@/lib/event/sections";
import { doorLabel } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { type RowItem, Rows } from "./album";
import {
  albumStills,
  binsOf,
  DEV,
  DEVELOP,
  EVENT,
  HELD,
  MAYA,
  NIGHT_DEV,
  NIGHT_HELD,
  NOW,
  type NightShot,
  still,
} from "./fixtures";
import { MODEL_WORDS, type ModelId } from "./model";
import { ScrolledTo } from "./scene";
import { Wait, type WaitFacts, type WaitId } from "./wait";

/**
 * MAYA'S HUB WHILE HER ALBUM WAITS: her event's page as it ships (the app's
 * bar, `HubCover`, the real head, the rooms row on `room-card.ts`'s own shell,
 * the album's `FeedSectionHeader`), with the album's area drawn three ways.
 *
 * ★ THE HEAD AND THE ROOMS ARE PRODUCTION'S AND NOT ASKED HERE: they are
 * `event-header` r2's. This board draws only what her album shows before the
 * develop, how she looks anyway, and how it covers again.
 *
 * ★ ON A HELD ALBUM THE LOOK IS REVIEW: what waits for her approval is hers to
 * see in Review, so each option says so in its own idiom.
 */

export type HostCoverId = "card" | "guests" | "frost";
export type HostBeat = "covered" | "lifted" | "held";

/** What the wedding's link opens: anyone with it comes in (the head's code wears no mark, Settings' card says Public). */
const DOOR = "open" as const;

/** Maya's own two photos of the night: hers seal with everyone's, lit to her. */
const MAYA_HERS = [
  {
    id: "m2",
    still: still("reception-hall"),
    time: "10:12",
    minute: 192,
  },
  { id: "m1", still: still("wedding-golden"), time: "7:48", minute: 48 },
] as const;

/** The two albums as Maya's hub reads them (her own lit, everyone's counted). */
const HOST_FACTS: Record<"held" | "developing", WaitFacts> = {
  developing: {
    kind: "developing",
    count: DEV.waiting,
    guests: DEV.guests,
    hers: MAYA_HERS,
    night: markMine(NIGHT_DEV, [48, 192]),
  },
  held: {
    kind: "held",
    count: HELD.waiting,
    guests: HELD.guests,
    hers: [],
    night: NIGHT_HELD.map((s) => ({ ...s, mine: false })),
  },
};

/** The night with Maya's own minutes marked hers (and Priya's not). */
function markMine(
  night: readonly NightShot[],
  minutes: readonly number[],
): NightShot[] {
  const want = [...minutes];
  return night.map((s) => {
    const i = want.indexOf(s.minute);
    if (i >= 0) {
      want.splice(i, 1);
      return { ...s, mine: true };
    }
    return { ...s, mine: false };
  });
}

/* ── the hub as it ships, quoted where it needs a session ──────────────── */

function AppBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/80 px-3 backdrop-blur sm:px-5">
      <Logo />
      <span className="ml-auto flex items-center gap-2">
        <span className="flex size-8 items-center justify-center text-muted-foreground">
          <Bell className="size-4" aria-hidden />
        </span>
        <Avatar size="sm" seed={MAYA.seed}>
          <AvatarFallback className="text-[10px]">M</AvatarFallback>
        </Avatar>
      </span>
    </header>
  );
}

/** The rooms row at rest, on production's shell, in production's order (`EVENT_ROOMS`). */
function Rooms({ held }: { held: boolean }) {
  const face = reviewCardFace(held, held ? HELD.waiting : 0);
  const cards: Record<
    EventRoomId,
    { value: string; Icon: typeof ListChecks; amber?: boolean }
  > = {
    // The Reel card's own words (`reel-card.tsx`): a developing album's reel goes live at the develop, since until
    // then every guest's album, and so her reel, is empty; a held album with nothing let in is counting to two.
    reel: {
      value: held ? `Starts at ${REEL_MINIMUM} photos` : "Live at the develop",
      Icon: Clapperboard,
    },
    guests: {
      value: `${held ? HELD.guests : DEV.guests} guests`,
      Icon: Users,
    },
    review: { value: face.value, Icon: ListChecks, amber: face.amber },
    // The door, in the one function that words it everywhere (`doorLabel`, the hub page's card): Settings' card says
    // how many steps are left only while a guest still needs one, and on the night itself none is.
    settings: { value: doorLabel(DOOR), Icon: Settings },
  };
  return (
    <div className={roomRowLayout(false)}>
      {EVENT_ROOMS.map(({ id, label }) => {
        const { value, Icon, amber } = cards[id];
        return (
          <span
            key={id}
            className={cn(
              ROOM_CARD_BASE,
              roomCardSize(false),
              amber ? "border-warning/40 bg-warning/5" : ROOM_CARD_QUIET,
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                amber ? "text-warning" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="font-heading text-card-title">{label}</span>
            <span
              className={cn(
                "truncate text-xs tabular-nums",
                ROOM_CARD_VALUE,
                amber ? "font-medium text-warning" : "text-muted-foreground",
              )}
            >
              {value}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Her hub: the bar, the head, the rooms, then the album's area, scrolled so the area is in view. */
function Hub({
  wide,
  held,
  count,
  area,
  scroll = wide ? 330 : 300,
}: {
  wide: boolean;
  held: boolean;
  count: number;
  area: ReactNode;
  /** How far the frame's own page is scrolled (the album's area brought into view); 0 for none. */
  scroll?: number;
}) {
  return (
    <EventShareProvider initialSheet={null}>
      <div className="min-h-screen bg-background pb-24 text-foreground">
        <AppBar />
        <main className="px-3 pt-8 sm:px-5">
          <HubCover
            name={EVENT.name}
            date={EVENT.date}
            counts={{
              album: 0,
              guests: held ? HELD.guests : DEV.guests,
              views: 61,
            }}
            prettyUrl={`https://${EVENT.link}`}
            eventLink={`https://${EVENT.link}`}
            code={{
              qrStyle: "classic",
              door: DOOR,
              acceptingUploads: true,
              waiting: 0,
            }}
            stills={[]}
          />
          <div className="mt-5 space-y-6">
            <Rooms held={held} />
            <section className="space-y-3">
              <FeedSectionHeader label="Album" count={count} />
              {area}
            </section>
          </div>
        </main>
        {scroll > 0 && <ScrolledTo y={scroll} />}
      </div>
    </EventShareProvider>
  );
}

/* ── the night's minutes, small: the momentum a cover keeps ────────────── */

function NightStrip({ night }: { night: readonly NightShot[] }) {
  const bins = binsOf(night);
  const peak = Math.max(...bins.map((b) => b.n));
  return (
    <span
      aria-hidden
      className="flex h-10 items-end justify-center gap-[2px]"
      data-tw-night=""
    >
      {bins.map((b) => (
        <span
          key={b.minute}
          className={cn(
            "w-[3px] rounded-full",
            b.minute + 5 > NOW ? "bg-[oklch(0.9_0.08_60)]" : "bg-white/35",
          )}
          style={{ height: 3 + (b.n / peak) * 34 }}
        />
      ))}
    </span>
  );
}

/** The album, open to her: everyone's photographs, as her hub draws them. */
function OpenAlbum({ wide }: { wide: boolean }) {
  const items: RowItem[] = albumStills(wide ? 18 : 8).map((s, i) => ({
    kind: "photo",
    still: s,
    key: `${s.id}-${i}`,
  }));
  return <Rows items={items} perRow={wide ? 6 : 2} />;
}

/** The line a lifted cover keeps, with its way back. */
function LookingEarly() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border px-3 py-2 text-sm"
      data-tw-host-say=""
    >
      <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">{`Looking early. Your guests see these at ${DEVELOP.at}.`}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        tabIndex={-1}
        data-tw-act=""
      >
        <EyeOff /> Cover it
      </Button>
    </div>
  );
}

/* ── 1. the card, polished ─────────────────────────────────────────────── */

function CardArea({ beat, wide }: { beat: HostBeat; wide: boolean }) {
  if (beat === "lifted")
    return (
      <div className="space-y-3" data-tw-host="card, lifted">
        <LookingEarly />
        <OpenAlbum wide={wide} />
      </div>
    );
  const held = beat === "held";
  const n = held ? HELD.waiting : DEV.waiting;
  return (
    <div
      className={cn("tw-well text-center", wide ? "px-10 py-10" : "px-5 py-7")}
      data-tw-host={held ? "card, held" : "card, covered"}
    >
      <p className="font-heading text-[52px] leading-none tabular-nums">
        {formatCount(n)}
      </p>
      <p className="mt-1.5 text-sm">
        {held ? "waiting for you" : "shots developing"}
      </p>
      <div className="mt-4">
        <NightStrip night={held ? NIGHT_HELD : NIGHT_DEV} />
      </div>
      <p className="tw-muted mt-3 text-sm text-pretty" data-tw-host-say="">
        {held
          ? "Each shows to your guests the moment you approve it."
          : `Your guests see them at ${DEVELOP.at}, in ${DEVELOP.until}.`}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {held ? (
          <Button type="button" variant="on-photo" tabIndex={-1} data-tw-act="">
            {`Review ${formatCount(n)}`}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="on-photo"
              tabIndex={-1}
              data-tw-act=""
            >
              <Eye /> Look now
            </Button>
            <Button type="button" variant="glass" tabIndex={-1} data-tw-act="">
              Develop now
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 2. what her guests see ────────────────────────────────────────────── */

function GuestsArea({
  beat,
  wide,
  model,
  wait,
}: {
  beat: HostBeat;
  wide: boolean;
  model: ModelId;
  wait: WaitId;
}) {
  if (beat === "lifted")
    return (
      <div className="space-y-3" data-tw-host="what her guests see, lifted">
        <LookingEarly />
        <OpenAlbum wide={wide} />
      </div>
    );
  const held = beat === "held";
  const facts = HOST_FACTS[held ? "held" : "developing"];
  const m = MODEL_WORDS[model];
  const words = (held ? m.held : m.developing) ?? m.developing;
  return (
    <div
      className="space-y-3"
      data-tw-host={
        held ? "what her guests see, held" : "what her guests see, covered"
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span
          className="min-w-0 flex-1 text-muted-foreground"
          data-tw-host-say=""
        >
          {held
            ? "What your guests see. Each shows as you approve it."
            : `What your guests see until ${DEVELOP.at}.`}
        </span>
        {held ? (
          <Button type="button" size="sm" tabIndex={-1} data-tw-act="">
            {`Review ${formatCount(facts.count)}`}
          </Button>
        ) : (
          <>
            <Button type="button" size="sm" tabIndex={-1} data-tw-act="">
              <Eye /> Look
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              tabIndex={-1}
              data-tw-act=""
            >
              Develop now
            </Button>
          </>
        )}
      </div>
      <Wait
        id={wait === "cover" ? "sheet" : wait}
        facts={facts}
        words={words}
        wide={wide}
      />
    </div>
  );
}

/* ── 3. frosted, hold to peek ──────────────────────────────────────────── */

function FrostArea({ beat, wide }: { beat: HostBeat; wide: boolean }) {
  const held = beat === "held";
  const peek = beat === "lifted";
  const n = held ? HELD.waiting : DEV.waiting;
  return (
    <div
      className="tw-frost"
      data-peek={peek ? "" : undefined}
      data-tw-host={
        held ? "frosted, held" : peek ? "frosted, peeking" : "frosted, covered"
      }
    >
      <OpenAlbum wide={wide} />
      <span aria-hidden className="tw-frost-pane" />
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-10">
        <div
          className={cn(
            GLASS,
            "flex items-center gap-3 rounded-full py-1.5 pr-1.5 pl-4 text-white",
          )}
        >
          <span className="text-sm" data-tw-host-say="">
            {peek
              ? "Peeking. Let go to cover."
              : held
                ? `${formatCount(n)} waiting for you`
                : `${formatCount(n)} developing · ${DEVELOP.at}`}
          </span>
          {held ? (
            <Button
              type="button"
              size="sm"
              variant="on-photo"
              tabIndex={-1}
              data-tw-act=""
            >
              Review
            </Button>
          ) : (
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                peek ? "bg-white text-black" : "bg-white/15",
              )}
              data-tw-act=""
              aria-label="Hold to peek"
            >
              <Hand className="size-4" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * HER HUB BEHIND A SETTINGS PANEL (a desk's Settings is a panel over the hub): the developing
 * album's hub at rest, its album under the card that covers it.
 */
export function HubBehind() {
  return (
    <Hub
      wide
      held={false}
      count={DEV.waiting}
      scroll={0}
      area={<CardArea beat="covered" wide />}
    />
  );
}

/** Maya's hub at a beat, its album's area as an option draws it. */
export function HostFrame({
  cover,
  model,
  wait,
  beat,
  wide,
}: {
  cover: HostCoverId;
  model: ModelId;
  wait: WaitId;
  beat: HostBeat;
  wide: boolean;
}) {
  const held = beat === "held";
  const area =
    cover === "card" ? (
      <CardArea beat={beat} wide={wide} />
    ) : cover === "guests" ? (
      <GuestsArea beat={beat} wide={wide} model={model} wait={wait} />
    ) : (
      <FrostArea beat={beat} wide={wide} />
    );
  return (
    <Hub
      wide={wide}
      held={held}
      count={held ? HELD.inAlbum : DEV.waiting}
      area={area}
    />
  );
}
