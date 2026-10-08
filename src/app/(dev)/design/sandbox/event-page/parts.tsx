"use client";

import {
  Bell,
  Download,
  Flag,
  ImageUp,
  ListChecks,
  MessageSquareHeart,
  Play,
  QrCode,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Users,
} from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";

import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { Logo } from "@/components/shared/logo";
import { GuestList, type GuestListItem } from "@/components/social/guest-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shutter } from "@/components/ui/shutter";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import {
  layoutRows,
  perRowFor,
  pickFeatures,
  type RowItem,
} from "@/lib/shared/album-rows";
import { cn, formatEventDate } from "@/lib/utils";

import { useAlbum, useAlbumKey } from "./album";
import { type Light, type Moment, PARTY, PRIYA, type Still } from "./fixtures";
import type { Ground, Screen } from "./knobs";
import { conicOf, huesOf, lampColor, Puck } from "./light";

/**
 * THE PAGE'S PARTS, ONE OF EACH, every whole design composing them its own
 * way: the bars, the byline, the faces, the acts, the album's head and rows,
 * its empty state, its Guests, the foot's Add, the host's code and her rooms.
 * Each is production's atom (`Button`, `Avatar`, `Badge`, `Shutter`,
 * `EventCodeDoor`, `GuestList`, the album's own row engine) in the slot a
 * design gives it; what a design changes is where it stands and what it
 * stands on, so two designs differ where their composition does.
 *
 * ★ EACH FACT SAID ONCE (presence r1's note, every new design): the guests
 * are the faces row's count, the album's size is the album's own head, the
 * views ride the host's code, the date is the byline's. Today's frames keep
 * today's repeats, drawn as built (`today.tsx`).
 *
 * ★ STAND-INS, SAID ONCE: the stills are the marketing photographs, the faces
 * fixtures, the counts the board's (`fixtures.ts`), and every press is inert.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/* ── the bars ───────────────────────────────────────────────────────────── */

/** The guest's corner, signed out: the quiet Start for free; or Priya's own name, a guest the device knows. */
export function GuestCorner({ known = true }: { known?: boolean }) {
  return known ? (
    <span className="flex items-center gap-2 text-sm">
      <Avatar size="sm" seed={PRIYA.seed}>
        <AvatarFallback className="text-[10px]">P</AvatarFallback>
      </Avatar>
      {PRIYA.name}
    </span>
  ) : (
    <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
      Start for free
    </Button>
  );
}

/**
 * THE GUEST'S HEADER: the wordmark and its corner. `over` stands it on the
 * head's room (no line, no ground of its own: nothing cuts the head); else it
 * is the page's own bar.
 */
export function GuestBar({
  over = true,
  known = true,
}: {
  over?: boolean;
  known?: boolean;
}) {
  return (
    <header
      data-ep-bar="guest"
      className={cn(
        "relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 px-5 text-foreground",
        over ? "dark bg-transparent" : "bg-background",
      )}
    >
      <Logo />
      <div className="flex h-8 items-center">
        <GuestCorner known={known} />
      </div>
    </header>
  );
}

