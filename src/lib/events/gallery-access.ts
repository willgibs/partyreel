/**
 * Server-side gallery access levels for the guest event page (`/e/[qr_token]`).
 *
 * The gated-gallery security core: an account-required (or password) event must NOT hand the full
 * album to an unauthenticated viewer. We resolve a viewer to one of three levels and enforce it
 * IDENTICALLY in the RSC and the gallery poll (the only two media surfaces), so withheld media never
 * leaves the server (it survives dev-tools / direct API calls, not a CSS blur over a loaded gallery).
 *
 * This module is PURE (no `server-only` import) so it stays unit-testable; the data loaders that touch
 * the admin client live in `gallery-access.server.ts`.
 */
import type { GuestEvent } from "@/lib/db/queries/guest-events";

export type GalleryAccess = "none" | "teaser" | "full";

// How many newest approved PHOTOS an un-gated viewer sees as the teaser (the rest are withheld
// server-side, surfaced only as a "+N more" count). Photos only: a teaser is a quick visual taste and
// video is heavier + Pro-gated. Tunable. NOTE: a gallery with <= TEASER_LIMIT photos shows them all to
// a teaser viewer (the gate still applies to upload + withholds any video); revisit the sizing in P2.
export const TEASER_LIMIT = 9;

/**
 * Resolve a viewer's access to an event's gallery. The SINGLE source of truth, called identically by
 * the RSC and the poll. `private` is handled by the caller BEFORE this (the RSC master-lock
 * early-return; the poll returns []), so this is only ever called for `open` / `password`.
 *
 * - owner (the host), or any viewer who already cleared every gate -> `full`
 * - password event, not yet unlocked -> `none` (no real teaser before the password is proven)
 * - verified-email event, viewer not signed in -> `teaser` (real photos, capped server-side)
 * - otherwise -> `full`
 *
 * ★ Keyed on `require_verified_email` since the identity reshape (2026-09-21). It replaces the
 * inverted read of `allow_anonymous_uploads` with the flag's own truth, and the switch's meaning
 * for the VIEW is unchanged: the host who asks for a proved email asks for it before the album as
 * well as before an upload. The two columns are held opposite by a DB trigger, so this is the same
 * decision expressed once, in the name the product now uses.
 */
export function resolveGalleryAccess(
  event: Pick<GuestEvent, "visibility" | "require_verified_email">,
  ctx: { isOwner: boolean; isAuthed: boolean; isUnlocked: boolean },
): GalleryAccess {
  if (ctx.isOwner) return "full";

  const accountRequired = event.require_verified_email;

  if (event.visibility === "password") {
    // Password is the FIRST gate: reveal nothing real until it's proven (privacy of a locked album).
    if (!ctx.isUnlocked) return "none";
    // Unlocked. If a verified email is ALSO required, an un-signed-in viewer still gets the teaser.
    return accountRequired && !ctx.isAuthed ? "teaser" : "full";
  }

  // open (private never reaches here)
  return accountRequired && !ctx.isAuthed ? "teaser" : "full";
}
