/**
 * THE YOURS FILTER, AS ARITHMETIC. A guest's own tiles wear a mark, and a tap on
 * the mark is the same filter as the View menu's Yours.
 *
 * ★ IT IS PURE SO THE ONE RULE THAT MATTERS CAN BE PINNED: the filter cannot be
 * LIVE with nothing to show. A guest turns it on by tapping one of their own
 * tiles, then removes that photograph for ever — and an album that answered
 * "Showing yours" over an empty grid would be a dead end whose only exit is a
 * link the guest has to notice. So `on` is derived, never trusted: the caller's
 * intent AND at least one photograph of theirs in the list.
 *
 * ★ AND THE COUNT IS OF THE WHOLE ALBUM, ALWAYS, not of what is on screen. The
 * line above the album says how many are yours while it is showing you exactly
 * those, so counting the filtered list would be counting its own output. On the
 * paged album the list is the MANIFEST's (every photograph, whether its link has
 * landed or not), so the own ids are intersected with the whole album, never
 * with the window a reader happens to have mounted.
 */
export type YoursView<T> = {
  /** What the album draws: this guest's own, or everything. */
  items: T[];
  /** Whether the filter is actually live (intent AND something to show). */
  on: boolean;
  /** How many of the WHOLE list are this guest's own. */
  count: number;
};

export function yoursView<T extends { id: string }>(
  items: readonly T[],
  ownIds: ReadonlySet<string>,
  intent: boolean,
): YoursView<T> {
  // One pass, and the same pass answers both questions when the filter is live.
  const mine = ownIds.size > 0 ? items.filter((m) => ownIds.has(m.id)) : [];
  const on = intent && mine.length > 0;
  return { items: on ? mine : [...items], on, count: mine.length };
}