/** The app's bar over the hub: the wordmark, the crumbs, an optional slot of hers, the bell and her face. */
export function AppBar({
  over = false,
  tools,
  screen,
}: {
  /** Stood on the head's room rather than the page's own bar. */
  over?: boolean;
  /** Her event's rooms, where a design puts them in the bar. */
  tools?: ReactNode;
  screen: Screen;
}) {
  const album = useAlbum();
  return (
    <header
      data-ep-bar="app"
      className={cn(
        "relative z-30 flex h-14 items-center gap-4 px-5",
        over ? "dark bg-transparent text-foreground" : "bg-background",
        !over && "border-b border-border",
      )}
    >
      <Logo />
      {screen === "1440" ? (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Partyreel</span>
          <span aria-hidden>/</span>
          <span className="font-medium text-foreground">
            <AlbumName />
          </span>
        </span>
      ) : null}
      <span className="ml-auto flex items-center gap-3">
        {tools}
        <Bell className="size-5 text-muted-foreground" aria-hidden />
        <Avatar size="sm" seed={album.host.seed}>
          <AvatarFallback className="text-[10px]">
            {album.host.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </span>
    </header>
  );
}

/* ── the head's words ───────────────────────────────────────────────────── */

/** The album's one name, as words (a crumb, a line). */
export function AlbumName() {
  return <>{useAlbum().name}</>;
}

/**
 * The event's name, the page's h1, at the step a design gives it: its one
 * name on both sides (production prints `events.name`; there is no short one).
 */
export function Name({ className }: { className?: string }) {
  const album = useAlbum();
  return (
    <h1
      data-ep-name=""
      className={cn("font-heading text-balance text-foreground", className)}
    >
      {album.name}
    </h1>
  );
}

/** Who hosts it and when: her face, her name, the day. */
export function Byline({
  host = true,
  className,
}: {
  /** Her face and name (a guest's byline); the hub drops them, the page being hers. */
  host?: boolean;
  className?: string;
}) {
  const album = useAlbum();
  return (
    <p
      data-ep-byline=""
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground",
        className,
      )}
    >
      {host ? (
        <>
          <span className="flex items-center gap-2">
            <Avatar seed={album.host.seed} size="sm">
              <AvatarFallback>{album.host.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {album.host.name}
            </span>
          </span>
          <span aria-hidden className="opacity-60">
            ·
          </span>
        </>
      ) : null}
      {album.date ? (
        <span>
          <RangeText text={formatEventDate(album.date, null)} />
        </span>
      ) : null}
    </p>
  );
}

/** The host's welcome note: two lines at a phone, three at a desk. */
export function Note({ className }: { className?: string }) {
  const album = useAlbum();
  return (
    <p
      data-ep-note=""
      className={cn(
        "line-clamp-2 max-w-xl text-working text-pretty text-muted-foreground md:line-clamp-3",
        className,
      )}
    >
      {album.note}
    </p>
  );
}

/* ── the faces ──────────────────────────────────────────────────────────── */

/**
 * THE GUEST ROW (presence r1: `colour=wheel`, `album=cover`, `hover=comb`,
 * `hub=line`): her party's faces, newest first, each over the next, the
 * newest in a fine ring of the album's light, then the one count of guests in
 * the line's own voice. A pointer lifts the face under it (the comb). Before
 * anyone has added, nothing stands here (presence's carried `empty`), unless
 * a design asks for a quiet line in its place (`empty`).
 */
export function Faces({
  moment,
  size = 28,
  shown = 6,
  align = "start",
  empty,
  className,
}: {
  moment: Moment;
  size?: number;
  shown?: number;
  align?: "start" | "center";
  /** What stands in the row's place before the first guest: nothing where absent. */
  empty?: ReactNode;
  className?: string;
}) {
  const key = useAlbumKey();
  if (moment.guests === 0)
    return empty ? (
      <div
        data-ep-faces="empty"
        className={cn(
          "flex text-sm text-muted-foreground",
          align === "center" && "justify-center",
          className,
        )}
      >
        {empty}
      </div>
    ) : null;
  const n = Math.min(shown, moment.guests, PARTY.length);
  const ring = conicOf(key, "room");
  const vars: Vars = {
    "--ep-face": `${size}px`,
    "--ep-face-ring": ring,
  };
  return (
    <div
      data-ep-faces={moment.guests}
      className={cn(
        "flex items-center gap-2.5",
        align === "center" && "justify-center",
        className,
      )}
      style={vars}
    >
      <span
        className="ep-faces"
        role="img"
        aria-label={`${PARTY[0]!.name} added last, and ${formatCount(moment.guests - 1)} others`}
      >
        {PARTY.slice(0, n).map((p, i) => (
          <span
            key={p.seed}
            className="ep-face"
            data-newest={i === 0 ? "" : undefined}
            style={{ zIndex: n - i }}
          >
            <Avatar seed={p.seed} className="ep-face-avatar">
              <AvatarFallback
                style={{ fontSize: Math.round(size * 0.4) }}
                className="font-medium"
              >
                {p.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </span>
        ))}
      </span>
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatCount(moment.guests)} {moment.guests === 1 ? "guest" : "guests"}
      </span>
    </div>
  );
}

