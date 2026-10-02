"use client";

import {
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  Clapperboard,
  Images,
  ListChecks,
  Play,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  roomCardSize,
  roomRowLayout,
} from "@/components/app/event-feed/room-card";
import { LivingStills, useLivingClock } from "@/components/app/living-stills";
import { HouseLight } from "@/components/guest/event-experience-head";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CodeChip } from "@/components/ui/code-chip";
import { doorLabel } from "@/lib/events/visibility-labels";
import { settingsReadiness, stepsLeft } from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  ALBUM,
  AT_THE_DOOR,
  COVER,
  EVENT,
  GUESTS,
  type HostFacts,
  REEL,
  REVIEW,
} from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE DOORS INTO HER ROOMS, THREE WAYS, AT REST AND FOLDED INTO THE BAND.
 *
 * The row is production's order (Will, `event-settings` `queue`: the reel,
 * Guests, Review, Settings, `EVENT_ROOMS`), with See it as a guest last, the
 * payoff at the row's end (the carried call `guest-door`). Where every room
 * opens under the band (`rooms=under`) the album is a door too, first, since
 * a room that swaps the album out needs a way back to it.
 *
 *  - `cards`, today's: production's own card shell (`room-card.ts`), the reel's
 *    living stills and its pips as `reel-card.tsx` draws them, quoted so a
 *    press opens what the board's rooms option says rather than the route;
 *  - `windows`: each door a picture of its room, on the cover's own house
 *    light where the room has no photograph (bible 6: colour from the
 *    photographs and from light);
 *  - `glass`: the doors on the cover's photograph in its material (`glass`),
 *    so no row stands under it.
 *
 * ★ THE BAND IS PRODUCTION'S IN EVERY OPTION (`event-cards-row.tsx`): sticky
 * under the bar, the cover's first photograph and the name at its lead, the
 * doors as pills, the code's chip closing it. A still frame says `stuck`
 * outright; a live one reads it off its own scroll (`useStuckIn`, in
 * `hub.tsx`), since an observer's root margin does not reach into a frame.
 *
 * ★ THE NEEDS-ACTION TONE IS THE ONE COLOUR (production's amber `warning`): a
 * count of people at the door or uploads in Review, and nothing else.
 */

export type DoorsId = "cards" | "windows" | "glass";

export type RoomId =
  | "album"
  | "reel"
  | "guests"
  | "review"
  | "settings"
  | "guest";

/** The rooms a door opens, in production's order, the guest's view last. */
export const ROOM_ORDER: readonly RoomId[] = [
  "reel",
  "guests",
  "review",
  "settings",
  "guest",
];

/** The row with the album as a door, where a room takes the album's place. */
export const UNDER_ORDER: readonly RoomId[] = ["album", ...ROOM_ORDER];

export const ROOM_LABEL: Record<RoomId, string> = {
  album: "Album",
  reel: "Highlight reel",
  guests: "Guests",
  review: "Review",
  settings: "Settings",
  guest: "See it as a guest",
};

/** The word a phone's door has room for. */
const SHORT: Record<RoomId, string> = {
  album: "Album",
  reel: "Reel",
  guests: "Guests",
  review: "Review",
  settings: "Settings",
  guest: "As a guest",
};

const ICON: Record<RoomId, LucideIcon> = {
  album: Images,
  reel: Clapperboard,
  guests: Users,
  review: ListChecks,
  settings: Settings,
  guest: Smartphone,
};

/** A door's face: its one line, and the count that needs her (the amber tone) or one to act on. */
export type DoorFace = {
  value: string;
  amber?: boolean;
  /** The needs-action count, drawn on the door as a badge. */
  count?: number;
  /** A count to act on, never waiting on her (Settings' steps left): the foreground, never amber. */
  strong?: boolean;
};

/** Every door's face, from the moment's facts: production's words (`page.tsx`, `room-card.ts`). */
export function facesOf(f: HostFacts): Record<RoomId, DoorFace> {
  // The hub's own count: what a guest still needs that Settings' steps hold (`page.tsx`).
  const left = stepsLeft(f.ready);
  return {
    album: { value: f.photos > 0 ? formatCount(f.photos) : "Empty" },
    reel:
      f.reel === "live"
        ? { value: "Live for guests" }
        : { value: `Starts at 2 photos` },
    guests:
      f.waiting > 0
        ? {
            value: `${formatCount(f.waiting)} waiting`,
            amber: true,
            count: f.waiting,
          }
        : { value: `${formatCount(f.guests)} guests` },
    review:
      f.review > 0
        ? {
            value: `${formatCount(f.review)} waiting`,
            amber: true,
            count: f.review,
          }
        : { value: "All caught up" },
    settings:
      left > 0
        ? { value: `${formatCount(left)} left`, strong: true }
        : { value: doorLabel(f.door) },
    guest: { value: "What they see" },
  };
}

export type DoorPress = (room: RoomId) => void;

/* ══ CARDS: today's shell ══════════════════════════════════════════════════ */

function CardDoor({
  room,
  face,
  f,
  stuck,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  f: HostFacts;
  stuck: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  const Icon = ICON[room];
  const living = room === "reel" && f.reel === "live" && !stuck;
  const counting = room === "reel" && f.reel !== "live";
  const { ref, at } = useLivingClock<HTMLButtonElement>(REEL.length);
  return (
    <button
      ref={ref}
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        ROOM_CARD_BASE,
        roomCardSize(stuck),
        "relative text-left",
        living
          ? "overflow-hidden border-transparent text-white"
          : counting && !stuck
            ? "border-dashed border-foreground/25 hover:border-foreground/40"
            : face.amber
              ? "border-warning/40 bg-warning/5 hover:border-warning/60"
              : ROOM_CARD_QUIET,
        selected && "ring-2 ring-foreground",
      )}
    >
      {living ? (
        <>
          <LivingStills stills={REEL} at={at} />
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30"
          />
        </>
      ) : null}
      <Icon
        className={cn(
          "relative size-4 shrink-0",
          living
            ? "text-white/85"
            : face.amber
              ? "text-warning"
              : "text-muted-foreground",
        )}
        aria-hidden
      />
      {stuck ? (
        <span className="relative text-xs font-medium">{SHORT[room]}</span>
      ) : (
        <span className="relative font-heading text-card-title">
          {room === "guest" ? "As a guest" : ROOM_LABEL[room]}
        </span>
      )}
      <span
        className={cn(
          "relative truncate text-xs tabular-nums",
          ROOM_CARD_VALUE,
          stuck && "hidden",
          living
            ? "text-white/85"
            : face.amber
              ? "font-medium text-warning"
              : face.strong
                ? "font-medium text-foreground"
                : "text-muted-foreground",
        )}
      >
        {face.value}
      </span>
      {stuck && face.count ? <StuckCount n={face.count} /> : null}
    </button>
  );
}

