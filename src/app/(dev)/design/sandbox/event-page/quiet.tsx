"use client";

import "./quiet.css";

import {
  ImageUp,
  ListChecks,
  PencilLine,
  Play,
  QrCode,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useMemo } from "react";

import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { useAlbum, useAlbumKey, useAlbumLight } from "./album";
import { Cover, DayFace, DoorOver, PremiereWords, TileBox } from "./common";
import {
  type Light,
  type Moment,
  NIGHT,
  type OtherEvent,
  PRIVATE_LINK,
} from "./fixtures";
import type { GuestPageProps, HostPageProps, Kit, PageProps } from "./kit";
import type { Ground, Screen, Side } from "./knobs";
import {
  alpha,
  bandOf,
  conicOf,
  lampColor,
  linkLight,
  Seam,
  seedLight,
} from "./light";
import {
  AlbumHead,
  AppBar,
  albumWidth,
  Byline,
  Code,
  Dock,
  EmptyAlbum,
  Faces,
  GuestBar,
  Guestbook,
  GuestsSection,
  HostProviders,
  Note,
  Report,
  Ring,
  Round,
  Rows,
  Status,
  Tally,
  useScrollInto,
  widthOf,
} from "./parts";

/**
 * QUIET: THE COVER KEPT, LIT ONLY WHILE EMPTY (Will's second direction, drawn
 * whole as a contrast: "keep this general head shape but remove the seam from
 * an event page with media ... reshape it to enhance the empty state of a more
 * achromatic event page. Once content begins arriving, it becomes less
 * prominent and infuses into UI like the shutter button").
 *
 *  - WITH PHOTOGRAPHS, NOTHING GLOWS BESIDE THEM: today's cover, the reel's
 *    photographs dissolving edge to edge under the name on both sides, and no
 *    Seam (the photographs are the colour, so two colours never fight). The
 *    light lives in the controls, as the shutter wears it: the Ring itself in
 *    small, a disc of the room's own dark with the album's key in its rim,
 *    set in the face of the cover's one act (Add photos, Watch the party once
 *    it is kept), the newest face's ring, and the Ring at the foot. Never an
 *    outline round a button (the sign of focus): the light is inside the
 *    control, on a piece of the room, where light reads as light.
 *  - BEFORE THE FIRST PHOTOGRAPH THE COVER IS THE ACHROMATIC ROOM, and its one
 *    light is the Seam reshaped: the party's seed laid along the cover's foot,
 *    where the photographs will be, rising most of the cover's height. In the
 *    room the page is the room too, so the light runs on past the foot into
 *    the album's place and spends itself there (a horizon, no edge to cut it);
 *    on paper the cover is the piece of the room and its foot the edge it is
 *    born at, lit. The Add's Ring stands unlit (a hairline) until the first
 *    photograph lights it.
 *  - Each fact once: the guests are the faces, her views ride her code, the
 *    album's size is the album's own head.
 *  - Her side is the guest's cover with her tools, as quiet as the light
 *    designs keep them (no cards, no strip: the comparison is the cover and
 *    its light, never busy against calm): her note, her acts in the dock's
 *    order with what needs her as the one white press, then a quiet row of
 *    her rooms with their words and counts, the guestbook's notes among them;
 *    her code at the right. The evening she makes it, Create's flight lands
 *    on that mat at a desk and in the white Invite guests at a phone (the one
 *    code there), and the cover's seed light carries Create's dark room on.
 *  - A guest's guestbook door comes after the host's note (the note, then its
 *    answer), and stays open after her close.
 *  - After her close the moment is the cover itself, full screen: the reel's
 *    photographs its centre, its words at the foot on the left line. The card
 *    reads by its light and one mark at 68 px and at a chat's 268: the
 *    cover's photograph, or before it the seed's light (a Private album's, its
 *    link's), and the house's wordmark; the name is the title beside it.
 *  - No day dividers (X10: one gallery), and no mail drawn (X11).
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** The album's cover stills, as the head's dissolve takes them. */
function useCoverStills() {
  const album = useAlbum();
  return useMemo(
    () => album.cover.map((s) => ({ id: `${s.id}-${s.focus}`, tile: s.src })),
    [album],
  );
}

