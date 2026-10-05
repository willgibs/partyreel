/**
 * THE HUB'S ROLL, AS DATA (crumbs-73, the-wait's carried `hub`): what her first open after the develop develops. The
 * guests' develop reads its roll off the manifest as it stands once the album has developed (`rollOfEntries`: the
 * entries created at or before the develop time, after the mark's), so the hub reads the same roll off her own
 * manifest, and the two sides' sheets count the same photographs.
 *
 * ★ HER MANIFEST IS HER WHOLE ALBUM, so what the guests never had is taken out first: a hidden photograph is nobody's
 * to see and a held one has not been let in (`entryWaits` says the same of the cover's count), neither of them
 * developed. Nothing else differs from the guests' read, which is the point: `rollOfEntries`'s own note (an album
 * turned disposable mid-party also develops what showed before the switch) holds on both sides, and the one fix that
 * ends it, the period's start in the guest's read, ends it here too (ROADMAP).
 *
 * Pure and isomorphic.
 */
import { rollOfEntries } from "@/lib/disposable/contact-sheet-develop";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_VIDEO,
  type ManifestEntry,
} from "@/lib/events/album-wire";

/** The ids (newest first, the manifest's order) of the photographs her develop develops, or none. */
export function hubRollOf(
  entries: readonly ManifestEntry[],
  developsAtMs: number,
  sinceMs: number | null,
): string[] {
  return rollOfEntries(
    entries.filter((e) => (e[3] & (ENTRY_HIDDEN | ENTRY_PENDING)) === 0),
    developsAtMs,
    sinceMs,
  );
}

/** The ids of the roll's videos, whose square draws their poster and wears the play mark. */
export function videoIdsOf(
  entries: readonly ManifestEntry[],
  roll: readonly string[],
): ReadonlySet<string> {
  const inRoll = new Set(roll);
  const videos = new Set<string>();
  for (const e of entries)
    if (inRoll.has(e[0]) && e[3] & ENTRY_VIDEO) videos.add(e[0]);
  return videos;
}
