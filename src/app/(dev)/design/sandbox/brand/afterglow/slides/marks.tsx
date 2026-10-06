"use client";

import type { CSSProperties, ReactNode } from "react";

import { WORDMARK_ASPECT } from "@/lib/brand/wordmark";

import type { SlideProps } from "../../deck/contract";
import { Wordmark, WORDMARK_GEOMETRY as G } from "../marks";
import { SlideRoot } from "../root";
import { type Ground, Readout } from "../system";
import { groundOf, inkOf, useTake } from "../take";
import { CUT, usePaperTop } from "./a-parts";
import { Label, useMeasure } from "./parts";

/**
 * 03 WORDMARK AND ICON: THE MARKS IN THE ROOM, AND ON THIS TAKE'S PAPER.
 *
 * The room on the left, paper on the right, cut where the cover cut, so each
 * mark meets its paper form across the line: the icon at its full size beside
 * its paper appearance, the wordmark (Will's v1, never lit) beside the lockup
 * on paper. The room side carries what every take shares (the icon's sizes
 * and its tinted appearance, the wordmark's construction); the paper side is
 * where the takes differ, so it is drawn as large as the room's.
 */

/** A line's lead (up to its first colon) in the full ink, the rest in the muted. */
function Led({ text, ground }: { text: string; ground: Ground }) {
  const t = inkOf(useTake(), ground);
  const at = text.indexOf(":");
  if (at < 0 || at > 40) return <span style={{ color: t.muted }}>{text}</span>;
  return (
    <span style={{ color: t.muted }}>
      <span style={{ color: t.fg }}>{text.slice(0, at + 1)}</span>
      {text.slice(at + 1)}
    </span>
  );
}

/**
 * THE WORDMARK WITH ITS CONSTRUCTION, drawn as a draughtsman would over it:
 * the x-height and the baseline, the one bar that carries r, t and y measured
 * above the letters, the three cuts on one 14 degree line and the stem's 12
 * degree slant. Every guide is a hairline in the room's faint ink, so the
 * construction sits behind the word and never competes with it.
 */
function Construction({ height }: { height: number }) {
  const t = inkOf(useTake(), "room");
  const s = height / 64;
  const w = Math.round(height * WORDMARK_ASPECT * 10) / 10;
  // The l's stem, extended: its x at a height (in the wordmark's units).
  const [sx0, sy0] = G.slant.from;
  const [sx1, sy1] = G.slant.to;
  const slantAt = (y: number) => sx0 + ((sx1 - sx0) * (y - sy0)) / (sy1 - sy0);
  const ext = (a: readonly number[], b: readonly number[], k: number) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    return {
      x1: a[0] - (dx / len) * k,
      y1: a[1] - (dy / len) * k,
      x2: b[0] + (dx / len) * k,
      y2: b[1] + (dy / len) * k,
    };
  };
  // The bar's dimension line stands above the letters.
  const dim = -9;
  const line = {
    vectorEffect: "non-scaling-stroke",
    strokeWidth: 1,
  } as const;
  const label: CSSProperties = { position: "absolute", color: t.faint };
  return (
    <div className="relative" style={{ width: w, height }}>
      <svg
        aria-hidden
        viewBox="0 0 308 64"
        width={w}
        height={height}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
        fill="none"
        stroke={t.faint}
      >
        <g opacity={0.55}>
          <line
            x1={-8}
            x2={316}
            y1={G.baseline}
            y2={G.baseline}
            strokeDasharray="1.6 1.6"
            {...line}
          />
          <line
            x1={-8}
            x2={316}
            y1={G.xHeight}
            y2={G.xHeight}
            strokeDasharray="1.6 1.6"
            {...line}
          />
        </g>
        <g opacity={0.8}>
          <line
            x1={slantAt(-7)}
            y1={-7}
            x2={slantAt(G.baseline + 9)}
            y2={G.baseline + 9}
            {...line}
          />
          {G.cuts.map((c, i) => (
            <line key={i} {...ext(c.from, c.to, 7)} {...line} />
          ))}
          <line x1={G.bar.x0} x2={G.bar.x1} y1={dim} y2={dim} {...line} />
          <line
            x1={G.bar.x0}
            x2={G.bar.x0}
            y1={dim - 2.2}
            y2={dim + 2.2}
            {...line}
          />
          <line
            x1={G.bar.x1}
            x2={G.bar.x1}
            y1={dim - 2.2}
            y2={dim + 2.2}
            {...line}
          />
        </g>
        <g opacity={0.4}>
          <line
            x1={G.bar.x0}
            x2={G.bar.x0}
            y1={dim + 2.2}
            y2={G.bar.y}
            strokeDasharray="1 1.4"
            {...line}
          />
          <line
            x1={G.bar.x1}
            x2={G.bar.x1}
            y1={dim + 2.2}
            y2={G.bar.y}
            strokeDasharray="1 1.4"
            {...line}
          />
        </g>
      </svg>
      <Wordmark
        height={height}
        color={t.fg}
        read="the wordmark in the room"
        style={{ position: "relative" }}
      />
      <Readout style={{ ...label, left: G.bar.x0 * s, top: dim * s - 22 }}>
        One bar: r, t, y
      </Readout>
      <Readout style={{ ...label, left: 0, top: G.baseline * s + 14 }}>
        14° cuts
      </Readout>
      <Readout
        style={{
          ...label,
          left: slantAt(G.baseline) * s - 92,
          top: G.baseline * s + 14,
        }}
      >
        12° slant
      </Readout>
    </div>
  );
}

