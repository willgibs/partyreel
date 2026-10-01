import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ArrowLeft } from "lucide-react";

import { adminNotFoundMetadata } from "@/app/admin/not-found.metadata";
import { AdminNotFoundPageScreen } from "@/app/admin/not-found.screen";
import { ModerationGrid } from "@/components/admin/moderation-grid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { getAlbumForModeration } from "@/lib/db/queries/moderation";
import { readCoveredItems } from "@/lib/db/queries/reports";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import {
  albumPageHref,
  parseAlbumCursor,
  type AlbumCursor,
} from "@/lib/moderation/album-pages";
import { toModerationFeedItems } from "@/lib/r2/grid-items";
import { isUuidShape } from "@/lib/validation/uuid-shape";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The album's page, read once a request for the page and its title (React's cache shares it within the render:
 * both ask with the same three strings, the cursor's two parts or nulls).
 */
const readAlbum = cache(getAlbumForModeration);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: SearchParams;
}): Promise<Metadata> {
  // The title reads the record, so it passes the portal's gate first, as the page does: a service-role read never
  // runs for a request the gate turns away, and never before the MFA step.
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return { title: "Album" };
  const { eventId } = await params;
  const cursor = parseAlbumCursor(await searchParams);
  // ★ A record that is gone is titled as the 404 it is (crumbs-28): the page draws its not-found itself. So is an id
  // that is not one, which is never read (the page says why).
  return isUuidShape(eventId) &&
    (await readAlbum(eventId, cursor?.at ?? null, cursor?.id ?? null))
    ? { title: "Album" }
    : adminNotFoundMetadata;
}

const MODERATION_LABEL = {
  live: "Live",
  hold_for_approval: "Hold for approval",
} as const;

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

const PAGE_LINK =
  "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/**
 * WHERE THIS PAGE SITS, AND THE WAY TO THE OTHERS (crumbs-37): the album is drawn a page at a time, newest
 * first, so a long one says which items these are and links the newest page and the next older one. Plain
 * links, no client JS, never prefetched (each portal prefetch is two auth reads). An album of one page says
 * nothing.
 */
function AlbumPager({
  eventId,
  position,
  shown,
  total,
  next,
}: {
  eventId: string;
  position: number;
  shown: number;
  total: number;
  next: AlbumCursor | null;
}) {
  if (position === 0 && !next) return null;
  return (
    <nav
      aria-label="Album pages"
      className="flex flex-wrap items-center justify-between gap-2"
    >
      <p className="text-sm text-muted-foreground">
        {shown > 0
          ? `Items ${formatCount(position + 1)}–${formatCount(position + shown)} of ${formatCount(total)}, newest first`
          : `Nothing older here, of ${formatCount(total)}`}
      </p>
      <div className="flex gap-1">
        {position > 0 ? (
          <Link
            href={albumPageHref(eventId, null)}
            prefetch={false}
            className={PAGE_LINK}
          >
            Newest
          </Link>
        ) : null}
        {next ? (
          <Link
            href={albumPageHref(eventId, next)}
            prefetch={false}
            className={PAGE_LINK}
          >
            Older
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export default async function AdminAlbumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: SearchParams;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { eventId } = await params;
  // ★ ONE PAGE OF THE ALBUM (crumbs-37): the read and the presigns stop at `ALBUM_DRILL_IN_PAGE`, and an Older
  // link carries the next page's cursor. A cursor that is not one reads as the newest page.
  const cursor = parseAlbumCursor(await searchParams);
  // ★ The worst kinds arrive covered here as in Reports (build 23's NIT-7): every item of the album any
  // report names as one, read by the rule's one home, and a covered item is never signed.
  // ★ AN ID THAT IS NOT ONE NAMES NO ALBUM, AND IS NEVER READ (build 33's red-team): both reads handed it to a
  // uuid column, Postgres refused the cast (22P02), and the page answered 500 with "Something went wrong" and filed
  // an error each hit. Asked after the gate and before any read, a mangled link is an album that is not there.
  const [album, covered] = isUuidShape(eventId)
    ? await Promise.all([
        readAlbum(eventId, cursor?.at ?? null, cursor?.id ?? null),
        readCoveredItems({ eventId }),
      ])
    : [null, undefined];
  // ★ DRAWN HERE, NEVER THROUGH `notFound()` (crumbs-28, the guest link's answer from `stale-link`): a thrown one is
  // served as Next's error shell, an empty body until the script has run. Drawn, it is in the HTML, titled by
  // generateMetadata's not-found answer. A 200 (a soft 404, the manifest's Question): the portal is behind the admin
  // gate and MFA and never indexed, so no reader of a status ever reaches it.
  if (!album) return <AdminNotFoundPageScreen />;

  const { event, hostLabel, counts, position, next } = album;
  const items = await toModerationFeedItems(album.media, covered);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const pager = (
    <AlbumPager
      eventId={event.id}
      position={position}
      shown={items.length}
      total={total}
      next={next}
    />
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/albums"
        prefetch={false}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Albums
      </Link>

      <div>
        {/* No size override: the event name is this page's h1 and wears the
            ladder's `page` step like every other app title (2026-09-17). */}
        <PageHeading>{event.name}</PageHeading>
        <p className="text-sm text-muted-foreground">
          {hostLabel ?? event.host_id}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Album</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Host">
            <Link
              href={`/admin/accounts/${event.host_id}`}
              prefetch={false}
              className="text-foreground underline"
            >
              {hostLabel ?? "View account"}
            </Link>
          </Row>
          <Row label="Visibility">
            {event.visibility === "open"
              ? "Public"
              : event.visibility === "password"
                ? "Password protected"
                : "Private"}
          </Row>
          <Row label="Uploads">
            {event.accepting_uploads ? "Open" : "Closed"}
          </Row>
          <Row label="Moderation">
            {MODERATION_LABEL[event.moderation_mode]}
          </Row>
          <Row label="Media">
            {formatCount(counts.approved)} approved,{" "}
            {formatCount(counts.pending)} pending, {formatCount(counts.hidden)}{" "}
            hidden, {formatCount(counts.removed)} removed
          </Row>
          <Row label="Created">
            <span>{formatAdminTimestamp(event.created_at)}</span>
          </Row>
        </CardContent>
      </Card>

      {items.length > 0 ? (
        <>
          {pager}
          <ModerationGrid items={items} mode="album" />
          {pager}
        </>
      ) : total > 0 ? (
        // An older page past the album's end (a stale link): the album is there, this page holds nothing.
        pager
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No media</CardTitle>
            <CardDescription>This album has no uploads.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
