/**
 * WHETHER ANYTHING WAITS IN AN ALBUM, KNOWN BEFORE THE FIRST PAINT (the-wait r1; crumbs-52's line, from red-team 43's
 * NIT: "a guest with none of her own shots on a sealed album still reads 'Add the first photo' ... while others' shots
 * wait"). The album's one Add says "the first photo" only over an album nothing has been added to, visible or waiting;
 * the page knows what is visible (`getGalleryStats`), and this says whether anything waits: a row held for the host, or
 * approved and sealed until the album develops. Her own are among them, so one read answers for her and for everyone.
 *
 * ★ A YES OR A NO, NEVER AN ID: the same fact the album's sync tells any guest at full access (`waiting.count`), asked
 * only where it decides anything (the page's guard: full access, an album that waits, nothing visible yet). On the
 * service role, as the guest path's reads are; it reads as a guest whoever asks (the predicate's app half,
 * `unsealedFilter`'s other side). A failed read is captured and answers no: the layout she had before this read.
 */
import "server-only";

import { nowIso } from "@/lib/disposable/seal";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

export async function albumWaits(eventId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("media")
    .select("id")
    .eq("event_id", eventId)
    // Held for the host, or approved and sealed now: what the sync counts as waiting.
    .or(`status.eq.pending,and(status.eq.approved,sealed_until.gt.${nowIso()})`)
    .limit(1);
  if (error) {
    captureError("db", error, { seam: "album_waits", eventId });
    return false;
  }
  return (data?.length ?? 0) > 0;
}
