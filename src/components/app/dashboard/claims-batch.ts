import type { ClaimableEvent, ClaimedEventNext } from "@/lib/db/queries/claims";
import { formatCount } from "@/lib/format/count";

/**
 * THE CLAIMS REVIEW AS A MACHINE (`identity-claims` r1 and r2, Will 2026-09-27): one pure reducer
 * the review is played on, the board's own (`sandbox/identity-claims/batch.ts`, its spec on the
 * RPCs' semantics) with the write in it.
 *
 *   - `pass=cards`: one event at a time; deciding advances.
 *   - `save=once`: a decision is written the moment she makes it (a Claim at once, a Not mine once
 *     its dialog says Delete); closed early, what she did stays done and the rest waits.
 *   - `confirm=card`: the dialog asks at the one card that said Not mine, its photos in view.
 *
 * ★ THE DOUBLE TAP (`claims-r3` found it on the board: two quick Claims took two events). Every
 * decision writes, and a claim has no undo, so three guards stand between a second tap and the next
 * event: an answer NAMES its card (a press carrying another event's id is dropped here); a card
 * WAITS for its write (while one is in flight nothing else answers, and the card holds the top
 * even if a refresh behind it drops the row); and an arriving card holds its answers for a beat
 * (`claims-card.tsx`, a view's concern).
 */

export type Choice = "claim" | "disown";

/** How an answer landed. `gone`: the event had stopped waiting before it arrived. */
export type Outcome =
  | { choice: "claim"; next: ClaimedEventNext | null }
  | { choice: "disown" }
  | { choice: "gone" };

export type Decision = Outcome & { row: ClaimableEvent };

export type Batch = {
  /** Every event decided in this visit, by id, each written the moment she decided it. */
  decided: Readonly<Record<string, Decision>>;
  /** Their ids in the order she decided them: the list under the card. */
  order: readonly string[];
  /** The card whose Not mine is asking its dialog (`confirm=card`). */
  asking: ClaimableEvent | null;
  /** The one write in flight: its card stays on top until it lands. */
  writing: { row: ClaimableEvent; choice: Choice } | null;
  /** The review is open over the page. */
  open: boolean;
  /** Photos claimed since the review last said so: its one toast's count. */
  added: number;
  /** The review closed and owes its toast, which waits for a write still in flight. */
  owed: boolean;
};

export type Action =
  | { type: "open" }
  | { type: "close" }
  | { type: "claim"; eventId: string }
  | { type: "not-mine"; eventId: string }
  | { type: "delete"; eventId: string }
  | { type: "go-back" }
  | { type: "landed"; eventId: string; outcome: Outcome }
  | { type: "failed"; eventId: string }
  | { type: "said" };

export const EMPTY: Batch = {
  decided: {},
  order: [],
  asking: null,
  writing: null,
  open: false,
  added: 0,
  owed: false,
};

export type Review = {
  /** Everything the review shows, in order: what she decided, then what waits. */
  rows: ClaimableEvent[];
  /** What still waits, the card on top first. */
  waiting: ClaimableEvent[];
  /** The card on top, or null once every event is decided. */
  top: ClaimableEvent | null;
};

/**
 * The review against the server's latest list (`fresh`, which a refresh behind the review shortens
 * as her writes land). What she decided here stays in it, in her order; what waits follows in the
 * list's own order; a card she is answering holds the top whatever the list says; and an event the
 * list dropped that she never decided here (sorted in another tab) simply leaves.
 */
export function reviewOf(b: Batch, fresh: readonly ClaimableEvent[]): Review {
  const held = b.writing?.row ?? b.asking;
  const waiting = fresh.filter(
    (r) => !b.decided[r.eventId] && r.eventId !== held?.eventId,
  );
  if (held && !b.decided[held.eventId]) waiting.unshift(held);
  const decided = b.order
    .map((id) => b.decided[id])
    .filter((d) => d.choice !== "gone")
    .map((d) => d.row);
  return { rows: [...decided, ...waiting], waiting, top: waiting[0] ?? null };
}

