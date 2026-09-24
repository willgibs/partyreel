"use client";

import type { ReactNode } from "react";
import { Maximize, Play, Plus } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { GLASS } from "@/lib/glass";
import { STOCK_LINE } from "@/lib/qr/stock";
import { cn } from "@/lib/utils";

import {
  EVENT_DAY,
  EVENT_NAME,
  FIRST_STILL,
  JOIN_LABEL,
  JOIN_URL,
  QR_STYLE,
} from "./fixtures";
import { ScreenStill } from "./stills";

/**
 * THE BIG SCREEN'S FURNITURE: the code, the empty screen and the Start plate.
 *
 * ★ THE SCREEN IS THE VIEW, SO NOTHING HERE IS A WALL'S OWN. The code in its
 * corner is the view's own code plate at a television's scale, and the empty
 * screen and the plate are states of that one view, so an answer here lands on
 * the view every device already has rather than on a mode of its own.
 *
 * ★ A SCREEN IS READ FROM ACROSS A ROOM, AND THAT IS THE ONLY THING THAT MAKES
 * IT A NEW SURFACE. Nothing here invents a scale: the site's own ladder is
 * FLUID (`--text-title` and friends clamp against the viewport), and the frame
 * is a real viewport, so the step a marketing hero wears resolves at the size
 * the room really reads. The code's plate is sized in `vw` for the same reason,
 * so the 1920 television on the knob is the same composition larger rather
 * than a different one.
 *
 * ★ THE CODE'S PLATE IS SOLID WHITE, A SCANNER RULE RATHER THAN A PALETTE
 * CHOICE (`event-qr.tsx`'s own note): a code that inverts with the theme stops
 * decoding on half the phones at a party.
 */

/** The safe area: a television overscans and a room reads from a distance. */
const PAD = "[--pad:3.4vw]";

export function WallRoot({ children }: { children: ReactNode }) {
  return (
    <div
      data-rsc-wall=""
      className={cn("relative size-full overflow-hidden bg-black", PAD)}
    >
      {children}
    </div>
  );
}

/**
 * ★ TYPE OVER A PHOTOGRAPH NEEDS ITS OWN GROUND, AND A FULL-SCREEN SCRIM IS NOT
 * IT. The scrim is a gradient on the edge the furniture sits on and nowhere
 * else, so the middle of the frame is the photograph at full strength.
 */
function BottomScrim() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-linear-to-t from-black/85 via-black/35 to-transparent"
    />
  );
}

/** A dark halo on every glyph: nothing over a dark frame, the difference over a bright one. */
const INK =
  "[text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_28px_rgb(0_0_0/0.45)]";

/** The shipped designer's own renderer, on the plate a scanner needs, sized as a share of the screen. */
function Code({ width }: { width: string }) {
  return (
    <div
      data-rsc-code=""
      className="shrink-0 rounded-[var(--radius)] bg-white"
      style={{ width, padding: "0.6vw", lineHeight: 0 }}
    >
      <StyledQr
        value={JOIN_URL}
        size={480}
        style={QR_STYLE}
        className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      />
    </div>
  );
}

/** The view's code plate: bottom right, the ask and the address beside it. */
export function CornerCode() {
  return (
    <div
      data-rsc-corner=""
      className="absolute right-[var(--pad)] bottom-[var(--pad)] flex items-center gap-[1.2vw]"
    >
      <div className="text-right">
        <p
          className={cn(
            "font-heading text-section leading-none font-medium text-white",
            INK,
          )}
        >
          Scan to add yours
        </p>
        <p
          className={cn(
            "mt-[0.4vw] text-prose text-white/75 tabular-nums",
            INK,
          )}
        >
          {JOIN_LABEL}
        </p>
      </div>
      <Code width="10.4vw" />
    </div>
  );
}

/**
 * THE VIEW'S SLIM BAR AT REST, at a television's scale: the one sign on the
 * picture that the reel is playing rather than held. Only the plate-free
 * option draws it, because it is the only one whose reel runs before the press.
 */
function RestBar() {
  return (
    <div
      data-rsc-playing=""
      aria-hidden
      className={cn(
        "absolute bottom-[var(--pad)] left-1/2 flex h-[2vw] w-[12vw] -translate-x-1/2 items-center gap-[0.7vw] rounded-full px-[0.8vw] text-white/85",
        GLASS,
      )}
    >
      <Play className="size-[0.9vw] fill-white/85" />
      <span className="h-[0.25vw] flex-1 overflow-hidden rounded-full bg-white/25">
        <span className="block h-full w-2/5 rounded-full bg-white/80" />
      </span>
    </div>
  );
}

/* ── before the reel starts ──────────────────────────────────────────────── */

