"use client";

import "./featured.css";

import {
  ImageUp,
  ListChecks,
  PencilLine,
  Play,
  QrCode,
  Settings,
  Users,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { HeadStills } from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { useAlbum, useAlbumKey } from "./album";
import {
  Cover,
  DayFace,
  DoorOver,
  Offer,
  PremiereActs,
  PremiereWords,
  TileBox,
} from "./common";
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
  GlowField,
  lampColor,
  linkLight,
  poolLayer,
  poolsFrom,
  seedLight,
} from "./light";
import {
  AddButton,
  AlbumHead,
  AppBar,
  albumWidth,
  Byline,
  Code,
  Dock,
  Faces,
  GuestBar,
  Guestbook,
  GuestsSection,
  HostProviders,
  Name,
  Note,
  Report,
  Ring,
  Round,
  Rows,
  SoftAct,
  Status,
  Tally,
  useScrollInto,
  WatchButton,
  widthOf,
} from "./parts";

/**
 * FEATURED: THE PHOTOGRAPHS AS A FEATURED CARD (Will's third direction, drawn
 * whole as a contrast: "turning the slideshow into more of a featured card
 * above the action stack, similar to how a featured post on a blog page may
 * present ... so it isn't the only component running fully edge-to-edge").
 * The page is a calm editorial page on its own ground; the reel's photographs
 * play in one enclosed card, its featured post, and under it, as a post's
 * title and meta, the name, the faces, the note and the acts, never laid over
 * a photograph. Nothing runs edge to edge, so the bar never cuts it.
 *
 *  - ONE SHAPE AT EVERY WIDTH: the card first, across the content (the
 *    album's own gutter, so the card, the album and the words keep one left
 *    line at a desk), then the action stack under it. At a phone the card is
 *    a 4:3 picture; at a desk a wide, calm band (7:2, the hub's own band), so
 *    the album's first row still stands on the first screen. Its right edge is
 *    the page's second line: her tools at a desk stand on it, beside her name,
 *    as the album's Select and View do beside its count.
 *  - THE CARD HAS THREE FACES, one per state of the party: a WINDOW before the
 *    first photograph, its light the party's seed as a horizon from its foot
 *    (never a floating lamp: no point of focus, spent inside the card), the
 *    empty album's words standing in it for a guest and her code for Maya, so
 *    the code Create flies over lands in its own light at a desk and a phone
 *    alike; the reel's photographs dissolving while the party takes them; and
 *    the reel's POSTER once she closes adding (its opening still, its play).
 *  - THE STACK, ONE ORDER ON BOTH SIDES: the name, who and when with the
 *    faces, the host's note and then its answer (the guestbook's door: a
 *    guest's "Leave Maya a note", her count of them), the acts in the dock's
 *    own order (Invite, Add, the reel). Hers adds her status to the day, her
 *    code as the Invite (its views riding it), and her rooms: what waits on
 *    her (Review's uploads, people at her door) is her one white press, and
 *    Add photos steps back; Wednesday's offer is likewise her only one.
 *  - NO LIGHT ON THE PAGE ONCE PHOTOGRAPHS LAND: they are the card's light,
 *    the brightest thing on the page, and it wears the bright edge of
 *    everything media; the newest face's ring and the Ring at the foot carry
 *    the album's key. ★ A light thrown off the card's foot (the shipped
 *    `ScreenLamp`'s rule) was drawn and dropped: a gold light spent over the
 *    room's black falls through brown, so under the card it read as a brown
 *    shadow behind the name, paint. Before the first photograph the seed light
 *    lives inside the window, a piece of the room on paper too.
 *  - After her close the one moment sets the poster on the page's stage,
 *    centred, the reward under it; then the page as before, the poster in the
 *    card's place. The card a link unfurls into is the featured card in
 *    small: full bleed (the opening photograph, or the horizon), the house's
 *    one mark, the name large over its foot; a Private album's is the house's
 *    wordmark over its link's light. A party's tile before its first photo is
 *    the window.
 *  - No day dividers (one gallery, X10) and no mail (X11) are drawn.
 */

