"use client";

import "./gallery-width.css";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Bell,
  Download,
  Eye,
  Globe,
  ImageUp,
  Images,
  ListChecks,
  QrCode,
  Settings,
  Users,
} from "lucide-react";

import { EventFilterPills } from "@/components/app/event-feed/event-filter-pills";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { Frame, useLabPrefs } from "@/components/lab";
import { Logo } from "@/components/shared/logo";
import { MasonryColumns } from "@/components/shared/masonry";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn, formatEventDate } from "@/lib/utils";

import { ALBUM, EVENT } from "./fixtures";

/**
 * THE TWO PAGES, AT A REAL WINDOW, WEARING THE CANDIDATE.
 *
 * Every picture on this board is one of two pages: the guest's event page and
 * the host's event page. Each is drawn inside a `Frame`, which is a real
 * viewport, so every breakpoint in the shipped components resolves at the
 * WINDOW being judged rather than at the lab page's width. The galleries are
 * the shipped components themselves (`GuestMasonry`, `MasonryColumns`) over
 * the stand-in album; the chrome around them is the shipped markup, copied
 * where the real component would reach for a session, a provider or the
 * network (the guest header reads the visitor's session; the command strip
 * needs the host's upload provider).
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED. A board once
 * drew an option with its formula's sign backwards and the tile Will judged
 * showed the opposite of its words (docs/PROGRAM.md). So the caption reads the
 * laid-out tiles inside the frame: how many distinct columns they fall in, and
 * how wide the first one is. If the words above a frame and the caption under
 * it disagree, the caption is the truth.
 */

/** The three windows: a laptop, a big laptop, a desktop. Heights are the
 *  screens', so a fitted frame keeps a real window's proportions. */
export const WINDOWS = {
  "1280": { w: 1280, h: 800, name: "a laptop" },
  "1512": { w: 1512, h: 982, name: "a big laptop" },
  "1920": { w: 1920, h: 1080, name: "a desktop" },
} as const;
export type WindowId = keyof typeof WINDOWS;

/**
 * Each tile option as the one number the candidate needs: the column WIDTH the
 * browser may not go under. The tile lands a little above it (the columns share
 * out the leftover), which is why the options are named by the tile they
 * measure rather than by this number. Each was chosen so its column count is
 * the same whether the gap is today's 3 px or family C's 4 px, and whether or
 * not the window shows a classic 15 px scrollbar.
 */
export const TILES = { "180": 170, "240": 220, "300": 280 } as const;
export type TileId = keyof typeof TILES;

/** How far the gallery runs: the window's edges, or the app's 1280 column. */
export type Width = "full" | "container";
/** Where the page's readable column sits: at the gallery's left edge, or
 *  centred as it is today. */
export type Words = "edge" | "centre";

/** Board state arrives as strings; anything unknown falls back to the board's
 *  recommendation, which is also each control's declared default. */
export const windowOf = (v: string | undefined): WindowId =>
  v && v in WINDOWS ? (v as WindowId) : "1512";
export const tileOf = (v: string | undefined): TileId =>
  v && v in TILES ? (v as TileId) : "240";
export const widthOf = (v: string | undefined): Width =>
  v === "container" ? "container" : "full";
export const wordsOf = (v: string | undefined): Words =>
  v === "centre" ? "centre" : "edge";

/** The app's `Container`, as classes, so a page can hold it or let it go. */
const GUTTER = "px-4 sm:px-6 lg:px-8";
const CONTAINER = `mx-auto w-full max-w-7xl ${GUTTER}`;

/* ── the measurement ─────────────────────────────────────────────────────── */

type Measured = { cols: number; tile: number };

/**
 * Reads the laid-out tiles from inside the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S. The subtree lives in the
 * iframe's document, so it is observed with that window's `ResizeObserver`. It
 * fires when the copied stylesheets land (the first layout is unstyled) and
 * whenever a new option re-flows the columns, which changes the gallery's
 * height even when its width holds. A hidden option on the step's stage is
 * `visibility: hidden`, which keeps its layout, so it measures true as well.
 */
