"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Home,
  Images,
  ListChecks,
  type LucideIcon,
  Plus,
  QrCode,
  Settings,
  User,
  Users,
} from "lucide-react";

import { Frame, useLabPrefs } from "@/components/lab";
import { AppShell } from "@/components/shared/app-shell";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { EVENTS, HOST, type HostEvent, STORAGE } from "./fixtures";

/**
 * THE SHELL, IN THREE SHAPES, AT TWO REAL WINDOWS.
 *
 * Everything on this board is drawn inside a `Frame`, which is a real viewport:
 * every `sm:` in the shipped components resolves at the WINDOW being judged
 * rather than at the lab page's width, a sticky header sticks to the window it
 * is in, and a phone option is a phone rather than a narrow div. `header` is
 * the shipped `AppShell` itself, imported and wrapped, so today's answer is
 * today's code; `crumbs` and `rail` are the candidates, composed from the same
 * `Logo`, `Avatar` and tokens and editing nothing.
 *
 * ★ THE NUMBER UNDER EVERY FRAME IS MEASURED, NEVER COMPUTED (docs/PROGRAM.md:
 * a board once drew an option with its formula's sign backwards and the tile
 * Will judged showed the opposite of the words he picked). The caption reads
 * the laid-out page inside the frame: how wide the working column ends up and,
 * where there are photographs, how many columns they fall in and how wide a
 * tile is. If the words above a frame and the caption under it disagree, the
 * caption is the truth.
 *
 * ★ A RAIL IS PAID FOR IN COLUMNS. Will ruled that galleries run to the window
 * at about 240 px tiles (2026-09-19), so permanent furniture down the side is
 * spent out of the photographs. That is the one cost this board can measure
 * rather than assert, and the rail's caption reports it.
 */

/* ── The two windows ─────────────────────────────────────────────────────── */

export const SIZES = {
  laptop: { w: 1440, h: 900, name: "1440 x 900, a laptop" },
  phone: { w: 375, h: 812, name: "375 x 812, a phone" },
} as const;
export type Size = keyof typeof SIZES;

export const sizeOf = (v: string | undefined): Size =>
  v === "phone" ? "phone" : "laptop";

/** The three shapes the chrome can take on a laptop. */
export type Nav = "header" | "crumbs" | "rail";
/** The three shapes it can take in a hand. */
export type Phone = "narrow" | "thumb" | "same";

export const navOf = (v: string | undefined): Nav =>
  v === "header" || v === "rail" ? v : "crumbs";
export const phoneOf = (v: string | undefined): Phone =>
  v === "narrow" || v === "same" ? v : "thumb";

/**
 * The phone shape a nav implies, so the size knob means something on every
 * decision rather than only on the one that asks about phones: today's header
 * narrows, the breadcrumb header is one shape at both sizes, and a rail cannot
 * be a rail in a hand, so it becomes the bar.
 */
export const phoneForNav = (nav: Nav): Phone =>
  nav === "header" ? "narrow" : nav === "crumbs" ? "same" : "thumb";

/** The app's `Container`, as classes, so a page can hold it or let it go. */
export const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
const GUTTER = "px-4 sm:px-6 lg:px-8";

/* ── The measurement ─────────────────────────────────────────────────────── */

export type Measured = {
  /** The working column, as the page lays it out. */
  room: number;
  /** Distinct tile lefts, so a masonry's real column count. 0 with no tiles. */
  cols: number;
  /** The first tile's width. 0 with no tiles. */
  tile: number;
};

/**
 * Reads the laid-out page from inside the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S (gallery-width's finding).
 * The subtree lives in the iframe's document, so it is observed with that
 * window's `ResizeObserver`: it fires when the copied stylesheets land (the
 * first layout is unstyled) and again whenever a new option re-flows. A hidden
 * option on the step's stage is `visibility: hidden`, which keeps its layout,
 * so it measures true as well.
 */
