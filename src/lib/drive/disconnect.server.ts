/**
 * DISCONNECT A HOST'S GOOGLE DRIVE (drive-export.md, "Revoked at Google and deleted"): from Account, an operator's act
 * for an account's recovery, and account deletion (its request, then its sweep before the auth user goes).
 *
 * The row and its folders go first (`cloud_connection_disconnect`: her running sends end, her finished ones keep
 * their counts and lose every Google identifier), then the grant is revoked at Google, three tries. Google not
 * answering never keeps a key here: the row is already gone, and the words say so with the way to finish it herself
 * (myaccount.google.com/connections). Everything she sent stays in her Drive.
 */
import "server-only";

import { revokeToken } from "@/lib/drive/google";
import { tokenKeys } from "@/lib/drive/service.server";
import { openToken } from "@/lib/drive/tokens.server";
import { disconnectConnection } from "@/lib/db/queries/drive";
import { captureError } from "@/lib/observability/sentry";

export type DisconnectResult = {
  /** There was a connection to end. */
  found: boolean;
  /** Google confirmed the grant is gone (or already was). False: our key is deleted, hers to remove at Google too. */
  revoked: boolean;
  /** Sends that were still going and stopped. */
  ended: number;
};

export async function disconnectDrive(userId: string): Promise<DisconnectResult> {
  const r = await disconnectConnection(userId);
  if (!r.found) return { found: false, revoked: true, ended: 0 };
  let revoked = false;
  try {
    const keys = tokenKeys();
    const ctx = { userId, provider: "google_drive" as const };
    // The refresh token revokes the whole grant; the access token is the fallback where only it opens.
    const token =
      openToken(r.refreshCt, { ...ctx, purpose: "refresh" }, keys) ?? openToken(r.accessCt, { ...ctx, purpose: "access" }, keys);
    revoked = token ? await revokeToken(token) : false;
  } catch (e) {
    captureError("export", e, { action: "drive_disconnect_revoke" });
  }
  return { found: true, revoked, ended: r.ended };
}
