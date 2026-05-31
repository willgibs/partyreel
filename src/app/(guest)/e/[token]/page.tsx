import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Lock } from "lucide-react";

import { EventExperience } from "@/components/guest/event-experience";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { isLikelyBot } from "@/lib/analytics/bots";
import { recordLinkHit } from "@/lib/db/mutations/analytics";
import {
  getEventByQrToken,
  getEventMediaByQrToken,
} from "@/lib/db/queries/guest-events";
import { isDemoToken } from "@/lib/demo";
import { toGridItems } from "@/lib/r2/grid-items";
import { getSiteUrl } from "@/lib/site-url";

// Event state + gallery are read per request via the qr_token RPCs.
export const dynamic = "force-dynamic";

// The qr_token is an opaque capability — noindex (don't index join links), but
// emit OG so a pasted link previews. A PRIVATE event (is_public=false) is a master
// lock: don't leak its name in unfurls either.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const result = await getEventByQrToken(token);
  if (!result.ok || !result.data.is_public) {
    return {
      title: result.ok ? "Private event" : "Join event",
      robots: { index: false },
    };
  }

  const title = `Add photos to ${result.data.name}`;
  const description = `Add your photos and videos to ${result.data.name}. No app, no account, just your phone.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, url: `/e/${token}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// The unified guest EVENT page — a scanned QR lands here. The opaque qr_token IS
// the capability (ADR-0004). State is a function of the host's flags:
//   is_public=false           → private/locked screen (master lock; no name/gallery/upload)
//   is_public=true            → header + upload + live gallery + share
//   (accepting_uploads is handled inside the upload panel: a disabled control when off)
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

  // Master lock: a private event reveals nothing — no name, gallery, or upload.
  if (!event.is_public) {
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

  // Public: SSR the first gallery batch (presigned) + the join URL the share UI
  // hands to other guests. The client then polls /api/guests/gallery for updates.
  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl.replace(/\/+$/, "")}/e/${token}`;
  const initialItems = await toGridItems(
    await getEventMediaByQrToken(token),
    event.name,
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <GuestHeader />
      <EventExperience
        event={event}
        qrToken={token}
        joinUrl={joinUrl}
        initialItems={initialItems}
        isDemo={isDemoToken(token)}
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
