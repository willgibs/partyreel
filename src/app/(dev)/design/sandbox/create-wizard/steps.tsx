"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Columns2,
  ExternalLink,
  Printer,
  Share2,
  Smartphone,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { QR_STYLE_KEYS, type QrStyleKey } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import {
  EVENT,
  HOURS,
  type HourId,
  hourOf,
  NEW_EVENT,
  railOf,
  headOf,
  REAL_LINK,
  ROLL,
  SAMPLE_LINK,
  SCANNED,
} from "./fixtures";
import {
  CodePlate,
  GuestPhone,
  GuestScreen,
  type Mode,
  Rail,
  StyleChoice,
} from "./pictures";

/**
 * WHAT EACH STEP HOLDS, whichever shape holds it: the name, the album or the
 * camera with its deeper compare, the code's look, and the beat. `fit` says
 * where the step stands (a room of its own, bigger and centred; a card in the
 * app; the studio's column, beside a stage that draws the code), `wide` that
 * the frame is a laptop's.
 */

export type Compare = "rows" | "night" | "story";
export type Beside = "lit" | "scan" | "guest";
export type Fit = "room" | "card" | "column";

/* ── 1. the name ───────────────────────────────────────────────────────── */

/**
 * THE NAME AT THE SIZE IT WILL BE (first-event's `asks=one`, his "bigger name
 * edit field"): typed on a rule, never in a box, the caret at its end. In a
 * room it is the screen's whole picture.
 */
export function NameField({ fit, wide }: { fit: Fit; wide: boolean }) {
  const big = fit === "room";
  return (
    <div className={cn("w-full", big && "max-w-[1040px] text-center")}>
      {big && (
        <p className="text-working text-muted-foreground">Name your event</p>
      )}
      <p
        data-cw-hero
        className={cn(
          "font-heading text-balance",
          big
            ? "mt-5 text-title"
            : fit === "card"
              ? "text-section"
              : "text-page",
        )}
      >
        {EVENT.name}
        <span className="cw-caret" aria-hidden />
      </p>
      <span
        aria-hidden
        className={cn(
          "block h-0.5 rounded-full bg-foreground/85",
          big
            ? cn("mx-auto mt-5", wide ? "w-[880px]" : "w-full")
            : "mt-3 w-full",
        )}
      />
    </div>
  );
}

/* ── 2. the album or the camera ────────────────────────────────────────── */

const TITLE: Record<Mode, string> = {
  album: "Album",
  camera: "Disposable camera",
};

/** Each card's one line, by the hour the night has reached (the night option). */
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

/** Each card's one line where the night does not move (the rows and the story). */
const LINE: Record<Mode, string> = {
  album: "Everyone's photos, as they land",
  camera: `${ROLL.shots} shots each, seen at ${ROLL.develops}`,
};

/** The camera's two defaults once picked, each its own little menu (the carried call `defaults`). */
function Defaults() {
  return (
    <span className="mt-2.5 flex flex-wrap gap-1.5">
      {[`${ROLL.shots} shots each`, `Develops ${ROLL.develops}`].map((d) => (
        <span
          key={d}
          data-cw-default
          className="flex h-7 items-center gap-1 rounded-action-sm border border-border px-2.5 text-xs font-medium"
        >
          {d}
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
        </span>
      ))}
    </span>
  );
}

