import type { HomeEvent } from "./home-event";
import { AFTER_DAYS, daysFrom, dayOf, type Phase, phaseOfEvent } from "./when";

/**
 * ★ THE PARTY OF THE MOMENT: the one event the stage leads with (host-dashboard r1, `purpose=stage`,
 * Will 2026-10-02: "in 1 event dashboards (which every user will experience creating their first and
 * only event, until adding more), the experience feels much more alive"). In order:
 *
 *  1. THE ONE ON ITS DAY. A date the host set first, then an undated album whose photographs are
 *     landing today (Create asks no date, so a wedding nobody dated is live by its own evidence). Two
 *     on one night: the busier leads (the carried `busier` call), people waiting first, then
 *     photographs landing today, then the newest made.
 *  2. THE NEAREST WITHIN THE MONTH, either way, by its day (`dayOf`): a day behind weighs a day and a
 *     half ahead, so tomorrow outranks last night and last weekend's album outranks a party three
 *     weeks out.
 *  3. THE NEXT ONE COMING, however far.
 *  4. When none is dated or near, THE LATEST ACTIVITY: the album a photograph last landed in.
 *  5. Else THE NEWEST MADE: the event she is setting up.
 *
 * Steps 4 and 5 are the working rule for his "We'll have to decide which one gets featured in
 * different cases, such as no dates on multiple events" (the manifest's Question; his r2's to decide).
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
    .filter((e) => e.date !== null && daysFrom(today, e.date) === 0)
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
    const d = daysFrom(today, dayOf(e)!);
    return d >= 0 ? d : -d * 1.5;
  };
  const near = events
    .filter((e) => {
      const day = dayOf(e);
      return day !== null && Math.abs(daysFrom(today, day)) <= AFTER_DAYS;
    })
    .sort((a, b) => weight(a) - weight(b) || newest(a, b));
  if (near[0]) return lead(near[0]);

  const ahead = events
    .filter((e) => e.date !== null && daysFrom(today, e.date) > 0)
    .sort((a, b) => daysFrom(today, a.date!) - daysFrom(today, b.date!));
  if (ahead[0]) return lead(ahead[0]);

  const active = events
    .filter((e) => e.lastArrival !== null)
    .sort(
      (a, b) =>
        Date.parse(b.lastArrival!.at) - Date.parse(a.lastArrival!.at) ||
        newest(a, b),
    );
  if (active[0]) return lead(active[0]);

  return lead([...events].sort(newest)[0]!);
}
