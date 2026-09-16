"use client";

import { useCallback, useEffect, useState } from "react";

import { CANVAS, Frame, type Ground, type Mode } from "@/components/lab";
import { cn } from "@/lib/utils";

/**
 * A SPOT IN A REAL DOCUMENT (the Library x Lab migration wave, 2026-09-15;
 * trimmed to three exports by the catalog rebuild, 2026-09-16).
 *
 * ★ WHY THIS BOARD IS ON FRAMES AND NOT ON STAGES, AND WHY IT MATTERS MORE HERE
 * THAN ANYWHERE. A Stage is a div, so a Tailwind breakpoint prefix inside it
 * reads the BROWSER's width rather than the canvas's: inside a 375 stage on a
 * desktop every `sm:` and `lg:` rung fires, so `Container` takes the 2rem
 * desktop gutter and every heading takes its desktop step. On a board about
 * colour that is survivable. On THIS board the whole argument is how a sentence
 * sits: whether a headline takes three rows or four at 375 is the sharpest fact
 * on the board about a voice, and it cannot be read off a heading rendered at
 * the wrong size in a gutter that is 32px too wide.
 *
 * A frame is a real document at exactly 1440 or exactly 375, so the media
 * queries resolve against the canvas because the canvas IS the viewport.
 *
 * Three things follow, each a consequence of the frame being a document:
 *
 * 1. ★ THE GROUND GOES INSIDE, NOT AROUND. The kit's Stage paints the ground
 *    itself; a portalled scene has only what this file puts in it. The classes
 *    below are the Stage's own ground map (stage.tsx), applied to a wrapper in
 *    the frame's body. `data-mkt-skin` is free here in a way it never was on a
 *    stage: marketing.css flips the whole BODY on `body:has([data-mkt-skin])`,
 *    which a page showing cinema and paper at once must not do, and inside a
 *    frame that body is the frame's own. ONE skin per frame, which is why the
 *    home page walks as four frames rather than one.
 * 2. ★ THE HEIGHT IS MEASURED, NEVER WRITTEN. A frame is a fixed box, and a
 *    number typed into it is a promise about content that has to hold for six
 *    voices and two canvases, which is the entire activity on a copy board.
 *    Round two's hand-tuned heights clipped the word "it." off the site's
 *    loudest line at 1440. So the wrapper reports its own height and the frame
 *    takes it.
 * 3. ★ THE REVEAL GRAMMAR IS FORCED TO ITS FINAL STATE. marketing.css rests
 *    every `[data-mkt-reveal]` slot at opacity 0 in BOTH motion preferences and
 *    waits on the Reveal island, which does not run inside a portalled scene.
 *    This is a READING board: a subhead that has to be scrolled into view is a
 *    subhead Will cannot rule on. `data-inview` is the final state the CSS
 *    already defines, not an override.
 */

/** The Stage's ground map (stage.tsx), applied inside the frame's document. */
const SKIN: Record<
  Ground,
  {
    className: string;
    mkt: boolean;
    skin?: "cinema" | "paper";
    style?: React.CSSProperties;
  }
> = {
  cinema: {
    className: "dark",
    mkt: true,
    skin: "cinema",
    style: {
      "--background": "oklch(0.11 0 0)",
      colorScheme: "dark",
    } as React.CSSProperties,
  },
  paper: { className: "surface-paper", mkt: true, skin: "paper" },
  ink: { className: "surface-ink", mkt: true },
  "app-dark": { className: "dark", mkt: false },
  "app-light": { className: "surface-paper", mkt: false },
};

/** Two pixels of dead ground: the frame's 1px outline sits outside the box, but
 *  a fractional layout still rounds, and a constant two on every frame at once
 *  is how you tell rounding from a line that really does not fit. */
const SLACK = 2;

