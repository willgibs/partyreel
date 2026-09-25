"use client";

import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  clipMeta,
  HandRoom,
  Head,
  LaptopBench,
  MakeButton,
  MarkLine,
} from "./bench";
import { fillIds, poolFor, STYLES } from "./fixtures";
import type { FillId, Maker } from "./fixtures";
import {
  AlbumStrip,
  Fills,
  LookDial,
  LookDots,
  LookRail,
  LookWall,
  MomentGrid,
  OrderStrip,
  PanelLabel,
  Tray,
} from "./parts";
import { StackingClip } from "./ground";
import { ClipStill, useLookThumbs, useStill } from "./stills";

/**
 * THE THREE DIRECTIONS, EACH A WHOLE CREATOR (Will's note on round one's
 * `moments`: the media selection and the style selector redesigned INTO the
 * workbench, not detached config screens for the same clip).
 *
 *  - `column`: the bench's panel holds both, the looks above the moments, one
 *    scroll and nothing to open; in a hand the same column scrolls under the
 *    clip, which gives way as it goes.
 *  - `strip`: each lives where it acts. The filmstrip the bench already has
 *    becomes the album (the clip's moments lit and numbered first), and the
 *    panel is the wall of looks; in a hand, the clip, the strip and a row of
 *    looks share one screen.
 *  - `dial`: the clip wears the look. Its name turns on a dial under the clip
 *    (a swipe in a hand) and the panel is the album; in a hand the album rises
 *    under the clip from the filmstrip's +.
 *
 * ★ ROUND ONE'S TRAY OF FIVE IS THREE IN EVERY DIRECTION, because Moments and
 * Style no longer open anything: Length, Layout and the opening shot each show
 * their value and open a small menu (a carried call on the board).
 *
 * ★ EVERY PICTURE OF THE CLIP IS THE ENGINE'S, keyed by what the knobs say it
 * wears (stills.tsx). The meta line and every count come from the same
 * fixtures the engine drew from, so the words and the frame cannot drift.
 */

export type Plan = "paid" | "free";

/** What the knobs say about the clip being made. */
export type World = {
  look: string;
  fill: FillId;
  plan: Plan;
  maker: Maker;
};

export type Direction = "column" | "strip" | "dial";

/** The moments already drawn when the export's minute is caught mid-way. */
const MAKING_LEFT = 3;

/** One direction's shared wiring: the members, the pool, the stills. */
function useClip(world: World) {
  const ids = fillIds(world.fill, world.maker);
  const pool = poolFor(world.maker);
  const free = world.plan === "free";
  const hero = useStill({
    style: world.look,
    fill: world.fill,
    maker: world.maker,
    mark: free,
    size: "hero",
  });
  const thumbs = useLookThumbs(world.fill, world.maker);
  const lookLabel =
    STYLES.find((s) => s.id === world.look)?.label ?? STYLES[0].label;
  return { ids, pool, free, hero, thumbs, lookLabel };
}

/**
 * Brings a descendant into view inside a real scroll box, the way a reader's
 * own scroll would have left it: a phone's "scrolled to the moments" is a
 * scroll position, not a different layout. Re-applied as the frame's copied
 * sheets land (the first layout in a portalled frame is unstyled).
 */
function useScrolledTo<T extends HTMLElement>(
  selector: string | null,
  axis: "x" | "y",
  offset = 0,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const host = ref.current;
    // The ref may sit on the scroll box itself or on a wrapper around a piece
    // that owns one (the strip, the row of looks).
    const box = host?.matches("[data-rc-scroll]")
      ? host
      : host?.querySelector<HTMLElement>("[data-rc-scroll]");
    const win = box?.ownerDocument.defaultView;
    if (!box || !win || !selector) return;
    const apply = () => {
      const target = box.querySelector<HTMLElement>(selector);
      if (!target) return;
      const b = box.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      if (axis === "y") box.scrollTop += t.top - b.top - offset;
      else box.scrollLeft += t.left - b.left - offset;
    };
    apply();
    const ro = new win.ResizeObserver(apply);
    ro.observe(box);
    const timers = [120, 500, 1200, 2400].map((ms) =>
      win.setTimeout(apply, ms),
    );
    return () => {
      ro.disconnect();
      timers.forEach((t) => win.clearTimeout(t));
    };
  }, [selector, axis, offset]);
  return ref;
}

/** The clip's own frame, or its stack while it is being drawn. */
function ClipOrStack({
  hero,
  making,
  total,
  compact,
}: {
  hero: string | null;
  making?: boolean;
  total: number;
  compact?: boolean;
}) {
  return making ? (
    <StackingClip
      src={hero}
      left={MAKING_LEFT}
      total={total}
      compact={compact}
    />
  ) : (
    <ClipStill src={hero} label="Your clip, one frame" />
  );
}

