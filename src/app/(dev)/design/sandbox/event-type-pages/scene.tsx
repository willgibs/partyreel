"use client";

import type { MouseEvent, ReactNode } from "react";

import { Frame } from "@/components/lab";
import { cn } from "@/lib/utils";

/**
 * THE GROUND EVERY PREVIEW STANDS ON (the pricing-page/contact-page
 * convention, copied local: a board may not import another board's file).
 *
 * ★ /events IS TWO GROUNDS, NOT ONE. The `(cinema)` route group forces `dark`
 * with `data-mkt data-mkt-skin="cinema"` (layout.tsx), and a type page's
 * middle chapter (the intro + BuiltFor) turns to paper inside `PaperChapter`
 * (`surface-paper bg-background text-foreground data-mkt`). A preview on the
 * lab's own ambient theme is a preview of a page that does not exist, so every
 * scene here wears the production attributes verbatim.
 *
 * ★ EVERY REVEAL IS FORCED OPEN. `[data-mkt-reveal]` and `[data-mkt-cut]` rest
 * hidden until an ANCESTOR carries `data-inview="true"` (marketing.css chapter
 * 1), which the real page gets from an IntersectionObserver as you scroll. A
 * still preview has no scroll, so the root here carries the attribute itself:
 * the descendant selector beats the bare one on specificity, so every slot
 * draws in its final state rather than fading in while `lab:demo` is taking
 * its picture.
 *
 * ★ A PRESS INSIDE A PREVIEW IS LOOKING, NOT LEAVING. Every real component
 * here (`PageHero`'s actions, `CtaBand`, `TypeDirectory`'s cards) renders a
 * real `next/link`; unstopped, its `onClick` reaches the App Router bound to
 * the BOARD's own window (the node is portalled, but the React tree and its
 * context are not), which would navigate the lab away from itself.
 * `onClickCapture` disarms every `a[href]` before that handler ever runs.
 */

export type Ground = "cinema" | "paper";

const GROUND: Record<Ground, string> = {
  cinema: "dark bg-background text-foreground",
  paper: "surface-paper bg-background text-foreground",
};

export function stopLinks(e: MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

/** One option, in a real viewport, on the right ground. */
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
  /** The board's own words for this option, read under the frame. */
  note?: string;
  children: ReactNode;
}) {
  return (
    <Frame id={`etp-${id}`} w={w} h={h} title={title} caption={note}>
      {/* A fixed min-height, never `min-h-full`: the portalled body has no
          ancestor that declares a height for a percentage to resolve against,
          so a content-short option (the one-screen composition) would collapse
          to its own content height instead of the frame's declared `h` and any
          `justify-between` inside it would have nothing to spread across. */}
      <div
        className={cn("relative", GROUND[ground])}
        style={{ minHeight: h }}
        data-mkt=""
        data-mkt-skin={ground}
        data-inview="true"
        onClickCapture={stopLinks}
      >
        {children}
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
  render: (mode: "desktop" | "phone") => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Scene id={`${id}-1440`} w={1440} h={desktopH} ground={ground} title="1440" note={note}>
        {render("desktop")}
      </Scene>
      <Scene id={`${id}-375`} w={375} h={phoneH} ground={ground} title="375" note={note}>
        {render("phone")}
      </Scene>
    </div>
  );
}
