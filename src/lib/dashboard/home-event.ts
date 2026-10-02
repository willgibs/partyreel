import type { Door } from "@/lib/event/door/door";
import type { ReadyFacts } from "@/lib/events/readiness";

import type { Dated } from "./when";

/**
 * ONE HOSTED EVENT AS THE DASHBOARD KNOWS IT: every fact the page's rules read (`when.ts`,
 * `attention.ts`, `moment.ts`, `seasons.ts`), already read on the server and plain, so the rules are
 * pure and the same facts drive the page and its tests.
 *
 * ★ SOME FACTS ARE READ ONLY WHERE A RULE ASKS FOR THEM. Readiness's two extra facts (the code's
 * opens, and who is past a closed door) are read for the events the page asks readiness of, the
 * stage's and the week's before their day, and are null on every other event, where nothing asks
 * (a step only reaches the page inside the week). The day's arrivals are read for the events on
 * their day, and are zero elsewhere. A rule that needs an unread fact says nothing rather than guess.
 */
export type HomeEvent = Dated & {
  id: string;
  name: string;
  /** When the host made it: the last tie-break, the newest made first. */
  createdAt: string;
  door: Door;
  hasPassword: boolean;
  acceptingUploads: boolean;
  /** The host's Show the reel switch. */
  showReel: boolean;
  description: string | null;
  /** In the album: approved (the card's count, `event_card_stats`). */
  approved: number;
  /** Waiting on the host's review. */
  pending: number;
  /** People waiting at the door for the host to let them in. */
  waiting: number;
  /** Items that can play in the reel, counted to its minimum (`getReelProgress`). */
  playable: number;
  /** Readiness's own reads, for the events the page asks readiness of; null where unread. */
  ready: { opened: number; guestsIn: number } | null;
  /** Approved arrivals since the viewer's midnight and in the last hour, read for events on their day. */
  arrivals: { today: number; lastHour: number };
};

/** What every event on the page shares: the viewer's day and the account's facts. */
export type HomeContext = {
  /** The viewer's calendar day, `YYYY-MM-DD`. */
  today: string;
  /** The viewer's clock is in the evening (`isEvening`). */
  evening: boolean;
  /** The platform lever (`ops_flags.live_reel_enabled`). */
  liveReelEnabled: boolean;
  /** The account's storage used, as a whole percent of its cap. */
  storagePct: number;
};

/**
 * The event's facts as production's readiness reads them (`lib/events/readiness.ts`, the hub's checklist
 * and Settings' steps): one function says what ready means everywhere, and this only hands it the
 * facts. Null when readiness's own reads were not made for this event.
 */
export function readyFactsOf(
  e: HomeEvent,
  ctx: HomeContext,
): ReadyFacts | null {
  if (!e.ready) return null;
  return {
    door: e.door,
    hasPassword: e.hasPassword,
    guestsIn: e.ready.guestsIn,
    // The invite list's size never decides readiness (`doorLetsGuestsIn`): an empty list still lets people ask.
    invited: 0,
    acceptingUploads: e.acceptingUploads,
    approved: e.approved,
    playable: e.playable,
    showReel: e.showReel,
    liveReelEnabled: ctx.liveReelEnabled,
    eventDate: e.date,
    description: e.description,
    opened: e.ready.opened,
    storagePct: ctx.storagePct,
  };
}
