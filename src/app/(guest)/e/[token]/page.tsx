import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Lock } from "lucide-react";

import { EventExperience } from "@/components/guest/event-experience";
import { GuestHeader } from "@/components/guest/guest-header";
import { GuestList } from "@/components/social/guest-list";
import { isLikelyBot } from "@/lib/analytics/bots";
import { recordLinkHit } from "@/lib/db/mutations/analytics";
import {
  getGalleryStats,
  getHostAvatarUrl,
} from "@/lib/db/queries/guest-events-admin";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { getProfileMenu } from "@/lib/db/queries/profile";
import { getEventGuestList } from "@/lib/db/queries/social";
import { withAvatarUrls } from "@/lib/social/cards";
import { isDemoToken } from "@/lib/demo";
import { resolveGalleryAccess } from "@/lib/events/gallery-access";
import {
  isEventOwner,
  loadGalleryForAccess,
} from "@/lib/events/gallery-access.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { getGuestReelContext } from "@/lib/reel/guest-reel";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { needsDisplayName } from "@/lib/welcome";

// Event state + gallery are read per request via the qr_token RPCs.
export const dynamic = "force-dynamic";

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
  // ★ The unfurl's promise is keyed on allow_anonymous_uploads, the column that decides it.
  // With the account gate ON (allow_anonymous_uploads = false) a guest must sign in to see
  // the full gallery and to upload, so the "no account" line was a promise the page then
  // broke at the entry modal, in the preview a host pastes into a group chat. "No app" holds
  // either way, and the gate costs an email rather than a download.
  const description = event.allow_anonymous_uploads
    ? `Add your photos and videos to ${event.name}. No app, no account, just your phone.`
    : "Add your photos and videos. This event asks guests for an email.";
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

  // Record-on-view: count this QR/join-link visit (aggregate, no PII). Bot-filtered
  // at ingest and deferred via after() so it never blocks the guest. Success path
  // only — and NOT in generateMetadata (which also runs for unfurls/prefetch).
  const userAgent = (await headers()).get("user-agent");
  if (!isLikelyBot(userAgent)) {
    after(() => recordLinkHit(event.id, "qr_scan"));
  }

  // Private: master lock — reveal nothing (no name, gallery, or upload).
  if (event.visibility === "private") {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <GuestHeader qrToken={event.qr_token} eventId={event.id} />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-20 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            This event is private
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            The host has this event set to private. Check back later, or ask
            them to make it public.
          </p>
        </div>
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
  const isDemo = isDemoToken(event.qr_token);
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
  const access = isDemo
    ? "full"
    : resolveGalleryAccess(event, { isOwner, isAuthed, isUnlocked: unlocked });
  // Deliberately NOT awaited (Phase 3 streaming): the gallery load presigns
  // 2 URLs per item, the slowest part of this page. The shell streams first;
  // LiveGallery resolves this inside its Suspense boundary.
  const galleryPromise = loadGalleryForAccess(event, access);

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
  const [stats, guestReel] = await Promise.all([
    getGalleryStats(event),
    getGuestReelContext(event, access),
  ]);

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

  // Host avatar for the "Hosted by" byline: a server-side admin read so host_id stays off the client
  // (only the presigned URL is passed down). Gated on a set name, since the byline hides without one
  // (Phase 3), so this is a no-op for nameless-host events.
  const hostAvatarUrl = shellEvent.host_display_name?.trim()
    ? await getHostAvatarUrl(event.id)
    : null;

  // The named Guests section (profiles-social.md): ONLY at full access (a teaser viewer
  // hasn't finished the gate; a locked page reveals name + count only), never in
  // the demo. getEventGuestList re-checks the host key server-side and returns
  // null when it's off (or pre-apply), so the section can't render unauthorized.
  // Composed HERE as a slot: EventExperience is a client island and must never
  // receive storage markers, only hydrated public avatar URLs.
  let guestListSlot: React.ReactNode = null;
  if (access === "full" && !isDemo) {
    const guestList = await getEventGuestList(event.id);
    if (guestList && guestList.length > 0) {
      const items = await withAvatarUrls(guestList);
      guestListSlot = (
        <section aria-label="Guests" className="mt-10 space-y-3">
          <h2 className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Guests
            </span>
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
              {items.length}
            </span>
          </h2>
          <GuestList items={items} />
        </section>
      );
    }
  }

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
      <GuestHeader qrToken={event.qr_token} eventId={event.id} />
      <EventExperience
        event={shellEvent}
        qrToken={event.qr_token}
        joinUrl={joinUrl}
        galleryPromise={galleryPromise}
        stats={stats}
        isDemo={isDemo}
        access={access}
        needsName={needsName}
        hostAvatarUrl={hostAvatarUrl}
        isOwner={isOwner}
        guestListSlot={guestListSlot}
        guestReel={guestReel}
      />
    </div>
  );
}
