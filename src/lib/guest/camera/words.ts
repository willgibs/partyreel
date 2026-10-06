/**
 * THE CAMERA'S WORDS, ONE HOME (disposable-mode r3, Will's `camera=timeline`): every sentence the album's camera says,
 * so the camera, her shots and the help article quote one string each (`help-ui-labels` greps the article's quoted
 * labels against the source).
 *
 * ★ THE ALBUM'S REVEAL DECIDES WHAT A SHOT IS TOLD. The same camera shoots for three albums: one that develops later
 * (`develops_at` ahead), one whose host approves each upload, and one where a shot goes straight in; `revealFor` reads
 * the pair the way `lib/disposable/reveal.ts` does (a develop time ahead is the stronger promise), and every line
 * below says the album she is in.
 *
 * ★ THE DEVELOP TIME IS SAID FROM NOW, IN HER OWN CLOCK, BY THE CALENDAR'S DAYS: "at 9 am" only for today (a party's
 * night needs no date), "tomorrow at 9 am" for the next day however few hours it is away (red-team 46's NIT: a Sunday
 * 9 am develop said "at 9 am" three hours after Saturday's), "Saturday at 9 am" inside a week, then the date. The
 * browser's own zone is hers, and a guest's zone is the party's.
 *
 * Pure, so every line is a unit test.
 */

import { daysBetween } from "@/lib/events/dates";
import {
  TRACKER_SEALED_WORDS,
  TRACKER_WORDS,
} from "@/lib/guest/upload-tracker";

export type CameraReveal = "develop" | "approve" | "live";

