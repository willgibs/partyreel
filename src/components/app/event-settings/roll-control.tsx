"use client";

import { Minus, Plus } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  clampRoll,
  FILM_ROLLS,
  ROLL_MAX,
  ROLL_MIN,
  rollShots,
} from "@/lib/disposable/roll";
import { cn } from "@/lib/utils";

/**
 * THE ROLL'S SIZE, FILM'S THREE OR ANY COUNT (customize r1, Will's `roll=both`, 2026-10-05): 12, 24 and 36 as film boxes,
 * and Other beside them, which opens a stepper from 1 to 99 under them. Settings' What guests can add and Create's
 * Disposable pick draw this one control, so the two never say different things.
 *
 * ★ THE STEPPER SPANS THE BOXES (his note on the board: "stretch it with the - left and + right and count center. Looks
 * weird aligned more tightly left here, with empty space to its right"): minus at the left edge, plus at the right, the
 * count in the middle, the row as wide as the four boxes above it.
 *
 * ★ A BOX IS A CHOICE, A STEP IS A DRAFT. `onChange` says which (`pick` or `step`), so Settings saves a box at once and a
 * run of steps once she rests (`camera-settings.tsx`'s `RollSetting`), and Create only holds the number. Holding minus or
 * plus runs the count, quicker the longer it is held, so 24 to 99 is a few seconds under the thumb, never 75 presses.
 *
 * ★ THE STRIP IS THE ROLL'S LENGTH, NOT DECORATION: one frame for every three shots, the 36's three times the 12's, so the
 * boxes compare at a glance before a number is read; Other's runs on as a dotted line (bible: achromatic, the
 * photograph keeps the colour). Every colour is a token, so the same control stands on Settings' paper and in Create's
 * dark room; the picked box wears the album style card's own picked state.
 *
 * ★ KEYBOARD AND READERS: the boxes are one radio group (the arrows move and choose, Radix's roving focus), and the count
 * is the stepper's one stop, a spinbutton (Up and Down a shot, Page Up and Page Down ten, Home and End the bounds), so
 * minus and plus stay out of the tab order and still answer a press, a reader's included.
 */

/** Whether a count is one of film's three. */
export const isFilmRoll = (n: number) =>
  (FILM_ROLLS as readonly number[]).includes(n);

/** How a count changed: a box picked (a choice) or the stepper moved (a draft, saved once she rests). */
export type RollChange = "pick" | "step";

/** A roll's length as a strip: one frame for every three shots, as long as the roll beside the 36's. */
function Strip({ shots }: { shots: number }) {
  return (
    <span
      aria-hidden
      className="mt-2 flex h-1.5 gap-[2px]"
      style={{
        width: `${(shots / FILM_ROLLS[FILM_ROLLS.length - 1]!) * 100}%`,
      }}
    >
      {Array.from({ length: Math.round(shots / 3) }, (_, i) => (
        <span
          key={i}
          className="min-w-[2px] flex-1 rounded-[1.5px] bg-foreground/20 transition-colors duration-150 group-data-[state=checked]:bg-foreground/60 motion-reduce:transition-none"
        />
      ))}
    </span>
  );
}

const BOX =
  "group flex min-w-0 cursor-pointer flex-col items-start rounded-xl bg-(--choice) px-3 pt-2.5 pb-3 text-left outline-none transition-[background-color] duration-150 hover:bg-(--choice-up) focus-halo data-[state=checked]:afloat data-[state=checked]:afloat-card motion-reduce:transition-none";

export function RollControl({
  value,
  onChange,
  openOther = false,
  labelledBy,
  className,
}: {
  /** Shots on each guest's roll. */
  value: number;
  onChange: (n: number, how: RollChange) => void;
  /** Open with Other picked and the count in focus: a live word's "Another number" sent her here. */
  openOther?: boolean;
  /** The id of the row's own name, which the group and the count are named by. */
  labelledBy?: string;
  className?: string;
}) {
  // Other stays open once picked, even on a count that is also a film size: she is counting, not choosing a box.
  const [other, setOther] = useState(() => openOther || !isFilmRoll(value));
  // How the stepper arrives: in focus (a live word sent her), in view (she pressed Other), or as it stands.
  const [arrive, setArrive] = useState<StepperArrival>(() =>
    openOther ? "focus" : null,
  );
  return (
    <div
      data-roll-control=""
      data-roll-value={value}
      className={cn("space-y-3", className)}
    >
      <RadioGroupPrimitive.Root
        value={other ? "other" : String(value)}
        onValueChange={(v) => {
          if (v === "other") {
            setOther(true);
            setArrive("view");
            return;
          }
          setOther(false);
          onChange(Number(v), "pick");
        }}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : "Shots each"}
        loop
        className="grid grid-cols-4 gap-2"
      >
        {FILM_ROLLS.map((n) => (
          <RadioGroupPrimitive.Item
            key={n}
            value={String(n)}
            aria-label={rollShots(n)}
            data-roll-film={n}
            className={BOX}
          >
            <span className="font-heading text-subsection tabular-nums">
              {n}
            </span>
            <span className="text-caption whitespace-nowrap text-muted-foreground">
              shots
            </span>
            <Strip shots={n} />
          </RadioGroupPrimitive.Item>
        ))}
        <RadioGroupPrimitive.Item
          value="other"
          aria-label={`Another number of shots, ${ROLL_MIN} to ${ROLL_MAX}`}
          data-roll-film="other"
          className={BOX}
        >
          <span className="font-heading text-card-title leading-[var(--text-subsection--line-height)]">
            Other
          </span>
          <span className="text-caption whitespace-nowrap text-muted-foreground">
            {`${ROLL_MIN} to ${ROLL_MAX}`}
          </span>
          <span
            aria-hidden
            className="mt-[calc(0.5rem+3px)] h-0 w-full border-t-2 border-dotted border-foreground/30"
          />
        </RadioGroupPrimitive.Item>
      </RadioGroupPrimitive.Root>
      {other ? (
        <RollStepper
          value={value}
          onChange={(n) => onChange(n, "step")}
          labelledBy={labelledBy}
          arrive={arrive}
        />
      ) : null}
    </div>
  );
}

