import { WAITING, type WaitingEvent } from "./fixtures";

/**
 * THE REVIEW AS A MACHINE: ONE PURE REDUCER EVERY FRAME IS PLAYED ON.
 *
 * Round two asked what makes the batch a good one and his answers settled it
 * (docs/reviews/identity-claims.json, r2): `save=once` (a decision is written
 * the moment she makes it), `confirm=card` (a Not mine asks its dialog at its
 * own card) and `next=both` (a claimed row offers Open album with a quieter
 * Follow). So the machine has ONE mode now, the one he picked, and the modes
 * round two compared left with their asks: round three asks only where she
 * first meets this review, and every frame wears it as ground.
 *
 * No frame is a hand-built picture of a state: every frame is this reducer
 * played from an empty review by a short script (`play`), and stays live, so a
 * press inside a frame moves it the way the product would. A state the machine
 * cannot reach is a state no tile can show.
 *
 * ★ WHAT IT MEANS AGAINST PRODUCTION. `ClaimsCard` today holds every choice and
 * writes them at Finish (`finishClaimsAction`). This is the same two RPCs called
 * with ONE event id each as she decides (`claim_guest_rows_by_email`, then
 * `disown_guest_rows_by_email` once the card's dialog says Delete); both
 * already take an id list, so no SQL changes. A written choice is done for good
 * (a claim has no undo RPC; a disown detaches the address), and an event she
 * never reaches is never deleted: only a Not mine deletes.
 */

export type Choice = "claim" | "disown";

export type Batch = {
  /** Every event she has decided, each written the moment she did. */
  decided: Readonly<Record<string, Choice>>;
  /** The card whose Not mine is asking its dialog (`confirm=card`). */
  asking: string | null;
  /** The review is open over the page. */
  open: boolean;
  /** Photos this opening of the review added, counted by the toast on close. */
  added: number;
  /** The toast's count, once the review closes having added some. */
  toast: number | null;
};

/**
 * ★ AN ANSWER NAMES ITS CARD. Claim and Not mine carry the event they were
 * pressed on, and the reducer drops one that no longer names the card on top:
 * a double tap on Claim otherwise claims the next event as well (the second
 * tap's dispatch reads whatever card is on top by then), which a machine that
 * writes every decision the moment it is made cannot take back. It is also
 * the shipped call's shape: `claim_guest_rows_by_email` takes the one id.
 */
export type Action =
  | { type: "claim"; eventId: string }
  | { type: "not-mine"; eventId: string }
  | { type: "delete" }
  | { type: "go-back" }
  | { type: "close" }
  | { type: "open" };

/** A scripted press: an action on whatever card is on top, or `rest` (decide
 *  every card left the way her memory would, saying Delete to each dialog a
 *  card raises). */
export type Step = Action["type"] | "rest";

export const EMPTY: Batch = {
  decided: {},
  asking: null,
  open: false,
  added: 0,
  toast: null,
};

/** The card on top: the first event not yet decided, or the end. */
export function topOf(b: Batch, rows: readonly WaitingEvent[] = WAITING) {
  const i = rows.findIndex((r) => !b.decided[r.eventId]);
  return i < 0 ? rows.length : i;
}

/** The events still waiting under her email: nothing decided about them. */
export function waitingOf(b: Batch, rows: readonly WaitingEvent[] = WAITING) {
  return rows.filter((r) => !b.decided[r.eventId]);
}

/** Every event decided: the review has nothing left to do. */
export function isDone(b: Batch, rows: readonly WaitingEvent[] = WAITING) {
  return waitingOf(b, rows).length === 0;
}

/** The events her account now holds from this review, in the RPC's order. */
export function claimedOf(b: Batch, rows: readonly WaitingEvent[] = WAITING) {
  return rows.filter((r) => b.decided[r.eventId] === "claim");
}

