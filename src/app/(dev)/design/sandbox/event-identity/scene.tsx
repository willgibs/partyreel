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
 * THE GROUND EVERY CONCEPT STANDS ON, AND THE NUMBER UNDER IT.
 *
 * ★ /events IS TWO GROUNDS, NOT ONE. The `(cinema)` route group forces `dark`
 * with `data-mkt data-mkt-skin="cinema"` (layout.tsx), and a type page's middle
 * chapter turns to paper inside `PaperChapter` (`surface-paper bg-background
 * text-foreground data-mkt`). A concept drawn on the lab's own ambient theme is
 * a concept for a page that does not exist, so every scene declares its ground
 * and wears the production attributes verbatim.
 *
 * ★ EVERY REVEAL IS FORCED OPEN. `[data-mkt-reveal]` and `[data-mkt-cut]` rest
 * hidden until an ANCESTOR carries `data-inview="true"` (marketing.css chapter
 * 1), which the real page gets from an IntersectionObserver as it scrolls. A
 * still preview has no scroll, so the root carries the attribute itself: the
 * descendant selector beats the bare one on specificity, so every slot draws in
 * its final state rather than fading in while `lab:demo` takes its picture.
 *
 * ★ A PRESS INSIDE A PREVIEW IS LOOKING, NOT LEAVING. Every real component here
 * (`PageHero`'s actions, `CtaBand`, `TypeDirectory`'s cards) renders a real
 * `next/link`; unstopped, its `onClick` reaches the App Router bound to the
 * BOARD's window (the node is portalled, the React tree is not), which would
 * navigate the lab away from itself. `onClickCapture` disarms every `a[href]`.
 *
 * ★ AND THE CAPTION IS MEASURED IN THE FRAME, NEVER COMPUTED (docs/PROGRAM.md:
 * a board once drew an option with its formula's sign backwards and the tile
 * Will judged showed the opposite of the words he picked). Two numbers read off
 * the laid-out concept: how tall it runs, and how far down the FIRST PICTURE
 * sits, which on a media-forward identity is the only honest answer to "is this
 * media-forward". If the caption and the words above the frame disagree, the
 * caption is the truth.
 */

/* ── The measurement ─────────────────────────────────────────────────────── */

export type Measured = {
  /** How tall the concept runs, in the frame's own layout. */
  height: number;
  /** The first picture's top, from the top of the scene. `null` when the concept
   *  has no photograph at all, which is itself a finding on two of these
   *  decisions; a NEGATIVE number is a real answer (the falling hero's first
   *  frame is born above the section's own top edge). */
  picture: number | null;
};

/**
 * Reads the laid-out scene from inside the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S. The subtree lives in the
 * iframe's document, so it is watched with that window's `ResizeObserver`: it
 * fires when the copied stylesheets land (the first layout is unstyled) and
 * again whenever a new option reflows. A hidden option on the step's stage is
 * `visibility: hidden`, which keeps its layout, so it measures true as well.
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
      const box = el.getBoundingClientRect();
      // The first PHOTOGRAPH, not the first node: a decorative plate or an
      // artifact's drawn QR is not the media a media-forward hero promises.
      const pic = el.querySelector<HTMLElement>("[data-ei-pic], img, video");
      report.current({
        height: Math.round(el.scrollHeight),
        picture: pic
          ? Math.round(pic.getBoundingClientRect().top - box.top)
          : null,
      });
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    el.querySelectorAll("*").forEach((n) => ro.observe(n));
    // Photographs land after layout and the engines paint their rest state on
    // the second frame, so the late reads are not belt and braces: the
    // ResizeObserver watches the nodes that existed at mount, and a stage an
    // engine mounts LATER is invisible to it. Twice, because a frame that only
    // has one late read reported "no picture" for the falling hero.
    const t = win.setTimeout(read, 700);
    const t2 = win.setTimeout(read, 2200);
    return () => {
      ro.disconnect();
      win.clearTimeout(t);
      win.clearTimeout(t2);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

/* ── One scene ───────────────────────────────────────────────────────────── */

export type Ground = "cinema" | "paper";

/** The real page's two grounds, as the route group and the chapter declare them. */
const GROUND: Record<Ground, string> = {
  cinema: "dark bg-background text-foreground",
  paper: "surface-paper bg-background text-foreground",
};

export function stopLinks(e: React.MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

/** One option, in a real viewport, on the right ground, measured underneath. */
export function Scene({
  id,
  w,
  h,
  ground = "cinema",
  title,
  note,
  fold = false,
  children,
}: {
  id: string;
  w: number;
  h: number;
  ground?: Ground;
  title: string;
  /** The board's own words for this option, read beside the measured pair. */
  note?: ReactNode;
  /** Draw the 900 px screen line, for the decisions where the first screen IS the question. */
  fold?: boolean;
  children: ReactNode;
}) {
  const [m, setM] = useState<Measured | null>(null);
  const onMeasure = useCallback((next: Measured) => {
    setM((prev) =>
      prev && prev.height === next.height && prev.picture === next.picture
        ? prev
        : next,
    );
  }, []);

  const measured = m
    ? [
        `${m.height.toLocaleString()} px tall`,
        m.picture === null
          ? "no photograph in this concept"
          : m.picture < 0
            ? `the first frame starts ${Math.abs(m.picture).toLocaleString()} px above the section`
            : `first picture ${m.picture.toLocaleString()} px down${
                fold
                  ? m.picture < h
                    ? ", on the first screen"
                    : ", past it"
                  : ""
              }`,
        // A frame shorter than its part says so: a `Frame` is a real viewport,
        // content past its height scrolls INSIDE it, and a reviewer reading a
        // cut band as the end of the concept would judge a length nobody drew.
        m.height > h + 4
          ? `the frame shows the first ${h.toLocaleString()}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "measuring";

  return (
    <Frame
      id={`ei-${id}`}
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
        className={cn("relative", GROUND[ground])}
        // A fixed min-height, never `min-h-full`: the portalled body has no
        // ancestor declaring a height for a percentage to resolve against, so a
        // short concept would collapse to its own content height instead of the
        // frame's declared `h`.
        style={{ minHeight: h }}
        data-mkt=""
        data-mkt-skin={ground}
        data-inview="true"
        onClickCapture={stopLinks}
      >
        {/* ★ A TABLE IS RESCUED FROM QUIRKS MODE, and the digit pop is pinned.
            A portalled `Frame` renders into `about:blank`, which has no
            doctype, so Chrome's quirks UA sheet stops inherited colour reaching
            a <table>. And `PricePop` / `.mkt-line` run their entrances off
            their own observers, whose implicit root in a portalled frame is the
            frame's box as the PARENT sees it: a capture taken mid-delay reads
            an empty line. Nothing here asks about either, so both are held at
            their end state and every capture can be trusted. */}
        <style>{`table{color:inherit}
[data-mkt] [data-mkt-digits] [data-mkt-digit]{animation:none!important;opacity:1!important;transform:none!important;filter:none!important}
[data-mkt] .mkt-line{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        <Measure onMeasure={onMeasure}>{children}</Measure>
        {fold ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-destructive/60"
            style={{ top: h }}
          />
        ) : null}
      </div>
    </Frame>
  );
}

/**
 * The 1440 scene and the 375 scene, one above the other: the convention every
 * decision on this board reuses, so a reviewer meets one shape rather than
 * eight. The phone decision draws its own column and never calls this.
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
  note?: ReactNode;
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