/* ── the acts ───────────────────────────────────────────────────────────── */

/** The white Add (the head's one primary act), on the room or on the page. */
export function AddButton({
  label = "Add photos",
  on = "room",
  icon = true,
  className,
}: {
  label?: string;
  /** On the room (white, `on-photo`) or on the page's own ground (ink). */
  on?: "room" | "page";
  icon?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={on === "room" ? "on-photo" : "default"}
      size="cta"
      tabIndex={-1}
      data-ep-act="add"
      className={className}
    >
      {icon ? <ImageUp /> : null}
      {label}
    </Button>
  );
}

const ROUND = {
  reel: {
    label: "Watch the highlight reel",
    icon: <Play className="fill-current" />,
  },
  invite: { label: "Invite", icon: <QrCode /> },
  home: { label: "Take them home", icon: <Download /> },
} as const;

/** A round act beside the Add: the reel, Invite (the code), or Take them home (a keepsake's). */
export function Round({
  act,
  on = "room",
  label,
}: {
  act: keyof typeof ROUND;
  on?: "room" | "page";
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant={on === "room" ? "glass" : "outline"}
      size="icon-cta"
      tabIndex={-1}
      data-ep-act={act}
      aria-label={label ?? ROUND[act].label}
    >
      {ROUND[act].icon}
    </Button>
  );
}

/** The keepsake's lead (after-party's `keepsake=reel`): the reel from its first photo, on the head's own white. */
export function WatchButton({
  on = "room",
  className,
}: {
  on?: "room" | "page";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={on === "room" ? "on-photo" : "default"}
      size="cta"
      tabIndex={-1}
      data-ep-act="watch"
      className={className}
    >
      <Play className="fill-current" /> Watch the party
    </Button>
  );
}

/** A labelled secondary act (the keepsake's Take them home, the host's Invite guests). */
export function SoftAct({
  children,
  icon,
  on = "room",
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  on?: "room" | "page";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={on === "room" ? "glass" : "outline"}
      size="cta"
      tabIndex={-1}
      className={className}
    >
      {icon}
      {children}
    </Button>
  );
}

/* ── the host's own ─────────────────────────────────────────────────────── */

/** Her code on its mat (production's `EventCodeDoor`), the door to every share; dims where guests cannot add. */
export function Code({
  moment,
  className,
}: {
  moment: Moment;
  className?: string;
}) {
  const album = useAlbum();
  return (
    <span className={cn("inline-flex shrink-0", className)} data-ep-code="">
      <EventCodeDoor
        eventName={album.name}
        joinUrl={album.permanent}
        qrStyle="classic"
        door="open"
        acceptingUploads={moment.open}
        waiting={0}
      />
    </span>
  );
}

/** The share world the host's parts stand in (the code card's provider and the album's Add). */
export function HostProviders({ children }: { children: ReactNode }) {
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>{children}</HostAddProvider>
    </EventShareProvider>
  );
}

/**
 * A STATUS POINT AND ITS WORD, in the camera's voice (Badge), from the status
 * set brand-marks r1 settled: Live, the one red that breathes, only while
 * photos are landing now (the strip's quarter hour), never merely because the
 * album is open; Ready's green for a new album and for an open one gone quiet;
 * Standby, half-lit with no hue, once she has closed adding.
 */
