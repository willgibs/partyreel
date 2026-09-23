"use client";

import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Lock, Sparkles, XIcon } from "lucide-react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { formatReelMeta, PosterCard } from "@/components/reel/poster-card";
import { Logo } from "@/components/shared/logo";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import {
  DEFAULT_STYLE_ID,
  resolveStyleEntry,
} from "@/lib/reel/engine/style-registry";

import { EVENT, HOST, REEL_STILL } from "./fixtures";

/**
 * THE ONE FRAME EVERY LINE IS READ IN, AND THE GUEST PAGE UNDER IT.
 *
 * ★ A PHONE, AND ONLY A PHONE: 375 BY 812. Every line on this board is read
 * standing up at a party, in the sheet or the album a guest holds in one
 * hand, so the frame is that phone at 1:1 (the kit's `Frame`, a same-origin
 * iframe, so a line wraps exactly where it will wrap). The desk's panel at
 * 640 and up sets the same lines at a similar measure; the board carries that
 * as its `phone` call rather than doubling every frame.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK, AND
 * NOTHING MOUNTS A RADIX PORTAL (`guest-capture/scene.tsx`'s own note, carried).
 * A Dialog, Sheet or Drawer opened inside a portalled frame renders on the
 * LAB PAGE's document, not the phone being judged, so the door's drawer, the
 * failure sheet and the capture's dialog are QUOTED: the shipped classes and
 * postures, copied, never the primitive. `fixed`, never `absolute`
 * (`host-curation`'s landmine, via `guest-capture`): the frame IS the
 * viewport, and only `fixed` pins a sheet to its true foot.
 *
 * ★ THE ALBUM IS DRAWN TRIMMED, AS `guest-capture` DRAWS IT: the header, the
 * words column's post-upload slot, the reel's tile at the album's head, then
 * the album. The event's own heading and action block are left off every
 * album scene but `empty`'s (where the empty state sits right under them),
 * so the line being judged stands inside the first screen instead of under
 * a fold nobody on this board is asking about.
 *
 * ★ THE MACHINERY (`Fit`, `Measured`, `Scene`) IS `guest-capture`'s AND
 * `identity-door`'s, COPIED VERBATIM, never imported: a board's directory
 * leaves with its ruling, and the kit does not export them yet (a finding
 * in this lane's manifest).
 */

export const PHONE = { w: 375, h: 812 } as const;

/* ── the landing's replay ─────────────────────────────────────────────────── */

/**
 * THE LANDING PLAYS ON MOUNT, ONCE, AND A STEP MOUNTS EVERY OPTION AT ONCE, so
 * the one pass of light today's landing makes has already run by the time a
 * reviewer flips to it. The landing's own Replay (board.tsx) bumps this run
 * id and the landed tiles key on it: a remount is the honest replay
 * (`useReplay`'s own note).
 */
export const ReplayCtx = createContext(0);
export const useRunId = () => useContext(ReplayCtx);

/* ── the frame, fit and measured ──────────────────────────────────────────── */

function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useEffect(() => {
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
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** A number read off the frame's own document, never computed: the same
 *  discipline `guest-capture` and `media-viewer` hold every caption to. */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  /** `null` means "not settled yet": the read is skipped rather than
   *  overwriting the caption with a lie. */
  probe: (root: HTMLElement, win: Window) => string | null;
  deps: unknown[];
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      try {
        const said = probe(el, win);
        if (said) report.current(said);
      } catch {
        // Not settled yet; the next timer or resize catches it.
      }
    };
    read();
    // The webfont lands after the first layout and takes every wrap with it,
    // so the reads keep coming until it has.
    const timers = [200, 900, 1800].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    win.document.fonts?.ready.then(read).catch(() => {});
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref}>{children}</div>;
}

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
      <Frame
        id={id}
        w={PHONE.w}
        h={PHONE.h}
        title={title}
        caption={measured}
      >
        <Measured probe={measure} deps={[id]} onMeasure={setMeasured}>
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * TWO PHONES, ONE OPTION: for a line that reads differently to two people
 * (`landed`: a typed name, a signed-in member) or across two surfaces (`keep`:
 * the card, then the door it opens). Side by side at 1:1, scrolled sideways
 * rather than shrunk where the column is narrower than both.
 */
export function Pair({ children }: { children: ReactNode }) {
  return (
    <div data-lab-bleed className="min-w-0 overflow-x-auto pb-2">
      <div className="flex w-fit gap-4">{children}</div>
    </div>
  );
}

/* ── what the frames measure ──────────────────────────────────────────────── */

