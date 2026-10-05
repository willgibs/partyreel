/**
 * Where the prune keeps its memory between runs: one SQLite-backed Durable Object, created by the Worker's own deploy
 * (wrangler.jsonc's `migrations`). The Worker cannot reach the database, and the job heartbeat's endpoint answers
 * nothing back, so the run's memory lives beside the run. It holds three things:
 *
 *  - THE LEDGER (prune-ledger.ts): one small record, a get and a put. What it means, and what a damaged one falls
 *    back to, is decided there under test.
 *  - THE LONE COPIES (lone-store.ts): a table of every key the backup alone holds, carried across a pass. A prune run
 *    settles its range into it at its end; a restore pass drops what it resolves. Each change is one transaction
 *    here, so the two never overwrite each other.
 *  - THE RESTORE'S CLOCK (restore-schedule.ts): a restore pass is this object's alarm, so it has an invocation and a
 *    15-minute budget of its own whoever asked for it (the daily cron, the prune's end, an operator's Restore now
 *    through the Worker's door). The pass itself is restore-pass.ts.
 *  - THE RECONCILE'S LEDGER (reconcile-ledger.ts): its cursor through the two listings, its pass and its last whole
 *    pass, a get and a put beside the prune's; and its young lone copies, settled into the same table on the young
 *    side of the gate (lone-store.ts), so the prune's walk and the reconcile's never drop each other's keys.
 *
 * The class keeps its name (a rename is a migration of its own): it holds the backup Worker's memory, not the prune's
 * alone. Only index.ts imports this module (the tests run in plain Node, and `cloudflare:workers` exists only in the
 * Workers runtime); everything it decides lives in modules the tests drive.
 */
import { DurableObject } from "cloudflare:workers";

import { createLoneStore, type LoneStore, type LoneWalk } from "./lone-store";
import { runRestorePass, type RestoreEnv } from "./restore-pass";
import {
  decideRestoreRequest,
  readTime,
  readTrigger,
  strongerTrigger,
  type RestoreRequestState,
  type RestoreTrigger,
} from "./restore-schedule";

const LEDGER_KEY = "ledger";
/** The reconcile's ledger: a key of its own, so neither job's record can overwrite the other's. */
const RECONCILE_KEY = "reconcile_ledger";
/** The trigger the next alarm's pass reports under. */
const TRIGGER_KEY = "restore_trigger";
/** When the pass in flight began (epoch ms), absent between passes. */
const RUNNING_KEY = "restore_running_since";
/** A request that came while a pass ran: the pass that follows it. */
const AGAIN_KEY = "restore_again";

export class PruneState extends DurableObject<RestoreEnv> {
  private readonly lone: LoneStore = createLoneStore(
    this.ctx.storage.sql,
    (fn) => this.ctx.storage.transactionSync(fn),
  );

  /** The stored ledger as it was written, or null before the first run. Parsed by the caller, never trusted. */
  async load(): Promise<unknown> {
    return (await this.ctx.storage.get(LEDGER_KEY)) ?? null;
  }

  async save(ledger: unknown): Promise<void> {
    await this.ctx.storage.put(LEDGER_KEY, ledger);
  }

  /**
   * A prune run's range, settled into the lone copies (null: a run that settled nothing, which only reads the count):
   * answers how many keys the whole backup holds alone after it.
   */
  async recordLone(walk: LoneWalk | null): Promise<number> {
    return walk
      ? this.lone.walk(walk, Date.now()).keys
      : this.lone.tally().keys;
  }

  /** The reconcile's stored ledger, or null before its first run. Parsed by the caller, never trusted. */
  async loadReconcile(): Promise<unknown> {
    return (await this.ctx.storage.get(RECONCILE_KEY)) ?? null;
  }

  async saveReconcile(ledger: unknown): Promise<void> {
    await this.ctx.storage.put(RECONCILE_KEY, ledger);
  }

  /**
   * A reconcile run's range, settled on its side of the gate (null: settles nothing, reads the count): the whole
   * backup's count after it, and how many keys were new to the table (a restore pass is then worth asking for).
   */
  async settleLone(
    walk: LoneWalk | null,
  ): Promise<{ held: number; added: number }> {
    if (!walk) return { held: this.lone.tally().keys, added: 0 };
    const after = this.lone.settle(walk, Date.now());
    return { held: after.keys, added: after.added };
  }

  /** Ask for a restore pass: now, or joining one set, or following the one in flight. */
  async requestRestore(
    trigger: RestoreTrigger,
  ): Promise<{ state: RestoreRequestState }> {
    const storage = this.ctx.storage;
    const nowMs = Date.now();
    const runningSinceMs = readTime(await storage.get(RUNNING_KEY));
    const state = decideRestoreRequest({
      nowMs,
      runningSinceMs,
      alarmAtMs: await storage.getAlarm(),
    });
    if (state === "running") {
      await storage.put(
        AGAIN_KEY,
        strongerTrigger(readTrigger(await storage.get(AGAIN_KEY)), trigger),
      );
      return { state };
    }
    await storage.put(
      TRIGGER_KEY,
      strongerTrigger(
        state === "queued" ? readTrigger(await storage.get(TRIGGER_KEY)) : null,
        trigger,
      ),
    );
    if (state === "started") {
      // A pass still marked running past any alarm's reach died mid-way: it no longer blocks this one.
      if (runningSinceMs !== null) await storage.delete(RUNNING_KEY);
      await storage.setAlarm(nowMs);
    }
    return { state };
  }

  /**
   * The restore pass. It never throws: an alarm that throws is retried by the platform, and a pass is safe to run
   * again but not worth running twice for one failure; the pass reports its own errors on its card.
   */
  async alarm(): Promise<void> {
    const storage = this.ctx.storage;
    const trigger = readTrigger(await storage.get(TRIGGER_KEY)) ?? "schedule";
    await storage.delete(TRIGGER_KEY);
    await storage.put(RUNNING_KEY, Date.now());
    try {
      await runRestorePass(this.env, this.lone, trigger);
    } catch (err) {
      console.error("restore: the pass threw", { err: String(err) });
    } finally {
      await storage.delete(RUNNING_KEY);
      const again = readTrigger(await storage.get(AGAIN_KEY));
      if (again) {
        await storage.delete(AGAIN_KEY);
        await storage.put(TRIGGER_KEY, again);
        await storage.setAlarm(Date.now() + 1000);
      }
    }
  }
}

/** The one instance every run talks to. */
export const PRUNE_STATE_NAME = "backup_prune";
