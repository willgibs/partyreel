/**
 * THE DEVELOP AND THE CAMERA, AS THEY TRAVEL: how guests add and when the album develops, off the event's row, and
 * what waits, as a guest's album answers it. Pure and isomorphic (the routes, the client store and the tests import
 * it), so it takes nothing from the server.
 *
 * Two independent answers (the program's synthesis, 2026-10-02): HOW GUESTS ADD is `events.capture` (free uploads, or
 * the album's camera with its roll); WHEN EVERYONE SEES is `moderation_mode` and `events.develops_at` together
 * (`reveal.ts`). A disposable camera is the camera plus a develop time: a preset, never a column.
 *
 * ★ WHAT WAITS IS NUMBERS, NEVER IDS. A guest learns how many rows wait (held for the host's approval, or sealed for
 * the develop: one experience, counted together) and in which minutes; no id, key or uploader of a waiting row leaves
 * the server (`album_changes_since`'s `waiting`, docs/systems/disposable-mode.md). Her OWN held and sealed rows ride
 * her tracker's read (`/api/guests/mine`), never the album's.
 */

/** How guests add, mirroring `events.capture`'s CHECK (20261002200000): free uploads, or the album's camera. */
export const CAPTURES = ["upload", "camera"] as const;
export type Capture = (typeof CAPTURES)[number];

export function isCapture(value: unknown): value is Capture {
  return CAPTURES.includes(value as Capture);
}

/** One minute of what waits: when it began (epoch milliseconds) and how many rows were added in it. */
export type WaitingMinute = readonly [at: number, rows: number];

/** What waits, as a guest may know it: how many rows, and how many each minute. */
export type WaitingFacts = { count: number; minutes: WaitingMinute[] };

export const NOTHING_WAITING: WaitingFacts = { count: 0, minutes: [] };

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

/**
 * `album_changes_since`'s `waiting`, read defensively: it crosses a process boundary, and a reader older than the
 * migration answers none (NOTHING_WAITING, the truth then as the album knew it). A malformed minute is dropped, never
 * guessed, and the count is the answer's own.
 */
export function parseWaitingFacts(json: unknown): WaitingFacts {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return NOTHING_WAITING;
  }
  const o = json as Record<string, unknown>;
  const total = count(o.count);
  if (total === null) return NOTHING_WAITING;
  const minutes: WaitingMinute[] = [];
  for (const row of Array.isArray(o.minutes) ? o.minutes : []) {
    if (!Array.isArray(row)) continue;
    const at = row[0];
    const rows = count(row[1]);
    if (typeof at !== "number" || !Number.isFinite(at) || !rows) continue;
    minutes.push([at, rows] as const);
  }
  minutes.sort((a, b) => a[0] - b[0]);
  return { count: total, minutes };
}

/**
 * WHAT A GUEST'S ALBUM SAYS WAITS, on every full sync (`GuestFullSync.waiting`): the count and its minutes, and when
 * the album develops (an ISO time, or null where it has no develop time). Absent where nothing waits and no develop time
 * is set, so an album that uses neither answers byte for byte what it did.
 */
export type GuestWaiting = WaitingFacts & { developsAt: string | null };

/** The event's own facts here, as its row or its read (`get_event_by_qr_token`) carries them. */
export type DevelopEventFacts = {
  capture: Capture;
  /** The camera's roll (24 unless its host named fewer), or null for free uploads. */
  rollSize: number | null;
  /** The develop time, ISO, or null for none. A time reached has developed. */
  developsAt: string | null;
  /** The read's `develop_due`: a sealed row disagrees with the event, so the album runs develop_due before it reads. */
  developDue: boolean;
};

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `capture`, `roll_size`, `develops_at` and `develop_due` arrive with
 * migration 20261002200000, and `types.ts` learns them only when the Orchestrator regenerates it, so a row is read here
 * field by field. It stays the one reader after the regeneration (a defensive parse costs nothing): a row from a
 * database before the migration, or a value it does not know, reads as free uploads with no develop, which is what
 * every event was.
 */
export function developFactsOf(row: unknown): DevelopEventFacts {
  const o =
    row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const capture = isCapture(o.capture) ? o.capture : "upload";
  const rollSize =
    capture === "camera" &&
    typeof o.roll_size === "number" &&
    Number.isInteger(o.roll_size) &&
    o.roll_size > 0
      ? o.roll_size
      : null;
  return {
    capture,
    rollSize,
    developsAt: typeof o.develops_at === "string" ? o.develops_at : null,
    developDue: o.develop_due === true,
  };
}

/** What a full sync carries about what waits, or null where nothing waits and no develop time is set. */
export function waitingFor(
  event: Pick<DevelopEventFacts, "developsAt">,
  waiting: WaitingFacts,
): GuestWaiting | null {
  return waiting.count > 0 || event.developsAt !== null
    ? { ...waiting, developsAt: event.developsAt }
    : null;
}