/**
 * THE LOCKUP: the symbol and the word. ★ THE RULE (round one's, kept): the
 * symbol's centre stands on the middle of the word's x-height band, and a
 * third of the word's height lies between them. The symbol is the take's own
 * (its paper form on paper); the word takes the ground's ink and never glows.
 */
function Lockup({ h, ground }: { h: number; ground: Ground }) {
  const take = useTake();
  const { Symbol } = take.light;
  const t = inkOf(take, ground);
  const ring = Math.round(h * 0.94);
  const gap = Math.round(h / 3);
  const word = Math.round(h * WORDMARK_ASPECT * 10) / 10;
  const at = (u: number) => (u / 64) * h;
  const band = at((G.xHeight + G.baseline) / 2);
  const w = ring + gap + word;
  // The rule drawn as its own construction, the way the room draws the
  // word's: the x-height band across the word, the line its centre makes
  // running through the ring, and the gap measured above them.
  const dim = -12;
  const line = {
    strokeWidth: 1,
    shapeRendering: "geometricPrecision",
  } as const;
  const label: CSSProperties = { position: "absolute", color: t.faint };
  return (
    <div
      className="relative"
      data-bd-read={`the lockup on ${ground}`}
      style={{ width: w, height: h }}
    >
      <svg
        aria-hidden
        width={w}
        height={h}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
        fill="none"
        stroke={t.faint}
      >
        <g opacity={0.55} strokeDasharray="3 3">
          <line
            x1={ring + gap - 8}
            x2={w + 10}
            y1={at(G.xHeight)}
            y2={at(G.xHeight)}
            {...line}
          />
          <line
            x1={ring + gap - 8}
            x2={w + 10}
            y1={at(G.baseline)}
            y2={at(G.baseline)}
            {...line}
          />
        </g>
        <g opacity={0.8}>
          <line x1={-10} x2={w + 10} y1={band} y2={band} {...line} />
          <line x1={ring} x2={ring + gap} y1={dim} y2={dim} {...line} />
          <line x1={ring} x2={ring} y1={dim - 4} y2={dim + 4} {...line} />
          <line
            x1={ring + gap}
            x2={ring + gap}
            y1={dim - 4}
            y2={dim + 4}
            {...line}
          />
        </g>
      </svg>
      <div
        className="absolute"
        style={{
          left: 0,
          top: Math.round(band - ring / 2),
          width: ring,
          height: ring,
        }}
      >
        <Symbol size={ring} ground={ground} />
      </div>
      <Wordmark
        height={h}
        color={t.fg}
        style={{ position: "absolute", left: ring + gap, top: 0 }}
      />
      <Readout
        style={{
          ...label,
          left: ring + gap / 2,
          top: dim - 26,
          transform: "translateX(-50%)",
        }}
      >
        ⅓ height
      </Readout>
      <Readout style={{ ...label, left: 0, top: h + 16 }}>
        Centred on the x-height
      </Readout>
    </div>
  );
}

/** An icon at a real size with its label under it. */
function Sized({
  size,
  label,
  appearance = "room",
  ground = "room",
  read,
}: {
  size: number;
  label?: ReactNode;
  appearance?: "room" | "tinted" | "paper";
  ground?: Ground;
  read?: string;
}) {
  const { AppIcon } = useTake().light;
  return (
    <div className="flex flex-col items-start" style={{ gap: 12 }}>
      <AppIcon size={size} appearance={appearance} read={read} />
      {label ? <Label ground={ground}>{label}</Label> : null}
    </div>
  );
}

