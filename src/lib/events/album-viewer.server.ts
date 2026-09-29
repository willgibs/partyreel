/**
 * WHO IS ASKING, FOR THE GUEST ALBUM ROUTES: the event behind a link and the decision for this
 * viewer, resolved exactly as the gallery poll resolves it (`/api/guests/gallery`), so the paged
 * album's gates match today's by construction and no anon grant exists anywhere.
 *
 *  - The event through `get_event_by_qr_token` (the canonical capability; an unknown one is `gone`),
 *    then THE DOOR (`closed-door.server.ts`, with the body's ticket beside the cookie's and the
 *    account): a door that shuts this viewer out is `gone` too, and says nothing about why (a block,
 *    a decline, a closed door and Only me alike, with the same work); a door that holds her (the held
 *    door, the ask, a gate's newcomer) answers access `none` with nothing real behind it; a door that
 *    lets her through hands on the event as she meets it, with the pass its reads ask for.
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
import {
  doorCallerFor,
  isShut,
  resolveGuestDoor,
} from "@/lib/events/closed-door.server";
import {
  doorGalleryDecision,
  type GalleryDecision,
} from "@/lib/events/gallery-access";
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
  if (!event.ok) return { kind: "gone" };

  const cookieToken = await readGuestSessionCookie(event.data.id);
  const bodyToken = isSessionTokenShape(bodySessionToken)
    ? bodySessionToken
    : null;
  const door = await resolveGuestDoor(
    event.data,
    await doorCallerFor(event.data.id, { bodyTokens: [bodyToken] }),
  );
  if (isShut(door)) return { kind: "gone" };
  const met = door.event;

  // The demo is always full and nobody's (the gallery poll's own short-circuit).
  const isDemo = isDemoToken(qrToken);
  if (isDemo) {
    return {
      kind: "viewer",
      event: met,
      decision: { access: "full", gate: null },
      isDemo,
      heal: null,
    };
  }

  const heal =
    bodyToken && bodyToken !== cookieToken
      ? guestSessionCookieWrite(event.data.id, bodyToken)
      : null;
  // A door that holds her answers for the album: nothing real behind it.
  const held = doorGalleryDecision(door.decision);
  if (held) return { kind: "viewer", event: met, decision: held, isDemo, heal };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user?.email_confirmed_at);
  const isOwner = user
    ? await isEventOwner(event.data.id, user.id, supabase)
    : false;
  // Someone already in passes the password without it (the one rule for everyone already in).
  const admitted = door.decision.kind === "through" && door.decision.admitted;
  const unlocked =
    met.visibility === "password"
      ? admitted || (await isUnlocked(event.data.id))
      : true;

  const decision = await resolveViewerDecision(met, {
    isOwner,
    isAuthed,
    isUnlocked: unlocked,
    userId: user?.id ?? null,
    sessionToken: bodyToken ?? cookieToken,
  });
  return { kind: "viewer", event: met, decision, isDemo, heal };
}
