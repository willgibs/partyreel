"use client";

import { type PointerEvent, useRef } from "react";
import { Check, ChevronDown, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  LINE_AT,
  MOMENT_IDS,
  MOMENTS,
  type MomentId,
  STYLE_LINES,
  STYLE_NAMES,
  STYLES,
  type StyleId,
  TWO,
} from "./fixtures";
import { GuestScreen, Phone, StylePicture } from "./pictures";

/**
 * THE ADD STEP'S CENTRE, FOUR WAYS (create-wizard r3, the `add` ask). The room
 * around it is production's as wired (`room.tsx` here mounts it); the question
 * up top and Continue at the foot are the room's. What varies is how the
 * centre lets a host tell the album styles apart and pick one:
 *
 *  - `pair`: Live and Disposable as two phones side by side, the night under
 *    both (r2's recommendation, polished); Reviewed waits in Settings;
 *  - `styles`: Settings' three album style cards, the same pictures and lines,
 *    each picture moving through the night;
 *  - `one`: one phone as large as the room allows, the three styles named
 *    over it on a switch (r2's switch, in Settings' names);
 *  - `strip`: the night laid out, a row of it for each of the two, nothing
 *    to drag.
 *
 * ★ EVERY CHOICE SAYS WHAT IT GIVES UP IN ITS ONE LINE OR ITS PICTURE, NEVER IN
 * A SECOND LINE: the disposable's line at the party is "Only their own until
 * 9 am", and its picture there is the dark contact sheet; Live's next morning
 * has no premiere to wait for.
 *
 * ★ THE DEVELOP TIME STANDS WHERE ITS CONTROL WILL MOUNT (r2's carried
 * `reveal`, kept): once Disposable is picked, one row under the choice, the
 * camera settings' develop time (9 am the day after, `defaultDevelopAt`; Create
 * knows no date yet, so it reads "9 am tomorrow"). Approval never stands with
 * it (the-wait's `both=never`), so no style here combines the two.
 */

export type AddWay = "pair" | "styles" | "one" | "strip";

/* ── the pick's mark ──────────────────────────────────────────────────── */

/** A filled round with its tick, or an empty ring: Settings' own mark, in the room's ink. */
export function Mark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
        on
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/35",
      )}
    >
      {on && <Check className="size-3" strokeWidth={3.25} />}
    </span>
  );
}

/* ── the night ────────────────────────────────────────────────────────── */

/**
 * THE NIGHT, UNDER THE PICTURES (r1's `mode=night`, settled): a track, three
 * moments, a knob. A press or a drag anywhere on it lands on the nearest
 * moment; its three words are the radios a keyboard and a reader use. Still,
 * it stands where it is drawn.
 */
