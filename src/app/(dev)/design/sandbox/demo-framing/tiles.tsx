"use client";

import "./demo-framing.css";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  memo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { Glow } from "@/components/shared/glow";
import { GlowFilter } from "@/components/shared/glow-filter";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { LiveCode, showCode } from "./code";
import type { Party } from "./fixtures";
import { Credit, lampOf, PINNED } from "./hero";
import {
  at,
  LIFT_MS,
  liftOf,
  LINE,
  LinkLine,
  len,
  PAPER,
  type Pair,
} from "./objects";
import { CinemaRoom, useOffStage } from "./scene";
import { type Score, typedAt, WAVE_MS, waveAt } from "./typing";

/**
 * THE ALBUM FILLS (a new hero of the lane's own): the stream's photographs
 * land instead of leaving. Two rows of the party's photographs, square and
 * level as an album's grid is (his note: grids never tilt), full bleed and
 * dissolving at the screen's edges as the band does, with the code at its
 * heart, four tiles big, and the link under it on the night.
 *
 * ★ THE TURNS, READ OFF THE SAME TABLE (`waveAt`): while an address stands its
 * album is full; as the next is erased and typed the album steps back (it
 * dims and its code folds into its heart) and the typing has the stage; as
 * it lands the new party's photographs fill the wall outward from the code,
 * the nearest first, each with its guest's credit, two columns at a time, as
 * if poured from the link into the album.
 *
 * ★ NOTHING IS UNDER A WORD: the wall stands over the link and the headline,
 * never behind them, so no scrim is needed and none is laid; the link and
 * the block hang under it in one measured column.
 *
 * ★ ONE SET OF NODES FOR EVERY GEOMETRY, as the shipped hero: every length is
 * `base + --hhs-k * (lg - base)`, the sheet setting `--hhs-k` per breakpoint
 * (`[data-df-wall-hero]`).
 */

const T = { base: 74, lg: 132 } as const;
const G = { base: 6, lg: 10 } as const;
/** The code's block: four tiles and the gap between them. */
const C = { base: 2 * T.base + G.base, lg: 2 * T.lg + G.lg } as const;
/** The code inside its block: a quiet zone of a little over two modules. */
const PAD = { base: 12, lg: 20 } as const;
const BLOCK_R = { base: 18, lg: 26 } as const;
/** The wall's foot to the link, and the link to the headline. */
const LINK_GAP = { base: 16, lg: 22 } as const;
const AIR = { base: 34, lg: 52 } as const;

/** Columns a side of the code: enough to run past a desk's edge. */
const SIDE = 5;

type Spot = {
  readonly key: string;
  /** Signed column from the code: -1 the first left, 1 the first right. */
  readonly col: number;
  readonly row: 0 | 1;
  /** Its turn in the fill: the columns nearest the code first, both sides at once. */
  readonly order: number;
  /** Which of a party's photographs it shows. */
  readonly photo: number;
};

const SPOTS: readonly Spot[] = (() => {
  const out: Spot[] = [];
  for (let k = 1; k <= SIDE; k++)
    for (const side of [-1, 1] as const)
      for (const row of [0, 1] as const)
        out.push({
          key: `${side}-${k}-${row}`,
          col: side * k,
          row,
          order: (k - 1) * 2 + row,
          // Neighbours vary: each side and row reads its own window of the set.
          photo: (k - 1) * 4 + (side < 0 ? 0 : 2) + row,
        });
  return out;
})();

const ORDERS = Math.max(...SPOTS.map((s) => s.order)) + 1;

/** When a spot's new photograph lands, from the address's landing, in ms. */
const landOf = (s: Spot) => 120 + (s.order / ORDERS) * WAVE_MS;

/** A spot's left edge, from the wall's centre: past the code's block. */
const leftOf = (s: Spot) => {
  const k = Math.abs(s.col) - 1;
  const off: Pair = {
    base: C.base / 2 + G.base + k * (T.base + G.base),
    lg: C.lg / 2 + G.lg + k * (T.lg + G.lg),
  };
  return s.col > 0 ? at(off) : `calc(-1 * (${at(off)}) - ${at(T)})`;
};

/** A spot's place in the fill: how many spots have landed once it has. */
const RANK = new Map(
  SPOTS.map((s) => [s.key, SPOTS.filter((x) => landOf(x) <= landOf(s)).length]),
);

const topOf = (s: Spot) =>
  s.row === 0 ? `calc(-1 * ${at(C)} / 2)` : `calc(${at(G)} / 2)`;

