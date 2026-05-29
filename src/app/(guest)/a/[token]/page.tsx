import { notFound } from "next/navigation";

import { MediaGrid } from "@/components/app/media-grid";
import { ReportDialog } from "@/components/guest/report-dialog";
import { Logo } from "@/components/shared/logo";
import { getPublicAlbum } from "@/lib/db/queries/album";
import { presignDownload } from "@/lib/r2/presign";
import { formatEventDate } from "@/lib/utils";

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

  const items = await Promise.all(
    media.map(async (m) => ({
      id: m.id,
      type: m.type,
      url: await presignDownload({ key: m.original_key }),
    })),
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gallery text-gallery-foreground">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <header className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logo />
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

        {/* Discreet, anonymous report path — share_token is the capability. */}
        <footer className="mt-10 flex justify-center border-t border-white/10 pt-6">
          <ReportDialog shareToken={token} />
        </footer>
      </div>
    </div>
  );
}
