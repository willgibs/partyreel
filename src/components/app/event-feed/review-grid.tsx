"use client";

import {
  SelectableMediaGrid,
  type SelectableMediaGridProps,
} from "./selectable-media-grid";

// The inline pending-review grid = the shared SelectableMediaGrid with previews ON (the host peeks a
// photo/video before approving; a tap toggles only in select mode, so scrolling the "All" feed never
// selects by accident). The Gallery album bulk-select renders the same grid with previews OFF. Kept as a
// thin named wrapper so the Review surface (review-section.tsx) is untouched.
export function ReviewGrid(
  props: Omit<SelectableMediaGridProps, "enablePreview">,
) {
  return <SelectableMediaGrid {...props} enablePreview />;
}
