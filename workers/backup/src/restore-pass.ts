/**
 * ONE RESTORE PASS, WIRED (durability-backups.md, "The restore"): what the prune's Durable Object runs when its alarm
 * fires (prune-state.ts). The engine is restore-run.ts; this is its heartbeat (the `backup_restore` job, its own card
 * and switch on /admin/jobs), its mode, its ports on the real bindings and the app's confirm route. Nothing here
 * imports `cloudflare:workers`, so the tests drive it with fake buckets and a stubbed fetch.
 *
 * POSTURE: it FAILS CLOSED on an unreachable app. It writes to the primary, and only after the app says which keys a
 * live row names, so with no app there is nothing it may write: the pass logs and stops, and the card's freshness
 * says so a day and a half on. Its every report carries the lone copies' count (`primary_missing`, the table's whole
 * tally after the pass), which the app reads beside the prune's, freshest first, so a restore that copied them all
 * back reads healthy at once rather than at the next weekly prune.
 */
import { jobFinish, jobStart } from "./job-heartbeat";
import type { LoneStore } from "./lone-store";
import { namedRequest, readNamedAnswer, type NamedAnswer } from "./named";
import { PRIMARY_MISSING_KEY } from "./prune-run";
import { restoreModeOf, runRestore, type RestorePorts } from "./restore-run";
import type { RestoreTrigger } from "./restore-schedule";

/** The catalog's id for the restore (src/app/admin/jobs/catalog.ts): its card, its switch, its heartbeat rows. */
export const RESTORE_JOB = "backup_restore";

/** The bindings and vars a pass reads. */
export type RestoreEnv = {
  PRIMARY: R2Bucket;
  BACKUP: R2Bucket;
  /** "on" copies, "off" does nothing, anything else (unset included) is a dry run (restore-run.ts). */
  RESTORE_MODE?: string;
  PRUNE_API_URL?: string;
  PRUNE_API_SECRET?: string;
};

/**
 * Ask the app which of these keys a live row still names (its confirm route's `loneKeys` shape, named.ts). Any
 * transport error, non-2xx or answer of the wrong shape is `unavailable`, which names nothing.
 */
export async function confirmNamed(
  env: Pick<RestoreEnv, "PRUNE_API_URL" | "PRUNE_API_SECRET">,
  keys: string[],
): Promise<NamedAnswer> {
  if (!env.PRUNE_API_URL || !env.PRUNE_API_SECRET) {
    return {
      kind: "unavailable",
      detail: "PRUNE_API_URL / PRUNE_API_SECRET not set",
    };
  }
  try {
    const res = await fetch(env.PRUNE_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.PRUNE_API_SECRET}`,
      },
      body: JSON.stringify(namedRequest(keys)),
    });
    if (!res.ok) {
      await res.body?.cancel();
      return { kind: "unavailable", detail: `HTTP ${res.status}` };
    }
    return readNamedAnswer(await res.json(), keys);
  } catch (err) {
    return { kind: "unavailable", detail: String(err).slice(0, 120) };
  }
}

export async function runRestorePass(
  env: RestoreEnv,
  store: LoneStore,
  trigger: RestoreTrigger,
): Promise<void> {
  if (!env.PRUNE_API_URL || !env.PRUNE_API_SECRET) {
    console.error("restore: PRUNE_API_URL / PRUNE_API_SECRET not set; no pass");
    return;
  }
  const gate = await jobStart(env, RESTORE_JOB, trigger);
  if (!gate.ok) {
    console.error(
      "restore: heartbeat unavailable; no pass (it asks the app before it writes)",
      { err: gate.error },
    );
    return;
  }
  if (gate.paused) {
    console.warn("restore: paused from /admin/jobs; skipped this pass");
    return;
  }

  const mode = restoreModeOf(env.RESTORE_MODE);
  if (mode === "off") {
    // Off still reports, skipped and carrying the count, so a switched-off restore never reads as a missed one and
    // the lone copies it is not copying back stay on the card.
    const held = store.tally().keys;
    await jobFinish(env, RESTORE_JOB, gate.run, {
      status: "skipped",
      counts: { restore_mode: "off", [PRIMARY_MISSING_KEY]: held },
      note:
        held > 0
          ? `RESTORE_MODE is off, so it copied nothing: ${held.toLocaleString("en-US")} keys stand held by the backup alone. Set it on, or copy each by hand from partyreel-backup into partyreel.`
          : "RESTORE_MODE is off, so it copied nothing; nothing is held by the backup alone.",
    });
    return;
  }

  try {
    const result = await runRestore(portsOf(env, store), { mode });
    await jobFinish(env, RESTORE_JOB, gate.run, {
      status: result.status,
      counts: { ...result.counts, [PRIMARY_MISSING_KEY]: store.tally().keys },
      note: result.note,
    });
  } catch (err) {
    // A throw here is the pass itself failing (the table, a page of keys), not a single copy: close the row as an
    // error so the card shows a failure rather than a pass stuck open.
    console.error("restore: pass failed", { err: String(err) });
    let held: number | null = null;
    try {
      held = store.tally().keys;
    } catch {
      // The table is what failed; the report says so without a count it could not read.
    }
    await jobFinish(env, RESTORE_JOB, gate.run, {
      status: "error",
      counts: {
        restore_mode: mode,
        ...(held === null ? {} : { [PRIMARY_MISSING_KEY]: held }),
      },
      note: String(err).slice(0, 300),
    });
  }
}

function portsOf(env: RestoreEnv, store: LoneStore): RestorePorts {
  return {
    backup: {
      head: (key) => env.BACKUP.head(key),
      get: (key) => env.BACKUP.get(key),
    },
    primary: {
      head: (key) => env.PRIMARY.head(key),
      put: (key, body, options) => env.PRIMARY.put(key, body, options),
    },
    named: (keys) => confirmNamed(env, keys),
    keys: (after, limit) => store.page(after, limit),
    resolve: (keys) => {
      store.resolve(keys);
    },
    countAfter: (after) => store.countAfter(after),
    now: () => Date.now(),
  };
}
