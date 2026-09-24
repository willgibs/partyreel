/**
 * THE VIEWER'S OWN REEL, KEPT ON THEIR DEVICE (reel-guest-wiring, 2026-09-24).
 *
 * Three knobs in the view's dock, each a preference with "a huge array of user preferences" behind
 * it (Will's `pacing=unhurried` note), and none of them anyone else's business: the HOLD (how long a
 * photograph stays), the STYLE (which of the eight moods) and whether VIDEOS play. All three live
 * in this browser's localStorage and never travel on the wire. The host's `reel_style_id` is only
 * the style's DEFAULT; a viewer's pick overrides it on their device and is never written back.
 *
 * ★ THE HOLD IS SECONDS, AND THE ENGINE TAKES A FACTOR. The dock says "3 s"; the engine's one pacing
 * knob is `holdScale`, which scales the MOOD's own hold (and its transitions and video window with
 * it, live/pacing.ts). So `holdScaleFor` divides the chosen seconds by the mood's `photoHoldSec` on
 * the wall surface (factor 1): 3 s is 3 s on every mood, rather than "1x" meaning 1.4 s on Kinetic
 * and 2.9 s on Float.
 *
 * ★ STORAGE CAN THROW, AND THE REEL MUST NOT. A private window, blocked site data or a full quota
 * makes localStorage throw; every read and write here is wrapped, and a failed read is the default.
 *
 * ★ WHICH KEYS ARE PER EVENT. The style is per EVENT (a mood belongs to a party: a guest who picked
 * Noir at one wedding should meet the next host's own default), the hold and the videos switch are
 * the viewer's across events (a pace, and a data plan, are about the person).
 */
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { resolveLiveStyleId } from "@/lib/reel/live/window";

/** The Hold control's steps, in seconds: both boards' options merged (reel-view's 1, 1.5 and 2.2;
 *  reel-screen's 3.6, 5 and 7), with Will's 3 s default among them. */
export const HOLD_STEPS_SEC = [1, 1.5, 2.2, 3, 3.6, 5, 7] as const;
export const DEFAULT_HOLD_SEC = 3;

const HOLD_KEY = "pr_reel_hold";
const VIDEOS_KEY = "pr_reel_videos";
const styleKey = (qrToken: string) => `pr_reel_style_${qrToken}`;

/** The step a stored or odd value belongs to (a future step list never strands an old choice). */
export function nearestHoldStep(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_HOLD_SEC;
  let best: number = HOLD_STEPS_SEC[0];
  for (const step of HOLD_STEPS_SEC) {
    if (Math.abs(step - seconds) < Math.abs(best - seconds)) best = step;
  }
  return best;
}

/** How a hold reads in the dock: "3 s", "1.5 s". */
export function holdLabel(seconds: number): string {
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} s`;
}

/**
 * The engine's `holdScale` for a hold in seconds, on this mood (see the header). The look plays on
 * the wall surface, whose factor is 1, so this is the whole conversion; pacing.ts clamps it.
 */
export function holdScaleFor(seconds: number, styleId: string | null): number {
  const theme = resolveTheme(resolveLiveStyleId(styleId));
  return seconds / theme.photoHoldSec;
}

/** The eight moods, in the catalog's order: the Style control's options. */
export function liveMoods(): { id: string; label: string }[] {
  return STYLE_CATALOG.filter((entry) => entry.kind === "mood").map(
    (entry) => ({ id: entry.id, label: entry.label }),
  );
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A preference that cannot be kept is simply not kept: the reel plays on regardless.
  }
}

export function readHoldSec(): number {
  const raw = read(HOLD_KEY);
  return raw === null ? DEFAULT_HOLD_SEC : nearestHoldStep(Number(raw));
}

export function writeHoldSec(seconds: number): void {
  write(HOLD_KEY, String(nearestHoldStep(seconds)));
}

/** The viewer's own mood for this event, or null (the host's default then decides). */
export function readStyleId(qrToken: string): string | null {
  const raw = read(styleKey(qrToken));
  if (!raw) return null;
  return liveMoods().some((mood) => mood.id === raw) ? raw : null;
}

export function writeStyleId(qrToken: string, styleId: string): void {
  write(styleKey(qrToken), styleId);
}

/**
 * Whether videos play, before the viewer has said: on, unless the browser asks to save data
 * (`navigator.connection.saveData`, Chromium's Lite mode and its peers), since a video window reads
 * megabytes a still never does.
 */
export function defaultIncludeVideos(
  nav: Pick<Navigator, never> & { connection?: { saveData?: boolean } } = typeof navigator ===
  "undefined"
    ? {}
    : (navigator as never),
): boolean {
  return nav.connection?.saveData !== true;
}

export function readIncludeVideos(): boolean {
  const raw = read(VIDEOS_KEY);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return defaultIncludeVideos();
}

export function writeIncludeVideos(on: boolean): void {
  write(VIDEOS_KEY, on ? "1" : "0");
}