/** The album's seed as light: the empty page's (Aperture's second source, never the house ember). */
function useSeed(): Light {
  const album = useAlbum();
  return useMemo(() => seedLight(album.seed), [album]);
}

/* ── the empty page's light ─────────────────────────────────────────────── */

/**
 * HOW FAR THE EMPTY LIGHT GOES, BY THE HEAD IT LIGHTS: its core at the foot,
 * how much of the cover's height it rises (percent), and how far it runs on
 * past the foot in the room (pixels: a phone's and a desk's). Quieter is
 * shorter, never paler.
 */
const EMPTY = {
  album: { core: 45, reach: 90, fall: { phone: 190, desk: 240 } },
  hub: { core: 50, reach: 94, fall: { phone: 170, desk: 220 } },
} as const;

/**
 * THE HORIZON'S BAND: the light's depths across its length, each at its share,
 * breathing a little stronger and softer along the way (a light is never one
 * even stripe) and softest at the window's two edges, never out: it runs edge
 * to edge, its swell too broad to be a point the eye lands on.
 */
function horizonBand(light: Light): string {
  const lamps = [...light].slice(0, 3);
  const c = lamps.map((l) => lampColor(l, "field"));
  const [a, b, d] = [c[0]!, c[1] ?? c[0]!, c[2] ?? c[1] ?? c[0]!];
  return `linear-gradient(in oklab 90deg, ${alpha(a, 74)} 0%, ${a} 19%, ${alpha(b, 84)} 38%, ${b} 58%, ${alpha(d, 90)} 80%, ${alpha(d, 76)} 100%)`;
}

/**
 * THE HORIZON: a light's band laid along the foot of its box and spent upward
 * on a light's eased fall, flat at the edge (no crease) with a long tail, in
 * the field's register (light words stand in). `reach` is how far it goes,
 * `core` its strength at the edge (0 to 100).
 */
function Horizon({
  light,
  core,
  reach,
  ease = "horizon",
}: {
  light: Light;
  core: number;
  reach: string;
  /** Flat at its edge where it runs on past it (the room's horizon), or hot at a real edge it is born at. */
  ease?: "horizon" | "edge";
}) {
  const vars: Vars = {
    "--ep-quiet-band": horizonBand(light),
    "--ep-quiet-core": core / 100,
    "--ep-quiet-reach": reach,
  };
  return (
    <span
      aria-hidden
      data-ep-quiet-glow=""
      data-from="bottom"
      data-ease={ease}
      className="ep-quiet-glow"
      style={vars}
    >
      <span className="ep-grain" />
    </span>
  );
}

/**
 * THE LIGHT RISING FROM A ROOM'S FOOT: the horizon along the foot of its box,
 * rising `reach` percent of it; `line` lights the foot itself where it is a
 * real edge (the cover on paper, a card, a tile). Drawn in a `relative` box.
 */
function Rising({
  light,
  core,
  reach,
  line = false,
  lineWidth,
}: {
  light: Light;
  core: number;
  reach: number;
  line?: boolean;
  /** The lit edge's weight where the box is drawn large and seen small (a card's). */
  lineWidth?: number;
}) {
  const vars: Vars = {
    "--ep-quiet-line": bandOf(light, "line"),
    ...(lineWidth ? { "--ep-quiet-line-h": `${lineWidth}px` } : {}),
  };
  return (
    <>
      <Horizon
        light={light}
        core={core}
        reach={`${reach}%`}
        ease={line ? "edge" : "horizon"}
      />
      {line ? (
        <span aria-hidden className="ep-quiet-line" style={vars} />
      ) : null}
    </>
  );
}

/** The horizon's fall, from its edge outward: (where, 0 to 1; how much light is left). Flat at the edge, a long tail. */
const FALL: readonly (readonly [number, number])[] = [
  [0, 1],
  [0.05, 0.985],
  [0.1, 0.945],
  [0.16, 0.865],
  [0.23, 0.74],
  [0.31, 0.58],
  [0.4, 0.42],
  [0.5, 0.29],
  [0.6, 0.185],
  [0.7, 0.105],
  [0.8, 0.05],
  [0.9, 0.018],
  [1, 0],
];

