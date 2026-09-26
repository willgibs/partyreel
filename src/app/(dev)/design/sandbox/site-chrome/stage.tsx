"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Frame } from "@/components/lab";
import { cn } from "@/lib/utils";

/**
 * THE GROUND EVERY OPTION STANDS ON, AND THE NUMBERS UNDER IT.
 *
 * ★ A BREAKPOINT IS ONLY TRUE INSIDE A FRAME. The header's whole shape turns
 * on one `md` split (the panels hide, the hamburger appears) and the footer's
 * on `lg`. A Tailwind prefix inside a plain div reads the BROWSER's width, so
 * a bar judged on a stage is a bar nobody will ever see. Every option here is
 * a real 1440 viewport and a real 375 viewport, one above the other.
 *
 * ★ EVERY REVEAL IS FORCED OPEN. `[data-mkt-reveal]` rests at opacity 0 until
 * an ancestor carries `data-inview="true"`, which the real page gets from an
 * IntersectionObserver as you scroll. A still preview never scrolls, so the
 * root carries the attribute itself and the footer's sign-off draws in its
 * final state rather than fading in while the demo gate takes its picture.
 *
 * ★ AND THE CAPTION IS MEASURED IN THE FRAME, NEVER COMPUTED. Three numbers,
 * all read off the laid-out page inside the frame: how tall the bar runs, how
 * tall an open panel runs, and how many windows of this viewport the footer
 * takes. If the caption and the board's words disagree, the caption is true.
 */

export type Measured = {
  /** The header bar's own height, or -1 when the option draws no bar. */
  bar: number;
  /** An open mega panel's height, or -1. */
  panel: number;
  /** The footer's height, or -1. */
  foot: number;
};

const EMPTY: Measured = { bar: -1, panel: -1, foot: -1 };

/**
 * Reads the laid-out scene from inside the frame's own document.
 *
 * The subtree lives in the iframe, so it is watched with THAT window's
 * `ResizeObserver`: it fires when the copied stylesheets land (the first
 * layout is unstyled) and again whenever a new option reflows. A hidden option
 * on the step's stage is `visibility: hidden`, which keeps its layout, so it
 * measures true as well. The late timer is for the photographs: the frame and
 * the wall both land after layout and both push a register's height.
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
    const hOf = (sel: string) => {
      const node = el.querySelector<HTMLElement>(sel);
      return node ? Math.round(node.getBoundingClientRect().height) : -1;
    };
    const read = () =>
      report.current({
        bar: hOf("[data-sc-bar]"),
        panel: hOf("[data-slot=navigation-menu-viewport]"),
        foot: hOf("[data-sc-foot]"),
      });
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    el.querySelectorAll("*").forEach((n) => ro.observe(n));
    const t = win.setTimeout(read, 700);
    return () => {
      ro.disconnect();
      win.clearTimeout(t);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

export type Ground = "cinema" | "paper" | "ink";

/** The grounds the chrome renders on, as the route groups declare them. */
const GROUND: Record<Ground, string> = {
  cinema: "dark bg-background text-foreground",
  paper: "surface-paper bg-background text-foreground",
  // The slab paints its own background; the page around it is paper.
  ink: "surface-paper bg-background text-foreground",
};

export function Scene({
  id,
  w,
  h,
  ground = "cinema",
  title,
  note,
  children,
}: {
  id: string;
  w: number;
  h: number;
  ground?: Ground;
  title: string;
  /** The board's own words for this option, read beside the measured line. */
  note?: string;
  children: ReactNode;
}) {
  const [m, setM] = useState<Measured>(EMPTY);
  const onMeasure = useCallback((next: Measured) => {
    setM((prev) =>
      prev.bar === next.bar &&
      prev.panel === next.panel &&
      prev.foot === next.foot
        ? prev
        : next,
    );
  }, []);

  const measured =
    m === EMPTY
      ? "measuring"
      : [
          m.bar >= 0 ? `the bar ${m.bar} px` : "no bar at this scroll",
          m.panel > 0 ? `the panel ${m.panel} px` : null,
          m.foot > 0
            ? `the foot ${m.foot.toLocaleString()} px, ${(m.foot / h).toFixed(1)} windows`
            : null,
          // ★ A FRAME SHORTER THAN ITS PART SAYS SO. A `Frame` is a real
          // viewport, so content past its height scrolls INSIDE it and a still
          // capture ends where the box ends. The footer decisions draw a slab
          // that runs past two thousand pixels at a phone: a reviewer reading a
          // cut column as the end of the footer would be judging a length that
          // is not the one measured.
          m.foot > h + 4
            ? `the frame shows the first ${h.toLocaleString()}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <Frame
      id={`sc-${id}`}
      w={w}
      h={h}
      title={title}
      caption={
        <>
          {note ? <span className="block">{note}</span> : null}
          <span className="block tabular-nums">{measured}</span>
        </>
      }
    >
      <div
        className={cn("relative min-h-full", GROUND[ground])}
        data-mkt=""
        // The route group's own attribute, and the frame IS the page here, so
        // the `body:has([data-mkt-skin=...])` chrome rules resolve the way they
        // do on the site.
        data-mkt-skin={ground === "cinema" ? "cinema" : "paper"}
        data-inview="true"
        onClickCapture={(e) => {
          // A press inside a preview is looking, not leaving.
          const el = e.target as HTMLElement;
          if (el.closest?.("a[href]")) e.preventDefault();
        }}
      >
        {/* ★ THE PANEL IS HELD AT ITS END STATE. The mega panel's viewport and
            its content both run an entrance animation on mount, and the board
            opens a panel WITHOUT a pointer, so a capture taken during those
            200 ms reads as a half-faded, half-slid panel. Nothing here asks
            about the entrance (the 2026-08-28 nav round answered it), so it
            is pinned open and every capture can be trusted. The `.mkt-line`
            and reveal registers are the same story. */}
        <style>{`
[data-slot=navigation-menu-viewport],[data-slot=navigation-menu-content]{animation:none!important;opacity:1!important;transform:none!important;filter:none!important}
[data-mkt] .mkt-line{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        <Measure onMeasure={onMeasure}>{children}</Measure>
      </div>
    </Frame>
  );
}

/**
 * The 1440 scene and the 375 scene, one above the other: the convention every
 * decision on this board reuses, so a reviewer meets one shape rather than
 * eight. The phone decision draws its own column and does not call this.
 */
export function Widths({
  id,
  ground,
  desktopH,
  phoneH,
  note,
  render,
}: {
  id: string;
  ground?: Ground;
  desktopH: number;
  phoneH: number;
  note?: string;
  render: (width: 1440 | 375) => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Scene
        id={`${id}-1440`}
        w={1440}
        h={desktopH}
        ground={ground}
        title="1440"
        note={note}
      >
        {render(1440)}
      </Scene>
      <Scene
        id={`${id}-375`}
        w={375}
        h={phoneH}
        ground={ground}
        title="375"
        note={note}
      >
        {render(375)}
      </Scene>
    </div>
  );
}

/** One 375 viewport on its own, for the decisions whose evidence IS a phone. */
export function PhoneScene({
  id,
  h = 812,
  ground,
  title,
  note,
  children,
}: {
  id: string;
  h?: number;
  ground?: Ground;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <Scene id={id} w={375} h={h} ground={ground} title={title} note={note}>
      {children}
    </Scene>
  );
}
