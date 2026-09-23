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

/**
 * WHICH DOOR STANDS IN FRONT OF THIS VIEWER (the door as three steps, Will 2026-09-21).
 *
 * The access LEVEL says how much media leaves the server; the GATE says why, and the guest door's
 * step machine (`lib/guest/entry-steps.ts`) reads it to pick the step. They are separate answers
 * because `teaser` now has two causes -- an unconfirmed email and an unmade contribution -- and a
 * level alone could no longer tell them apart.
 */
export type GalleryGate = "password" | "account" | "upload";

/** The whole server-side answer for one viewer: how much, and what stands in the way. */
export type GalleryDecision = {
  access: GalleryAccess;
  gate: GalleryGate | null;
};

// How many newest approved PHOTOS an un-gated viewer sees as the teaser (the rest are withheld
// server-side, surfaced only as a "+N more" count). Photos only: a teaser is a quick visual taste and
// video is heavier + Pro-gated. Tunable. NOTE: a gallery with <= TEASER_LIMIT photos shows them all to
// a teaser viewer (the gate still applies to upload + withholds any video); revisit the sizing in P2.
export const TEASER_LIMIT = 9;

/**
 * Resolve a viewer's decision for an event's gallery. The SINGLE source of truth, reached by the RSC
 * and the poll through `resolveViewerDecision` (gallery-access.server.ts). `private` is handled by
 * the caller BEFORE this (the RSC master-lock early-return; the poll returns []), so this is only
 * ever called for `open` / `password`.
 *
 * The order IS the door's order, and it is load-bearing:
 *   1. owner (the host) -> full. Everyone but the host is gated (Will: "everyone but the host").
 *   2. password event, not yet unlocked -> none / `password` (no real teaser before the password).
 *   3. verified emails required, viewer not confirmed -> teaser / `account`.
 *   4. an upload required, this viewer could make one and has not -> teaser / `upload`.
 *   5. otherwise -> full.
 *
 * ★ THE CONTEXT REQUIRES `hasContributed` AND `canContribute`, deliberately without defaults, and
 * `resolveGalleryAccess` was RETIRED rather than wrapped (2026-09-21) for the same reason: every
 * caller is a TYPE ERROR until it learns the gate. Two of them (`/api/export/guest` and
 * `/api/reel/download`) hand a viewer the real bytes, and a defaulted context would have let a held
 * guest zip every original.
 *
 * ★ `canContribute` IS THE FAIL-OPEN, AND IT IS THE SERVER'S. `accepting_uploads && !albumFull`: a
 * guest is never held at a step they could not pass, so an event with uploads closed, or a host
 * whose storage is full, opens the album instead (the same pair the presign ladder refuses
 * `cap_reached` on, carried verbatim by `get_upload_gate`).
 *
 * ★ AND THE EMPTY ALBUM HOLDS THE GATE (his to overrule): no count condition here. A host who asks
 * for a photo before the album is asking the first guest most of all, and "Nothing here yet. Add the
 * first photo and the album opens." is a truer first screen than an empty grid.
 */
export function resolveGalleryDecision(
  event: Pick<
    GuestEvent,
    "visibility" | "require_verified_email" | "require_upload_to_view"
  >,
  ctx: {
    isOwner: boolean;
    isAuthed: boolean;
    isUnlocked: boolean;
    /**
     * An upload of this viewer's counts (approved or held for review, and not removed by the viewer
     * themselves: a guest's own deletes close the album again, a host's removal never does).
     */
    hasContributed: boolean;
    /** This viewer COULD upload right now: uploads open and the album not full. */
    canContribute: boolean;
  },
): GalleryDecision {
  if (ctx.isOwner) return { access: "full", gate: null };

  if (event.visibility === "password" && !ctx.isUnlocked) {
    // Password is the FIRST gate: reveal nothing real until it is proven (the privacy of a locked album).
    return { access: "none", gate: "password" };
  }

  // ★ Keyed on `require_verified_email` since the identity reshape (2026-09-21). The host who asks
  // for a proved email asks for it before the album as well as before an upload.
  if (event.require_verified_email && !ctx.isAuthed) {
    return { access: "teaser", gate: "account" };
  }

  if (event.require_upload_to_view && ctx.canContribute && !ctx.hasContributed) {
    return { access: "teaser", gate: "upload" };
  }

  return { access: "full", gate: null };
}
