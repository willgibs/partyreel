import { clipFactsForTier } from "@/lib/events/gallery-reel";
import type { Tier } from "@/lib/constants/tiers";

/**
 * WHAT A PLAN'S CLIPS COME WITH, AS ONE PHRASE: their longest length and their mark ("60 seconds, small
 * mark"). The marketing tables give a clip ONE row (and /reel's table one column), where they used to
 * give its length a row of its own: since the free/pro shift every plan's clips run the same length, so
 * that row read "60 seconds" across the board and compared nothing, and the mark is what paying still
 * changes about a clip (tiers.ts, `MAX_REEL_SECONDS`). The phrase is the help center's own shape for the
 * same fold (`pro-vs-event-pass.mdx`), and it still tells the plans apart the day their lengths differ.
 *
 * Both halves come from the product's own rule for the creator (`clipFactsForTier`, the facts the clip
 * creator is handed), so a table cannot promise a length or a mark the creator does not apply.
 */
export function clipTermsFor(tier: Tier): string {
  const facts = clipFactsForTier(tier);
  return `${facts.maxSeconds} seconds, ${facts.watermark ? "small mark" : "no mark"}`;
}