/** One tile: the last party's photograph under, the standing party's over it. */
const Tile = memo(function Tile({
  spot,
  over,
  under,
  still,
}: {
  spot: Spot;
  over: Party;
  under: Party | null;
  still: boolean;
}) {
  const pour = (p: Party) => p.pours[spot.photo % p.pours.length];
  const top = pour(over);
  return (
    <div
      data-df-wall-tile={spot.key}
      className="absolute overflow-hidden rounded-[var(--radius-tile)] bg-white/5 ring-1 ring-white/10 ring-inset"
      style={{
        left: `calc(50% + ${leftOf(spot)})`,
        top: `calc(50% + ${topOf(spot)})`,
        width: at(T),
        height: at(T),
        containerType: "size",
      }}
    >
      {under ? (
        <Image
          src={marketingImage(pour(under).photo).src}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      ) : null}
      <div
        key={over.slug}
        data-df-wall-in={still || !under ? undefined : ""}
        className="absolute inset-0"
      >
        <Image
          src={marketingImage(top.photo).src}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
        <Credit guest={top.guest} />
      </div>
    </div>
  );
});

export function WallStage({
  score,
  parties,
  addresses,
  block,
  forceLift = false,
}: {
  score: Score | null;
  parties: readonly Party[];
  addresses: readonly string[];
  block: ReactNode;
  forceLift?: boolean;
}) {
  const section = useRef<HTMLElement | null>(null);
  const wall = useRef<HTMLDivElement | null>(null);
  const elapsed = useRef(0);
  const off = useOffStage(section);
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const still = paused || off;
  const [hovered, setHovered] = useState(false);
  // The standing party, the one before it, and how many spots the new one
  // has reached: the wave's state, written on change only.
  const [turn, setTurn] = useState({ standing: 0, before: -1, reached: 99 });
  const [up, setUp] = useState(true);
  const upNow = useRef(true);
  const shown = useRef(turn);

  useEffect(() => {
    const root = section.current;
    const all = <E extends Element>(sel: string) =>
      root ? Array.from(root.querySelectorAll<E>(sel)) : [];
    const write = (text: string, caret: number) => {
      for (const el of all<HTMLElement>("[data-df-typed]")) {
        const node = el.firstChild;
        if (node && node.nodeValue !== text) node.nodeValue = text;
        else if (!node && text) el.textContent = text;
      }
      for (const el of all<HTMLElement>("[data-df-caret]")) {
        const o = caret.toFixed(2);
        if (el.style.opacity !== o) el.style.opacity = o;
      }
    };
    const code = (slug: string | null, photo: string) => {
      for (const el of all<SVGSVGElement>("svg[data-df-live]"))
        showCode(el, slug, photo);
    };
    if (reduced) {
      write(parties[0]?.slug ?? "", 0);
      code(parties[0]?.slug ?? null, parties[0]?.cover ?? "");
      wall.current?.style.setProperty("--df-rest", "0");
      return;
    }
    if (still) return;
    const win = root?.ownerDocument.defaultView ?? window;
    const typing = score && score.steps.length > 1 ? score : null;
    if (!typing) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = win.requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;
      const t = elapsed.current;
      const typed = typedAt(typing, t);
      write(typed.text, typed.caret);
      const wave = waveAt(typing, t);
      const standingUp = typed.phase === "hold";
      if (standingUp !== upNow.current) {
        upNow.current = standingUp;
        setUp(standingUp);
      }
      const p = parties[typed.standing] ?? parties[0];
      code(standingUp ? p.slug : null, p.cover);
      wall.current?.style.setProperty("--df-rest", wave.rest.toFixed(3));
      let reached = 0;
      for (const s of SPOTS) if (wave.since >= landOf(s)) reached++;
      const cur = shown.current;
      const next =
        typed.standing !== cur.standing
          ? { standing: typed.standing, before: cur.standing, reached }
          : reached !== cur.reached
            ? { ...cur, reached }
            : null;
      if (next) {
        shown.current = next;
        setTurn(next);
      }
    };
    raf = win.requestAnimationFrame(tick);
    return () => win.cancelAnimationFrame(raf);
  }, [reduced, still, score, parties]);

  const desk = () =>
    (section.current?.ownerDocument.defaultView?.innerWidth ?? 0) >= 640;
  const lifted = forceLift || hovered;
  const standing = parties[reduced ? 0 : turn.standing] ?? parties[0];
  const before =
    reduced || turn.before < 0 ? null : (parties[turn.before] ?? null);
  // A spot shows the standing party once the wave has reached it, and the
  // last party (dimmed with the album) until then.
  const reachedSpot = (s: Spot) =>
    before === null || (RANK.get(s.key) ?? 0) <= turn.reached;

  return (
    <CinemaRoom>
      <style>{PINNED}</style>
      <GlowFilter />
      <div data-df-hero className="h-full">
        <MarketingHeader skin="cinema" overlay />
        <section
          ref={(el) => {
            section.current = el;
            pauseRef(el);
          }}
          data-df-take="wall"
          data-df-wall-hero=""
          className="relative -mt-[var(--mkt-header-h,4rem)] flex min-h-[100svh] flex-col items-center justify-center overflow-clip bg-background pt-[var(--mkt-header-h,4rem)]"
        >
          <div
            ref={wall}
            data-df-wall=""
            className="relative w-full shrink-0"
            style={{ height: at(C) }}
          >
            <div className="pointer-events-none absolute top-1/2 left-1/2">
              {parties.map((p) => (
                <div
                  key={p.slug}
                  aria-hidden
                  className="absolute top-0 left-0 h-[520px] w-[min(760px,160vw)] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    opacity: p.slug === standing.slug ? 1 : 0,
                    transition: "opacity 900ms var(--ease-emphasis)",
                  }}
                >
                  <Glow
                    shape="bloom"
                    drive="mask"
                    colors={lampOf(p)}
                    vars={{
                      "--glw-from-x": "50%",
                      "--glw-from-y": "50%",
                      "--glw-reach": "56%",
                      "--glw-strength": "0.95",
                      "--glw-base": "0.34",
                      "--glw-blur": "26px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div aria-hidden data-df-wall-tiles="" className="absolute inset-0">
              {SPOTS.map((s) => {
                const on = reachedSpot(s);
                return (
                  <Tile
                    key={s.key}
                    spot={s}
                    over={on ? standing : (before ?? standing)}
                    under={on ? before : null}
                    still={still || reduced}
                  />
                );
              })}
            </div>
            <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <Link
                href="/demo"
                aria-label="Open the live demo"
                data-df-door=""
                className="block rounded-[26px] outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse" && desk()) setHovered(true);
                }}
                onPointerLeave={() => setHovered(false)}
                onFocus={() => {
                  if (desk()) setHovered(true);
                }}
                onBlur={() => setHovered(false)}
              >
                <WallObject
                  party={standing}
                  lifted={lifted}
                  still={still || reduced}
                  up={reduced || up}
                />
              </Link>
            </div>
          </div>
          <Link
            href="/demo"
            tabIndex={-1}
            aria-hidden
            className="relative z-10 flex items-center"
            style={{ marginTop: at(LINK_GAP), height: at(LINE) }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse" && desk()) setHovered(true);
            }}
            onPointerLeave={() => setHovered(false)}
          >
            <LinkLine
              slug={standing.slug}
              addresses={addresses}
              night
              lifted={lifted}
            />
          </Link>
          <div
            className="relative z-20 w-full px-4 text-center sm:px-6 md:px-8"
            style={
              {
                marginTop: at(AIR),
                "--hhs-h1-max": len(343, 920),
                "--hhs-low-max": len(343, 576),
              } as CSSProperties
            }
          >
            {block}
          </div>
        </section>
      </div>
    </CinemaRoom>
  );
}

/**
 * THE WALL'S OBJECT: the code, four tiles big, on its white block at the
 * album's heart. The link under the wall is its words; the block is what
 * lifts under a pointer.
 */
export function WallObject({
  party,
  lifted,
  still,
  up = true,
}: {
  party: Party;
  lifted: boolean;
  still: boolean;
  /** An address stands: the block is lit; dark glass while the next types. */
  up?: boolean;
}) {
  return (
    <span
      aria-hidden
      data-hero-object=""
      data-df-object="wall"
      data-df-tile=""
      data-df-lit={up ? "" : undefined}
      className="block"
      style={{
        width: at(C),
        height: at(C),
        padding: at(PAD),
        borderRadius: at(BLOCK_R),
        boxShadow: lifted ? PAPER.lifted : PAPER.rest,
        transform: liftOf(lifted),
        transition: `transform ${LIFT_MS}ms var(--ease-emphasis), box-shadow ${LIFT_MS}ms var(--ease-emphasis)`,
      }}
    >
      <LiveCode
        slug={party.slug}
        photo={party.cover}
        motion={!still}
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}
