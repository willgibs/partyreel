"use client";

import { createContext } from "react";

import type { GridMedia } from "@/components/app/media-grid";

/**
 * WHAT A GUEST'S DELETE COSTS BEYOND THE PHOTOGRAPH, said in the lightbox's confirm: on a
 * Require-an-upload-to-view album, a guest's own removal takes their contribution back, so removing
 * their LAST upload closes the album until they add another, and the confirm says so before it
 * happens.
 *
 * The album (`LiveGallery`) knows which item is the last and provides the line; the lightbox sits
 * under `shared/masonry.tsx`, a grid other surfaces own, so a context reaches it where a prop could
 * not. It lives in this tiny module rather than beside the lightbox so the album can provide it
 * without pulling the lazily loaded lightbox into its own chunk. Nobody provides it anywhere else,
 * and there the confirm reads without the line.
 */
export const DeleteConsequence = createContext<
  ((item: GridMedia) => string | null) | null
>(null);

/**
 * WHETHER A GUEST'S OWN LAST REMOVAL CLOSES THIS ALBUM, which decides both the confirm's line and
 * the page's refresh after the removal lands: only on a Require-an-upload-to-view album whose
 * uploads are open, and never on a FULL one (the gate fails open there: a guest is never held at a
 * step they cannot pass, so their last removal closes nothing and the confirm must not say it
 * does). Never for the host, who never meets the gate, and never in the demo, where nothing is real.
 */
export function closesOnLastRemoval(input: {
  isDemo: boolean;
  isOwner: boolean;
  requireUpload: boolean;
  acceptingUploads: boolean;
  albumFull: boolean;
}): boolean {
  return (
    !input.isDemo &&
    !input.isOwner &&
    input.requireUpload &&
    input.acceptingUploads &&
    !input.albumFull
  );
}
