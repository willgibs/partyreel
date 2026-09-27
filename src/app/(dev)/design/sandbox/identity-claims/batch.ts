import { WAITING, type WaitingEvent } from "./fixtures";

/**
 * THE REVIEW AS A MACHINE: ONE PURE REDUCER EVERY FRAME IS PLAYED ON.
 *
 * Round two asks three things about one flow (when a choice is saved, where a
 * deletion's dialog sits, what a claimed event offers), and each option is a
 * mode of the same review rather than a separate drawing. So no frame is a
 * hand-built picture of a state: every frame is this reducer played from an
 * empty review by a short script (`play`), and stays live afterwards, so a
 * press inside a frame moves it the way the mode says. A state the machine
 * cannot reach is a state no tile can show.
 *
 * ★ WHAT THE MODES MEAN, AGAINST PRODUCTION. `ClaimsCard` today keeps every
 * choice in local state and writes them all at Finish (`finishClaimsAction`:
 * `claim_guest_rows_by_email`, then `disown_guest_rows_by_email` for the rest),
 * behind one dialog for the leftovers. That is `save: "finish"` with
 * `confirm: "end"`. `save: "once"` calls the same two RPCs with ONE event id
 * each, as she decides (both already take an id list, so no SQL changes);
 * `confirm: "card"` moves the dialog to the Not mine that asked for it.
 *
 * ★ ONLY A WRITTEN CHOICE LEAVES THE BANNER. A choice held for Finish lives in
 * the page, so closing the review keeps it while the page is open and nothing
 * reaches her account; a written one is done for good (a claim has no undo RPC,
 * a disown detaches the address). And an event she never reaches is never
 * deleted: only a Not mine deletes, where today's Finish read "untouched" as
 * "not mine".
 */

export type Save = "finish" | "once";
export type Confirm = "card" | "end";
export type Next = "album" | "host" | "both";
export type Mode = { save: Save; confirm: Confirm; next: Next };
export type Choice = "claim" | "disown";

export type Batch = {
  /** Every decided event, written or not. */
  choices: Readonly<Record<string, Choice>>;
  /** The decided events already written to her account. */
  saved: Readonly<Record<string, true>>;
  dialog: null | { kind: "card"; eventId: string } | { kind: "end" };
  /** The review's sheet is open over the page. */
  open: boolean;
  /** Photos this opening of the review added, counted by the toast on close. */
  added: number;
  /** The finish toast's count, once the review closes having added some. */
  toast: number | null;
};

export type Action =
  | { type: "claim" }
  | { type: "not-mine" }
  | { type: "delete" }
  | { type: "go-back" }
  | { type: "undo"; eventId: string }
  | { type: "finish" }
  | { type: "close" }
  | { type: "open" };

/** A scripted press: an action, or `rest` (decide every card left the way her
 *  memory would, saying Delete to any dialog a card raises) and `done` (the
 *  rest, then Finish and its dialog, until everything is written). */
export type Step = Exclude<Action["type"], "undo"> | "rest" | "done";

export const EMPTY: Batch = {
  choices: {},
  saved: {},
  dialog: null,
  open: true,
  added: 0,
  toast: null,
};

/** The card on top: the first event not yet decided, or the end. */
export function topOf(b: Batch, rows: readonly WaitingEvent[] = WAITING) {
  const i = rows.findIndex((r) => !b.choices[r.eventId]);
  return i < 0 ? rows.length : i;
}

/** Every event decided and written: the review has nothing left to do. */
export function isDone(b: Batch, rows: readonly WaitingEvent[] = WAITING) {
  return rows.every((r) => b.choices[r.eventId] && b.saved[r.eventId]);
}

/** Write every held choice (Finish, or the end's dialog saying Delete). */
function commit(b: Batch, rows: readonly WaitingEvent[]): Batch {
  const saved: Record<string, true> = { ...b.saved };
  let added = b.added;
  for (const r of rows) {
    const c = b.choices[r.eventId];
    if (!c || saved[r.eventId]) continue;
    saved[r.eventId] = true;
    if (c === "claim") added += r.uploadCount;
  }
  return { ...b, saved, added };
}