/* ── the light before the first photograph ──────────────────────────────── */

/**
 * A LINE OF LIGHT'S FALL, eased: a line source falls as one over the
 * distance, never its square, so the horizon's glow climbs high and soft and
 * no ring of a stop shows. Position (a share of the reach) and the share of
 * the core there.
 */
const FALL = [
  [0, 1],
  [8, 0.8],
  [20, 0.55],
  [36, 0.32],
  [54, 0.15],
  [74, 0.05],
  [100, 0],
] as const;

/**
 * THE HORIZON: a light born along a box's foot, the whole width at once (a
 * line for a source, never a lamp: no point of focus, nothing floating), as a
 * sky takes it at dawn: the line itself, a broad swell of its heaviest depth
 * from below the middle of the foot (wider than the box, so it has no centre
 * to find), and its other two depths warming the two ends, so the colour
 * moves along it and the corners stay the dimmest part. It rises `reach` of
 * the box and is spent before its top; the box's own corners keep it (it
 * lives inside the window, the card, the tile, never on the page).
 */
function horizonOf(light: Light, core: number, reach: number): string {
  const order = [...light].sort((a, b) => b.w - a.w);
  const [main, left, right] = [
    order[0]!,
    order[1] ?? order[0]!,
    order[2] ?? order[0]!,
  ].map((lamp) => lampColor(lamp, "field"));
  const line = `linear-gradient(to top in oklab, ${FALL.map(
    ([at, k]) =>
      `${k ? alpha(main!, Math.round(16 * core * k * 100) / 100) : "transparent"} ${((at * reach) / 100).toFixed(1)}%`,
  ).join(", ")})`;
  const swell = poolLayer({
    x: 50,
    y: 116,
    rx: 96,
    ry: reach * 1.3,
    color: main!,
    core: 36 * core,
  });
  const end = (color: string, x: number) =>
    poolLayer({ x, y: 120, rx: 54, ry: reach, color, core: 18 * core });
  return [swell, end(left!, 10), end(right!, 90), line].join(", ");
}

/** The horizon as a field in its box: its own layers, its grain masked by the same fall. */
function Horizon({
  light,
  core = 1,
  reach = 88,
  grain = true,
}: {
  light: Light;
  core?: number;
  reach?: number;
  grain?: boolean;
}) {
  const background = useMemo(
    () => horizonOf(light, core, reach),
    [light, core, reach],
  );
  // The grain's mask: the same light along the same foot, so the grain lives only where the light is.
  const mask = useMemo(
    () => poolsFrom(light, "bottom", { core: 60, reach }),
    [light, reach],
  );
  return <GlowField pools={mask} grain={grain} style={{ background }} />;
}

/* ── the featured card ──────────────────────────────────────────────────── */

type Face = "window" | "photos" | "poster";

/** The card's face at a moment: the window before the first photo, the photographs while open, the poster once kept. */
const faceOf = (moment: Moment): Face =>
  moment.album === 0 ? "window" : moment.open ? "photos" : "poster";

/** The poster's play mark: the reel's one press, an opaque disc, so it reads on any photograph. */
function PlayMark({ size = 56 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
    >
      <span
        className="flex items-center justify-center rounded-full bg-white/92 text-black shadow-layer"
        style={{ width: size, height: size }}
      >
        <Play
          className="fill-current"
          style={{
            width: size * 0.4,
            height: size * 0.4,
            marginLeft: size * 0.05,
          }}
        />
      </span>
    </span>
  );
}

/**
 * THE FEATURED CARD: the room's own dark a step off its ground (the elevation
 * contract's STEP), enclosed, the bright edge of media on it (dark grounds
 * only, by the edge's own fence); inside, its face at the moment, read from
 * the frame's album. A window's content (her code, the empty album's words)
 * stands at its middle, the horizon rising under it.
 */
