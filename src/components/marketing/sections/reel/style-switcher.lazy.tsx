"use client";

import { lazy, Suspense } from "react";

import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { StyleSwitcherFallback } from "./style-switcher-fallback";

// ★ THE ENGINE BOUNDARY (the GuestReelOverlayLazy precedent): this dynamic import is
// the ONLY door to the canvas engine on the whole marketing surface. The island module
// (and through it CanvasReelPlayer, the draw registry with all 14 styles, the asset
// loader) lands in its own chunk, fetched on approach — ZERO engine code rides the
// page's initial chunks. Nothing outside this lazy() may import the island statically;
// everything the initial chunk needs (catalog names, poster, geometry) comes from
// style-facets.ts / the fallback instead.
const StyleSwitcherIsland = lazy(() =>
  import("./style-switcher-island").then((m) => ({
    default: m.StyleSwitcherIsland,
  })),
);

/**
 * The switcher's mount gate. Three states, one geometry:
 *  - far away / no JS: the static fallback (poster + the named 14, SSR-rendered);
 *  - on approach (threshold 0 + a generous 600px margin, so the chunk + first decode
 *    land while the visitor is still scrolling toward it): the island, with the same
 *    fallback as the Suspense hold;
 *  - reduced motion: the fallback FOREVER — a live montage loop is exactly the motion
 *    the preference refuses, and the static catalog carries every fact.
 */
export function StyleSwitcher() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0, "600px 0px");
  const reduced = usePrefersReducedMotion();
  const live = inView && !reduced;

  return (
    <div ref={ref}>
      {live ? (
        <Suspense fallback={<StyleSwitcherFallback />}>
          <StyleSwitcherIsland />
        </Suspense>
      ) : (
        <StyleSwitcherFallback />
      )}
    </div>
  );
}
