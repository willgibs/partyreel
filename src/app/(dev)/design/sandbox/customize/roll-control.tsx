"use client";

import { Minus, Plus } from "lucide-react";
import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FILM_SIZES, ROLL_MAX, ROLL_MIN } from "./fixtures";

/**
 * THE ROLL'S CONTROL, FOUR WAYS (the `roll` ask). Production has no control
 * for the roll's size (`settings-state.tsx` reads `rollSize` and never writes
 * it), so this is the one new piece every option of the ask draws; Settings
 * and Create around it are production's.
 *
 *  - `film`: film's three sizes as three boxes, each with a strip of frames
 *    as long as its roll, so 36 reads as more before a number is read;
 *  - `count`: a stepper, 1 to 99, opening on 24;
 *  - `both`: film's three and Other, which opens the stepper in its place;
 *  - `wind`: a strip of numbers wound like a camera's frame counter, film's
 *    three marked on the way.
 *
 * ★ ONE MATERIAL IN BOTH ROOMS. Every colour is a token (the foreground, the
 * muted ink, the card's ring), so the same control stands on Settings' paper
 * and in Create's dark room with nothing forked; the picked box wears the
 * album style card's own picked state (`camera-settings.tsx`'s `StyleCard`).
 *
 * ★ THE STRIP IS THE ROLL'S LENGTH, NOT DECORATION: a frame a mark for every
 * three shots, the 36's three times the 12's, so the boxes compare at a glance
 * (bible 6: achromatic, the photograph keeps the colour).
 */

export type RollWay = "film" | "count" | "both" | "wind";

/** "12 shots each", the words a sentence and a caption say. */
export const shotsEach = (n: number) => `${n} ${n === 1 ? "shot" : "shots"} each`;

const clampRoll = (n: number) =>
  Math.min(ROLL_MAX, Math.max(ROLL_MIN, Math.round(n)));

/* ── film's three ─────────────────────────────────────────────────────── */

/** A roll's length as a strip: one mark for every three shots. */
function Strip({ shots }: { shots: number }) {
  return (
    <span
      aria-hidden
      className="cz-strip"
      style={{ "--cz-len": shots / 36 } as CSSProperties}
    >
      {Array.from({ length: Math.round(shots / 3) }, (_, i) => (
        <span key={i} className="cz-strip-frame" />
      ))}
    </span>
  );
}

function FilmBox({
  shots,
  on,
  onPick,
}: {
  shots: number;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={`${shots} shots`}
      data-cz-film={shots}
      data-state={on ? "on" : "off"}
      onClick={onPick}
      className="cz-box"
    >
      <span className="cz-box-n font-heading tabular-nums">{shots}</span>
      <span className="cz-box-unit text-caption text-muted-foreground">
        shots
      </span>
      <Strip shots={shots} />
    </button>
  );
}

function OtherBox({ on, onPick }: { on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label="Another number of shots"
      data-cz-film="other"
      data-state={on ? "on" : "off"}
      onClick={onPick}
      className="cz-box"
    >
      <span className="cz-box-n cz-box-other font-heading">Other</span>
      <span className="cz-box-unit text-caption text-muted-foreground">
        {`${ROLL_MIN} to ${ROLL_MAX}`}
      </span>
      <span aria-hidden className="cz-strip cz-strip-open" />
    </button>
  );
}

/* ── any count ────────────────────────────────────────────────────────── */

/** The stepper: minus, the count, plus, and what most parties pick beside it. */
export function RollStepper({
  value,
  onChange,
  hint = true,
}: {
  value: number;
  onChange: (n: number) => void;
  hint?: boolean;
}) {
  return (
    <div data-cz-stepper={value} className="cz-stepper">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Fewer shots"
        disabled={value <= ROLL_MIN}
        onClick={() => onChange(clampRoll(value - 1))}
      >
        <Minus />
      </Button>
      <span className="cz-stepper-n">
        <span className="font-heading text-page tabular-nums">{value}</span>
        <span className="text-caption text-muted-foreground">shots each</span>
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="More shots"
        disabled={value >= ROLL_MAX}
        onClick={() => onChange(clampRoll(value + 1))}
      >
        <Plus />
      </Button>
      {hint ? (
        <span className="cz-stepper-hint text-caption text-muted-foreground">
          {`${ROLL_MIN} to ${ROLL_MAX}`}
        </span>
      ) : null}
    </div>
  );
}

/* ── the frame counter ────────────────────────────────────────────────── */

const NUMBERS = Array.from(
  { length: ROLL_MAX - ROLL_MIN + 1 },
  (_, i) => ROLL_MIN + i,
);