export function Status({ moment }: { moment: Moment }) {
  if (!moment.open)
    return (
      <Badge variant="secondary" data-ep-status="closed">
        Closed to adding
      </Badge>
    );
  if (moment.landing)
    return (
      <Badge variant="live" data-ep-status="live">
        Live
      </Badge>
    );
  if (moment.album === 0)
    return (
      <Badge variant="success" data-ep-status="ready">
        Ready for guests
      </Badge>
    );
  return (
    <Badge variant="success" data-ep-status="open">
      Open
    </Badge>
  );
}

/** A count that needs her: the tally's red, hard-edged (`--needs-you`), never a glow. */
export function Tally({ n }: { n: number }) {
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-(--needs-you) px-1 text-[10px] font-semibold text-(--needs-you-foreground) tabular-nums">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export type RoomId = "review" | "guests" | "settings" | "as-guest";

const ROOM: Record<
  RoomId,
  { word: string; icon: ReactNode; count: (m: Moment) => number }
> = {
  review: { word: "Review", icon: <ListChecks />, count: (m) => m.review },
  guests: { word: "Guests", icon: <Users />, count: (m) => m.door },
  settings: { word: "Settings", icon: <Settings />, count: () => 0 },
  "as-guest": { word: "As a guest", icon: <Smartphone />, count: () => 0 },
};

/**
 * HER ROOMS, QUIET: each a press into its room, the tally on its shoulder only
 * where a count needs her (Review's waiting uploads, the people at her door);
 * the guests' own count is the faces row's, never said again here.
 */
export function Rooms({
  moment,
  rooms = ["review", "guests", "settings"],
  form = "pill",
  on = "room",
  className,
}: {
  moment: Moment;
  rooms?: readonly RoomId[];
  /** A pill with its word, a glyph alone (a bar's), or a row of a list (a column's). */
  form?: "pill" | "glyph" | "row";
  on?: "room" | "page";
  className?: string;
}) {
  return (
    <nav
      aria-label="This event"
      data-ep-rooms={form}
      className={cn(
        form === "row"
          ? "flex flex-col"
          : "flex flex-wrap items-center gap-1.5",
        className,
      )}
    >
      {rooms.map((id) => {
        const r = ROOM[id];
        const n = r.count(moment);
        if (form === "glyph")
          return (
            <span
              key={id}
              aria-label={n ? `${r.word}: ${n} waiting` : r.word}
              className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground [&>svg]:size-[18px]"
            >
              {r.icon}
              {n ? (
                <span className="absolute -top-0.5 -right-0.5">
                  <Tally n={n} />
                </span>
              ) : null}
            </span>
          );
        if (form === "row")
          return (
            <span
              key={id}
              className="flex h-10 items-center gap-3 border-t border-foreground/10 text-sm text-foreground first:border-t-0 [&>svg]:size-4 [&>svg]:text-muted-foreground"
            >
              {r.icon}
              <span className="flex-1">{r.word}</span>
              {n ? <Tally n={n} /> : null}
            </span>
          );
        return (
          <Button
            key={id}
            type="button"
            variant={on === "room" ? "glass" : "outline"}
            size="sm"
            tabIndex={-1}
            data-ep-room={id}
            className="gap-1.5"
          >
            {r.icon}
            {r.word}
            {n ? <Tally n={n} /> : null}
          </Button>
        );
      })}
    </nav>
  );
}

/* ── the guestbook's door ───────────────────────────────────────────────── */

/**
 * THE GUESTBOOK'S DOOR (Will's X12, 2026-10-07: a short note, a voice memo or a
 * video message to the hosts, moderated like any upload, never a caption or a
 * comment on a photograph; "very natural, and likely a more underlying
 * feature"; its own board designs it later). Here only its door, under the
 * surface, in each design's own place: a guest's quiet way to leave one, and
 * the host's quiet way to read them (a count of hers, never a tally: nothing
 * there waits on her).
 */
export function Guestbook({
  side = "guest",
  form = "line",
  on = "room",
  notes = 12,
  short = false,
  className,
}: {
  side?: "guest" | "host";
  /** A quiet line of words, a glass round, or a row of a list (a sheet's, a column's). */
  form?: "line" | "round" | "row";
  on?: "room" | "page";
  /** The notes left so far, the host's count. */
  notes?: number;
  /** Its short words, for a line beside the faces' own count ("38 guests · 12 notes", never "guests" twice). */
  short?: boolean;
  className?: string;
}) {
  const album = useAlbum();
  const words =
    side === "guest"
      ? short
        ? "Leave a note"
        : `Leave ${album.host.name} a note`
      : short
        ? `${formatCount(notes)} notes`
        : `${formatCount(notes)} notes from guests`;
  if (form === "round")
    return (
      <Button
        type="button"
        variant={on === "room" ? "glass" : "outline"}
        size="icon-cta"
        tabIndex={-1}
        data-ep-guestbook={side}
        aria-label={words}
        className={className}
      >
        <MessageSquareHeart />
      </Button>
    );
  if (form === "row")
    return (
      <span
        data-ep-guestbook={side}
        className={cn(
          "flex h-10 items-center gap-3 text-sm text-foreground [&>svg]:size-4 [&>svg]:text-muted-foreground",
          className,
        )}
      >
        <MessageSquareHeart />
        <span className="flex-1">{words}</span>
      </span>
    );
  return (
    <button
      type="button"
      tabIndex={-1}
      data-ep-guestbook={side}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline [&>svg]:size-4",
        className,
      )}
    >
      <MessageSquareHeart />
      {words}
    </button>
  );
}

