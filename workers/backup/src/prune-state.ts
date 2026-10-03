/**
 * Where the prune keeps its ledger between runs (prune-ledger.ts): one SQLite-backed Durable Object, created by the
 * Worker's own deploy (wrangler.jsonc's `migrations`), holding one small record. The Worker cannot reach the
 * database, and the job heartbeat's endpoint answers nothing back, so the run's memory lives beside the run.
 *
 * Deliberately a get and a put: what the record means, and what a damaged one falls back to, is decided in
 * prune-ledger.ts under test. Only index.ts imports this module (the tests run in plain Node, and
 * `cloudflare:workers` exists only in the Workers runtime).
 */
import { DurableObject } from "cloudflare:workers";

const LEDGER_KEY = "ledger";

export class PruneState extends DurableObject {
  /** The stored ledger as it was written, or null before the first run. Parsed by the caller, never trusted. */
  async load(): Promise<unknown> {
    return (await this.ctx.storage.get(LEDGER_KEY)) ?? null;
  }

  async save(ledger: unknown): Promise<void> {
    await this.ctx.storage.put(LEDGER_KEY, ledger);
  }
}

/** The one instance every run talks to. */
export const PRUNE_STATE_NAME = "backup_prune";
