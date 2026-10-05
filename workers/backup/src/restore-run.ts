/**
 * THE RESTORE'S PASS (durability-backups.md, "The restore"): the backup's lone copies, copied back into the primary
 * bucket on their own. The prune finds them (a backup key the primary lost while its row lives) and keeps them in the
 * lone copies' table (lone-store.ts); a pass takes them from there, a confirm batch at a time. PURE over its ports
 * (the two buckets, the app's confirm route, the table, a clock), so the tests drive it against fakes and the
 * Durable Object's alarm against the real bindings (restore-pass.ts).
 *
 * THREE GUARDS ON EVERY COPY, each on its own:
 *  - only a key a live row still names, asked of the app right before the batch (named.ts): never one the row no
 *    longer names, which nothing would ever reclaim;
 *  - never over an object that is there: a HEAD of the primary first, then the write itself conditional
 *    (`If-None-Match: *`, R2's binding refusing it with `null` when anything is stored at the key: the Workers API
 *    reference, "Conditional operations", read 2026-10-05), so an object put back since the HEAD is never overwritten;
 *  - within one conditional write's reach: R2 takes at most 5 GiB less 5 MiB in one put (the R2 limits page, read
 *    2026-10-05), and a multipart upload has no condition at all, so a larger object is never written by halves; it
 *    stays held, said key by key, for a copy by hand.
 *
 * ITS MODE IS ITS OWN (`RESTORE_MODE`): `on` copies, `off` does nothing at all, and anything else is a dry run that
 * asks and reads everything and copies nothing, so a var that is missing or mistyped can never write. Each key's
 * outcome is logged with its key (Workers Logs), and the pass's report says what it restored, what it could not and
 * why: a failed copy stays held for the next pass; a key too large, or gone from the backup too, closes the pass as an
 * error so the card never reads calm over it.
 */
import { type NamedAnswer, NAMED_BATCH } from "./named";

export type RestoreMode = "off" | "dryrun" | "on";

/** Only the literal "on" copies and only "off" stops it: anything else (unset included) is a dry run. */
export function restoreModeOf(raw: string | undefined): RestoreMode {
  if (raw === "on") return "on";
  if (raw === "off") return "off";
  return "dryrun";
}

/** R2's largest single write: 5 GiB less 5 MiB. A multipart upload's complete takes no condition. */
export const RESTORE_MAX_BYTES = 5 * 1024 ** 3 - 5 * 1024 ** 2;

/**
 * No new copy starts this long after the pass began. A Durable Object's alarm may run 15 minutes of wall time
 * (developers.cloudflare.com/workers/platform/limits, "Duration", read 2026-10-05): three left for the copy in flight
 * (the largest, near 5 GiB, streams inside Cloudflare in well under that), the table and the report.
 */
export const RESTORE_DEADLINE_MS = 12 * 60 * 1000;

/**
 * Keys one pass judges at most: four calls each at the most (two HEADs, a GET, the put), so a pass stays far inside
 * the invocation's subrequests. Past it the pass stops with a counted `remaining`; the next carries on.
 */
export const RESTORE_KEYS_PER_PASS = 2000;

/** The condition every copy is written under: store it only where nothing is stored (RFC 7232's `If-None-Match: *`). */
export function absentOnly(): Headers {
  return new Headers({ "if-none-match": "*" });
}

/** What a GET of the backup hands over. An `R2ObjectBody` is one as it stands. */
export type SourceObject = {
  size: number;
  body: ReadableStream;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
};

export interface RestoreSource {
  head(key: string): Promise<{ size: number } | null>;
  get(key: string): Promise<SourceObject | null>;
}

export type RestorePutOptions = {
  onlyIf: Headers;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
};

export interface RestoreTarget {
  head(key: string): Promise<unknown | null>;
  /** Null when the condition refused the write (an object is stored at the key). */
  put(
    key: string,
    body: ReadableStream,
    options: RestorePutOptions,
  ): Promise<unknown | null>;
}

export type RestorePorts = {
  backup: RestoreSource;
  primary: RestoreTarget;
  /** Which of these keys a live row still names (the app's confirm route). */
  named(keys: string[]): Promise<NamedAnswer>;
  /** The lone copies' table: the next keys after a cursor, in key order. */
  keys(after: string | null, limit: number): Promise<string[]> | string[];
  /** Drop the keys a batch resolved. */
  resolve(keys: string[]): Promise<void> | void;
  /** How many keys the table holds after a cursor: what a pass that stopped early left. */
  countAfter(after: string | null): Promise<number> | number;
  /** The wall clock the deadline is read from. */
  now(): number;
};

export type RestoreLimits = {
  deadlineMs: number;
  keysPerPass: number;
  batch: number;
  maxBytes: number;
};

