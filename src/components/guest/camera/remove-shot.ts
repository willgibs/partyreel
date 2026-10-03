"use client";

/**
 * ONE OF HER SHOTS, TAKEN BACK (Will, 2026-10-02: "removing a dispo shot should free a shot slot to take another"):
 * the album Delete's own two paths, as her tracker takes one back (`upload-tracker.tsx`), so the server's rules are the
 * only rules: `remove_my_upload_by_session` for the device's ticket (`/api/guests/remove`), `remove_my_upload` for
 * her account (the page's Server Function, `getUser()` inside). A shot she withdraws frees its frame and is purged that
 * night (`docs/systems/disposable-mode.md`).
 *
 * ★ THE TICKET FIRST, THEN THE ACCOUNT. The camera does not know whether she is signed in, and needs not: a ticket the
 * claim stamped with her account answers 404 on the ticket's path (that row is the account's now), and the account's
 * path takes it; with no ticket on the device only the account's path can.
 */
import { removeMyUploadGuestAction } from "@/app/(guest)/e/[token]/actions";

export async function removeOwnShot(input: {
  qrToken: string;
  sessionToken: string | null;
  mediaId: string;
}): Promise<boolean> {
  if (input.sessionToken) {
    try {
      const res = await fetch("/api/guests/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The ticket in the BODY, never a URL (the read's own rule).
        body: JSON.stringify({
          qr_token: input.qrToken,
          session_token: input.sessionToken,
          media_id: input.mediaId,
        }),
      });
      if (res.ok) return true;
      // Anything but "not this ticket's" is a refusal the account's path would meet too.
      if (res.status !== 404) return false;
    } catch {
      return false;
    }
  }
  try {
    return (await removeMyUploadGuestAction(input.mediaId)).ok;
  } catch {
    return false;
  }
}
