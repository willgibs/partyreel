/**
 * THE DEVELOP TIME A DEVELOP KEEPS, IN THE PARTY'S MORNING (event-zone): the one composition Create's Disposable and
 * Settings' styles hand `patchForStyle` today. The party's 9 am itself is `defaultDevelopAt`'s, which takes the party's
 * zone directly (`lib/disposable/reveal.ts`), and the album's turn is album-order's (`guestAlbumOrder`, the instant its
 * morning after begins), so the default develop and the turn are one morning, read by one arithmetic (`wall-time.ts`).
 *
 * Pure and isomorphic.
 */
import { defaultDevelopAt, developState } from "@/lib/disposable/reveal";
import { PARTY_ZONE_FALLBACK } from "@/lib/event/zone";

/**
 * THE DEVELOP TIME A DEVELOP KEEPS: one still ahead, else the party's own 9 am the morning after (`defaultDevelopAt`
 * read in `zone`), or, where no zone can be named at all (`hostPartyZone`'s null), 9 am in the browser's own clock.
 * ★ `patchForStyle` now takes the zone itself (`{ zone }`) and offers the same morning, so a caller that hands it this
 * as the time to keep reads the same answer twice; the two callers (Create's add step, Settings' camera) retire the
 * seeding when their files next move (crumbs-85's Deferred line).
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
  return defaultDevelopAt({
    eventDate: input.eventDate,
    eventEndDate: input.eventEndDate,
    now: new Date(nowMs),
    zone,
  }).toISOString();
}

/**
 * 9 AM THE MORNING AFTER THE PARTY, IN ITS OWN ZONE (an unreadable or missing zone is UTC): `defaultDevelopAt` read in
 * the party's zone. Kept for Create's test, which pins Create's offer against it; the one rule is `defaultDevelopAt`'s.
 */
export function developDefaultIn(
  zone: string | null,
  input: {
    eventDate: string | null;
    eventEndDate?: string | null;
    nowMs?: number;
  },
): Date {
  return defaultDevelopAt({
    eventDate: input.eventDate,
    eventEndDate: input.eventEndDate,
    now: new Date(input.nowMs ?? Date.now()),
    zone: zone ?? PARTY_ZONE_FALLBACK,
  });
}
