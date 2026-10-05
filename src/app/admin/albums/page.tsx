import type { Metadata } from "next";
import Link from "next/link";

import {
  removeMediaByOperatorAction,
  restoreMediaAction,
} from "@/app/admin/albums/actions";
import { ModerationGrid } from "@/components/admin/moderation-grid";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { listRecentMedia } from "@/lib/db/queries/moderation";
import { readCoveredItems } from "@/lib/db/queries/reports";
import {
  ALBUM_FILTER_META,
  ALBUM_FILTERS,
  parseAlbumFilter,
} from "@/lib/moderation/operator-actions";
import { toModerationFeedItems } from "@/lib/r2/grid-items";
import { cn } from "@/lib/utils";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Albums" };

export default async function AdminAlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { status } = await searchParams;
  const filter = parseAlbumFilter(status);
  const media = await listRecentMedia(filter);
  // ★ The worst kinds arrive covered here as in Reports (build 23's NIT-7): one rule, one home, and a
  // covered item is never signed.
  const covered = await readCoveredItems({ mediaIds: media.map((m) => m.id) });
  const items = await toModerationFeedItems(media, covered);

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Albums</PageHeading>
        <p className="text-sm text-muted-foreground">
          Recent uploads across every event. Remove unsafe media (it leaves the
          guest album right away); restore within the grace period.
        </p>
      </div>

      {/* Server-rendered status filter (no client JS); "Active" = everything not removed. */}
      <nav className="flex flex-wrap gap-1">
        {ALBUM_FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/albums" : `/admin/albums?status=${f}`}
            prefetch={false}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              filter === f
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {ALBUM_FILTER_META[f].label}
          </Link>
        ))}
      </nav>

      {items.length > 0 ? (
        <ModerationGrid
          items={items}
          mode="feed"
          removeAction={removeMediaByOperatorAction}
          restoreAction={restoreMediaAction}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No media</CardTitle>
            <CardDescription>
              {filter === "all"
                ? "No uploads yet."
                : `No ${ALBUM_FILTER_META[filter].label.toLowerCase()} media.`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
