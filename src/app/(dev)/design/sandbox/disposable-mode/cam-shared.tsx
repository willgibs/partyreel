"use client";

import type { ReactNode } from "react";
import { Camera, Mic, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EVENT, ROLL, type Still } from "./fixtures";
import type { LookId } from "./film";

/**
 * WHAT EVERY CAMERA SHARES: the states a night puts it in, the phone's own
 * permission prompt (drawn plain, it is the operating system's), the refusal,
 * and the ring of frames around a shutter.
 *
 * ★ THE LIVE PICTURE IS A PHOTOGRAPH STANDING IN FOR THE CAMERA. In the
 * proposal it is the rear camera's stream in the page (getUserMedia, asked of
 * the phone on the first press), and the shutter takes the largest frame the
 * phone hands a page: on an iPhone a frame of the live video, at most 12 MP
 * (Safari 27 has no ImageCapture), on Android a full photo through
 * ImageCapture. The board's dock measures a real phone.
 *
 * ★ SAFARI ASKS EACH VISIT. A page's camera permission on an iPhone is kept
 * for the page load only unless the guest sets it to Allow in Website
 * Settings, so "an iPhone asking again" is every return to the album after a
 * reload, and each camera says how to stop it.
 *
 * Nothing here is wired: every control is inert, drawn at rest.
 */

export type CameraId = "viewfinder" | "body" | "reel" | "wrapper";

/** Where the night has the camera. */
export type Phase =
  | "framing"
  | "after"
  | "ask"
  | "again"
  | "refused"
  | "recording";

export type VideoWay = "hold" | "switch" | "button";
export type VideoCount = "one" | "three" | "own";

export type CamProps = {
  phase: Phase;
  look: LookId;
  still: Still;
  /** Her shots left (her photos left, when videos count on their own). */
  left: number;
  /** The shot just taken, by its number on the roll ("after"). */
  taken?: number;
  /** A paid event's way of taking a video; absent on Free. */
  video?: VideoWay;
  /** How a video counts, where the count decision is drawn. */
  count?: VideoCount;
  /** Her videos left, when videos count on their own. */
  videosLeft?: number;
  /** Seconds into the video ("recording"). */
  seconds?: number;
  /** A paid event's first press asks for the microphone with the camera. */
  mic?: boolean;
  /** "after" drawn just after a video rather than a photo. */
  afterVideo?: boolean;
};

/** What the count line says, in every camera's own words. */
export function leftWords(p: CamProps): string {
  if (p.count === "own")
    return `${p.left} photos · ${videosWord(p.videosLeft ?? 3)} left`;
  return `${p.left} left`;
}

/** "1 video", "2 videos". */
export const videosWord = (n: number) => `${n} video${n === 1 ? "" : "s"}`;

/** Whether the camera is live (its picture showing) in this phase. */
export const isLive = (phase: Phase) =>
  phase === "framing" || phase === "after" || phase === "recording";

/** The seconds, as the camera's clock says them: 0:04. */
export const clock = (s: number) => `0:${String(s).padStart(2, "0")}`;

/* ── the bar every screen camera wears ──────────────────────────────────── */

/** Close, whose camera it is (the host's names first, bible 7), the flash. */
export function CamBar({
  sub,
  flash = true,
}: {
  sub: string;
  flash?: boolean;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between px-3">
      <span className="dm-cam-round" aria-label="Back to the album">
        <X className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 text-center">
        <p className="truncate font-heading text-base font-medium">
          {EVENT.name}
        </p>
        <p className="text-micro text-white/60">{sub}</p>
      </div>
      <span
        className="dm-cam-round"
        data-on={flash ? "" : undefined}
        aria-label="Flash"
      >
        <Zap className="size-5" aria-hidden />
      </span>
    </div>
  );
}

/* ── the ring of frames around a shutter ────────────────────────────────── */

/**
 * TWENTY-FOUR TICKS, ONE A FRAME: lit while unexposed, dark once spent, the
 * frame just spent still glowing. `spend` is how many the last shot took (a
 * video spends three where the count decision says so).
 */
export function FrameRing({
  left,
  of = ROLL.shots,
  size,
  justSpent = 0,
  recording,
}: {
  left: number;
  of?: number;
  size: number;
  justSpent?: number;
  /** A video running: the ring fills red to this fraction of its 10 seconds. */
  recording?: number;
}) {
  const r = size / 2;
  const spent = of - left;
  return (
    <svg
      className="dm-ring"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden
      data-dm-ring={`${left}/${of}`}
    >
      {Array.from({ length: of }, (_, i) => {
        const a = (i / of) * Math.PI * 2 - Math.PI / 2;
        const inner = r - 7;
        const outer = r - 1.5;
        const state =
          i < spent - justSpent ? "spent" : i < spent ? "just" : "lit";
        return (
          <line
            key={i}
            x1={r + Math.cos(a) * inner}
            y1={r + Math.sin(a) * inner}
            x2={r + Math.cos(a) * outer}
            y2={r + Math.sin(a) * outer}
            data-tick={state}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        );
      })}
      {recording !== undefined && (
        <circle
          cx={r}
          cy={r}
          r={r - 12}
          fill="none"
          className="dm-ring-rec"
          strokeWidth={4}
          strokeDasharray={`${2 * Math.PI * (r - 12) * recording} ${2 * Math.PI * (r - 12)}`}
          transform={`rotate(-90 ${r} ${r})`}
        />
      )}
    </svg>
  );
}

