import Image from "next/image";

import { Caption } from "@/components/marketing/system/caption";

import {
  HERO_REEL,
  STYLE_FACETS,
  SWITCHER_INITIAL_STYLE,
} from "./style-facets";

/**
 * The style switcher's STATIC face — what pre-hydration, no-JS, crawler, and
 * reduced-motion visitors get (and the Suspense hold while the island chunk lands):
 * the hero candidate's poster in the exact media box the live canvas will occupy, and
 * the full 14-style catalog as named text in its two facet groups (all names in the
 * HTML, so the catalog is real content, not an island secret).
 *
 * The poster is FRAME-TRUE to the island's first render (same clips + style + seed,
 * pinned in style-facets.test.ts), so the live swap reads as this exact reel waking up.
 *
 * GEOMETRY CONTRACT with style-switcher-island.tsx: the grid split, the media box
 * (max-w + aspect + card chrome), and the caption row must stay identical or the
 * island swap shifts layout. Change one file, change both.
 */
export function StyleSwitcherFallback() {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <div className="mx-auto w-full max-w-[300px]">
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border bg-black">
            <Image
              src={HERO_REEL.poster}
              alt=""
              fill
              sizes="300px"
              className="object-cover"
            />
          </div>
          <Caption className="mt-3 text-center">
            {SWITCHER_INITIAL_STYLE.label} · {SWITCHER_INITIAL_STYLE.kind}
          </Caption>
        </div>
      </div>
      <div className="flex flex-col gap-8 lg:col-span-7">
        {STYLE_FACETS.map((facet) => (
          <div key={facet.id} className="flex flex-col gap-3">
            <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {facet.label}
            </span>
            <ul className="flex flex-wrap gap-2">
              {facet.styles.map((style) => (
                <li
                  key={style.id}
                  className="rounded-full border px-3.5 py-1.5 text-sm text-muted-foreground"
                >
                  {style.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
