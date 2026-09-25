/**
 * The GUEST WRITE-PATH lock check (QA #18; uploads-and-r2.md, "A locked event gates UPLOADS, not just viewing") — the single policy source for
 * "may this request write past a password event's lock?", shared by all three guest write seams
 * (the /api/guests mint, presign, complete). Keep them on THIS helper: the read gate
 * (resolveGalleryAccess) grants `full` to an unlocked-cookie viewer OR the owner, and the write
 * gate must mirror it exactly or the owner's own /e/ page uploads break (the owner never sees the
 * password modal, so they never hold the cookie).
 *
 * `private` is deliberately NOT handled here: private refuses every guest write with no recovery
 * (the /e/ page master-locks everyone including the owner; owner uploads ride the host routes),
 * so the callers branch on it before consulting this.
 */
import "server-only";

import { isEventOwner } from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createClient } from "@/lib/supabase/server";

/**
 * True when the current request proved it may pass `eventId`'s password lock: the signed
 * per-event unlock cookie, or being the event's owner (verified via getUser(), never the spoofable
 * session decode). Fails closed on every missing piece. Only call for `visibility === "password"`;
 * for `open` it would waste the reads, and for `private` the answer must be "refuse" regardless.
 */
export async function mayUploadPastLock(eventId: string): Promise<boolean> {
  if (await isUnlocked(eventId)) return true;
  // Owner bypass, cookie-less: cheap and rare (only a locked password event reaches here, and the
  // anonymous majority short-circuits on the null user before any DB read).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return isEventOwner(eventId, user.id, supabase);
}
