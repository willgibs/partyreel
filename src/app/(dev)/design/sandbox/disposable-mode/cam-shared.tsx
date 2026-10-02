"use client";

import type { ReactNode } from "react";
import { X, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import { EVENT, ROLL, type Still } from "./fixtures";

/**
 * WHAT EVERY CAMERA SHARES: the states a night puts it in, the words each
 * state says, the ring of ticks round a shutter, the filming mark and the
 * roll's end.
 *
 * ★ THE LIVE PICTURE IS A PHOTOGRAPH STANDING IN FOR THE CAMERA, DRAWN AS THE
 * PHONE SEES IT. In the proposal it is the rear camera's stream in the page
 * (getUserMedia, asked of the phone on the first press, as round two drew
 * it), and the shutter takes the largest frame the phone hands a page. It
 * wears no look: whether the roll wears one is its own decision, and a look
 * is part of what develops (the carried call `live`).
 *
 * ★ ONE VOCABULARY, SIX CAMERAS. The words a state says (`hint`) and the
 * end of the roll (`RollDone`) are the same in every camera, so a flip
 * between two cameras changes the camera and nothing else.
 *
 * Nothing here is wired: every control is inert, drawn at rest.
 */

export type CameraId =
  | "viewfinder"
  | "shutter"
  | "rim"
  | "reel"
  | "timeline"
  | "scroll";

/** Where the night has the camera. */
export type Phase = "framing" | "after" | "done" | "recording";

export type VideoWay = "hold" | "switch" | "button";
export type VideoCount = "one" | "three" | "own";

export type CamProps = {
  phase: Phase;
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
  /** "after" drawn just after a video rather than a photo. */
  afterVideo?: boolean;
};

/** The longest video (the carried call `ten`, round two). */
export const VIDEO_SECONDS = 10;

/** "1 video", "2 videos". */
export const videosWord = (n: number) => `${n} video${n === 1 ? "" : "s"}`;

/** What the count says under its numeral, in every camera's own words. */
export function leftUnit(p: CamProps): string {
  if (p.count === "own") return `photos · ${videosWord(p.videosLeft ?? 3)}`;
  return "left";
}

/** Whether the camera is live (its picture showing) in this phase. */
export const isLive = (phase: Phase) =>
  phase === "framing" || phase === "after" || phase === "recording";

/** The seconds, as the camera's clock says them: 0:04. */
export const clock = (s: number) => `0:${String(s).padStart(2, "0")}`;

/** How many frames the last act spent, for the tick or frame still glowing. */
export function justSpent(p: CamProps): number {
  if (p.phase !== "after") return 0;
  if (!p.afterVideo) return 1;
  if (p.count === "own") return 0;
  return p.count === "three" ? 3 : 1;
}

/** The frame she is on: 7 at 10:40 pm. */
export const frameOf = (p: CamProps) => ROLL.shots - p.left + 1;

/**
 * THE ONE LINE A CAMERA SAYS, by state: how to film where filming is a hold,
 * what just happened, and nothing at all when there is nothing to say.
 */
export function hint(p: CamProps): string {
  const hold = p.video === "hold";
  if (p.phase === "recording")
    return hold ? "Let go to stop." : "Press again to stop.";
  if (p.phase === "after")
    return p.afterVideo
      ? "Your video is on the roll."
      : `Shot ${p.taken ?? frameOf(p) - 1} is on the roll.`;
  if (p.phase === "done") return "";
  return hold ? "Tap for a photo. Hold for a video." : "There is no retake.";
}

/** The same words as a pill's: a pill carries no full stop. */
export const pill = (words: string) => words.replace(/\.$/, "");

/* ── the bar a black-ground camera wears ───────────────────────────────── */

/** Close, whose camera it is (the host's names first, bible 7), the flash. */
export function CamBar({
  sub,
  flash = true,
}: {
  sub: string;
  flash?: boolean;
}) {
  return (
    <div className="relative z-10 flex h-14 shrink-0 items-center justify-between px-3">
      <span className="dm-cam-round" aria-label="Back to the album">
        <X className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 text-center">
        <p className="truncate font-heading text-base">{EVENT.name}</p>
        <p className="text-micro text-white/60" data-dm-sub>
          {sub}
        </p>
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

/* ── the ring of ticks around a shutter ────────────────────────────────── */

/**
 * TWENTY-FOUR TICKS, ONE A FRAME: lit while unexposed, dark once spent, the
 * frame just spent still glowing. A video running fills an inner arc red to
 * its share of the ten seconds.
 */
export function FrameRing({
  left,
  of = ROLL.shots,
  size,
  just = 0,
  recording,
  className,
}: {
  left: number;
  of?: number;
  size: number;
  just?: number;
  /** A video running: the fraction of its ten seconds. */
  recording?: number;
  className?: string;
}) {
  const r = size / 2;
  const spent = of - left;
  return (
    <svg
      className={cn("dm-ring", className)}
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
        const state = i < spent - just ? "spent" : i < spent ? "just" : "lit";
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

/** A red dot and the clock, the one mark every camera wears while it films. */
export function RecPill({ seconds }: { seconds: number }) {
  return (
    <span className="dm-rec-pill" data-dm-rec={clock(seconds)}>
      <span className="dm-rec-dot" aria-hidden />
      {`${clock(seconds)} of ${clock(VIDEO_SECONDS)}`}
    </span>
  );
}

/** Photo or Video, the switch over a shutter where filming is a mode. */
export function ModeSwitch({
  video,
  className,
}: {
  video: boolean;
  className?: string;
}) {
  return (
    <div className={cn("dm-modes", className)} data-dm-modes>
      <span data-on={video ? undefined : ""}>Photo</span>
      <span data-on={video ? "" : undefined}>Video</span>
    </div>
  );
}

/* ── the end of the roll ───────────────────────────────────────────────── */

/**
 * THE ROLL, DONE: what her twenty-fourth shot leaves her with, the same in
 * every camera (bible 3: nothing is a dead end). Her shots are one tap away,
 * the album behind them; the shutter is gone, since there is nothing left to
 * press.
 */
export function RollDone({
  className,
  children,
}: {
  className?: string;
  /** What the camera keeps of itself beside the words (its spent ring, its strip). */
  children?: ReactNode;
}) {
  return (
    <div className={cn("dm-done", className)} data-dm-done>
      {children}
      <p className="font-heading text-[26px] leading-tight" data-dm-say>
        That&rsquo;s your roll
      </p>
      <p className="mt-1.5 text-sm text-pretty text-white/70">
        {`${ROLL.shots} shots, developing with everyone's. They're back at ${ROLL.develops}.`}
      </p>
      <div className="mt-5 grid w-full gap-2">
        <span className="dm-done-primary">See your shots</span>
        <span className="dm-done-secondary">Back to the album</span>
      </div>
    </div>
  );
}

/** Layout helper: a whole-screen camera ground. */
export function CamScreen({
  id,
  className,
  children,
}: {
  id: CameraId;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("dm-cam", className)} data-dm-camera={id}>
      {children}
    </div>
  );
}