function MeasureTiles({
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
      const tiles = el.querySelectorAll<HTMLElement>("[data-media-tile]");
      if (tiles.length === 0) return;
      const lefts = new Set<number>();
      tiles.forEach((t) =>
        lefts.add(Math.round(t.getBoundingClientRect().left)),
      );
      report.current({
        cols: lefts.size,
        tile: Math.round(tiles[0].getBoundingClientRect().width),
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
 * THE LAB'S FIT, KEPT BY A FRAME.
 *
 * The step draws every option at 1:1 and scrolls a wide one sideways, or fits
 * it to the column when the reader switches the lab to Fit (the stage head's
 * scale button). A `Stage` answers that preference by itself; a bare `Frame`
 * does not, so a 1920 window would stay 1:1 under Fit and the button would
 * seem to do nothing. This box answers it the way `Stage` does, and marks
 * itself `data-stage-fit` so the stage head reports the zoom it reads here.
 *
 * ★ ZOOMING A FRAME IS HONEST. CSS `zoom` on an iframe's ancestor scales the
 * picture and leaves the frame's own viewport alone: measured on this board, a
 * 1512 frame under `zoom: 0.5` still reports `innerWidth` 1512 and six columns
 * of 243 px, drawn 756 px wide on the glass.
 */
function WindowFit({ w, children }: { w: number; children: ReactNode }) {
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
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/**
 * One window: a frame at the window's true size, the page inside it, and the
 * measured columns and tile under its title.
 */
function Window({
  id,
  win,
  title,
  children,
}: {
  id: string;
  win: WindowId;
  title: string;
  children: ReactNode;
}) {
  const { w, h } = WINDOWS[win];
  const [m, setM] = useState<Measured | null>(null);
  return (
    <WindowFit w={w}>
      <Frame
        id={id}
        w={w}
        h={h}
        title={title}
        caption={
          m
            ? `${win} window: ${m.cols} columns of ${m.tile} px, measured in the frame`
            : `${win} window: measuring`
        }
      >
        <MeasureTiles
          onMeasure={(next) =>
            setM((prev) =>
              prev && prev.cols === next.cols && prev.tile === next.tile
                ? prev
                : next,
            )
          }
        >
          {children}
        </MeasureTiles>
      </Frame>
    </WindowFit>
  );
}

/** The candidate's one number, handed to the sheet. */
const colStyle = (tile: TileId) =>
  ({ "--gw-col": `${TILES[tile]}px` }) as CSSProperties;

/* ── the guest's event page ──────────────────────────────────────────────── */

/**
 * THE GUEST'S EVENT PAGE at a window, as `event-experience.tsx` lays it out,
 * with the one structural change the goal asks for: the page's `max-w-2xl`
 * column holds the WORDS (the header, the Add and the Save and Invite row), and
 * the gallery section leaves it. Today the one column holds everything, which
 * is what caps the album at 632 px on every screen.
 *
 * `width` is the gallery's box: the page's own 20 px gutter to the window's
 * edges, or the app's `Container`. `words` places the readable column: `edge`
 * lines its first letter up with the gallery's, `centre` is today's `mx-auto`.
 */
export function GuestPage({
  win,
  tile,
  width,
  words,
}: {
  win: WindowId;
  tile: TileId;
  width: Width;
  words: Words;
}) {
  const box = width === "full" ? "px-5" : CONTAINER;
  return (
    <Window
      id={`guest-${win}-${tile}-${width}-${words}`}
      win={win}
      title={`The guest's album, ${WINDOWS[win].name}`}
    >
      <div className="flex min-h-full flex-col bg-background text-foreground">
        {/* guest-header.tsx as a signed-out visitor sees it (the shipped one
            reads the session and asks the network who is looking). */}
        <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
          <Logo />
          <div className="flex h-8 items-center">
            <Button variant="ghost" size="sm">
              Start for free
            </Button>
          </div>
        </header>

        <div className="w-full flex-1 py-8">
          {words === "centre" ? (
            <div className="mx-auto w-full max-w-2xl px-5">
              <GuestWords />
            </div>
          ) : (
            <div className={box}>
              {/* Pulled out by the gutter and padded back in, so the measure
                  is today's 632 and the first letter sits on the gallery's
                  left edge. */}
              <div className="-mx-5 max-w-2xl px-5">
                <GuestWords />
              </div>
            </div>
          )}

          {/* live-gallery.tsx's section: its Download all row, then the
              masonry. mt-7 is the upload slot's margin the gallery sits under
              (an empty block, so the section's own mt-3 collapses into it). */}
          <section className={cn("mt-7", box)}>
            <div className="mb-3 flex justify-end">
              <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
                <Download className="size-4" /> Download all
              </span>
            </div>
            <div className="gw-grid" style={colStyle(tile)}>
              <GuestMasonry items={ALBUM} />
            </div>
          </section>
        </div>
      </div>
    </Window>
  );
}

/** event-experience.tsx's header and action block, as a guest meets them. */
function GuestWords() {
  return (
    <>
      <header>
        <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
        <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-faint">Hosted by</span>
            <span className="font-medium text-foreground">{EVENT.host}</span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{formatEventDate(EVENT.date)}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ALBUM.length} photos &amp; videos from {EVENT.guests} guests
        </p>
      </header>
      <div className="mt-4">
        <Button type="button" size="lg" className="w-full">
          <ImageUp /> Add photos
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-9 w-full">
            Save
          </Button>
          <Button variant="outline" className="h-9 w-full">
            Invite
          </Button>
        </div>
      </div>
    </>
  );
}

/* ── the host's event page ───────────────────────────────────────────────── */

/**
 * THE HOST'S EVENT PAGE at a window, as `dashboard/[eventId]/page.tsx` lays it
 * out inside `AppShell`: the header, the name and its stat line, the command
 * strip, the feed's pills, then the Gallery section. Today every part of it
 * sits in `Container`, 1280 at most and centred.
 *
 * `width="container"` is that page with the tile size. `width="full"` is the
 * guest album's rule carried over: the Gallery section (its header and its
 * grid) runs to the window's edges at the app's own gutter, and the page's
 * words go where the guest's went. Centred, they stay in today's `Container`
 * with the album spreading past it; at the edge, the header and the page's
 * column keep their width but let go of `mx-auto`, so the logo, the name, the
 * pills and the photographs share one left line, as the guest page does.
 */
export function HostPage({
  win,
  tile,
  width,
  words,
}: {
  win: WindowId;
  tile: TileId;
  width: Width;
  words: Words;
}) {
  const full = width === "full";
  const edge = full && words === "edge";
  // The page's column: today's Container, or the same column pinned left.
  const column = edge ? `w-full max-w-7xl ${GUTTER}` : CONTAINER;
  return (
    <Window
      id={`host-${win}-${tile}-${width}-${words}`}
      win={win}
      title={`The host's event page, ${WINDOWS[win].name}`}
    >
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <header className="border-b bg-background/80">
          <div
            className={cn(
              "flex h-14 items-center justify-between gap-4",
              edge ? GUTTER : CONTAINER,
            )}
          >
            <Logo />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell />
              </Button>
              <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                W
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 py-8">
          <div className={column}>
            <div className="space-y-8">
              <HostWords />
              {/* host-command-strip.tsx, closed. */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button className="sm:flex-1">
                  <QrCode /> Share
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    <ImageUp /> Add photos
                  </Button>
                  <Button variant="outline">
                    <Settings /> Settings
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-6">
              <div aria-hidden className="h-px w-full" />
              <EventFilterPills
                pills={[
                  { value: "all", label: "All" },
                  { value: "gallery", label: "Gallery", count: ALBUM.length },
                  { value: "reel", label: "Reel" },
                  { value: "guests", label: "Guests", count: EVENT.guests },
                ]}
                active="all"
                onSelect={() => {}}
                stuck={false}
              />
            </div>
          </div>

          {/* event-feed.tsx's Gallery section: the shared header, then the
              grid. `mt-6` is the feed's space-y-6 under the pills. */}
          <section
            aria-label="Gallery"
            className={cn("mt-6 space-y-2.5", full ? GUTTER : CONTAINER)}
          >
            <FeedSectionHeader
              label="Gallery"
              count={ALBUM.length}
              action={
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm">
                    <Download /> Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <ListChecks /> Select
                  </Button>
                </div>
              }
            />
            <div className="gw-grid" style={colStyle(tile)}>
              <MasonryColumns items={ALBUM} viewerIsHost clampAspect />
            </div>
          </section>
        </main>
      </div>
    </Window>
  );
}

/** The page's own header block: the way back, the name, its stat line and
 *  the two status chips, as the shipped page renders them. */
function HostWords() {
  return (
    <div className="space-y-4">
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Back to events
      </span>
      <div className="space-y-2">
        <PageHeading>{EVENT.name}</PageHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{formatEventDate(EVENT.date)}</span>
          <span className="flex items-center gap-1.5">
            <Images className="size-3.5" />
            {ALBUM.length}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {EVENT.guests}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            214
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            <Globe className="size-3" />
            Public
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Accepting uploads
          </span>
        </div>
      </div>
    </div>
  );
}