/** How long a held press waits before it runs, and the quickest it runs: ms. */
const HOLD_DELAY_MS = 380;
const HOLD_FIRST_MS = 110;
const HOLD_FASTEST_MS = 30;

/**
 * A PRESS THAT RUNS WHILE HELD: one step on the press, then, after a beat, a step on every tick, the ticks quickening.
 * A pointer's press steps on its down (so it answers at once) and the click it ends in is spent; a click no pointer
 * pressed (a key's, `detail` 0, or a reader's activation) steps on its own. A touch's click lands after its pointer has
 * left, so the press is told by its down, never by where the pointer is when the click comes.
 */
function useHeldStep(step: () => boolean) {
  const timer = useRef<number | null>(null);
  const pressed = useRef(false);
  const run = useRef(step);
  useEffect(() => {
    run.current = step;
  });
  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const tick = (wait: number) => {
    timer.current = window.setTimeout(() => {
      // A bound reached ends the run: nothing more to count.
      if (!run.current()) return stop();
      tick(Math.max(HOLD_FASTEST_MS, wait - 10));
    }, wait);
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      pressed.current = true;
      stop();
      if (run.current()) {
        timer.current = window.setTimeout(
          () => tick(HOLD_FIRST_MS),
          HOLD_DELAY_MS - HOLD_FIRST_MS,
        );
      }
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
    onPointerLeave: stop,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const ofThePress = pressed.current && e.detail !== 0;
      pressed.current = false;
      if (!ofThePress) run.current();
    },
    // A long press is the run, never the phone's menu.
    onContextMenu: (e: MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  };
}

/**
 * How the stepper arrives: `focus`, its count in focus and centred (a live word's Another number sent her); `view`,
 * scrolled just into view with focus left on Other (she pressed it, and it may open under the fold, a phone's Create
 * above all); null, as it stands.
 */
export type StepperArrival = "focus" | "view" | null;

/** The stepper: minus at the left edge, the count in the middle, plus at the right edge. */
export function RollStepper({
  value,
  onChange,
  labelledBy,
  arrive = null,
}: {
  value: number;
  onChange: (n: number) => void;
  labelledBy?: string;
  arrive?: StepperArrival;
}) {
  const countId = useId();
  const count = useRef<HTMLDivElement | null>(null);
  // The value a held run steps from: the newest it set, never a render behind it.
  const at = useRef(value);
  useEffect(() => {
    at.current = value;
  }, [value]);
  const to = (n: number): boolean => {
    const next = clampRoll(n);
    if (next === at.current) return false;
    at.current = next;
    onChange(next);
    return next > ROLL_MIN && next < ROLL_MAX;
  };
  const fewer = useHeldStep(() => to(at.current - 1));
  const more = useHeldStep(() => to(at.current + 1));

  const row = useRef<HTMLDivElement | null>(null);
  // How it arrived, read once as it mounts: a later change of the prop is no arrival.
  const arrival = useRef(arrive);
  useEffect(() => {
    const how = arrival.current;
    if (!how) return;
    // After the page's own arrival (the panel focuses its way up and opens at its top in the same commit).
    const t = window.setTimeout(() => {
      if (how === "focus") {
        count.current?.focus({ preventScroll: true });
        count.current?.scrollIntoView?.({ block: "center" });
        return;
      }
      const calm = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      row.current?.scrollIntoView?.({
        block: "nearest",
        behavior: calm ? "auto" : "smooth",
      });
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const by: Record<string, number> = {
      ArrowUp: 1,
      ArrowDown: -1,
      PageUp: 10,
      PageDown: -10,
    };
    if (e.key in by) to(at.current + by[e.key]!);
    else if (e.key === "Home") to(ROLL_MIN);
    else if (e.key === "End") to(ROLL_MAX);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={row}
      data-roll-stepper={value}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
    >
      <Button
        type="button"
        variant="outline"
        tabIndex={-1}
        aria-label="Fewer shots"
        aria-controls={countId}
        disabled={value <= ROLL_MIN}
        className="size-11 touch-manipulation rounded-[calc(var(--radius-action)*0.9)] select-none [&_svg]:size-4.5"
        {...fewer}
      >
        <Minus />
      </Button>
      <div
        ref={count}
        id={countId}
        role="spinbutton"
        tabIndex={0}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : "Shots each"}
        aria-valuemin={ROLL_MIN}
        aria-valuemax={ROLL_MAX}
        aria-valuenow={value}
        aria-valuetext={`${rollShots(value)} each`}
        onKeyDown={onKeyDown}
        className="flex min-w-0 flex-col items-center rounded-lg py-0.5 leading-none outline-none focus-halo"
      >
        <span className="font-heading text-page tabular-nums">{value}</span>
        <span className="mt-1 text-caption text-muted-foreground">
          {value === 1 ? "shot each" : "shots each"}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        tabIndex={-1}
        aria-label="More shots"
        aria-controls={countId}
        disabled={value >= ROLL_MAX}
        className="size-11 touch-manipulation rounded-[calc(var(--radius-action)*0.9)] select-none [&_svg]:size-4.5"
        {...more}
      >
        <Plus />
      </Button>
    </div>
  );
}
