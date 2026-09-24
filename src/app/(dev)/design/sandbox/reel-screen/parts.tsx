"use client";

import type { ReactNode } from "react";
import { Play } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { JOIN_LABEL, JOIN_URL, QR_STYLE } from "./fixtures";
import { ScreenStill } from "./stills";

/**
 * THE BIG SCREEN'S FURNITURE: the code, the empty screen and the Start plate.
 *
 * ★ THE VIEW IS THE WALL, SO NOTHING HERE IS A WALL'S OWN. The code in its
 * corner is the view's code plate (`qr=corner`) at a television's scale; the
 * empty screen and the plate are states of that one view. No event name
 * appears anywhere (`name=none`): the only words a screen carries are the
 * code's, and each plate's own few.
 *
 * ★ A SCREEN IS READ FROM ACROSS A ROOM, AND THAT IS THE ONLY THING THAT MAKES
 * IT A NEW SURFACE. Nothing here invents a scale: the site's own ladder is
 * FLUID (`--text-title` and friends clamp against the viewport), and the frame
 * is a real 1920 viewport, so the same step a marketing hero wears resolves at
 * the size the room really reads. The code's plate is sized in `vw` for the
 * same reason, so the 1440 television on the knob is the same composition
 * smaller rather than a different one.
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

/** The view's code plate, his `qr=corner`: bottom right, the ask and the address beside it. */
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
        <p className={cn("mt-[0.4vw] text-prose text-white/75 tabular-nums", INK)}>
          {JOIN_LABEL}
        </p>
      </div>
      <Code width="10.4vw" />
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

/* ── the Start plate ─────────────────────────────────────────────────────── */

/**
 * ★ THE PLATE EXISTS BECAUSE OF A BROWSER RULE, NOT A DESIGN ONE. Fullscreen
 * and the wake lock both require a press in the tab that asks, and Play on a
 * screen opens a NEW tab, which has had none. So the first thing on the screen
 * is always something to press, and the plate comes back if fullscreen is
 * left. The three options differ in what that press LOOKS like, never in
 * whether it is there, and the code rides every one of them in its corner (the
 * `plate-code` call).
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
