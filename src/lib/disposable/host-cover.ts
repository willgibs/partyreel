/**
 * THE HOST'S COVER, AS DATA (the-wait r1, Will's `cover=guests`: "continues the guest experience into a similar host
 * experience for a cohesive idea, and feels the most 'disposable' plus develop"). Until her album develops, Maya's hub
 * draws what her guests see: the very contact sheet they meet, counted from her own manifest, and her hub's photographs
 * held to what they can see; Look lifts it for the visit, and Cover it puts it back (`event-gallery.tsx`).
 *
 * ★ HER MANIFEST IS THE HOST'S WHOLE ALBUM (she is exempt from the seal, and her scope never sees it), so what waits is
 * read off it by the develop's own period: a row her guests cannot see yet is held (`pending`), or approved since
 * `events.sealed_from` (the moment a develop time came ahead, `events_reveal_stamp`), while that develop is still ahead.
 * Every row created in a period is sealed by `create_media*`, so the period's start is the seal's own line.
 *
 * ★ A ROW WAITS BY ITS SEAL, AND THE PERIOD IS ONLY ITS FLOOR (red-team 46's MEDIUM). The one kind of row sealed from
 * before the period is the one the switch itself seals: an album going from approving each to a develop time approves
 * its held photographs and seals them with it ("join the roll"), after they were created, so by the period they read as
 * seen (her cover said "0 developing" over the 195 her guests read, and her head wore six of them). A camera turned on
 * after a develop time was already set restamps the period the same way. The page reads those rows off the rows
 * themselves, approved and sealed yet created before the period (`host-cover.server.ts`), and hands their ids down with
 * the develop facts (`joined`); the manifest cannot say it.
 *
 * Pure and isomorphic.
 */
import type { WaitingMinute } from "@/lib/disposable/facts";
import { farZone } from "@/lib/event/zone";
import { zoneWhen } from "@/lib/event/zone-words";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  type ManifestEntry,
  timestampToMicros,
} from "@/lib/events/album-wire";
import { developsWhen } from "@/lib/guest/camera/words";

/** The event's develop facts, as the hub's page reads them off the row (`HostEvent`) and the rows beside it. */
export type HubDevelopFacts = {
  develops_at: string | null;
  sealed_from: string | null;
  /**
   * The ids of the approved rows sealed for the develop that were created BEFORE `sealed_from`: the held photographs a
   * switch put in the roll (`host-cover.server.ts` reads them with the page). Absent reads as none.
   */
  joined?: readonly string[];
  /**
   * The party's zone (`events.time_zone`), for words only: where it is not her own, the develop time is said on the
   * party's clock with its place named, as Settings says it (`zoneWhen`, red-team 56's NIT). Absent: her own clock.
   */
  time_zone?: string | null;
};

/** Whether the hub's album is covered: a develop time still ahead (of `nowMs`, now unless told). */
export function hubCovered(
  develop: HubDevelopFacts | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!develop?.develops_at) return false;
  const at = Date.parse(develop.develops_at);
  return Number.isFinite(at) && at > nowMs;
}

/** `sealed_from` in microseconds (the manifest's own clock), or null for none or one it cannot read. */
function periodStart(sealedFrom: string | null): number | null {
  if (!sealedFrom) return null;
  try {
    return timestampToMicros(sealedFrom);
  } catch {
    return null;
  }
}

/**
 * Whether one of her entries waits, as her guests' sheet counts it: held, in the roll a switch made (`joined`), or
 * approved since the develop's period began. A hidden one is nobody's to see, so it is never counted. With no period to
 * read, everything she has waits: nothing is shown that might be sealed.
 */
export function entryWaits(
  e: ManifestEntry,
  sealedFrom: string | null,
  joined?: ReadonlySet<string> | null,
): boolean {
  const flags = e[3];
  if (flags & ENTRY_HIDDEN) return false;
  if (flags & ENTRY_PENDING) return true;
  if (joined?.has(e[0])) return true;
  const start = periodStart(sealedFrom);
  return start === null || e[4] >= start;
}

/**
 * `entryWaits` for one set of develop facts, their roll read once: the test her cover's count and her head's
 * photographs both hold her manifest to, so the two never disagree about what her guests cannot see.
 */
export function waitsOf(
  develop: Pick<HubDevelopFacts, "sealed_from" | "joined"> | null | undefined,
): (e: ManifestEntry) => boolean {
  const sealedFrom = develop?.sealed_from ?? null;
  const joined = develop?.joined?.length ? new Set(develop.joined) : null;
  return (e) => entryWaits(e, sealedFrom, joined);
}

/** What waits, as her guests' sheet counts it (numbers, by minute, oldest first), and the ids of it, newest first. */
export function coverWaitingOf(
  entries: readonly ManifestEntry[],
  develop: HubDevelopFacts,
): { count: number; minutes: WaitingMinute[]; ids: string[] } {
  const ids: string[] = [];
  const byMinute = new Map<number, number>();
  const waits = waitsOf(develop);
  for (const e of entries) {
    if (!waits(e)) continue;
    ids.push(e[0]);
    const ms = Math.floor(e[4] / 1000);
    const minute = ms - (((ms % 60_000) + 60_000) % 60_000);
    byMinute.set(minute, (byMinute.get(minute) ?? 0) + 1);
  }
  const minutes = [...byMinute.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([at, n]) => [at, n] as const);
  return { count: ids.length, minutes, ids };
}

/**
 * WHEN HER ALBUM DEVELOPS, AS HER HUB SAYS IT: her own clock ("tomorrow at 9 am"), or, for a party far from home, the
 * party's with its place named ("Sun, Oct 4 at 9 am in Makassar"), as Settings says it (`zoneWhen`, red-team 56's NIT).
 * A browser's answer (`farZone`), so said once hydrated, as the clock already is.
 */
export function hubDevelopWhen(
  developsAt: string,
  nowMs: number,
  zone: string | null | undefined,
): string {
  const far = farZone(zone);
  return far ? zoneWhen(developsAt, far) : developsWhen(developsAt, nowMs);
}