/** Stuck, the amber count is the only thing worth keeping (production's own pill badge). */
function StuckCount({ n }: { n: number }) {
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
      {n}
    </span>
  );
}

/* ══ WINDOWS: each door a picture of its room ══════════════════════════════ */

/**
 * Where a window's picture stands: a desk's door keeps its foot for the words
 * (the picture in its upper part, never under the label), a phone's square
 * door has its word outside and centres it, and a band's pill is one round.
 */
type WindowAt = "door" | "icon" | "pill";

/** A room with no photograph of its own stands on the cover's house light. */
function Lit({ at, children }: { at: WindowAt; children?: ReactNode }) {
  return (
    <span className="dark absolute inset-0 overflow-hidden bg-background">
      <HouseLight />
      <span
        className={cn(
          "absolute inset-x-0 top-0 flex items-center justify-center",
          at === "door" ? "h-[62%]" : "h-full",
        )}
      >
        {children}
      </span>
    </span>
  );
}

/** Four photographs, two by two, each a quarter of the window. */
function Mosaic({ srcs }: { srcs: readonly string[] }) {
  return (
    <span className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-black">
      {srcs.slice(0, 4).map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, drawn as the door's picture
        <img
          key={i}
          src={src}
          alt=""
          className="size-full min-h-0 object-cover"
        />
      ))}
    </span>
  );
}

