"use client";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
import { AppIcon, Lockup, Wordmark, WORDMARK_GEOMETRY as G } from "./marks";
import { ink, SlideRoot } from "./root";
import { GROUND, INK, Readout } from "./system";

/**
 * 03 WORDMARK AND ICON. The icon on the room at 1024 style and at its three
 * real sizes (180, 60, 29, drawn 1:1, each with its own optics); the
 * wordmark large on the room with its construction, then on paper, then the
 * lockup.
 */

/** The wordmark with its construction drawn over it, in the ground's faint ink. */
function Construction({ height, ground }: { height: number; ground: "room" | "paper" }) {
  const s = height / 64;
  const w = 308 * s;
  const guide = INK[ground].faint.hex;
  const word = INK[ground].fg.hex;
  const slantAt = (y: number) => G.slant.from[0] - 8.3 * (y / 39.4);
  const ext = (a: readonly number[], b: readonly number[], k: number) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    return [a[0] - (dx / len) * k, a[1] - (dy / len) * k, b[0] + (dx / len) * k, b[1] + (dy / len) * k];
  };
  return (
    <div className="relative" style={{ width: w, height }}>
      <Wordmark height={height} color={word} read="wordmark" />
      <svg
        aria-hidden
        viewBox="0 0 308 64"
        width={w}
        height={height}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
        fill="none"
        stroke={guide}
        strokeWidth={0.32}
      >
        <line x1={-12} x2={320} y1={G.baseline} y2={G.baseline} strokeDasharray="1.2 1.2" />
        <line x1={-12} x2={320} y1={G.xHeight} y2={G.xHeight} strokeDasharray="1.2 1.2" />
        <line x1={slantAt(-9)} y1={-9} x2={slantAt(66)} y2={66} />
        {G.cuts.map((c, i) => {
          const [x1, y1, x2, y2] = ext(c.from, c.to, 7);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <line x1={G.bar.x0} x2={G.bar.x1} y1={G.bar.y - 4} y2={G.bar.y - 4} />
        <line x1={G.bar.x0} x2={G.bar.x0} y1={G.bar.y - 5.6} y2={G.bar.y - 2.4} />
        <line x1={G.bar.x1} x2={G.bar.x1} y1={G.bar.y - 5.6} y2={G.bar.y - 2.4} />
      </svg>
      <Readout
        className="absolute"
        style={{ color: guide, left: (G.bar.x0 + 4) * s, top: (G.bar.y - 4) * s - 26 }}
      >
        One bar, r t y
      </Readout>
      <Readout
        className="absolute"
        style={{ color: guide, left: slantAt(66) * s - 34, top: 66 * s + 8 }}
      >
        12° slant
      </Readout>
      <Readout
        className="absolute"
        style={{ color: guide, left: -12 * s, top: G.baseline * s + 26 }}
      >
        14° cuts
      </Readout>
    </div>
  );
}

function IconSizes({ ground, gap = 28 }: { ground: "room" | "paper"; gap?: number }) {
  const t = ink(ground);
  return (
    <div className="flex items-end" style={{ gap }}>
      {[180, 60, 29].map((s) => (
        <div key={s} className="flex flex-col items-start gap-2.5">
          <AppIcon size={s} read={s === 180 ? "icon at 180" : undefined} />
          <Readout style={{ color: t.faint }}>{s} px</Readout>
        </div>
      ))}
    </div>
  );
}

export function MarksSlide({ screen }: SlideProps) {
  const room = ink("room");
  const paper = ink("paper");
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <div className="absolute inset-x-0 px-6" style={{ top: HEAD[screen] + 28 }}>
          <Readout style={{ color: room.faint }}>The icon</Readout>
          <div className="mt-4 flex justify-center">
            <AppIcon size={232} read="icon, 1024 style" />
          </div>
          <p className="ag-body mt-5" style={{ color: room.muted, fontSize: 14 }}>
            <span style={{ color: room.fg }}>The shutter.</span> A dark disc in a ring of
            light: what a guest presses to add a photograph is the brand on a home screen.
          </p>
          <div className="mt-7">
            <IconSizes ground="room" gap={22} />
          </div>
          <Readout className="mt-12 block" style={{ color: room.faint }}>
            The wordmark
          </Readout>
          <div className="mt-6">
            <Construction height={64} ground="room" />
          </div>
          <p className="ag-body mt-14" style={{ color: room.muted, fontSize: 14 }}>
            <span style={{ color: room.fg }}>Will&apos;s own drawing, kept.</span> The one
            mark that never glows: its letters run joined, like frames on a reel.
          </p>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 px-6 pt-10"
          style={{ top: 1088, background: GROUND.paper.hex, color: paper.fg }}
        >
          <Readout style={{ color: paper.faint }}>On paper</Readout>
          <div className="mt-5">
            <Wordmark height={48} color={paper.fg} read="wordmark on paper" />
          </div>
          <Readout className="mt-12 block" style={{ color: paper.faint }}>
            The lockup
          </Readout>
          <div className="mt-6 pl-3">
            <Lockup height={36} ground="paper" read="lockup on paper" />
          </div>
          <p className="ag-body mt-8" style={{ color: paper.muted, fontSize: 14 }}>
            The ring&apos;s centre on the x-height. The light stays the symbol&apos;s; the
            word takes the ground&apos;s ink.
          </p>
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="room">
      {/* The icon, on the room: 1024 style, then its three real sizes, 1:1. */}
      <div className="absolute" style={{ left: 64, top: 104, width: 590 }}>
        <Readout style={{ color: room.faint }}>The icon</Readout>
        <div className="mt-5 flex items-start" style={{ gap: 40 }}>
          <AppIcon size={300} read="icon, 1024 style" />
          <div className="flex flex-col" style={{ gap: 26 }}>
            <div className="flex flex-col items-start gap-2.5">
              <AppIcon size={180} read="icon at 180" />
              <Readout style={{ color: room.faint }}>180 px</Readout>
            </div>
            <div className="flex items-end" style={{ gap: 26 }}>
              {[60, 29].map((s) => (
                <div key={s} className="flex flex-col items-start gap-2.5">
                  <AppIcon size={s} />
                  <Readout style={{ color: room.faint }}>{s} px</Readout>
                </div>
              ))}
            </div>
            <p className="ag-caption" style={{ color: room.faint, maxWidth: 190, marginTop: -6 }}>
              Cut for its size: the bevel goes at 60, the corona at 29, where the band
              thickens to stay a ring.
            </p>
          </div>
        </div>
        <p
          className="ag-body"
          style={{ color: room.muted, fontSize: 15, marginTop: 34, maxWidth: 540 }}
        >
          <span style={{ color: room.fg }}>The shutter.</span>
          {" A dark disc in a ring of light: what a guest presses to add a photograph is the brand on a home screen. Its light is the house five, weighted the way Partyreel's own photographs light, falling from the top left like every light in the product."}
        </p>
        <div className="flex items-end gap-7" style={{ marginTop: 34 }}>
          {(["room", "tinted", "paper"] as const).map((a) => (
            <div key={a} className="flex flex-col items-start gap-2.5">
              <AppIcon size={72} appearance={a} />
              <Readout style={{ color: room.faint }}>
                {a === "room" ? "Default" : a === "tinted" ? "Tinted" : "On a print"}
              </Readout>
            </div>
          ))}
        </div>
      </div>

      {/* The wordmark, large, on the room, with its construction. */}
      <div className="absolute" style={{ left: 760, top: 104, right: 64 }}>
        <Readout style={{ color: room.faint }}>The wordmark</Readout>
        <div style={{ marginTop: 78, marginLeft: 4 }}>
          <Construction height={112} ground="room" />
        </div>
        <p
          className="ag-body"
          style={{ color: room.muted, fontSize: 15, marginTop: 70, maxWidth: 560 }}
        >
          <span style={{ color: room.fg }}>Will&apos;s own drawing, kept untouched.</span>
          {" The one mark that never glows: ink on paper, paper in the room. Its letters run joined, like frames on a reel, and its cuts lean on one angle."}
        </p>
      </div>

      {/* On paper: the wordmark, and the lockup. */}
      <div
        className="absolute"
        style={{ left: 696, right: 0, top: 572, bottom: 0, background: GROUND.paper.hex }}
      >
        <div className="absolute" style={{ left: 64, top: 48 }}>
          <Readout style={{ color: paper.faint }}>On paper</Readout>
          <div className="mt-7">
            <Wordmark height={58} color={paper.fg} read="wordmark on paper" />
          </div>
        </div>
        <div className="absolute" style={{ left: 432, top: 48 }}>
          <Readout style={{ color: paper.faint }}>The lockup</Readout>
          <div className="mt-8 pl-3">
            <Lockup height={40} ground="paper" read="lockup on paper" />
          </div>
        </div>
        <p
          className="ag-body absolute"
          style={{ left: 64, top: 206, maxWidth: 600, color: paper.muted, fontSize: 14 }}
        >
          The lockup sets the ring&apos;s centre on the x-height, a third of the
          word&apos;s height apart. The light stays the symbol&apos;s; the word takes the
          ground&apos;s ink.
        </p>
      </div>
    </SlideRoot>
  );
}
