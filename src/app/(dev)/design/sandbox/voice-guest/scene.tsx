"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeftIcon,
  Clapperboard,
  Download,
  ImageUp,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";

import { Fit, Frame, Measured } from "@/components/lab";
import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import { DOOR_SCRIM, DoorLamp } from "@/components/guest/door/lit";
import {
  createUploadTrackerStore,
  UploadTrackerButton,
} from "@/components/guest/upload-tracker";
import { PosterCard } from "@/components/reel/poster-card";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingEdgeEntranceResponsive } from "@/components/ui/floating-layer";
import { formatCount, formatMediaCount } from "@/lib/format/count";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EVENT, HOST, PRIYA, REEL_STILL } from "./fixtures";

/**
 * THE ONE FRAME EVERY LINE IS READ IN, AND THE GUEST PAGE UNDER IT.
 *
 * ★ A PHONE, AND ONLY A PHONE: 375 BY 812. Every line on this board is read
 * standing up at a party, in the album a guest holds in one hand, so the frame
 * is that phone at 1:1 (the kit's `Frame`, a same-origin iframe, so a line
 * wraps exactly where it will wrap).
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK, AND
 * NOTHING MOUNTS A RADIX PORTAL. A Dialog, Sheet or Popup opened inside a
 * portalled frame renders on the LAB PAGE's document, not the phone being
 * judged, so the door's held sheet, her uploads' screen and a toast are
 * QUOTED: the shipped classes and postures, copied, never the primitive.
 * `fixed`, never `absolute` (`host-curation`'s landmine, via `guest-capture`):
 * the frame IS the viewport, and only `fixed` pins a layer to its true edge.
 * What renders no portal and calls nothing is the REAL component, not a copy:
 * the tracker's round button and its badge (`UploadTrackerButton`, on a store
 * of its own), the waiting tile (`WaitingTile`), the door's lamp, its check and
 * its heading, so today is drawn by the code that ships today.
 *
 * ★ THE ALBUM IS DRAWN AS `event-experience.tsx` LAYS IT OUT NOW: the header,
 * the words' column (the name, the byline, the stats, Add photos with her
 * tracker beside it over Invite), the upload area (the held event's one line),
 * the reel's tile, then the album's own head (its count, Download all, View)
 * and its justified rows, two a row in a hand, whose head slots are the square
 * the rows give an upload tile (`album-window-plan.ts`, `HEAD_RATIO`).
 */

export const PHONE = { w: 375, h: 812 } as const;

/** The words' column and the album's box, `event-experience.tsx`'s own. */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-3 sm:px-5";

export type Reader = (root: HTMLElement, win: Window) => string | null;

