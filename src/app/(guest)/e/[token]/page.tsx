import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Lock } from "lucide-react";

import { EventExperience } from "@/components/guest/event-experience";
import { PasswordGate } from "@/components/guest/password-gate";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { isLikelyBot } from "@/lib/analytics/bots";
import { recordLinkHit } from "@/lib/db/mutations/analytics";
import { getApprovedMediaForUnlock } from "@/lib/db/queries/guest-events-admin";
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
      openGraph: { title, url: `/e/${token}`, type: "website" },
      twitter: { card: "summary_large_image", title },
    };
  }

  const title = `Add photos to ${event.name}`;
  const description = `Add your photos and videos to ${event.name}. No app, no account, just your phone.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, url: `/e/${token}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// The unified guest EVENT page — a scanned QR lands here. The opaque qr_token IS the
// capability (ADR-0004). State is a function of the host's `visibility`:
//   private              → locked screen (master lock; no name/gallery/upload)
//   password + no cookie → header + <PasswordGate> (name shown, no gallery/upload)
//   password + unlocked  → full experience, media via the admin-read (the anon RPC
//                          gates on visibility='open', so it never serves password media)
//   open                 → header + upload + live gallery + share
// (accepting_uploads is handled inside the upload panel: a disabled control when off.)
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
        <GuestHeader />
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
        <GuestHeader />
        <PasswordGate token={token} tokenKind="qr" eventName={event.name} />
      </div>
    );
  }

  // Open, or password + unlocked: SSR the first gallery batch (presigned) + the join
  // URL. A password event's media comes from the server-side admin-read (the anon RPC
  // only serves 'open' events); an open event uses the anon RPC. The client then polls
  // /api/guests/gallery for updates.
  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl.replace(/\/+$/, "")}/e/${token}`;
  const media =
    event.visibility === "password"
      ? await getApprovedMediaForUnlock(event.id)
      : await getEventMediaByQrToken(token);
  const initialItems = await toGridItems(media, event.name);

  // Require-email gate (verified, Phase 2c): ONLY when the host requires it, check for a
  // confirmed Supabase session. The gallery still renders (viewing is allowed) — only the
  // UPLOAD area is swapped for <VerifyEmailPrompt> (EventExperience does that via the prop).
  // getUser() runs ONLY for require_email events, so open/password events add no auth
  // round-trip. Demo never gates (its uploads are simulated).
  const isDemo = isDemoToken(token);
  let needsEmailVerification = false;
  if (event.require_email && !isDemo) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    needsEmailVerification = !user || !user.email_confirmed_at;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <GuestHeader />
      <EventExperience
        event={event}
        qrToken={token}
        joinUrl={joinUrl}
        initialItems={initialItems}
        isDemo={isDemo}
        needsEmailVerification={needsEmailVerification}
      />
    </div>
  );
}

// Minimal, formal header — the host paid for this, so it's their event, not a
// loud Partyreel page: just the logo + one quiet "start for free" CTA.
function GuestHeader() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Link href="/" aria-label="Partyreel home">
        <Logo />
      </Link>
      <Button asChild variant="ghost" size="sm">
        <Link href="/">Start for free</Link>
      </Button>
    </header>
  );
}
