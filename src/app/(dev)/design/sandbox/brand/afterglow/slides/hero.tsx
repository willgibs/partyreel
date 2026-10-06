"use client";

import { type ReactNode, useEffect, useRef } from "react";

import type { SlideProps } from "../../deck/contract";
import type { ReelId } from "../../deck/media";
import { Btn, ReelClock, reelShots, SiteNav } from "../kit";
import { SlideRoot } from "../root";
import { LitPhoto, Readout, ROOM, VOICE } from "../system";
import { useInk, useTake } from "../take";
import { DeskStage, deskOf, PhoneStage, ruleOf } from "./c-parts";

/**
 * 09 THE HOME HERO: partyreel.com's first screen, in the room.
 *
 * The site's own H1 and subhead stand in the dark, the buttons are the room's
 * achromatic pills, and the one live subject is the reel: the page's one light
 * is its Bloom (`take.light.ReelBloom`), which answers the reel shot by shot,
 * so the first thing the site says about colour is that it comes from the
 * photographs, at any party and any hour. Each take draws that light its own
 * way; the page round it never changes.
 *
 * ★ ONE REEL, ONE MOMENT, ONE LIGHT: the desk and the phone play the same
 * landscape reel under one `ReelClock`, so the two screens on the slide change
 * light together on every cut. The portrait reel would be the phone's own
 * hero, but two reels on one slide are two lights changing out of step, and
 * the clock can only hold one reel's time.
 */

const REEL: ReelId = "hero-candidate-02";

/**
 * ★ AT REST THE REEL STANDS ON ITS SECOND SHOT, the crowd under a warm stage
 * (2.2 s to 4.1 s), never its poster: the poster is the laser show, the most
 * many-coloured still in the set, and a home that rests on it opens on a
 * rainbow. Under reduced motion each reel on the slide is sought there once;
 * the Bloom hears the seek and lights that shot, so the rest state stays the
 * reel's own light, read off a frame it really shows.
 */
const REST_AT = 3;

function RestFrame({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = box.current;
    const win = root?.ownerDocument.defaultView;
    if (!root || !win?.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const undo: (() => void)[] = [];
    for (const v of root.querySelectorAll("video")) {
      const seek = () => {
        v.pause();
        v.currentTime = REST_AT;
      };
      if (v.readyState >= 1) seek();
      else {
        v.addEventListener("loadedmetadata", seek, { once: true });
        undo.push(() => v.removeEventListener("loadedmetadata", seek));
      }
    }
    return () => undo.forEach((f) => f());
  }, []);
  return (
    <div ref={box} className="contents">
      {children}
    </div>
  );
}

/**
 * THE LIGHT, SHOT BY SHOT: a still shows one moment of a light that changes
 * on every cut, so the slide prints the reel's shots in order, each in the
 * take's own Bloom as the reel's Bloom takes it from that shot: one sky a
 * shot, never a strip of swatches. Their gaps keep each light its own.
 */
