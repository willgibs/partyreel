"use server";

/**
 * ACCOUNT'S DISCONNECT (the Google Drive card): `getUser()` first, then the one disconnect (`disconnect.server.ts`):
 * the row and its folders go, her running sends end, the grant is revoked at Google (three tries). Answers whether
 * Google confirmed it, so the card can say "to be sure, remove Partyreel in your Google account" when it did not.
 */
import { revalidatePath } from "next/cache";

import { disconnectDrive } from "@/lib/drive/disconnect.server";
import { captureError } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";

export type DisconnectAnswer =
  | { ok: true; revoked: boolean; ended: number }
  | { ok: false; message: string };

export async function disconnectDriveAction(): Promise<DisconnectAnswer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in again to disconnect." };
  try {
    const r = await disconnectDrive(user.id);
    revalidatePath("/account");
    return { ok: true, revoked: r.revoked, ended: r.ended };
  } catch (e) {
    captureError("export", e, { action: "drive_disconnect" });
    return { ok: false, message: "Couldn't disconnect just now. Please try again." };
  }
}