/* ── the album ──────────────────────────────────────────────────────────── */

/** The album's box: the window less its gutter (`px-3 sm:px-5`), and the gallery's gap. */
export const albumWidth = (frame: number) => frame - (frame >= 640 ? 40 : 24);
const GAP = 3;
/** One seed for the rhythm's picks: the same features every draw. */
const RHYTHM_SEED = 7;

type Tile = { key: string; still: Still };

const tilesOf = (stills: readonly Still[], repeat = 6): Tile[] =>
  [...stills, ...stills.slice(0, repeat)].map((s, i) => ({
    key: `${s.id}-${i}`,
    still: s,
  }));

export type Placed = { tile: Tile; x: number; y: number; w: number; h: number };

/** Production's justified rows for these tiles, newest first, at this width. */
export function planRows(stills: readonly Still[], width: number, repeat = 6) {
  const tiles = tilesOf(stills, repeat);
  const perRow = perRowFor(width, 1);
  const base = tiles.map((t) => ({ id: t.key, ratio: t.still.ratio }));
  const features = pickFeatures(base, RHYTHM_SEED, perRow);
  const items: RowItem[] = base.map((it) =>
    features.has(it.id) ? { ...it, feature: true } : it,
  );
  const layout = layoutRows(items, {
    width,
    gap: GAP,
    perRow,
    anchor: "end",
    feature: "double",
  });
  const byKey = new Map(tiles.map((t) => [t.key, t]));
  const placed: Placed[] = [];
  let y = 0;
  for (const row of layout.rows) {
    let x = 0;
    row.ids.forEach((id, k) => {
      const w = row.widths[k]!;
      placed.push({ tile: byKey.get(id)!, x, y, w, h: row.height });
      x += w + GAP;
    });
    y += row.height + GAP;
  }
  return { placed, height: Math.max(0, y - GAP) };
}

