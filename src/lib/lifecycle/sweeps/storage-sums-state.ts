/**
 * THE STORAGE SUMS' RECORD (storage-sums-signal; the Advisor's condition on upload_sums): what a run of the
 * `storage_sums` check reads from the database and leaves on its run row, and what the next run, the card on
 * /admin/jobs and the operator's Rebuild read back. PURE (no env, no DB, no `server-only`), so each rule is tested
 * where it is decided.
 *
 * WHAT IS CHECKED (`storage_sums_drift`, 20261006180000): host by host, in one snapshot, the sums the database keeps as
 * media change (`event_storage_sums`, `host_storage_sums`, read through `host_storage_summary`) against her items
 * walked one by one (`host_storage_walk`, the one definition): the summary's three figures, each of her event rows,
 * her total against her event rows. It writes nothing, and nothing here mends: a drift is said, and the operator's
 * Rebuild (`rebuild_storage_sums`) is the fix.
 *
 * ★ A DRIFT STAYS NAMED UNTIL IT IS CHECKED AGAIN. A pass can span nights (it stops at its deadline and resumes at its
 * cursor), so a host found drifted on one night may not be reached the next; the run row carries what it found (the
 * findings), the next run checks each of them again first, and a host leaves the list only when a check reads her at
 * parity (or her account is gone). So the card's list, and its Rebuild, never vanish under a drift that stands.
 */
import type { Json } from "@/lib/db/types";
import { RESUME_KEY, sanitizeCounts } from "@/lib/jobs/sweep-tally";

/**
 * Hosts a call of `storage_sums_drift` checks. Each costs two walks of her items (the walk, then her items by event:
 * 11 ms warm for a host of 4,330 items over 156 events, read live 2026-10-07), so fifty ordinary hosts take well under a
 * second, the deadline is asked often, and PostgREST's 8 s statement timeout leaves room for a page holding a giant (a
 * host of 500,000 items walks in about 1.3 s).
 */
export const DRIFT_PAGE = 50;

/**
 * Drifted hosts a run row names, each with her figures and a Rebuild on the card. More than this is the sums' own bug
 * (a trigger that misses a writer drifts every host it touches), not a host's, and wants a fix before a rebuild; the
 * rest are counted (`unlisted`) and named again as the pass reaches them.
 */
export const FINDINGS_MAX = 25;

/** The run row's one nested value (`sanitizeCounts` keeps a row flat: a tally, not a log). */
export const FINDINGS_KEY = "findings";

/** What a host stores in the summary's three figures, in bytes. `deleted` is the SQL's `standby_bytes`. */
export type Figures = { active: number; deleted: number; system: number };

/** One drifted host, as `storage_sums_drift` answers it. */
export type DriftedHost = {
  hostId: string;
  /** The sums' figures (`host_storage_summary`). */
  summary: Figures;
  /** Her items walked (`host_storage_walk`). */
  walk: Figures;
  /** Her event rows that disagree with her items by event (a missing or an orphan row included). */
  events: number;
  /** Her host row disagrees with her event rows. */
  total: boolean;
};

/** One call's answer. */
export type DriftPage = {
  checked: number;
  /** The last host the call checked, when its page was full: the next call starts after it. Null at the end. */
  nextAfter: string | null;
  drifted: DriftedHost[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function bytesAt(o: Record<string, unknown>, key: string, where: string) {
  const value = o[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`storage_sums_drift: ${where}.${key} is not a number`);
  }
  return value;
}

function figuresOf(value: unknown, where: string): Figures {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`storage_sums_drift: ${where} is not an object`);
  }
  const o = value as Record<string, unknown>;
  return {
    active: bytesAt(o, "active_bytes", where),
    deleted: bytesAt(o, "standby_bytes", where),
    system: bytesAt(o, "system_bytes", where),
  };
}

/**
 * The function's jsonb, read defensively: an answer this code does not know fails the run, never reads as a clean
 * night (a check that cannot be read is no proof of anything).
 */