function ModeCard({
  mode,
  on,
  hour,
  line,
  fit,
}: {
  mode: Mode;
  on: boolean;
  hour: HourId;
  line: string;
  fit: Fit;
}) {
  return (
    <span
      data-cw-choice={mode}
      data-state={on ? "on" : "off"}
      className="flex min-w-0 flex-col text-left"
    >
      {/* In a room the chosen picture throws its light down onto the floor
          (create-wizard.css, `cw-chosen`): the pick is lit, not boxed. */}
      <span className={cn("block", on && fit === "room" && "cw-chosen")}>
        <span
          className={cn(
            "relative block overflow-hidden rounded-tile outline-2 outline-offset-[3px]",
            on ? "outline-foreground" : "outline-transparent",
          )}
        >
          <GuestScreen
            mode={mode}
            hour={hour}
            className="aspect-[4/5] w-full"
          />
          {on && (
            <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-white text-black shadow-lift">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          )}
        </span>
      </span>
      <span
        className={cn(
          "mt-3 block font-heading",
          fit === "room" ? "text-subsection" : "text-card-title",
        )}
      >
        {TITLE[mode]}
      </span>
      <span className="mt-0.5 block text-working text-muted-foreground">
        {line}
      </span>
      {on && mode === "camera" && <Defaults />}
    </span>
  );
}

/** The rows that unfold under the cards (`rows`), lined up with each card. */
const ROWS: [string, string, string][] = [
  ["Guests add", "Any photo, any time", `${ROLL.shots} shots, in the camera`],
  ["Everyone sees", "Each one as it lands", `All at once, at ${ROLL.develops}`],
  ["The reel", "Grows all night", "Premieres the roll"],
];

function Rows({ gap }: { gap: string }) {
  return (
    <div className="mt-2 w-full">
      {ROWS.map(([label, a, b]) => (
        <div
          key={label}
          data-cw-row
          className={cn("grid grid-cols-2 border-t border-border py-2.5", gap)}
        >
          <span className="col-span-2 mb-1 text-label font-medium text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-sm">{a}</span>
          <span className="text-sm">{b}</span>
        </div>
      ))}
    </div>
  );
}

/** The night under the cards (`night`): three stops, the one she is on lit. */
function Night({ hour }: { hour: HourId }) {
  const i = HOURS.findIndex((h) => h.id === hour);
  const pct = (i / (HOURS.length - 1)) * 100;
  return (
    <div data-cw-hour={hourOf(hour).at} className="w-full">
      <div className="relative mx-2.5 h-5">
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
      <div className="mt-2.5 grid grid-cols-3 text-caption">
        {HOURS.map((h, k) => (
          <span
            key={h.id}
            className={cn(
              k === 0 ? "text-left" : k === 1 ? "text-center" : "text-right",
              h.id === hour ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span className="block font-medium tabular-nums">{h.at}</span>
            {h.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Both nights side by side (`story`), in a sheet over the step. */
function BothNights({ wide }: { wide: boolean }) {
  const modes: Mode[] = ["album", "camera"];
  return (
    <>
      <span className="cw-scrim" aria-hidden />
      <div
        data-cw-sheet
        className={cn(
          "fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-layer ring-1 ring-foreground/10",
          wide
            ? "top-1/2 left-1/2 w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-float p-7"
            : "inset-x-0 bottom-0 max-h-[94%] rounded-t-float px-4 pt-4 pb-5",
        )}
      >
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-subsection">Both nights</h2>
          <Button
            variant="ghost"
            size="icon"
            tabIndex={-1}
            className="ml-auto"
            aria-label="Close"
          >
            <X />
          </Button>
        </div>
        {wide ? (
          <div className="mt-5 grid grid-cols-[136px_repeat(3,minmax(0,1fr))] gap-x-4 gap-y-5">
            <span />
            {HOURS.map((h) => (
              <span key={h.id} className="text-caption">
                <span className="block font-medium tabular-nums">{h.at}</span>
                <span className="text-muted-foreground">{h.label}</span>
              </span>
            ))}
            {modes.map((m) => (
              <div key={m} className="contents">
                <span className="self-center font-heading text-card-title">
                  {TITLE[m]}
                </span>
                {HOURS.map((h) => (
                  <span key={h.id} className="block">
                    <GuestScreen
                      mode={m}
                      hour={h.id}
                      className="aspect-[4/5] w-full rounded-tile"
                    />
                    <span className="mt-1.5 block text-caption text-muted-foreground">
                      {LINE_AT[h.id][m]}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 overflow-hidden">
            {modes.map((m) => (
              <span key={m} className="font-heading text-card-title">
                {TITLE[m]}
              </span>
            ))}
            {HOURS.map((h) => (
              <div key={h.id} className="contents">
                <span className="col-span-2 mt-1 text-caption">
                  <span className="font-medium tabular-nums">{h.at}</span>{" "}
                  <span className="text-muted-foreground">{h.label}</span>
                </span>
                {modes.map((m) => (
                  <GuestScreen
                    key={m}
                    mode={m}
                    hour={h.id}
                    className="aspect-square w-full rounded-tile"
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <div className={cn("flex gap-2", wide ? "mt-6 justify-end" : "mt-4")}>
          <Button
            variant="outline"
            size="lg"
            tabIndex={-1}
            className={wide ? "" : "flex-1"}
          >
            Choose the album
          </Button>
          <Button size="lg" tabIndex={-1} className={wide ? "" : "flex-1"}>
            Choose the camera
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * THE STEP THAT PICKS AN ALBUM OR A DISPOSABLE CAMERA: his `create=cards`
 * redrawn (two pictures, a line each, the camera's defaults once picked) with
 * the deeper compare he asked for drawn three ways. `open` is the compare in
 * use: the rows unfolded, the night moved to the morning, the sheet up.
 */
export function ModeChoice({
  compare,
  picked,
  open,
  fit,
  wide,
}: {
  compare: Compare;
  picked: Mode;
  open: boolean;
  fit: Fit;
  wide: boolean;
}) {
  const hour: HourId = compare === "night" && open ? "morning" : "party";
  const room = fit === "room";
  // In a room at a desk the cards are as large as the screen allows, a step
  // smaller where the rows unfold under them, so the step still ends above
  // its button.
  const width = room
    ? wide
      ? compare === "rows"
        ? "w-[624px]"
        : "w-[720px]"
      : "w-full"
    : "w-full";
  const gap = room && wide ? "gap-x-8" : "gap-x-3";
  const line = (m: Mode) => (compare === "night" ? LINE_AT[hour][m] : LINE[m]);
  return (
    <div className={cn("flex flex-col items-center", width)}>
      {room && (
        <div className="mb-7 text-center">
          <h1 className="font-heading text-page">
            How will guests add photos?
          </h1>
          <p className="mt-1.5 text-caption text-muted-foreground">
            Switch any time, both ways
          </p>
        </div>
      )}
      <div data-cw-hero className={cn("grid w-full grid-cols-2", gap)}>
        {(["album", "camera"] as const).map((m) => (
          <ModeCard
            key={m}
            mode={m}
            on={picked === m}
            hour={hour}
            line={line(m)}
            fit={fit}
          />
        ))}
      </div>
      {compare === "night" && (
        <div className={cn("w-full", room ? "mt-7" : "mt-5")}>
          <Night hour={hour} />
        </div>
      )}
      {compare !== "night" && (
        <Button
          variant="ghost"
          size="sm"
          tabIndex={-1}
          className={cn("text-muted-foreground", room ? "mt-6" : "mt-4")}
        >
          {compare === "rows" ? (
            <>Compare {open ? <ChevronUp /> : <ChevronDown />}</>
          ) : (
            <>
              <Columns2 /> See both nights
            </>
          )}
        </Button>
      )}
      {compare === "rows" && open && <Rows gap={gap} />}
      {compare === "story" && open && <BothNights wide={wide} />}
    </div>
  );
}

/* ── 3. the code's look ────────────────────────────────────────────────── */

/** The style she has on, in every drawing: a shape other than the default shows the feature. */
export const PICKED_STYLE: QrStyleKey = "rounded";

export function StylePick({
  fit,
  wide,
  plate = true,
}: {
  fit: Fit;
  wide: boolean;
  /** False where a stage beside the step already draws the code (the studio). */
  plate?: boolean;
}) {
  const room = fit === "room";
  const size = room ? (wide ? 248 : 208) : wide ? 208 : 172;
  return (
    <div className="flex flex-col items-center">
      {room && (
        <div className="mb-7 text-center">
          <h1 className="font-heading text-page">Pick the code&rsquo;s look</h1>
          <p className="mt-1.5 text-caption text-muted-foreground">
            Change it any time from Share
          </p>
        </div>
      )}
      {plate && (
        <span data-cw-hero>
          <CodePlate
            link={SAMPLE_LINK}
            styleKey={PICKED_STYLE}
            size={size}
            sample
          />
        </span>
      )}
      <div
        className={cn(
          "flex justify-center",
          plate ? "mt-7" : "",
          wide || room ? "gap-5" : "gap-3",
        )}
      >
        {QR_STYLE_KEYS.map((k) => (
          <StyleChoice
            key={k}
            styleKey={k}
            link={SAMPLE_LINK}
            on={k === PICKED_STYLE}
            size={wide ? 64 : 56}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 4. the beat ───────────────────────────────────────────────────────── */

/** Print and Share, the code's two doors out (the beat's own, trimmed to their nouns). */
export function Doors({ wide }: { wide: boolean }) {
  return (
    <div className={cn("flex gap-2", wide ? "" : "w-full")}>
      <Button
        variant="outline"
        size="lg"
        tabIndex={-1}
        className={wide ? "" : "flex-1"}
      >
        <Printer /> Print table cards
      </Button>
      <Button
        variant="outline"
        size="lg"
        tabIndex={-1}
        className={wide ? "" : "flex-1"}
      >
        <Share2 /> Share link
      </Button>
    </div>
  );
}

/**
 * Beside the code, `scan`: the one thing a new event lacks, asked for where it
 * can be done. At a desk her phone scans the screen; on a phone, where a
 * screen cannot scan itself, she opens it instead. `left` sets it in a column
 * (the studio, whose stage draws the code) rather than beside the code.
 */
function ScanAsk({
  scanned,
  wide,
  left = false,
}: {
  scanned: boolean;
  wide: boolean;
  left?: boolean;
}) {
  const centred = !wide && !left;
  if (scanned)
    return (
      <div
        data-cw-scan="done"
        className={cn(centred ? "text-center" : "max-w-72")}
      >
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-success text-success-foreground",
            centred && "mx-auto",
          )}
        >
          <Check className="size-5" strokeWidth={3} />
        </span>
        <p className="mt-3 font-heading text-subsection">The code works</p>
        <p className="mt-1 text-sm text-muted-foreground">
          What you just saw is what guests will see.
        </p>
      </div>
    );
  if (!wide)
    return (
      <div
        data-cw-scan="open"
        className={cn("w-full", centred && "text-center")}
      >
        <Button variant="outline" size="lg" tabIndex={-1} className="w-full">
          <ExternalLink /> Open it as a guest
        </Button>
        <p className="mt-2 text-caption text-muted-foreground">
          It ticks here once it opens.
        </p>
      </div>
    );
  return (
    <div data-cw-scan="ask" className="max-w-72">
      <span className="flex size-11 items-center justify-center rounded-full ring-1 ring-foreground/20">
        <Smartphone className="size-5" />
      </span>
      <p className="mt-3 font-heading text-subsection">
        {left ? "Scan the code with your phone" : "Scan it with your phone"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        It ticks here the moment it opens.
      </p>
    </div>
  );
}

/**
 * THE BEAT, ONCE (first-event's `landing=beat`, event-ready's `create=hand`):
 * the code first, then what is left as Settings' own rail, then Get it ready.
 * `beside` is what stands with the code; `scanned` draws `scan` once her phone
 * has opened it.
 */
export function Beat({
  beside,
  scanned = false,
  mode,
  fit,
  wide,
  code = true,
}: {
  beside: Beside;
  scanned?: boolean;
  mode: Mode;
  fit: Fit;
  wide: boolean;
  /** False where a stage beside the step already draws the code (the studio). */
  code?: boolean;
}) {
  const room = fit === "room";
  const r = beside === "scan" && scanned ? SCANNED : NEW_EVENT;
  // The code's edge: largest alone (`lit`), a step down with something beside it.
  const size = {
    lit: room ? (wide ? 260 : 196) : wide ? 208 : 168,
    scan: room ? (wide ? 232 : 168) : wide ? 184 : 140,
    guest: room ? (wide ? 232 : 140) : wide ? 160 : 140,
  }[beside];
  const phone = room ? (wide ? "w-[230px]" : "w-[150px]") : "w-[150px]";
  const plate = (
    <CodePlate link={REAL_LINK} styleKey={PICKED_STYLE} size={size} />
  );
  const row = wide;
  // Settings' rail: a row in a room at a desk, two columns in a card at a desk, else a column.
  const rail = wide
    ? room
      ? "row"
      : fit === "card"
        ? "grid"
        : "column"
    : "column";
  return (
    <div
      className={cn(
        "flex w-full flex-col",
        fit === "column" ? "items-start" : "items-center",
        room && wide && "max-w-[860px]",
      )}
    >
      {room && (
        <h1
          className={cn(
            "text-center font-heading text-balance",
            wide ? "mb-9 text-section" : "mb-5 text-page",
          )}
        >
          {EVENT.name} is live
        </h1>
      )}
      {code && (
        <div
          data-cw-hero
          className={cn(
            "flex items-center justify-center",
            row ? "gap-12" : beside === "guest" ? "gap-4" : "flex-col gap-5",
          )}
        >
          {beside === "lit" ? <span className="cw-lit">{plate}</span> : plate}
          {beside === "scan" && <ScanAsk scanned={scanned} wide={wide} />}
          {beside === "guest" && (
            <GuestPhone mode={mode} hour="arrive" className={phone} />
          )}
        </div>
      )}
      {!code && beside === "scan" && (
        <div className="mb-5 w-full">
          <ScanAsk scanned={scanned} wide={wide} left />
        </div>
      )}
      <div
        className={cn(code ? (room ? "mt-7" : "mt-6") : "", !wide && "w-full")}
      >
        <Doors wide={wide} />
      </div>
      <div
        className={cn(
          "w-full",
          room ? "mt-8" : "mt-6",
          wide && room && "rounded-xl border border-border px-5 py-4",
        )}
      >
        <Rail steps={railOf(r)} layout={rail} head={headOf(r)} />
      </div>
    </div>
  );
}
