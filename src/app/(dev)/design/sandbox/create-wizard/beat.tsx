"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Check, Printer, Share2 } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import type { Readiness } from "@/lib/events/readiness";
import { cn } from "@/lib/utils";

import {
  EVENT,
  headOf,
  railOf,
  REAL_LINK,
  roomOf,
  SAMPLE_LINK,
} from "./fixtures";
import { easeInOut, easeOut, reducedIn, span } from "./room";

/**
 * THE BEAT: THE CODE ALONE, LIT (his `hand=lit`: "This screen presents more
 * cleanly with less going on (first win), but also keeps hosts in the event
 * flow"). Settled in every option: the code is the moment, at its largest, lit
 * from below on the room's dark; Get it ready leads into Settings' first step;
 * and the hub's See it as a guest is the payoff later, never offered here.
 * The decision (`beat`) is the code's arrival, its acts and how what is left
 * reads:
 *
 *  - `develop`: the sample she styled develops into her real code where it
 *    stands, while Create's request runs; two quiet rounds (Print, Share);
 *    what is left as one line and Settings' five as ticks;
 *  - `rise`: the room dims, a light gathers on the floor and the code rises
 *    into it; Print table cards and Share link; Settings' five steps drawn
 *    as the rail Get it ready walks;
 *  - `two`: the code alone first, nothing else on the screen, and a moment
 *    later the hand-off rises under it as a sheet, the acts and what is left
 *    in it, Get it ready at its foot.
 *
 * ★ WHAT IS LEFT IS PRODUCTION'S READINESS, and this round it knows the
 * account (the ROADMAP's Host line): a host past 85% of her storage sees room
 * among what is left, said beside Settings' steps because room is the plan's,
 * never a step.
 *
 * ★ THE ARRIVAL IS ONE DRAWING AT `p` (as `Between` is): a still frame
 * holds it part-way, a looping one plays it where motion is welcome and stands
 * still at that point under reduced motion, and the live room plays it once.
 */

export type BeatWay = "develop" | "rise" | "two";

/** How long each arrival runs, ms (`two` includes the code's moment alone). */
export const BEAT_MS: Record<BeatWay, number> = {
  develop: 1500,
  rise: 1600,
  two: 2800,
};

/** Where each arrival is drawn when a frame holds it still. */
export const BEAT_MID: Record<BeatWay, number> = {
  develop: 0.3,
  rise: 0.42,
  two: 0.4,
};

/* ── what is left ─────────────────────────────────────────────────────── */

/** Settings' five as ticks, and the checklist's own head line beside them. */
function LeftLine({ r }: { r: Readiness }) {
  const steps = railOf(r);
  const room = roomOf(r);
  return (
    <div data-cw-left="line" className="flex flex-col items-center gap-2">
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1.5" aria-hidden>
          {steps.map((s) => (
            <span
              key={s.n}
              data-cw-step={s.n}
              data-done={s.done ? "true" : "false"}
              className={cn(
                "flex size-[15px] items-center justify-center rounded-full",
                s.done
                  ? "bg-success text-success-foreground"
                  : "ring-[1.5px] ring-foreground/30 ring-inset",
              )}
            >
              {s.done && <Check className="size-2.5" strokeWidth={3.5} />}
            </span>
          ))}
        </span>
        <span className="text-working text-muted-foreground">
          {headOf(r).line}
        </span>
      </span>
      {room && (
        <span
          data-cw-room
          className="flex items-center gap-2 text-caption text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-warning" aria-hidden />
          {room.line}
        </span>
      )}
    </div>
  );
}

