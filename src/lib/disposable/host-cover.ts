/**
 * THE HOST'S COVER, AS DATA (the-wait r1, Will's `cover=guests`: "continues the guest experience into a similar host
 * experience for a cohesive idea, and feels the most 'disposable' plus develop"). Until her album develops, Maya's hub
 * draws what her guests see: the very contact sheet they meet, counted from her own manifest, and her hub's photographs
 * held to what they can see; Look lifts it for the visit, and Cover it puts it back (`event-gallery.tsx`).
 *
 * ★ HER MANIFEST IS THE HOST'S WHOLE ALBUM (she is exempt from the seal), so what waits is read off it by the develop's
 * own period: a row her guests cannot see yet is held (`pending`), or approved since `events.sealed_from` (the moment a
 * develop time came ahead, `events_reveal_stamp`), while that develop is still ahead. Every row created in a period is
 * sealed by `create_media*`, so the period's start is the seal's own line. (A camera turned on after a develop time was
 * already set restamps the period for its roll; the shots between are sealed but read here as seen. Rare, and only her
 * cover's count can under-read for it; the guests' own sheet counts the seal itself.)
 *
 * Pure and isomorphic.
 */
import type { WaitingMinute } from "@/lib/disposable/facts";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  type ManifestEntry,
  timestampToMicros,
} from "@/lib/events/album-wire";

/** The event's develop facts, as the hub's page reads them off the row (`HostEvent`). */
export type HubDevelopFacts = {
  develops_at: string | null;
  sealed_from: string | null;
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
 * Whether one of her entries waits, as her guests' sheet counts it: held, or approved since the develop's period began.
 * A hidden one is nobody's to see, so it is never counted. With no period to read, everything she has waits: nothing is
 * shown that might be sealed.
 */
export function entryWaits(
  e: ManifestEntry,
  sealedFrom: string | null,
): boolean {
  const flags = e[3];
  if (flags & ENTRY_HIDDEN) return false;
  if (flags & ENTRY_PENDING) return true;
  const start = periodStart(sealedFrom);
  return start === null || e[4] >= start;
}

/** What waits, as her guests' sheet counts it (numbers, by minute, oldest first), and the ids of it, newest first. */
export function coverWaitingOf(
  entries: readonly ManifestEntry[],
  develop: HubDevelopFacts,
): { count: number; minutes: WaitingMinute[]; ids: string[] } {
  const ids: string[] = [];
  const byMinute = new Map<number, number>();
  for (const e of entries) {
    if (!entryWaits(e, develop.sealed_from)) continue;
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
