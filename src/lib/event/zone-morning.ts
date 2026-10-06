/**
 * THE PARTY'S MORNING AFTER, ONE INSTANT FOR EVERY READER (event-zone): when its album turns, and the 9 am a develop
 * defaults to, both read in the party's own zone (`zone.ts`), so the default develop and the turn are one morning.
 *
 * ★ THE TURN IS AN INSTANT BY THE TIME A BROWSER HOLDS IT. The page's server reads the party's zone and hands the page
 * the moment its album turns (`AlbumOpening.morningAfter`), never a zone: no reader's clock, geography or engine (an
 * older browser's database of zones, or one that cannot read the party's) moves it. The arithmetic stays album-order's
 * (`albumTurnAt`, called with the party's zone); this composes it.
 *
 * Pure and isomorphic.
 */
import { dayInZone } from "@/lib/dashboard/viewer-day";
import { defaultDevelopAt, developState } from "@/lib/disposable/reveal";
import { PARTY_ZONE_FALLBACK, partyZoneOf } from "@/lib/event/zone";
import { lastDayOf } from "@/lib/events/dates";
import {
  albumTurnAt,
  guestAlbumOrder,
  type AlbumSort,
  type AlbumTurnFacts,
} from "@/lib/shared/album-order";

/**
 * THE ORDER A GUEST ALBUM OPENS IN, AS THE PAGE'S SERVER HANDS IT: the album's own order at the render, her remembered
 * choice, and the instant its party's morning after begins. The page keeps it live from here (`useGuestAlbumOrder`).
 */
export type AlbumOpening = {
  /**
   * When the dated album turns (epoch ms): 9 am the morning after its LAST day in the party's zone, read once on the
   * server; null for an undated album, the demo, and behind a gate (where the order knows no days). A develop time,
   * live on the page, wins over it (`openingTurnAt`).
   */
  morningAfter: number | null;
  /** The album's own order at the render: the browser starts from it, so the hydration agrees. */
  own: AlbumSort;
  /** Her remembered choice on this album, or null: she follows the turn. */
  chosen: AlbumSort | null;
};

/**
 * THE FIRST PAINT'S ORDER, READ IN THE PARTY'S ZONE (the page's server, and See it as a guest's): album-order's own
 * answer (`guestAlbumOrder`: the develop wins, an undated album and the demo never turn) at `now`, beside the party's
 * morning after as an instant. `zone` is the party's stored zone (`events.time_zone`), null for none: the fallback is
 * `partyZoneOf`'s, said once.
 */
export function albumOpening(input: {
  facts: AlbumTurnFacts;
  zone: string | null;
  chosen: AlbumSort | null;
  isDemo?: boolean;
  now?: number;
}): AlbumOpening {
  const zone = partyZoneOf(input.zone);
  const { own, chosen } = guestAlbumOrder({ ...input, zone });
  return {
    morningAfter: input.isDemo
      ? null
      : albumTurnAt(
          {
            eventDate: input.facts.eventDate,
            eventEndDate: input.facts.eventEndDate,
          },
          zone,
        ),
    own,
    chosen,
  };
}

/**
 * WHEN THE ALBUM TURNS AS THE PAGE HOLDS IT: at its develop time where one is set (album-order's first rule, asked of the
 * develop alone, so no day and no zone is read), else at the party's morning after, the server's instant.
 */
export function openingTurnAt(
  morningAfter: number | null,
  developsAt: string | null | undefined,
): number | null {
  return (
    albumTurnAt({ eventDate: null, developsAt }, PARTY_ZONE_FALLBACK) ??
    morningAfter
  );
}

/**
 * 9 AM THE MORNING AFTER THE PARTY, IN ITS OWN ZONE: the day after its LAST day while that is still ahead (or today
 * there), else the day after today there. `defaultDevelopAt`'s rule (`lib/disposable/reveal.ts`, which reads the
 * browser's zone) read in the party's, and its 9 am is the turn's own (`albumTurnAt` of the base day), so a destination
 * wedding set up from home develops, and turns, in the party's morning.
 */
export function developDefaultIn(
  zone: string | null,
  input: {
    /** `events.event_date` (`YYYY-MM-DD`), or null: a range's first day. */
    eventDate: string | null;
    /** `events.event_end_date`, or null for one day; absent reads as one day. */
    eventEndDate?: string | null;
    nowMs?: number;
  },
): Date {
  const party = partyZoneOf(zone);
  const today = dayInZone(input.nowMs ?? Date.now(), party);
  const last = lastDayOf(input.eventDate, input.eventEndDate);
  const base = last !== null && last >= today ? last : today;
  // A calendar day always names a morning after (`albumTurnAt` answers null only for no day at all).
  return new Date(albumTurnAt({ eventDate: base }, party) ?? Date.now());
}

/**
 * THE DEVELOP TIME A DEVELOP KEEPS (Create's Disposable, Settings' styles and Customize): one still ahead, else the
 * party's own 9 am (`developDefaultIn`), or, where no zone can be named at all (`hostPartyZone`'s null), 9 am in the
 * browser's own clock (`defaultDevelopAt`, as before the party kept a zone). ★ `patchForStyle` (album-style.ts) keeps a
 * develop time still ahead and otherwise offers 9 am in the BROWSER's zone, so a caller hands it this as the time to
 * keep, and the morning offered is the party's: the same morning its album turns.
 */
export function developToKeep(
  developsAt: string | null,
  zone: string | null,
  input: {
    eventDate: string | null;
    eventEndDate?: string | null;
    nowMs?: number;
  },
): string {
  const nowMs = input.nowMs ?? Date.now();
  if (developsAt && developState(developsAt, nowMs).kind === "waiting") {
    return developsAt;
  }
  return (
    zone === null
      ? defaultDevelopAt({ ...input, now: new Date(nowMs) })
      : developDefaultIn(zone, { ...input, nowMs })
  ).toISOString();
}
