import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
import { toModerationFeedItems } from "@/lib/r2/grid-items";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Album" };

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
  const album = await getAlbumForModeration(eventId);
  if (!album) notFound();

  const { event, hostLabel, counts } = album;
  const items = await toModerationFeedItems(album.media);

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
        <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
        <p className="text-sm text-muted-foreground">
          {hostLabel ?? event.host_id}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Album</CardTitle>
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
          <Row label="Visibility">{event.is_public ? "Public" : "Private"}</Row>
          <Row label="Uploads">
            {event.accepting_uploads ? "Open" : "Closed"}
          </Row>
          <Row label="Moderation">
            {MODERATION_LABEL[event.moderation_mode]}
          </Row>
          <Row label="Media">
            {counts.approved} approved, {counts.pending} pending,{" "}
            {counts.hidden} hidden, {counts.removed} removed
          </Row>
          <Row label="Created">
            <span suppressHydrationWarning>
              {new Date(event.created_at).toLocaleString()}
            </span>
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
