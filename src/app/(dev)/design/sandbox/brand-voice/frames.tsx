"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CANVAS,
  Frame,
  type Ground,
  type Mode,
  useFrameLock,
} from "@/components/lab";
import { cn } from "@/lib/utils";

import type { VoiceId } from "./voices";

/**
 * THE VOICES IN A REAL VIEWPORT (the Library x Lab migration wave, 2026-09-15).
 *
 * ★ WHY THIS BOARD MOVED OFF THE STAGE, AND WHY IT MATTERS MORE HERE THAN
 * ANYWHERE. A Stage is a div, so a Tailwind breakpoint prefix inside it reads
 * the BROWSER's width rather than the canvas's: inside the 375 stage on a
 * desktop every `sm:` and `lg:` rung fired, so `Container` took the 2rem
 * desktop gutter and every heading took its desktop step. On a board about
 * colour or shadow that is survivable. On THIS board the whole argument is how
 * a sentence sits: whether B's h1 takes three rows or four at 375 is the
 * board's sharpest fact about B, and it cannot be read off a heading rendered
 * at the wrong size in a gutter that is 32px too wide.
 *
 * Round four restored the ladder by hand, in the board's own sheet, keyed to a
 * `data-bv-canvas` attribute: four heading tiers and a container gutter,
 * restated as literals. It worked and it was a lie waiting to happen, because
 * the literals had to be kept in step with a type scale another track is
 * actively proposing to change.
 *
 * A frame is a real document at exactly 1440 or exactly 375, so the media
 * queries resolve against the canvas because the canvas IS the viewport. The
 * hand-restored ladder is deleted, the gutter rule with it, and the board now
 * measures what the site renders rather than what this file remembers.
 *
 * Three things follow, each a consequence of the frame being a document:
 *
 * 1. ★ THE GROUND GOES INSIDE, NOT AROUND. The kit's Stage paints the ground
 *    itself; a portalled scene has only what this file puts in it. The classes
 *    below are the Stage's own ground map (stage.tsx), applied to a wrapper in
 *    the frame's body. `data-mkt-skin` is free here in a way it never was on a
 *    stage: marketing.css flips the whole BODY on `body:has([data-mkt-skin])`,
 *    which a page showing cinema and paper at once must not do, and inside a
 *    frame that body is the frame's own.
 * 2. ★ THE HEIGHT IS MEASURED, NEVER WRITTEN. A frame is a fixed box like a
 *    stage, and a number typed into it is a promise about content that has to
 *    hold for three voices, two canvases and every edit to the copy, which is
 *    the entire activity on a copy board. Round two's hand-tuned heights
 *    clipped the word "it." off the thesis at 1440, on the exact surface an ask
 *    asks Will to choose on. So the wrapper reports its own height and the
 *    frame takes it. (Asked of the Orchestrator this round: a `height`
 *    of "measured" on the kit's Frame, which retires this hook from every
 *    board at once.)
 * 3. ★ THE REVEAL GRAMMAR IS FORCED TO ITS FINAL STATE. marketing.css rests
 *    every `[data-mkt-reveal]` slot at opacity 0 in BOTH motion preferences and
 *    waits on the Reveal island, which does not run inside a portalled scene.
 *    This is a READING board: a subhead that has to be scrolled into view is a
 *    subhead Will cannot rule on. `data-inview` is the final state the CSS
 *    already defines, not an override.
 */

/** Today first, then the two candidates: a comparison reads from the control. */
export const COLUMNS: VoiceId[] = ["today", "house", "room"];

export const VOICE_TAG: Record<VoiceId, string> = {
  today: "Today",
  house: "A, the house",
  room: "B, the room",
};

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
 * frames land: measured on the phone canvas, a link carrying `#brand-voice-guest`
 * landed on its section and then watched it rise 14,500px as the frames above it
 * measured themselves. Every flip of the voice or the canvas paid it again.
 *
 * The cache makes the guess a MEASUREMENT for every pass after the first: a
 * frame that has been this size before opens at it. It is keyed by frame id and
 * canvas because those are what decide a height, deliberately module-level
 * (it outlives a remount, which is the point) and deliberately not persisted,
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
 * whole point of `#brand-voice-guest` is that it opens on the guest surfaces.
 * But the browser applies a hash ONCE, at load, when every frame is still
 * holding a reserved canvas rather than its content, and the board then shrinks
 * by tens of thousands of pixels underneath the reader. Measured before this
 * hook: the link landed on its section and then watched it rise 14,500px.
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

