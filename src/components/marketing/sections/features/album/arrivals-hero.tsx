import Link from "next/link";

import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { AlbumStream } from "@/components/shared/album-stream/album-stream";
import type { Variant } from "@/components/shared/album-stream/stream-engine";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import { LiveAlbumStage } from "./live-album-stage";

/**
 * /features/album's hero, from two ruled boards (the album-wiring lane,
 * 2026-09-19): the shared `PageHero` lockup at the `title` step, the LIVE guest
 * album under it, and photographs falling out of the empty space around the
 * words INTO the album's top edge.
 *
 * Will ruled every part of it. `album-width=w880` (the site's 896 step),
 * `headline=lg`, `copy=page` and `no-script=settled` on the album hero's round
 * three; `visual=live`, `motion=stream` and `light=halo` on the album page's
 * round one. What it replaces is the album FILLING from the top, a
 * demonstration of a mechanic; what stands here now is the album itself, with
 * the page's own sentence drawn around it.
 *
 * ★ THE MOTION IS BEHIND THE ALBUM, AND THAT IS THE WHOLE POINT. The stream
 * rides `PageHero`'s `backdrop` slot, which paints UNDER the page's container:
 * a photograph whose path ends a little way inside the album's top edge slides
 * BEHIND the frame and is gone. The album takes it in, with nothing to fade and
 * no trick, which is the one thing a motion on this page has to say.
 *
 * ★ A SERVER COMPONENT, AND THE H1 NEVER MOVES. The lockup and its copy render
 * on the server; only the stream and the stage carry hooks. The H1 is static by
 * `PageHero`'s contract (the LCP rule), and the stream's rest state IS server
 * HTML, so a reader with scripting off gets the settled composition rather than
 * an empty hero (his `no-script=settled`).
 *
 * ★ `relative`, AND `overflow-x-clip` RATHER THAN `hidden`. The backdrop is
 * absolutely positioned inside this section, so the section has to be its
 * containing block; the stream runs to the window's edges at 1024, where the
 * room beside the words is thinnest, and clipping on ONE axis stops the page
 * scrolling sideways while leaving the halo's light free to spill below.
 *
 * ★ THE PADDING IS THE STREAM'S OWN ROOM. `pt` is the band above the eyebrow
 * the frames are born in at `lg`; `pb` is the floor the album's light pools on,
 * and it is `STAGE.floor` on the other side of the same arithmetic, which is
 * why it is written in pixels rather than on the spacing scale.
 */
export function ArrivalsHero({
  /**
   * WHICH FALL THE STREAM DRAWS, forced. ★ PRODUCTION NEVER PASSES THIS: the
   * engine's own `SHIPPED` is the answer, and Will's pick is a one-word change
   * there. It exists so the `album-motion` board can draw two or three
   * variations of the falling-in ON THE WIRED HERO rather than on a mock of it,
   * which is what he asked for ("I was just curious to see maybe two to three
   * variations of this concept"). `PhotoSection`'s `source` prop carries the
   * same note for the same reason.
   */
  variant,
}: {
  variant?: Variant;
} = {}) {
  const page = featurePage("album");

  return (
    <PageHero
      entrance="cut"
      eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
      heading={page.h1}
      subhead={page.heroSub}
      actions={
        <>
          <Button asChild size="cta">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
          </Button>
          <Button asChild size="cta" variant="outline">
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </>
      }
      backdrop={<AlbumStream variant={variant} />}
      className="relative overflow-x-clip pt-14 pb-[110px] sm:pt-20 lg:pb-[150px]"
    >
      <LiveAlbumStage />
    </PageHero>
  );
}