/**
 * THE ROOM'S HORIZON, ONE PIECE ACROSS THE COVER'S FOOT (the room only, where
 * the page is the room too): one light whose brightest line is the cover's
 * foot, rising `reach` of the cover and running on `fall` px into the album's
 * place, drawn behind the cover (its own ground stood down to the room's, the
 * same colour) as a single box, so no box edge ever crosses the light (two
 * boxes meeting at the foot drew a dark hairline where both were cut).
 */
function RoomHorizon({
  light,
  core,
  reach,
  fall,
}: {
  light: Light;
  core: number;
  reach: number;
  fall: number;
}) {
  const vars = useMemo<Vars>(() => {
    const rise = [...FALL]
      .reverse()
      .map(
        ([p, a]) =>
          `rgb(0 0 0 / ${a}) calc((100% - ${fall}px) * ${(1 - p).toFixed(3)})`,
      );
    const down = FALL.slice(1).map(
      ([p, a]) =>
        `rgb(0 0 0 / ${a}) calc(100% - ${fall}px * ${(1 - p).toFixed(3)})`,
    );
    return {
      "--ep-quiet-band": horizonBand(light),
      "--ep-quiet-core": core / 100,
      "--ep-quiet-mask": `linear-gradient(to bottom, ${[...rise, ...down].join(", ")})`,
      top: `${((1 - reach / 100) * 100).toFixed(2)}%`,
      bottom: -fall,
    };
  }, [light, core, reach, fall]);
  return (
    <span
      aria-hidden
      data-ep-quiet-horizon=""
      className="ep-quiet-horizon"
      style={vars}
    >
      <span className="ep-grain" />
    </span>
  );
}

/**
 * THE COVER: today's frame (`EventHead`), the album's reel photographs
 * dissolving; before them the achromatic room, its seed's light along the foot
 * (rising into the cover, and in the room running on below it).
 */
function QuietCover({
  side,
  screen,
  ground,
  moment,
  children,
  className,
}: {
  side: "album" | "hub";
  screen: Screen;
  ground: Ground;
  moment: Moment;
  children: ReactNode;
  className?: string;
}) {
  const stills = useCoverStills();
  const seed = useSeed();
  const empty = moment.album === 0;
  const room = ground === "room";
  const light = EMPTY[side];
  return (
    <div
      data-ep-quiet={empty ? "empty" : "photos"}
      data-ep-quiet-ground={ground}
      className="ep-quiet-cover relative"
    >
      {empty && room ? (
        <RoomHorizon
          light={seed}
          core={light.core}
          reach={light.reach}
          fall={screen === "1440" ? light.fall.desk : light.fall.phone}
        />
      ) : null}
      <EventHead
        side={side}
        className={className}
        ground={
          empty ? (
            // On paper the cover is the piece of the room: the light is born at its foot, lit, and finishes inside it.
            room ? null : (
              <Rising
                light={seed}
                core={light.core + 8}
                reach={light.reach}
                line
              />
            )
          ) : (
            <div className="absolute inset-0">
              <HeadStills stills={stills} />
            </div>
          )
        }
      >
        {children}
      </EventHead>
    </div>
  );
}

/* ── the light in the controls ──────────────────────────────────────────── */

/**
 * THE RING, IN SMALL, IN THE ACT'S FACE: the shutter's own anatomy at the
 * size of a glyph, a disc of the room's own dark (the puck: on a white face a
 * light reads only on a piece of the room) with the album's key in its rim
 * and the act's glyph inside. Unlit (a hairline of white) before the album
 * has a photograph to light it; lit from its first.
 */
function RingMark({ lit, children }: { lit: boolean; children: ReactNode }) {
  const key = useAlbumKey();
  const vars = useMemo<Vars>(
    () => ({
      "--ep-quiet-ring": conicOf(key, "room"),
      "--ep-quiet-halo": lampColor(key[1] ?? key[0]!, "room"),
    }),
    [key],
  );
  return (
    <span
      aria-hidden
      data-ep-quiet-mark={lit ? "lit" : "unlit"}
      className="ep-quiet-mark"
      style={vars}
    >
      {children}
    </span>
  );
}