export const RESTORE_LIMITS: RestoreLimits = {
  deadlineMs: RESTORE_DEADLINE_MS,
  keysPerPass: RESTORE_KEYS_PER_PASS,
  batch: NAMED_BATCH,
  maxBytes: RESTORE_MAX_BYTES,
};

export type RestoreOutcome =
  | "restored"
  | "would_restore"
  | "present"
  | "unnamed"
  | "failed"
  | "too_large"
  | "backup_missing";

/**
 * The outcomes that settle a key, so the table drops it: copied back; in the primary already (put back by another
 * hand, or the conditional write refused); named by no row now; gone from the backup too (nothing left to copy from).
 * A failed copy, a key too large and a dry run's keys stay held.
 */
const RESOLVES: ReadonlySet<RestoreOutcome> = new Set([
  "restored",
  "present",
  "unnamed",
  "backup_missing",
]);

export type RestoreInput = {
  mode: Exclude<RestoreMode, "off">;
  limits?: Partial<RestoreLimits>;
};

export type RestoreResult = {
  status: "ok" | "error";
  note: string;
  counts: Record<string, number | string | boolean>;
};

type Judged = { outcome: RestoreOutcome; bytes?: number; reason?: string };

export async function runRestore(
  ports: RestorePorts,
  input: RestoreInput,
): Promise<RestoreResult> {
  const limits: RestoreLimits = { ...RESTORE_LIMITS, ...input.limits };
  const live = input.mode === "on";
  const startMs = ports.now();
  const inTime = () => ports.now() - startMs < limits.deadlineMs;

  const n: Record<RestoreOutcome, number> = {
    restored: 0,
    would_restore: 0,
    present: 0,
    unnamed: 0,
    failed: 0,
    too_large: 0,
    backup_missing: 0,
  };
  let restoredBytes = 0;
  let checked = 0;
  let firstFailure: string | null = null;
  let unanswered: string | null = null;
  let stop: "deadline" | "cap" | null = null;
  let cursor: string | null = null;

  async function judge(key: string, named: boolean): Promise<Judged> {
    if (!named) return { outcome: "unnamed" };
    try {
      if (await ports.primary.head(key)) return { outcome: "present" };
      const head = await ports.backup.head(key);
      if (!head) return { outcome: "backup_missing" };
      if (head.size > limits.maxBytes) {
        return { outcome: "too_large", bytes: head.size };
      }
      if (!live) return { outcome: "would_restore", bytes: head.size };
      const source = await ports.backup.get(key);
      if (!source) return { outcome: "backup_missing" };
      let stored: unknown | null;
      try {
        stored = await ports.primary.put(key, source.body, {
          onlyIf: absentOnly(),
          httpMetadata: source.httpMetadata,
          customMetadata: source.customMetadata,
        });
      } catch (err) {
        // The body may be half read: let go of it, so the stream is not held open past a failure.
        await source.body.cancel().catch(() => {});
        throw err;
      }
      return stored
        ? { outcome: "restored", bytes: source.size }
        : { outcome: "present" };
    } catch (err) {
      return { outcome: "failed", reason: String(err).slice(0, 160) };
    }
  }

  outer: for (;;) {
    if (!inTime()) {
      stop = "deadline";
      break;
    }
    if (checked >= limits.keysPerPass) {
      stop = "cap";
      break;
    }
    const asked = Math.min(limits.batch, limits.keysPerPass - checked);
    const batch = await ports.keys(cursor, asked);
    if (batch.length === 0) break;
    const answer = await ports.named(batch);
    if (answer.kind === "unavailable") {
      unanswered = answer.detail;
      break;
    }
    const named = new Set(answer.named);
    const resolved: string[] = [];
    for (const key of batch) {
      if (!inTime()) {
        stop = "deadline";
        await ports.resolve(resolved);
        break outer;
      }
      checked += 1;
      const judged = await judge(key, named.has(key));
      n[judged.outcome] += 1;
      if (judged.outcome === "restored") restoredBytes += judged.bytes ?? 0;
      if (judged.outcome === "failed" && firstFailure === null) {
        firstFailure = judged.reason ?? "unknown";
      }
      logOutcome(key, judged, live);
      if (RESOLVES.has(judged.outcome)) resolved.push(key);
      cursor = key;
    }
    await ports.resolve(resolved);
    // A short page is the end of the table.
    if (batch.length < asked) break;
  }

  const remaining = stop ? await ports.countAfter(cursor) : 0;
  const counts: Record<string, number | string | boolean> = {
    restore_mode: input.mode,
  };
  if (stop && remaining > 0) {
    counts.remaining = remaining;
    counts.stopped_early = true;
  }
  if (live) {
    counts.restored = n.restored;
    if (restoredBytes > 0) counts.restored_bytes = restoredBytes;
  } else {
    counts.would_restore = n.would_restore;
  }
  counts.checked = checked;
  for (const key of [
    "failed",
    "too_large",
    "backup_missing",
    "present",
    "unnamed",
  ] as const) {
    if (n[key] > 0) counts[key] = n[key];
  }

  const couldNot = n.failed + n.too_large + n.backup_missing;
  const lines: string[] = [];
  if (checked === 0 && !unanswered) {
    lines.push("Nothing is held by the backup alone.");
  } else if (live) {
    lines.push(
      n.restored > 0
        ? `Restored ${fmt(n.restored)} ${keys(n.restored)} (${fmtBytes(restoredBytes)}) from the backup.`
        : "Restored nothing.",
    );
  } else {
    lines.push(
      `Dry run, copied nothing: ${fmt(n.would_restore)} ${keys(n.would_restore)} would be restored (RESTORE_MODE on copies them).`,
    );
  }
  // Second, so a long note's cut never takes it: what it could not do, and why.
  if (couldNot > 0) {
    const why: string[] = [];
    if (n.failed > 0) {
      why.push(
        `${fmt(n.failed)} failed to copy (${firstFailure}) and wait for the next pass`,
      );
    }
    if (n.too_large > 0) {
      why.push(
        `${fmt(n.too_large)} ${n.too_large === 1 ? "is" : "are"} over the ${fmtBytes(limits.maxBytes, "floor")} one conditional write takes, so copy ${n.too_large === 1 ? "it" : "them"} by hand`,
      );
    }
    if (n.backup_missing > 0) {
      why.push(
        `${fmt(n.backup_missing)} ${n.backup_missing === 1 ? "is" : "are"} gone from the backup too: ${n.backup_missing === 1 ? "its row names an object" : "their rows name objects"} neither bucket holds`,
      );
    }
    lines.push(
      `${fmt(couldNot)} could not be restored: ${why.join("; ")}. This pass's log names each.`,
    );
  }
  if (unanswered) {
    lines.push(
      `Could not ask the app which keys a live row names (${unanswered}), so it copied nothing more.`,
    );
  }
  if (n.present > 0) {
    lines.push(
      n.present === 1
        ? "1 was in the primary already, left as it is."
        : `${fmt(n.present)} were in the primary already, left as they are.`,
    );
  }
  if (n.unnamed > 0) {
    lines.push(
      `${fmt(n.unnamed)} ${n.unnamed === 1 ? "is" : "are"} named by no live row, so left alone.`,
    );
  }
  if (stop && remaining > 0) {
    lines.push(
      `Stopped at its ${stop === "deadline" ? "deadline" : `${fmt(limits.keysPerPass)} keys`} with ${fmt(remaining)} to go; the next pass carries on.`,
    );
  }

  return {
    status: couldNot > 0 || unanswered ? "error" : "ok",
    note: lines.join(" ").slice(0, 500),
    counts,
  };
}

