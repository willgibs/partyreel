/**
 * The live reel's platform lever (`ops_flags.live_reel_enabled`), read for the admin switch beside
 * "Download all" (reel-teardown). The guest-facing read of this same row (`getLiveReelServerFacts`,
 * `db/queries/guest-events-admin.ts`) is event-scoped, cached 30s and fails OPEN by design — right
 * for a gallery poll, wrong for an operator control: this one is a direct, honest read via
 * `mustQuery`, mirroring `getReelRenderEnabled` (deleted with `/admin/reels`) and `getExportEnabled`
 * exactly, so a stale admin toggle can never happen twice.
 */
import "server-only";

import { mustQuery } from "@/lib/db/must-query";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getLiveReelEnabled(): Promise<boolean> {
  const admin = createAdminClient();
  // mustQuery is load-bearing here: without it an unreachable ops_flags row reads as `undefined` and
  // the `?? true` silently RE-ENABLES a lever an operator deliberately switched off.
  const row = await mustQuery(
    admin
      .from("ops_flags")
      .select("enabled")
      .eq("key", "live_reel_enabled")
      .maybeSingle(),
    "admin/exports: live reel lever",
  );
  return row?.enabled ?? true;
}
