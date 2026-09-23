"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { holdAlbum, takePendingOffer } from "@/lib/guest/album-return";
import {
  CLAIMED_TOAST,
  claimAnonymousUploads,
  onClaimed,
} from "@/lib/guest/claim-uploads";

/**
 * THE RETURN, ON THE ALBUM PAGE (guest by upload, 2026-09-22). One hook, mounted once by
 * `EventExperience`, owns everything the album does about a claim:
 *
 *   - it holds this album as the one on screen (`holdAlbum`), so a door three modules deep and a
 *     sibling island's claim both know which album they belong to;
 *   - it claims this browser's uploads at mount (a Google or magic-link confirmation comes back
 *     here signed in, with no code of ours having run since the door opened), silently;
 *   - it hears EVERY claim made on this page, whoever started it (a door's own onVerified, a like's
 *     sign-in, this mount), and decides what the album says about it:
 *       * the FOLLOW MOMENT, when a confirm door was opened from this album (its marker) AND the
 *         claim moved this album's own uploads. No upload is needed this visit: the moment is the
 *         capture's payoff (following the host, the host's benefit), and it closes the old gap
 *         where a full-reload return showed nothing until the guest's next upload;
 *       * the toast "We added your uploads to your account.", only when the claim reached OTHER
 *         events too. For this album's own uploads the moment already says it better, and a toast
 *         on top would stack two messages about one act.
 *
 * The marker is spent by the first claim that actually ran for this album, whatever it carried: a
 * door opened and abandoned is used up by the next real sign-in, never replayed weeks later.
 *
 * Returns whether the moment is due. `enabled` is false in the demo (nothing there is real) and for
 * the event's owner (the host is never their own guest).
 */
export function useConfirmReturn(qrToken: string, enabled: boolean): boolean {
  const [moment, setMoment] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const release = holdAlbum(qrToken);
    const stop = onClaimed((result) => {
      if (result.album !== qrToken) return;
      const opened = takePendingOffer(qrToken);
      if (opened && result.here > 0) setMoment(true);
      if (result.elsewhere > 0) toast.success(CLAIMED_TOAST);
    });
    void claimAnonymousUploads({ silent: true });
    return () => {
      stop();
      release();
    };
  }, [qrToken, enabled]);

  return moment;
}
