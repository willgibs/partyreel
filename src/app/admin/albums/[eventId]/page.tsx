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
import { toModerationFeedItems } from "@/lib/r2/grid-items";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

/** The album, read once a request for the page and its title (React's cache shares it within the render). */
const readAlbum = cache(getAlbumForModeration);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  // The title reads the record, so it passes the portal's gate first, as the page does: a service-role read never
  // runs for a request the gate turns away, and never before the MFA step.
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return { title: "Album" };
  const { eventId } = await params;
  // ★ A record that is gone is titled as the 404 it is (crumbs-28): the page draws its not-found itself.
  return (await readAlbum(eventId))
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

export default async function AdminAlbumDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { eventId } = await params;
  // ★ The worst kinds arrive covered here as in Reports (build 23's NIT-7): every item of the album any
  // report names as one, read by the rule's one home, and a covered item is never signed.
  const [album, covered] = await Promise.all([
    readAlbum(eventId),
    readCoveredItems({ eventId }),
  ]);
  // ★ DRAWN HERE, NEVER THROUGH `notFound()` (crumbs-28, the guest link's answer from `stale-link`): a thrown one is
  // served as Next's error shell, an empty body until the script has run. Drawn, it is in the HTML, titled by
  // generateMetadata's not-found answer. A 200 (a soft 404, the manifest's Question): the portal is behind the admin
  // gate and MFA and never indexed, so no reader of a status ever reaches it.
  if (!album) return <AdminNotFoundPageScreen />;

  const { event, hostLabel, counts } = album;
  const items = await toModerationFeedItems(album.media, covered);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/albums"
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
        <ModerationGrid items={items} mode="album" />
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
