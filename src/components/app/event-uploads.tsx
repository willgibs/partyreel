"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { HostMediaGrid } from "@/components/app/host-media-grid";
import { HostUpload } from "@/components/app/host-upload";
import { type GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// The host's Uploads card. Wraps the grid in a client boundary so the header's "Add
// photos" toggle and the inline upload panel can share open-state. The grid items are
// plain, server-presigned objects (safe to pass server -> client). Host-added media is
// auto-approved and indistinguishable from guest media here (one seamless album); the
// data records the difference (guest_id IS NULL) if we ever want to surface it.
export function EventUploads({
  eventId,
  items,
  pendingCount,
}: {
  eventId: string;
  items: GridMedia[];
  pendingCount: number;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Uploads</CardTitle>
          <CardDescription>
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? "item" : "items"} in this album.`
              : "Photos and videos appear here, from guests or added by you."}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={adding}
          onClick={() => setAdding((v) => !v)}
        >
          <Upload className="size-4" /> Add photos
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {adding && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Add your own photos and videos, for example a batch from your
              photographer. These post to the album right away.
            </p>
            <HostUpload eventId={eventId} />
          </div>
        )}

        {items.length > 0 ? (
          <HostMediaGrid eventId={eventId} items={items} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0
              ? "Everything uploaded so far is awaiting your review above."
              : "No uploads yet. Add photos with the button above, or share the QR code with guests."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