export function parseDriftPage(data: unknown): DriftPage {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("storage_sums_drift: not an object");
  }
  const o = data as Record<string, unknown>;
  const checked = o.checked;
  if (
    typeof checked !== "number" ||
    !Number.isInteger(checked) ||
    checked < 0
  ) {
    throw new TypeError("storage_sums_drift: checked is not a count");
  }
  const next = o.next_after;
  if (next !== null && !isUuid(next)) {
    throw new TypeError("storage_sums_drift: next_after is not a host id");
  }
  if (!Array.isArray(o.drifted)) {
    throw new TypeError("storage_sums_drift: drifted is not a list");
  }
  const drifted = o.drifted.map((entry, i): DriftedHost => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new TypeError(`storage_sums_drift: drifted[${i}] is not an object`);
    }
    const d = entry as Record<string, unknown>;
    if (!isUuid(d.host_id)) {
      throw new TypeError(
        `storage_sums_drift: drifted[${i}].host_id is not a host id`,
      );
    }
    const events = d.events;
    if (typeof events !== "number" || !Number.isInteger(events) || events < 0) {
      throw new TypeError(
        `storage_sums_drift: drifted[${i}].events is not a count`,
      );
    }
    if (typeof d.total !== "boolean") {
      throw new TypeError(
        `storage_sums_drift: drifted[${i}].total is not a boolean`,
      );
    }
    return {
      hostId: d.host_id.toLowerCase(),
      summary: figuresOf(d.summary, `drifted[${i}].summary`),
      walk: figuresOf(d.walk, `drifted[${i}].walk`),
      events,
      total: d.total,
    };
  });
  return {
    checked,
    nextAfter: next === null ? null : next.toLowerCase(),
    drifted,
  };
}

/**
 * THE HOST JUST BEFORE `id` in Postgres's order of uuids (its sixteen bytes compared as one big-endian number), or null
 * before the first. `storage_sums_drift(after, 1)` checks the first host after `after`, so asking it after this one
 * checks exactly `id` when she exists, and its `next_after` names whom it checked: the check of one host the next run
 * and the Rebuild make, with no read of its own.
 */
export function uuidBefore(id: string): string | null {
  if (!isUuid(id)) throw new TypeError(`not a uuid: ${id}`);
  // BigInt(), never a literal: the project's compile target predates ES2020's `1n`.
  const n = BigInt(`0x${id.replaceAll("-", "")}`);
  if (n === BigInt(0)) return null;
  const hex = (n - BigInt(1)).toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** A drifted host as the run row keeps her: flat, so the row's one nested value is a list of flat records. */
export type DriftFinding = {
  host_id: string;
  summary_active: number;
  summary_deleted: number;
  summary_system: number;
  walk_active: number;
  walk_deleted: number;
  walk_system: number;
  events: number;
  total: boolean;
  /** When a check first found her drifted (ISO), kept while she stays so. */
  since: string;
};

export function findingOf(host: DriftedHost, since: string): DriftFinding {
  return {
    host_id: host.hostId,
    summary_active: host.summary.active,
    summary_deleted: host.summary.deleted,
    summary_system: host.summary.system,
    walk_active: host.walk.active,
    walk_deleted: host.walk.deleted,
    walk_system: host.walk.system,
    events: host.events,
    total: host.total,
    since,
  };
}

/** A finding read back off a row: every field as written, or not a finding at all (a malformed one is dropped). */
function readFinding(value: unknown): DriftFinding | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const num = (key: string) =>
    typeof o[key] === "number" && Number.isFinite(o[key])
      ? (o[key] as number)
      : null;
  const fields = [
    "summary_active",
    "summary_deleted",
    "summary_system",
    "walk_active",
    "walk_deleted",
    "walk_system",
    "events",
  ] as const;
  const values = fields.map(num);
  if (!isUuid(o.host_id) || values.some((v) => v === null)) return null;
  if (typeof o.total !== "boolean") return null;
  if (typeof o.since !== "string" || !Number.isFinite(Date.parse(o.since)))
    return null;
  const [sa, sd, ss, wa, wd, ws, events] = values as number[];
  return {
    host_id: o.host_id.toLowerCase(),
    summary_active: sa,
    summary_deleted: sd,
    summary_system: ss,
    walk_active: wa,
    walk_deleted: wd,
    walk_system: ws,
    events,
    total: o.total,
    since: o.since,
  };
}

/** The count keys the row carries (the card's view and the next run read them; the runner keeps them flat). */
export const STORAGE_SUMS_KEYS = {
  checked: "checked",
  drifted: "drifted",
  unlisted: "unlisted",
  passStartedAt: "pass_started_at",
  passChecked: "pass_checked",
  passComplete: "pass_complete",
  lastPassAt: "last_pass_at",
  lastPassChecked: "last_pass_checked",
  rebuiltHost: "rebuilt_host",
} as const;

/** What a run (or a Rebuild) reads back off the newest row: where the pass stands and who is known drifted. */
export type StorageSumsState = {
  resumeAfter: string | null;
  findings: DriftFinding[];
  unlisted: number;
  passStartedAt: string | null;
  passChecked: number;
  /** The run that wrote it ended the pass (reached the last host). */
  passComplete: boolean;
  lastPassAt: string | null;
  lastPassChecked: number | null;
  stoppedEarly: boolean;
  remaining: number | null;
};