/**
 * ★ WHAT A FRAME MEASURED, REMEMBERED FOR THE SESSION.
 *
 * A frame reserves a box before its scene exists, and the only honest guess is
 * a full canvas. On a board of fifty frames that guess is wrong by tens of
 * thousands of pixels in total, so the page shrinks under the reader as the
 * frames land: measured on the phone canvas, a link carrying a section hash
 * landed on its section and then watched it rise 14,500px. Every flip of the
 * voice or the canvas paid it again.
 *
 * The cache makes the guess a MEASUREMENT for every pass after the first: a
 * frame that has been this size before opens at it. Keyed by frame id and
 * canvas because those are what decide a height, deliberately module-level (it
 * outlives a remount, which is the point) and deliberately not persisted,
 * because a stale height from another build is worse than an honest guess.
 */
const MEASURED = new Map<string, number>();

/**
 * The content's own height, read from inside the frame.
 *
 * ★ THE OBSERVER IS CONSTRUCTED IN THE FRAME'S REALM. The node lives in another
 * document; a ResizeObserver from this one observes it, but the frame's own is
 * the honest instrument and it is what the fonts promise below belongs to. The
 * webfont lands after the first layout and takes every wrap with it, so a
 * height read before `fonts.ready` is usually one row short.
 *
 * ★ AND THE CLEANUP RIDES THE CALLBACK REF (React 19). The portal unmounts when
 * the frame reloads or the reader leaves; a ref callback that returns its
 * teardown cannot leave an observer on a document that is gone.
 */
function useMeasured(
  key: string,
  fallback: number,
): [number, (el: HTMLDivElement | null) => (() => void) | void] {
  const [height, setHeight] = useState(() => MEASURED.get(key) ?? fallback);
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const doc = el.ownerDocument;
      const win = doc.defaultView;
      if (!win) return;
      let alive = true;
      const sync = () => {
        if (!alive) return;
        const next = Math.max(
          24,
          Math.ceil(el.getBoundingClientRect().height) + SLACK,
        );
        MEASURED.set(key, next);
        setHeight(next);
      };
      sync();
      const ro = new win.ResizeObserver(sync);
      ro.observe(el);
      // ★ THE WHOLE CHAIN IS GUARDED, NOT JUST `fonts`. On the top document
      // `fonts.ready` is always a promise, which is why the kit writes
      // `fonts?.ready.then(...)`. An about:blank document is not that: its
      // FontFaceSet exists while `ready` is still undefined on the tick a portal
      // mounts into it, and `.then` on undefined throws INSIDE a layout effect,
      // which takes the whole board to its error boundary. Measured: it did, on
      // a fast scroll through fifty frames.
      try {
        doc.fonts?.ready?.then(sync).catch(() => {});
      } catch {
        // A document torn down between the read and the call.
      }
      return () => {
        alive = false;
        ro.disconnect();
      };
    },
    [key],
  );
  return [height, attach];
}

/**
 * ★ A LINK'S ANCHOR CANNOT LAND ON A BOARD THAT IS STILL MEASURING ITSELF.
 *
 * The share format for a review note is a URL, and it carries a section: the
 * whole point of a section hash is that it opens on that section. But the
 * browser applies a hash ONCE, at load, when every frame is still holding a
 * reserved canvas rather than its content, and the board then shrinks by tens
 * of thousands of pixels underneath the reader. Measured before this hook: the
 * link landed on its section and then watched it rise 14,500px.
 *
 * So the hash is re-applied on a short schedule while the board settles, and
 * the schedule is CANCELLED BY THE READER rather than by a timeout alone: a
 * wheel, a touch or a key is intent, and a correction that fights a reader who
 * has started reading is worse than no correction at all. A programmatic scroll
 * fires none of those, so the cancel cannot cancel itself. Four corrections and
 * it stops; the jump is instant, because a correction that animates is a second
 * thing moving on a page the reader is trying to read.
 *
 * It belongs in the kit rather than here (every board of lazily mounted,
 * self-measuring frames has it), and it is asked for in this round's Handoff.
 */
