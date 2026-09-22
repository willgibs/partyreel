import type { GridMedia } from "@/components/app/media-grid";
import { QR_PRESETS } from "@/lib/constants/qr-presets";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { FPS } from "@/lib/reel/engine/constants";
import { planReel } from "@/lib/reel/engine/layout";
import type { ReelProps } from "@/lib/reel/engine/reel-types";

import {
  EVENT,
  GALLERY_ITEMS,
  HOST_EVENT,
  REVIEW_ITEMS,
} from "../gallery-fixtures";

/**
 * ONE WEDDING ON ONE WALL, AND NOT ONE BYTE OF PRODUCTION.
 *
 * ★ THE SHARED WORLD, NEVER A SECOND ONE. Mia and Theo's wedding is the album
 * `media-viewer`, `host-curation` and `guest-capture` already judge on
 * (`sandbox/gallery-fixtures.ts`), so a decision taken here and a decision
 * taken there are about the same event. This file adds only what a WALL needs
 * and the shared file has no business knowing: the reel's props, the join url
 * the code encodes, and the three wall holds.
 *
 * ★ NOTHING HERE TOUCHES A ROW, AN RPC, A PRESIGN OR AN ENCODE. `buildReelProps`
 * is pure (the same function the shipped player calls), so the props below are
 * the shape the real engine draws, built over local stills. No reel provider,
 * no `/api/reel/*`, no upload queue: those fire real writes on any mounted
 * event id, which is the one thing a preview may never do.
 *
 * ★ LANDSCAPE, BECAUSE A WALL IS LANDSCAPE. `reelDimensions("landscape")` is
 * 1920 by 1080 exactly, so the engine's own composition space IS this board's
 * stage: a wall frame is the engine drawing at 1:1, never a portrait reel
 * letterboxed into a television.
 */

/** The album the wall is playing: approved, in the order the album holds. */
export const ALBUM: GridMedia[] = GALLERY_ITEMS;

/** Indexed the way `buildReelProps` wants it (no second presign, no RPC). */
export const BY_ID = new Map(ALBUM.map((m) => [m.id, m]));

/** Every approved id, which is what the live reel's take is drawn from. */
export const REEL_IDS: string[] = ALBUM.map((m) => m.id);

/**
 * The event, as the wall names it. The token is the shared fixture's, so the
 * code on the wall encodes the same join url the shared album's QR does.
 */
export const WALL = {
  name: EVENT.name,
  host: EVENT.host,
  guests: EVENT.guests,
  photos: EVENT.photos,
  token: HOST_EVENT.qr_token,
  /** What Review is holding: the shared queue's own length, never a number this board invented. */
  waiting: REVIEW_ITEMS.length,
  /**
   * The look the wall wears while the furniture is judged. Which mood an event
   * DEFAULTS to is the host's question (`reel-host.style`), never this board's.
   *
   * ★ SUNSET RATHER THAN THE ENGINE'S OWN DEFAULT, AND IT IS A METHOD CALL. The
   * default mood (Cinematic) draws LETTERBOX bars, which on a 16:9 wall park a
   * black band across the top and bottom: every corner of furniture would then
   * be judged over black rather than over a photograph, which is the easy case
   * and not the real one. Sunset is full bleed, so the name, the code and the
   * caption are read over the picture itself. The letterbox finding is carried
   * to the review as a call rather than hidden by the choice.
   */
  styleId: "golden",
  seed: 41_726,
} as const;

/** The url the code encodes, exactly as `/e/[token]` builds it. */
export const JOIN_URL = `https://partyreel.com/e/${WALL.token}`;
/** What a person reads off the wall and types, which is never the token. */
export const JOIN_LABEL = "partyreel.com/e/mia-theo";

/** The shipped designer's own preset, resolved the way the event row resolves it. */
export const QR_STYLE = QR_PRESETS[HOST_EVENT.qr_style as "classic"].options;

/**
 * THE THREE WALL HOLDS, AS SECONDS ON SCREEN PER PHOTOGRAPH.
 *
 * The hand's own default is Cinematic's 2.7 (`THEME_CLASSIC.photoHoldSec`), and
 * the wall is slower than the hand by the plan's own call. These are the three
 * he is asked to feel; the exact number is the knob, not the ruling.
 */
export const HOLDS = {
  brisk: 3.6,
  wall: 5,
  slow: 7,
} as const;
export type HoldId = keyof typeof HOLDS;

/**
 * The props the engine draws for the wall.
 *
 * `hold` overrides the resolved theme's `photoHoldSec` and nothing else, which
 * is the whole of pacing in the engine (`planReel`: a clip's sequence is its
 * hold, transitions overlap into it). `clips` truncates for a cheaper draw, and
 * that is pixel-honest: `planReel` seeds by INDEX, so a prefix plans exactly as
 * the full reel's prefix does (the retired reel-studio board's own note).
 */
export function wallProps(
  opts: { hold?: HoldId; clips?: number; seed?: number } = {},
): ReelProps {
  const base = buildReelProps({
    orderedIds: opts.clips ? REEL_IDS.slice(0, opts.clips) : REEL_IDS,
    byId: BY_ID,
    styleId: WALL.styleId,
    seed: opts.seed ?? WALL.seed,
    orientation: "landscape",
    coverMediaId: null,
    // The live reel is never capped and never watermarked: no mark on any tier
    // (the plan's own call), and a loop has no length.
    lengthSeconds: null,
    watermark: false,
  });
  if (!opts.hold) return base;
  return { ...base, theme: { ...base.theme, photoHoldSec: HOLDS[opts.hold] } };
}

/** How many photographs a hold gets through in a minute, read off the real plan. */
export function perMinute(hold: HoldId): number {
  const plan = planReel(wallProps({ hold }));
  const sec = plan.totalSec / Math.max(1, plan.clips.length);
  return Math.max(1, Math.round(60 / sec));
}

/** The frame the wall is on at `sec` seconds, for a scrub-lock under reduced motion. */
export function frameAt(sec: number, hold: HoldId): number {
  const plan = planReel(wallProps({ hold }));
  return Math.min(Math.max(0, plan.totalFrames - 1), Math.round(sec * FPS));
}

/**
 * THE FRAME IN THE MIDDLE OF A CLIP'S HOLD, read off the engine's own plan.
 *
 * ★ A STILL PICKED BY THE CLOCK LANDS IN A DISSOLVE. The first stills this
 * board drew were "eighteen seconds in" and "one second in", and the plan put
 * both of them mid-transition: a wall of two photographs cross-fading, with the
 * opening punch still scaling. A decision about a caption's legibility judged
 * against a half-drawn frame is a decision about the wrong thing. Clips overlap
 * by their transition frames (`planReel`), so the middle of a hold is the only
 * place a single photograph is on the wall alone.
 */
export function clipMidFrame(index: number, props: ReelProps): number {
  const plan = planReel(props);
  const n = plan.clips.length;
  if (n === 0) return 0;
  const k = ((index % n) + n) % n;
  let start = 0;
  for (let i = 0; i < k; i++) {
    start += plan.clips[i].durationInFrames - (plan.gaps[i]?.durationInFrames ?? 0);
  }
  return Math.round(start + plan.clips[k].durationInFrames / 2);
}

/**
 * The uploader the "just added" beat names. The shared album's fourth uploader
 * is Theo Calder, so the wall's caption says a name the album really holds.
 */
export const JUST_ADDED = {
  name: ALBUM.find((m) => m.uploaderName === "Theo Calder")?.uploaderName ?? "Theo",
  seconds: 42,
} as const;
