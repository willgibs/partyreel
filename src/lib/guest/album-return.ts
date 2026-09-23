/**
 * THE WAY BACK TO AN ALBUM AFTER A CONFIRM DOOR (guest by upload, 2026-09-22).
 *
 * Three doors on an album confirm a guest's email: the offer card under a first upload, the
 * Unverified mark on their own credit, and the header's name menu. Each one CLAIMS the guest's
 * uploads into the account (the claim brings the event with them: it becomes a Guest card on their
 * dashboard), and what should follow is the follow moment in the post-upload slot, whose payoff is
 * following the host. Two things make that land whichever way the guest confirmed:
 *
 * ★ THE MARKER, `pr_pending_offer_<qr_token>`. A code typed in place returns to the same page; a
 * Google round trip or a tapped magic link leaves the page entirely and comes back to a fresh mount
 * with no code of ours having run in between. So EVERY confirm door writes the marker the moment it
 * OPENS (before any redirect can happen), and the album page's mount-time claim consumes it: when
 * that claim moved this album's own uploads, the moment plays, with no upload needed this visit.
 *
 * ★ THE ALBUM ON SCREEN. The Unverified mark sits three modules deep under the album's grid, and a
 * like's door or the header's menu is a sibling island of the page; none of them should have to be
 * handed the album's token through modules that belong to other surfaces. The album page holds its
 * canonical token here for as long as it is mounted, so a door that names no album writes the
 * marker for the one on screen, and the claim knows which album's uploads it is carrying (and so
 * whether the follow moment is true). The same module-singleton shape `name-door.ts` and the stored
 * session use, for the same reason: sibling islands, and depth, with no common parent to pass a prop.
 *
 * Storage failures are swallowed on purpose: a blocked store loses only the redirect beat, never the
 * claim, and a nudge that cannot remember is better than a crash.
 */

let albumOnScreen: string | null = null;

/**
 * The album page registers its canonical `qr_token` while it is mounted (never a custom slug: every
 * key and claim on this page is keyed by the canonical token). Returns the release.
 */
export function holdAlbum(qrToken: string): () => void {
  albumOnScreen = qrToken;
  return () => {
    if (albumOnScreen === qrToken) albumOnScreen = null;
  };
}

/** The album on screen, or null anywhere else (the dashboard, a profile, the lab). */
export function currentAlbum(): string | null {
  return albumOnScreen;
}

export function pendingOfferKey(qrToken: string): string {
  return `pr_pending_offer_${qrToken}`;
}

/**
 * A confirm door is opening: remember it, so the beat after a confirmation is the same on every
 * path. Names the album explicitly where the door knows it, else the one on screen; with neither
 * (a door outside any album) there is no beat to land, and nothing is written.
 */
export function markPendingOffer(qrToken: string | null = albumOnScreen): void {
  if (!qrToken) return;
  try {
    localStorage.setItem(pendingOfferKey(qrToken), "1");
  } catch {
    // Blocked storage: see the module note.
  }
}

/** Take the marker if it is there: true for exactly one caller, and it is gone afterwards. */
export function takePendingOffer(qrToken: string): boolean {
  try {
    if (localStorage.getItem(pendingOfferKey(qrToken)) !== "1") return false;
    localStorage.removeItem(pendingOfferKey(qrToken));
    return true;
  } catch {
    return false;
  }
}