/** The bench's foot at a laptop: the order on the left, the tray on the right. */
function OrderFoot({ ids, free }: { ids: readonly string[]; free: boolean }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0 flex-1">
        {/* The shipped filmstrip's own hint, with the noun it carries now. */}
        <OrderStrip
          ids={ids}
          tile={44}
          note="Hold a moment to reorder, the clip keeps playing"
        />
      </div>
      <Tray free={free} className="shrink-0 pb-5" />
    </div>
  );
}

/* ── column: both in the panel, one scroll ───────────────────────────────── */

function ColumnBody({
  world,
  thumbs,
  ids,
  pool,
  lookLabel,
  lookCols,
  momentCols,
}: {
  world: World;
  thumbs: ReadonlyMap<string, string>;
  ids: readonly string[];
  pool: ReturnType<typeof poolFor>;
  lookLabel: string;
  lookCols: number;
  momentCols: number;
}) {
  return (
    <>
      <section data-rc-section="look">
        <PanelLabel aside={`${STYLES.length} looks`}>
          {`Look · ${lookLabel}`}
        </PanelLabel>
        <LookWall thumbs={thumbs} picked={world.look} cols={lookCols} />
      </section>
      <div aria-hidden className="my-5 h-px bg-white/10" />
      <section data-rc-section="moments">
        <PanelLabel aside={`${ids.length} in your clip`}>Moments</PanelLabel>
        <Fills fill={world.fill} className="mb-3" />
        <MomentGrid pool={pool} ids={ids} cols={momentCols} />
      </section>
    </>
  );
}

function ColumnLaptop({ world, making }: { world: World; making?: boolean }) {
  const { ids, pool, free, hero, thumbs, lookLabel } = useClip(world);
  return (
    <LaptopBench
      head={
        <Head
          meta={clipMeta(world.look, ids.length)}
          right={<MakeButton making={making} />}
        />
      }
      clip={<ClipOrStack hero={hero} making={making} total={ids.length} />}
      underClip={free ? <MarkLine maker={world.maker} /> : null}
      column={
        <ColumnBody
          world={world}
          thumbs={thumbs}
          ids={ids}
          pool={pool}
          lookLabel={lookLabel}
          lookCols={7}
          momentCols={7}
        />
      }
      foot={<OrderFoot ids={ids} free={free} />}
      inert={making}
    />
  );
}

/** In a hand: the clip on top, the order under it, the same column scrolling
 *  beneath. `at="moments"` is the column scrolled down, the clip docked small
 *  beside its order so the bench gets the room. */
function ColumnHand({
  world,
  at,
  making,
}: {
  world: World;
  at: "looks" | "moments";
  making?: boolean;
}) {
  const { ids, pool, free, hero, thumbs, lookLabel } = useClip(world);
  const scroller = useScrolledTo<HTMLDivElement>(
    at === "moments" ? '[data-rc-section="moments"]' : null,
    "y",
    96,
  );
  const docked = at === "moments";
  return (
    <HandRoom
      head={
        <Head
          meta={clipMeta(world.look, ids.length)}
          right={<MakeButton making={making} compact />}
        />
      }
    >
      {docked ? (
        <div className="flex shrink-0 items-end gap-3 px-4 pt-1 pb-3">
          <div className="w-[92px] shrink-0">
            <ClipOrStack
              hero={hero}
              making={making}
              total={ids.length}
              compact
            />
          </div>
          <div className="min-w-0 flex-1 pb-0.5">
            <OrderStrip ids={ids} tile={30} />
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col items-center gap-3 px-4 pt-1 pb-3">
          <div className="w-[168px]">
            <ClipOrStack
              hero={hero}
              making={making}
              total={ids.length}
              compact
            />
          </div>
          {free ? <MarkLine maker={world.maker} align="center" /> : null}
          <div className="w-full">
            <OrderStrip ids={ids} tile={32} />
          </div>
        </div>
      )}
      <div
        ref={scroller}
        data-rc-scroll
        data-rc-column
        data-rc-inert={making ? "" : undefined}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto border-t border-white/10 px-4 pt-3 pb-4",
          making && "opacity-35",
        )}
      >
        <div
          aria-hidden
          className="mx-auto -mt-1 mb-2.5 h-1 w-9 rounded-full bg-white/20"
        />
        <ColumnBody
          world={world}
          thumbs={thumbs}
          ids={ids}
          pool={pool}
          lookLabel={lookLabel}
          lookCols={4}
          momentCols={4}
        />
      </div>
      <div className="shrink-0 border-t border-white/10 px-4 pt-2.5 pb-4">
        <Tray compact free={free} inert={making} />
      </div>
    </HandRoom>
  );
}

/* ── strip: moments along the filmstrip, looks in the panel ──────────────── */

