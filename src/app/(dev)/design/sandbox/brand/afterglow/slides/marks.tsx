"use client";

import type { CSSProperties, ReactNode } from "react";

import { WORDMARK_ASPECT } from "@/lib/brand/wordmark";

import type { SlideProps } from "../../deck/contract";
import { Wordmark, WORDMARK_GEOMETRY as G } from "../marks";
import { SlideRoot } from "../root";
import type { Ground } from "../system";
import { groundOf, inkOf, useTake } from "../take";
import { CUT, usePaperTop } from "./a-parts";
import { Label, useMeasure } from "./parts";

/**
 * 03 WORDMARK AND ICON: THE MARKS IN THE ROOM, AND ON THIS TAKE'S PAPER.
 *
 * The room on the left, paper on the right, cut where the cover cut, so each
 * mark meets its paper form across the line: the icon at its full size beside
 * its paper appearance, the wordmark (your v1, never lit) beside the lockup on
 * paper. The room side carries what every take shares (the icon's sizes and
 * its tinted appearance, the wordmark's construction); the paper side is where
 * the takes differ, so it is drawn as large as the room's.
 *
 * ★ A LABEL ONLY WHERE A READER WOULD BE LOST WITHOUT IT (the creative
 * director's pass): the grounds say which side is which, so the columns carry
 * no heads; the icons keep their appearance and size, and the constructions
 * are annotated in small lines, as a draughtsman writes on a drawing.
 */

/** A line's lead (up to its first colon) in the full ink, the rest in the muted. */
function Led({ text, ground }: { text: string; ground: Ground }) {
  const t = inkOf(useTake(), ground);
  const at = text.search(/[:.]/);
  if (at < 0 || at > 44) return <span style={{ color: t.muted }}>{text}</span>;
  return (
    <span style={{ color: t.muted }}>
      <span style={{ color: t.fg }}>{text.slice(0, at + 1)}</span>
      {text.slice(at + 1)}
    </span>
  );
}

/** A note on a drawing: a small line in the ground's faint ink. */
function Note({
  ground,
  children,
  style,
}: {
  ground: Ground;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = inkOf(useTake(), ground);
  return (
    <span
      className="ag-caption"
      style={{
        position: "absolute",
        color: t.faint,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
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
        <g opacity={0.55} strokeDasharray="1.6 1.6">
          <line x1={-8} x2={316} y1={G.baseline} y2={G.baseline} {...line} />
          <line x1={-8} x2={316} y1={G.xHeight} y2={G.xHeight} {...line} />
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
        <g opacity={0.4} strokeDasharray="1 1.4">
          <line
            x1={G.bar.x0}
            x2={G.bar.x0}
            y1={dim + 2.2}
            y2={G.bar.y}
            {...line}
          />
          <line
            x1={G.bar.x1}
            x2={G.bar.x1}
            y1={dim + 2.2}
            y2={G.bar.y}
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
      <Note ground="room" style={{ left: G.bar.x0 * s, top: dim * s - 22 }}>
        One bar for r, t and y
      </Note>
      <Note ground="room" style={{ left: 0, top: G.baseline * s + 12 }}>
        14° cuts
      </Note>
      <Note
        ground="room"
        style={{
          left: slantAt(G.baseline) * s - 64,
          top: G.baseline * s + 12,
        }}
      >
        12° slant
      </Note>
    </div>
  );
}

/**
 * THE LOCKUP: the symbol and the word. ★ THE RULE (round one's, kept): the
 * symbol's centre stands on the middle of the word's x-height band, and a
 * third of the word's height lies between them. ★ THE SYMBOL IS AS TALL AS THE
 * WORD'S CAPITALS, never its full height (the creative director's pass): a
 * ring sized to the descender reads as a ball heavier than the word. The
 * symbol is the take's own (its paper form on paper); the word takes the
 * ground's ink and never glows.
 */
function Lockup({ h, ground }: { h: number; ground: Ground }) {
  const take = useTake();
  const { Symbol } = take.light;
  const t = inkOf(take, ground);
  const at = (u: number) => (u / 64) * h;
  const ring = Math.round(at(G.baseline - G.capTop));
  const gap = Math.round(h / 3);
  const word = Math.round(h * WORDMARK_ASPECT * 10) / 10;
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
      <Note
        ground={ground}
        style={{
          left: ring + gap / 2,
          top: dim - 24,
          transform: "translateX(-50%)",
        }}
      >
        A third of its height
      </Note>
      <Note ground={ground} style={{ left: 0, top: h + 14 }}>
        Centred on the x-height, as tall as the capitals
      </Note>
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

/** The wordmark's one line, under it: what it is, and that it never glows. */
function MarkLine({ style }: { style?: CSSProperties }) {
  return (
    <p className="ag-body" style={{ fontSize: 15, ...style }}>
      <Led
        text="Your v1, untouched. The one mark that never glows: paper in the room, ink on paper."
        ground="room"
      />
    </p>
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
    const foot = m.top + hero;
    const words = foot + 62;
    const mark = 124;
    // The two marks stand level across the cut, each with its construction
    // annotated above it on one line.
    const markTop = words + 138;
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
        <div className="absolute" style={{ left: m.pad, top: m.top }}>
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
        <div className="absolute" style={{ left: m.pad, top: markTop }}>
          <Construction height={mark} />
        </div>
        <MarkLine
          style={{
            position: "absolute",
            left: m.pad,
            top: markTop + mark + 38,
            width: 620,
          }}
        />

        {/* Paper: the icon's paper appearance, and the lockup. */}
        <div className="absolute" style={{ left: px, top: m.top }}>
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
        <div className="absolute" style={{ left: px, top: markTop }}>
          <Lockup h={lock} ground="paper" />
        </div>
      </SlideRoot>
    );
  }

  // The phone: the room above (the icon, its sizes, the wordmark), the cut,
  // and paper below (the paper appearance, the lockup).
  const cut = 944;
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
        <Sized size={hero} label="Room" read="the icon in the room" />
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
        <div style={{ marginTop: 74 }}>
          <Construction
            height={Math.floor((m.inner / WORDMARK_ASPECT) * 0.94)}
          />
        </div>
        <MarkLine style={{ marginTop: 36, fontSize: 14.5 }} />
      </div>
      <div
        className="absolute flex flex-col"
        style={{ left: m.pad, top: cut + 40, width: m.inner }}
      >
        <Sized
          size={hero}
          appearance="paper"
          ground="paper"
          label="Paper"
          read="the icon on paper"
        />
        <p
          className="ag-body"
          style={{ marginTop: 24, fontSize: 14.5, textWrap: "pretty" }}
        >
          <Led text={take.words.iconPaper} ground="paper" />
        </p>
        <div style={{ marginTop: 76, marginLeft: 12 }}>
          <Lockup h={44} ground="paper" />
        </div>
      </div>
    </SlideRoot>
  );
}
