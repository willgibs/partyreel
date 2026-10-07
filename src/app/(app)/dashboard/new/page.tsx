import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  type CreateLike,
  CreateEventWizard,
} from "@/components/app/create-event-wizard";
import {
  LIKE_COOKIE,
  likeOf,
  likeToken,
} from "@/components/app/create-event-wizard/like";
import {
  DEFAULT_TIER,
  effectiveStorageCap,
  MAX_EVENTS,
  TIER_NAMES,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import { countActiveEvents, listEvents } from "@/lib/db/queries/events";
import { getProfile } from "@/lib/db/queries/profile";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { isShut, pageDoor } from "@/lib/events/closed-door.server";
import { storageUsedPct } from "@/lib/events/readiness";
import { captureError } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";
import { needsDisplayName } from "@/lib/welcome";

export const metadata: Metadata = { title: "New event" };

/**
 * Create is a room of its own, dark in both themes (create-wizard r1 `shape=screen`), so the browser's
 * own bar wears the room's ground too, whatever the session's theme: `#040405` is the sRGB of the
 * room's `--background` (the root layout's dark entry says the same).
 */
export const viewport: Viewport = { themeColor: "#040405" };

// The create route (the `first-event` board's wiring, 2026-09-21; the room, create-wizard r2). The
// (app) layout already gated on getUser(), so reads here are the signed-in host's.
//
// ★ STILL NO at-cap REDIRECT HERE — AND NOW A DOOR INSTEAD. Creating an event
// puts a Free host AT their cap, and a Server Action refreshes the route it was
// called from, so an at-cap `redirect("/dashboard")` fires on that POST-CREATE
// refresh and bounces the host away BEFORE the wizard's beat can render (this
// actually shipped and was caught in live testing). Will's `limit=door` asks for
// the refusal to arrive up front rather than after the work, which is a
// RENDERING decision rather than a redirect: the cap facts go to the island,
// which SNAPSHOTS them at mount so that same post-create refresh cannot swap the
// beat for the door. The server's `enforce_event_limit` trigger stays the guard
// behind both (the wizard holds its beat on `limit_reached`, with Upgrade).
//
// The page draws nothing of its own around the room: the room is the whole screen, and its close is the
// way back to the events.
//
// ★ MAKE ONE LIKE THIS (after-party r1's `bridge=end`, `create-event-wizard/like.ts`): an album's token, on the address
// (`?like=`) or carried through her sign-up by the like door's cookie, opens Create in that album's style. It is read
// through the album's own read AND ITS DOOR, as the visitor she is (`pageDoor`, the guest page's own answer), so an
// album whose door shuts her out lends nothing, and what crosses to the island is the style alone (`likeOf`): never
// the album's name, date, guests or photographs. Read only past the gates below (a nameless account names itself
// first, a host at her cap meets the door), and a read that fails is no like, filed, never the page.
async function readLike(token: string | null): Promise<CreateLike | null> {
  if (!token) return null;
  try {
    const door = await pageDoor(token);
    if (!door || isShut(door)) return null;
    return likeOf(door.event);
  } catch (error: unknown) {
    captureError("db", error, { seam: "create_like" });
    return null;
  }
}

export default async function NewEventPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise.
  searchParams: Promise<{ like?: string | string[] }>;
}) {
  const [profile, siteUrl, eventCount, storage, jar, params] =
    await Promise.all([
      getProfile(),
      getSiteUrl(),
      countActiveEvents(),
      // The beat's room line (create-wizard r2's carried `room`), the dashboard meter's own read. ★ IT IS
      // NEVER WORTH THE PAGE: a failed read leaves room out of what is left (the quiet direction; the
      // dashboard's meter still says it) and says so where failures are read.
      getHostStorageSummary().catch((error: unknown) => {
        captureError("db", error, { seam: "create_room_storage" });
        return null;
      }),
      cookies(),
      searchParams,
    ]);

  // A host's name shows publicly on their own uploads + the "Hosted by" byline, so require it
  // before they can create an event (deep-link guard; the dashboard gate covers the normal path).
  if (needsDisplayName(profile?.display_name)) redirect("/welcome");

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  // THE DASHBOARD'S OWN CAP MATH, never a second opinion about it: event_slots
  // is the webhook-derived concurrent-pass count and overrides the static tier
  // limit, exactly as enforce_event_limit does in SQL (billing-caps.md).
  const maxEvents = profile?.event_slots ?? MAX_EVENTS[tier];
  // The cap is decided on a COUNT (the 1,000-row round, 2026-09-23): the same
  // head count the dashboard's "X of N used" shows, never a list's length. The
  // names are read only for the door, which renders only at the cap, so a host
  // with room never pays for a read of every event they hold.
  const atCap = !withinLimit(eventCount, maxEvents);
  const cappedEvents = atCap
    ? (await listEvents()).map((e) => ({ id: e.id, name: e.name }))
    : [];
  const storagePct = storage
    ? storageUsedPct(
        storage.storedBytes,
        effectiveStorageCap(tier, profile?.storage_cap_bytes ?? null),
      )
    : 0;
  // The address's own like first, then the one her sign-up carried; none at the cap, where the door stands instead.
  const like = atCap
    ? null
    : await readLike(
        likeToken(params.like) ?? likeToken(jar.get(LIKE_COOKIE)?.value),
      );

  return (
    <CreateEventWizard
      siteUrl={siteUrl}
      planName={TIER_NAMES[tier]}
      tier={tier}
      atCap={atCap}
      maxEvents={maxEvents}
      // Only what the door says out loud. The row carries the password hash
      // and every setting; a client island gets a name and an id.
      cappedEvents={cappedEvents}
      storagePct={storagePct}
      like={like}
    />
  );
}