function Featured({
  face,
  className,
  children,
  play = 56,
}: {
  face: Face;
  className?: string;
  children?: ReactNode;
  /** The poster's play mark, its size (larger in the one moment). */
  play?: number;
}) {
  const album = useAlbum();
  const stills = useMemo(
    () => album.cover.map((s) => ({ id: `${s.id}-${s.focus}`, tile: s.src })),
    [album],
  );
  const seed = useMemo(() => seedLight(album.seed), [album.seed]);
  return (
    <div
      data-ep-featured={face}
      data-lit=""
      className={cn(
        "dark relative isolate overflow-hidden rounded-2xl bg-card text-foreground",
        className,
      )}
    >
      {face === "window" ? (
        <Horizon light={seed} />
      ) : face === "photos" ? (
        <HeadStills stills={stills} />
      ) : (
        <>
          <Cover still={album.cover[0]!} />
          <PlayMark size={play} />
        </>
      )}
      {children ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * THE HEAD'S ONE SHAPE: the card across the content, the stack under it. At
 * a phone the card is inset to the album's gutter and the words to the
 * reading line; at a desk the card, the words and the album keep one line.
 */
function Head({
  screen,
  card,
  words,
}: {
  screen: Screen;
  card: (className: string) => ReactNode;
  words: ReactNode;
}) {
  return screen === "1440" ? (
    <div data-ep-featured-head="desk" className="px-5 pt-2">
      {card("aspect-[7/2]")}
      <div className="pt-6">{words}</div>
    </div>
  ) : (
    <div data-ep-featured-head="phone" className="px-3 pt-2">
      {card("aspect-[4/3]")}
      <div className="px-2 pt-5">{words}</div>
    </div>
  );
}

/* ── the stack's parts ──────────────────────────────────────────────────── */

/**
 * WHO AND WHEN, WITH THE FACES: at a phone a line each (the day's, then the
 * faces'), at a desk one line; hers leads with her status. Faces stand under
 * the name on both sides; before the first guest nothing stands in their
 * place.
 */
function Meta({
  moment,
  side,
  desk,
  className,
}: {
  moment: Moment;
  side: Side;
  desk: boolean;
  className?: string;
}) {
  const who =
    side === "host" ? (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Status moment={moment} />
        <Byline host={false} />
      </div>
    ) : (
      <Byline />
    );
  return desk ? (
    <div
      className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}
    >
      {who}
      <Faces moment={moment} size={32} />
    </div>
  ) : (
    <div className={className}>
      {who}
      <Faces moment={moment} className="mt-4" />
    </div>
  );
}

/**
 * THE NOTE, THEN ITS ANSWER (X12: notes to the hosts, never a caption on a
 * photograph): the host's welcome note as her guests read it, then the
 * guestbook's door, a guest's "Leave Maya a note" (open after her close too:
 * notes come days after the photos stop) and her count of them once a guest
 * is in. On her arrival the note is empty, so its quiet door stands in its
 * place. One line at a desk, the answer under the note at a phone.
 */
function NoteLine({
  moment,
  side,
  desk,
  arrival = false,
  className,
}: {
  moment: Moment;
  side: Side;
  desk: boolean;
  arrival?: boolean;
  className?: string;
}) {
  const note = arrival ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      tabIndex={-1}
      className="-ml-2.5 text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
    >
      <PencilLine /> Add a welcome note
    </Button>
  ) : (
    <Note />
  );
  const answer =
    side === "guest" ? (
      <Guestbook side="guest" />
    ) : moment.guests > 0 ? (
      <Guestbook side="host" />
    ) : null;
  return desk ? (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}
    >
      {note}
      {answer}
    </div>
  ) : (
    <div className={className}>
      {note}
      {answer ? <div className="mt-2">{answer}</div> : null}
    </div>
  );
}

/* ── the album under the head ───────────────────────────────────────────── */

/**
 * THE ALBUM: its head (its one count, Select and View, the host's Download
 * folded at a phone) on the reading line, its rows to the gutter. Before the
 * first photograph there is no album to head: the card's window says it.
 */