/** `idle=code`: the code and the address, as big as a screen allows. */
export function IdleCode() {
  return (
    <div
      data-rsc-idle="code"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[1.8vw]"
    >
      <Code width="30vw" />
      <p
        data-rsc-idle-line=""
        className="text-section text-white/75 tabular-nums"
      >
        {JOIN_LABEL}
      </p>
    </div>
  );
}

/** `idle=invite`: the code, the ask, and what the screen is waiting for, with no count. */
export function IdleInvite() {
  return (
    <div
      data-rsc-idle="invite"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6vw] px-[var(--pad)] text-center"
    >
      <Code width="20vw" />
      <div>
        <p className="font-heading text-title leading-none font-semibold text-white">
          Scan to add yours
        </p>
        <p className="mt-[0.6vw] text-section text-white/65 tabular-nums">
          {JOIN_LABEL}
        </p>
      </div>
      <p data-rsc-idle-line="" className="text-prose text-white/70">
        The reel starts with the second photo.
      </p>
    </div>
  );
}

/** `idle=stills`: the one photograph there is, held, with the view's corner code. */
export function IdleStills() {
  return (
    <div data-rsc-idle="stills" className="absolute inset-0">
      <ScreenStill id="idle" label="The album's one photograph, held" />
      <BottomScrim />
      <CornerCode />
    </div>
  );
}

/**
 * `idle=welcome`: A TITLE CARD, THE EVENT'S NAME FIRST.
 *
 * ★ WHY THE NAME IS ALLOWED HERE AND NOT OVER THE REEL. Over a playing reel a
 * name competes with the photographs, which are the show; on an empty screen
 * there is nothing for it to compete with, and a room waiting for a show
 * expects a title card. The ask under the code is the printed sign's own line
 * (`STOCK_LINE`), so the tables and the wall say one thing in one voice.
 *
 * ★ `text-hero`, NOT `text-display`: display resolves to 160px on a 1440
 * screen, and a name as long as "Mia & Theo's Wedding" would break over two
 * lines and push the code off the bottom. Hero holds the longest real names on
 * one line at both sizes on the knob.
 */
export function IdleWelcome() {
  return (
    <div
      data-rsc-idle="welcome"
      className="absolute inset-0 flex flex-col items-center justify-center gap-[1.7vw] px-[var(--pad)] text-center"
    >
      <div>
        <p className="text-prose text-white/60">{EVENT_DAY}</p>
        <p
          data-rsc-name=""
          className="mt-[0.5vw] font-heading text-hero leading-none font-semibold text-balance text-white"
        >
          {EVENT_NAME}
        </p>
      </div>
      <Code width="16vw" />
      <div>
        <p className="font-heading text-section leading-none font-medium text-white">
          {STOCK_LINE}
        </p>
        <p className="mt-[0.5vw] text-prose text-white/60 tabular-nums">
          {JOIN_LABEL}
        </p>
      </div>
    </div>
  );
}

/**
 * `idle=seats`: TWO SEATS THE ROOM FILLS, AND THE CODE WHERE THE REEL KEEPS IT.
 *
 * ★ THE MINIMUM, SAID WITHOUT THE WORD. Two frames at the reel's own count: the
 * photograph there is sits in the first, the second waits, and the one line
 * says what fills it. The photograph is the album's preview in a frame of the
 * UI (a seat is a tile, not a reel frame), so it is never graded.
 *
 * ★ THE CODE IS ALREADY IN ITS CORNER, so the moment the second photograph lands
 * the seats can become the reel and nothing else on the screen moves: the one
 * transition this option is built around, and the room's first shared beat.
 *
 * ★ THE EMPTY SEAT BREATHES, SLOWLY, AND ONLY IT. A screen that holds still for
 * half an hour reads as frozen; one dashed edge easing in and out says
 * "waiting" without a word, at ambient speed. Reduced motion holds it lit.
 */
export function IdleSeats() {
  return (
    <div data-rsc-idle="seats" className="absolute inset-0">
      {/* Centred in the room the corner code leaves: everything above its
          band, so the seats read as the screen's middle, not its head. */}
      <div className="absolute inset-x-0 top-0 bottom-[16%] flex flex-col items-center justify-center gap-[2.2vw] px-[var(--pad)] text-center">
        <p
          data-rsc-count=""
          className="font-heading text-section leading-none font-semibold text-white"
        >
          One more photo starts the reel
        </p>
        <div className="flex gap-[1.4vw]">
          <span
            data-rsc-seat="filled"
            className="relative block aspect-[4/5] w-[17vw] overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-white/15"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
            <img
              src={FIRST_STILL}
              alt="The album's one photograph"
              className="size-full object-cover"
            />
          </span>
          <span
            data-rsc-seat="waiting"
            className="flex aspect-[4/5] w-[17vw] animate-pulse items-center justify-center rounded-[var(--radius-tile)] border-2 border-dashed border-white/45 motion-reduce:animate-none"
          >
            <Plus className="size-[2.4vw] text-white/60" aria-hidden />
          </span>
        </div>
      </div>
      <CornerCode />
    </div>
  );
}

