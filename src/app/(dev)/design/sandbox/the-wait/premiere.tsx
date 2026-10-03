"use client";

import { type CSSProperties, useLayoutEffect, useRef } from "react";
import {
  Clock3,
  ImagePlus,
  Palette,
  Pause,
  Play,
  SkipForward,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { ALBUM, FIRST_OPEN_MS, PREMIERE_FRAMES, ROLL_SIZE } from "./fixtures";
import { albumWidth, planAlbum } from "./geometry";
import { SCREENS, type ScreenId } from "./knobs";
import { at, offsetIn, usePlay } from "./motion";
import { AlbumHead, CoverGround, GuestPage, OpenRows } from "./album";

/**
 * THE PREMIERE FIRST (round one's third, refined): her first open after the
 * develop plays the reel full screen over the roll's opening frames, with
 * production's reel chrome (`live-reel-view.tsx`: the picture covering the
 * screen, one slim glass bar at the foot with play and progress, no event name
 * on screen) and the premiere's own two: a beat that says what this is, and
 * The album, in reach from the first frame. When the pass ends its last
 * photograph drops into its own tile in the album, the newest, as a viewer's
 * photograph drops back into the album when it closes.
 *
 * Reduced motion: the reel waits on its first photograph, paused, its dock up
 * (production's reel starts so), The album beside it.
 */

/** One frame of the premiere, and the pass: five of them. */
const HOLD = 1700;
const FRAMES = [...PREMIERE_FRAMES.slice(0, 4), ALBUM[0]!.picture];
/** When the last photograph drops into the album. */
const DROP = FRAMES.length * HOLD;

export const PREMIERE_MS = { full: DROP + 900, reduced: 600 } as const;
/** The still's moment: the second photograph playing, the bar a third along. */
export const PREMIERE_TURN_MS = HOLD + 900;

/** The reel's bar at rest (132 by 34, glass, at the foot's middle): play and the pass's progress. */
function Bar({ run }: { run: number }) {
  return (
    <div
      className={cn(
        GLASS,
        "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2.5 px-3.5 text-white",
      )}
      style={{ width: 132, height: 34, borderRadius: 17 }}
      data-reel-bar=""
    >
      <Pause className={cn("size-3 fill-white", GLASS_MARK_LIT)} aria-hidden />
      <span
        aria-hidden
        className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25"
      >
        <span
          className="tw-a tw-progress absolute inset-0 rounded-full bg-white/85"
          style={at(0, { "--tw-run": `${run}ms` } as CSSProperties)}
        />
      </span>
    </div>
  );
}

/** The reel's dock, up (reduced motion's start): its first row of controls, play first. */
function Dock() {
  const round =
    "flex size-10 shrink-0 items-center justify-center rounded-full text-white";
  return (
    <div
      className={cn(
        GLASS,
        "absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col gap-2 p-2 text-white",
      )}
      style={{ borderRadius: 22 }}
      data-reel-dock="up"
    >
      <div className="flex items-center justify-center gap-1">
        <span className={round}>
          <Play className={cn("size-[18px] fill-white", GLASS_MARK_LIT)} />
        </span>
        <span className={round}>
          <Video className={cn("size-[18px]", GLASS_MARK_LIT)} />
        </span>
        <span className={round}>
          <Palette className={cn("size-[18px]", GLASS_MARK_LIT)} />
        </span>
        <span className={round}>
          <Clock3 className={cn("size-[18px]", GLASS_MARK_LIT)} />
        </span>
        <span className={round}>
          <ImagePlus className={cn("size-[18px]", GLASS_MARK_LIT)} />
        </span>
      </div>
      <span
        aria-hidden
        className="relative mx-2 mb-1 h-1 overflow-hidden rounded-full bg-white/25"
      >
        <span
          className="absolute inset-0 origin-left rounded-full bg-white/85"
          style={{ transform: "scaleX(0.04)" }}
        />
      </span>
    </div>
  );
}

function Premiere() {
  const { reduced } = usePlay();
  const drop = useRef<HTMLDivElement | null>(null);

  // The album's newest tile, where the last photograph lands: read off the page's own layout.
  useLayoutEffect(() => {
    const el = drop.current;
    const page = el?.closest<HTMLElement>("[data-tw-page]");
    const tile = page?.querySelector<HTMLElement>(
      `[data-tw-tile="${ALBUM[0]!.id}"]`,
    );
    if (!el || !page || !tile) return;
    const r = offsetIn(tile, page);
    el.style.setProperty("--tw-tx", `${r.x}px`);
    el.style.setProperty("--tw-ty", `${r.y}px`);
    el.style.setProperty("--tw-tw", `${r.w}px`);
    el.style.setProperty("--tw-th", `${r.h}px`);
  }, []);

  const skip = (
    <Button
      type="button"
      variant="glass"
      size="cta"
      tabIndex={-1}
      data-tw-skip=""
      className="absolute right-4 bottom-16 md:right-8 md:bottom-6"
    >
      The album <SkipForward />
    </Button>
  );

  if (reduced)
    return (
      <div
        className="fixed inset-0 z-40 bg-black"
        data-tw-premiere="paused"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the reel's first photograph, a stand-in */}
        <img
          src={FRAMES[0]!.src}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <Beat still />
        <Dock />
        {skip}
      </div>
    );

  return (
    <div className="pointer-events-none fixed inset-0 z-40" data-tw-premiere="playing">
      <div className="tw-a tw-fade-out absolute inset-0 bg-black" style={at(DROP)} />
      {FRAMES.slice(0, -1).map((f, k) => (
        // eslint-disable-next-line @next/next/no-img-element -- the reel's frame, a stand-in photograph
        <img
          key={`${f.id}-${k}`}
          src={f.src}
          alt=""
          className="tw-a tw-reel-frame absolute inset-0 size-full object-cover"
          style={at(k * HOLD, { "--tw-hold": `${HOLD + 320}ms` } as CSSProperties)}
          data-tw-frame={k}
        />
      ))}
      <div
        ref={drop}
        className="tw-a tw-drop absolute overflow-hidden"
        style={{ left: 0, top: 0, width: "100%", height: "100%", ...at(DROP) }}
        data-tw-drop=""
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the roll's newest photograph, the album's first tile */}
        <img
          src={FRAMES[FRAMES.length - 1]!.src}
          alt=""
          className="tw-a tw-reel-last absolute inset-0 size-full object-cover"
          style={{
            objectPosition: ALBUM[0]!.focus,
            ...at((FRAMES.length - 1) * HOLD, { "--tw-hold": `${HOLD}ms` } as CSSProperties),
          }}
          data-tw-frame={FRAMES.length - 1}
        />
      </div>
      <div className="tw-a tw-fade-out absolute inset-0" style={at(DROP - 260)}>
        <Beat still={false} />
        <Bar run={DROP} />
        {skip}
      </div>
    </div>
  );
}