export const EMPTY_STATE: StorageSumsState = {
  resumeAfter: null,
  findings: [],
  unlisted: 0,
  passStartedAt: null,
  passChecked: 0,
  passComplete: false,
  lastPassAt: null,
  lastPassChecked: null,
  stoppedEarly: false,
  remaining: null,
};

function countAt(c: Record<string, unknown>, key: string): number | null {
  const value = c[key];
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function timeAt(c: Record<string, unknown>, key: string): string | null {
  const value = c[key];
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : null;
}

/**
 * The newest row's counts as a state. Anything it cannot read is absent, never invented: no row (or an older shape)
 * is a pass from the beginning with nobody known drifted, which re-checks every host and can skip none.
 */
export function readStorageSumsState(counts: unknown): StorageSumsState {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return EMPTY_STATE;
  }
  const c = counts as Record<string, unknown>;
  const cursor = c[RESUME_KEY];
  const raw = c[FINDINGS_KEY];
  return {
    resumeAfter: isUuid(cursor) ? cursor.toLowerCase() : null,
    findings: Array.isArray(raw)
      ? raw.map(readFinding).filter((f): f is DriftFinding => f !== null)
      : [],
    unlisted: countAt(c, STORAGE_SUMS_KEYS.unlisted) ?? 0,
    passStartedAt: timeAt(c, STORAGE_SUMS_KEYS.passStartedAt),
    passChecked: countAt(c, STORAGE_SUMS_KEYS.passChecked) ?? 0,
    passComplete: c[STORAGE_SUMS_KEYS.passComplete] === true,
    lastPassAt: timeAt(c, STORAGE_SUMS_KEYS.lastPassAt),
    lastPassChecked: countAt(c, STORAGE_SUMS_KEYS.lastPassChecked),
    stoppedEarly: c.stopped_early === true,
    remaining: countAt(c, "remaining"),
  };
}

/**
 * The known drifted hosts after a check: those still drifted, newest figures first-found date kept, deduplicated by
 * host and ordered by her id, at most `FINDINGS_MAX` named and the rest counted.
 */
export function listFindings(findings: DriftFinding[]): {
  listed: DriftFinding[];
  unlisted: number;
} {
  const byHost = new Map<string, DriftFinding>();
  for (const f of findings) {
    const earlier = byHost.get(f.host_id);
    // The fresher figures win; the first-found date stays the earliest a check named her.
    byHost.set(
      f.host_id,
      earlier
        ? {
            ...f,
            since:
              Date.parse(earlier.since) <= Date.parse(f.since)
                ? earlier.since
                : f.since,
          }
        : f,
    );
  }
  const all = [...byHost.values()].sort((a, b) =>
    a.host_id < b.host_id ? -1 : a.host_id > b.host_id ? 1 : 0,
  );
  return {
    listed: all.slice(0, FINDINGS_MAX),
    unlisted: Math.max(0, all.length - FINDINGS_MAX),
  };
}

/** A finding as the row keeps it: only the known keys, so a row can never carry more than this says. */
function findingJson(f: DriftFinding): Json {
  return {
    host_id: f.host_id,
    summary_active: f.summary_active,
    summary_deleted: f.summary_deleted,
    summary_system: f.summary_system,
    walk_active: f.walk_active,
    walk_deleted: f.walk_deleted,
    walk_system: f.walk_system,
    events: f.events,
    total: f.total,
    since: f.since,
  };
}

/**
 * THE ROW'S COUNTS for the storage sums' run (the runner's `counts` for this sweep alone): the flat tally every sweep's
 * row keeps (`sanitizeCounts`: numbers, booleans, short strings, never a note's text), and the findings beside it,
 * each re-read through `readFinding`, at most `FINDINGS_MAX`. Nothing else nested survives.
 */
export function storageSumsCounts(result: unknown): Json | null {
  const flat = sanitizeCounts(result);
  const raw =
    result && typeof result === "object" && !Array.isArray(result)
      ? (result as Record<string, unknown>)[FINDINGS_KEY]
      : undefined;
  const findings = Array.isArray(raw)
    ? raw
        .map(readFinding)
        .filter((f): f is DriftFinding => f !== null)
        .slice(0, FINDINGS_MAX)
    : [];
  if (!flat && findings.length === 0) return null;
  return {
    ...((flat as Record<string, Json> | null) ?? {}),
    ...(findings.length ? { [FINDINGS_KEY]: findings.map(findingJson) } : {}),
  };
}

/** The words of a run's note for its drift (the runner adds a stop's own line after it). */
export function driftNote(drifted: number): string {
  return drifted === 1
    ? "1 host's storage sums differ from her items walked: Rebuild her on this card."
    : `${drifted.toLocaleString("en-US")} hosts' storage sums differ from their items walked: Rebuild each on this card.`;
}