/** The album's own act on the cover (Add, Watch the party): white, or glass where something else needs her first. */
function AlbumAct({
  label,
  icon = <ImageUp className="size-[13px]" />,
  lit,
  tone = "white",
  grow,
  act = "add",
}: {
  label: string;
  icon?: ReactNode;
  lit: boolean;
  tone?: "white" | "glass";
  grow?: boolean;
  act?: "add" | "watch";
}) {
  return (
    <Button
      type="button"
      variant={tone === "white" ? "on-photo" : "glass"}
      size="cta"
      tabIndex={-1}
      data-ep-act={act}
      className={cn("gap-2.5 pr-5 pl-2.5", grow && "min-w-0 flex-1")}
    >
      <RingMark lit={lit}>{icon}</RingMark>
      {label}
    </Button>
  );
}

const PLAY = <Play className="size-[11px] translate-x-px fill-current" />;

/* ── the guest's page ───────────────────────────────────────────────────── */

/** A guest's acts in the dock's own order (Invite, the Add, the reel), so nothing reshuffles as the dock takes over. */
function GuestActs({ moment, desk }: { moment: Moment; desk: boolean }) {
  const grow = !desk;
  if (!moment.open)
    return (
      <>
        <Round act="invite" />
        <AlbumAct
          label="Watch the party"
          icon={PLAY}
          lit
          grow={grow}
          act="watch"
        />
        <Round act="home" />
      </>
    );
  const fresh = moment.album === 0;
  return (
    <>
      <Round act="invite" />
      <AlbumAct
        label={fresh ? "Add the first photo" : "Add photos"}
        lit={!fresh}
        grow={grow}
      />
      {moment.album > 1 ? <Round act="reel" /> : null}
    </>
  );
}

function GuestPage({
  screen,
  ground,
  moment,
  scroll = "top",
  beat,
  count,
}: GuestPageProps) {
  const w = widthOf(screen);
  const desk = screen === "1440";
  const box = useScrollInto(scroll);
  const album = useAlbum();
  return (
    <div
      ref={box}
      data-ep-page="guest"
      className="relative min-h-screen bg-background pb-28 text-foreground"
    >
      <GuestBar />
      <QuietCover
        side="album"
        screen={screen}
        ground={ground}
        moment={moment}
        className="-mt-14"
      >
        <div className="px-5 pb-6 md:flex md:items-end md:justify-between md:gap-10 md:pb-9">
          <div className="min-w-0 md:max-w-2xl">
            <h1 className="font-heading text-title text-balance">
              {album.name}
            </h1>
            <Byline className="mt-3 text-white/85" />
            <Faces moment={moment} size={desk ? 32 : 28} className="mt-3.5" />
            <Note className="mt-3 text-white/80" />
            {/* The guestbook's door after her note (the note, then its answer), open after her close too. */}
            {moment.guests > 0 ? (
              <Guestbook
                side="guest"
                className="mt-2.5 text-white/75 hover:text-white [&>svg]:text-white/75"
              />
            ) : null}
          </div>
          <div className="mt-6 flex items-center gap-2.5 md:mt-0 md:shrink-0">
            <GuestActs moment={moment} desk={desk} />
          </div>
        </div>
      </QuietCover>
      <div className="relative mt-5 px-3 sm:px-5">
        {moment.album > 0 ? (
          <>
            <AlbumHead moment={moment} className="mb-3" />
            <Rows width={albumWidth(w)} />
          </>
        ) : (
          <EmptyAlbum side="guest" cta={false} />
        )}
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-5">
          <GuestsSection guests={moment.guests} />
        </div>
      </div>
      <Report />
      {scroll !== "top" ? (
        <Dock ground={ground} beat={beat} add={moment.open} count={count} />
      ) : null}
    </div>
  );
}

/* ── her page: the guest's cover with her tools, quiet ──────────────────── */

/** The guestbook's notes by the party's moment (the board's stand-in: none before the first guest). */
const NOTES: Record<Moment["key"], number> = {
  made: 0,
  waiting: 0,
  night: 12,
  wednesday: 17,
  week: 17,
};