/** Settings' five steps as the rail Get it ready walks, its head over it. */
function LeftRail({ r, wide }: { r: Readiness; wide: boolean }) {
  const steps = railOf(r);
  const room = roomOf(r);
  const head = headOf(r);
  return (
    <div
      data-cw-left="rail"
      className={cn("w-full", wide ? "max-w-[620px]" : "")}
    >
      <p className="text-center text-working font-medium">{head.title}</p>
      <p className="text-center text-caption text-muted-foreground">
        {head.line}
      </p>
      <ol className="relative mt-4 grid grid-cols-5">
        <span
          aria-hidden
          className="absolute top-[11px] right-[10%] left-[10%] h-px bg-foreground/15"
        />
        {steps.map((s) => (
          <li
            key={s.n}
            data-cw-step={s.n}
            data-done={s.done ? "true" : "false"}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            <span
              className={cn(
                "flex size-[23px] items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                s.done
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground ring-1 ring-foreground/10",
              )}
            >
              {s.done ? <Check className="size-3" strokeWidth={3.25} /> : s.n}
            </span>
            <span
              className={cn(
                "px-0.5 leading-tight text-balance",
                wide ? "text-caption" : "text-micro",
                s.done ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ol>
      {room && (
        <p
          data-cw-room
          className="mt-4 flex items-center justify-center gap-2 text-caption text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-warning" aria-hidden />
          {room.title}: {room.line.toLowerCase()}
        </p>
      )}
    </div>
  );
}

/** The checklist's open rows, titles only (production's `WhatIsLeft`), in the sheet. */
function LeftList({ r }: { r: Readiness }) {
  const head = headOf(r);
  return (
    <div data-cw-left="list" className="w-full">
      <p className="text-working font-medium">{head.title}</p>
      <p className="text-caption text-muted-foreground">{head.line}</p>
      <ul className="mt-2.5 space-y-1.5">
        {r.left.map((item) => (
          <li
            key={item.id}
            data-cw-step={item.id}
            data-done="false"
            className={cn(
              "flex items-center gap-2 text-caption",
              item.essential ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-3.5 shrink-0 rounded-full ring-[1.5px] ring-inset",
                item.id === "room" ? "ring-warning" : "ring-foreground/25",
              )}
            />
            {item.essential ? item.title : `${item.title}, worth doing`}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── the acts ─────────────────────────────────────────────────────────── */

function Rounds() {
  return (
    <div data-cw-acts="rounds" className="flex justify-center gap-9">
      {[
        { icon: Printer, label: "Print" },
        { icon: Share2, label: "Share" },
      ].map(({ icon: Icon, label }) => (
        <span key={label} className="flex flex-col items-center gap-2">
          <span className="cw-round size-14">
            <Icon className="size-5" />
          </span>
          <span className="text-caption text-muted-foreground">{label}</span>
        </span>
      ))}
    </div>
  );
}

function Doors({ wide }: { wide: boolean }) {
  return (
    <div
      data-cw-acts="doors"
      className={cn("flex gap-2", wide ? "justify-center" : "w-full")}
    >
      <Button
        variant="outline"
        size="lg"
        tabIndex={-1}
        className={wide ? "px-4" : "flex-1"}
      >
        <Printer /> Print table cards
      </Button>
      <Button
        variant="outline"
        size="lg"
        tabIndex={-1}
        className={wide ? "px-4" : "flex-1"}
      >
        <Share2 /> Share link
      </Button>
    </div>
  );
}

/* ── the code, lit ────────────────────────────────────────────────────── */

/**
 * The plate under its light. `develop` stacks the sample she styled over the
 * real code, so the one becomes the other where it stands.
 */
function LitCode({
  look,
  size,
  name,
  develop,
}: {
  look: QrStyleKey;
  size: number;
  name: string;
  develop?: boolean;
}) {
  const options = QR_PRESETS[look].options;
  return (
    <span data-cw-lit className="relative isolate block">
      <span data-cw-spill className="cw-spill" />
      <span
        data-cw-code={look}
        data-cw-picture="code"
        className="relative flex flex-col items-center rounded-[calc(var(--radius)*2.6)] bg-white text-black"
        style={{ padding: Math.round(size * 0.065) }}
      >
        <span className="relative block" style={{ width: size, height: size }}>
          <span data-cw-real className="absolute inset-0">
            <StyledQr
              value={REAL_LINK}
              size={size}
              style={options}
              className="[&>svg]:block"
            />
          </span>
          {develop && (
            <span data-cw-sample-code className="absolute inset-0 bg-white">
              <StyledQr
                value={SAMPLE_LINK}
                size={size}
                style={options}
                className="[&>svg]:block"
              />
            </span>
          )}
        </span>
        {develop && (
          <span
            data-cw-sample
            className="absolute top-[3px] left-1/2 -translate-x-1/2 rounded-full bg-black/[0.06] px-2 py-px text-micro font-medium tracking-[0.1em] text-black/55 uppercase"
          >
            Sample
          </span>
        )}
        <span
          className="max-w-full truncate px-2 pt-0.5 font-heading leading-tight"
          style={{ fontSize: Math.max(12, Math.round(size * 0.068)) }}
        >
          {name}
        </span>
      </span>
    </span>
  );
}

/* ── the arrival ──────────────────────────────────────────────────────── */

type BeatParts = {
  plate: HTMLElement | null;
  spill: HTMLElement | null;
  pool: HTMLElement | null;
  sample: HTMLElement | null;
  sampleCode: HTMLElement | null;
  real: HTMLElement | null;
  heading: HTMLElement | null;
  below: HTMLElement | null;
  foot: HTMLElement | null;
  sheet: HTMLElement | null;
  /** `two`: how far the code climbs and shrinks to stand over the sheet. */
  lift: { dy: number; k: number } | null;
};

const fade = (el: HTMLElement | null, o: number, dy = 0) => {
  if (!el) return;
  el.style.opacity = `${o}`;
  el.style.transform = dy ? `translateY(${dy}px)` : "";
};

function arrive(way: BeatWay, p: number, x: BeatParts) {
  if (way === "develop") {
    // The sample she styled softens away as her own code comes up sharp
    // under it; its one word goes as the code turns real.
    const dev = span(p, 0.12, 0.62);
    if (x.sampleCode) {
      x.sampleCode.style.opacity = `${1 - easeInOut(dev)}`;
      x.sampleCode.style.filter = `blur(${4 * dev}px)`;
    }
    if (x.real) x.real.style.filter = `blur(${6 * (1 - span(p, 0.2, 0.7))}px)`;
    fade(x.sample, 1 - span(p, 0.3, 0.52));
    fade(x.spill, easeOut(span(p, 0.3, 0.95)));
    const h = easeOut(span(p, 0.45, 0.8));
    fade(x.heading, h, (1 - h) * 8);
    const b = easeOut(span(p, 0.62, 1));
    fade(x.below, b, (1 - b) * 10);
    fade(x.foot, b);
    return;
  }
  if (way === "rise") {
    const pool = easeOut(span(p, 0, 0.45));
    if (x.pool) {
      x.pool.style.opacity = `${pool}`;
      x.pool.style.scale = `${0.6 + 0.4 * pool}`;
    }
    const up = easeOut(span(p, 0.18, 0.75));
    fade(x.plate, easeOut(span(p, 0.18, 0.6)), (1 - up) * 56);
    fade(x.spill, easeOut(span(p, 0.45, 0.9)));
    const h = easeOut(span(p, 0.5, 0.82));
    fade(x.heading, h, (1 - h) * 8);
    const b = easeOut(span(p, 0.66, 1));
    fade(x.below, b, (1 - b) * 10);
    fade(x.foot, b);
    return;
  }
  // two: the code alone, then the hand-off rises under it.
  const a = easeOut(span(p, 0, 0.16));
  fade(x.heading, a);
  fade(x.spill, easeOut(span(p, 0.04, 0.3)));
  const s = easeInOut(span(p, 0.62, 0.94));
  if (x.plate) {
    x.plate.style.opacity = `${a}`;
    x.plate.style.transform = x.lift
      ? `translateY(${-x.lift.dy * s}px) scale(${1 - (1 - x.lift.k) * s})`
      : "";
  }
  if (x.sheet) {
    // Off the screen's foot until it rises, a floating card's gap included.
    const down = 1 - easeOut(span(p, 0.62, 1));
    x.sheet.style.transform = `translateY(calc(${down * 100}% + ${down * 64}px))`;
  }
}

/**
 * THE BEAT'S CENTRE, its arrival at `at` (a still), looping (`loop`) or
 * played once (`play`, the live room). It reaches its room's heading and foot
 * by their hooks, since the arrival moves the whole screen.
 */
export function BeatCentre({
  way,
  wide,
  r,
  look,
  name = EVENT.name,
  at = 1,
  loop,
  play,
  onGo,
}: {
  way: BeatWay;
  wide: boolean;
  r: Readiness;
  look: QrStyleKey;
  name?: string;
  at?: number;
  loop?: boolean;
  play?: boolean;
  /** `two`'s sheet carries the foot's one button. */
  onGo?: () => void;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const size =
    way === "two"
      ? wide
        ? 264
        : 232
      : way === "rise"
        ? wide
          ? 236
          : 188
        : wide
          ? 252
          : 200;

  useLayoutEffect(() => {
    const el = root.current;
    const screen = el?.closest<HTMLElement>("[data-cw-screen]");
    if (!el || !screen) return;
    const q = <T extends HTMLElement>(s: string) => screen.querySelector<T>(s);
    const parts: BeatParts = {
      plate: q("[data-cw-plate]"),
      spill: q("[data-cw-spill]"),
      pool: q("[data-cw-pool]"),
      sample: q("[data-cw-sample]"),
      sampleCode: q("[data-cw-sample-code]"),
      real: q("[data-cw-real]"),
      heading: q("[data-cw-question]"),
      below: q("[data-cw-below]"),
      foot: q("[data-cw-foot]"),
      sheet: q("[data-cw-sheet]"),
      lift: null,
    };
    const win = screen.ownerDocument.defaultView;
    if (!win) return;
    let now = play ? 0 : at;
    const apply = (p: number) => {
      now = p;
      arrive(way, p, parts);
    };
    // `two`: measured at rest, so the code stands centred over the risen
    // sheet; read again once the frame's styles and fonts land (`Between`'s
    // own reason: a portalled frame's first layout is unstyled).
    const measure = () => {
      if (way !== "two" || !parts.plate || !parts.sheet || !parts.heading)
        return;
      parts.plate.style.transform = "";
      parts.sheet.style.transform = "";
      const box = parts.plate.getBoundingClientRect();
      const top = parts.heading.getBoundingClientRect().bottom;
      const sheetTop = parts.sheet.getBoundingClientRect().top;
      if (box.height < 2) return;
      const room = sheetTop - top - (wide ? 48 : 28);
      const k = Math.min(1, room / box.height);
      const target = top + (sheetTop - top) / 2;
      parts.lift = { dy: box.top + box.height / 2 - target, k };
    };
    measure();
    const again = () => {
      measure();
      apply(now);
    };
    const ro = new win.ResizeObserver(again);
    ro.observe(screen);
    win.document.fonts?.ready.then(again).catch(() => {});
    const reduced = reducedIn(screen);
    if (play && !reduced) {
      let raf = 0;
      const t0 = win.performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / BEAT_MS[way]);
        apply(p);
        if (p < 1) raf = win.requestAnimationFrame(tick);
      };
      apply(0);
      raf = win.requestAnimationFrame(tick);
      return () => {
        ro.disconnect();
        win.cancelAnimationFrame(raf);
      };
    }
    if (loop && !reduced) {
      // The arrival, a long look at the beat at rest, a quick fade, again.
      const ms = BEAT_MS[way];
      const hold = 2600;
      const out = 360;
      let raf = 0;
      const t0 = win.performance.now();
      const tick = (t: number) => {
        const c = (t - t0) % (ms + hold + out);
        if (c < ms) {
          screen.style.opacity = "1";
          apply(c / ms);
        } else if (c < ms + hold) {
          apply(1);
        } else {
          screen.style.opacity = `${1 - (c - ms - hold) / out}`;
        }
        raf = win.requestAnimationFrame(tick);
      };
      raf = win.requestAnimationFrame(tick);
      return () => {
        ro.disconnect();
        win.cancelAnimationFrame(raf);
        screen.style.opacity = "";
      };
    }
    apply(play ? 1 : at);
    return () => ro.disconnect();
  }, [way, wide, at, loop, play]);

  // A live room's Get it ready in the sheet; still frames draw it inert.
  const go = useRef(onGo);
  useEffect(() => {
    go.current = onGo;
  });

  const plate = (
    <span
      data-cw-plate
      data-cw-hero
      className="relative isolate block origin-center"
    >
      {way === "rise" && <span data-cw-pool className="cw-pool" />}
      <LitCode
        look={look}
        size={size}
        name={name}
        develop={way === "develop"}
      />
    </span>
  );

  if (way === "two")
    return (
      <div
        ref={root}
        data-cw-beat={way}
        className="flex w-full flex-1 flex-col items-center justify-center"
      >
        {plate}
        <div
          data-cw-sheet
          // A sheet from the foot at a phone; at a desk a card that floats up
          // under the code, the room showing round it.
          className={cn(
            "absolute inset-x-0 z-10 mx-auto bg-card text-card-foreground shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-foreground/10",
            wide
              ? "bottom-10 max-w-[540px] rounded-[28px] px-7 pt-3 pb-7"
              : "bottom-0 rounded-t-[28px] px-5 pt-3 pb-5",
          )}
        >
          <span
            aria-hidden
            className="mx-auto mb-4 block h-1 w-9 rounded-full bg-foreground/20"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              tabIndex={-1}
              className="flex-1"
            >
              <Printer /> Print
            </Button>
            <Button
              variant="outline"
              size="lg"
              tabIndex={-1}
              className="flex-1"
            >
              <Share2 /> Share
            </Button>
          </div>
          <div className="mt-5">
            <LeftList r={r} />
          </div>
          <Button
            data-cw-go
            size="cta"
            tabIndex={onGo ? 0 : -1}
            onClick={onGo ? () => go.current?.() : undefined}
            className="mt-5 w-full"
          >
            Get it ready
          </Button>
        </div>
      </div>
    );

  return (
    <div
      ref={root}
      data-cw-beat={way}
      className="flex w-full flex-col items-center"
    >
      {plate}
      <div
        data-cw-below
        className={cn(
          "flex w-full flex-col items-center",
          way === "develop"
            ? wide
              ? "mt-12 gap-9"
              : "mt-10 gap-7"
            : wide
              ? "mt-10 gap-8"
              : "mt-8 gap-6",
        )}
      >
        {way === "develop" ? <Rounds /> : <Doors wide={wide} />}
        {way === "develop" ? (
          <LeftLine r={r} />
        ) : (
          <LeftRail r={r} wide={wide} />
        )}
      </div>
    </div>
  );
}