function Measure({
  onMeasure,
  children,
}: {
  onMeasure: (m: Measured) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const read = () => {
      const room = el.querySelector<HTMLElement>("[data-as-room]");
      // ★ THE COLUMNS ARE THE ALBUM'S, NOT EVERY TILE'S. `data-media-tile` is on
      // every thumbnail on the page, so counting all of them reported "15
      // columns of 96 px" on a home whose strips are not a gallery at all
      // (found by reading the first captures against their captions). Only the
      // masonry inside `.as-grid` is a gallery, so only it is measured.
      const tiles = el.querySelectorAll<HTMLElement>(
        ".as-grid [data-media-tile]",
      );
      const lefts = new Set<number>();
      tiles.forEach((t) =>
        lefts.add(Math.round(t.getBoundingClientRect().left)),
      );
      report.current({
        room: Math.round(room?.getBoundingClientRect().width ?? 0),
        cols: lefts.size,
        tile: tiles[0] ? Math.round(tiles[0].getBoundingClientRect().width) : 0,
      });
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}

/**
 * THE LAB'S FIT, KEPT BY A FRAME (gallery-width's `WindowFit`, copied rather
 * than imported because that board retires with its wiring). The step draws an
 * option at 1:1 and scrolls a wide one sideways, or fits it to the column under
 * the lab's Fit preference. A `Stage` answers that by itself; a bare `Frame`
 * does not, so a 1440 frame would stay 1:1 under Fit and the button would seem
 * dead. CSS `zoom` on an iframe's ancestor scales the picture and leaves the
 * frame's own viewport alone, so the page inside still lays out at 1440.
 */
function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      data-stage-fit={zoomed ? "zoom" : "true"}
      ref={box}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** One option's picture: a real window, the page inside it, the numbers under. */
export function Screen({
  id,
  size,
  title,
  caption,
  children,
}: {
  id: string;
  size: Size;
  /** The option's own words, above the frame. */
  title: string;
  /** What to look at; the measured half is appended. */
  caption: string;
  children: ReactNode;
}) {
  const { w, h, name } = SIZES[size];
  const [m, setM] = useState<Measured | null>(null);
  const measured = !m
    ? "measuring"
    : m.cols > 0
      ? `${m.room} px of working room, the album at ${m.cols} columns of ${m.tile} px`
      : `${m.room} px of working room`;
  return (
    <Fit w={w}>
      <Frame
        id={`app-shape-${id}`}
        w={w}
        h={h}
        title={`${title} · ${name}`}
        caption={`${caption} Measured in the frame: ${measured}.`}
      >
        <Measure
          onMeasure={(next) =>
            setM((prev) =>
              prev &&
              prev.room === next.room &&
              prev.cols === next.cols &&
              prev.tile === next.tile
                ? prev
                : next,
            )
          }
        >
          {children}
        </Measure>
      </Frame>
    </Fit>
  );
}

/* ── The furniture the chromes share ─────────────────────────────────────── */

export function Face({ size = "size-8" }: { size?: string }) {
  return (
    <Avatar className={size}>
      <AvatarFallback>{HOST.initial}</AvatarFallback>
    </Avatar>
  );
}

/**
 * The storage strip as a CHIP: the same datum the shipped `StorageMeter` puts
 * in a full-width row, at the size a permanent bar can carry it, amber past 85
 * percent exactly as the shipped meter decides.
 */
export function StorageChip({ full = false }: { full?: boolean }) {
  const warn = STORAGE.pct >= 85;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-2 text-xs",
        full ? "w-full" : "w-36",
        warn ? "text-warning" : "text-muted-foreground",
      )}
    >
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full rounded-full",
            warn ? "bg-warning" : "bg-foreground/70",
          )}
          style={{ width: `${STORAGE.pct}%` }}
        />
      </span>
      <span className="shrink-0 tabular-nums">{STORAGE.pct}%</span>
    </span>
  );
}

/** Where the reader is, so a chrome can say it without being told twice. */
export type Place = {
  /** The event you are inside, or null on the home, the account, the bin. */
  event?: HostEvent | null;
  /** The room inside it, or the page's own name when there is no event. */
  room?: string;
};

export const ROOMS = [
  { id: "album", label: "Album", Icon: Images },
  { id: "review", label: "Review", Icon: ListChecks },
  { id: "reel", label: "Reel", Icon: Clapperboard },
  { id: "guests", label: "Guests", Icon: Users },
  { id: "share", label: "Share", Icon: QrCode },
  { id: "settings", label: "Settings", Icon: Settings },
] as const;

