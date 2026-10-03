/**
 * THE PHONE-SIZE COPIES OF ROWS A ROUTE HAS ALREADY AUTHORIZED (take-home r1): a photograph's 2048 px JPEG and
 * its bytes, by media id, for the take-home routes' sizes and links. Read on the admin client (no client role
 * holds `phone_key` or `phone_bytes`, 20261003110000), and only ever for ids the calling route's own access read
 * returned, so it widens nothing: a guest's ids are her album's visible rows, a host's her own event's.
 *
 * `IN_CHUNK` ids a request (`inChunks`), so an album of any size is read whole and no URL outgrows its limit.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mustQuery, QueryFailedError } from "@/lib/db/must-query";
import { inChunks } from "@/lib/db/read-all";
import type { Database } from "@/lib/db/types";
import { captureError } from "@/lib/observability/sentry";

type Admin = SupabaseClient<Database>;

/** One photograph's phone-size copy: its key and its bytes. */
export type PhoneCopyRow = { key: string; bytes: number };

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: the two columns arrive with migration 20261003110000. The rows are
 * typed here, and a database without the columns yet (42703) answers that no photograph has a copy, captured, so
 * a Save or a Download before the migration lands serves the originals rather than failing; drop the fallback and
 * the override once `src/lib/db/types.ts` knows the columns.
 */
export async function readPhoneCopies(
  admin: Admin,
  ids: readonly string[],
): Promise<Map<string, PhoneCopyRow>> {
  try {
    const rows = await inChunks("export: phone copies", ids, async (chunk) =>
      (
        (await mustQuery(
          admin
            .from("media")
            .select("id, phone_key, phone_bytes")
            .in("id", chunk)
            .overrideTypes<
              {
                id: string;
                phone_key: string | null;
                phone_bytes: number | null;
              }[],
              { merge: false }
            >(),
          "export: phone copies",
        )) ?? []
      ).filter((row) => row.phone_key !== null && row.phone_bytes !== null),
    );
    return new Map(
      rows.map((row) => [
        row.id,
        { key: row.phone_key as string, bytes: Number(row.phone_bytes) },
      ]),
    );
  } catch (error) {
    if (error instanceof QueryFailedError && error.code === "42703") {
      captureError("export", error, { seam: "phone_schema_missing" });
      return new Map();
    }
    throw error;
  }
}