/** The rows: each tile the album tile's box, a photograph covering its place. */
export function Rows({
  width,
  stills,
  repeat = 6,
}: {
  width: number;
  /** The photographs, newest first: the frame's album's where absent. */
  stills?: readonly Still[];
  repeat?: number;
}) {
  const album = useAlbum();
  const { placed, height } = planRows(stills ?? album.stills, width, repeat);
  return (
    <div className="relative" style={{ height }} data-ep-rows="">
      {placed.map((p, i) => (
        <div
          key={p.tile.key}
          data-ep-tile={i === 0 ? "first" : ""}
          className="absolute overflow-hidden rounded-tile bg-black/10"
          style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the album draws one */}
          <img
            src={p.tile.still.src}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: p.tile.still.focus }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * THE ALBUM'S HEAD: its one count (said here and nowhere else on a new
 * design's page), Select and View; the host's Download beside them.
 */
export function AlbumHead({
  moment,
  host = false,
  compact = false,
  lead,
  className,
}: {
  moment: Moment;
  host?: boolean;
  /** At a phone: the host's Download folds into Select, so the head keeps one line. */
  compact?: boolean;
  /** A slot after the count. */
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-ep-album-head=""
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2.5">
        <p className="px-0.5 text-working text-muted-foreground tabular-nums">
          {formatMediaCount(moment.album)}
        </p>
        {lead}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <ListChecks className="size-4" /> Select
        </span>
        {host && !compact ? (
          <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
            <Download className="size-4" /> Download
          </span>
        ) : null}
        <Button type="button" variant="outline" size="sm" tabIndex={-1}>
          <SlidersHorizontal /> View
        </Button>
      </div>
    </div>
  );
}

/**
 * THE EMPTY ALBUM (production's voice, `GalleryEmptyState`): its ghost river
 * and "The album starts with you"; a guest's own invitation to add, a host's
 * line that her guests' photos land here.
 */
export function EmptyAlbum({
  side,
  line,
  cta = true,
}: {
  side: "guest" | "host";
  /** Words of a design's own in place of production's. */
  line?: string;
  /** Its own Add the first photo (production's), dropped where the head already asks. */
  cta?: boolean;
}) {
  return (
    <div data-ep-empty="" className="relative mx-auto w-full max-w-2xl">
      <GhostRiver />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-heading text-subsection text-balance">
          {line ??
            (side === "guest"
              ? "The album starts with you"
              : "Your guests' photos land here")}
        </p>
        {side === "guest" && cta ? (
          <Button type="button" size="lg" tabIndex={-1}>
            Add the first photo
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** The Guests section at the album's end, as the page composes it: production's `GuestList`. */
export function GuestsSection({ guests }: { guests: number }) {
  if (guests === 0) return null;
  const people = Array.from({ length: guests }, (_, i) => {
    const base = PARTY[i % PARTY.length]!;
    return i < PARTY.length
      ? base
      : {
          name: `${base.name} ${String.fromCharCode(65 + (i % 26))}.`,
          seed: `${base.seed}-${i}`,
        };
  });
  const items: GuestListItem[] = [...people]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p, i) =>
      i % 3 === 2
        ? {
            kind: "unverified",
            id: `row-${p.seed}`,
            displayName: p.name,
            seed: p.seed,
          }
        : {
            id: `user-${p.seed}`,
            displayName: p.name,
            slug: null,
            avatarMarker: null,
            avatarUrl: null,
            seed: p.seed,
          },
    );
  return (
    <section aria-label="Guests" className="mt-10 space-y-3">
      <h2 className="text-label font-semibold text-muted-foreground uppercase">
        Guests
      </h2>
      <GuestList items={items} />
    </section>
  );
}

/** The report line at the page's foot, as built. */
export function Report() {
  return (
    <footer className="mx-3 mt-8 flex justify-center border-t border-border/60 pt-5 sm:mx-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        tabIndex={-1}
        className="text-muted-foreground"
      >
        <Flag /> Report
      </Button>
    </footer>
  );
}

/* ── the Add at the foot: the Ring ──────────────────────────────────────── */

/** How the Ring stands: at rest (still, low), lit as her photo lands (the envelope at its height), or unlit. */
export type RingBeat = "rest" | "lands" | "unlit";

/**
 * APERTURE'S RING (signature r1's `add=answer`): production's shutter in the
 * album's one key light at three depths, lit from the top-left, resting low
 * and still; as each of her photos lands, a halo lifts round it at once and
 * settles over two seconds (drawn here at its height). On paper the light
 * keeps its dark, in the puck.
 */
export function Ring({
  beat = "rest",
  ground,
  light,
  count = 0,
}: {
  beat?: RingBeat;
  ground: Ground;
  light?: Light;
  /** Her files still on their way (the shoulder). */
  count?: number;
}) {
  const key = useAlbumKey();
  const lit = light ?? key;
  const lift = beat === "lands" ? 1 : 0;
  const vars: Vars = {
    "--ep-key-conic": conicOf(lit, "room"),
    "--ep-halo": lampColor(lit[1] ?? lit[0]!, "room"),
    "--ep-lift": lift,
  };
  const shutter = (
    <Shutter
      state={count > 0 ? "sending" : "idle"}
      progress={count > 0 ? 0.6 : 0}
      count={count}
      hues={huesOf(lit)}
      tabIndex={-1}
      aria-label="Add photos"
    />
  );
  return (
    <span
      data-ep-ring={beat === "unlit" ? "unlit" : "key"}
      data-ep-paper={ground === "paper" ? "" : undefined}
      className="relative inline-flex"
      style={vars}
    >
      {ground === "paper" ? <Puck size={64}>{shutter}</Puck> : shutter}
    </span>
  );
}

/** The dock's three: Invite, the Add (a design's own atom), the reel; the cluster alone, placed by its caller. */
export function DockCluster({ add }: { add?: ReactNode }) {
  return (
    <div className="relative flex items-center justify-center gap-5 pb-5">
      <Button
        type="button"
        variant="outline"
        size="icon-cta"
        tabIndex={-1}
        aria-label="Invite"
        className="bg-background shadow-layer"
      >
        <QrCode />
      </Button>
      {add}
      <Button
        type="button"
        variant="outline"
        size="icon-cta"
        tabIndex={-1}
        aria-label="Watch the highlight reel"
        className="bg-background shadow-layer"
      >
        <Play className="fill-current" />
      </Button>
    </div>
  );
}

/**
 * THE FOOT'S DOCK, as `guest-action-dock.tsx` draws it once the head's acts
 * have scrolled away: Invite, the Add (where the album takes photos), the
 * reel. The Add is the Ring above, or a design's own atom (`add`).
 */
export function Dock({
  ground,
  beat = "rest",
  add = true,
  count = 0,
  atom,
}: {
  ground: Ground;
  beat?: RingBeat;
  add?: boolean;
  count?: number;
  /** A design's own Add in the Ring's place. */
  atom?: ReactNode;
}) {
  return (
    <div
      data-ep-dock={add ? "add" : "look"}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent"
      />
      <DockCluster
        add={
          add
            ? (atom ?? <Ring beat={beat} ground={ground} count={count} />)
            : null
        }
      />
    </div>
  );
}

/* ── placing a frame in the page ────────────────────────────────────────── */

/** Where a frame stands in the page: its first screen, or scrolled into the album. */
export type Scroll = "top" | "album";

/**
 * Scrolls the frame's own window into the album (its head a little under the
 * frame's top), once the webfont and the page settle.
 */
export function useScrollInto(target: Scroll, offset = 52) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || target === "top") return;
    const go = () => {
      const head = el.querySelector<HTMLElement>("[data-ep-rows]");
      if (head)
        win.scrollTo(
          0,
          head.getBoundingClientRect().top + win.scrollY - offset,
        );
    };
    go();
    const t1 = win.setTimeout(go, 400);
    const t2 = win.setTimeout(go, 1200);
    return () => {
      win.clearTimeout(t1);
      win.clearTimeout(t2);
    };
  }, [target, offset]);
  return ref;
}

/** A frame's width in pixels. */
export const widthOf = (screen: Screen) => (screen === "1440" ? 1440 : 375);
