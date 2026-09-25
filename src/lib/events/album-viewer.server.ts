/**
 * WHO IS ASKING, FOR THE GUEST ALBUM ROUTES: the event behind a link and the decision for this
 * viewer, resolved exactly as the gallery poll resolves it (`/api/guests/gallery`), so the paged
 * album's gates match today's by construction and no anon grant exists anywhere.
 *
 *  - The event through `get_event_by_qr_token` (the canonical capability; a private or unknown one
 *    is `gone`, and says nothing about which).
 *  - The viewer through `getUser()`, never `getSession()`: a CONFIRMED email is `isAuthed`, and the
 *    owner is matched on `host_id` explicitly (`isEventOwner`).
 *  - The unlock cookie for a password album, and the guest's identity from the body's session token
 *    or the `pr_guest_<eventId>` cookie (the body wins as the identity to resolve with).
 *  - Then `resolveViewerDecision`, the one server entry for "what does this viewer get".
 *
 * ★ THE HEAL IS REPORTED, NEVER APPLIED, HERE. A body token that differs from the cookie is the
 * sync route's to write (and a response that writes it must carry no validator: gallery poll's
 * note on Vercel's edge). The links and manifest routes resolve with it and write nothing.
 */
import "server-only";

import {
  getEventByQrToken,
  type GuestEvent,
} from "@/lib/db/queries/guest-events";
import { isDemoToken } from "@/lib/demo";
import type { GalleryDecision } from "@/lib/events/gallery-access";
import {
  isEventOwner,
  resolveViewerDecision,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import {
  guestSessionCookieWrite,
  isSessionTokenShape,
  readGuestSessionCookie,
  type GuestCookieWrite,
} from "@/lib/guest/session-cookie";
import { createClient } from "@/lib/supabase/server";

export type AlbumViewer =
  | { kind: "gone" }
  | {
      kind: "viewer";
      event: GuestEvent;
      decision: GalleryDecision;
      isDemo: boolean;
      /** The cookie a differing body token would write; null when there is nothing to heal. */
      heal: GuestCookieWrite | null;
    };

export async function resolveAlbumViewer(
  qrToken: string,
  bodySessionToken: unknown,
): Promise<AlbumViewer> {
  const event = await getEventByQrToken(qrToken);
  if (!event.ok || event.data.visibility === "private") return { kind: "gone" };

  // The demo is always full and nobody's (the gallery poll's own short-circuit).
  const isDemo = isDemoToken(qrToken);
  if (isDemo) {
    return {
      kind: "viewer",
      event: event.data,
      decision: { access: "full", gate: null },
      isDemo,
      heal: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user?.email_confirmed_at);
  const isOwner = user
    ? await isEventOwner(event.data.id, user.id, supabase)
    : false;
  const unlocked =
    event.data.visibility === "password"
      ? await isUnlocked(event.data.id)
      : true;

  const cookieToken = await readGuestSessionCookie(event.data.id);
  const bodyToken = isSessionTokenShape(bodySessionToken)
    ? bodySessionToken
    : null;
  const decision = await resolveViewerDecision(event.data, {
    isOwner,
    isAuthed,
    isUnlocked: unlocked,
    userId: user?.id ?? null,
    sessionToken: bodyToken ?? cookieToken,
  });
  const heal =
    bodyToken && bodyToken !== cookieToken
      ? guestSessionCookieWrite(event.data.id, bodyToken)
      : null;
  return { kind: "viewer", event: event.data, decision, isDemo, heal };
}
