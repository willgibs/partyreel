"use client";

import { createContext } from "react";

import type { GridMedia } from "@/components/app/media-grid";

/**
 * WHAT A GUEST'S DELETE COSTS BEYOND THE PHOTOGRAPH, said in the lightbox's confirm (guest by
 * upload, Will 2026-09-22, "Own deletes close it"): on a Require-an-upload-to-view album, a guest's
 * own removal no longer opens the door, so removing their LAST upload closes the album until they
 * add another, and the confirm says so before it happens.
 *
 * The album (`LiveGallery`) knows which item is the last and provides the line; the lightbox sits
 * under `shared/masonry.tsx`, a grid other surfaces own, so a context reaches it where a prop could
 * not. It lives in this tiny module rather than beside the lightbox so the album can provide it
 * without pulling the lazily loaded lightbox into its own chunk. Nobody provides it anywhere else,
 * and the confirm then reads exactly as before.
 */
export const DeleteConsequence = createContext<
  ((item: GridMedia) => string | null) | null
>(null);