function Album({
  screen,
  moment,
  host,
}: {
  screen: Screen;
  moment: Moment;
  host: boolean;
}) {
  if (moment.album === 0) return null;
  return (
    <div data-ep-album="" className="mt-8 px-3 sm:px-5">
      <AlbumHead
        moment={moment}
        host={host}
        compact={screen === "375"}
        // The count on the reading line at a phone (its gutter is the media's, 8px out); a breakpoint utility of the
        // lab's own never beats production's at a frame (design.css), so the width is chosen here.
        className={screen === "375" ? "mb-3 pl-1.5" : "mb-3"}
      />
      <Rows width={albumWidth(widthOf(screen))} />
    </div>
  );
}

/* ── the guest's page ───────────────────────────────────────────────────── */

/** Her acts in the dock's own order (Invite, Add, the reel), so nothing reshuffles when the dock takes over. */
function GuestActs({ moment, desk }: { moment: Moment; desk: boolean }) {
  const grow = desk ? undefined : "min-w-0 flex-1";
  if (!moment.open)
    return (
      <>
        <Round act="invite" on="page" />
        <WatchButton on="page" className={grow} />
        <Round act="home" on="page" />
      </>
    );
  return (
    <>
      <Round act="invite" on="page" />
      <AddButton
        on="page"
        label={moment.album === 0 ? "Add the first photo" : "Add photos"}
        className={grow}
      />
      {moment.album > 1 ? <Round act="reel" on="page" /> : null}
    </>
  );
}