export function reduce(
  mode: Mode,
  b: Batch,
  a: Action,
  rows: readonly WaitingEvent[] = WAITING,
): Batch {
  const top = rows[topOf(b, rows)];
  switch (a.type) {
    case "claim": {
      if (!top || b.dialog) return b;
      const choices = { ...b.choices, [top.eventId]: "claim" as const };
      if (mode.save === "finish") return { ...b, choices };
      return {
        ...b,
        choices,
        saved: { ...b.saved, [top.eventId]: true },
        added: b.added + top.uploadCount,
      };
    }
    case "not-mine": {
      if (!top || b.dialog) return b;
      if (mode.confirm === "card")
        return { ...b, dialog: { kind: "card", eventId: top.eventId } };
      return { ...b, choices: { ...b.choices, [top.eventId]: "disown" } };
    }
    case "delete": {
      if (!b.dialog) return b;
      if (b.dialog.kind === "end") return { ...commit(b, rows), dialog: null };
      const id = b.dialog.eventId;
      return {
        ...b,
        choices: { ...b.choices, [id]: "disown" },
        // Held for Finish, the confirmed Not mine still waits to be written.
        saved: mode.save === "once" ? { ...b.saved, [id]: true } : b.saved,
        dialog: null,
      };
    }
    case "go-back":
      return { ...b, dialog: null };
    case "undo": {
      if (b.saved[a.eventId] || !b.choices[a.eventId]) return b;
      const choices = { ...b.choices };
      delete choices[a.eventId];
      return { ...b, choices };
    }
    case "finish": {
      if (topOf(b, rows) < rows.length || b.dialog) return b;
      const deleting = rows.some(
        (r) => b.choices[r.eventId] === "disown" && !b.saved[r.eventId],
      );
      if (mode.confirm === "end" && deleting)
        return { ...b, dialog: { kind: "end" } };
      return commit(b, rows);
    }
    case "close":
      return {
        ...b,
        open: false,
        dialog: null,
        toast: b.added > 0 ? b.added : null,
        added: 0,
      };
    case "open":
      return { ...b, open: true, toast: null };
  }
}

/** Plays a script from an empty review (or a closed one) and returns where it lands. */
export function play(
  mode: Mode,
  script: readonly Step[],
  {
    open = true,
    rows = WAITING,
  }: { open?: boolean; rows?: readonly WaitingEvent[] } = {},
): Batch {
  let b: Batch = { ...EMPTY, open };
  const act = (a: Action) => {
    b = reduce(mode, b, a, rows);
  };
  const rest = () => {
    // Bounded: each pass decides one card, and a card that raised a dialog is
    // decided by the Delete that follows it.
    for (let guard = 0; guard < rows.length * 2; guard++) {
      const top = rows[topOf(b, rows)];
      if (!top) return;
      act({ type: top.hers ? "claim" : "not-mine" });
      if (b.dialog) act({ type: "delete" });
    }
  };
  for (const step of script) {
    if (step === "rest") rest();
    else if (step === "done") {
      rest();
      if (!isDone(b, rows)) act({ type: "finish" });
      if (b.dialog) act({ type: "delete" });
    } else act({ type: step });
  }
  return b;
}

/** Photos across a set of events, for every sentence that counts them. */
export const photosIn = (list: readonly WaitingEvent[]) =>
  list.reduce((n, r) => n + r.uploadCount, 0);

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * THE BANNER'S ONE LINE (`ticket=banner`, settled): what is still unwritten,
 * or, while choices wait for Finish, that they are waiting. Null once every
 * event is written: the banner goes, and the page's invitation takes its place.
 */
export function bannerOf(
  mode: Mode,
  b: Batch,
  rows: readonly WaitingEvent[] = WAITING,
): { words: string; action: string } | null {
  const waiting = rows.filter((r) => !b.saved[r.eventId]);
  if (waiting.length === 0) return null;
  const decided = Object.keys(b.choices).length;
  if (mode.save === "finish" && decided > 0) {
    return {
      words: `${decided} of ${rows.length} decided, nothing saved yet`,
      action: "Continue",
    };
  }
  const photos = photosIn(waiting);
  const still = waiting.length < rows.length ? "still " : "";
  return {
    words: `${plural(photos, "photo", "photos")} from ${plural(waiting.length, "event", "events")} ${photos === 1 ? "is" : "are"} ${still}waiting for you`,
    action: "Review",
  };
}

/** The events her account now holds from this review, in the RPC's order. */
export function claimedOf(b: Batch, rows: readonly WaitingEvent[] = WAITING) {
  return rows.filter(
    (r) => b.choices[r.eventId] === "claim" && b.saved[r.eventId],
  );
}