function ShotLights({
  width,
  cols,
  gap,
}: {
  width: number;
  cols: number;
  gap: number;
}) {
  const take = useTake();
  const t = useInk("room");
  const { Bloom } = take.light;
  const shots = reelShots(REEL);
  const tw = Math.floor((width - gap * (cols - 1)) / cols);
  const th = Math.round((tw * 9) / 16);
  return (
    <div>
      {/* Set as the note's label is, so the two labels share a line. */}
      <div>
        <Readout style={{ color: t.faint }}>Its light, shot by shot</Readout>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${tw}px)`,
          columnGap: gap,
          rowGap: gap,
          marginTop: 14,
        }}
      >
        {shots.map((id, i) => (
          <Bloom
            key={`${id}-${i}`}
            source={{ photo: id }}
            ground="room"
            size={tw}
            radius={2}
            ignite={false}
          >
            <LitPhoto id={id} style={{ width: tw, height: th }} />
          </Bloom>
        ))}
      </div>
    </div>
  );
}

/** The site's H1 (`VOICE.thesis`), broken where a hero wants it. */
const THESIS = ["The whole", "event, in one", "album."] as const;

/** The home's trust strip: the site's own four promises (`trust-strip.tsx`). */
const PROMISES = [
  "No app required",
  "Unlisted by default",
  "Yours until you delete it",
  "No photo watermarks",
] as const;

/** The reel's box at a desk: its own 16:9, so no shot is cropped. */
const DESK_REEL = { w: 600, h: 338 } as const;
/** The first screen's left edge, the nav's own. */
const MARGIN = 72;

/** The first screen at a desk, drawn at 1440 by 900. */
function HeroDesk() {
  const take = useTake();
  const t = useInk("room");
  const { ReelBloom } = take.light;
  const words = 214;
  return (
    <div
      className="absolute inset-0"
      style={{ background: ROOM.room.hex, color: t.fg }}
    >
      <SiteNav ground="room" screen="desk" />
      <div
        className="absolute"
        style={{ left: MARGIN, top: words, width: 560 }}
      >
        <h1
          className="ag-display"
          aria-label={VOICE.thesis}
          data-bd-contrast="the H1 on the room"
          style={{ fontSize: 92, color: t.fg, marginLeft: -5 }}
        >
          {THESIS.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
        <p
          className="ag-lede"
          data-bd-contrast="the subhead on the room"
          style={{
            color: t.muted,
            fontSize: 19,
            lineHeight: 1.52,
            marginTop: 34,
            maxWidth: 452,
            textWrap: "pretty",
          }}
        >
          {VOICE.subhead}
        </p>
        <div className="flex" style={{ gap: 12, marginTop: 38 }}>
          <Btn ground="room" size="lg">
            Start free
          </Btn>
          <Btn ground="room" kind="secondary" size="lg">
            See how it works
          </Btn>
        </div>
      </div>
      {/* The reel's middle sits on the words' middle, its right edge on the nav's. */}
      <div
        className="absolute"
        style={{
          right: MARGIN,
          top: words + 229 - DESK_REEL.h / 2,
          width: DESK_REEL.w,
          height: DESK_REEL.h,
        }}
      >
        <ReelBloom
          reel={REEL}
          ground="room"
          width={DESK_REEL.w}
          radius={3}
          style={{ width: DESK_REEL.w, height: DESK_REEL.h }}
        />
      </div>
      <div
        className="absolute flex items-center justify-between"
        style={{
          left: MARGIN,
          right: MARGIN,
          bottom: 0,
          height: 92,
          borderTop: `1px solid ${ruleOf("room")}`,
        }}
      >
        {PROMISES.map((c) => (
          <Readout key={c} style={{ color: t.faint }}>
            {c}
          </Readout>
        ))}
      </div>
    </div>
  );
}

/** The reel's box on a phone: the column's width, at 16:9. */
const PHONE_REEL = { w: 335, h: 188 } as const;
/** Where the phone page's first screen ends and its promises begin. */
const PHONE_FOLD = 812;
/** The phone page's height: its first screen and the promises under it. */
const PHONE_PAGE = 1032;

/** The page on a phone, drawn at 375 wide: the first screen, then the promises. */
function HeroPhone() {
  const take = useTake();
  const t = useInk("room");
  const { ReelBloom } = take.light;
  return (
    <div
      className="absolute inset-x-0 top-0"
      style={{ height: PHONE_PAGE, background: ROOM.room.hex, color: t.fg }}
    >
      <SiteNav ground="room" screen="phone" />
      <div className="absolute" style={{ left: 20, right: 20, top: 140 }}>
        <h1
          className="ag-display"
          aria-label={VOICE.thesis}
          data-bd-read="the phone's H1"
          style={{ fontSize: 50, color: t.fg, marginLeft: -2 }}
        >
          {THESIS.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
        <p
          className="ag-lede"
          style={{
            color: t.muted,
            fontSize: 16,
            lineHeight: 1.5,
            marginTop: 20,
            textWrap: "pretty",
          }}
        >
          {VOICE.subhead}
        </p>
        <div className="flex" style={{ gap: 10, marginTop: 26 }}>
          <Btn ground="room" size="md">
            Start free
          </Btn>
          <Btn ground="room" kind="secondary" size="md">
            See how it works
          </Btn>
        </div>
      </div>
      <div
        className="absolute"
        style={{
          left: 20,
          top: 556,
          width: PHONE_REEL.w,
          height: PHONE_REEL.h,
        }}
      >
        <ReelBloom
          reel={REEL}
          ground="room"
          width={PHONE_REEL.w}
          radius={3}
          style={{ width: PHONE_REEL.w, height: PHONE_REEL.h }}
        />
      </div>
      <div
        className="absolute flex flex-col"
        style={{
          left: 20,
          right: 20,
          top: PHONE_FOLD + 36,
          borderTop: `1px solid ${ruleOf("room")}`,
        }}
      >
        {PROMISES.map((c) => (
          <div
            key={c}
            className="flex items-center"
            style={{ height: 42, borderBottom: `1px solid ${ruleOf("room")}` }}
          >
            <Readout style={{ color: t.faint }}>{c}</Readout>
          </div>
        ))}
      </div>
    </div>
  );
}

const LABEL = "The one light";

export function HeroSlide({ screen }: SlideProps) {
  const take = useTake();
  const note = take.words.notes.hero;
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <ReelClock>
          <RestFrame>
            <PhoneStage
              ground="room"
              pageH={PHONE_PAGE}
              page={<HeroPhone />}
              label={LABEL}
              note={note}
              after={<ShotLights width={335} cols={2} gap={36} />}
            />
          </RestFrame>
        </ReelClock>
      </SlideRoot>
    );
  return (
    <SlideRoot
      screen={screen}
      ground="room"
      style={{ background: deskOf(take, "room") }}
    >
      <ReelClock>
        <RestFrame>
          <DeskStage
            ground="room"
            url="partyreel.com"
            page={<HeroDesk />}
            phone={<HeroPhone />}
            phonePage={PHONE_PAGE}
            phoneCaption="The same page, 375 wide"
            label={LABEL}
            note={note}
            aside={<ShotLights width={360} cols={4} gap={24} />}
          />
        </RestFrame>
      </ReelClock>
    </SlideRoot>
  );
}
