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
 * ★ THE DEVELOP TIME IS SAID FROM NOW, IN HER OWN CLOCK: "at 9 am" inside a day (a party's night needs no date),
 * "Saturday at 9 am" inside a week, then the date. The browser's own zone is hers, and a guest's zone is the party's.
 *
 * Pure, so every line is a unit test.
 */

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

const DAY_MS = 86_400_000;

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

/** When the roll develops, from now: "at 9 am", "Saturday at 9 am", "Oct 14 at 9 am". */
export function developsWhen(iso: string, nowMs: number = Date.now()): string {
  const at = new Date(iso);
  const ahead = at.getTime() - nowMs;
  const clock = clockWords(at);
  if (ahead < DAY_MS) return `at ${clock}`;
  if (ahead < 7 * DAY_MS) return `${WEEKDAY.format(at)} at ${clock}`;
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
  afterVideo: "Your video is on the roll.",
  shotFailed: "That shot didn’t take. Try again.",
  videoFailed: "That video didn’t take. Try again.",
  retry: "Retry",
} as const;

/** "Shot 7 is on the roll." (the frame just spent); the host's own camera has no roll: "Shot 3 taken." */
export function afterShotHint(frame: number, host = false): string {
  return host ? `Shot ${frame} taken.` : `Shot ${frame} is on the roll.`;
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
  cap: number;
  reveal: CameraReveal;
  developsAt: string | null | undefined;
  nowMs?: number;
}): string {
  const shots = `${input.cap} ${input.cap === 1 ? "shot" : "shots"}`;
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

/** Where one of her shots stands, in her list. */
export const SHOT_WORDS = {
  taking: "Sending…",
  sending: "Sending…",
  in: "In the album",
  sealed: "Developing",
  held: "Waiting for approval",
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

/** The reel's caption: "Frame 7 of 24", "24 of 24" once it is spent, and how many are still on their way. */
export function reelCaption(input: {
  frame: number;
  cap: number;
  done: boolean;
  host: boolean;
  sending: number;
}): string {
  const base = input.host
    ? HOST_NO_ROLL
    : input.done
      ? `${input.cap} of ${input.cap}`
      : `Frame ${input.frame} of ${input.cap}`;
  return input.sending > 0 ? `${base} · sending ${input.sending}` : base;
}