/**
 * The panel as the wall of looks: five columns, so all fourteen stand at a
 * readable size in three rows with no scroll. The wall is held to the width
 * three rows fit in, and the panel's own padding takes the rest.
 */
function StripWall({
  thumbs,
  picked,
  lookLabel,
}: {
  thumbs: ReadonlyMap<string, string>;
  picked: string;
  lookLabel: string;
}) {
  return (
    <section data-rc-section="look" className="mx-auto max-w-[574px]">
      <PanelLabel aside={`${STYLES.length} looks`}>
        {`Look · ${lookLabel}`}
      </PanelLabel>
      <LookWall thumbs={thumbs} picked={picked} cols={5} />
    </section>
  );
}

function StripLaptop({ world, making }: { world: World; making?: boolean }) {
  const { ids, pool, free, hero, thumbs, lookLabel } = useClip(world);
  return (
    <LaptopBench
      head={
        <Head
          meta={clipMeta(world.look, ids.length)}
          right={<MakeButton making={making} />}
        />
      }
      clip={<ClipOrStack hero={hero} making={making} total={ids.length} />}
      underClip={free ? <MarkLine maker={world.maker} /> : null}
      column={
        <StripWall thumbs={thumbs} picked={world.look} lookLabel={lookLabel} />
      }
      foot={
        <AlbumStrip
          pool={pool}
          ids={ids}
          fill={world.fill}
          tile={41}
          trailing={<Tray free={free} />}
        />
      }
      inert={making}
    />
  );
}

/** In a hand: the clip, the strip, a row of looks and the tray, one screen.
 *  `at="adding"` is the strip scrolled into the album and the row into the
 *  treatments: nothing moved but two thumbs. */
function StripHand({
  world,
  at,
  making,
}: {
  world: World;
  at: "rest" | "adding";
  making?: boolean;
}) {
  const { ids, pool, free, hero, thumbs, lookLabel } = useClip(world);
  const strip = useScrolledTo<HTMLDivElement>(
    at === "adding" ? "[data-rc-strip-divider]" : null,
    "x",
    150,
  );
  const rail = useScrolledTo<HTMLDivElement>(
    at === "adding" ? '[data-rc-look-id="polaroid"]' : null,
    "x",
    16,
  );
  return (
    <HandRoom
      head={
        <Head
          meta={clipMeta(world.look, ids.length)}
          right={<MakeButton making={making} compact />}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col items-center px-4 pt-1">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="relative aspect-[9/16] h-full">
            <ClipOrStack
              hero={hero}
              making={making}
              total={ids.length}
              compact
            />
          </div>
        </div>
        {free ? <MarkLine maker={world.maker} align="center" /> : null}
      </div>
      <div
        data-rc-inert={making ? "" : undefined}
        className={cn(
          "flex shrink-0 flex-col gap-3 px-4 pt-3",
          making && "opacity-35",
        )}
      >
        <div ref={strip} data-rc-strip-host>
          <AlbumStrip pool={pool} ids={ids} fill={world.fill} tile={38} />
        </div>
        <section data-rc-section="look">
          <PanelLabel aside={`${STYLES.length} looks`}>
            {`Look · ${lookLabel}`}
          </PanelLabel>
          <div ref={rail}>
            <LookRail thumbs={thumbs} picked={world.look} w={64} />
          </div>
        </section>
      </div>
      <div className="shrink-0 px-4 pt-2 pb-4">
        <Tray compact free={free} inert={making} />
      </div>
    </HandRoom>
  );
}

/* ── dial: the clip wears the look, the panel is the album ───────────────── */

/** The swipe's affordance on the clip itself: two quiet chevrons at its edges. */
function SwipeEdges() {
  return (
    <>
      <span
        aria-hidden
        className="absolute top-1/2 left-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white/80 backdrop-blur-sm"
      >
        <ChevronLeft className="size-4" />
      </span>
      <span
        aria-hidden
        className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white/80 backdrop-blur-sm"
      >
        <ChevronRight className="size-4" />
      </span>
    </>
  );
}

function AlbumPanel({
  world,
  ids,
  pool,
  cols,
  done,
}: {
  world: World;
  ids: readonly string[];
  pool: ReturnType<typeof poolFor>;
  cols: number;
  done?: boolean;
}) {
  return (
    <section data-rc-section="moments">
      <PanelLabel
        aside={
          done ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-caption font-medium text-zinc-900">
              Done
            </span>
          ) : (
            `${ids.length} in your clip`
          )
        }
      >
        {done ? `Moments · ${ids.length} in your clip` : "Moments"}
      </PanelLabel>
      <Fills fill={world.fill} className="mb-3" />
      <MomentGrid pool={pool} ids={ids} cols={cols} />
    </section>
  );
}

