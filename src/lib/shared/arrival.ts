"use client";

/**
 * ONE ARRIVAL GRAMMAR, FOR BOTH SURFACES (Will, `landing=sweep`, 2026-09-21,
 * verbatim: "This should be consistent across guest and host arrival
 * experiences. Would feel weird for it to be handled differently on either.").
 *
 * Two marks, and the whole difference between them is WHOSE photograph it is:
 *
 *   `data-arrived`  a photograph appeared in the album by itself — somebody
 *                   else sent it, or the host approved one. A glow that fades.
 *   `data-landed`   the photograph YOU just sent, at the moment its bytes are
 *                   in. One pass of light, once, on the newest only.
 *
 * Neither is a state colour: the album's tiles are photographs on a dark page,
 * so white reads over every one of them, and a hue here would be a claim
 * (the media is the colour). The green check this replaced was a state on a
 * photograph for two and a half seconds with no exit at all.
 *
 * ★ THE TIMING TRAVELS WITH THE SHEET, AND ALWAYS WILL. Two things have to
 * agree about a mark and neither can see the other: the stylesheet that fades
 * the light (`components/shared/arrival.css`) and the state that holds the id
 * while it fades. Held too long, a tile keeps the attribute with nothing
 * painting under it, so the NEXT render replays the animation on a photograph
 * that landed minutes ago; held too short, the light is cut mid-fade. So the
 * numbers live HERE and the sheet reads them: the album box writes them out as
 * `--arrival-glow-ms` / `--arrival-sweep-ms` and each keyframe's duration is the
 * variable. One edit moves both, and there is no second copy to drift. This
 * module is `lib/guest/arrival-glow.ts` grown up: the guest's own file could not
 * be shared with the host, which is exactly the point of pulling it out.
 */
import { useEffect, useRef, useState } from "react";

/**
 * Two seconds for the glow: long enough for a guest whose eye is somewhere else
 * on a busy album to catch it, short enough that a lively party is not a page of
 * blinking rims. It sits deliberately outside the ~300ms interaction
 * ceiling, which governs a control answering a tap; this is an ambient mark on
 * content that arrived by itself.
 */
export const ARRIVAL_GLOW_MS = 2000;

/**
 * The sweep is an ANSWER, not atmosphere — the one beat the act the product
 * exists for finally gets — so it runs at the pace of a thing being handed
 * over rather than a light going out.
 */
export const ARRIVAL_SWEEP_MS = 900;

export type ArrivalMarks = {
  /** Ids that take the glow: everything that arrived by itself. */
  arrived: readonly string[];
  /** The one id that takes the sweep, or null. Never more than one. */
  landed: string | null;
};

/**
 * WHICH IDS GLOW AND WHICH ONE SWEEPS — the grammar, as arithmetic, so both
 * surfaces answer it identically and a test can read it without a browser.
 *
 * ★ YOUR OWN NEVER GLOWS, IT SWEEPS. A photograph you just added has already
 * had its beat; lighting it again as an arrival would say a stranger sent it.
 * The poll cannot tell the difference (a new row is a new row), so the
 * subtraction happens here, against the ids this device actually landed.
 *
 * ★ AND ONLY THE NEWEST SWEEPS. Will banked the shimmer in the first place
 * because "a couple dozen photos being uploaded in a single batch would cover
 * the top of a gallery in shimmer". One tile, once, is the delight moment he
 * banked it as; a batch of twelve is the thing he refused.
 */
export function arrivalMarks({
  arrivals,
  ownLandings,
}: {
  /** Every id that has appeared in the album by itself this session. */
  arrivals: readonly string[];
  /** Every id THIS device landed, newest first. */
  ownLandings: readonly string[];
}): ArrivalMarks {
  const own = new Set(ownLandings);
  return {
    arrived: arrivals.filter((id) => !own.has(id)),
    landed: ownLandings[0] ?? null,
  };
}

/**
 * THE HOLD: an id stays marked for `ms` and then stops, per id rather than one
 * timer for the batch — arrivals overlap, and two guests uploading a beat apart
 * must not have the second's light cut short by the first's clock.
 *
 * ★ AN ID IS LIT ONCE, EVER. The caller passes the ids it has seen arrive, and
 * passes them again on every render; without a ledger, a re-render for any
 * unrelated reason (a like, a tile-size change, a poll that changed nothing)
 * would restart every timer and replay light across an album that has been
 * still for minutes. That failure is why this hook exists rather than a
 * `useEffect` at each call site.
 *
 * ★ `exclusive` IS THE SWEEP'S RULE, AND IT WAS MEASURED. Overlapping holds are
 * right for the glow and wrong for the sweep: a batch lands faster than the
 * light runs, so two tiles carried `data-landed` at once on a twelve-file batch
 * during this lane's verification — the beginning of exactly what Will banked
 * the shimmer to avoid ("a couple dozen photos being uploaded in a single batch
 * would cover the top of a gallery in shimmer"). Exclusive, a newer landing ENDS
 * the older one's light, so "only the newest" means only.
 */
export function useArrivalMarks(
  ids: readonly string[],
  ms: number,
  exclusive = false,
): ReadonlySet<string> {
  const [live, setLive] = useState<ReadonlySet<string>>(() => new Set());
  const seen = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const fresh = ids.filter((id) => !seen.current.has(id));
    if (fresh.length === 0) return;
    for (const id of fresh) seen.current.add(id);
    setLive((prev) => {
      const next = exclusive ? new Set<string>() : new Set(prev);
      for (const id of fresh) next.add(id);
      return next;
    });
    const map = timers.current;
    if (exclusive) {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    }
    for (const id of fresh) {
      map.set(
        id,
        setTimeout(() => {
          map.delete(id);
          setLive((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, ms),
      );
    }
  }, [ids, ms, exclusive]);

  // Every pending timer dies with the surface: a callback firing into an
  // unmounted tree is the one way this can warn in a console nobody reads.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  return live;
}
