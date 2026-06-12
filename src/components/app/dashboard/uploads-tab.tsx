import { Upload } from "lucide-react";

import { MyUploadsGallery } from "@/components/app/my-uploads-gallery";
import { EmptyState } from "@/components/shared/empty-state";
import { getMyUploadCards } from "@/lib/db/queries/my-uploads";

/** The personal Uploads tab as a STREAMED boundary (Phase 5 S1): the
 *  cross-event RPC + its per-item presigns live here, off the shell path. */
export async function UploadsTab() {
  const uploads = await getMyUploadCards();

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