export function reduce(
  b: Batch,
  a: Action,
  fresh: readonly ClaimableEvent[],
): Batch {
  switch (a.type) {
    case "open":
      return b.open ? b : { ...b, open: true, owed: false };
    case "close":
      return b.open ? { ...b, open: false, asking: null, owed: true } : b;
    case "claim":
    case "not-mine": {
      const { top } = reviewOf(b, fresh);
      if (!b.open || b.asking || b.writing) return b;
      if (!top || top.eventId !== a.eventId) return b;
      return a.type === "claim"
        ? { ...b, writing: { row: top, choice: "claim" } }
        : { ...b, asking: top };
    }
    case "delete":
      if (!b.open || b.writing || b.asking?.eventId !== a.eventId) return b;
      return { ...b, writing: { row: b.asking, choice: "disown" } };
    case "go-back":
      return b.asking && !b.writing ? { ...b, asking: null } : b;
    case "landed": {
      const w = b.writing;
      if (!w || w.row.eventId !== a.eventId) return b;
      return {
        ...b,
        decided: { ...b.decided, [a.eventId]: { ...a.outcome, row: w.row } },
        order: [...b.order, a.eventId],
        writing: null,
        asking: b.asking?.eventId === a.eventId ? null : b.asking,
        added: b.added + (a.outcome.choice === "claim" ? w.row.uploadCount : 0),
      };
    }
    case "failed":
      return b.writing?.row.eventId === a.eventId ? { ...b, writing: null } : b;
    case "said":
      return { ...b, owed: false, added: 0 };
  }
}

/* ── the words ──────────────────────────────────────────────────────────────────────────────── */

/** "1 photo" | "1,249 photos": every count the review says (an upload of either type, as ever). */
export function photoCount(n: number): string {
  return `${formatCount(n)}\u00a0photo${n === 1 ? "" : "s"}`;
}

const eventCount = (n: number) =>
  `${formatCount(n)} event${n === 1 ? "" : "s"}`;

/** Photos across a set of events. */
export const photosIn = (rows: readonly ClaimableEvent[]) =>
  rows.reduce((n, r) => n + r.uploadCount, 0);

/**
 * THE BANNER'S ONE LINE (`ticket=banner`: "This allows users to handle when they'd like to, rather
 * than filling the screen with a tall card immediately"): what still waits, "still" once she has
 * decided some.
 */
export function bannerWords(
  waiting: readonly ClaimableEvent[],
  still: boolean,
): string {
  const photos = photosIn(waiting);
  return `${photoCount(photos)} from ${eventCount(waiting.length)} ${photos === 1 ? "is" : "are"} ${still ? "still " : ""}waiting for you`;
}

/** The end of the stack: what the review put in her account, or that it put nothing. */
export function endWords(claimed: readonly ClaimableEvent[]): string {
  if (claimed.length === 0) return "Nothing was added to your account.";
  const photos = photosIn(claimed);
  return `${photoCount(photos)} from ${eventCount(claimed.length)} ${photos === 1 ? "is" : "are"} in your account now.`;
}

/** The one toast as the review closes, counting what this opening added (never one per claim). */
export function toastWords(added: number): string {
  return `Added ${photoCount(added)} to your account.`;
}

/**
 * ONE POINTER TO HER PAGE A BEAT (the ROADMAP line `claims-r2` left: the toast's page line,
 * `after=profile`, and the page's invitation, `prompt=claim`, both pointed at the page setup the
 * moment a review closed with nothing left). The invitation is the pointer where it will stand: it
 * takes the banner's place once nothing waits, on an account with no page that has not said Not
 * now (`shouldInviteToPage`). Everywhere else the toast carries the line: an account with a page
 * (its choices), a review closed with events still waiting (the banner stands, not the card), an
 * invitation she put away.
 */
export function toastPointsToPage({
  invitesOnceSorted,
  waiting,
}: {
  /** No page yet and the invitation not dismissed: it takes the banner's slot once nothing waits. */
  invitesOnceSorted: boolean;
  waiting: number;
}): boolean {
  return !(invitesOnceSorted && waiting === 0);
}
