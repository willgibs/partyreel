import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Lock } from "lucide-react";

import { EventExperience } from "@/components/guest/event-experience";
import { GuestHeader } from "@/components/guest/guest-header";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import {
  GuestList,
  GUEST_LIST_FACES_THRESHOLD,
} from "@/components/social/guest-list";
import { Button } from "@/components/ui/button";
import { isLikelyBot } from "@/lib/analytics/bots";
import { recordLinkHit } from "@/lib/db/mutations/analytics";
import { listAccountMediaIds } from "@/lib/db/mutations/guest-media";
import {
  getGalleryStats,
  getHostAvatarSeed,
} from "@/lib/db/queries/guest-events-admin";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { getProfileMenu } from "@/lib/db/queries/profile";
import * as social from "@/lib/db/queries/social";
import { withAvatarUrls } from "@/lib/social/cards";
import { isDemoToken } from "@/lib/demo";
import {
  isEventOwner,
  loadGalleryForAccess,
  resolveViewerDecision,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { readGuestSessionCookie } from "@/lib/guest/session-cookie";
import { getGuestReelContext } from "@/lib/reel/guest-reel";
import { resolveTileSize, TILE_SIZE_COOKIE } from "@/lib/shared/tile-size-cookie";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { needsDisplayName } from "@/lib/welcome";

// Event state + gallery are read per request via the qr_token RPCs.
export const dynamic = "force-dynamic";

/* ──────────────────────────────────────────────────────────────────────────
   THE WAVE SEAM, IN ONE PLACE (the identity reshape, wave 1, 2026-09-21).

   `lib/db/queries/social.ts` belongs to `verified-email-server`, the lane
   building the route and the queries beside this one. It lands two things this
   page wants: `getEventGuestList`'s second argument (`{ includeUnverified }`,
   which appends the name-only guests Will asked to see listed) and
   `getHostCard(eventId)` (the host as a public card, for the capture flow's
   follow moment).

   Read through ONE narrow cast so this page is CORRECT on both sides of that
   merge rather than green on only one of them: before it, the guest list is the
   profile cards alone and the follow moment simply has no host row (both already
   handled downstream, neither a stub); after it, every line below is live with no
   edit here at all. Collapse this block to plain named imports once the server
   lane is on the tree.
   ────────────────────────────────────────────────────────────────────────── */
type HostCard = {
  id: string;
  slug: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};
const socialSeam = social as unknown as {
  getEventGuestList: (
    eventId: string,
    opts?: { includeUnverified?: boolean },
  ) => Promise<
    | ({ id: string; displayName: string | null } & Record<string, unknown>)[]
    | null
  >;
  getHostCard?: (eventId: string) => Promise<HostCard | null>;
  getMyFollowing: () => Promise<{ id: string }[]>;
};

// The qr_token is an opaque capability — noindex (don't index join links), but emit OG
// so a pasted link previews. Visibility decides what leaks: a PRIVATE event reveals
// nothing (generic title); a PASSWORD event shows its NAME (it's link-shared, the name
// isn't the secret) but no description; OPEN gets the full unfurl, whose description
// also depends on the account gate (see allow_anonymous_uploads below).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const result = await getEventByQrToken(token);
  if (!result.ok || result.data.visibility === "private") {
    return {
      title: result.ok ? "Private event" : "Join event",
      robots: { index: false },
    };
  }

  const event = result.data;
  if (event.visibility === "password") {
    const title = event.name;
    return {
      title,
      robots: { index: false, follow: false },
      openGraph: { title, url: `/e/${event.qr_token}`, type: "website" },
      twitter: { card: "summary_large_image", title },
    };
  }

  const title = `Add photos to ${event.name}`;
  // ★ A PASTED LINK INVITES, IT DOES NOT WARN (Will, 2026-09-17, the `unfurl=join`
  // pick, overruling the recommendation). This line used to fork on
  // allow_anonymous_uploads so an account-gated event announced its email step in
  // the group chat: the ONE warning a guest got before tapping. He chose to drop
  // the warning WITH ITS COST IN FRONT OF HIM ("More taps, and a share of them
  // bounce at the email step"), so the fork is gone and every open event unfurls
  // the same invitation. Do NOT hedge this back toward a warning: an event that
  // requires a verified email still gates the guest after the tap, and that was
  // the trade he took, not one he missed. The gate itself is honest where it
  // happens, at the entry modal's account step.
  const description = "Photos and videos from the day. Add yours.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `/e/${event.qr_token}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// The unified guest EVENT page — a scanned QR lands here. The opaque qr_token IS the
// capability (database-security.md). State is a function of the host's `visibility`:
//   private              → locked screen (master lock; no name/gallery/upload), an early return here
//   password / account   → EventExperience renders the gate via the entry modal; an unsatisfied gate
//                          resolves to access `none` (locked backdrop) or `teaser` (capped preview)
//   open + anon / full   → header + action row (save / invite) + upload + live gallery
// (accepting_uploads off → view-only: the upload panel is gone, leaving the action row +
//  a "uploads closed" line + the gallery. EventExperience handles that layout branch.)
export default async function GuestEventPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await getEventByQrToken(token);
  // Missing / deleted resolves to not_found — a 404 (don't leak existence).
  if (!result.ok) notFound();
  const event = result.data;
  // Hoisted above the private-event return (Phase 4.5 read it further down,
  // after the auth block below): a pure check of the qr_token alone, and
  // GuestHeader now wants it on EVERY branch (the Demo mark, `framing=tag`).
  const isDemo = isDemoToken(event.qr_token);

  // Record-on-view: count this QR/join-link visit (aggregate, no PII). Bot-filtered
  // at ingest and deferred via after() so it never blocks the guest. Success path
  // only — and NOT in generateMetadata (which also runs for unfurls/prefetch).
  const userAgent = (await headers()).get("user-agent");
  if (!isLikelyBot(userAgent)) {
    after(() => recordLinkHit(event.id, "qr_scan"));
  }

  // Private: master lock — reveal nothing (no name, gallery, or upload).
  //
  // ★ IT IS THE NOT-FOUND FAMILY NOW, WEARING A LOCK (Will, `private-event=
  // family`, 2026-09-19). This was a hand-rolled stack that MIRRORED
  // NotFoundScreen by eye and shared none of its code — the same icon circle,
  // the same title step, the same centered column, free to drift. Folding it in
  // changes nothing a guest sees except the one thing he asked for: "A simple
  // link to Partyreel homepage here would be nice to capture from an otherwise
  // dead-end page." So the one action is that link, worded the way the bad-link
  // 404 next door words it, and outline rather than solid because this screen
  // is telling a guest to come back later, not to leave.
  //
  // It keeps the REAL GuestHeader (not the failure bar): this render holds a
  // live qr_token and event id, so the header can resolve a session and a
  // returning host meets their own menu. The two surfaces that wear GuestBar
  // are the ones that have neither.
  if (event.visibility === "private") {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <GuestHeader qrToken={event.qr_token} eventId={event.id} isDemo={isDemo} />
        <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
          <NotFoundScreen
            icon={Lock}
            title="This event is private"
            description="The host has this event set to private. Check back later, or ask them to make it public."
            actions={
              <Button asChild size="cta" variant="outline">
                <Link href="/">What is Partyreel?</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  // Password unlock state, feeding the access resolution + the entry modal's password step. The
  // password gate is no longer a full-page early-return (P2): the entry modal (in EventExperience)
  // owns it, so a not-yet-unlocked password event resolves to access `none` (a locked backdrop with
  // the modal over it).
  const unlocked =
    event.visibility === "password" ? await isUnlocked(event.id) : true;

  // Open, or password + unlocked. Resolve this viewer's gallery ACCESS (none/teaser/full) and load
  // exactly that much media server-side, so the withheld set never reaches the browser (the gated-
  // gallery security core). The client polls /api/guests/gallery, which enforces the SAME access.
  const siteUrl = await getSiteUrl();
  // Canonical (qr_token) link for the in-page share + the media poll, never the slug the guest may
  // have arrived on (the media RPC + downstream RPCs match qr_token only).
  const joinUrl = `${siteUrl.replace(/\/+$/, "")}/e/${event.qr_token}`;

  // Auth state for the gate (+ the name nudge). Skipped for the demo (always full, never gates). We
  // now run getUser() for EVERY non-private event (not just the accepting-uploads path): the gate must
  // know whether the viewer is signed in. For the anonymous majority it's a cheap local null, and the
  // owner select runs ONLY when signed in. Authorize with getUser(), never getSession().
  let isAuthed = false;
  let isOwner = false;
  let userId: string | null = null;
  if (!isDemo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      isAuthed = Boolean(user.email_confirmed_at);
      isOwner = await isEventOwner(event.id, user.id, supabase);
    }
  }
  /* ──────────────────────────────────────────────────────────────────────
     THE DECISION, AND THE COOKIE THAT LETS THE SERVER MAKE IT (the door as
     three steps, 2026-09-21). Require an upload to view is enforced here, not
     in the browser, so the render has to know WHICH guest is asking: the
     `pr_guest_<eventId>` cookie carries that session token, because an RSC
     cannot read the localStorage copy. A guest whose browser holds a token but
     no cookie yet (every session minted before this round) resolves as
     uncontributed for exactly one render, and `EventExperience`'s heal POSTs
     the poll once with the stored token before the arrival beat to true it up.
     ────────────────────────────────────────────────────────────────────── */
  const cookieSessionToken = isDemo
    ? null
    : await readGuestSessionCookie(event.id);
  const decision = isDemo
    ? { access: "full" as const, gate: null }
    : await resolveViewerDecision(event, {
        isOwner,
        isAuthed,
        isUnlocked: unlocked,
        userId,
        sessionToken: cookieSessionToken,
      });
  const access = decision.access;
  // Deliberately NOT awaited (Phase 3 streaming): the gallery load presigns
  // 2 URLs per item, the slowest part of this page. The shell streams first;
  // LiveGallery resolves this inside its Suspense boundary.
  const galleryPromise = loadGalleryForAccess(event, decision);

  // Header stats (Phase 4): cheap awaited read (numbers only — never identities).
  // For a LOCKED password event this still returns counts: the ratified entry
  // tease (the sheet says "N photos are waiting"; the header shows name only).
  //
  // The guest REEL read (R3, guest-flow.md) rides alongside it, awaited CONCURRENTLY:
  // both are cheap indexed reads, and the reel card must be in the SHELL HTML
  // (a streamed top card would shift the keepsake album's hero as it lands), so
  // it cannot stream like the gallery does — but it must not cost a serial
  // round-trip either. Returns null for everything that isn't "this viewer may
  // see a published, non-empty reel" (access, publish state, curation, locks),
  // so the card below needs no further gating. The raw `event` on purpose: it
  // carries the canonical qr_token the RPC matches on.
  //
  // A GUEST'S OWN PHOTOGRAPHS ride alongside them (Will, `yours`, 2026-09-20:
  // "A guest can delete any photo they've personally uploaded, ever"). For a
  // SIGNED-IN viewer the answer is here: one indexed read of the media ids
  // whose guest row belongs to this account in this event. Never a client
  // claim, and deliberately NOT in the gallery payload or its ETag — that
  // fingerprint is per ACCESS and shared between viewers, while this list is
  // per person. The ANONYMOUS half cannot be answered here at all: that
  // identity is a session token in the browser's own storage, so LiveGallery
  // asks `/api/guests/mine` for it. Skipped at access `none` (there is nothing
  // rendered to remove) and in the demo (nothing there is real).
  const [stats, guestReel, canDeleteIds, cookieJar] = await Promise.all([
    getGalleryStats(event),
    getGuestReelContext(event, access),
    userId && !isDemo && access !== "none"
      ? listAccountMediaIds({ eventId: event.id, userId })
      : Promise.resolve<string[]>([]),
    cookies(),
  ]);
  // The album's tile size (`controls-home=view-menu`), painted inline from the
  // cookie (the host page's `tileSize` precedent, dashboard/[eventId]/page.tsx)
  // so the first paint is already the size a returning guest picked — never a
  // client-only read, which would resize the whole album after hydration.
  const tileSize = resolveTileSize(cookieJar.get(TILE_SIZE_COOKIE)?.value);

  // LOCKED REDACTION (Phase 4 hardening of the ratified name-only rule): at
  // access `none` the page must reveal the event NAME + media COUNT only, and
  // props serialize into the RSC flight payload whether or not the UI renders
  // them - so blank the host name + description + DATE (and skip the avatar
  // read) BEFORE they reach the client. The date joined the redaction in
  // Phase 4.5: the entry welcome's byline would otherwise show it on locked
  // pages, where the pre-4.5 page never revealed it.
  const shellEvent =
    access === "none"
      ? {
          ...event,
          host_display_name: null,
          description: null,
          event_date: null,
        }
      : event;

  // Host avatar + seed for the "Hosted by" byline: a server-side admin read so host_id stays off the
  // client (only the presigned URL and the one-way hash are passed down — `seedFor`,
  // docs/design/rulings.md the sixth batch). Gated on a set name, since the byline hides without one
  // (Phase 3), so this is a no-op for nameless-host events (an event with no set host name has no
  // byline to colour either).
  const hostAvatar = shellEvent.host_display_name?.trim()
    ? await getHostAvatarSeed(event.id)
    : null;
  const hostAvatarUrl = hostAvatar?.avatarUrl ?? null;
  const hostSeed = hostAvatar?.seed ?? null;

  // The named Guests section (profiles-social.md): ONLY at full access (a teaser viewer
  // hasn't finished the gate; a locked page reveals name + count only), never in
  // the demo. getEventGuestList re-checks the host key server-side and returns
  // null when it's off (or pre-apply), so the section can't render unauthorized.
  // Composed HERE as a slot: EventExperience is a client island and must never
  // receive storage markers, only hydrated public avatar URLs.
  let guestListSlot: React.ReactNode = null;
  if (access === "full" && !isDemo) {
    // ★ NAME-ONLY GUESTS ARE ON IT (Will, at the identity reshape's approval:
    // "Listed, with the mark"). They arrive after the profile cards as
    // `{ kind: "unverified" }` entries, which `withAvatarUrls` must not touch:
    // there is no avatar and no seed to resolve for a name nobody proved.
    const guestList = await socialSeam.getEventGuestList(event.id, {
      includeUnverified: true,
    });
    if (guestList && guestList.length > 0) {
      const unverified = guestList.filter((g) => g.kind === "unverified");
      const cards = guestList.filter((g) => g.kind !== "unverified");
      const items = [
        ...(await withAvatarUrls(
          cards as unknown as Parameters<typeof withAvatarUrls>[0],
        )),
        ...(unverified as unknown as {
          kind: "unverified";
          id: string;
          displayName: string | null;
        }[]),
      ];
      // Above the threshold the list condenses to a row of faces that says
      // "N guests added photos" itself, so the heading drops its pill: the
      // number renders once (Will, `list=faces`, 2026-09-19).
      const listSaysCount = items.length > GUEST_LIST_FACES_THRESHOLD;
      // A Follow on somebody else's chip, only where it is not a no-op: one
      // owner-scoped read, and only for a signed-in viewer.
      const followingIds = userId
        ? new Set(
            (await socialSeam.getMyFollowing()).map((f: { id: string }) => f.id),
          )
        : undefined;
      guestListSlot = (
        <section aria-label="Guests" className="mt-10 space-y-3">
          <h2 className="flex items-center gap-1.5">
            <span className="text-label font-semibold text-muted-foreground uppercase">
              Guests
            </span>
            {!listSaysCount && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
                {items.length}
              </span>
            )}
          </h2>
          <GuestList
            items={items}
            viewerId={userId}
            followingIds={followingIds}
          />
        </section>
      );
    }
  }

  /**
   * THE HOST'S SWITCH (the identity reshape, 2026-09-21). `GuestEvent.require_verified_email`
   * is the field every new read keys on (guest-events.ts's own words); the legacy
   * `allow_anonymous_uploads` stays on the type for `main`'s build and QA #36 alone.
   * OFF means NAMES MODE: a guest types a display name at the door and uploads
   * under it, marked.
   */
  // The seam collapsed at the merge (verified-email-server landed first): the
  // field is on GuestEvent, and the legacy flag is its trigger-kept opposite.
  const requireVerifiedEmail = event.require_verified_email;

  // The host as a public card, for the capture flow's follow moment. Only where
  // it can be acted on: a full-access, non-demo album with a host to follow.
  const hostCard =
    access === "full" && !isDemo && socialSeam.getHostCard
      ? await socialSeam.getHostCard(event.id)
      : null;

  // Display-name nudge: a SIGNED-IN uploader without a public name sets one before uploading (so their
  // upload is attributed). Only meaningful in the `full` state; an account-required event viewed by an
  // un-signed-in guest is `teaser`, where the account step (EnterEventPrompt) comes first.
  let needsName = false;
  if (isAuthed && userId && event.accepting_uploads && access === "full") {
    const menu = await getProfileMenu(userId);
    needsName = needsDisplayName(menu.displayName);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* event.qr_token, NOT the raw `token` route param: `token` may be a
          CUSTOM SLUG, and the header's sign-out clears the stored session by
          this key while EventExperience below reads it by the canonical
          qr_token. Mismatched keys meant sign-out on a slug URL removed a key
          that was never written, leaving the previous guest's upload
          capability live on a shared phone. */}
      <GuestHeader qrToken={event.qr_token} eventId={event.id} isDemo={isDemo} />
      <EventExperience
        event={shellEvent}
        qrToken={event.qr_token}
        joinUrl={joinUrl}
        galleryPromise={galleryPromise}
        stats={stats}
        isDemo={isDemo}
        access={access}
        gate={decision.gate}
        needsName={needsName}
        hostAvatarUrl={hostAvatarUrl}
        hostSeed={hostSeed}
        isOwner={isOwner}
        guestListSlot={guestListSlot}
        guestReel={guestReel}
        canDeleteIds={canDeleteIds}
        isAuthed={Boolean(userId)}
        // Identity keys on a CONFIRMED account, never a uid alone (wave 0's
        // finding): an unconfirmed session still carries a typed name.
        isVerified={isAuthed}
        namesMode={!requireVerifiedEmail}
        hostCard={
          hostCard
            ? { ...hostCard, seed: hostSeed }
            : null
        }
        initialTileSize={tileSize}
      />
    </div>
  );
}
