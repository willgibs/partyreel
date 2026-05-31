import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { MediaGrid } from "@/components/app/media-grid";
import { MakeYourOwn } from "@/components/guest/make-your-own";
import { ReportDialog } from "@/components/guest/report-dialog";
import { Logo } from "@/components/shared/logo";
import { isLikelyBot } from "@/lib/analytics/bots";
import { recordLinkHit } from "@/lib/db/mutations/analytics";
import { getPublicAlbum } from "@/lib/db/queries/album";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import { presignDownload } from "@/lib/r2/presign";
import { formatEventDate } from "@/lib/utils";

// Share links unfurl nicely (OG title/description + the per-event opengraph-image
// in this folder), but the share_token is an opaque capability — `robots noindex`
// keeps the semi-private album out of search results.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const result = await getPublicAlbum(token);
  if (!result.ok) return { title: "Album", robots: { index: false } };

  const { event } = result.data;
  const description =
    event.description ?? `Photos and videos from ${event.name}.`;
  return {
    title: event.name,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: event.name,
      description,
      url: `/a/${token}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: event.name, description },
  };
}

// PUBLIC album view (read-only, approved media only). get_public_album returns R2
// object KEYS — every key is turned into a short-lived signed URL server-side
// before it reaches the browser (ADR-0003); raw keys/URLs are never exposed. The
// always-dark `gallery` surface makes the media the hero regardless of theme.
//
// Presigned URLs are per-request + short-lived, so never statically cache.
export const dynamic = "force-dynamic";

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await getPublicAlbum(token);
  // Not public / missing / deleted → 404 (don't leak existence).
  if (!result.ok) notFound();
  const { event, media } = result.data;

  // Record-on-view: count this album view (aggregate, no PII). Same after() + bot-filter
  // pattern as the join page; success path only, never in generateMetadata.
  const userAgent = (await headers()).get("user-agent");
  if (!isLikelyBot(userAgent)) {
    after(() => recordLinkHit(event.id, "album_view"));
  }

  // Presign two URLs per item from the same key: an INLINE url the grid/lightbox
  // render, and a forced-download (`attachment`) url the lightbox's Save uses.
  const items = await Promise.all(
    media.map(async (m) => {
      const [url, downloadUrl] = await Promise.all([
        presignDownload({ key: m.original_key }),
        presignDownload({
          key: m.original_key,
          downloadFilename: buildDownloadFilename({
            eventName: event.name,
            key: m.original_key,
            type: m.type,
          }),
        }),
      ]);
      return { id: m.id, type: m.type, url, downloadUrl };
    }),
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gallery text-gallery-foreground">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <header className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link href="/" aria-label="Partyreel home">
            <Logo />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {event.name}
          </h1>
          {event.event_date && (
            <p className="text-sm text-gallery-muted">
              {formatEventDate(event.event_date)}
            </p>
          )}
          {event.description && (
            <p className="max-w-prose text-sm text-gallery-muted">
              {event.description}
            </p>
          )}
        </header>

        {items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <p className="py-16 text-center text-sm text-gallery-muted">
            No photos yet — check back soon.
          </p>
        )}

        {/* Growth badge (guest → future host) + the discreet anonymous report
            path (share_token is the capability). */}
        <footer className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <MakeYourOwn variant="dark" />
          <ReportDialog shareToken={token} />
        </footer>
      </div>
    </div>
  );
}