function DialLaptop({ world, making }: { world: World; making?: boolean }) {
  const { ids, pool, free, hero } = useClip(world);
  return (
    <LaptopBench
      head={
        <Head
          meta={clipMeta(world.look, ids.length)}
          right={<MakeButton making={making} />}
        />
      }
      clip={
        <>
          <ClipOrStack hero={hero} making={making} total={ids.length} />
          {making ? null : <SwipeEdges />}
        </>
      }
      underClip={
        <div
          className={cn("w-full pt-3", making && "opacity-35")}
          data-rc-section="look"
          data-rc-inert={making ? "" : undefined}
        >
          <LookDial picked={world.look} reach={1} />
          {free ? <MarkLine maker={world.maker} align="center" /> : null}
        </div>
      }
      column={<AlbumPanel world={world} ids={ids} pool={pool} cols={6} />}
      foot={<OrderFoot ids={ids} free={free} />}
      inert={making}
    />
  );
}

/** In a hand: the clip big, swiped for its look, the dial naming it; the
 *  filmstrip's + raises the album under the clip (`at="moments"`), never
 *  over it, and Done lowers it again. */
function DialHand({
  world,
  at,
  making,
}: {
  world: World;
  at: "looks" | "moments";
  making?: boolean;
}) {
  const { ids, pool, free, hero } = useClip(world);
  const open = at === "moments";
  return (
    <HandRoom
      head={
        <Head
          meta={clipMeta(world.look, ids.length)}
          right={<MakeButton making={making} compact />}
        />
      }
    >
      <div
        className={cn(
          "flex flex-col items-center px-4 pt-1",
          open ? "shrink-0" : "min-h-0 flex-1",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center justify-center",
            open ? "h-[232px]" : "min-h-0 flex-1",
          )}
        >
          <div className="relative aspect-[9/16] h-full">
            <ClipOrStack
              hero={hero}
              making={making}
              total={ids.length}
              compact
            />
            {making || open ? null : <SwipeEdges />}
          </div>
        </div>
        <div
          data-rc-section="look"
          data-rc-inert={making ? "" : undefined}
          className={cn("w-full pt-2.5", making && "opacity-35")}
        >
          <LookDial picked={world.look} reach={1} />
          {open ? null : (
            <div className="pt-1.5">
              <LookDots picked={world.look} />
            </div>
          )}
        </div>
        {free && !open ? <MarkLine maker={world.maker} align="center" /> : null}
      </div>
      <div
        data-rc-inert={making ? "" : undefined}
        className={cn("shrink-0 px-4 pt-3", making && "opacity-35")}
      >
        <OrderStrip ids={ids} tile={open ? 30 : 32} />
      </div>
      {open ? (
        <div
          data-rc-scroll
          data-rc-column
          className="mt-2 min-h-0 flex-1 overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[oklch(0.14_0_0)] px-4 pt-3 pb-4"
        >
          <AlbumPanel world={world} ids={ids} pool={pool} cols={4} done />
        </div>
      ) : (
        <div className="shrink-0 px-4 pt-2.5 pb-4">
          <Tray compact free={free} inert={making} />
        </div>
      )}
    </HandRoom>
  );
}

/* ── the map from a direction to its three frames ────────────────────────── */

export function LaptopFor({
  dir,
  world,
  making,
}: {
  dir: Direction;
  world: World;
  making?: boolean;
}): ReactNode {
  if (dir === "column") return <ColumnLaptop world={world} making={making} />;
  if (dir === "strip") return <StripLaptop world={world} making={making} />;
  return <DialLaptop world={world} making={making} />;
}

/** The two moments of each direction's phone form, in reading order. */
export const HAND_MOMENTS: Record<
  Direction,
  readonly [{ title: string; at: string }, { title: string; at: string }]
> = {
  column: [
    { title: "the looks at the top of the column", at: "looks" },
    { title: "scrolled to the moments, the clip docked", at: "moments" },
  ],
  strip: [
    { title: "the whole creator on one screen", at: "rest" },
    { title: "the strip scrolled into the album", at: "adding" },
  ],
  dial: [
    { title: "swiping the clip through its looks", at: "looks" },
    { title: "the album risen under the clip", at: "moments" },
  ],
};

export function HandFor({
  dir,
  world,
  at,
  making,
}: {
  dir: Direction;
  world: World;
  at: string;
  making?: boolean;
}): ReactNode {
  if (dir === "column")
    return (
      <ColumnHand
        world={world}
        at={at === "moments" ? "moments" : "looks"}
        making={making}
      />
    );
  if (dir === "strip")
    return (
      <StripHand
        world={world}
        at={at === "adding" ? "adding" : "rest"}
        making={making}
      />
    );
  return (
    <DialHand
      world={world}
      at={at === "moments" ? "moments" : "looks"}
      making={making}
    />
  );
}
