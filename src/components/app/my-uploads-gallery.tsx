"use client";

import { MediaGrid, type GridMedia } from "@/components/app/media-grid";

// The personal cross-event "Uploads" gallery (Phase 4): a flat, newest-first grid of the viewer's OWN
// uploads (host + guest), reusing the public MediaGrid -- view + per-item download in the lightbox, NO
// moderation controls (this is a personal feed, not a host's event album). The lightbox shows each item's
// event context (set on the GridMedia). A truncation footer keeps the v1 cap honest; the empty state lives
// in the dashboard tab (mirrors the other tabs' "grid or empty" branch).
export function MyUploadsGallery({
  items,
  truncated,
}: {
  items: GridMedia[];
  truncated: boolean;
}) {
  return (
    <div className="space-y-4">
      <MediaGrid items={items} />
      {truncated && (
        <p className="text-center text-xs text-muted-foreground">
          Showing your {items.length} most recent uploads.
        </p>
      )}
    </div>
  );
}
