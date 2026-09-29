/**
 * THE TYPED SEAM FOR 20260929140000 (triage-r2-wiring), UNTIL `types.ts` REGENERATES.
 *
 * `src/lib/db/types.ts` is generated from the live schema and never hand-edited, and the live schema gains the
 * migration's columns (`reports.kind` and its nine siblings, `media.purge_asked_at`) and functions
 * (`kept_media_ids`, `defer_kept_due_media`, `report_queue_facts`, `create_report`'s new parameters) only when
 * the Orchestrator applies it. Until then the typed client refuses to name them, so the lane reaches them
 * through these two doors, each answer read defensively by its caller. After the apply and the regen, every
 * caller moves to the typed client and this file goes (the handoff names it).
 */
import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/** What an RPC or a table call resolves to, read without the generated types. */
export type SeamResult<T = unknown> = {
  data: T | null;
  error: PostgrestError | null;
};

/** Call a function the generated types do not know yet. */
export function seamRpc<T = unknown>(
  admin: Admin,
  fn: string,
  args: Record<string, unknown>,
): PromiseLike<SeamResult<T>> {
  return (admin as unknown as SupabaseClient).rpc(fn, args) as PromiseLike<
    SeamResult<T>
  >;
}

/** A table the generated types know, with columns they do not (the migration's). */
export function seamFrom(admin: Admin, table: string) {
  return (admin as unknown as SupabaseClient).from(table);
}