export function MarksSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const paperTop = usePaperTop();

  if (m.desk) {
    const px = CUT + m.pad;
    const pw = m.w - m.pad - px;
    const hero = 300;
    const iconTop = m.top + 32;
    const foot = iconTop + hero;
    const words = foot + 54;
    const second = words + 108;
    const mark = 124;
    const markTop = second + 66;
    // The lockup stands level with the room's word across the cut, its
    // measured gap where the room's measured bar is.
    const lock = 72;
    return (
      <SlideRoot screen={screen} ground="room">
        <div
          className="absolute"
          style={{
            left: CUT,
            top: paperTop,
            right: 0,
            bottom: 0,
            background: groundOf(take, "paper").hex,
          }}
        />

        {/* The room: the icon at its sizes, the 180 in its tinted
            appearance (the room's other home screen), so the three
            appearances meet across the cut: room, tinted, paper. */}
        <Label
          ground="room"
          style={{ position: "absolute", left: m.pad, top: m.top }}
        >
          The icon
        </Label>
        <div className="absolute" style={{ left: m.pad, top: iconTop }}>
          <Sized size={hero} label="Room" read="the icon in the room" />
        </div>
        <div
          className="absolute"
          style={{ left: m.pad + hero + 36, top: foot - 180 }}
        >
          <Sized size={180} appearance="tinted" label="Tinted · 180 px" />
        </div>
        <div
          className="absolute"
          style={{ left: m.pad + hero + 252, top: foot - 60 }}
        >
          <Sized size={60} label="60 px" />
        </div>
        <div
          className="absolute"
          style={{ left: m.pad + hero + 344, top: foot - 29 }}
        >
          <Sized size={29} label="29 px" />
        </div>
        <p
          className="ag-body absolute"
          style={{
            left: m.pad,
            top: words,
            width: 620,
            fontSize: 15,
            textWrap: "pretty",
          }}
        >
          <Led text={take.words.icon} ground="room" />
        </p>

        {/* The room: the wordmark, with its construction. */}
        <Label
          ground="room"
          style={{ position: "absolute", left: m.pad, top: second }}
        >
          The wordmark · your v1, untouched
        </Label>
        <div className="absolute" style={{ left: m.pad, top: markTop }}>
          <Construction height={mark} />
        </div>

        {/* Paper: the icon's paper appearance, and the lockup. */}
        <Label
          ground="paper"
          style={{ position: "absolute", left: px, top: m.top }}
        >
          On paper · {take.name}
        </Label>
        <div className="absolute" style={{ left: px, top: iconTop }}>
          <Sized
            size={hero}
            appearance="paper"
            ground="paper"
            label="Paper"
            read="the icon on paper"
          />
        </div>
        <p
          className="ag-body absolute"
          style={{
            left: px,
            top: words,
            width: Math.min(pw, 460),
            fontSize: 15,
            textWrap: "pretty",
          }}
        >
          <Led text={take.words.iconPaper} ground="paper" />
        </p>
        <Label
          ground="paper"
          style={{ position: "absolute", left: px, top: second }}
        >
          The lockup
        </Label>
        <div className="absolute" style={{ left: px, top: markTop }}>
          <Lockup h={lock} ground="paper" />
        </div>
      </SlideRoot>
    );
  }

  // The phone: the room above (the icon, its sizes, the wordmark), the cut,
  // and paper below (the paper appearance, the lockup).
  const cut = 950;
  const hero = 232;
  return (
    <SlideRoot screen={screen} ground="room">
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: cut, background: groundOf(take, "paper").hex }}
      />
      <div
        className="absolute flex flex-col"
        style={{ left: m.pad, top: m.top, width: m.inner }}
      >
        <Label ground="room">The icon</Label>
        <div style={{ marginTop: 16 }}>
          <Sized size={hero} label="Room" read="the icon in the room" />
        </div>
        <div className="flex items-end" style={{ marginTop: 30, gap: 24 }}>
          <Sized size={180} appearance="tinted" label="Tinted · 180 px" />
          <Sized size={60} label="60 px" />
          <Sized size={29} label="29 px" />
        </div>
        <p
          className="ag-body"
          style={{ marginTop: 26, fontSize: 14.5, textWrap: "pretty" }}
        >
          <Led text={take.words.icon} ground="room" />
        </p>
        <Label ground="room" style={{ marginTop: 44 }}>
          The wordmark · your v1
        </Label>
        <div style={{ marginTop: 44 }}>
          <Construction
            height={Math.floor((m.inner / WORDMARK_ASPECT) * 0.94)}
          />
        </div>
      </div>
      <div
        className="absolute flex flex-col"
        style={{ left: m.pad, top: cut + 40, width: m.inner }}
      >
        <Label ground="paper">On paper · {take.name}</Label>
        <div style={{ marginTop: 18 }}>
          <Sized
            size={hero}
            appearance="paper"
            ground="paper"
            label="Paper"
            read="the icon on paper"
          />
        </div>
        <p
          className="ag-body"
          style={{ marginTop: 24, fontSize: 14.5, textWrap: "pretty" }}
        >
          <Led text={take.words.iconPaper} ground="paper" />
        </p>
        <Label ground="paper" style={{ marginTop: 40 }}>
          The lockup
        </Label>
        <div style={{ marginTop: 56, marginLeft: 12 }}>
          <Lockup h={44} ground="paper" />
        </div>
      </div>
    </SlideRoot>
  );
}
