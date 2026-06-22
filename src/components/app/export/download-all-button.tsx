"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ExportDialog } from "./export-dialog";

// The host Gallery section-header "Download all" affordance (sibling of GallerySelectButton). Opens the
// config modal scoped to the host (the "Include hidden" control shows when there are hidden/pending
// items). size="sm" (h-7) respects the header's no-bounce row; outline matches the Select button.
export function GalleryDownloadAllButton({ eventId }: { eventId: string }) {
  return (
    <ExportDialog scope="host" albumKey={eventId} isHost>
      <Button type="button" variant="outline" size="sm">
        <Download /> Download
      </Button>
    </ExportDialog>
  );
}
