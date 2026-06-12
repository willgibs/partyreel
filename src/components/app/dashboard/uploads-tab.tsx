"use client";

import { use } from "react";
import { Upload } from "lucide-react";

import { MyUploadsGallery } from "@/components/app/my-uploads-gallery";
import { EmptyState } from "@/components/shared/empty-state";
import type { getMyUploadCards } from "@/lib/db/queries/my-uploads";

type UploadsData = Awaited<ReturnType<typeof getMyUploadCards>>;

/** The personal Uploads tab as a use()-client section (Phase 5 S1 redo). */
export function UploadsTab({ promise }: { promise: Promise<UploadsData> }) {
  const uploads = use(promise);

  if (uploads.items.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No uploads yet"
        description="Photos and videos you add to your events, or share with others, show up here."
      />
    );
  }

  return (
    <MyUploadsGallery items={uploads.items} truncated={uploads.truncated} />
  );
}