/** What this is, said once as it begins (the reel shows no event name, so the beat says the develop). */
function Beat({ still }: { still: boolean }) {
  return (
    <div
      className={cn(
        "absolute top-6 left-5 text-white md:top-10 md:left-10",
        !still && "tw-a tw-beat",
      )}
      style={still ? undefined : at(150)}
      data-tw-beat=""
    >
      <p className="text-label font-medium text-white/80 uppercase">
        Developed at 9 am
      </p>
      <p className="mt-1 text-sm text-white/85 tabular-nums">
        {`${ROLL_SIZE.shots} photos from ${ROLL_SIZE.guests} guests`}
      </p>
    </div>
  );
}

/** Her first open after the develop, the premiere first: the reel over the page, then the album. */
export function PremiereFrame({ screen }: { screen: ScreenId }) {
  const frame = SCREENS[screen];
  const box = albumWidth(frame.w);
  const album = planAlbum(ALBUM, box, frame.h * 1.4);
  const { reduced } = usePlay();
  return (
    <GuestPage
      nowMs={FIRST_OPEN_MS}
      ground={<CoverGround developAt={null} />}
      above={<Premiere />}
    >
      <section className="mt-3">
        <AlbumHead />
        <OpenRows
          tiles={album.tiles}
          height={album.height}
          from={reduced ? 0 : DROP + 120}
        />
      </section>
    </GuestPage>
  );
}