/** One photograph, filling the window. */
function OneStill({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, drawn as the door's picture
    <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
  );
}

/** What each room looks like from its door. */
function WindowPicture({
  room,
  f,
  at,
}: {
  room: RoomId;
  f: HostFacts;
  at: WindowAt;
}) {
  const { ref, at: still } = useLivingClock<HTMLSpanElement>(REEL.length);
  const small = at !== "door";
  if (room === "album")
    return f.photos > 0 ? (
      at === "pill" ? (
        <OneStill src={ALBUM[0].src} />
      ) : (
        <Mosaic srcs={ALBUM.map((p) => p.src)} />
      )
    ) : (
      <Lit at={at}>
        <Images className="size-4 text-white/60" aria-hidden />
      </Lit>
    );
  if (room === "reel")
    return f.reel === "live" ? (
      <span ref={ref} className="absolute inset-0">
        <LivingStills stills={REEL} at={still} />
        {at === "pill" ? null : (
          <span
            className={cn(
              "absolute flex items-center justify-center rounded-full glass",
              at === "door"
                ? "top-2.5 left-2.5 size-7"
                : "inset-0 m-auto size-6",
            )}
          >
            <Play className="size-3 fill-current" aria-hidden />
          </span>
        )}
      </span>
    ) : (
      <Lit at={at}>
        <span className="flex items-center gap-1" aria-hidden>
          {[0, 1].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full",
                small ? "w-2.5" : "w-5",
                i < f.reelHave ? "bg-white" : "bg-white/30",
              )}
            />
          ))}
        </span>
      </Lit>
    );
  if (room === "guests") {
    const faces = f.waiting > 0 ? AT_THE_DOOR : f.guests > 0 ? GUESTS : [];
    if (at === "pill")
      return faces.length > 0 ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Avatar seed={faces[0].seed} size="sm">
            <AvatarFallback className="text-[10px]">
              {faces[0].name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </span>
      ) : (
        <Lit at={at}>
          <Users className="size-3.5 text-white/70" aria-hidden />
        </Lit>
      );
    return (
      <Lit at={at}>
        {faces.length === 0 ? (
          <Users className="size-5 text-white/60" aria-hidden />
        ) : (
          <span className="flex -space-x-2.5">
            {faces.slice(0, small ? 2 : 3).map((p) => (
              <Avatar
                key={p.name}
                seed={p.seed}
                size={small ? "default" : "lg"}
                className="ring-2 ring-black/50"
              >
                <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </span>
        )}
      </Lit>
    );
  }
  if (room === "review")
    return f.review > 0 ? (
      at === "pill" ? (
        <OneStill src={REVIEW[0].src} />
      ) : (
        <Mosaic srcs={REVIEW.map((r) => r.src)} />
      )
    ) : (
      <Lit at={at}>
        <Check className="size-5 text-white/70" aria-hidden />
      </Lit>
    );
  if (room === "settings") {
    // Settings' rail: the essentials a guest needs, each a segment, lit once ticked.
    const r = settingsReadiness(f.ready).needed;
    return (
      <Lit at={at}>
        <StepsRing
          done={r.done}
          total={r.of}
          size={at === "door" ? 44 : at === "icon" ? 32 : 22}
        />
      </Lit>
    );
  }
  // See it as a guest: her album as it stands in a guest's phone.
  if (at === "pill")
    return f.photos > 0 ? (
      <OneStill src={COVER[0].tile} />
    ) : (
      <Lit at={at}>
        <Smartphone className="size-3.5 text-white/70" aria-hidden />
      </Lit>
    );
  return (
    <Lit at={at}>
      <span
        className={cn(
          "relative overflow-hidden bg-black ring-1 ring-white/45",
          at === "door"
            ? "h-[58px] w-[30px] rounded-[7px]"
            : "h-[36px] w-[19px] rounded-[5px]",
        )}
      >
        {f.photos > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element -- the cover's own still, drawn small
          <img
            src={COVER[0].tile}
            alt=""
            className="absolute inset-x-0 top-0 h-3/5 w-full object-cover"
          />
        ) : (
          <span className="absolute inset-x-0 top-0 h-3/5 bg-white/15" />
        )}
        <span className="absolute inset-x-[18%] bottom-[14%] h-[9%] rounded-full bg-white" />
      </span>
    </Lit>
  );
}

/** Settings' five steps as a ring, a segment each, lit once ticked. */
function StepsRing({
  done,
  total,
  size,
}: {
  done: number;
  total: number;
  size: number;
}) {
  const small = size < 40;
  const r = 15;
  const gap = 0.16;
  return (
    <span className="relative flex items-center justify-center">
      <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden>
        {Array.from({ length: total }, (_, i) => {
          const a0 = (i / total) * Math.PI * 2 - Math.PI / 2 + gap;
          const a1 = ((i + 1) / total) * Math.PI * 2 - Math.PI / 2 - gap;
          const p = (a: number) =>
            `${(18 + Math.cos(a) * r).toFixed(2)} ${(18 + Math.sin(a) * r).toFixed(2)}`;
          return (
            <path
              key={i}
              d={`M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`}
              fill="none"
              strokeWidth={2.6}
              strokeLinecap="round"
              stroke={i < done ? "white" : "rgb(255 255 255 / 0.25)"}
            />
          );
        })}
      </svg>
      <Settings
        className={cn("absolute text-white/80", small ? "size-3" : "size-4")}
        aria-hidden
      />
    </span>
  );
}

/** The needs-action count on a window's corner. */
function WindowCount({ n, small }: { n: number; small: boolean }) {
  return (
    <span
      className={cn(
        "absolute z-10 flex items-center justify-center rounded-full bg-warning font-semibold text-warning-foreground tabular-nums shadow-layer",
        small
          ? "-top-1.5 -right-1.5 h-5 min-w-5 px-1 text-[11px]"
          : "top-2 right-2 h-6 min-w-6 px-1.5 text-xs",
      )}
    >
      {formatCount(n)}
    </span>
  );
}

function WindowDoor({
  room,
  face,
  f,
  small,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  f: HostFacts;
  small: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  if (small)
    return (
      <button
        type="button"
        data-eh-door={room}
        aria-pressed={selected || undefined}
        onClick={() => onOpen?.(room)}
        className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 outline-none"
      >
        <span
          className={cn(
            "relative aspect-square w-full max-w-[60px] rounded-[18px] transition-transform duration-150 ease-emphasis group-active:scale-[0.96]",
            selected &&
              "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
        >
          <span className="absolute inset-0 overflow-hidden rounded-[18px] ring-1 ring-black/5 dark:ring-white/10">
            <WindowPicture room={room} f={f} at="icon" />
          </span>
          {face.count ? <WindowCount n={face.count} small /> : null}
        </span>
        <span
          className={cn(
            "max-w-full truncate text-[11px] leading-none font-medium",
            face.strong && "text-foreground",
            !face.strong && "text-muted-foreground",
            selected && "text-foreground",
          )}
        >
          {SHORT[room]}
        </span>
      </button>
    );
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        "group relative h-28 w-44 shrink-0 overflow-hidden rounded-xl text-left text-white ring-1 ring-black/5 transition-transform duration-150 ease-emphasis outline-none active:scale-[0.98] dark:ring-white/10",
        selected &&
          "ring-2 ring-foreground ring-offset-2 ring-offset-background",
      )}
    >
      <WindowPicture room={room} f={f} at="door" />
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent"
      />
      {face.count ? <WindowCount n={face.count} small={false} /> : null}
      <span className="absolute inset-x-3 bottom-2.5 flex flex-col">
        <span className="font-heading text-card-title">
          {room === "guest" ? "As a guest" : ROOM_LABEL[room]}
        </span>
        <span
          className={cn(
            "truncate text-xs tabular-nums",
            face.amber || face.strong
              ? "font-medium text-white"
              : "text-white/75",
          )}
        >
          {face.value}
        </span>
      </span>
    </button>
  );
}

/** A window's stuck pill: its picture as the pill's glyph, its word, and the count that needs her. */
function WindowPill({
  room,
  face,
  f,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  f: HostFacts;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-full border border-border pr-3 pl-1 text-xs font-medium",
        face.amber && "border-warning/40 bg-warning/5",
        selected && "ring-2 ring-foreground",
      )}
    >
      <span className="relative size-7 overflow-hidden rounded-full">
        <WindowPicture room={room} f={f} at="pill" />
      </span>
      {SHORT[room]}
      {face.count ? <StuckCount n={face.count} /> : null}
    </button>
  );
}