/** Which album the camera shoots for, now: a develop time ahead, the host's approval, or straight in. */
export function revealFor(
  event: { develops_at?: string | null; moderation_mode?: string | null },
  nowMs: number = Date.now(),
): CameraReveal {
  const at = event.develops_at ? Date.parse(event.develops_at) : NaN;
  if (Number.isFinite(at) && at > nowMs) return "develop";
  return event.moderation_mode === "hold_for_approval" ? "approve" : "live";
}

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/** "9 am", "9:30 pm", "12 pm": a clock as a person says it. */
export function clockWords(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const half = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${hour} ${half}`
    : `${hour}:${String(m).padStart(2, "0")} ${half}`;
}

/** A date's day in the reader's own clock, as the calendar prints it (`YYYY-MM-DD`). */
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * How many calendar days `to`'s day is past `from`'s, in the reader's own clock: 0 the same day, 1 the next, negative
 * before. ★ A DAY IS THE CALENDAR'S, NEVER 24 HOURS: each instant is read off its own year, month and day (`daysBetween`,
 * the events' one day counter), so the midnight is hers and a day that holds 23 or 25 hours across the clocks' change
 * is still one day.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  return daysBetween(localDay(from), localDay(to));
}

/**
 * When the roll develops, from now: "at 9 am" today, "tomorrow at 9 am", "Saturday at 9 am" inside the week, "Oct 14
 * at 9 am" beyond it. The week ends at six days on: a seventh would say today's own weekday.
 */
export function developsWhen(iso: string, nowMs: number = Date.now()): string {
  const at = new Date(iso);
  const clock = clockWords(at);
  const days = calendarDaysBetween(new Date(nowMs), at);
  if (days <= 0) return `at ${clock}`;
  if (days === 1) return `tomorrow at ${clock}`;
  if (days < 7) return `${WEEKDAY.format(at)} at ${clock}`;
  return `${DATE.format(at)} at ${clock}`;
}

/** The line under the event's name in the camera's bar. */
export function cameraSubLine(input: {
  reveal: CameraReveal;
  developsAt: string | null | undefined;
  recording: boolean;
  done: boolean;
  nowMs?: number;
}): string {
  if (input.recording) return "Filming";
  if (input.done) return "Your roll is done";
  if (input.reveal === "develop" && input.developsAt) {
    return `Develops ${developsWhen(input.developsAt, input.nowMs)}`;
  }
  return input.reveal === "approve"
    ? "The host approves each shot"
    : "Every shot goes straight in";
}

/** The camera's one line under the shutter, by what is happening. */
export const CAMERA_HINT = {
  tapOrHold: "Tap for a photo. Hold for a video.",
  tap: "Tap for a photo.",
  letGo: "Let go to stop.",
  letGoSilent: "Filming without sound. Let go to stop.",
  askMic: "Allow the microphone to film with sound.",
  // Taken, never "on the roll": said in the press's own frame, before the server has counted it (`afterShotHint`).
  afterVideo: "Video taken.",
  shotFailed: "That shot didn’t take. Try again.",
  videoFailed: "That video didn’t take. Try again.",
  retry: "Retry",
} as const;

/**
 * "Shot 7 taken." (the frame just spent), the host's and a guest's alike. ★ NEVER "ON THE ROLL" (red-team 44's NIT): it is
 * said in the press's own frame, before the server has the shot, and a guest's "Shot 6 is on the roll." stood beside the
 * server's refusal of it (the album closed to uploads, a roll spent from another tab). The roll's count and a refusal's
 * own words say the rest.
 */
export function afterShotHint(frame: number): string {
  return `Shot ${frame} taken.`;
}

/**
 * THE ALBUM'S ONE ADD, IN WORDS: the album's camera says Take, the others Add, and "the first photo" only over an album
 * nothing has been added to, visible or waiting (red-team 46's NIT: See it as a guest said "Take the first photo" over
 * 102 developing shots, where a newcomer to the same album reads "Take photos"). The guest page (`event-experience.tsx`)
 * carries the same four phrases inline and a test holds the two to them; `empty` is the caller's to decide from what the
 * guest page decides it from, the visible count and what waits.
 */
export function addWords(input: { camera: boolean; empty: boolean }): string {
  const verb = input.camera ? "Take" : "Add";
  return input.empty ? `${verb} the first photo` : `${verb} photos`;
}

/** The camera's own controls, by name. */
export const CAMERA_CONTROLS = {
  shutter: "Take a photo",
  shutterOrFilm: "Take a photo, or hold to film",
  flash: "Flash",
  turn: "Turn the camera round",
  left: "left",
  taken: "taken",
} as const;

/** The reel's name as a button: her shots, and how many are on the roll (the host's: how many she took). */
export function reelLabel(count: number, host = false): string {
  return `${YOUR_SHOTS}, ${count} ${host ? "taken" : "on the roll"}`;
}

/** "1 shot didn’t send." / "3 shots didn’t send." */
export function unsentLine(n: number): string {
  return `${n} ${n === 1 ? "shot" : "shots"} didn’t send.`;
}

/** The roll's end, and how the roll comes back (the board's carried call `end`). */
export const ROLL_DONE_TITLE = "That’s your roll";

export function rollDoneLine(input: {
  /** Her shots on the spent roll: the roll's size, or more where the host made it smaller after she shot. */
  held: number;
  reveal: CameraReveal;
  developsAt: string | null | undefined;
  nowMs?: number;
}): string {
  const shots = `${input.held} ${input.held === 1 ? "shot" : "shots"}`;
  if (input.reveal === "develop" && input.developsAt) {
    return `${shots}, developing with everyone’s. They’re back ${developsWhen(input.developsAt, input.nowMs)}.`;
  }
  return input.reveal === "approve"
    ? `${shots}, waiting for the host.`
    : `${shots}, all in the album.`;
}

/** Said under the roll's end while removing a shot can still free a frame (Will's overrule: a removal frees its frame). */
export const FREE_A_FRAME = "Remove a shot to free its frame.";

export const SEE_YOUR_SHOTS = "See your shots";
export const BACK_TO_ALBUM = "Back to the album";
export const BACK_TO_CAMERA = "Back to the camera";

/** Her shots, the camera's own list of her roll. */
export const YOUR_SHOTS = "Your shots";
export const YOUR_SHOTS_EMPTY = "Your shots show here as you take them.";
/** Said under her shots while a removal can free a frame. */
export const REMOVING_FREES = "Removing a shot frees its frame.";

export function yourShotsLine(input: {
  reveal: CameraReveal;
  developsAt: string | null | undefined;
  nowMs?: number;
}): string {
  if (input.reveal === "develop" && input.developsAt) {
    return `Only you can see these until they develop ${developsWhen(input.developsAt, input.nowMs)}.`;
  }
  return input.reveal === "approve"
    ? "Each one waits for the host before it joins the album."
    : "They’re in the album as you take them.";
}

/**
 * Where one of her shots stands, in her list: her tracker's own words for the same states (`upload-tracker.ts`, one
 * state, one name), and the camera's for what only the camera says.
 */
export const SHOT_WORDS = {
  taking: TRACKER_WORDS.sending,
  sending: TRACKER_WORDS.sending,
  in: TRACKER_WORDS.approved,
  sealed: TRACKER_SEALED_WORDS,
  held: TRACKER_WORDS.waiting,
  failed: "Didn’t send",
  removing: "Removing…",
  removeFailed: "Couldn’t remove it",
} as const;

/** What a camera that cannot open says, and the way on from it. */
export const CAMERA_ACCESS = {
  asking: "Allow the camera to start shooting.",
  opening: "Opening the camera…",
  deniedTitle: "The camera is off for this site",
  deniedLine:
    "Turn the camera on for this site in your browser’s settings, then try again.",
  unavailableTitle: "The camera can’t open here",
  unavailableLine: "Take each shot with your phone’s camera instead.",
  busyTitle: "Another app is using the camera",
  busyLine: "Close it, then try again.",
  tryAgain: "Try again",
  usePhoneCamera: "Use your phone’s camera",
} as const;

/** The host's own camera has no roll (`roll-view.ts`'s `HOST_FRESH_FRAMES`). */
export const HOST_NO_ROLL = "No roll for the host";

/**
 * HER ROLL AS A COUNT: "6 of 24", and what she truly holds where it is more than the roll ("2 on a roll of 1": the host
 * made the roll smaller after she shot, red-team 56's LOW), never "1 of 1" beside two shots.
 */
export function rollCount(held: number, cap: number): string {
  return held > cap ? `${held} on a roll of ${cap}` : `${held} of ${cap}`;
}

/** The reel's caption: "Frame 7 of 24", "24 of 24" once it is spent, and how many are still on their way. */
export function reelCaption(input: {
  frame: number;
  cap: number;
  /** Her shots, uncapped (`RollView.held`): read once the roll is spent; absent reads as the roll's size. */
  held?: number;
  done: boolean;
  host: boolean;
  sending: number;
}): string {
  const base = input.host
    ? HOST_NO_ROLL
    : input.done
      ? rollCount(Math.max(input.held ?? input.cap, input.cap), input.cap)
      : `Frame ${input.frame} of ${input.cap}`;
  return input.sending > 0 ? `${base} · sending ${input.sending}` : base;
}