/** Whatever a board hands a frame, on its ground, measured. */
export function VoiceFrame({
  id,
  mode,
  ground,
  title,
  caption,
  lock,
  className,
  bodyRef,
  children,
}: {
  id: string;
  mode: Mode;
  ground: Ground;
  title: string;
  caption?: React.ReactNode;
  /** A scroll group shared with the other columns of the same surface. */
  lock?: ReturnType<typeof useFrameLock> | null;
  className?: string;
  /** The measured wrapper, for a ruler that has to read the live heading. */
  bodyRef?: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  const { w, h } = CANVAS[mode];
  const [height, attach] = useMeasured(`${id}:${mode}`, h);
  const g = SKIN[ground];

  return (
    <Frame
      id={id}
      w={w}
      h={height}
      title={title}
      caption={caption}
      lock={lock}
      onApproach
    >
      <div
        ref={(el) => {
          bodyRef?.(el);
          return attach(el);
        }}
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
  );
}

/**
 * One surface, three voices, each in its own document.
 *
 * ★ STACKED AT 1440, ABREAST AT 375, and the reason is arithmetic rather than
 * taste. Three 375 documents are 1,125px and fit a 1440 window, so stacking
 * them would leave a thousand pixels of dead ground beside every specimen and
 * put the line being judged a screen away from the line it replaces. Three 1440
 * documents fit nothing, so the stack is the only honest layout there. Scaling
 * either of them is what this round exists to stop.
 *
 * ★ ONE SCROLL GROUP PER SURFACE, not one per board: three frames of the same
 * surface scroll together, which is the whole point of putting them side by
 * side, and a board's other rows are not dragged along with them.
 */
export function VoiceFrames({
  id,
  mode,
  ground,
  render,
  caption,
}: {
  id: string;
  mode: Mode;
  ground: Ground;
  render: (voice: VoiceId) => React.ReactNode;
  caption?: (voice: VoiceId) => React.ReactNode;
}) {
  const lock = useFrameLock(true);
  const side = mode === "phone";
  return (
    <div className="overflow-x-auto pb-2">
      <div
        className={cn("flex w-fit gap-4", side ? "items-start" : "flex-col")}
      >
        {COLUMNS.map((v) => (
          <VoiceFrame
            key={v}
            id={`${id}-${v}`}
            mode={mode}
            ground={ground}
            lock={lock}
            title={VOICE_TAG[v]}
            caption={caption?.(v) ?? DEFAULT_CAPTION[v]}
          >
            {render(v)}
          </VoiceFrame>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_CAPTION: Record<VoiceId, string> = {
  today: "The shipped strings, verbatim. The control.",
  house: "A tuning of the register the ratified lines already speak.",
  room: "Recommended. Rebuilt from the code becoming the album.",
};

/**
 * Three voices INSIDE one document, at the specimen's real width.
 *
 * For chrome whose shipped width is already under 400px: an event card in the
 * dashboard's own three-up grid, a toast at sonner's 356, a notification row.
 * Three of them side by side IS the shipped layout at the shipped width, so a
 * frame each would be three documents saying the same thing about one.
 */
export function VoiceCanvas({
  id,
  mode,
  ground,
  width,
  render,
  caption,
}: {
  id: string;
  mode: Mode;
  ground: Ground;
  /** The specimen's REAL width in CSS pixels, never a guess. */
  width: number;
  render: (voice: VoiceId) => React.ReactNode;
  caption?: React.ReactNode;
}) {
  const phone = mode === "phone";
  return (
    <div className="overflow-x-auto pb-2">
      <div className="w-fit">
        <VoiceFrame
          id={id}
          mode={mode}
          ground={ground}
          title="Today, A and B"
          caption={
            caption ??
            "Three voices in one document, each at the width the component ships at."
          }
          className="px-6 py-8"
        >
          <div
            className={
              phone ? "flex flex-col gap-6" : "flex flex-wrap items-start gap-6"
            }
          >
            {COLUMNS.map((v) => (
              <div key={v} style={{ width: phone ? undefined : width }}>
                <p className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block size-1.5 rounded-full",
                      v === "today"
                        ? "bg-muted-foreground/50"
                        : "bg-foreground",
                    )}
                  />
                  {VOICE_TAG[v]}
                  {v === "room" && (
                    <span className="text-muted-foreground/70">
                      recommended
                    </span>
                  )}
                </p>
                {render(v)}
              </div>
            ))}
          </div>
        </VoiceFrame>
      </div>
    </div>
  );
}

/** One document in the SELECTED voice: a whole arc chapter, a feature page, the
 *  thesis pair. The ledger beside it carries today line by line, so the frame
 *  shows one voice and the comparison stays in one view. */
export function ChapterFrame({
  id,
  mode,
  ground,
  title,
  caption,
  className,
  bodyRef,
  children,
}: {
  id: string;
  mode: Mode;
  ground: Ground;
  title: string;
  caption?: React.ReactNode;
  className?: string;
  bodyRef?: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="w-fit">
        <VoiceFrame
          id={id}
          mode={mode}
          ground={ground}
          title={title}
          caption={caption}
          className={className}
          bodyRef={bodyRef}
          lock={null}
        >
          {children}
        </VoiceFrame>
      </div>
    </div>
  );
}
