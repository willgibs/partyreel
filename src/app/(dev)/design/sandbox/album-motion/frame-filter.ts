"use client";

import { type RefObject, useEffect } from "react";

/**
 * THE LAMPS' TURBULENCE FIELD, CARRIED INTO THE FRAME.
 *
 * Every lamp's filter is `url(#glw-warp)`, and the one `<svg>` that defines it
 * is mounted once, in the root layout (`glow-filter.tsx`; its contract holds it
 * there). A preview here is portalled into a lab `Frame`, a document of its own
 * with no root layout, so the hero's halo would point at a filter its document
 * does not have and render as hard-edged blobs. So the frame is given a COPY of
 * the host document's field, once, as a DOM clone: one per document, which is
 * the rule, and never a second mount of the component, which is the contract.
 */
export function useFrameFilter(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const doc = ref.current?.ownerDocument;
    if (!doc || doc === document || doc.getElementById("glw-warp")) return;
    const field = document.getElementById("glw-warp")?.closest("svg");
    if (field) doc.body.appendChild(field.cloneNode(true));
  }, [ref]);
}
