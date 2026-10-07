/**
 * HER NEWEST PHOTOGRAPHS' PREVIEWS, FOR THE LIGHT OF HER PAGE'S INVITATION (`account-moments` r2, `invite=plate`): up to
 * six of the caller's own uploads (the host's own events' and her guest uploads alike, `get_my_uploads`), each as the
 * small preview the tiles draw, presigned on the server (raw keys never reach the browser, uploads-and-r2.md), and her seed.
 * The plate reads the colours off them on her own device (`components/app/dashboard/page-invite-read.ts`); nothing here
 * reads a picture.
 *
 * ★ PREVIEWS, NEVER ORIGINALS: a read of a megabyte original for a 32px sample is the cost the hub's light already refuses
 * (`event-hub-head-light.tsx`), so a photograph with no preview (an older upload) is passed over, and so is a clip. The
 * RPC is asked for more rows than are kept for that reason, and `limit` bounds it: a person with a thousand photographs
 * pays for eighteen rows and six signatures. ★ HERS ALONE: the function answers for `auth.uid()`, so nothing here names
 * anyone else.
 */
import "server-only";

import { seedFor } from "@/lib/avatar/seed";
import { presignDownload } from "@/lib/r2/presign";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/** How many photographs the plate's light is read from (the board's six, read as one strip). */
export const INVITE_LIGHT_PHOTOS = 6;

/** Rows asked of the RPC: clips and previewless uploads are passed over, so it is asked for more than are kept. */
const ASKED = 18;

/** What the plate needs and nothing more: the previews' links, and her colour (a hash, never her id). */
export type InviteLight = { photos: string[]; seed: string };

/** Her light's photographs and her seed; null where nobody is signed in. A failed read throws, for the caller to decide. */
export async function getInviteLight(): Promise<InviteLight | null> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_my_uploads", {
    p_limit: ASKED,
  });
  if (error) throw error;

  const keys = (data ?? [])
    .flatMap((row) =>
      row.type === "photo" && row.preview_key ? [row.preview_key] : [],
    )
    .slice(0, INVITE_LIGHT_PHOTOS);
  const photos = await Promise.all(
    keys.map((key) => presignDownload({ key, stable: true })),
  );
  return { photos, seed: seedFor(user.id) };
}
