"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

import { TakeHomePanel } from "./take-home-panel";

// The host album's Download (sibling of GallerySelectButton): it opens her two sets, the originals to keep and
// phone size to post (take-home r1, `host=two`). size="sm" (h-7) respects the header's no-bounce row; outline
// matches the Select button.
export function GalleryDownloadAllButton({ eventId }: { eventId: string }) {
  return (
    <TakeHomePanel eventId={eventId}>
      <Button type="button" variant="outline" size="sm">
        <Download /> Download
      </Button>
    </TakeHomePanel>
  );
}