function RoomRow({ place }: { place: Place }) {
  const pending = place.event?.pending ?? 0;
  return (
    <div className="-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden">
      {ROOMS.map(({ id, label, Icon }) => {
        const on = place.room?.toLowerCase() === id;
        return (
          <span
            key={id}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
              on
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
            {id === "review" && pending > 0 && (
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                  on ? "bg-background/20" : "bg-warning/15 text-warning",
                )}
              >
                {pending}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** The one box every page's content sits in, and the one the caption measures. */
function Room({ children }: { children: ReactNode }) {
  return (
    <div data-as-room className="w-full min-w-0">
      {children}
    </div>
  );
}

/* ── The three laptop chromes ────────────────────────────────────────────── */

/**
 * TODAY: the shipped `AppShell`. A sticky 56 px bar with the wordmark and a
 * menu, nothing else, and the page centred in the app's 1280 column. Which of
 * the seven routes you are on is the page heading's job, and the way back is
 * whatever that page happened to draw (a text link, a dirty-checked text link,
 * the studio's X, or nothing at all on /account).
 */
function TodayChrome({
  children,
  bleed,
}: {
  children: ReactNode;
  bleed: boolean;
}) {
  return (
    <AppShell
      headerActions={
        <>
          <Bell className="size-4 text-muted-foreground" aria-hidden />
          <Face />
        </>
      }
    >
      {/* ★ THE BLEED ESCAPE, because `AppShell` puts every page inside the
          app's 1280 `Container` and this board may not edit it. Will ruled on
          2026-09-19 that galleries run to the WINDOW, so an album drawn inside
          the container here would answer the navigation question with a width
          that is on its way out. `w-screen` in a frame is the frame's own
          viewport, so this is the page escaping its column, at 1:1. */}
      {bleed ? (
        <div className="relative left-1/2 w-screen -translate-x-1/2 px-5">
          <Room>{children}</Room>
        </div>
      ) : (
        <Room>{children}</Room>
      )}
    </AppShell>
  );
}

/**
 * THE CANDIDATE: one header that always says where you are, in a trail you can
 * walk back up, with the event's rooms under it whenever you are inside one. It
 * spends no horizontal room, which is the whole argument against the rail: the
 * photographs keep the window.
 */
function CrumbChrome({
  place,
  children,
  bleed,
}: {
  place: Place;
  children: ReactNode;
  bleed: boolean;
}) {
  const trail = [
    "Partyreel",
    ...(place.event ? [place.event.name] : []),
    ...(place.room && place.room !== "Album" ? [place.room] : []),
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className={cn(CONTAINER, "flex h-14 items-center gap-4")}>
          <Logo className="h-[18px]" />
          <nav
            aria-label="Where you are"
            className="flex min-w-0 flex-1 items-center gap-1 text-sm"
          >
            {trail.map((step, i) => (
              <span key={step} className="flex min-w-0 items-center gap-1">
                {i > 0 && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "truncate",
                    i === trail.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </span>
            ))}
          </nav>
          <StorageChip />
          <Bell className="size-4 text-muted-foreground" aria-hidden />
          <Face />
        </div>
        {place.event && (
          <div className={cn(CONTAINER, "flex h-11 items-center")}>
            <RoomRow place={place} />
          </div>
        )}
      </header>
      <main className={cn("py-6", bleed ? "px-5" : CONTAINER)}>
        <Room>{children}</Room>
      </main>
    </div>
  );
}

/**
 * THE OTHER CANDIDATE: a rail that lists the events and, under the open one,
 * its rooms. Every event is one click from every other and the three back
 * idioms have nothing left to do. It costs 232 px of window at every width,
 * which the caption measures against the photographs.
 */
function RailChrome({
  place,
  children,
  bleed,
}: {
  place: Place;
  children: ReactNode;
  bleed: boolean;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col gap-4 border-r bg-muted/25 px-3 py-4">
        <div className="px-2">
          <Logo className="h-[18px]" />
        </div>
        <span className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground">
          <Home className="size-4" aria-hidden /> Home
        </span>
        <div className="space-y-1">
          <p className="px-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
            Events
          </p>
          {EVENTS.map((e) => {
            const open = place.event?.id === e.id;
            return (
              <div key={e.id}>
                <span
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-lg px-2 text-sm",
                    open
                      ? "bg-foreground font-medium text-background"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="truncate">{e.name}</span>
                  {e.pending > 0 && (
                    <span
                      className={cn(
                        "ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                        open
                          ? "bg-background/20"
                          : "bg-warning/15 text-warning",
                      )}
                    >
                      {e.pending}
                    </span>
                  )}
                </span>
                {open && (
                  <div className="mt-1 ml-3 space-y-0.5 border-l pl-3">
                    {ROOMS.map(({ id, label, Icon }) => (
                      <span
                        key={id}
                        className={cn(
                          "flex h-7 items-center gap-2 rounded-md px-2 text-[13px]",
                          place.room?.toLowerCase() === id
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden />
                        {label}
                        {id === "review" && e.pending > 0 && (
                          <span className="ml-auto text-[10px] font-semibold text-warning tabular-nums">
                            {e.pending}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <span className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground">
            <Plus className="size-4" aria-hidden /> New event
          </span>
        </div>
        <div className="mt-auto space-y-3 border-t pt-3">
          <StorageChip full />
          <span className="flex items-center gap-2 text-sm">
            <Face size="size-6" />
            <span className="truncate text-muted-foreground">{HOST.name}</span>
          </span>
        </div>
      </aside>
      <main className={cn("min-w-0 flex-1 py-6", bleed ? "px-5" : GUTTER)}>
        <Room>{children}</Room>
      </main>
    </div>
  );
}

/* ── The three phone chromes ─────────────────────────────────────────────── */

type BarItem = { id: string; label: string; Icon: LucideIcon };

const APP_BAR: BarItem[] = [
  { id: "home", label: "Events", Icon: Home },
  { id: "new", label: "New", Icon: Plus },
  { id: "you", label: "You", Icon: User },
];

function PhoneChrome({
  shape,
  place,
  children,
  bleed,
}: {
  shape: Phone;
  place: Place;
  children: ReactNode;
  bleed: boolean;
}) {
  // TODAY: the same 56 px bar, the same page narrowed, and the way back is
  // whatever text link the page drew for itself.
  if (shape === "narrow") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur">
          <Logo className="h-[18px]" />
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" aria-hidden />
            <Face />
          </div>
        </header>
        <main className="px-4 py-6">
          {place.event && (
            <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronLeft className="size-4" /> Back to events
            </p>
          )}
          <Room>{children}</Room>
        </main>
      </div>
    );
  }

  // ONE SHAPE AT BOTH SIZES: the breadcrumb header, narrowed. The trail cuts to
  // where you are, the rooms scroll sideways, nothing else moves.
  if (shape === "same") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
          <div className="flex h-12 items-center gap-2 px-4">
            {place.event ? (
              <>
                <ChevronLeft
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate text-sm font-medium">
                  {place.event.name}
                </span>
              </>
            ) : (
              <Logo className="h-[18px]" />
            )}
            <span className="ml-auto flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" aria-hidden />
              <Face size="size-7" />
            </span>
          </div>
          {place.event && (
            <div className="flex h-10 items-center px-4">
              <RoomRow place={place} />
            </div>
          )}
        </header>
        <main className={cn("py-4", bleed ? "px-3" : "px-4")}>
          <Room>{children}</Room>
        </main>
      </div>
    );
  }

  // A SHAPE FOR A THUMB: nothing at the top but where you are, and every
  // destination at the bottom of the screen where a thumb already is. The rooms
  // become the bar inside an event; the app's three places become it outside.
  const bar: BarItem[] = place.event
    ? ROOMS.slice(0, 4).map((r) => ({ ...r }))
    : APP_BAR;
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
        {place.event ? (
          <>
            <ChevronLeft
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate text-sm font-medium">
              {place.event.name}
            </span>
          </>
        ) : (
          <Logo className="h-[18px]" />
        )}
        <span className="ml-auto">
          <Face size="size-7" />
        </span>
      </header>
      <main className={cn("pt-4 pb-24", bleed ? "px-3" : "px-4")}>
        <Room>{children}</Room>
      </main>
      <nav
        aria-label="Go"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-start justify-around border-t bg-background/95 px-2 pt-2 backdrop-blur"
      >
        {bar.map(({ id, label, Icon }) => {
          const on = place.event
            ? place.room?.toLowerCase() === id
            : id === "home";
          return (
            <span
              key={id}
              className={cn(
                "relative flex w-16 flex-col items-center gap-1 text-[11px] font-medium",
                on ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
              {id === "review" && (place.event?.pending ?? 0) > 0 && (
                <span className="absolute top-[-2px] right-3.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-semibold text-warning-foreground tabular-nums">
                  {place.event?.pending}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

/* ── The one door every preview goes through ─────────────────────────────── */

export function AppChrome({
  nav,
  size,
  phone,
  place = {},
  bleed = false,
  children,
}: {
  nav: Nav;
  size: Size;
  /** Overrides the shape a nav implies; the phone decision is the only caller. */
  phone?: Phone;
  place?: Place;
  /** The page runs to the window's gutter rather than sitting in a column. */
  bleed?: boolean;
  children: ReactNode;
}) {
  if (size === "phone") {
    return (
      <PhoneChrome
        shape={phone ?? phoneForNav(nav)}
        place={place}
        bleed={bleed}
      >
        {children}
      </PhoneChrome>
    );
  }
  if (nav === "header")
    return <TodayChrome bleed={bleed}>{children}</TodayChrome>;
  if (nav === "rail")
    return (
      <RailChrome place={place} bleed={bleed}>
        {children}
      </RailChrome>
    );
  return (
    <CrumbChrome place={place} bleed={bleed}>
      {children}
    </CrumbChrome>
  );
}
