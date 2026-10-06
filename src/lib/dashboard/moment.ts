import type { HomeEvent } from "./home-event";
import {
  AFTER_DAYS,
  daysFrom,
  daysToEvent,
  type Phase,
  phaseOfEvent,
} from "./when";

/**
 * ★ THE PARTY OF THE MOMENT: the one event the stage leads with (host-dashboard r1, `purpose=stage`,
 * Will 2026-10-02: "in 1 event dashboards (which every user will experience creating their first and
 * only event, until adding more), the experience feels much more alive"). It is the stage's whole rule until she chooses
 * another (`lead.ts`, r4: Newest IS this, and a party on its day, steps 1 below, leads under every rule). In order:
 *
 *  1. THE ONE ON ITS DAY. A date the host set first (any day of a range: lane `event-dates`), then an
 *     undated album whose photographs are landing today (Create asks no date, so a wedding nobody
 *     dated is live by its own evidence). Two on one night: the busier leads (the carried `busier`
 *     call), people waiting first, then photographs landing today, then the newest made.
 *  2. THE NEAREST WITHIN THE MONTH, either way, by its nearest day (`daysToEvent`: a range ahead by its
 *     first day, one over by its last): a day behind weighs a day and a half ahead, so tomorrow
 *     outranks last night and last weekend's album outranks a party three weeks out.
 *  3. ★ ON A QUIET DAY, THE NEWEST MADE (Will's lead=made, host-dashboard r2, 2026-10-03: "I think it
 *     makes sense to default to the newest event here, generally expecting a host to continue preparing
 *     it"): with nothing on its day and nothing within a month, the event she made last leads, dated or
 *     not, ahead of the next party however far and of the album a photograph last landed in (the two
 *     steps the r1 rule had here, retired by his pick).
 *
 * Time decides whenever it can; the newest made only answers a day it cannot.
 */
export function momentEvent<T extends HomeEvent>(
  events: readonly T[],
  today: string,
): { event: T; phase: Phase } | null {
  if (events.length === 0) return null;
  const lead = (event: T) => ({ event, phase: phaseOfEvent(event, today) });
  const newest = (a: T, b: T) =>
    Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const busier = (a: T, b: T) =>
    b.waiting - a.waiting ||
    b.arrivals.today - a.arrivals.today ||
    newest(a, b);

  const onItsDay = events
    .filter((e) => e.date !== null && daysToEvent(e, today) === 0)
    .sort(busier);
  if (onItsDay[0]) return lead(onItsDay[0]);
  const landing = events
    .filter(
      (e) =>
        e.date === null &&
        e.lastArrival !== null &&
        daysFrom(today, e.lastArrival.day) === 0,
    )
    .sort(busier);
  if (landing[0]) return lead(landing[0]);

  const weight = (e: T) => {
    const d = daysToEvent(e, today)!;
    return d >= 0 ? d : -d * 1.5;
  };
  const near = events
    .filter((e) => {
      const d = daysToEvent(e, today);
      return d !== null && Math.abs(d) <= AFTER_DAYS;
    })
    .sort((a, b) => weight(a) - weight(b) || newest(a, b));
  if (near[0]) return lead(near[0]);

  return lead([...events].sort(newest)[0]!);
}
