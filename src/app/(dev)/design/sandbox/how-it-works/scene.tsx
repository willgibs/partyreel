"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Frame } from "@/components/lab";
import { cn } from "@/lib/utils";

/**
 * THE GROUND EVERY PREVIEW STANDS ON, AND THE NUMBERS UNDER IT.
 *
 * ★ TWO REAL GROUNDS, NOT ONE (the pricing-page precedent). The real page is a
 * `(cinema)` route (forced dark, `data-mkt data-mkt-skin="cinema"`) that turns
 * to paper inside `PaperChapter` (`surface-paper`, with `data-mkt` re-declared
 * so its `color-mix` tokens resolve against the LIGHT values). A preview on the
 * lab's own ambient theme would be a preview of a page that does not exist, so
 * every scene here declares which ground it stands on and wears the production
 * attributes verbatim.
 *
 * ★ EVERY REVEAL IS FORCED OPEN, the same reason: `[data-mkt-reveal]` and
 * `[data-mkt-cut]` rest at opacity 0 until an ancestor's `data-inview="true"`
 * lifts them, which the real page gets from an IntersectionObserver as you
 * scroll. A still preview never scrolls, so the root here carries that
 * attribute itself.
 *
 * ★ AND EVERY NUMBER IS MEASURED IN THE FRAME, NEVER COMPUTED (docs/PROGRAM.md:
 * a board once drew an option with its formula's sign backwards, and the tile
 * Will judged showed the opposite of the words he picked). Two numbers, read
 * off the laid-out page inside the frame: how tall the part runs (in pixels
 * and in 900 px "windows", the unit the manifest measures this page in), and
 * how far down the first real product picture sits. If a caption and the words
 * above it disagree, the caption is the truth.
 */

export type Ground = "cinema" | "paper";

const GROUND: Record<Ground, string> = {
  cinema: "dark bg-background text-foreground",
  paper: "surface-paper bg-background text-foreground",
};

export type Measured = {
  /** How tall the part runs, in the frame's own layout. */
  height: number;
  /** The first `[data-hiw-picture]`'s top, from the top of the scene. -1 when there is none. */
  picture: number;
};

/** Reads the laid-out scene from inside the frame's own document (the frame's
 *  own `ResizeObserver`, never the lab page's: the subtree lives in the iframe's
 *  document). */
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
      const picture = el.querySelector<HTMLElement>("[data-hiw-picture]");
      report.current({
        height: Math.round(el.scrollHeight),
        picture: picture
          ? Math.round(picture.getBoundingClientRect().top - box.top)
          : -1,
      });
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    el.querySelectorAll("*").forEach((n) => ro.observe(n));
    // Photographs land after layout, and a spine's frames are what push
    // everything below them down: without a second read the picture is
    // measured against a page that has not finished loading its images yet.
    const t = win.setTimeout(read, 600);
    return () => {
      ro.disconnect();
      win.clearTimeout(t);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

/**
 * One option, in a real viewport, on the right ground, with its measured line
 * underneath: how tall, how many 900 px "windows" that is, and how far down
 * the first real product picture sits.
 */
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
  /** The board's own words for this option, read beside the measured pair. */
  note?: string;
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
        `${m.height.toLocaleString()} px tall (${(m.height / 900).toFixed(1)} windows at 900)`,
        m.picture >= 0
          ? `the first picture ${m.picture.toLocaleString()} px down`
          : "no product picture on this option",
        m.height > h + 4
          ? `the frame shows the first ${h.toLocaleString()}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "measuring";

  return (
    <Frame
      id={`hiw-${id}`}
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
        // `body:has([data-mkt-skin=...])` chrome rules resolve the way they do
        // on the site (the one legal place: never on a PaperChapter itself).
        data-mkt-skin={ground}
        data-inview="true"
        onClickCapture={(e) => {
          const el = e.target as HTMLElement;
          // A press inside a preview is looking, not leaving: nothing here may
          // navigate away or open a real dialog.
          if (el.closest?.("a[href]")) e.preventDefault();
        }}
      >
        {/* PricingPointer's TextsReveal rides `.mkt-line`, the same
            opacity-0-until-observed shape as [data-mkt-reveal]; pinned at its
            end state so a capture never catches it mid-blur. */}
        <style>{`[data-mkt] .mkt-line{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        <Measure onMeasure={onMeasure}>{children}</Measure>
      </div>
    </Frame>
  );
}

/**
 * The 1440 scene and the 375 scene, one above the other: the convention every
 * decision on this board reuses, so a reviewer meets one shape rather than
 * eight.
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
      <Scene id={`${id}-1440`} w={1440} h={desktopH} ground={ground} title="1440" note={note}>
        {render(1440)}
      </Scene>
      <Scene id={`${id}-375`} w={375} h={phoneH} ground={ground} title="375" note={note}>
        {render(375)}
      </Scene>
    </div>
  );
}