/**
 * How many lines a block of text runs, read off its own line boxes: the rects
 * a Range draws over each TEXT node inside it (never an icon beside the text,
 * whose box sits a couple of pixels off the first line), clustered by top so a
 * glyph's own rounding never counts as a second line. Height divided by a line
 * height lies twice over (a `normal` leading, a padded box).
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

/* ── the guest page's own furniture, quoted ───────────────────────────────── */

/**
 * THE HEADER, QUOTED (`guest-header.tsx`, the markup `guest-capture` already
 * copied): the logo on the left, and on the right whoever this device is.
 * `stranger` wears "Start for free" (the door's page behind the sheet); a
 * named guest wears the plain disc and her typed name; a signed-in member
 * wears his own colour. The h-8 slot that keeps the swap height-stable is
 * copied too; only the session read is gone.
 */
export function GuestHeader({
  who,
}: {
  who:
    | { kind: "stranger" }
    | { kind: "named"; name: string }
    | { kind: "member"; name: string; seed: string };
}) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        {who.kind === "stranger" && (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        )}
        {who.kind === "named" && (
          <span className="flex items-center gap-2 rounded-full">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">
                {who.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-28 truncate text-sm">{who.name}</span>
          </span>
        )}
        {who.kind === "member" && (
          <Avatar size="sm" seed={who.seed}>
            <AvatarFallback className="text-[10px]">
              {who.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

/** The event's own heading, as `event-experience.tsx` draws it: the name, the
 *  byline with the host's colour, the stats line. `locked` is a password
 *  event before its door (the name only: the privacy rule). */
export function EventHead({
  count,
  contributors,
  locked = false,
}: {
  count: number;
  contributors: number;
  locked?: boolean;
}) {
  return (
    <div>
      <p className="font-heading text-page text-balance">{EVENT.name}</p>
      {!locked && (
        <>
          <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-faint">Hosted by</span>
              <Avatar seed={HOST.seed} size="sm">
                <AvatarFallback>{HOST.displayName.slice(0, 1)}</AvatarFallback>
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
          {/* One template literal, never a number beside text split over a
              line break (`identity-door`'s measured finding: the space
              between them can be eaten). */}
          <p className="mt-1 text-xs text-muted-foreground">
            {contributors > 0
              ? `${count} ${count === 1 ? "photo" : "photos"} & videos from ${contributors} ${contributors === 1 ? "guest" : "guests"}`
              : `${count} ${count === 1 ? "photo" : "photos"} & videos`}
          </p>
        </>
      )}
    </div>
  );
}

/** One photograph on the ruled column rule, in the shipped tile. `landed`
 *  writes the grid's own `data-landed`, so arrival.css (which the masonry
 *  import above brings in) plays its one pass of light across it. */
function AlbumTile({ item, landed }: { item: GridMedia; landed: boolean }) {
  return (
    <div
      data-media-tile
      data-landed={landed ? "" : undefined}
      style={
        {
          aspectRatio: `${item.width} / ${item.height}`,
          borderRadius: "var(--radius-tile)",
        } as CSSProperties
      }
      className="relative w-full overflow-hidden bg-black/10"
    >
      <MediaTile item={item} playBadge="none" />
    </div>
  );
}

/**
 * THE ALBUM, ON THE SHIPPED COLUMN RULE (`gallery-width`'s law, worn): a
 * column WIDTH, so a 375 phone lays two columns. `prefix` is what stands at
 * the album's head before the first photograph (a stack in flight, a held
 * tile), exactly the seam `guest-masonry.tsx` renders it through.
 * `landedId` is the guest's own newest landing (`landing=sweep`); it keys on
 * the dock's replay so the light can be run again.
 */
export function Album({
  items,
  prefix,
  landedId,
}: {
  items: GridMedia[];
  prefix?: ReactNode;
  landedId?: string;
}) {
  const runId = useRunId();
  return (
    <div className="px-5 pb-8">
      <div className={GALLERY_COLUMNS}>
        {prefix}
        {items.map((item) => {
          const landed = item.id === landedId;
          return (
            <div
              key={landed ? `${item.id}-${runId}` : item.id}
              className="mb-[var(--gap-gallery)] w-full break-inside-avoid"
            >
              <AlbumTile item={item} landed={landed} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The corner the reel's tile wears once a guest's photograph is in the take:
 *  `reel-front`'s drawing of its recommended `yours=badge`, quoted (that board
 *  asks; this one only stands beside it, as `guest-capture` does). */
function YoursChip() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-[oklch(0.32_0.09_300)]/90 px-2 py-0.5 text-label font-semibold text-white uppercase backdrop-blur-sm">
      <Sparkles className="size-2.5" aria-hidden />
      Yours is in it
    </span>
  );
}

/**
 * THE REEL'S TILE AT THE ALBUM'S HEAD, on the shipped reel face (`PosterCard`),
 * resting on one still. The reel is the event's live montage from its third
 * item, so every album scene here has one; `yours` draws its corner only when
 * one of the viewer's own photographs is in the approved take.
 */
export function ReelTile({ count, yours }: { count: number; yours: boolean }) {
  const meta = formatReelMeta({
    styleLabel: resolveStyleEntry(DEFAULT_STYLE_ID).label,
    momentCount: count,
  });
  return (
    <div data-vg-reel className="px-5 pt-5 pb-4">
      <PosterCard
        eventName={EVENT.name}
        meta={meta}
        chip={yours ? <YoursChip /> : undefined}
        media={
          <div className="relative aspect-[2/1] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the engine's resting frame */}
            <img
              src={REEL_STILL}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        }
      />
    </div>
  );
}

/** The whole album ground: header, the words column's post-upload slot, the
 *  reel's tile, the album, and whatever floats over it. Every option of a
 *  decision holds this steady and moves only its own words. */
export function AlbumGround({
  header,
  slot,
  reel,
  prefix,
  items,
  landedId,
  overlay,
}: {
  header: ReactNode;
  /** The post-upload slot's card, or nothing. */
  slot?: ReactNode;
  reel: { count: number; yours: boolean };
  prefix?: ReactNode;
  items: GridMedia[];
  landedId?: string;
  /** A sheet or dialog over the page, quoted. */
  overlay?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      {header}
      {slot && <div className="px-5 pt-5">{slot}</div>}
      <ReelTile {...reel} />
      <Album items={items} prefix={prefix} landedId={landedId} />
      {overlay}
    </div>
  );
}

/* ── the door: the page behind it, then the held drawer ───────────────────── */

/**
 * THE DOOR'S PHONE HALF, QUOTED (`entry-shell.tsx`): the overlay, then the
 * vaul drawer's own classes, HELD (no handle: the door has no exit). The
 * `data-entry-drawer` hook is the shipped one, so globals.css gives the
 * welcome its ratified 55svh presence here exactly as on a phone (`svh`
 * inside a frame is the frame's own height). `relative pt-1` is the step
 * container every step sits in (`entry-modal.tsx`).
 */
export function DoorGround({
  locked,
  behind,
  children,
}: {
  /** A password event before its door: the name, the count, the river. */
  locked: boolean;
  /** The teaser behind an open door, blurred by the overlay. */
  behind?: GridMedia[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestHeader who={{ kind: "stranger" }} />
      <div className="px-5 pt-6">
        <EventHead
          count={EVENT.approvedTotal}
          contributors={EVENT.contributorCount}
          locked={locked}
        />
        {locked ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lock className="size-4" aria-hidden />
              <p className="text-reading">
                {`${EVENT.approvedTotal} photos & videos inside`}
              </p>
            </div>
            <GhostRiver />
          </div>
        ) : null}
      </div>
      {!locked && behind ? (
        <div className="pt-4">
          <Album items={behind} />
        </div>
      ) : null}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
        <div
          data-entry-drawer
          className="fixed inset-x-0 bottom-0 flex max-h-[85svh] flex-col overflow-y-auto rounded-t-float bg-popover px-6 pt-3 pb-6 text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10 outline-none"
        >
          <div className="relative pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ── the album's two floating layers, quoted ──────────────────────────────── */

/** The close button both primitives draw by default, inert here. */
function QuotedClose({ className }: { className: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      tabIndex={-1}
      aria-label="Close"
    >
      <XIcon />
    </Button>
  );
}

/**
 * THE RESPONSIVE SHEET'S PHONE POSTURE (`ui/sheet.tsx` with
 * `floatingEdgeEntranceResponsive`, below 640): a bottom sheet to 85svh with
 * the floating corner, the layer shadow and its own close. The failure sheet
 * wears it (`SheetContent responsive className="overflow-y-auto"`).
 */
export function BottomSheet({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
      <div
        data-vg-sheet
        className="fixed inset-x-0 bottom-0 flex max-h-[85svh] w-full flex-col gap-4 overflow-y-auto rounded-t-float border-t bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer"
      >
        {children}
        <QuotedClose className="absolute top-3 right-3" />
      </div>
    </div>
  );
}

/**
 * THE CENTRED DIALOG (`ui/dialog.tsx`), the shape the capture's door opens in
 * today: the floating panel, centred, a hair narrower than the phone, with its
 * own close.
 */
export function CentredDialog({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
      <div
        data-vg-dialog
        className={`fixed top-1/2 left-1/2 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 p-4 text-sm outline-none ${floatingPanel}`}
      >
        {children}
        <QuotedClose className="absolute top-2 right-2" />
      </div>
    </div>
  );
}