export function reduce(
  b: Batch,
  a: Action,
  rows: readonly WaitingEvent[] = WAITING,
): Batch {
  const top = rows[topOf(b, rows)];
  switch (a.type) {
    case "claim":
      if (!top || b.asking || a.eventId !== top.eventId) return b;
      return {
        ...b,
        decided: { ...b.decided, [top.eventId]: "claim" },
        added: b.added + top.uploadCount,
      };
    case "not-mine":
      if (!top || b.asking || a.eventId !== top.eventId) return b;
      return { ...b, asking: top.eventId };
    case "delete":
      if (!b.asking) return b;
      return {
        ...b,
        decided: { ...b.decided, [b.asking]: "disown" },
        asking: null,
      };
    case "go-back":
      return { ...b, asking: null };
    case "close":
      return {
        ...b,
        open: false,
        asking: null,
        toast: b.added > 0 ? b.added : null,
        added: 0,
      };
    case "open":
      return { ...b, open: true, toast: null };
  }
}

/** Plays a script from an empty review and returns where it lands. */
export function play(
  script: readonly Step[],
  {
    open = false,
    rows = WAITING,
  }: { open?: boolean; rows?: readonly WaitingEvent[] } = {},
): Batch {
  let b: Batch = { ...EMPTY, open };
  const act = (a: Action) => {
    b = reduce(b, a, rows);
  };
  /** A press on the card on top, whichever it is when the script gets there. */
  const onTop = (type: "claim" | "not-mine") => {
    const top = rows[topOf(b, rows)];
    if (top) act({ type, eventId: top.eventId });
  };
  for (const step of script) {
    if (step === "claim" || step === "not-mine") {
      onTop(step);
      continue;
    }
    if (step !== "rest") {
      act({ type: step });
      continue;
    }
    // Bounded: each pass decides one card, a dialog closed by its Delete.
    for (let guard = 0; guard < rows.length; guard++) {
      const top = rows[topOf(b, rows)];
      if (!top) break;
      onTop(top.hers ? "claim" : "not-mine");
      if (b.asking) act({ type: "delete" });
    }
  }
  return b;
}

/** Photos across a set of events, for every sentence that counts them. */
export const photosIn = (list: readonly WaitingEvent[]) =>
  list.reduce((n, r) => n + r.uploadCount, 0);

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * THE BANNER'S ONE LINE (`ticket=banner`, settled): what is still waiting. Null
 * once every event is decided: the banner goes, and the page's invitation takes
 * its place.
 */
export function bannerOf(
  b: Batch,
  rows: readonly WaitingEvent[] = WAITING,
): { words: string; action: string } | null {
  const waiting = waitingOf(b, rows);
  if (waiting.length === 0) return null;
  const photos = photosIn(waiting);
  const still = waiting.length < rows.length ? "still " : "";
  return {
    words: `${plural(photos, "photo", "photos")} from ${plural(waiting.length, "event", "events")} ${photos === 1 ? "is" : "are"} ${still}waiting for you`,
    action: "Review",
  };
}

/**
 * THE ONE BUTTON THAT OPENS THE WHOLE REVIEW, worded for how many wait, so it
 * names them all and can never read as a page per event (his round one
 * question): "Review all 4", "Review both", "Review".
 */
export function reviewAll(n: number): string {
  if (n <= 1) return "Review";
  if (n === 2) return "Review both";
  return `Review all ${n}`;
}

/**
 * The moment card's one sentence about the rest, for however many wait, in the
 * review's own words (its title, and the banner's line, say "waiting for you"),
 * so the line, the banner and the review read as one thing. A line whose button
 * leaves the album says where it goes (`pointer=line`), so the tap that takes
 * her from the party is never a surprise.
 */
export function pointerWords(n: number, onDashboard = false): string {
  const where = onDashboard ? "on your dashboard" : "for you";
  return n === 1
    ? `1 more event has photos waiting ${where}.`
    : `${n} more events have photos waiting ${where}.`;
}
