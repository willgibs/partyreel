"use client";

import { type PointerEvent, useRef } from "react";
import { Check, ChevronDown, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

import { HOURS, type HourId, HOUR_IDS, hourOf, ROLL } from "./fixtures";
import { type Mode, Phone } from "./pictures";

/**
 * THE ADD STEP'S CENTRE: HIS NIGHT, BUILT FOR THE ROOM (r1's `mode=night`:
 * each mode a guest's phone, a slider under them moving the night from 8 pm
 * to the party to 9 am, so the difference is seen rather than read). The
 * question is up top now, so the whole centre is the compare's, and the
 * decision (`add`) is how that centre is composed:
 *
 *  - `pair`: the two phones side by side, the night under both;
 *  - `switch`: one phone as large as the room allows, the two modes a switch
 *    over it, the night under it;
 *  - `stack`: the pick in front, the other standing behind it, a tap from
 *    the front, the night under both.
 *
 * ★ THE CAMERA'S SETTING STANDS WHERE ITS CONTROL WILL MOUNT (`Reveal`):
 * disposable-foundation builds the mode and the reveal as one mountable
 * control (`camera-settings`, Settings' "what guests add"), and Create's
 * wiring mounts it here. The cards are its mode; once the camera is picked its
 * reveal shows under the night: develops at 9 am tomorrow, or straight away.
 * The roll's 24 is the server's count, never a setting, so it is said in the
 * pictures and the camera's line, not offered.
 */

export type AddWay = "pair" | "switch" | "stack";

const TITLE: Record<Mode, string> = {
  album: "Album",
  camera: "Disposable camera",
};

/** Each phone's one line, by the hour the night has reached. */
const LINE_AT: Record<HourId, Record<Mode, string>> = {
  arrive: { album: "Add from any phone", camera: `${ROLL.shots} shots each` },
  party: {
    album: "Seen as they land",
    camera: `Hidden until ${ROLL.develops}`,
  },
  morning: {
    album: "All of it, and the reel",
    camera: "Revealed, with a premiere",
  },
};

/* ── the night ────────────────────────────────────────────────────────── */

/**
 * THE NIGHT UNDER THE PHONES: a track, three stops, a knob. Live, a press or
 * a drag anywhere on it lands on the nearest hour (there are three, so it
 * snaps); still, it stands at the hour drawn.
 */
export function Night({
  hour,
  onHour,
}: {
  hour: HourId;
  onHour?: (h: HourId) => void;
}) {
  const track = useRef<HTMLDivElement | null>(null);
  const i = HOUR_IDS.indexOf(hour);
  const pct = (i / (HOURS.length - 1)) * 100;
  const nearest = (e: PointerEvent) => {
    const el = track.current;
    if (!el || !onHour) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onHour(HOUR_IDS[Math.round(x * (HOURS.length - 1))]);
  };
  return (
    <div data-cw-hour={hourOf(hour).at} className="w-full">
      <div
        ref={track}
        className={cn("cw-night mx-[11px]", onHour && "cursor-pointer")}
        onPointerDown={(e) => {
          if (!onHour) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          nearest(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) nearest(e);
        }}
      >
        <span className="cw-night-track" />
        <span className="cw-night-fill" style={{ width: `${pct}%` }} />
        {HOURS.map((h, k) => (
          <span
            key={h.id}
            className="cw-night-stop"
            style={{ left: `${(k / (HOURS.length - 1)) * 100}%` }}
          />
        ))}
        <span className="cw-night-knob" style={{ left: `${pct}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-3 text-caption">
        {HOURS.map((h, k) => (
          <button
            key={h.id}
            type="button"
            tabIndex={onHour ? 0 : -1}
            onClick={() => onHour?.(h.id)}
            className={cn(
              k === 0 ? "text-left" : k === 1 ? "text-center" : "text-right",
              h.id === hour ? "text-foreground" : "text-muted-foreground",
              onHour ? "cursor-pointer" : "cursor-default",
            )}
          >
            <span className="block font-medium tabular-nums">{h.at}</span>
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── the camera's setting, where its control mounts ───────────────────── */

export const REVEALS = ["9 am tomorrow", "Straight away"] as const;
export type Reveal = (typeof REVEALS)[number];

/**
 * The reveal, as `camera-settings` will carry it into Create: one row, its
 * value a menu (live, a press steps between the two). Drawn in production's
 * atoms: the row of a setting, never a new control.
 */
export function RevealRow({
  reveal = REVEALS[0],
  onReveal,
}: {
  reveal?: Reveal;
  onReveal?: (r: Reveal) => void;
}) {
  return (
    <button
      type="button"
      data-cw-reveal={reveal}
      tabIndex={onReveal ? 0 : -1}
      onClick={() =>
        onReveal?.(REVEALS[(REVEALS.indexOf(reveal) + 1) % REVEALS.length])
      }
      className={cn(
        "flex h-12 w-full items-center gap-3 rounded-2xl bg-foreground/[0.06] px-4 text-left ring-1 ring-foreground/10",
        onReveal ? "cursor-pointer" : "cursor-default",
      )}
    >
      <Clock3 className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-working text-muted-foreground">Develops</span>
      <span className="ml-auto text-working font-medium">{reveal}</span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/* ── one mode ─────────────────────────────────────────────────────────── */

/** The pick's mark: a filled round with its tick, or an empty ring. */
function Mark({ on }: { on: boolean }) {
  return on ? (
    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-foreground text-background">
      <Check className="size-3" strokeWidth={3.25} />
    </span>
  ) : (
    <span className="size-[18px] shrink-0 rounded-full ring-[1.5px] ring-foreground/30 ring-inset" />
  );
}

/** A mode's name and its line at this hour, under its phone. */
function Label({
  mode,
  hour,
  on,
  wide,
  center,
}: {
  mode: Mode;
  hour: HourId;
  on: boolean;
  wide: boolean;
  center?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-col",
        center ? "items-center text-center" : "items-start",
      )}
    >
      <span className="flex items-center gap-2">
        <Mark on={on} />
        <span
          className={cn(
            "truncate font-heading",
            // A phone's column is a phone's width: Disposable camera fits it
            // on the working step, beside its mark.
            wide ? "text-card-title" : "text-working",
            !on && "text-muted-foreground",
          )}
        >
          {TITLE[mode]}
        </span>
      </span>
      <span className="mt-0.5 block text-caption text-muted-foreground">
        {LINE_AT[hour][mode]}
      </span>
    </span>
  );
}

/* ── the three centres ────────────────────────────────────────────────── */

export function AddCentre({
  way,
  wide,
  picked,
  hour,
  reveal,
  onPick,
  onHour,
  onReveal,
}: {
  way: AddWay;
  wide: boolean;
  picked: Mode;
  hour: HourId;
  reveal?: Reveal;
  onPick?: (m: Mode) => void;
  onHour?: (h: HourId) => void;
  onReveal?: (r: Reveal) => void;
}) {
  const modes: Mode[] = ["album", "camera"];
  const camera = picked === "camera";
  const tap = (m: Mode) => (onPick ? () => onPick(m) : undefined);

  const night = (
    <div className={cn("w-full", wide ? "mt-6 max-w-[560px]" : "mt-5")}>
      <Night hour={hour} onHour={onHour} />
    </div>
  );
  // The camera's setting appears once the camera is picked; the album has none.
  const settings = camera && (
    <div className={cn("w-full", wide ? "mt-4 max-w-[560px]" : "mt-4")}>
      <RevealRow reveal={reveal} onReveal={onReveal} />
    </div>
  );

  if (way === "pair") {
    const w = wide ? 180 : 152;
    return (
      <div data-cw-add={way} className="flex w-full flex-col items-center">
        <div
          data-cw-hero
          className={cn("flex justify-center", wide ? "gap-14" : "gap-4")}
        >
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              data-cw-choice={m}
              data-state={picked === m ? "on" : "off"}
              tabIndex={onPick ? 0 : -1}
              onClick={tap(m)}
              className={cn(
                "flex flex-col items-start text-left",
                onPick ? "cursor-pointer" : "cursor-default",
              )}
              style={{ width: w }}
            >
              <span
                data-cw-carry={picked === m ? "pick" : undefined}
                className={cn("block w-full", picked === m && "cw-chosen")}
              >
                <Phone mode={m} hour={hour} className="w-full" />
              </span>
              <span className="mt-3 block w-full">
                <Label mode={m} hour={hour} on={picked === m} wide={wide} />
              </span>
            </button>
          ))}
        </div>
        {night}
        {settings}
      </div>
    );
  }

  if (way === "switch") {
    const w = wide ? 208 : 184;
    return (
      <div data-cw-add={way} className="flex w-full flex-col items-center">
        <div
          role="radiogroup"
          aria-label="How guests add photos"
          className={cn(
            "relative grid w-full grid-cols-2 rounded-full bg-foreground/[0.07] p-1",
            wide ? "max-w-[420px]" : "",
          )}
        >
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground shadow-sm transition-transform duration-200 ease-emphasis"
            style={{ transform: camera ? "translateX(100%)" : undefined }}
          />
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={picked === m}
              data-cw-choice={m}
              data-state={picked === m ? "on" : "off"}
              tabIndex={onPick ? 0 : -1}
              onClick={tap(m)}
              className={cn(
                "relative h-9 rounded-full text-working font-medium transition-colors",
                picked === m ? "text-background" : "text-muted-foreground",
                onPick ? "cursor-pointer" : "cursor-default",
              )}
            >
              {TITLE[m]}
            </button>
          ))}
        </div>
        <span
          data-cw-hero
          data-cw-carry="pick"
          className={cn("cw-chosen block", wide ? "mt-7" : "mt-5")}
          style={{ width: w }}
        >
          <Phone mode={picked} hour={hour} className="w-full" />
        </span>
        <p className="mt-3 text-working text-muted-foreground">
          {LINE_AT[hour][picked]}
        </p>
        {night}
        {settings}
      </div>
    );
  }

  // stack: the pick in front, the other behind it, a tap from the front.
  const front = wide ? 196 : 172;
  const back = Math.round(front * 0.84);
  const other: Mode = camera ? "album" : "camera";
  return (
    <div data-cw-add={way} className="flex w-full flex-col items-center">
      <div
        data-cw-hero
        className="relative"
        style={{
          width: front + back * 0.62,
          height: (front * 19.2) / 9,
        }}
      >
        <button
          type="button"
          data-cw-choice={other}
          data-state="off"
          tabIndex={onPick ? 0 : -1}
          onClick={tap(other)}
          aria-label={`Pick ${TITLE[other]}`}
          className={cn(
            "absolute top-[8%] right-0 block",
            onPick ? "cursor-pointer" : "cursor-default",
          )}
          style={{ width: back }}
        >
          <Phone mode={other} hour={hour} dim className="w-full" />
        </button>
        <span
          data-cw-choice={picked}
          data-state="on"
          data-cw-carry="pick"
          className="cw-chosen absolute top-0 left-0 block"
          style={{ width: front }}
        >
          <Phone mode={picked} hour={hour} className="w-full" />
        </span>
      </div>
      <div
        className={cn(
          "grid w-full grid-cols-2 gap-4",
          wide ? "mt-5 max-w-[460px]" : "mt-4",
        )}
      >
        <Label mode={picked} hour={hour} on wide={wide} />
        <button
          type="button"
          tabIndex={onPick ? 0 : -1}
          onClick={tap(other)}
          className={cn(
            "justify-self-end text-right",
            onPick ? "cursor-pointer" : "cursor-default",
          )}
        >
          <span className="flex flex-col items-end">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate font-heading text-muted-foreground",
                  wide ? "text-card-title" : "text-working",
                )}
              >
                {TITLE[other]}
              </span>
              <Mark on={false} />
            </span>
            <span className="mt-0.5 block text-caption text-muted-foreground">
              {LINE_AT[hour][other]}
            </span>
          </span>
        </button>
      </div>
      {night}
      {settings}
    </div>
  );
}
