"use client";

/**
 * Lazy entry for MediaLightbox (Phase 3 code split). The lightbox is ~700
 * lines of gesture machinery every gallery surface statically shipped in its
 * first-load JS even though it only matters on the first tile tap. This
 * wrapper:
 *  - moves the chunk out of first-load (next/dynamic, ssr:false — it renders
 *    into a portal on interaction; nothing to SSR),
 *  - MOUNT-LATCHES: nothing renders until the first open (the real component
 *    is always-mounted-while-closed by design — its settle/close semantics,
 *    which the behavior pins encode, depend on staying mounted), and once
 *    opened it STAYS mounted so close/reopen behaves exactly as before,
 *  - exposes preloadMediaLightbox() so grids can warm the chunk on the first
 *    pointerover/touchstart and the first tap opens without a beat.
 *
 * media-lightbox.tsx itself is untouched — the behavior pins import it
 * directly.
 */
import dynamic from "next/dynamic";
import { useState } from "react";
import type { ComponentProps } from "react";

import type { MediaLightbox } from "./media-lightbox";

const LazyLightbox = dynamic(
  () => import("./media-lightbox").then((m) => m.MediaLightbox),
  { ssr: false },
);

export function preloadMediaLightbox() {
  void import("./media-lightbox");
}

export function MediaLightboxLazy(
  props: ComponentProps<typeof MediaLightbox>,
) {
  const [everOpened, setEverOpened] = useState(false);
  // Render-phase latch: the first open flips it (legal same-component
  // render-phase setState); after that the lightbox stays mounted closed.
  if (props.index !== null && !everOpened) setEverOpened(true);
  if (props.index === null && !everOpened) return null;
  return <LazyLightbox {...props} />;
}