export function Scene({
  id,
  title,
  measure,
  children,
}: {
  id: string;
  title: string;
  /** A number read off the frame for its caption. */
  measure: Reader;
  children: ReactNode;
}) {
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={PHONE.w}>
      <Frame id={id} w={PHONE.w} h={PHONE.h} title={title} caption={measured}>
        <Measured
          probe={measure}
          deps={[id]}
          onMeasure={setMeasured}
          className="min-h-full"
        >
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * THE FRAMES OF ONE OPTION, read left to right as time runs (`identity-claims`'
 * `Trio`, retyped: a board's directory leaves with its ruling). Three phones in
 * a row put an option's whole story on one screen, so a flip compares the same
 * frames in the same places; the row wraps where the stage is narrower.
 */
export function Trio({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-6">{children}</div>;
}

/* ── what the frames measure ──────────────────────────────────────────────── */

/**
 * How many lines a block of text runs, read off its own line boxes: the rects
 * a Range draws over each TEXT node inside it (never an icon beside the text),
 * clustered by top so a glyph's own rounding never counts as a second line.
 */
export function lineCount(el: Element | null): number {
  if (!el) return 0;
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const tops: number[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = doc.createRange();
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 1 || r.height < 1) continue;
      tops.push(r.top);
    }
  }
  tops.sort((a, b) => a - b);
  let count = 0;
  let last = -Infinity;
  for (const t of tops) {
    if (t - last > 6) count++;
    last = t;
  }
  return count;
}

export const lines = (n: number) => `${n} line${n === 1 ? "" : "s"}`;

export const wordCount = (text: string | null | undefined) =>
  (text ?? "").trim().split(/\s+/).filter(Boolean).length;

/** A one-line label the row truncates: whether its words were cut short. */
export const isCut = (el: Element | null) =>
  el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1;

/**
 * SCROLLS THE FRAME SO ITS OWN SPOT SITS AT THE TOP, once the frame has
 * settled (`event-safety`'s `ScrollHere`, retyped). The album's head sits under
 * the reel's tile, below a phone's first screen, so a frame about what stands
 * there opens scrolled past the header to the event's name: the badge beside
 * Add and the album's first rows on one screen, where she is when a pick
 * finishes. Re-runs as the webfont lands; a second run is a no-op.
 */
function ScrollHere({ offset = 12 }: { offset?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const go = () => {
      const top = el.getBoundingClientRect().top;
      win.scrollTo(0, win.scrollY + top - offset);
    };
    go();
    const timers = [150, 600, 1500].map((ms) => win.setTimeout(go, ms));
    win.document.fonts?.ready.then(go).catch(() => {});
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [offset]);
  return <span ref={ref} aria-hidden className="block h-0" />;
}

/* ── the guest page's own furniture, quoted ───────────────────────────────── */

/**
 * THE HEADER, QUOTED (`guest-header.tsx`): the logo, and on the right the name
 * she typed on its plain disc, which is her name menu's trigger
 * (`guest-name-menu.tsx`: no seed, because a colour is an identity and hers is
 * not proven). The h-8 slot that keeps the swap height-stable is copied too.
 */
function GuestHeader() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        <span className="flex items-center gap-2 rounded-full">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {PRIYA.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-28 truncate text-sm">{PRIYA.name}</span>
        </span>
      </div>
    </header>
  );
}

/**
 * HER TRACKER'S ROUND BUTTON, THE REAL ONE (`upload-tracker.tsx`): it reads
 * its two facts from a store, so each frame hands it a store of its own
 * holding what that moment shows. `null` is a guest with nothing sent at a
 * held event, where the button draws nothing at all.
 */
function Tracker({ waiting }: { waiting: number | null }) {
  const [store] = useState(() => createUploadTrackerStore());
  useEffect(() => {
    store.set(
      waiting === null ? { show: false, waiting: 0 } : { show: true, waiting },
    );
  }, [store, waiting]);
  return <UploadTrackerButton store={store} onOpen={() => {}} />;
}

/**
 * THE REEL'S TILE, QUOTED (`live-reel.tsx`, `LiveReelTile`): "Highlight reel"
 * on the shipped face (`PosterCard`), its clapperboard mark, and "Make your own
 * clip to share" in the line's place, resting on one still.
 */
function ReelTile({ className }: { className?: string }) {
  return (
    <div className={className} data-vg-reel>
      <div className="relative rounded-lg">
        <PosterCard
          eventName="Highlight reel"
          chip={
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-white",
                GLASS_MARK,
              )}
            >
              <Clapperboard
                className={cn("size-3", GLASS_MARK_LIT)}
                aria-hidden
              />
            </span>
          }
          meta={
            <span className="pointer-events-auto relative z-[2] -mx-1 -my-2 rounded-sm px-1 py-2 text-left text-micro font-medium text-[oklch(0.8_0.14_300)]">
              Make your own clip to share
            </span>
          }
          media={
            <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the reel's resting frame */}
              <img
                src={REEL_STILL}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          }
        />
      </div>
    </div>
  );
}

/** One photograph in a row, on the shipped tile (`MediaTile`). */
function AlbumTile({ item }: { item: GridMedia }) {
  return (
    <div
      data-media-tile
      data-vg-tile={item.id}
      style={{ borderRadius: "var(--radius-tile)" } as CSSProperties}
      className="relative size-full overflow-hidden bg-black/10"
    >
      <MediaTile item={item} playBadge="none" />
    </div>
  );
}

/**
 * The class a head slot wears in the rows (`album-window.tsx`): the tile's own
 * bottom margin gives way and it fills the square the rows gave it.
 */