/* ══ GLASS: the doors on the photograph ════════════════════════════════════ */

function GlassDoor({
  room,
  face,
  round,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  /** A phone's door: the glyph alone, its word on hover and a tap, as every glyph's. */
  round: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  const Icon = ICON[room];
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      aria-label={round ? SHORT[room] : undefined}
      title={round ? `${ROOM_LABEL[room]}: ${face.value}` : undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        "relative flex shrink-0 items-center justify-center glass text-white transition-transform duration-150 ease-emphasis outline-none active:scale-[0.97]",
        round
          ? "size-10 rounded-full"
          : "h-9 gap-2 rounded-full pr-3.5 pl-3 text-sm font-medium",
        selected && "bg-white/25 ring-2 ring-white",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {round ? null : (
        <span>{room === "guest" ? "As a guest" : ROOM_LABEL[room]}</span>
      )}
      {face.count ? (
        round ? (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning px-1 text-[10px] font-semibold text-warning-foreground tabular-nums">
            {face.count}
          </span>
        ) : (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-semibold text-warning-foreground tabular-nums">
            {face.count}
          </span>
        )
      ) : null}
    </button>
  );
}

/** The doors on the cover, a row of glass at its foot. */
export function GlassDoors({
  f,
  screen,
  order,
  selected,
  onOpen,
}: {
  f: HostFacts;
  screen: ScreenId;
  order: readonly RoomId[];
  selected?: RoomId | null;
  onOpen?: DoorPress;
}) {
  const faces = facesOf(f);
  const round = screen === "375";
  return (
    <div
      data-eh-doors="glass"
      role="group"
      aria-label="This event"
      className={cn("flex items-center", round ? "gap-2" : "flex-wrap gap-2")}
    >
      {order.map((room) => (
        <GlassDoor
          key={room}
          room={room}
          face={faces[room]}
          round={round}
          selected={selected === room}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

/* ══ THE ROW AND ITS BAND ══════════════════════════════════════════════════ */

/**
 * THE ROW UNDER THE COVER, sticky, condensing to the band once it reaches the
 * bar: production's footprint and band (`event-cards-row.tsx`), the cover's
 * face leading it stuck and the code's chip closing it.
 *
 * ★ THE FOOTPRINT HOLDS THE RESTING ROW'S HEIGHT (production's `useStuckBand`),
 * so condensing never moves the album: a row that shrank under a live frame's
 * scroll would lift its own footprint off the bar and unstick it, for ever.
 * ★ WITH THE DOORS ON THE COVER (`glass`) nothing stands under it at rest, so
 * the band arrives fixed under the bar once the cover has gone and takes no
 * room in the page; a sticky band appearing in the flow would push the album
 * down by its own height.
 */
export function DoorsRow({
  doors,
  f,
  screen,
  stuck,
  order,
  selected,
  onOpen,
  footRef,
}: {
  doors: DoorsId;
  f: HostFacts;
  screen: ScreenId;
  stuck: boolean;
  order: readonly RoomId[];
  selected?: RoomId | null;
  onOpen?: DoorPress;
  /** A live frame's footprint, which it reads its stuck state off. */
  footRef?: RefObject<HTMLDivElement | null>;
}) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const [rest, setRest] = useState(0);
  useLayoutEffect(() => {
    const band = bandRef.current;
    if (!band || stuck || doors === "glass") return;
    const hold = () => setRest(band.getBoundingClientRect().height);
    hold();
    const ro = new ResizeObserver(hold);
    ro.observe(band);
    return () => ro.disconnect();
  }, [stuck, doors]);

  if (doors === "glass")
    return (
      <>
        <div ref={footRef} aria-hidden className="h-px" />
        {stuck ? (
          <div className="fixed inset-x-0 top-14 z-30">
            <Band
              doors={doors}
              f={f}
              screen={screen}
              stuck
              order={order}
              selected={selected}
              onOpen={onOpen}
            />
          </div>
        ) : null}
      </>
    );
  return (
    <div
      ref={footRef}
      className="pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
      style={rest ? { minHeight: rest } : undefined}
    >
      <Band
        doors={doors}
        f={f}
        screen={screen}
        stuck={stuck}
        order={order}
        selected={selected}
        onOpen={onOpen}
        bandRef={bandRef}
      />
    </div>
  );
}

function Band({
  doors,
  f,
  screen,
  stuck,
  order,
  selected,
  onOpen,
  bandRef,
}: {
  doors: DoorsId;
  f: HostFacts;
  screen: ScreenId;
  stuck: boolean;
  order: readonly RoomId[];
  selected?: RoomId | null;
  onOpen?: DoorPress;
  bandRef?: RefObject<HTMLDivElement | null>;
}) {
  const faces = facesOf(f);
  const phone = screen === "375";
  const restingWindows = doors === "windows" && !stuck;
  return (
    <div
      ref={bandRef}
      data-eh-band=""
      data-stuck={stuck || undefined}
      className={cn(
        "pointer-events-auto border-b border-transparent transition-[box-shadow,border-color,background-color] duration-200",
        phone ? "px-3 py-2" : "px-5 py-2",
        stuck && "border-border bg-background/85 backdrop-blur",
      )}
    >
      <div
        data-eh-doors={doors}
        role="group"
        aria-label="This event"
        className={cn(
          restingWindows
            ? phone
              ? "flex items-start justify-between gap-1.5 py-1"
              : "flex gap-3 py-0.5"
            : doors === "cards" && !stuck
              ? roomRowLayout(false)
              : "flex items-center gap-2 overflow-hidden py-0.5",
        )}
      >
        {stuck ? <BandLead f={f} /> : null}
        {order.map((room) => {
          const face = faces[room];
          if (doors === "windows")
            return stuck ? (
              <WindowPill
                key={room}
                room={room}
                face={face}
                f={f}
                selected={selected === room}
                onOpen={onOpen}
              />
            ) : (
              <WindowDoor
                key={room}
                room={room}
                face={face}
                f={f}
                small={phone}
                selected={selected === room}
                onOpen={onOpen}
              />
            );
          return (
            <CardDoor
              key={room}
              room={room}
              face={face}
              f={f}
              stuck={stuck}
              selected={selected === room}
              onOpen={onOpen}
            />
          );
        })}
        {stuck ? (
          <CodeChip
            aria-label={`Show the code for ${EVENT.name}`}
            title="Invite"
            className="ml-0.5"
          />
        ) : null}
      </div>
    </div>
  );
}

/** The band's lead once the cover has gone: its first photograph and the event's name. */
function BandLead({ f }: { f: HostFacts }) {
  return (
    <span
      data-band-lead=""
      className="flex min-w-0 shrink-0 items-center gap-2.5 pr-1"
    >
      {f.photos > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element -- the cover's first still
        <img
          src={COVER[0].tile}
          alt=""
          className="size-9 shrink-0 rounded-lg object-cover"
        />
      ) : null}
      <span className="max-w-48 truncate font-heading text-card-title">
        {EVENT.name}
      </span>
    </span>
  );
}