export function useAnchorAfterSettle(boardId: string) {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id.startsWith(`${boardId}-`)) return;
    let cancelled = false;
    const stop = () => {
      cancelled = true;
    };
    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchstart", stop, { passive: true, once: true });
    window.addEventListener("keydown", stop, { once: true });
    const timers = [400, 1200, 2500, 5000].map((ms) =>
      window.setTimeout(() => {
        if (cancelled) return;
        document
          .getElementById(id)
          ?.scrollIntoView({ block: "start", behavior: "auto" });
      }, ms),
    );
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [boardId]);
}

/** Whatever a board hands a frame, on its ground, measured, at 1:1. */
export function VoiceFrame({
  id,
  mode,
  ground,
  title,
  caption,
  className,
  children,
}: {
  id: string;
  mode: Mode;
  ground: Ground;
  title: string;
  caption?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const { w, h } = CANVAS[mode];
  const [height, attach] = useMeasured(`${id}:${mode}`, h);
  const g = SKIN[ground];

  return (
    // ★ THE SCROLLER IS OUTSIDE THE FRAME, NEVER A SCALE ON IT. A 1440 document
    // does not fit the board's column and the one thing this board may not do
    // is shrink a specimen whose wrapping is the finding (Will, 2026-09-15).
    <div className="min-w-0 overflow-x-auto pb-2">
      <div className="w-fit">
        <Frame
          id={id}
          w={w}
          h={height}
          title={title}
          caption={caption}
          // No lock: a spot is exactly as tall as its content, so there is
          // nothing to scroll inside it and nothing to keep in step.
          lock={null}
          onApproach
        >
          <div
            ref={(el) => attach(el)}
            // flow-root, so a child's margin cannot collapse out of the measured
            // box and hand back a height shorter than what is drawn.
            className={cn(
              g.className,
              "flow-root bg-background text-foreground",
              className,
            )}
            style={g.style}
            data-inview="true"
            data-ground={ground}
            {...(g.mkt ? { "data-mkt": "" } : {})}
            {...(g.skin ? { "data-mkt-skin": g.skin } : {})}
          >
            {children}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/**
 * A PRODUCTION GROUND AT A REAL PHONE COLUMN, with no iframe.
 *
 * The catalog's cards are the one place a frame cannot go: fifty documents
 * mounted at once to answer "which of these six", before anybody has chosen
 * anything to look at. So a card paints the ground itself and pins its column
 * to 343px, which is EXACTLY what `Container` gives a 375 viewport (`px-4` a
 * side). Nothing is scaled and no breakpoint is faked: the card is the phone's
 * own column width, at the phone's own type, with the desktop rungs deliberately
 * not firing because there is no `sm:` in anything it renders.
 */
export const PHONE_COLUMN = 343;

export function CardGround({
  ground,
  className,
  children,
}: {
  ground: Ground;
  className?: string;
  children: React.ReactNode;
}) {
  const g = SKIN[ground];
  return (
    <div
      className={cn(
        g.className,
        "flow-root bg-background text-foreground",
        className,
      )}
      // ★ NO `data-mkt-skin` HERE, AND IT IS NOT AN OVERSIGHT. marketing.css
      // flips the whole document on `body:has([data-mkt-skin="cinema"])` to stop
      // overscroll bleed on a real marketing route; inside a frame that body is
      // the frame's own, but a card is on the BOARD's page, so the attribute
      // would paint the lab itself room-dark and force `color-scheme: dark` on
      // it. (globals-theme-contract.test.ts holds the same line for the paper
      // chapter; the home-hero board learned it the same way.) The one thing the
      // skin bought here, the 0.11 ground, is the inline `--background` above.
      style={g.style}
      data-inview="true"
      data-ground={ground}
      {...(g.mkt ? { "data-mkt": "" } : {})}
    >
      <div
        className="mx-auto"
        style={{ width: PHONE_COLUMN, maxWidth: "100%" }}
      >
        {children}
      </div>
    </div>
  );
}
