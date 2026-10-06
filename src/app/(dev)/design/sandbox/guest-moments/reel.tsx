"use client";

import { Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";

import { REEL_FIRST } from "./fixtures";

/**
 * THE REEL OPENING, AS A GUEST MEETS IT on a shared reel link (`/e/<token>?reel`),
 * or the host from her hub's Reel card: the page's curtain
 * (`event-experience.tsx`'s `data-reel-curtain`, a fixed black over
 * everything) standing until the view's lazy chunk mounts and the player's
 * first window draws (`player-live.tsx`, `data-live-reel="loading"` then
 * `"playing"`), then the reel with its bar at rest.
 *
 * ★ THE PLAYING FRAME IS A STILL: the reel's first photograph full-bleed (the
 * take opens on the cover's first still, which every option starts from) and
 * the view's resting bar, `live-reel-view.tsx`'s glass pill (132 by 34, play
 * and the timeline), retyped here because the view mounts only inside its
 * dialog and its album's store. No event name, ever: the reel's own rule.
 *
 * ★ THE BEATS ARE THE BLACK'S OWN NUMBERS: about a second on a slow phone
 * with nothing warmed, a third of one warmed (`reel-card.tsx`'s measure). The
 * moving frame plays the slow phone's second.
 */

/** The `opening` ask's options: the black (today), the first still at once, the bar first. */
export type Opening = "black" | "still" | "mark";

/** One instant of the opening: the press, half a second on, and the reel playing. */
export type Beat = "press" | "wait" | "play" | "loop";

/** The view's resting bar: play, and the timeline (at `progress`, or running where `running`). */
function RestingBar({
  progress,
  running,
}: {
  progress: number;
  running?: "early" | "late" | "loop";
}) {
  return (
    <div
      data-gm-bar={running ?? "playing"}
      className={`absolute bottom-[0.75rem] left-1/2 z-30 flex h-[34px] w-[132px] -translate-x-1/2 items-center gap-2.5 rounded-full px-3.5 text-white ${GLASS}`}
    >
      <Play className={`size-3 fill-white ${GLASS_MARK_LIT}`} aria-hidden />
      <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25">
        {running ? (
          // The `mark` option's running line: a short light travelling the
          // timeline until the first photograph draws (no number: the wait has none).
          <span
            className="gm-run absolute inset-y-0 w-2/5 rounded-full bg-white/85"
            data-gm-run={running}
          />
        ) : (
          <span
            className="absolute inset-0 origin-left rounded-full bg-white/85"
            style={{ transform: `scaleX(${progress})` }}
          />
        )}
      </span>
    </div>
  );
}

/** The view's Close, top right, as the dock's follower draws it: the way out while it waits. */
function Close() {
  return (
    <div className="absolute top-3 right-3 z-30" data-gm-close="">
      <Button
        type="button"
        variant="glass"
        size="icon-cta"
        tabIndex={-1}
        aria-label="Close the reel"
      >
        <X aria-hidden />
      </Button>
    </div>
  );
}

/** The reel's first photograph, edge to edge; `drift` is the hold's slow push already under way. */
function FirstPhoto({ drift, loop }: { drift?: boolean; loop?: Opening }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the reel's first still, a stand-in photograph
    <img
      src={REEL_FIRST.src}
      alt=""
      draggable={false}
      data-gm-first=""
      data-gm-first-loop={loop}
      className="gm-first absolute inset-0 size-full object-cover"
      style={{
        objectPosition: REEL_FIRST.focus,
        transform: drift ? "scale(1.03)" : undefined,
      }}
    />
  );
}

/**
 * ONE INSTANT OF THE OPENING, OR ITS LOOP (`beat="loop"`, a CSS loop in
 * `guest-moments.css`, held at the playing reel under reduced motion).
 */
export function ReelOpening({ way, beat }: { way: Opening; beat: Beat }) {
  const waiting = beat === "press" || beat === "wait";
  return (
    <div
      data-gm-reel={`${way}-${beat}`}
      data-gm-reel-loop={beat === "loop" ? way : undefined}
      className="fixed inset-0 overflow-hidden bg-black"
    >
      {beat === "loop" ? (
        <>
          <FirstPhoto loop={way} />
          <div className="gm-play-bar" data-gm-loop-bar={way}>
            <RestingBar progress={0.06} />
          </div>
          {way === "mark" ? (
            <div className="gm-wait-bar">
              <RestingBar progress={0} running="loop" />
            </div>
          ) : null}
          {way !== "black" ? (
            <div className="gm-wait-close">
              <Close />
            </div>
          ) : null}
        </>
      ) : waiting ? (
        <>
          {way === "still" ? <FirstPhoto drift={beat === "wait"} /> : null}
          {way === "mark" ? (
            <RestingBar
              progress={0}
              running={beat === "press" ? "early" : "late"}
            />
          ) : null}
          {way !== "black" ? <Close /> : null}
        </>
      ) : (
        <>
          <FirstPhoto drift={way === "still"} />
          <RestingBar progress={0.06} />
        </>
      )}
    </div>
  );
}