/** What waits on her first: Review's uploads, then the people at her door; none when nothing does. */
const leadOf = (m: Moment): "review" | "guests" | null =>
  m.review > 0 ? "review" : m.door > 0 ? "guests" : null;

/** What needs her, as her head's one white press, its count on it. */
function NeedsPress({
  moment,
  lead,
  grow,
}: {
  moment: Moment;
  lead: "review" | "guests";
  grow?: boolean;
}) {
  const review = lead === "review";
  return (
    <Button
      type="button"
      variant="on-photo"
      size="cta"
      tabIndex={-1}
      data-ep-act={review ? "review" : "door"}
      className={cn("gap-2", grow && "min-w-0 flex-1")}
    >
      {review ? <ListChecks /> : <Users />}
      {review ? "Review" : "Let them in"}
      <Tally n={review ? moment.review : moment.door} />
    </Button>
  );
}

/**
 * HER ACTS, UNDER HER NOTE where a guest's stand, in the dock's order (her
 * code is her Invite: the mat at a desk, the round at a phone): the evening
 * she makes it, Invite guests leads (Create's code lands in it at a phone);
 * then the first photo; at the party, whatever needs her is the one white
 * press and Add photos steps back to glass; on the Wednesday, the offer
 * alone; once kept, Watch the party.
 */
function HostActs({
  moment,
  arrival,
  desk,
  offer,
}: {
  moment: Moment;
  arrival?: boolean;
  desk: boolean;
  offer?: boolean;
}) {
  const grow = !desk;
  if (offer) return <QuietOffer />;
  if (!moment.open)
    return (
      <>
        <AlbumAct
          label="Watch the party"
          icon={PLAY}
          lit
          grow={grow}
          act="watch"
        />
        <Button
          type="button"
          variant="glass"
          size="icon-cta"
          tabIndex={-1}
          aria-label="Share the album"
        >
          <Share2 />
        </Button>
      </>
    );
  if (moment.album === 0)
    return arrival ? (
      <>
        <Button
          type="button"
          variant="on-photo"
          size="cta"
          tabIndex={-1}
          data-ep-act="invite"
          className={cn(grow && "min-w-0 flex-1")}
        >
          <QrCode /> Invite guests
        </Button>
        <AlbumAct label="Add photos" lit={false} tone="glass" />
      </>
    ) : (
      <AlbumAct label="Add the first photo" lit={false} grow={grow} />
    );
  const lead = leadOf(moment);
  return (
    <>
      {lead ? <NeedsPress moment={moment} lead={lead} grow={grow} /> : null}
      <AlbumAct
        label="Add photos"
        lit
        tone={lead ? "glass" : "white"}
        grow={!lead && grow}
      />
      <Round act="reel" />
    </>
  );
}

/**
 * CLOSE ADDING, OFFERED (after-party's `over=offer`), standing where her acts
 * stand: the one thing that needs her on the Wednesday, her only white press.
 */
function QuietOffer() {
  return (
    <div data-ep-offer="" className="flex flex-col gap-3.5">
      <p className="max-w-xl text-working text-pretty">
        <span className="font-medium text-white">
          No new photos since Monday.
        </span>{" "}
        <span className="text-white/75">
          Close adding? Guests can still see and save every one.
        </span>
      </p>
      <span className="flex items-center gap-2.5">
        <Button type="button" variant="on-photo" size="cta" tabIndex={-1}>
          Close adding
        </Button>
        <Button type="button" variant="glass" size="cta" tabIndex={-1}>
          Keep it open
        </Button>
      </span>
    </div>
  );
}

const ROOMS: readonly {
  id: "review" | "guests" | "settings";
  word: string;
  icon: ReactNode;
  count: (m: Moment) => number;
}[] = [
  {
    id: "review",
    word: "Review",
    icon: <ListChecks />,
    count: (m) => m.review,
  },
  { id: "guests", word: "Guests", icon: <Users />, count: (m) => m.door },
  { id: "settings", word: "Settings", icon: <Settings />, count: () => 0 },
];

