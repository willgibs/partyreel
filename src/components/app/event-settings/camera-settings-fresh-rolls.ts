/**
 * A DEVELOP TIME ADDED TO A RUNNING CAMERA STARTS EVERY ROLL AGAIN, AND SETTINGS SAYS SO FIRST (host-moments r1's
 * `tell=line`: "A refill that reaches every guest is a consequence; Settings says those first, and fresh rolls is the
 * generous answer"). A develop time coming ahead, from none or from one reached, begins a new period
 * (`events_reveal_stamp` restamps `events.sealed_from`), and every guest's roll counts from it: a guest who had 5 shots
 * left has 24 again. So the change asks in the consequence line Settings already uses for a change that reaches people,
 * Start fresh rolls or Keep it as it is, before it saves, at each of the three places a host makes it: Customize's At a
 * develop time, the Disposable style chosen from a camera that shows each shot (a mix), and a new time typed for an
 * album that has developed.
 *
 * ★ ASKED ON EVERY RUNNING CAMERA, whoever has shot: Settings holds no count of the guests' rolls (a ticket with no
 * name is in none of its numbers), and the line is true either way. Never on free uploads, where no roll exists, nor
 * when the camera itself begins (from free uploads to the camera): nobody had a roll to start again.
 *
 * Pure and node-safe, so each rule is a unit test.
 */
import { developState } from "@/lib/disposable/reveal";
import { zoneWhen } from "@/lib/event/zone-words";
import { developsWhen } from "@/lib/guest/camera/words";

/** The primary key's words: the change itself (the brief's own). */
export const START_FRESH_ROLLS = "Start fresh rolls";

/** The columns the question reads, Settings' own. */
type Columns = { capture: string; developsAt: string | null };

/**
 * Whether a change starts every guest's roll again: a camera running before and after it, and a develop time coming
 * ahead where none was ahead (none set, or one reached). `events_reveal_stamp`'s own condition, for a running camera.
 */
export function startsFreshRolls(
  from: Columns,
  to: Columns,
  nowMs: number = Date.now(),
): boolean {
  if (from.capture !== "camera" || to.capture !== "camera") return false;
  const ahead = (at: string | null) =>
    developState(at, nowMs).kind === "waiting";
  return !ahead(from.developsAt) && ahead(to.developsAt);
}

const photos = (n: number) => (n === 1 ? "1 photo" : `${n} photos`);

/**
 * THE LINE: every roll starts again at its size, developing at the time she chose, and what the album shows stays.
 * Held photos the same save releases into the roll (leaving approval) are said in it too, one line for one save.
 */
export function freshRollsLine(input: {
  /** The roll's size, every guest's fresh count. */
  roll: number;
  /** The develop time the change writes. */
  developsAt: string | null;
  /** The reader's clock, or null before hydration (the time is then left unsaid). */
  nowMs: number | null;
  /** The party's zone where it is not hers (`farZone`): the when is then its clock, its place named. */
  far?: string | null;
  /** Photos under review the same save approves into the roll. */
  held?: number;
}): string {
  const { roll, developsAt, nowMs, far = null, held = 0 } = input;
  const when =
    nowMs !== null && developsAt
      ? ` ${far ? zoneWhen(developsAt, far) : developsWhen(developsAt, nowMs)}`
      : "";
  const shots = `${roll} fresh ${roll === 1 ? "shot" : "shots"} each`;
  const joining =
    held > 0
      ? ` ${photos(held)} under review ${held === 1 ? "joins" : "join"} the roll, approved.`
      : "";
  return `Every guest's roll starts again: ${shots}, developing together${when}.${joining} What's in the album now stays in view.`;
}