/* ── the Start plate ─────────────────────────────────────────────────────── */

/**
 * ★ THE PRESS EXISTS BECAUSE OF A BROWSER RULE, NOT A DESIGN ONE. Fullscreen
 * needs a press in the tab that asks, and Play on a screen opens a NEW tab,
 * which has had none. So something to press is always on the screen; the four
 * options differ in what that press LOOKS like and in whether the reel waits
 * for it, and the code rides every one of them in its corner (the `plate-code`
 * call).
 */
function StartButton({ label }: { label: string }) {
  return (
    <span
      data-rsc-start-button=""
      data-dir-press
      className="inline-flex items-center gap-[0.8vw] rounded-full bg-white px-[2.4vw] py-[1.1vw] font-heading text-section leading-none font-semibold text-black"
    >
      <Play className="size-[1.8vw] fill-black" aria-hidden />
      {label}
    </span>
  );
}

/** `start=frame`: the reel's first frame behind a dimmed glass play mark. */
export function StartFrame() {
  return (
    <div data-rsc-start="frame" className="absolute inset-0">
      <ScreenStill id="first" label="The reel's first frame" />
      <div className="absolute inset-0 bg-black/45" />
      <BottomScrim />
      <div
        data-rsc-plate=""
        className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6vw] text-center"
      >
        <span
          data-rsc-start-button=""
          data-dir-press
          className={cn(
            "flex size-[7vw] items-center justify-center rounded-full border border-white/30",
            GLASS,
          )}
        >
          <Play className="size-[2.6vw] fill-white text-white" aria-hidden />
        </span>
        <p className={cn("text-prose text-white/80", INK)}>
          Press to play on this screen
        </p>
      </div>
      <CornerCode />
    </div>
  );
}

/** `start=button`: one button on a dark plate, and what pressing it does. */
export function StartPlain() {
  return (
    <div data-rsc-start="button" className="absolute inset-0">
      <div
        data-rsc-plate=""
        className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6vw] px-[var(--pad)] text-center"
      >
        <StartButton label="Start the reel" />
        <p className="text-prose text-white/60">
          It fills the screen and keeps it awake. Press Escape to leave.
        </p>
      </div>
      <CornerCode />
    </div>
  );
}

/** `start=countdown`: a three counting down, and a press that takes the whole screen. */
export function StartCountdown() {
  return (
    <div data-rsc-start="countdown" className="absolute inset-0">
      <div
        data-rsc-plate=""
        className="absolute inset-0 flex flex-col items-center justify-center gap-[1.4vw] px-[var(--pad)] text-center"
      >
        <p className="font-heading text-display leading-none font-semibold text-white tabular-nums">
          3
        </p>
        <p className="text-prose text-white/65">Starting the reel</p>
        <StartButton label="Start now" />
        <p className="text-prose text-white/50">
          Press to fill the screen and keep it awake.
        </p>
      </div>
      <CornerCode />
    </div>
  );
}

/**
 * `start=window`: NO PLATE, EVER. The reel plays in the window from the moment
 * the tab opens, and a quiet pill asks for the one press that fills the screen.
 *
 * ★ WHY THE PILL SITS AT THE TOP. The foot carries the bar and the corner
 * carries the code, both the view's own; the top edge is the one the room's eye
 * leaves free, and a pill there reads as a notice about the screen rather than
 * a control inside the picture. Glass, because it rides the photograph.
 *
 * ★ LEAVING FULLSCREEN NEVER STOPS THE ROOM'S REEL: the pill comes back and the
 * picture keeps playing, which is the whole of this option's case.
 */
export function StartWindow() {
  return (
    <div data-rsc-start="window" className="absolute inset-0">
      <ScreenStill id="first" label="The reel, playing in the window" />
      <BottomScrim />
      <div className="absolute inset-x-0 top-[var(--pad)] flex justify-center">
        <span
          data-rsc-plate=""
          data-rsc-start-button=""
          data-dir-press
          className={cn(
            "flex items-center gap-[0.8vw] rounded-full border border-white/25 px-[1.6vw] py-[0.8vw] text-prose font-medium text-white",
            GLASS,
          )}
        >
          <Maximize className="size-[1.5vw]" aria-hidden />
          Press anywhere to fill the screen
        </span>
      </div>
      <RestBar />
      <CornerCode />
    </div>
  );
}
