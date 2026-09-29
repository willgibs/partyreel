"use client";

import {
  SelectableMediaGrid,
  type SelectableMediaGridProps,
} from "./selectable-media-grid";

// The Review queue's grid = the shared SelectableMediaGrid with previews ON (the host peeks a
// photo/video before judging it; a tap toggles only in select mode, so scrolling the queue never
// selects by accident), on the UNIFORM layout (host-curation `queue=uniform`, Will: "This expected
// uniformity helps more with scanning across lots of media"; the album's own shapes are for
// experiencing it, and uniform tiles standardize the selection targets). The peek, its verdict
// and the keys' hint pass straight through.
export function ReviewGrid(
  props: Omit<SelectableMediaGridProps, "enablePreview" | "layout">,
) {
  return <SelectableMediaGrid {...props} enablePreview layout="uniform" />;
}
