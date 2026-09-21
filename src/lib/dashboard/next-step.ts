/**
 * THE NEXT BEST STEP, PER EVENT — the pulse's first band, and the whole answer
 * to Will's one worry about it.
 *
 * He approved the front page (`home=pulse`, 2026-09-20) with a caveat worth
 * keeping verbatim, because it is the spec: the inbox existed "to make the full
 * app feel more available & ready to action than a more limited and empty
 * surface that doesn't feel actionable until more things start to happen (which
 * creates a very boring and bland initial host experience sometimes)".
 *
 * So band one is NEVER "the review queue", which is empty most of the time and
 * empty for every new host. It is the next thing each event wants, resolved by
 * this function in a fixed precedence, over state the app already knows. An
 * event that wants nothing contributes nothing and the band says so in one calm
 * line rather than rendering a void. `home-states` (app-shape round two) is
 * where the three host states get drawn properly; it inherits these rules
 * rather than re-inventing them.
 *
 * PURE AND NODE-SAFE. No Date.now() lives in here and none may: the caller
 * passes `today`, because a date read during render is impure (react-hooks
 * purity) and because a pure function is the only kind this order can be
 * TESTED in. The existing `listRecentlyDeletedEvents` sets the same precedent.
 */

export type NextStepKind = "review" | "paused" | "reel" | "print" | "storage";

export type NextStep = {
  kind: NextStepKind;
  /** null for the account-level step (storage), which belongs to no event. */
  eventId: string | null;
  /** The band's phrasing: the event named, because a host has several. */
  label: string;
  /** The row view's phrasing: the same step with the name already in the row. */
  short: string;
  href: string;
  tone: "waiting" | "quiet" | "warning";
};

export type NextStepEvent = {
  id: string;
  name: string;
  /** Media waiting on the host's review. */
  pending: number;
  /** Approved items in the album (a reel needs something to cut). */
  items: number;
  acceptingUploads: boolean;
  hasReel: boolean;
  /** `YYYY-MM-DD`, or null when the host never set one. */
  eventDate: string | null;
};

/** Over this, the storage line stops being ambient and becomes a step. */
export const STORAGE_STEP_PCT = 85;

/**
 * ONE STEP PER EVENT, IN HIS ORDER: a queue waiting, then uploads paused, then
 * a live event with no reel, then an event dated tomorrow. First match wins,
 * because a host with four events and four steps each is back to an inbox.
 *
 * "Live with no reel" deliberately requires `items > 0`: offering "Make the
 * reel" for an album with no photographs in it is a step that cannot be taken,
 * which is worse than no step at all.
 */
export function nextStepForEvent(
  event: NextStepEvent,
  today: string,
): NextStep | null {
  const href = `/dashboard/${event.id}`;

  if (event.pending > 0) {
    return {
      kind: "review",
      eventId: event.id,
      label: `${event.pending} waiting on ${event.name}`,
      short: `${event.pending} to review`,
      href,
      tone: "waiting",
    };
  }

  if (!event.acceptingUploads) {
    return {
      kind: "paused",
      eventId: event.id,
      label: `Uploads are paused on ${event.name}`,
      short: "Uploads paused",
      href,
      tone: "quiet",
    };
  }

  if (event.items > 0 && !event.hasReel) {
    return {
      kind: "reel",
      eventId: event.id,
      label: `${event.name} has no reel yet`,
      short: "Make the reel",
      href: `${href}/reel`,
      tone: "quiet",
    };
  }

  if (event.eventDate && event.eventDate === tomorrowOf(today)) {
    return {
      kind: "print",
      eventId: event.id,
      label: `Print the code for ${event.name}`,
      short: "Print the code",
      href,
      tone: "quiet",
    };
  }

  return null;
}

/**
 * The whole band. Events in the order they were given (newest first), each
 * contributing at most one step, then the account-level storage step last —
 * last because it is about the shelf, not about a party, and a host mid-event
 * should read what their guests are doing before what their plan is doing.
 */
export function resolveNextSteps(input: {
  events: NextStepEvent[];
  storagePct: number;
  today: string;
}): NextStep[] {
  const steps: NextStep[] = [];
  for (const event of input.events) {
    const step = nextStepForEvent(event, input.today);
    if (step) steps.push(step);
  }
  if (input.storagePct > STORAGE_STEP_PCT) {
    steps.push({
      kind: "storage",
      eventId: null,
      label: `${input.storagePct}% of your storage used`,
      short: "Storage is nearly full",
      href: "/pricing",
      tone: "warning",
    });
  }
  return steps;
}

/**
 * THE BAND'S FOLD (`busy=collapsed`, app-shape round two, 2026-09-20).
 *
 * A genuinely busy host — several queues waiting, a shelf nearly full, a few
 * quiet suggestions — hits six steps in the one band by Thursday, and six
 * chips wrapping three lines deep stops answering "what needs you" at a
 * glance. So PAST THE LIMIT, the band shows the top steps BY TONE (a queue
 * waiting outranks a shelf nearly full outranks a quiet suggestion) and folds
 * the rest behind one count.
 *
 * ★ A BAND THAT ALREADY FITS IS NEVER RE-RANKED. Tone order only enters once
 * folding is real; at or under the limit `resolveNextSteps`'s own order
 * (newest event first) passes through untouched, so a host with one or two
 * events sees exactly today's order — the same guarantee that keeps `empty`
 * and `first` unchanged. A STABLE sort past the limit: two steps of the same
 * tone keep their own relative order rather than being re-ranked against each
 * other, so the fold never invents an opinion about which of two waiting
 * queues matters more.
 */
export const NEXT_STEP_BAND_LIMIT = 3;

const TONE_RANK: Record<NextStep["tone"], number> = {
  waiting: 0,
  warning: 1,
  quiet: 2,
};

export type FoldedNextSteps = {
  /** The band's default view: the top steps. */
  head: NextStep[];
  /** Behind the "N more" chip; empty when the band already fits. */
  rest: NextStep[];
};

export function foldNextSteps(
  steps: NextStep[],
  limit: number = NEXT_STEP_BAND_LIMIT,
): FoldedNextSteps {
  if (steps.length <= limit) return { head: steps, rest: [] };
  const ranked = steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => {
      const byTone = TONE_RANK[a.step.tone] - TONE_RANK[b.step.tone];
      return byTone !== 0 ? byTone : a.index - b.index;
    })
    .map(({ step }) => step);
  return { head: ranked.slice(0, limit), rest: ranked.slice(limit) };
}

/**
 * `YYYY-MM-DD` plus one day, by UTC arithmetic on the date parts alone.
 *
 * ★ NEVER `new Date(today)` + setDate: that parses a bare date string as UTC
 * midnight, then reads it back in the server's zone, so for any host behind
 * UTC the answer is yesterday and "tomorrow" silently means "today". Splitting
 * the string and using Date.UTC keeps the whole calculation in one frame.
 */
function tomorrowOf(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  if (!y || !m || !d) return "";
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}
