import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Lock } from "lucide-react";

import { EventExperience } from "@/components/guest/event-experience";
import { GuestHeader } from "@/components/guest/guest-header";
import { PasswordGate } from "@/components/guest/password-gate";
import { isLikelyBot } from "@/lib/analytics/bots";
import { recordLinkHit } from "@/lib/db/mutations/analytics";
import {
  getApprovedMediaForUnlock,
  getHostAvatarUrl,
} from "@/lib/db/queries/guest-events-admin";
import {
  getEventByQrToken,
  getEventMediaByQrToken,
} from "@/lib/db/queries/guest-events";
import { isDemoToken } from "@/lib/demo";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { toGridItems } from "@/lib/r2/grid-items";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

// Event state + gallery are read per request via the qr_token RPCs.
export const dynamic = "force-dynamic";

// The qr_token is an opaque capability — noindex (don't index join links), but emit OG
// so a pasted link previews. Visibility decides what leaks: a PRIVATE event reveals
// nothing (generic title); a PASSWORD event shows its NAME (it's link-shared, the name
// isn't the secret) but no description; OPEN gets the full unfurl.
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
  const description = `Add your photos and videos to ${event.name}. No app, no account, just your phone.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, url: `/e/${event.qr_token}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// The unified guest EVENT page — a scanned QR lands here. The opaque qr_token IS the
// capability (ADR-0004). State is a function of the host's `visibility`:
//   private              → locked screen (master lock; no name/gallery/upload)
//   password + no cookie → header + <PasswordGate> (name shown, no gallery/upload)
//   password + unlocked  → full experience, media via the admin-read (the anon RPC
//                          gates on visibility='open', so it never serves password media)
//   open                 → header + action row (save / invite) + upload + live gallery
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

  // Password: gate until this request holds a valid unlock cookie for the event.
  const unlocked =
    event.visibility === "password" ? await isUnlocked(event.id) : true;
  if (event.visibility === "password" && !unlocked) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <GuestHeader qrToken={event.qr_token} eventId={event.id} />
        <PasswordGate token={event.qr_token} eventName={event.name} />
      </div>
    );
  }

  // Open, or password + unlocked: SSR the first gallery batch (presigned) + the join
  // URL. A password event's media comes from the server-side admin-read (the anon RPC
  // only serves 'open' events); an open event uses the anon RPC. The client then polls
  // /api/guests/gallery for updates.
  const siteUrl = await getSiteUrl();
  // Canonical (qr_token) link for the in-page share + the media poll — never the slug
  // the guest may have arrived on (the media RPC + downstream RPCs match qr_token only).
  const joinUrl = `${siteUrl.replace(/\/+$/, "")}/e/${event.qr_token}`;
  const media =
    event.visibility === "password"
      ? await getApprovedMediaForUnlock(event.id)
      : await getEventMediaByQrToken(event.qr_token);
  const initialItems = await toGridItems(media, event.name);

  // Host avatar for the "Hosted by" byline — a server-side admin read so host_id stays off the
  // client (only the presigned URL is passed down). Gated on a set name, since the byline hides
  // without one (Phase 3), so this is a no-op for nameless-host events.
  const hostAvatarUrl = event.host_display_name?.trim()
    ? await getHostAvatarUrl(event.id)
    : null;

  // Require-email gate (verified, Phase 2c): ONLY when the host requires it AND is still
  // accepting uploads, check for a confirmed Supabase session. The gallery still renders
  // (viewing is allowed) — only the UPLOAD area is swapped for <VerifyEmailPrompt>
  // (EventExperience does that via the prop). When uploads are OFF the event is view-only
  // (ADR-0010), so there's nothing to gate — skip the check entirely (no verify prompt on
  // a closed event). getUser() runs ONLY for accepting + require_email events, so every
  // other path adds no auth round-trip. Demo never gates (its uploads are simulated).
  const isDemo = isDemoToken(event.qr_token);
  let needsEmailVerification = false;
  if (event.accepting_uploads && event.require_email && !isDemo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    needsEmailVerification = !user || !user.email_confirmed_at;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <GuestHeader qrToken={token} eventId={event.id} />
      <EventExperience
        event={event}
        qrToken={event.qr_token}
        joinUrl={joinUrl}
        initialItems={initialItems}
        isDemo={isDemo}
        needsEmailVerification={needsEmailVerification}
        hostAvatarUrl={hostAvatarUrl}
      />
    </div>
  );
}
