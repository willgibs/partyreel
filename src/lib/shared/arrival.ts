"use client";

/**
 * ONE ARRIVAL GRAMMAR, FOR BOTH SURFACES (Will, `landing=sweep`, 2026-09-21,
 * verbatim: "This should be consistent across guest and host arrival
 * experiences. Would feel weird for it to be handled differently on either.").
 *
 * ONE LIGHT, FOR EVERY PHOTOGRAPH NEW TO THE ALBUM (guest-moments r1, Will's
 * `own=glow`): `data-arrived`, a rim and a wash that fade, on whatever was not
 * on screen a moment ago: somebody else's upload, a held one the host approved,
 * a burst after a hidden tab wakes, and her own photograph landing on her own
 * phone, as it lands on the host's. What still tells hers from theirs is only
 * WHEN each may stand (`arrivalMarks`): an arrival waits at the album's door
 * until its photograph is drawn (`use-arrival-gate.ts`), while hers is drawn
 * already (the very file she sent), so it stands and glows at once.
 *
 * ★ THE SWEEP RETIRED, AND ITS REASON WITH IT. Her newest own photograph took a
 * pass of light of its own (`data-landed`, 0.9 s) so "yours is in" read apart
 * from "somebody added one". Will, choosing the glow over it on the board that
 * drew both: "I'm not sure we need to mark guest uploads to avoid crowding
 * gallery view, and marking the first specifically makes it easy to get lost in
 * the gallery when more uploads follow." What tells her a send is in is the
 * send's toast now (`guest/upload/send-toast.ts`), once its last photograph has
 * landed, with a press that shows hers.
 *
 * It is not a state colour: the album's tiles are photographs on a dark page,
 * so white reads over every one of them, and a hue here would be a claim (the
 * media is the colour). The green check this replaced was a state on a
 * photograph for two and a half seconds with no exit at all.
 *
 * ★ THE TIMING TRAVELS WITH THE SHEET, AND ALWAYS WILL. Two things have to
 * agree about a mark and neither can see the other: the stylesheet that fades
 * the light (`components/shared/arrival.css`) and the state that holds the id
 * while it fades. Held too long, a tile keeps the attribute with nothing
 * painting under it, so the NEXT render replays the animation on a photograph
 * that landed minutes ago; held too short, the light is cut mid-fade. So the
 * numbers live HERE and the sheet reads them: the album box writes them out as
 * `--arrival-glow-ms` / `--arrival-glide-ms` and each duration is the variable.
 * One edit moves both, and there is no second copy to drift. This module is
 * `lib/guest/arrival-glow.ts` grown up: the guest's own file could not be shared
 * with the host, which is exactly the point of pulling it out.
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
 * THE GLIDE: how long the rows an arrival reflows take to reach their new
 * places in a justified album (`AlbumRows`), and how long a step change takes
 * to re-lay the photographs a reader can see. Ambient like the glow, so it is
 * allowed past the 300ms a control's answer gets, but it is the album MOVING,
 * so it stays well under the glow: long enough for the eye to follow a
 * photograph to its new row, short enough to be over before a thumb comes
 * back. The newcomer itself never moves (`batch=settle`: it stands whole in its
 * place while its neighbours glide out of it). The album box reads
 * `--arrival-glide-ms` first (the tuner, a lab option), so this is the default,
 * not a second copy.
 */
export const ARRIVAL_GLIDE_MS = 450;

export type ArrivalMarks = {
  /**
   * What appeared by itself (anyone else's, or one of hers the host let in later): each waits at the
   * album's door until its photograph is drawn, then stands and glows.
   */
  arrived: readonly string[];
  /** What THIS device landed this visit, newest first: drawn already, so each stands and glows at once. */
  own: readonly string[];
};

/**
 * WHICH IDS WAIT AT THE DOOR AND WHICH STAND AT ONCE — the grammar, as arithmetic, so both surfaces answer it
 * identically and a test can read it without a browser. Both take the one light.
 *
 * ★ HER OWN NEVER WAITS AT THE DOOR. The poll cannot tell hers from anyone's (a new row is a new row), so it hands
 * her landing in as an arrival too, a beat after her own tile already stood in the rows (the optimistic tile, her
 * very file). Held at the door like a stranger's, her photograph would vanish from the rows for the length of the
 * hold. So the subtraction happens here, against the ids this device actually landed, and the gate lights hers the
 * moment it stands (`useArrivalGate`'s `own`). A batch of hers lights whole, as anyone's does: one light for every
 * photograph new to the album.
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
    own: ownLandings,
  };
}

/**
 * THE GRAMMAR'S FIRST SENTENCE, IN ONE PLACE: what arrived is an id in this render that was not in the last.
 *
 * Both albums read it (`HostMediaGrid`'s `useAlbumArrivals` over its own state, the guest's `newArrivalIds` over
 * its snapshots), so what "new" means cannot drift between them; it had (the guest's answered nothing for an
 * empty first snapshot, the host's did not) while it was written twice. It is the diff and nothing else:
 *
 * ★ THE SEED IS THE CALLER'S. "The first render marks nothing" is a fact about what a surface hands in as its
 * last render, never about this function: the host seeds `prev` from its first render (an empty album's first
 * photograph then does arrive), and the guest's snapshot is empty BY DESIGN at a teaser and a locked page, so
 * its reader says so where it calls this (`newArrivalIds`). Handed an empty `prev`, everything is new.
 *
 * ★ IDS, NEVER ITEMS. A link re-minted at the hour or a reorder changes an item and not its id, so neither can
 * look like an arrival; callers hand ids, and a caller holding the set it already built passes it as it is.
 */
export function newIds(
  prev: Iterable<string>,
  next: Iterable<string>,
): Set<string> {
  const before: ReadonlySet<string> =
    prev instanceof Set ? prev : new Set(prev);
  const fresh = new Set<string>();
  for (const id of next) if (!before.has(id)) fresh.add(id);
  return fresh;
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
 */
export function useArrivalMarks(
  ids: readonly string[],
  ms: number,
): ReadonlySet<string> {
  const [live, setLive] = useState<ReadonlySet<string>>(() => new Set());
  const seen = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const fresh = ids.filter((id) => !seen.current.has(id));
    if (fresh.length === 0) return;
    for (const id of fresh) seen.current.add(id);
    setLive((prev) => {
      const next = new Set(prev);
      for (const id of fresh) next.add(id);
      return next;
    });
    const map = timers.current;
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
  }, [ids, ms]);

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
