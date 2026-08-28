"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { useInViewOnce } from "@/lib/shared/use-in-view-once";

/**
 * THE GATHER: twelve photographs lie strewn like prints dropped on a table, and
 * draw together into one album. It is the page's establishing shot and its only
 * loud beat, and it carries the dark-to-paper transition on its own back: the
 * album is centred on the cut, so it arrives out of the event and lands on the
 * desk (the /help emblem-strip idiom, which is the same move).
 *
 * ── WHY THIS IS A SECOND BUILD ──
 *
 * The first version reused [data-mkt-fly] (the home decomposition's grammar, run
 * forward). It was wrong in a way that is obvious in hindsight: the fly recipe
 * animates opacity 0 to 1, so its pre-state is INVISIBLE. Nobody ever saw the
 * scatter, only an empty frame filling in, which is why Will's read was "almost
 * unnoticeable" — the entire idea was happening in a state that could not be
 * seen. Here opacity is never touched. The photographs are visible the whole
 * time and only their position and angle change, which is the one thing the
 * concept is actually about. The recipe is .mkt-gather (marketing.css).
 *
 * The album plate is visible at rest too, empty, with a faint ground in every
 * cell. So the resting image reads as an album waiting to be filled, surrounded
 * by the photographs that belong in it, which is the whole product in one frame.
 *
 * ★ The scatter is an AUTHORED table, in design px on the 1180-wide stage, not a
 * formula and never Math.random() (which desyncs SSR). It is authored inside the
 * frame on purpose: with no JS the pre-state simply persists, so the fallback is
 * prints on a table rather than photographs stranded off-screen.
 *
 * ★ `--i` is authored too, never the array index: row-major arrival reads like a
 * loading skeleton. Array order IS grid order, so index 5 is row 2 column 2 at
 * four columns.
 *
 * ★ INDEX 5 IS THE STRAGGLER. Eleven photographs gather; this one stays out and
 * arrives alone at i:32, about 400ms after the others have settled. A complete
 * rectangle says "this is all of it", which is a photo album; the product's
 * promise is that there is always one more phone in the room. The pause is the
 * content, not a bug. It reads far better here than in the first build: the
 * straggler is VISIBLE the whole time, still lying out while the album squares
 * up around it, instead of being an invisible hole. One integer to remove.
 */

const STAGE_W = 1180;

/** Design px on the 1180 stage, in container-query units so one table serves every width. */
const cq = (px: number) => `${((px / STAGE_W) * 100).toFixed(2)}cqw`;

/** Scatter offset from the tile's grid seat, plus the angle it lies at. */
type GatherTile = {
  id: string;
  dx: number;
  dy: number;
  rot: number;
  /** Stagger slot. Authored, not the array index. */
  i: number;
};

const TILES: readonly GatherTile[] = [
  { id: "wedding-golden", dx: -175, dy: -70, rot: -11, i: 3 },
  { id: "reception-table", dx: -50, dy: -105, rot: 8, i: 7 },
  { id: "party-balloons", dx: 70, dy: -95, rot: -7, i: 1 },
  { id: "concert-confetti", dx: 185, dy: -60, rot: 13, i: 9 },
  { id: "wedding-rings", dx: -195, dy: 30, rot: 9, i: 5 },
  { id: "reception-hall", dx: -40, dy: -25, rot: -14, i: 32 }, // ← the straggler
  { id: "party-dj", dx: 65, dy: 35, rot: 6, i: 10 },
  { id: "wedding-toast", dx: 200, dy: -10, rot: -9, i: 2 },
  { id: "festival-lights", dx: -180, dy: 85, rot: 11, i: 6 },
  { id: "festival-crowd", dx: -55, dy: 110, rot: -8, i: 0 },
  { id: "wedding-arch", dx: 75, dy: 105, rot: 12, i: 8 },
  { id: "wedding-petals", dx: 190, dy: 80, rot: -11, i: 4 },
];

export function Gather() {
  // Trips while the stage is still entering, so the straggler is not stranded
  // below the fold for a fast scroller.
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.2, "0px 0px -8% 0px");

  return (
    // The containing block is capped at the stage width so the straddle's
    // PERCENTAGE bottom margin resolves against the stage, not the viewport.
    // That is what makes one value hold the seam at the album's midline at every
    // width: the stage is aspect-locked, so height is a fixed fraction of width,
    // and a percentage margin tracks it automatically where a px value could not.
    // ★ flow-root is load-bearing. Without a block formatting context here the
    // straddle's negative bottom margin COLLAPSES THROUGH this box (nothing
    // separates them: no padding, no border) and escapes as the chapter's own
    // margin. The chapter then never shortens, the dark simply runs on past the
    // album, and the section below gets yanked up to render its text over the
    // dark ground. /help gets away without it only because its straddle sits
    // inside a section that already has vertical padding.
    <div className="mx-auto flow-root w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
      <div
        ref={ref}
        data-inview={inView ? "true" : "false"}
        data-on={inView ? "true" : undefined}
        aria-hidden
        className="surface-paper relative z-10 sm:-mb-[30%]"
      >
        <div className="[container-type:inline-size] relative w-full overflow-hidden">
          <div className="relative aspect-[1180/1700] sm:aspect-[1180/700]">
            {/* THE PLATE: visible and empty at rest, so the frame reads as an
                album waiting rather than as blank space. */}
            {/* No card behind the grid: empty, it is a big blank rectangle
                straddling the cut, and the system's rule is that media is the
                colour and chrome stays minimal. Assembled, the 3px gallery gap
                is what makes it read as one album. */}
            <div
              // Width + --scatter come from .mkt-gather-plate in marketing.css:
              // both the arbitrary-value and arbitrary-property forms of this
              // silently emitted no rule, and the plate collapsed to the width
              // of its own grid gaps with nothing reported anywhere.
              className="mkt-gather-plate absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-4">
                {TILES.map((t) => {
                  const m = marketingImage(t.id);
                  return (
                    <div
                      key={t.id}
                      className="mkt-gather relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
                      style={
                        {
                          "--gx": `calc(${cq(t.dx)} * var(--scatter, 1))`,
                          "--gy": `calc(${cq(t.dy)} * var(--scatter, 1))`,
                          "--gr": `${t.rot}deg`,
                          "--i": t.i,
                        } as CSSProperties
                      }
                    >
                      <Image
                        src={m.src}
                        alt=""
                        fill
                        loading="eager"
                        sizes="(min-width: 1180px) 190px, (min-width: 640px) 16vw, 30vw"
                        className="object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
