"use client";

import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { REEL_LINE } from "@/lib/constants/marketing-voice";

import { HEAD } from "../../deck/deck";
import { Reel } from "../../deck/media";
import { Display, type Screen, SlideRoot } from "../parts";
import { Edge, type EdgeItem, PARTY_EDGE, who } from "../system";
import { Pill, RollStrip, type RollFrame, SiteNav } from "./kit";

/**
 * 10 A DARK PAGE (/reel): the one page that is the room, because it is the
 * one page where film is projected. The reel plays as a projection with the
 * light edge on its bevel and nothing round it: the room's only colour is the
 * picture on the wall. Under it, the band credits every
 * frame as it plays (its number, and who shot it in their own light), and the
 * album's roll below advances as photos land.
 *
 * What it proves: colour in the room comes only from what is projected, never
 * from a brand hue, and the edge keeps order (whose photo, which frame) in
 * the dark as it does on paper.
 */

const REEL =
  MARKETING_REELS.find((r) => r.id === "hero-candidate-02") ??
  MARKETING_REELS[0];
const BOUNDS = REEL.shotBoundaries;

/** Who shot each frame the reel plays, and its number on the roll. */
const CREDITS = [
  { n: "31", who: who(3) },
  { n: "32", who: who(1) },
  { n: "33", who: who(2) },
  { n: "34", who: who(6) },
] as const;

const REEL_SUB =
  "Your guests are already capturing the best of it. The album plays it all back as a reel from the second photo, and nobody has to edit a thing.";
const LIVE_HEAD = "It starts at the second photo.";
const LIVE_SUB =
  "Every album plays as its own highlight reel, at the top of the album on every phone. Each upload joins it as it lands, and anything you hide drops out.";

/** The album's roll, in the room: the frames that feed the reel. */
const ROLL: readonly RollFrame[] = (
  [
    ["wedding-toast", undefined],
    ["reception-hall", undefined],
    ["wedding-golden", "40% 50%"],
    ["party-balloons", undefined],
    ["wedding-arch", "50% 40%"],
    ["concert-confetti", undefined],
    ["wedding-rings", undefined],
    ["festival-lights", undefined],
  ] as const
).map(([photo, focus], i) => ({
  photo,
  focus,
  // Each guest's own frame counter, so a roll drawn twice never shows its seam.
  n: String([12, 7, 21, 32, 15, 9, 26, 18][i]),
  who: who([0, 4, 5, 1, 2, 3, 6, 1][i]),
}));

const REBATE = [
  [{ text: "Partyreel", dim: true }, "25A"],
  ["Maya & Jay", "12.09.26"],
] as const;

/**
 * The board pauses a deck it is not showing by stopping CSS animations
 * (`data-bd-paused` on the slide), which cannot reach a video: this mirrors
 * that pause onto the projection's video, so a hidden deck plays nothing.
 */
function useBoardPause(box: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const v = box.current?.querySelector("video");
    const slide = box.current?.closest("[data-bd-slide]");
    if (!v || !slide) return;
    const reduce = v.ownerDocument.defaultView?.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const sync = () => {
      if (slide.hasAttribute("data-bd-paused")) v.pause();
      else if (!reduce) void v.play().catch(() => {});
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(slide, {
      attributes: true,
      attributeFilter: ["data-bd-paused"],
    });
    return () => mo.disconnect();
  }, [box]);
}

/** Which shot of the recording is on the screen, read off the video itself. */
function useShot(box: RefObject<HTMLDivElement | null>): number {
  const [shot, setShot] = useState(0);
  useEffect(() => {
    const v = box.current?.querySelector("video");
    if (!v) return;
    const read = () => {
      let i = 0;
      for (let k = 0; k < BOUNDS.length; k++)
        if (v.currentTime >= BOUNDS[k]) i = k;
      setShot((s) => (s === i ? s : i));
    };
    v.addEventListener("timeupdate", read);
    v.addEventListener("seeked", read);
    return () => {
      v.removeEventListener("timeupdate", read);
      v.removeEventListener("seeked", read);
    };
  }, [box]);
  return shot;
}

/**
 * THE PROJECTION: the reel on the wall, the light edge on its bevel and no
 * halo round it (the creative director's pass: a glow round the reel is
 * another vision's Bloom; this one's colour is the picture's alone). Its band
 * prints the event's edge and the frame on the screen, and changes with the cut.
 */