/** Each key's outcome, with its key, in Workers Logs: the restore's own record of every copy it made or could not. */
function logOutcome(key: string, judged: Judged, live: boolean): void {
  const bytes = judged.bytes;
  switch (judged.outcome) {
    case "restored":
      console.log("restore: restored from the backup", { key, bytes });
      return;
    case "would_restore":
      console.log("restore: would restore (dry run)", { key, bytes, live });
      return;
    case "present":
      console.log("restore: in the primary already, left as it is", { key });
      return;
    case "unnamed":
      console.warn("restore: named by no live row, left alone", { key });
      return;
    case "too_large":
      console.error(
        "restore: over one conditional write's reach; copy it by hand",
        { key, bytes },
      );
      return;
    case "backup_missing":
      console.error("restore: gone from the backup too, nothing to copy", {
        key,
      });
      return;
    case "failed":
      console.error("restore: copy failed; held for the next pass", {
        key,
        reason: judged.reason,
      });
  }
}

function keys(count: number): string {
  return count === 1 ? "key" : "keys";
}

function fmt(count: number): string {
  return count.toLocaleString("en-US");
}

/**
 * Bytes in the 1,024 ladder the way the console prints them: one decimal to the nearest, or two cut down for a
 * ceiling, so the largest write reads 4.99 GB and never a 5 GB an object just under it would seem to pass.
 */
export function fmtBytes(
  bytes: number,
  round: "nearest" | "floor" = "nearest",
): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  if (!(bytes > 0)) return "0 B";
  const digits = round === "floor" ? 2 : 1;
  const cut = (v: number) =>
    round === "floor"
      ? Math.floor(v * 10 ** digits + 1e-9) / 10 ** digits
      : Number(v.toFixed(digits));
  let i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  let value = cut(bytes / 1024 ** i);
  if (value >= 1024 && i < units.length - 1) {
    i += 1;
    value = cut(bytes / 1024 ** i);
  }
  return `${Number.isInteger(value) ? value : value.toFixed(digits)} ${units[i]}`;
}
