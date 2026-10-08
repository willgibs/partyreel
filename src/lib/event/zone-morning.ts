/**
 * THE DEVELOP TIME A DEVELOP KEEPS, IN THE PARTY'S MORNING (event-zone): what Settings' "At a develop time" writes when
 * she chooses it (`camera-settings.tsx`'s `patchFor`). The party's 9 am itself is `defaultDevelopAt`'s, which takes the
 * party's zone directly (`lib/disposable/reveal.ts`), and the styles' own offer is `patchForStyle`'s, which takes the
 * zone itself, so a develop is one morning however she reaches it, read by one arithmetic (`wall-time.ts`). The album's
 * order never reads it: the album turns at her close or at the develop itself (album-order, AY1).
 *
 * Pure and isomorphic.
 */
import { defaultDevelopAt, developState } from "@/lib/disposable/reveal";
import { PARTY_ZONE_FALLBACK } from "@/lib/event/zone";

/**
 * THE DEVELOP TIME A DEVELOP KEEPS: one still ahead, else the party's own 9 am the morning after (`defaultDevelopAt`
 * read in `zone`), or, where no zone can be named at all (`hostPartyZone`'s null), 9 am in the browser's own clock.
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
