/**
 * THE ALBUM'S BULK LIKE, ONE CALL A BATCH (`like_many`, migration 20260926300000).
 *
 * WHY. Select mode can take the whole album at once (every manifest id), and the bulk Like used to
 * fire one `like_media` request per selected id, all at once: a 1,145-photo album selected was
 * 1,145 parallel requests. `like_many` takes a batch of ids in the POST body and likes each through
 * `like_media` inside the database, so the same selection is one request per `MAX_BULK_ITEMS`.
 *
 * ★ A REFUSAL IS PER ID, AND SO IS THE REVERT. The function answers the ids `like_media` refused
 * (not approved, removed, an album the caller cannot see), so the caller reverts exactly those
 * hearts; a batch whose request failed outright (the network, a refusal of the whole call) reports
 * every id in it, and the caller reverts those. Nothing is ever reported liked that was not.
 *
 * Client-safe: it takes whichever Supabase client the caller holds (the browser's, in the likes
 * provider), and the function itself authorizes on `auth.uid()`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";

/** `like_many`'s answer, read defensively: the refused ids, or null when the answer is not one. */
export function parseLikeManyFailed(json: unknown): string[] | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as { ok?: unknown; failed?: unknown };
  if (o.ok !== true || !Array.isArray(o.failed)) return null;
  return o.failed.filter((id): id is string => typeof id === "string");
}

/**
 * Like every id, in consecutive batches of at most `MAX_BULK_ITEMS`, one `like_many` call each.
 * Resolves to the ids that did NOT end up liked (empty when every one did).
 */
export async function likeManyInBatches(
  supabase: Pick<SupabaseClient<Database>, "rpc">,
  ids: readonly string[],
): Promise<Set<string>> {
  const failed = new Set<string>();
  for (let start = 0; start < ids.length; start += MAX_BULK_ITEMS) {
    const batch = ids.slice(start, start + MAX_BULK_ITEMS);
    let refused: string[] | null = null;
    try {
      const { data, error } = await supabase.rpc("like_many", {
        p_media_ids: batch,
      });
      refused = error ? null : parseLikeManyFailed(data);
    } catch {
      refused = null;
    }
    // A request that failed, or an answer that is not one, liked nothing we can vouch for.
    for (const id of refused ?? batch) failed.add(id);
  }
  return failed;
}
