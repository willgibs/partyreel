"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { AtSign, Check, Sparkles } from "lucide-react";

import { Frame, useLabPrefs } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";
import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import { formatReelMeta, PosterCard } from "@/components/reel/poster-card";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_STYLE_ID,
  resolveStyleEntry,
} from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { EVENT, PRIYA, REEL_STILL } from "./fixtures";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN, AND THE GROUND UNDER IT.
 *
 * ★ PHONE FIRST, 1440 ON THE KNOB (`media-viewer`, `guest-upload`,
 * `guest-shape`'s own framing carried here): Priya is standing at a party
 * holding a phone; 1440 exists so a card or a sheet is checked for the guest
 * who opens the link on a laptop later, never the primary read.
 *
 * ★ NOTHING HERE MAY REACH A SESSION, A SERVER FUNCTION OR THE NETWORK ON
 * MOUNT. `GuestHeader` resolves the visitor's Supabase session the instant it
 * mounts (its own comment: a client island because the page is hit by
 * anonymous crowds); inside a lab frame that would draw whoever is signed in
 * on THIS machine, not Priya. So the header below is QUOTED, exactly the
 * markup `profile-page`'s own `Head` already established the pattern for, and
 * every account-menu, follow, door and popover control on this board is
 * quoted the same way (`parts.tsx`'s own note): a Radix Portal (Dialog, Sheet,
 * Popover, DropdownMenu) escapes to the LAB PAGE's document when it opens
 * inside a portalled frame, not the phone being judged, which is the same
 * landmine `host-curation` names for its own lightbox.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

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
 *  discipline `media-viewer` and `host-curation` hold every caption to. */
function Measured({
  probe,
  deps,
  onMeasure,
  children,
}: {
  /** `null` means "not settled yet": the read is skipped rather than
   *  overwriting the caption with a lie (`media-viewer`'s own `Probe`). */
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
    const timers = [200, 900, 1800].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref}>{children}</div>;
}

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string | null;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/* ── the guest page's own ground ──────────────────────────────────────────── */

/**
 * THE HEADER, QUOTED. Three states `guest-header.tsx` really has, drawn from
 * fixed props rather than a resolved session: `cta` (a stranger), `named` (a
 * guest who typed a name and has not confirmed, wearing the plain disc: the
 * ground for `moment` and `shape`), `confirmed` (a fresh account, its own
 * colour, once the flow finishes: the ground for `follow` and `name`). The
 * markup, the classes and the h-8 slot that keeps the swap height-stable are
 * copied line for line; only the session read is gone.
 */
export function Header({ state }: { state: "cta" | "named" | "confirmed" }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        {state === "cta" && (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        )}
        {state === "named" && (
          <span className="flex items-center gap-2 rounded-full">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">
                {PRIYA.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-28 truncate text-sm">{PRIYA.name}</span>
          </span>
        )}
        {state === "confirmed" && (
          <Avatar size="sm" seed={PRIYA.seed}>
            <AvatarFallback className="text-[10px]">
              {PRIYA.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

/** One photograph on the ruled column rule, in the shipped tile. */
function StripTile({ item }: { item: GridMedia }) {
  return (
    <div
      data-media-tile
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

/** The strip of tiles under the ask, laid out on the ruled column rule with
 *  the shipped tile — `gallery-width`'s law, worn here rather than re-judged.
 *
 *  ★ A CAPTION RIDES INSIDE ITS TILE'S OWN COLUMN BLOCK. The album is one CSS
 *  multi-column box, so "a line under one photograph" can only be drawn by
 *  putting the line in the same `break-inside-avoid` block as the tile: then
 *  it stays under that photograph at every column count, which is the honest
 *  cost of the `shape` ask's inline option (a caption as narrow as a column). */
export function AlbumStrip({
  items,
  heading,
  caption,
}: {
  items: GridMedia[];
  /** A line above the grid ("Showing yours"), when one decision needs it. */
  heading?: ReactNode;
  /** A line under one tile, by the tile's id. */
  caption?: { id: string; node: ReactNode };
}) {
  return (
    <div data-gc-strip className="px-4 pb-6">
      {heading}
      <div className={GALLERY_COLUMNS}>
        {items.map((item) => (
          <div
            key={item.id}
            className="mb-[var(--gap-gallery)] w-full break-inside-avoid"
          >
            <StripTile item={item} />
            {caption?.id === item.id && (
              <div className="pt-2 pb-1">{caption.node}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The corner mark the reel's tile wears once a guest's photograph is in the
 *  take: `reel-front`'s own drawing of its recommended `yours=badge`, quoted
 *  so this board can show the beat that lands beside the offer without asking
 *  about it (that board asks; this one only stands next to it). */
function YoursChip() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-[oklch(0.32_0.09_300)]/90 px-2 py-0.5 text-label font-semibold text-white uppercase backdrop-blur-sm">
      <Sparkles className="size-2.5" aria-hidden />
      Yours is in it
    </span>
  );
}

/**
 * THE REEL'S TILE, AT THE ALBUM'S HEAD. The reel is the event's own live
 * montage from its third item, with no host action, and its tile is its own
 * slot directly above the album's first row, which puts it between the words
 * column (where this board's offer and moment cards stand) and her
 * photographs. Every scene here has well over three items, so every scene
 * draws it: each ask is judged beside the tile that really stands under it.
 *
 * Drawn on the shipped reel face (`PosterCard`, `formatReelMeta`), resting on
 * one still, because this board is not about the tile: `reel-front` asks what
 * it is, whether it plays and what its corner says, and its recommendations
 * are what it wears here. `data-gc-reel`, never `data-media-tile`, so the
 * `moment` count of photographs never counts the reel as one of them.
 */
export function ReelTile({ count }: { count: number }) {
  const meta = formatReelMeta({
    styleLabel: resolveStyleEntry(DEFAULT_STYLE_ID).label,
    momentCount: count,
  });
  return (
    <div data-gc-reel>
      <PosterCard
        eventName={EVENT.name}
        meta={meta}
        chip={<YoursChip />}
        media={
          <div className="relative aspect-[2/1] w-full sm:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still standing in for the engine's resting frame */}
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

/** The whole guest page's ground: header, then whatever the decision draws
 *  in the words column's post-upload slot, then the album's head (the reel's
 *  tile), then the album, then whatever the page carries after the album (the
 *  Guests list, which really does sit under every photograph). Every option
 *  holds this steady and moves only the one thing being asked. */
export function Ground({
  header,
  action,
  items,
  stripHeading,
  caption,
  after,
  reelCount = items.length,
}: {
  header: "cta" | "named" | "confirmed";
  /** The post-upload slot's card, or null when the decision puts nothing there. */
  action: ReactNode;
  items: GridMedia[];
  stripHeading?: ReactNode;
  caption?: { id: string; node: ReactNode };
  after?: ReactNode;
  /** What the reel counts: the whole album, even when a filter shows less. */
  reelCount?: number;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <Header state={header} />
      {action && (
        <div className="mx-auto max-w-[640px] px-4 pt-5">{action}</div>
      )}
      <div className="mx-auto max-w-[640px]">
        <div className="px-4 pt-5 pb-4">
          <ReelTile count={reelCount} />
        </div>
        <AlbumStrip items={items} heading={stripHeading} caption={caption} />
      </div>
      {after && (
        <div className="mx-auto max-w-[640px] px-4 pb-10">{after}</div>
      )}
    </div>
  );
}

/** The small success glyph the moment card and the confirm steps share, so
 *  "this is settled" reads the same way everywhere it appears. */
export function SettledMark() {
  return (
    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
      <Check className="size-3.5" aria-hidden />
    </span>
  );
}

export function HandleGlyph({ className }: { className?: string }) {
  return (
    <AtSign
      className={cn("size-4 shrink-0 text-muted-foreground", className)}
      aria-hidden
    />
  );
}
