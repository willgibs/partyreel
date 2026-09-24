import type { GridMedia } from "@/components/app/media-grid";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { planReel } from "@/lib/reel/engine/layout";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { planTake } from "@/lib/reel/live/take";

import { GALLERY_ITEMS, HOST_EVENT } from "../gallery-fixtures";

/**
 * ONE WEDDING ON ONE BIG SCREEN, AND NOT ONE BYTE OF PRODUCTION.
 *
 * ★ THE SHARED WORLD, NEVER A SECOND ONE. Mia and Theo's wedding is the album
 * every reel board judges on (`sandbox/gallery-fixtures.ts`), so a decision
 * taken here and one taken on reel-host are about the same event. This file
 * adds only what a screen needs: the reel's props, the join url the code
 * encodes, and the one photograph there is before the reel starts.
 *
 * ★ NOTHING HERE TOUCHES A ROW, AN RPC, A PRESIGN OR AN ENCODE. `buildReelProps`
 * and `planTake` are pure (the same functions the live reel calls), so the
 * props below are the shape the real engine draws, over local stills.
 *
 * ★ LANDSCAPE, BECAUSE A TELEVISION IS LANDSCAPE. `reelDimensions("landscape")`
 * is 1920 by 1080 exactly, so the engine's own composition space IS this
 * board's stage: a frame here is the engine drawing at 1:1.
 */

export const BY_ID = new Map(GALLERY_ITEMS.map((m) => [m.id, m]));

/** The reel's own take over the album: the order the live reel really plays. */
export const TAKE_IDS: string[] = planTake(GALLERY_ITEMS, {
  eventId: HOST_EVENT.id,
  loopIndex: 0,
});

/**
 * The one photograph there is before the reel starts at the second: the
 * album's first. A phone's portrait, which is the representative case on a
 * landscape television, so the engine's own fill for it is what is judged.
 */
export const FIRST_PHOTO: GridMedia = GALLERY_ITEMS[0];

/**
 * THE LOOK THE SCREEN WEARS while its plates are judged (the `look` call).
 * Sunset rather than the default Cinematic: Cinematic draws letterbox bars on a
 * 16:9 screen, and every corner would be judged over black instead of over a
 * photograph.
 */
const STYLE_ID = "golden";
const SEED = 41_726;

/** The url the code encodes, exactly as `/e/[token]` builds it. */
export const JOIN_URL = `https://partyreel.com/e/${HOST_EVENT.qr_token}`;
/** What a person reads off a screen and types, which is never the token. */
export const JOIN_LABEL = "partyreel.com/e/mia-theo";
/** The event's own code style, resolved the way the hub's code door resolves it. */
export const QR_STYLE = resolveQrPreset(HOST_EVENT.qr_style);

/** The props the engine draws for the screen: the take, or the one photograph. */
export function screenProps(opts: { only?: GridMedia } = {}): ReelProps {
  return buildReelProps({
    orderedIds: opts.only ? [opts.only.id] : TAKE_IDS,
    byId: BY_ID,
    styleId: STYLE_ID,
    seed: SEED,
    orientation: "landscape",
    coverMediaId: null,
    // The live reel is never capped and never marked.
    lengthSeconds: null,
    watermark: false,
  });
}

/**
 * THE FRAME IN THE MIDDLE OF A CLIP'S HOLD, read off the engine's own plan.
 *
 * ★ A STILL PICKED BY THE CLOCK LANDS IN A DISSOLVE (round one's finding):
 * clips overlap by their transition frames, so the middle of a hold is the
 * only place a single photograph is on screen alone.
 */
export function clipMidFrame(index: number, props: ReelProps): number {
  const plan = planReel(props);
  const n = plan.clips.length;
  if (n === 0) return 0;
  const k = ((index % n) + n) % n;
  let start = 0;
  for (let i = 0; i < k; i++) {
    start +=
      plan.clips[i].durationInFrames - (plan.gaps[i]?.durationInFrames ?? 0);
  }
  return Math.round(start + plan.clips[k].durationInFrames / 2);
}