/** A room's press in the row: the cover's quiet white, a step of light under the pointer. */
const ROOM =
  "h-7 gap-1.5 px-2.5 text-xs text-white/75 hover:bg-white/10 hover:text-white";

/**
 * HER ROOMS, A QUIET ROW under her acts: each a press into its room in the
 * cover's quiet white, the tally on its shoulder only where a count needs her,
 * and the guestbook's notes among them, the room she reads them in. The room
 * that is her white press above stands there alone (each press once, its
 * count said once); the guests' own count is the faces', never said here.
 */
function HerRooms({
  moment,
  offer,
  className,
}: {
  moment: Moment;
  offer?: boolean;
  className?: string;
}) {
  const lead =
    moment.open && moment.album > 0 && !offer ? leadOf(moment) : null;
  return (
    <nav
      aria-label="This event"
      data-ep-rooms="quiet"
      className={cn("-ml-2.5 flex flex-wrap items-center gap-0.5", className)}
    >
      {ROOMS.filter((r) => r.id !== lead).map((r) => {
        const n = r.count(moment);
        return (
          <Button
            key={r.id}
            type="button"
            variant="ghost"
            size="sm"
            tabIndex={-1}
            data-ep-room={r.id}
            className={ROOM}
          >
            {r.icon}
            {r.word}
            {n ? <Tally n={n} /> : null}
          </Button>
        );
      })}
      {moment.guests > 0 ? (
        <Guestbook
          side="host"
          short
          notes={NOTES[moment.key]}
          className={cn(
            ROOM,
            "rounded-[calc(var(--radius-action)*0.7)] hover:no-underline [&>svg]:size-3.5",
          )}
        />
      ) : null}
    </nav>
  );
}

/**
 * HER CODE AT THE COVER'S RIGHT, one rule at both widths: ★ WHERE CREATE'S
 * CODE LANDS, the evening she makes it, is the code itself on its white mat
 * ("Go to your event" flies it by the code door's own view-transition name),
 * code onto code, never a code into a button: the whole mat at a desk, the
 * same mat at a phone's size in the corner where her Invite round will stand.
 * Once guests have it, a phone's folds into that round (the views riding it);
 * a desk keeps the mat, as her cover always has.
 */
function HerCode({
  moment,
  desk,
  arrival,
}: {
  moment: Moment;
  desk: boolean;
  arrival?: boolean;
}) {
  const views =
    moment.views > 0 ? (
      <span className="text-xs text-white/75 tabular-nums">
        {formatCount(moment.views)} views
      </span>
    ) : null;
  if (desk || arrival)
    return (
      <div
        data-ep-code-lands={arrival ? "" : undefined}
        className="flex shrink-0 flex-col items-center gap-2"
      >
        {/* A phone's landing is the same mat at about half its size (the code's own drawing, zoomed). */}
        <span className="inline-flex" style={desk ? undefined : { zoom: 0.56 }}>
          <Code moment={moment} />
        </span>
        {views}
      </div>
    );
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <Round act="invite" label="Your code" />
      {views}
    </div>
  );
}

/** Her welcome note, or its quiet door while it is empty (the evening she makes it). */
function HerNote({ arrival }: { arrival?: boolean }) {
  return arrival ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      tabIndex={-1}
      className={cn(ROOM, "-ml-2.5")}
    >
      <PencilLine /> Add a welcome note
    </Button>
  ) : (
    <Note className="text-white/80" />
  );
}