/** What a re-check of one host found. */
export type Recheck =
  | { kind: "drifted"; host: DriftedHost }
  | { kind: "parity" }
  | { kind: "gone" };

/** Read the answer of `storage_sums_drift(uuidBefore(host), 1)` as the check of `host` alone. */
export function recheckOf(hostId: string, page: DriftPage): Recheck {
  const id = hostId.toLowerCase();
  // The call checks the first host after the one before hers: her, when she exists, and its full page names her.
  if (page.nextAfter !== id) return { kind: "gone" };
  const host = page.drifted.find((d) => d.hostId === id);
  return host ? { kind: "drifted", host } : { kind: "parity" };
}

/** What the operator's Rebuild answered (`rebuild_storage_sums`). */
export type RebuildAnswer =
  | { ok: true; before: Figures; after: Figures }
  | { ok: false; reason: "no_host" };

/** A Rebuild's row: the newest state with her taken off the list (or kept, if the check after it still reads a drift). */
export type RebuildOutcome = {
  status: "ok" | "error";
  counts: Json;
  note: string;
  /** She reads at parity after the Rebuild (or her account is gone): the card's list no longer names her. */
  settled: boolean;
};

function bytes(n: number): string {
  return `${n.toLocaleString("en-US")} B`;
}

function figuresLine(f: Figures): string {
  return `albums ${bytes(f.active)}, Deleted ${bytes(f.deleted)}, the system's ${bytes(f.system)}`;
}

/**
 * THE REBUILD'S RECORD, written as a closed manual run of the check (its card's newest row), so the card follows the
 * fix at once: the state the last run left, with her off the list when the check after the Rebuild reads her at parity
 * (or her account is gone), the pass's place and its stop carried as they stood, so the next night resumes where it
 * was. ERROR while any host stays named, so the bell rings until every drift it knows is fixed.
 */
export function rebuildOutcome(input: {
  state: StorageSumsState;
  hostId: string;
  answer: RebuildAnswer;
  recheck: Recheck;
  now: Date;
}): RebuildOutcome {
  const { state, hostId, answer, recheck, now } = input;
  const id = hostId.toLowerCase();
  const others = state.findings.filter((f) => f.host_id !== id);
  const earlier = state.findings.find((f) => f.host_id === id);
  const still =
    recheck.kind === "drifted"
      ? [findingOf(recheck.host, earlier?.since ?? now.toISOString())]
      : [];
  const { listed, unlisted } = listFindings([...others, ...still]);
  const drifted = listed.length + unlisted + state.unlisted;
  const settled = recheck.kind !== "drifted";

  const counts: Record<string, Json> = {
    [STORAGE_SUMS_KEYS.checked]: 1,
    [STORAGE_SUMS_KEYS.drifted]: drifted,
    [STORAGE_SUMS_KEYS.rebuiltHost]: id,
    [STORAGE_SUMS_KEYS.passChecked]: state.passChecked,
    [STORAGE_SUMS_KEYS.passComplete]: state.passComplete,
  };
  if (drifted > 0) counts.rows_failed = drifted;
  if (state.unlisted + unlisted > 0) {
    counts[STORAGE_SUMS_KEYS.unlisted] = state.unlisted + unlisted;
  }
  if (state.passStartedAt)
    counts[STORAGE_SUMS_KEYS.passStartedAt] = state.passStartedAt;
  if (state.lastPassAt) counts[STORAGE_SUMS_KEYS.lastPassAt] = state.lastPassAt;
  if (state.lastPassChecked !== null) {
    counts[STORAGE_SUMS_KEYS.lastPassChecked] = state.lastPassChecked;
  }
  if (state.resumeAfter) counts[RESUME_KEY] = state.resumeAfter;
  if (state.stoppedEarly) {
    counts.stopped_early = true;
    if (state.remaining !== null) counts.remaining = state.remaining;
  }
  if (listed.length) counts[FINDINGS_KEY] = listed.map(findingJson);

  const what = answer.ok
    ? `${figuresLine(answer.before)} before; ${figuresLine(answer.after)} after`
    : "no account holds her any more";
  const how =
    recheck.kind === "parity"
      ? "checked at once: her sums are the walk again"
      : recheck.kind === "gone"
        ? "she leaves the list"
        : "checked at once and still different from the walk: the sums' definitions disagree, not her rows (a bug: Sentry has both figures)";
  const left =
    drifted > 0
      ? ` ${drifted.toLocaleString("en-US")} ${drifted === 1 ? "host stays" : "hosts stay"} named.`
      : "";
  return {
    status: drifted > 0 ? "error" : "ok",
    counts,
    note: `Rebuilt ${id} at the operator's word (${what}); ${how}.${left}`.slice(
      0,
      500,
    ),
    settled,
  };
}
