import { formatCount } from "@/lib/format/count";

/**
 * WHAT A CLAIMED PAGE WITH NOTHING ON IT SAYS (`identity-profile` r1, `page=count`, with Will's note:
 * "simplified into a more '2 private events' tone. Doesn't need to do a ton of explaining, similar to
 * option 1. However, it helps differentiate an active private user from a no-events private user
 * with no public events").
 *
 * One quiet line either way. `count` is `get_public_profile`'s `private_event_count`: only the
 * events THIS viewer could confirm (a gated album she has not passed stays out of it), and null
 * unless the page shows nothing. Absent (before its migration) or zero, the page says what it said
 * before, now as quietly as the count does.
 */
export function emptyPageLine(count: number | null | undefined): string {
  if (!count || count < 1) return "No events here yet";
  return `${formatCount(count)} private event${count === 1 ? "" : "s"}`;
}
