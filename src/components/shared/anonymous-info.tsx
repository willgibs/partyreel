"use client";

import { Info } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * ★ RETIRED AT THE IDENTITY RESHAPE (2026-09-21), and kept on disk for the ONE
 * surface that still draws it: the Library's own gallery patterns
 * (`design/(shell)/library/patterns/gallery-demos.tsx`). Nothing in the product
 * mounts it. Anonymity left the product on Will's `address=none`, so there is no
 * longer an "Anonymous" credit for this to explain: every upload carries a name,
 * and a name nobody proved wears `shared/unverified-mark.tsx` instead, whose
 * popover says the same kind of thing about a fact that still exists.
 *
 * A wiring lane never deletes a module the lab imports, so the DELETE is the
 * Library's own (its catalog entry and this file, in one change) rather than
 * this lane's.
 */

// The "(i)" explainer beside an "Anonymous" attribution caption in the lightbox. A TAP-to-open
// popover (a Tooltip is hover/focus-only -> useless on touch, and guests are mobile-first). Copy is
// context-aware: a guest learns what + why (and can ask the host to tighten it); the host learns it
// is a toggle they can change (they may not realize anonymous uploads are on, or that it's an option).
const GUEST_COPY = "The host has enabled anonymous uploads for this event.";
const HOST_COPY =
  "Anonymous uploads are on for this event. Require an account in Settings to tie each upload to a name.";

export function AnonymousInfo({ viewerIsHost }: { viewerIsHost?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Why does this say Anonymous?"
        className="inline-flex items-center justify-center rounded-full text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none active:scale-90"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" className="text-sm">
        {viewerIsHost ? HOST_COPY : GUEST_COPY}
      </PopoverContent>
    </Popover>
  );
}