/**
 * THE FRAME COUNTER: every count from 1 to 99 on one strip she winds, the one
 * under the notch picked; film's three wear a dot. A wheel scrolls it and it
 * snaps to a number, so a flick lands on one. Still, it stands where it is
 * drawn: the picked number under the notch from the first paint.
 */
export function RollWinder({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const strip = useRef<HTMLDivElement | null>(null);
  const settle = useRef<number | null>(null);
  // The picked number under the notch before the first paint, and again whenever the value moves from outside.
  useLayoutEffect(() => {
    const el = strip.current;
    const cell = el?.querySelector<HTMLElement>(`[data-cz-n="${value}"]`);
    if (!el || !cell) return;
    el.scrollLeft = cell.offsetLeft + cell.offsetWidth / 2 - el.clientWidth / 2;
  }, [value]);
  useEffect(
    () => () => {
      if (settle.current) window.clearTimeout(settle.current);
    },
    [],
  );
  const onScroll = () => {
    if (settle.current) window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = strip.current;
      if (!el) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      const cells = [...el.querySelectorAll<HTMLElement>("[data-cz-n]")];
      const near = cells.reduce((best, c) =>
        Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) <
        Math.abs(best.offsetLeft + best.offsetWidth / 2 - mid)
          ? c
          : best,
      );
      const n = Number(near.dataset.czN);
      if (n !== value) onChange(n);
    }, 120);
  };
  return (
    <div data-cz-winder={value} className="cz-wind">
      <p className="cz-wind-read">
        <span className="font-heading text-page tabular-nums">{value}</span>
        <span className="text-caption text-muted-foreground">shots each</span>
      </p>
      <div className="cz-wind-window">
        <span aria-hidden className="cz-wind-notch" />
        <div
          ref={strip}
          role="slider"
          tabIndex={0}
          aria-label="Shots each"
          aria-valuemin={ROLL_MIN}
          aria-valuemax={ROLL_MAX}
          aria-valuenow={value}
          onScroll={onScroll}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") onChange(clampRoll(value + 1));
            if (e.key === "ArrowLeft") onChange(clampRoll(value - 1));
          }}
          className="cz-wind-strip"
        >
          {NUMBERS.map((n) => (
            <span
              key={n}
              data-cz-n={n}
              data-on={n === value ? "" : undefined}
              data-film={(FILM_SIZES as readonly number[]).includes(n) ? "" : undefined}
              className="cz-wind-cell tabular-nums"
            >
              <span className="cz-wind-tick" />
              <span className="cz-wind-num">{n}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="cz-wind-film text-caption text-muted-foreground">
        <span aria-hidden className="cz-wind-dot" />
        {"Film's own sizes: 12, 24 and 36"}
      </p>
    </div>
  );
}

/* ── the four controls ────────────────────────────────────────────────── */

/**
 * ONE OPTION'S CONTROL: each frame opens on its own value and a press changes
 * it (the frame holds the value, so the sentence or the card above it follows),
 * so a reader can try the option, never only look at it.
 */
export function RollControl({
  way,
  value,
  onChange,
}: {
  way: RollWay;
  value: number;
  onChange: (n: number) => void;
}) {
  const film = (FILM_SIZES as readonly number[]).includes(value);
  // Other stays open once picked, even on a count that is also a film size.
  const [other, setOther] = useState(!film);

  if (way === "count")
    return (
      <div data-cz-roll="count" data-cz-value={value}>
        <RollStepper value={value} onChange={onChange} />
      </div>
    );

  if (way === "wind")
    return (
      <div data-cz-roll="wind" data-cz-value={value}>
        <RollWinder value={value} onChange={onChange} />
      </div>
    );

  return (
    <div data-cz-roll={way} data-cz-value={value} className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Shots each"
        className={cn("cz-boxes", way === "both" && "cz-boxes-four")}
      >
        {FILM_SIZES.map((n) => (
          <FilmBox
            key={n}
            shots={n}
            on={!(way === "both" && other) && value === n}
            onPick={() => {
              setOther(false);
              onChange(n);
            }}
          />
        ))}
        {way === "both" ? (
          <OtherBox on={other} onPick={() => setOther(true)} />
        ) : null}
      </div>
      {way === "both" && other ? (
        <RollStepper value={value} onChange={onChange} hint={false} />
      ) : null}
    </div>
  );
}

/** A control holding its own value, for a frame with nothing above it to follow. */
export function LiveRoll({ way, start }: { way: RollWay; start: number }) {
  const [value, setValue] = useState(start);
  return <RollControl way={way} value={value} onChange={setValue} />;
}
