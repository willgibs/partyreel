"use server";

import {
  type InviteLight,
  getInviteLight,
} from "@/lib/db/queries/invite-light";
import { captureError } from "@/lib/observability/sentry";

/**
 * THE INVITATION'S LIGHT, ASKED FOR BY THE PLATE (`account-moments` r2, `invite=plate`): her newest photographs' previews
 * (presigned) and her seed, so the plate on `/me` and on the dashboard can read its light from her own photographs on her
 * own device (`components/app/dashboard/page-invite-read.ts`). A Server Function rather than props so the invitation's two
 * mount sites keep the call they always made, and so a view that never shows the plate asks nothing.
 *
 * ★ HERS ALONE: it takes no argument and reads the caller's own uploads (`get_my_uploads` is `auth.uid()`-scoped, and
 * `getInviteLight` returns null for nobody), so there is no identity to point it at. ★ A COURTESY, NEVER A GATE: a read that
 * fails answers null and is recorded, and the plate stands lit in the house's ember (a plate that never shows is worse).
 */
export async function readInviteLightAction(): Promise<InviteLight | null> {
  try {
    return await getInviteLight();
  } catch (error) {
    captureError("media", error, { seam: "invite_light_read" });
    return null;
  }
}