function HostPage({ screen, ground, moment, arrival, offer }: HostPageProps) {
  const w = widthOf(screen);
  const desk = screen === "1440";
  const fresh = moment.album === 0;
  const album = useAlbum();
  const faces = arrival ? null : (
    <Faces
      moment={moment}
      size={desk ? 30 : 26}
      empty={
        fresh ? (
          <span className="text-white/75">Faces gather here as guests add</span>
        ) : undefined
      }
    />
  );
  const acts = (
    <div className="flex items-center gap-2.5">
      <HostActs moment={moment} arrival={arrival} desk={desk} offer={offer} />
    </div>
  );
  return (
    <HostProviders>
      <div
        data-ep-page="host"
        className="relative min-h-screen bg-background pb-16 text-foreground"
      >
        <AppBar screen={screen} />
        <div className="space-y-6 px-3 sm:px-5">
          <div className="relative -mx-3 sm:-mx-5">
            <QuietCover
              side="hub"
              screen={screen}
              ground={ground}
              moment={moment}
              className="h-auto min-h-[20.5rem] sm:h-auto sm:min-h-[25rem]"
            >
              {desk ? (
                <div className="flex items-end gap-10 px-5 pt-10 pb-8">
                  <div className="min-w-0 flex-1">
                    <h1 className="font-heading text-chapter text-balance text-white">
                      {album.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                      <Status moment={moment} />
                      <Byline host={false} className="text-white/85" />
                    </div>
                    {faces ? <div className="mt-4">{faces}</div> : null}
                    <div
                      className={cn("max-w-xl", arrival ? "mt-3" : "mt-3.5")}
                    >
                      <HerNote arrival={arrival} />
                    </div>
                    <div className="mt-6">{acts}</div>
                    <HerRooms moment={moment} offer={offer} className="mt-3" />
                  </div>
                  <HerCode moment={moment} desk arrival={arrival} />
                </div>
              ) : (
                <div className="px-3 pt-7 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="font-heading text-section text-balance text-white">
                        {album.name}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                        <Status moment={moment} />
                        <Byline host={false} className="text-white/85" />
                      </div>
                    </div>
                    <HerCode moment={moment} desk={false} arrival={arrival} />
                  </div>
                  {faces ? <div className="mt-3.5">{faces}</div> : null}
                  <div className="mt-3">
                    <HerNote arrival={arrival} />
                  </div>
                  <div className="mt-5">{acts}</div>
                  <HerRooms moment={moment} offer={offer} className="mt-2.5" />
                </div>
              )}
            </QuietCover>
          </div>
          {/* No Seam where the cover has photographs: they are the colour. Before them, the cover holds the light. */}
          <section aria-label="Album" className="relative">
            {fresh ? (
              <EmptyAlbum side="host" />
            ) : (
              <>
                <AlbumHead
                  moment={moment}
                  host
                  compact={!desk}
                  className="mb-3"
                />
                <Rows width={albumWidth(w)} />
              </>
            )}
          </section>
        </div>
      </div>
    </HostProviders>
  );
}

/* ── the one moment: the cover, whole ───────────────────────────────────── */

/**
 * THE MOMENT IS THE COVER, FULL SCREEN: the reel's photographs its centre,
 * dissolving under the bar as on the page, the words at the foot on the
 * page's own left line, Watch the party with the album's Ring lit in its face,
 * then the page as before.
 */
function Premiere({ screen, moment, side }: PageProps & { side: Side }) {
  const desk = screen === "1440";
  const stills = useCoverStills();
  return (
    <div
      data-ep-premiere="quiet"
      data-ep-quiet-moment=""
      className="dark relative min-h-screen bg-background text-foreground"
    >
      <div className="absolute inset-x-0 top-0 z-20">
        {/* Her bar without its crumbs: the moment is the album's, full screen, and crumbs over a photograph only blur. */}
        {side === "host" ? <AppBar over screen="375" /> : <GuestBar />}
      </div>
      <EventHead
        side="album"
        className="h-screen"
        ground={
          <div className="absolute inset-0">
            <HeadStills stills={stills} />
            {/* The words' own ground: the cover's scrim deepened at the foot and toward the left line they keep. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgb(0 0 0 / 0.5) 0%, rgb(0 0 0 / 0.3) 34%, transparent 62%), linear-gradient(to right, rgb(0 0 0 / 0.36) 0%, transparent 58%)",
              }}
            />
          </div>
        }
      >
        <div className={cn("px-5", desk ? "pb-14" : "pb-8")}>
          <PremiereWords
            side={side}
            moment={moment}
            align="start"
            tone="photo"
            className="max-w-2xl gap-3.5"
          />
          <div className="mt-7 flex items-center gap-2.5">
            <AlbumAct
              label="Watch the party"
              icon={PLAY}
              lit
              grow={!desk}
              act="watch"
            />
            {side === "host" ? (
              <Button type="button" variant="glass" size="cta" tabIndex={-1}>
                <Share2 /> Share the album
              </Button>
            ) : null}
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="mt-5 text-sm text-white/75 underline-offset-4 hover:underline"
          >
            {side === "host" ? "Back to your album" : "Go to the album"}
          </button>
        </div>
      </EventHead>
    </div>
  );
}

/* ── its reach ──────────────────────────────────────────────────────────── */

/** The card's own gutter, at its 1200 by 630. */
const CARD_PAD = 80;

/**
 * THE CARD, ITS LIGHT AND ONE MARK: it reads at Create's 68 px as surely as a
 * chat's 268, whatever the album's name (the title beside it in Create and
 * under it in every chat says the name, so the card never has to). The card
 * follows the album, as its cover does: with photographs, the cover's opening
 * photograph edge to edge, weighted at its foot; before the first, the empty
 * cover in small, the room with its seed lit at the foot; a Private album's,
 * the room in its link's light (never its photograph, its seed or its name).
 * Its one mark, the house's wordmark, stands on the cover's left line: large
 * on a light, where it is the card's one object (Create's 68 px seat is always
 * a just-made party's, so it is this card); smaller on a photograph, which
 * leads (the house signs, the album speaks through its photograph).
 */
function Card({
  variant,
  moment,
}: {
  variant: "open" | "private";
  moment: Moment;
}) {
  const album = useAlbum();
  const open = variant === "open";
  const photo = open && moment.album > 0;
  const light = useMemo(
    () => (open ? seedLight(album.seed) : linkLight(PRIVATE_LINK)),
    [open, album],
  );
  return (
    <div
      data-ep-card={variant}
      data-ep-card-ground={photo ? "photo" : "light"}
      className="dark relative flex size-full flex-col justify-end overflow-hidden bg-[#0b0b0c] text-white"
      style={{ padding: CARD_PAD }}
    >
      {photo ? (
        <>
          <Cover still={album.cover[0]!} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgb(0 0 0 / 0.62) 0%, rgb(0 0 0 / 0.3) 34%, rgb(0 0 0 / 0) 64%), linear-gradient(to right, rgb(0 0 0 / 0.28) 0%, rgb(0 0 0 / 0) 55%)",
            }}
          />
        </>
      ) : (
        <Rising light={light} core={66} reach={96} line lineWidth={6} />
      )}
      <span className="relative">
        <Logo className={photo ? "h-[100px]" : "h-[168px]"} />
      </span>
    </div>
  );
}

/** A tile: its photograph; before its first, the empty cover in small (the room, its seed lit at the foot) and its day. */
function Tile({ event }: { event: OtherEvent }) {
  const light = useMemo(() => seedLight(event.seed), [event.seed]);
  return (
    <TileBox className={event.cover ? "" : "dark bg-[#0b0b0c]"}>
      {event.cover ? (
        <Cover still={event.cover} />
      ) : (
        <>
          <Rising light={light} core={60} reach={96} line />
          <DayFace event={event} />
        </>
      )}
    </TileBox>
  );
}

/** The door: signature r1's Seam at the album's edge, in the album's own light, rising from the sheet into the album behind. */
function Door({ ground }: { ground: Ground }) {
  const light = useAlbumLight();
  return (
    <DoorOver
      page={<GuestPage screen="375" ground={ground} moment={NIGHT} />}
      light={(box) => (
        <span
          aria-hidden
          className="pointer-events-none fixed z-[51] block"
          style={{
            left: box.left,
            width: box.width,
            top: box.top - 36,
            height: 36,
          }}
        >
          <Seam light={light} edge="bottom" reach={36} />
        </span>
      )}
    />
  );
}

/** The Add: Aperture's Ring in the album's key, resting low, lifting as her photo lands. */
function Add({
  ground,
  beat,
}: {
  ground: Ground;
  beat: "rest" | "lands" | "unlit";
}) {
  return <Ring ground={ground} beat={beat} />;
}

export const QUIET: Kit = {
  id: "quiet",
  GuestPage,
  HostPage,
  Premiere,
  Card,
  Tile,
  Door,
  Add,
};