/** The window's words for a guest before the first photograph: the empty album's own, where the photographs will play. */
function EmptyWords({ desk }: { desk: boolean }) {
  return (
    <p
      className={cn(
        "font-heading text-balance text-foreground",
        desk ? "text-page" : "text-subsection",
      )}
    >
      The album starts with you
    </p>
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
  const desk = screen === "1440";
  const box = useScrollInto(scroll);
  const face = faceOf(moment);
  const words = (
    <>
      <Name className="text-chapter" />
      <Meta
        moment={moment}
        side="guest"
        desk={desk}
        className={desk ? "mt-3" : "mt-3"}
      />
      <NoteLine
        moment={moment}
        side="guest"
        desk={desk}
        className={desk ? "mt-4" : "mt-3"}
      />
      <div className={cn("flex items-center gap-2", desk ? "mt-6" : "mt-5")}>
        <GuestActs moment={moment} desk={desk} />
      </div>
    </>
  );
  return (
    <div
      ref={box}
      data-ep-page="guest"
      className="relative min-h-screen bg-background pb-28 text-foreground"
    >
      <GuestBar over={false} />
      <Head
        screen={screen}
        words={words}
        card={(className) => (
          <Featured face={face} className={className}>
            {face === "window" ? <EmptyWords desk={desk} /> : null}
          </Featured>
        )}
      />
      <Album screen={screen} moment={moment} host={false} />
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

/* ── her page ───────────────────────────────────────────────────────────── */

type Room = "review" | "guests" | "settings";

const ROOMS: readonly {
  id: Room;
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

/**
 * WHAT WAITS ON HER (the creative director's rule): Review's uploads first,
 * then the people at her door; that room is her head's one white press while
 * it waits, and nothing else is white beside it.
 */
const waitingOn = (moment: Moment): Room | null =>
  !moment.open
    ? null
    : moment.review > 0
      ? "review"
      : moment.door > 0
        ? "guests"
        : null;

/**
 * HER ROOMS, ONE QUIET LINE: each a word in the byline's own voice, its glyph
 * before it, no chrome of its own; the room that waits on her is lit as her
 * one white press, its count on it; another count that needs her keeps the
 * tally on its shoulder. Hers alone: a guest's page has none.
 */
function Rooms({ moment, className }: { moment: Moment; className?: string }) {
  const lead = waitingOn(moment);
  return (
    <nav
      aria-label="This event"
      data-ep-featured-rooms=""
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}
    >
      {ROOMS.map((r) => {
        const n = r.count(moment);
        if (r.id === lead)
          return (
            <Button
              key={r.id}
              type="button"
              size="sm"
              tabIndex={-1}
              data-ep-room={r.id}
              data-ep-waiting=""
              className="h-8 gap-1.5 px-3 text-sm"
            >
              {r.icon}
              {r.word}
              <span className="tabular-nums">{formatCount(n)}</span>
            </Button>
          );
        return (
          <button
            key={r.id}
            type="button"
            tabIndex={-1}
            data-ep-room={r.id}
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground [&>svg]:size-4"
          >
            {r.icon}
            {r.word}
            {n ? <Tally n={n} /> : null}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * HER CODE, ONCE THE PHOTOGRAPHS HAVE THE WINDOW: the Invite's place in the
 * dock's order, its glyph the code and its words its views (the views ride
 * the code, said nowhere else), one press opening the code card.
 */
function CodePress({ views, desk }: { views: number; desk: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="cta"
      tabIndex={-1}
      data-ep-featured-code="press"
      aria-label={`Show your code, seen ${formatCount(views)} times`}
      className={cn("shrink-0 tabular-nums", desk ? undefined : "px-4")}
    >
      <QrCode />
      {formatCount(views)} views
    </Button>
  );
}

/**
 * Her acts, the guest's row in the dock's order with her words: before the
 * first photo Invite guests then Add photos (Invite white until anyone has
 * her code, then Add); at the party her code, Add photos, the reel; once
 * kept her code and Watch the party. While something waits on her, or Close
 * adding is offered, Add photos steps back to the outline.
 */
function HostActs({
  moment,
  desk,
  offer = false,
}: {
  moment: Moment;
  desk: boolean;
  offer?: boolean;
}) {
  const grow = desk ? undefined : "min-w-0 flex-1";
  if (!moment.open)
    return (
      <>
        <CodePress views={moment.views} desk={desk} />
        <WatchButton on="page" className={grow} />
      </>
    );
  if (moment.album === 0) {
    const fresh = moment.views === 0;
    return fresh ? (
      <>
        <AddButton
          on="page"
          label="Invite guests"
          icon={false}
          className={grow}
        />
        <SoftAct on="page" icon={<ImageUp />}>
          Add photos
        </SoftAct>
      </>
    ) : (
      <>
        <SoftAct on="page">Invite guests</SoftAct>
        <AddButton on="page" className={grow} />
      </>
    );
  }
  const quiet = offer || waitingOn(moment) !== null;
  return (
    <>
      <CodePress views={moment.views} desk={desk} />
      {quiet ? (
        <SoftAct
          on="page"
          icon={desk ? <ImageUp /> : undefined}
          className={grow}
        >
          Add photos
        </SoftAct>
      ) : (
        <AddButton on="page" icon={desk} className={grow} />
      )}
      <Round act="reel" on="page" />
    </>
  );
}

/**
 * THE WINDOW HOLDING HER CODE (before the first photograph): production's
 * code door on its mat, standing in the party's seed light as Create's close
 * stood it, at a desk and a phone alike, so the code Create flies over (by its
 * view-transition name) lands where it already stands lit; its views ride it
 * from the first guest who opens it.
 */
function CodeWindow({ moment, desk }: { moment: Moment; desk: boolean }) {
  return (
    <>
      <span className="inline-flex" style={desk ? { zoom: 1.3 } : undefined}>
        <Code moment={moment} />
      </span>
      {moment.views > 0 ? (
        <span className="text-sm text-foreground/75 tabular-nums">
          {formatCount(moment.views)} views
        </span>
      ) : null}
    </>
  );
}

function HostPage({ screen, moment, arrival, offer }: HostPageProps) {
  const desk = screen === "1440";
  const face = faceOf(moment);
  const words = (
    <>
      {desk ? (
        // At a desk her rooms stand on the page's right line, beside her name, as the album's Select and View do
        // beside its count: hers, and out of the acts' row.
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3">
          <Name className="min-w-0 text-chapter" />
          <Rooms moment={moment} />
        </div>
      ) : (
        <Name className="text-chapter" />
      )}
      <Meta moment={moment} side="host" desk={desk} className="mt-3" />
      <NoteLine
        moment={moment}
        side="host"
        desk={desk}
        arrival={arrival}
        className={desk ? "mt-4" : "mt-3"}
      />
      {offer ? <Offer on="page" className={desk ? "mt-5" : "mt-4"} /> : null}
      <div className={cn("flex items-center gap-2", desk ? "mt-6" : "mt-5")}>
        <HostActs moment={moment} desk={desk} offer={offer} />
      </div>
      {desk ? null : <Rooms moment={moment} className="mt-4" />}
    </>
  );
  return (
    <HostProviders>
      <div
        data-ep-page="host"
        className="relative min-h-screen bg-background pb-16 text-foreground"
      >
        <AppBar screen={screen} />
        <Head
          screen={screen}
          words={words}
          card={(className) => (
            <Featured face={face} className={className}>
              {face === "window" ? (
                <CodeWindow moment={moment} desk={desk} />
              ) : null}
            </Featured>
          )}
        />
        <Album screen={screen} moment={moment} host />
      </div>
    </HostProviders>
  );
}

/* ── the one moment: the card becomes the reel's poster ─────────────────── */

/**
 * THE ONE MOMENT: the featured card become the reel's poster and set on the
 * page's stage (its opening still, its play mark, as large as the screen
 * gives it), the reward said under it, centred as a premiere is, the album
 * held back until "Go to the album". Shown once; then the page as before, its
 * card still the poster.
 */
function Premiere({
  screen,
  ground,
  moment,
  side,
}: PageProps & { side: Side }) {
  const desk = screen === "1440";
  const page = (
    <div
      data-ep-premiere="featured"
      className="relative min-h-screen bg-background text-foreground"
    >
      {side === "host" ? <AppBar screen={screen} /> : <GuestBar over={false} />}
      <div
        className={cn(
          "flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center",
          desk ? "gap-9 px-5 pb-8" : "gap-7 px-3 pb-10",
        )}
      >
        <Featured
          face="poster"
          className={
            desk ? "aspect-video w-[min(800px,100%)]" : "aspect-[4/3] w-full"
          }
          play={desk ? 72 : 60}
        />
        <div
          className={cn(
            "flex flex-col items-center",
            desk ? "gap-7" : "gap-6 px-2",
          )}
        >
          <PremiereWords side={side} moment={moment} />
          <PremiereActs side={side} on="page" />
        </div>
      </div>
      <span hidden data-ep-ground-of={ground} />
    </div>
  );
  return side === "host" ? <HostProviders>{page}</HostProviders> : page;
}

/* ── its reach ──────────────────────────────────────────────────────────── */

/**
 * THE CARD, THE FEATURED CARD IN SMALL (1200 by 630): full bleed, the reel's
 * opening photograph for an open album with photographs (falling to the
 * room's black at its foot, so the name stands in the dark, never on a busy
 * patch) or the horizon of its seed's light before them (the card Create
 * shows her, the evening she makes it); and one mark over its foot, the name
 * as large as the card allows. A Private album's carries no photograph and no
 * read of one: its link's light and the house's wordmark, nothing else. At
 * 68 px it reads by its light and its mark; the title beside it says the name.
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
  const photo = open && moment.album > 0 ? album.cover[0]! : null;
  const light = useMemo(
    () => (open ? seedLight(album.seed) : linkLight(PRIVATE_LINK)),
    [open, album.seed],
  );
  return (
    <div
      data-ep-card={variant}
      className="dark relative size-full overflow-hidden bg-[#0b0b0c] text-foreground"
    >
      {photo ? (
        <>
          <Cover still={photo} />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgb(11 11 12 / 0) 16%, rgb(11 11 12 / 0.46) 42%, rgb(11 11 12 / 0.84) 70%, rgb(11 11 12 / 0.94) 100%)",
            }}
          />
        </>
      ) : (
        <Horizon light={light} core={1.5} reach={94} grain={false} />
      )}
      <div className="absolute inset-x-[64px] bottom-[60px] flex">
        {open ? (
          <p
            className="font-heading tracking-[-0.04em] text-balance"
            style={{ fontSize: cardType(album.name), lineHeight: 0.96 }}
          >
            {album.name}
          </p>
        ) : (
          <Logo className="h-[124px]" />
        )}
      </div>
    </div>
  );
}

/** The name as large as the card allows: two lines for most, three for a long one. */
const cardType = (name: string) =>
  name.length <= 14 ? 172 : name.length <= 24 ? 148 : 120;

/** A tile: its photograph; before its first, the window: its seed's horizon, its day standing in it. */
function Tile({ event }: { event: OtherEvent }) {
  const light = useMemo(() => seedLight(event.seed), [event.seed]);
  return (
    <TileBox className={event.cover ? "" : "dark bg-card"}>
      {event.cover ? (
        <Cover still={event.cover} />
      ) : (
        <>
          <Horizon light={light} core={1.25} reach={92} grain={false} />
          <DayFace event={event} />
        </>
      )}
    </TileBox>
  );
}

/**
 * THE SHEET'S LIVE BOX: the sheet is anchored to the frame's foot and grows
 * upward as its body settles, after the shared reader's last look (measured
 * on this frame: the shared box stood at 542 px while the sheet's edge stood
 * at 512, so the light painted a band on the sheet itself). So the light reads
 * the sheet on every change of its size and on a few late timers, finding the
 * sheet afresh each time (the panel's node can be replaced as it portals).
 */
function useLiveSheet(first: DOMRect) {
  const [box, setBox] = useState<DOMRect>(first);
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  useEffect(() => {
    const doc = el?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    let seen: HTMLElement | null = null;
    const watch = new win.ResizeObserver(() => read());
    const read = () => {
      const sheet = doc.querySelector<HTMLElement>("[data-entry-sheet]");
      if (!sheet) return;
      if (sheet !== seen) {
        if (seen) watch.unobserve(seen);
        watch.observe(sheet);
        seen = sheet;
      }
      setBox(sheet.getBoundingClientRect());
    };
    read();
    const timers = [120, 400, 900, 1600, 2600, 4000].map((ms) =>
      win.setTimeout(read, ms),
    );
    return () => {
      watch.disconnect();
      timers.forEach((t) => win.clearTimeout(t));
    };
  }, [el]);
  return { box, ref: setEl };
}

/**
 * THE DOOR'S ONE LIGHT (signature r1's `door=seam`): the album's key rising
 * from the sheet's free edge into the album behind, in a breath of dark of its
 * own (the scrim deepened along the edge, so on paper too the light lives in
 * a piece of the room). Drawn as the sheet's own outer glow, so it keeps the
 * sheet's corners (his craft note) and fades on its own; outside the sheet's
 * box only, so nothing lands on the sheet or its words.
 */
function SheetLight({ first }: { first: DOMRect }) {
  const { box, ref } = useLiveSheet(first);
  const key = useAlbumKey();
  const lit = lampColor(key[1] ?? key[0]!, "seam");
  const deep = lampColor(key[2] ?? key[0]!, "seam");
  const corner = "calc(var(--radius-float) * 1.25)";
  return (
    <span
      ref={ref}
      aria-hidden
      data-ep-featured-door=""
      className="pointer-events-none fixed z-[51] block"
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        borderTopLeftRadius: corner,
        borderTopRightRadius: corner,
        boxShadow: [
          `0 -1px 8px -3px ${alpha(lit, 85)}`,
          `0 -22px 44px -20px ${alpha(lit, 72)}`,
          `0 -44px 70px -38px ${alpha(deep, 50)}`,
          `0 -36px 60px -24px rgb(0 0 0 / 0.38)`,
        ].join(", "),
      }}
    />
  );
}

/** The door: the album's key rising from the sheet's top edge into the album behind. */
function Door({ ground }: { ground: Ground }) {
  return (
    <DoorOver
      page={<GuestPage screen="375" ground={ground} moment={NIGHT} />}
      light={(box) => <SheetLight first={box} />}
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

export const FEATURED: Kit = {
  id: "featured",
  GuestPage,
  HostPage,
  Premiere,
  Card,
  Tile,
  Door,
  Add,
};
