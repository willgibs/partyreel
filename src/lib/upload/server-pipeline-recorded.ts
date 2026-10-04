/**
 * ★ THE ROW A COMPLETE MAY ALREADY HAVE (crumbs-62, red-team 49's LOW): the one read the complete makes before it moves
 * a byte, and again before it takes one back out (`server-pipeline.ts`). A complete comes again for an upload already
 * recorded whenever its first answer was lost (a phone retries such a request), and anyone may send one for an upload
 * whose key they know (a tile's link names it), with any ticket or none worth the name: so the media row, read by the
 * id the key is bound to, answers first, and a refusal never takes back out a file a row names.
 *
 * Read on the admin client, by id alone: the guest's complete is anonymous (its capability is a body token the RPCs
 * validate), so no caller's role reads `media`, and nothing of the row leaves the server but the word "recorded".
 */
import "server-only";

/** An upload recorded under its media id: the original's key it was recorded with. */
export type RecordedUpload = { originalKey: string };

/**
 * The upload recorded under `mediaId`, or null when no row holds it. ★ It THROWS when the read fails, so a caller that
 * cannot tell never acts as though there were none (the engine then lands as it always did, and takes nothing back
 * out).
 */
export async function readRecordedUpload(
  mediaId: string,
): Promise<RecordedUpload | null> {
  // Loaded here, never at the engine's import (the meter's posture): the presign shares the engine and never reads it.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data, error } = await createAdminClient()
    .from("media")
    .select("id, original_key")
    .eq("id", mediaId)
    .maybeSingle();
  if (error) throw new Error(`media read: ${error.code} ${error.message}`);
  // Read defensively, as everything off a wire is: only a row with the key it was recorded with is one.
  if (!data || typeof data.original_key !== "string") return null;
  return { originalKey: data.original_key };
}
