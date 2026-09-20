"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Bell } from "lucide-react";

import { Frame, useLabPrefs } from "@/components/lab";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * THE SHELL, ONE SHAPE, AT TWO REAL WINDOWS — round two's harness.
 *
 * Round one asked what the chrome should be (`nav`) and what it should become
 * in a hand (`phone`); both are ruled and wired (`nav=crumbs`, `phone=same`,
 * `home-wiring`/`hub-wiring`, 2026-09-20). So every preview here sits inside
 * the REAL shipped `AppShell` — the same import production uses, not a
 * redrawing of it — at whichever real viewport the SIZE control asks for.
 * `phone=same` already means one shape holds both sizes, exactly as `AppShell`
 * draws it today; there is no separate phone-shaped chrome left to build, and
 * the dashboard claims no crumb trail (`SetCrumbs`), so `AppShell`'s bar reads
 * here exactly as `/dashboard` reads it.
 *
 * `Screen`/`Measure`/`Fit` are round one's harness, kept verbatim (a real
 * viewport, a real `ResizeObserver` reading the frame's own document, the
 * lab's Fit preference honoured): the `Place`/`ROOMS`/rail/crumb machinery
 * round one needed to compare three different chromes is gone with the asks
 * that needed it.
 */

/* ── The two windows ─────────────────────────────────────────────────────── */

export const SIZES = {
  laptop: { w: 1440, h: 900, name: "1440 x 900, a laptop" },
  phone: { w: 375, h: 812, name: "375 x 812, a phone" },
} as const;
export type Size = keyof typeof SIZES;

export const sizeOf = (v: string | undefined): Size =>
  v === "phone" ? "phone" : "laptop";

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
      // ★ THE COLUMNS ARE THE ALBUM'S, NOT EVERY TILE'S (see app-shape r1).
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
 * than imported because that board retired with its wiring). The step draws an
 * option at 1:1 and scrolls a wide one sideways, or fits it to the column under
 * the lab's Fit preference.
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

/* ── The one door every preview goes through ─────────────────────────────── */

/**
 * A stand-in seed per fixture host, so the header's avatar carries the same
 * deterministic gradient a real account would (`seed=account`, rulings.md).
 * Never the real `seedFor` — it is `server-only` (node:crypto) and this file
 * is "use client"; any stable string reads the same way to `orbFor`, and none
 * of these hosts is a real account id.
 */
export function HeaderFace({
  initial,
  seed,
}: {
  initial: string;
  seed: string;
}) {
  return (
    <Avatar seed={seed}>
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );
}

/**
 * The REAL `AppShell`, exactly as `(app)/layout.tsx` wraps every host page.
 * `headerActions` stands in for `NotificationBell` + `UserMenu` with a plain
 * bell glyph and the seeded avatar: nothing any of this round's three asks is
 * about, and the account menu's own doors are `you=?`'s wiring, already shipped.
 */
export function Chrome({
  hostInitial,
  hostSeed,
  children,
}: {
  hostInitial: string;
  hostSeed: string;
  children: ReactNode;
}) {
  return (
    <AppShell
      headerActions={
        <>
          <Bell className="size-4 text-muted-foreground" aria-hidden />
          <HeaderFace initial={hostInitial} seed={hostSeed} />
        </>
      }
    >
      <div data-as-room className="w-full min-w-0">
        {children}
      </div>
    </AppShell>
  );
}
