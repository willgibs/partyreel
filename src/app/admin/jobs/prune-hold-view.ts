/**
 * WHAT THE BACKUP PRUNE'S CARD SAYS OF A HOLD, decided from what the app can read: the prune's last report (its
 * `counts`, as the Worker sent them) and the last release pressed (`prune-hold.ts`). The Worker reports a standing
 * hold on every run while it stands (`held_since`, exact, and `held_media`), held, aborted or dry alike, so the card
 * judges a release exactly as the Worker's `decideHold` does: it counts only when pressed after the hold began. A hold
 * with no such release offers Release the hold; a released one says the next run goes ahead. PURE, under test.
 */
export type PruneHoldView =
  | {
      kind: "held";
      heldSinceMs: number;
      /** Items the hold kept, backup keys the held run counted for them, and the line it holds past. */
      heldMedia: number | null;
      heldKeys: number | null;
      threshold: number | null;
    }
  | { kind: "released"; releasedAtMs: number }
  | null;

export function pruneHoldView(input: {
  counts: unknown;
  releasedAtMs: number | null;
}): PruneHoldView {
  const { counts, releasedAtMs } = input;
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const c = counts as Record<string, unknown>;
  const heldSinceMs =
    typeof c.held_since === "string" ? Date.parse(c.held_since) : Number.NaN;
  if (!Number.isFinite(heldSinceMs)) return null;
  if (releasedAtMs !== null && releasedAtMs > heldSinceMs) {
    return { kind: "released", releasedAtMs };
  }
  return {
    kind: "held",
    heldSinceMs,
    heldMedia: countOf(c.held_media) ?? countOf(c.gone_media),
    heldKeys: countOf(c.remaining),
    threshold: countOf(c.hold_threshold),
  };
}

/** A count it can read, or null: a missing number is unknown, never a zero. */
function countOf(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}