/* ── the phone's own prompt, a stand-in drawn plain ──────────────────────── */

/**
 * SAFARI'S PERMISSION ALERT, AS AN IPHONE DRAWS IT: the site's name in
 * quotes, what it would like, Don't Allow and Allow. It is the operating
 * system's screen, not ours, so it is drawn as generic furniture: nothing of
 * its exact material is claimed, only its words and its two answers.
 */
export function IosAlert({
  mic = false,
  note,
}: {
  mic?: boolean;
  /** The page's own line under the prompt (`askLine`), read through the scrim. */
  note?: string;
}) {
  return (
    <div className="dm-ios-scrim" data-dm-alert>
      <div className="dm-ios-alert" role="alertdialog">
        <div className="px-4 pt-5 pb-4 text-center">
          <p className="text-[17px] leading-snug font-semibold" data-dm-say>
            {mic
              ? "“partyreel.com” Would Like to Access the Camera and Microphone"
              : "“partyreel.com” Would Like to Access the Camera"}
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-black/15 text-[17px]">
          <span className="border-r border-black/15 py-3 text-center text-[#0a84ff]">
            Don&rsquo;t Allow
          </span>
          <span className="py-3 text-center font-semibold text-[#0a84ff]">
            Allow
          </span>
        </div>
      </div>
      {note && (
        <p className="dm-ios-note" data-dm-note>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * THE LINE A CAMERA SAYS WHILE THE PHONE ASKS, under the prompt: on the first
 * press what Allow does; on a return visit how to stop the asking.
 */
export function askLine(phase: Phase, mic?: boolean): string {
  if (phase === "again")
    return "Your iPhone asks each visit. To stop it: aA in the address bar, Website Settings, Camera, Allow.";
  return mic
    ? "Allow, and the camera is ready for photos, and videos with their sound."
    : "Allow, and the camera is ready.";
}

/**
 * THE REFUSAL, in the camera's own ground: what happened, how to turn it back
 * on in Safari, Try again, and the phone's own camera as the way through
 * (bible 3: nothing is a dead end), counted the same (the carried call
 * `refused`).
 */
export function Refused({
  tone = "dark",
  left,
}: {
  tone?: "dark" | "paper";
  left: number;
}) {
  const paper = tone === "paper";
  return (
    <div
      data-dm-refused
      className={cn(
        "surface-ink w-full rounded-2xl bg-card p-5 text-left text-card-foreground",
        !paper && "bg-white/[0.07]",
      )}
    >
      <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
        <Camera className="size-5" aria-hidden />
      </span>
      <p className="font-heading text-lg font-medium" data-dm-say>
        The camera is off for this page
      </p>
      <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
        To turn it on: aA in the address bar, Website Settings, Camera, Allow.
        Then try again.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          size="cta"
          className="w-full"
          tabIndex={-1}
          data-dm-reach
        >
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          size="cta"
          className="w-full"
          tabIndex={-1}
        >
          Use your phone&rsquo;s camera
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {`It counts the same: ${left} shots left.`}
      </p>
    </div>
  );
}

/** The microphone's own glyph, for a camera whose first press asks for it too. */
export function MicNote() {
  return (
    <span className="inline-flex items-center gap-1 text-micro text-white/60">
      <Mic className="size-3" aria-hidden /> With sound
    </span>
  );
}

/** A red dot and the clock, the one mark every camera wears while it films. */
export function RecPill({ seconds }: { seconds: number }) {
  return (
    <span className="dm-rec-pill" data-dm-rec={clock(seconds)}>
      <span className="dm-rec-dot" aria-hidden />
      {`${clock(seconds)} of 0:10`}
    </span>
  );
}

/** A phase's words for a caption, when a frame needs to name it. */
export const PHASE_WORDS: Record<Phase, string> = {
  framing: "framing her seventh",
  after: "the moment after",
  ask: "7:48 pm, her first press",
  refused: "she tapped Don't Allow",
  again: "10:40 pm, her iPhone asks again",
  recording: "four seconds into a video",
};

/** Layout helper: a whole-screen camera ground. */
export function Screen({
  className,
  children,
  data,
}: {
  className: string;
  children: ReactNode;
  data?: string;
}) {
  return (
    <div className={className} data-dm-camera={data}>
      {children}
    </div>
  );
}