function Projection({
  w,
  band = 26,
  edgeSize = 11,
  compact = false,
  style,
}: {
  w: number;
  band?: number;
  edgeSize?: number;
  compact?: boolean;
  style?: CSSProperties;
}) {
  const h = Math.round((w * 9) / 16);
  const box = useRef<HTMLDivElement | null>(null);
  const shot = useShot(box);
  useBoardPause(box);
  const credit = CREDITS[shot] ?? CREDITS[0];
  const items: EdgeItem[] = [
    ...(compact ? PARTY_EDGE.slice(1, 3) : PARTY_EDGE),
    credit.n,
    { text: credit.who.name, seed: credit.who.seed },
  ];
  return (
    <div style={{ position: "relative", width: w, height: h + band, ...style }}>
      <div
        ref={box}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          overflow: "hidden",
          borderRadius: 2,
        }}
        data-bd-read="the reel, projected"
      >
        <Reel id="hero-candidate-02" />
        {/* The light edge: one pixel of light on the projection's bevel. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 2,
            boxShadow:
              "inset 0 1px 0 rgb(255 255 255 / 0.34), inset 0 0 0 1px rgb(255 255 255 / 0.07)",
          }}
        />
      </div>
      <Edge
        items={items}
        band
        size={edgeSize}
        height={band}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: h,
          background: "#191512",
          color: "#f3f0ea",
        }}
        read="the band, crediting the frame on the screen"
      />
    </div>
  );
}

export function DarkPage({
  layout,
  top = 0,
}: {
  layout: "desk" | "phone";
  top?: number;
}) {
  return layout === "desk" ? <DarkDesk top={top} /> : <DarkPhone top={top} />;
}

function DarkDesk({ top }: { top: number }) {
  return (
    <div
      className="cs-on-room"
      style={{
        position: "relative",
        width: 1440,
        height: 900,
        isolation: "isolate",
      }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, top }}>
        <SiteNav layout="desk" room current="Features" />
      </div>
      <div
        className="absolute"
        style={{ left: 64, top: top + 122, width: 560 }}
      >
        <Display as="h1" size={66} style={{ lineHeight: 0.96 }}>
          <span data-bd-read="h1, the reel's own line">{REEL_LINE}</span>
        </Display>
        <p
          className="cs-read cs-muted"
          style={{
            fontSize: 18,
            lineHeight: "28px",
            margin: "26px 0 0",
            maxWidth: 500,
          }}
        >
          {REEL_SUB}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
          <Pill size={16} tone="paper">
            Start free
          </Pill>
          <Pill size={16} tone="room-line">
            Try the live demo
          </Pill>
        </div>
      </div>
      <Projection
        w={704}
        style={{ position: "absolute", left: 672, top: top + 106 }}
      />
      <div
        className="absolute"
        style={{ left: 64, top: top + 590, width: 520 }}
      >
        <Display size={38} style={{ lineHeight: 1.02 }}>
          {LIVE_HEAD}
        </Display>
        <p
          className="cs-read cs-muted"
          style={{
            fontSize: 16,
            lineHeight: "25px",
            margin: "16px 0 0",
            maxWidth: 470,
          }}
        >
          {LIVE_SUB}
        </p>
      </div>
      <RollStrip
        frames={ROLL}
        frameW={170}
        gap={7}
        edgeSize={10}
        rebate={REBATE}
        advance
        newest={3}
        style={{
          position: "absolute",
          left: 672,
          top: top + 600,
          width: 1440 - 672,
        }}
      />
    </div>
  );
}

function DarkPhone({ top }: { top: number }) {
  return (
    <div
      className="cs-on-room"
      style={{
        position: "relative",
        width: 375,
        height: 1060 + top,
        isolation: "isolate",
      }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, top }}>
        <SiteNav layout="phone" room />
      </div>
      <div className="absolute" style={{ left: 16, right: 16, top: top + 86 }}>
        <Display as="h1" size={42} style={{ lineHeight: 0.98 }}>
          <span data-bd-read="h1, the reel's own line">{REEL_LINE}</span>
        </Display>
        <p
          className="cs-read cs-muted"
          style={{ fontSize: 16, lineHeight: "24px", margin: "16px 0 0" }}
        >
          {REEL_SUB}
        </p>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}
        >
          <Pill size={15} tone="paper">
            Start free
          </Pill>
          <Pill size={15} tone="room-line">
            Try the live demo
          </Pill>
        </div>
      </div>
      <Projection
        w={375}
        band={26}
        edgeSize={10}
        style={{ position: "absolute", left: 0, top: top + 412 }}
      />
      <div className="absolute" style={{ left: 16, right: 16, top: top + 690 }}>
        <Display size={32} style={{ lineHeight: 1.02 }}>
          {LIVE_HEAD}
        </Display>
        <p
          className="cs-read cs-muted"
          style={{ fontSize: 15, lineHeight: "23px", margin: "12px 0 0" }}
        >
          {LIVE_SUB}
        </p>
      </div>
      <RollStrip
        frames={ROLL}
        frameW={140}
        gap={5}
        edgeSize={9}
        rebate={REBATE}
        advance
        newest={1}
        offset={30}
        style={{ position: "absolute", left: 0, top: top + 900, width: 375 }}
      />
    </div>
  );
}

/* ── the slide ───────────────────────────────────────────────────────────── */

export function DarkPageSlide({ screen }: { screen: Screen }) {
  const desk = screen === "1440";
  return (
    <SlideRoot screen={screen} ground="room">
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <DarkPage layout={desk ? "desk" : "phone"} top={HEAD[screen]} />
      </div>
    </SlideRoot>
  );
}