const HEAD_SLOT =
  "relative [&_[data-media-tile]]:!mb-0 [&_[data-media-tile]]:h-full [&>*]:!mb-0 [&>*]:h-full [&>*]:w-full";

/**
 * THE ALBUM'S FIRST ROWS, justified the way the real rows are: every
 * photograph in a row shares one height and the row fills the width, two a
 * row in a hand (the default step). A head slot (a tile of hers at the album's
 * head) is a square, and takes its place in the first row like a photograph.
 */
function Rows({
  head,
  items,
}: {
  head: readonly ReactNode[];
  items: readonly GridMedia[];
}) {
  const per = 2;
  const cells = [
    ...head.map((node, i) => ({
      key: `head-${i}`,
      ratio: 1,
      node,
      head: true,
    })),
    ...items.map((item) => ({
      key: item.id,
      // Every still here has its size; a photograph nobody measured takes the
      // rows' own fallback, a square (`ROW_FALLBACK_RATIO`).
      ratio: item.width && item.height ? item.width / item.height : 1,
      node: <AlbumTile item={item} />,
      head: false,
    })),
  ];
  const rows: (typeof cells)[] = [];
  for (let i = 0; i + per <= cells.length; i += per)
    rows.push(cells.slice(i, i + per));
  return (
    <div
      data-vg-rows
      className="flex flex-col"
      style={{ gap: "var(--gap-gallery)" }}
    >
      {rows.map((row, i) => (
        <div key={i} className="flex" style={{ gap: "var(--gap-gallery)" }}>
          {row.map((c) => (
            <div
              key={c.key}
              data-rows-head={c.head ? "" : undefined}
              className={cn("min-w-0", c.head && HEAD_SLOT)}
              style={{ flexGrow: c.ratio, flexBasis: 0, aspectRatio: c.ratio }}
            >
              {c.node}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * THE ALBUM AS PRIYA HOLDS IT (`event-experience.tsx`, `live-gallery.tsx`,
 * `gallery-rows.tsx`), every part at today's words: only what an option moves
 * is handed in. `line` stands where the Yours filter's line stands, between the
 * album's own head and its rows; `head` is what stands in the rows' head
 * slots; `overlay` is a layer over the page.
 */
export function AlbumPage({
  moderated,
  count,
  tracker,
  line,
  head = [],
  items,
  scroll = false,
  overlay,
}: {
  /** The wedding holds uploads for the host (the upload area's one line). */
  moderated: boolean;
  /** The album's count, the stats line's and the album head's one number. */
  count: number;
  /** Her tracker: null draws no button; a number is its badge (0: none). */
  tracker: number | null;
  line?: ReactNode;
  head?: readonly ReactNode[];
  items: readonly GridMedia[];
  /** Open scrolled past the header, the album's head on the same screen. */
  scroll?: boolean;
  overlay?: ReactNode;
}) {
  return (
    <div
      data-vg-ground="album"
      className="min-h-full bg-background pb-8 text-foreground"
    >
      <GuestHeader />
      <div className="w-full pt-8">
        <div className={COLUMN}>
          {scroll && <ScrollHere />}
          <header>
            <p className="font-heading text-page text-balance">{EVENT.name}</p>
            <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="text-faint">Hosted by</span>
                <Avatar seed={HOST.seed} size="sm">
                  <AvatarFallback>
                    {HOST.displayName.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {HOST.displayName}
                </span>
              </span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <span>{EVENT.date}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {`${formatMediaCount(count)} from ${formatCount(EVENT.contributorCount)} guests`}
            </p>
          </header>
          {/* The action block: Add photos with her tracker's round button
              beside it (`tracker=button`), over Invite. */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="lg"
                className="min-w-0 flex-1"
                tabIndex={-1}
              >
                <ImageUp /> Add photos
              </Button>
              <Tracker waiting={tracker} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full"
                  tabIndex={-1}
                >
                  <QrCode /> Invite
                </Button>
              </div>
            </div>
          </div>
          {/* The upload area (`guest-upload.tsx`): on a held event, the one
              place the rule can be read before a first upload. A signed-out
              guest's post-upload slot is empty (the door asked). */}
          {moderated && (
            <div className="mt-7">
              <p className="rounded-md bg-muted px-3 py-2 text-center text-reading text-muted-foreground">
                The host reviews uploads before they appear in the album.
              </p>
            </div>
          )}
        </div>
        <ReelTile className={cn(COLUMN, "mt-7 mb-4")} />
        <div className={BLEED}>
          <section className="mt-3">
            {/* The album's own head: its count, Download all and View. */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
              <p className="px-0.5 text-working text-muted-foreground tabular-nums">
                {formatMediaCount(count)}
              </p>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
                  <Download className="size-4" /> Download all
                </span>
                <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                  <SlidersHorizontal /> View
                </Button>
              </div>
            </div>
            {line}
            <Rows head={head} items={items} />
          </section>
        </div>
      </div>
      {overlay}
    </div>
  );
}

/* ── the layers over the album, quoted ────────────────────────────────────── */

/**
 * HER UPLOADS AS A PHONE OPENS A LIST (`popups` r1, `lists=panel`: the whole
 * screen under a back arrow that says where Back returns). The `screen` shape
 * of `PopupContent` and its `PopupHeader` bar, class for class
 * (`ui/popup.tsx`, `floating-layer.ts`), carrying the tracker's own title and
 * line (`upload-tracker.tsx`).
 */
export function UploadsScreen({ children }: { children: ReactNode }) {
  return (
    <div
      data-vg-screen
      role="dialog"
      aria-label="Your uploads"
      className="fixed inset-x-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden bg-background text-sm text-popover-foreground outline-none"
    >
      <div data-bar="" className="shrink-0 border-b">
        <div className="grid h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            tabIndex={-1}
            className="max-w-full gap-0.5 justify-self-start px-1.5 text-muted-foreground"
          >
            <ChevronLeftIcon className="size-5" />
            <span className="truncate">Album</span>
          </Button>
          <p className="max-w-[55vw] truncate text-center font-heading text-base font-medium text-foreground">
            Your uploads
          </p>
          <span aria-hidden />
        </div>
        <p className="px-4 pb-3 text-sm text-pretty text-muted-foreground">
          The host reviews uploads before they appear in the album.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4">
        {children}
      </div>
    </div>
  );
}

/**
 * A TOAST, QUOTED: sonner's neutral toast as the product dresses it
 * (`ui/sonner.tsx`, globals.css): top-centre in the band under the header
 * (5rem), the popover's ground and ink, the float radius and the layer's
 * shadow, a title and an action. The Toaster mounts in the root layout, which
 * the frame does not have.
 */
export function QuotedToast({
  title,
  action,
}: {
  title: string;
  action: string;
}) {
  return (
    <div
      data-vg-toast
      role="status"
      className="fixed inset-x-4 top-20 z-50 flex items-center gap-1.5 rounded-float border border-border bg-popover p-4 text-[13px] text-popover-foreground shadow-layer"
    >
      <span data-vg-line className="min-w-0 leading-normal font-medium">
        {title}
      </span>
      <span className="ml-auto flex h-6 shrink-0 items-center rounded-[4px] bg-popover-foreground px-2 text-xs font-medium text-popover">
        {action}
      </span>
    </div>
  );
}

/**
 * THE DOOR'S HELD SHEET, QUOTED (`entry-shell.tsx`): the lit scrim over the
 * album (`DOOR_SCRIM`), the responsive Sheet's phone posture
 * (`floatingEdgeEntranceResponsive`) in the door's own padding (`DOOR_SHEET`),
 * no close (a held step has no exit), the album's light on its free edge (the
 * real `DoorLamp`), and the step container every step sits in.
 */
export function HeldSheet({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
          DOOR_SCRIM,
        )}
      />
      <div
        data-entry-sheet
        data-door-lit=""
        data-side="responsive"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer",
          floatingEdgeEntranceResponsive,
          DOOR_SHEET,
        )}
      >
        <DoorLamp edge="free" />
        <div className="relative pt-1">{children}</div>
      </div>
    </div>
  );
}