export function Night({
  moment,
  onMoment,
  className,
}: {
  moment: MomentId;
  onMoment?: (m: MomentId) => void;
  className?: string;
}) {
  const track = useRef<HTMLDivElement | null>(null);
  const i = MOMENT_IDS.indexOf(moment);
  const pct = (i / (MOMENTS.length - 1)) * 100;
  const nearest = (e: PointerEvent) => {
    const el = track.current;
    if (!el || !onMoment) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onMoment(MOMENT_IDS[Math.round(x * (MOMENTS.length - 1))]!);
  };
  return (
    <div data-cw-night={moment} className={cn("w-full", className)}>
      <div
        ref={track}
        aria-hidden
        className={cn("cw-night mx-[11px]", onMoment && "cursor-pointer")}
        onPointerDown={(e) => {
          if (!onMoment) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          nearest(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) nearest(e);
        }}
      >
        <span className="cw-night-track" />
        <span className="cw-night-fill" style={{ width: `${pct}%` }} />
        {MOMENTS.map((m, k) => (
          <span
            key={m.id}
            className="cw-night-stop"
            data-on={k <= i ? "" : undefined}
            style={{ left: `${(k / (MOMENTS.length - 1)) * 100}%` }}
          />
        ))}
        <span className="cw-night-knob" style={{ left: `${pct}%` }} />
      </div>
      <div
        role="radiogroup"
        aria-label="Through the night"
        className="mt-1.5 grid grid-cols-3 text-caption"
      >
        {MOMENTS.map((m, k) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === moment}
            tabIndex={onMoment ? (m.id === moment ? 0 : -1) : -1}
            onClick={() => onMoment?.(m.id)}
            className={cn(
              "py-1 transition-colors duration-150",
              k === 0 ? "text-left" : k === 1 ? "text-center" : "text-right",
              m.id === moment
                ? "font-medium text-foreground"
                : "text-muted-foreground",
              onMoment ? "cursor-pointer" : "cursor-default",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── the develop time, where its control mounts ───────────────────────── */

export const DEVELOPS = ["9 am tomorrow", "Noon tomorrow"] as const;
export type DevelopAt = (typeof DEVELOPS)[number];

/**
 * The disposable's develop time, as the camera settings' control will carry it
 * into Create: one row in the room's material, its value a picker (live, a
 * press steps between two times). Drawn in production's idiom: a setting's
 * row, never a new control.
 */
export function DevelopRow({
  at = DEVELOPS[0],
  onAt,
  className,
}: {
  at?: DevelopAt;
  onAt?: (d: DevelopAt) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-cw-develop={at}
      tabIndex={onAt ? 0 : -1}
      onClick={() =>
        onAt?.(DEVELOPS[(DEVELOPS.indexOf(at) + 1) % DEVELOPS.length]!)
      }
      className={cn(
        "cw-develop flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left",
        onAt ? "cursor-pointer" : "cursor-default",
        className,
      )}
    >
      <Clock3 aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-working text-muted-foreground">Develops</span>
      <span className="ml-auto text-working font-medium">{at}</span>
      <ChevronDown
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
    </button>
  );
}

/* ── the four centres ─────────────────────────────────────────────────── */

export type CentreProps = {
  way: AddWay;
  picked: StyleId;
  moment: MomentId;
  develop?: DevelopAt;
  onPick?: (s: StyleId) => void;
  onMoment?: (m: MomentId) => void;
  onDevelop?: (d: DevelopAt) => void;
};

/** A radio's own props, for whichever surface a composition makes the choice. */
function choice(s: StyleId, picked: StyleId, onPick?: (s: StyleId) => void) {
  const on = s === picked;
  return {
    type: "button" as const,
    role: "radio" as const,
    "aria-checked": on,
    "data-cw-choice": s,
    "data-state": on ? "on" : "off",
    tabIndex: onPick ? (on ? 0 : -1) : -1,
    onClick: onPick ? () => onPick(s) : undefined,
  };
}

/** The develop time, once the disposable is picked; the other styles have none. */
function Develop({
  picked,
  develop,
  onDevelop,
  className,
}: Pick<CentreProps, "picked" | "develop" | "onDevelop"> & {
  className?: string;
}) {
  if (picked !== "disposable") return null;
  return (
    <DevelopRow
      at={develop}
      onAt={onDevelop}
      className={cn("cw-develop-in", className)}
    />
  );
}

/*
 * ★ EVERY RESPONSIVE RULE BELOW LIVES IN THE BOARD'S OWN SHEET (`create-wizard
 * .css`, the `cw-` classes), never as a `md:` utility: the lab compiles a
 * board's utilities into a sub-layer that production's own copy of the base
 * class always beats, so a `md:flex-row` on a `flex-col` does nothing in a
 * frame (design.css says why). The sheet is unlayered, and wins.
 */

/** `pair`: the two experiences as two phones side by side, the night under both. */
function Pair({
  picked,
  moment,
  develop,
  onPick,
  onMoment,
  onDevelop,
}: CentreProps) {
  return (
    <div data-cw-add="pair" className="flex w-full flex-col items-center">
      <div role="radiogroup" aria-label="Album style" className="cw-pair-row">
        {TWO.map((s) => {
          const on = s === picked;
          return (
            <button
              key={s}
              {...choice(s, picked, onPick)}
              className={cn(
                "cw-pair flex flex-col items-start text-left outline-none",
                onPick ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                data-cw-carry={on ? "pick" : undefined}
                className={cn("block w-full", on && "cw-chosen")}
              >
                <Phone
                  style={s}
                  moment={moment}
                  lit={on}
                  className="cw-pair-phone"
                />
              </span>
              <span className="mt-3.5 flex items-center gap-2">
                <Mark on={on} />
                <span
                  className={cn(
                    "font-heading text-card-title",
                    !on && "text-muted-foreground",
                  )}
                >
                  {STYLE_NAMES[s]}
                </span>
              </span>
              <span className="mt-1 block max-w-full text-caption text-pretty text-muted-foreground">
                {LINE_AT[moment][s]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="cw-under cw-under-pair">
        <Night moment={moment} onMoment={onMoment} />
        <Develop picked={picked} develop={develop} onDevelop={onDevelop} />
      </div>
    </div>
  );
}

/** `styles`: Settings' three cards, the same picture and line each, the night moving every picture. */
function Styles({
  picked,
  moment,
  develop,
  onPick,
  onMoment,
  onDevelop,
}: CentreProps) {
  return (
    <div data-cw-add="styles" className="flex w-full flex-col items-center">
      <div role="radiogroup" aria-label="Album style" className="cw-cards">
        {STYLES.map((s) => {
          const on = s === picked;
          return (
            <button
              key={s}
              {...choice(s, picked, onPick)}
              className={cn(
                "cw-card cw-style-card text-left outline-none",
                on && "cw-chosen",
                onPick ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                data-cw-carry={on ? "pick" : undefined}
                className="cw-style-pic-box"
              >
                <StylePicture
                  style={s}
                  moment={moment}
                  className="cw-style-pic"
                />
              </span>
              <span className="cw-style-words">
                <span className="block min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-heading text-card-title",
                      !on && "text-foreground/85",
                    )}
                  >
                    {STYLE_NAMES[s]}
                  </span>
                  <span className="mt-0.5 block text-caption text-pretty text-muted-foreground">
                    {STYLE_LINES[s]}
                  </span>
                </span>
                <Mark on={on} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="cw-under cw-under-styles">
        <Night moment={moment} onMoment={onMoment} />
        <Develop picked={picked} develop={develop} onDevelop={onDevelop} />
      </div>
    </div>
  );
}

/** `one`: one phone as large as the room allows, the three styles named over it. */
function One({
  picked,
  moment,
  develop,
  onPick,
  onMoment,
  onDevelop,
}: CentreProps) {
  const at = STYLES.indexOf(picked);
  // A grid of named places: stacked at a phone (the switch, the phone, its
  // line, the night), and at a desk the phone standing tall on the left with
  // the rest beside it, so the one picture is as large as the room's height.
  return (
    <div data-cw-add="one" className="cw-one">
      <div
        role="radiogroup"
        aria-label="Album style"
        className="cw-switch cw-one-switch relative grid grid-cols-3 rounded-full p-1"
      >
        <span
          aria-hidden
          className="cw-switch-thumb absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-foreground"
          style={{ transform: `translateX(${at * 100}%)` }}
        />
        {STYLES.map((s) => (
          <button
            key={s}
            {...choice(s, picked, onPick)}
            className={cn(
              "relative h-9 rounded-full text-working font-medium transition-colors duration-200",
              s === picked ? "text-background" : "text-muted-foreground",
              onPick ? "cursor-pointer" : "cursor-default",
            )}
          >
            {STYLE_NAMES[s]}
          </button>
        ))}
      </div>
      <span
        key={picked}
        data-cw-carry="pick"
        className="cw-chosen cw-one-in cw-one-pic block"
      >
        <Phone style={picked} moment={moment} lit className="cw-one-phone" />
      </span>
      <p className="cw-one-line text-working text-muted-foreground">
        {LINE_AT[moment][picked]}
      </p>
      <div className="cw-under cw-one-under">
        <Night moment={moment} onMoment={onMoment} />
        <Develop picked={picked} develop={develop} onDevelop={onDevelop} />
      </div>
    </div>
  );
}

/**
 * `strip`: the night laid out, nothing to drag. A row for each of the two,
 * each row the night's three moments as a guest meets them, the moments
 * named once over the columns; the whole row is the choice.
 */
function Strip({ picked, develop, onPick, onDevelop }: CentreProps) {
  return (
    <div data-cw-add="strip" className="flex w-full flex-col items-center">
      <div className="cw-strip">
        <div
          aria-hidden
          className="cw-strip-grid cw-strip-head text-center text-caption text-muted-foreground"
        >
          <span className="cw-strip-corner" />
          {MOMENTS.map((m) => (
            <span key={m.id}>{m.label}</span>
          ))}
        </div>
        <div
          role="radiogroup"
          aria-label="Album style"
          className="cw-strip-rows"
        >
          {TWO.map((s) => {
            const on = s === picked;
            return (
              <button
                key={s}
                {...choice(s, picked, onPick)}
                className={cn(
                  "cw-card cw-strip-grid cw-strip-row text-left outline-none",
                  on && "cw-chosen",
                  onPick ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span className="cw-strip-name">
                  <Mark on={on} />
                  <span className="block min-w-0">
                    <span className="block font-heading text-card-title">
                      {STYLE_NAMES[s]}
                    </span>
                    <span className="mt-0.5 block text-caption text-pretty text-muted-foreground">
                      {STYLE_LINES[s]}
                    </span>
                  </span>
                </span>
                {MOMENT_IDS.map((m) => (
                  <span
                    key={m}
                    data-cw-carry={on && m === "party" ? "pick" : undefined}
                    className="block"
                  >
                    <GuestScreen
                      style={s}
                      moment={m}
                      className="cw-strip-shot w-full rounded-[10px]"
                    />
                  </span>
                ))}
              </button>
            );
          })}
        </div>
        <Develop picked={picked} develop={develop} onDevelop={onDevelop} />
      </div>
    </div>
  );
}

export function AddCentre(props: CentreProps) {
  if (props.way === "pair") return <Pair {...props} />;
  if (props.way === "styles") return <Styles {...props} />;
  if (props.way === "one") return <One {...props} />;
  return <Strip {...props} />;
}
