"use client";

import { useEffect, useState } from "react";

import { holdAlbum, takePendingOffer } from "@/lib/guest/album-return";
import { claimAnonymousUploads, onClaimed } from "@/lib/guest/claim-uploads";
import {
  lastClaimPlayedMoment,
  recordMomentPlayed,
  reportConfirmBeat,
} from "@/lib/guest/confirm-beat";

/**
 * THE RETURN, ON THE ALBUM PAGE. One hook, mounted once by `EventExperience`, owns everything the
 * album does about a claim:
 *
 *   - it holds this album as the one on screen (`holdAlbum`), so a door three modules deep and a
 *     sibling island's claim both know which album they belong to;
 *   - it claims this browser's uploads at mount (a Google or magic-link confirmation comes back
 *     here signed in, with no code of ours having run since the door opened), silently;
 *   - it hears EVERY claim made on this page, whoever started it (a door's own onVerified, a like's
 *     sign-in, this mount), and decides whether it plays the FOLLOW MOMENT: a confirm door was
 *     opened from this album (its marker) AND the claim moved this album's own uploads. No upload is
 *     needed this visit: the moment is the capture's payoff (following the host, the host's
 *     benefit), so a full-reload return meets it at once rather than at the guest's next upload.
 *
 * ★ ONE BEAT PER CONFIRMATION (`confirm-beat.ts`): when the moment plays, its card says the other
 * events too (`elsewhere`, returned here), so nothing toasts; when it does not, the door that
 * confirmed reports its beat and the page says it once. The mount's own claim (a full-reload return)
 * has no door behind it, so this hook reports that one itself.
 *
 * The marker is spent by the first claim that actually ran for this album, whatever it carried: a
 * door opened and abandoned is used up by the next real sign-in, never replayed weeks later.
 *
 * `enabled` is false in the demo (nothing there is real) and for the event's owner (the host is
 * never their own guest).
 */
export function useConfirmReturn(
  qrToken: string,
  enabled: boolean,
): { moment: boolean; elsewhere: number } {
  const [beat, setBeat] = useState({ moment: false, elsewhere: 0 });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const release = holdAlbum(qrToken);
    const stop = onClaimed((result) => {
      if (result.album !== qrToken) return;
      const opened = takePendingOffer(qrToken);
      const played = opened && result.here > 0;
      // Recorded INSIDE the claim, so a door awaiting it reads the answer the moment it resolves.
      recordMomentPlayed(qrToken, played);
      if (played) setBeat({ moment: true, elsewhere: result.elsewhere });
    });
    void claimAnonymousUploads({ silent: true }).then((result) => {
      // A remount (StrictMode's, or a real one) hears the same shared claim: only the live mount
      // reports it, so the beat is said once.
      if (!active || !result || result.album !== qrToken) return;
      if (lastClaimPlayedMoment(qrToken)) return;
      if (result.elsewhere > 0) {
        reportConfirmBeat({
          album: qrToken,
          name: null,
          elsewhere: result.elsewhere,
        });
      }
    });
    return () => {
      active = false;
      stop();
      release();
    };
  }, [qrToken, enabled]);

  return beat;
}
