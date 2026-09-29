import Link from "next/link";

import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { AlbumStream } from "@/components/shared/album-stream/album-stream";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import { LiveAlbum, LiveAlbumStage } from "./live-album-stage";

/**
 * /features/album's hero, from three boards (the album-wiring lane,
 * 2026-09-19; the push, album-motion r1, 2026-09-29): the shared `PageHero`
 * lockup at the `title` step, the LIVE guest album under it, and photographs
 * falling out of the empty space around the words, each one drawn in and
 * dissolving at the album's top edge as the album takes it in the way a guest's
 * album takes an upload (its row opening from the left).
 *
 * Every part of it was chosen: `album-width=w880` (the site's 896 step),
 * `headline=lg`, `copy=page` and `no-script=settled` on the album hero's round
 * three; `visual=live`, `motion=stream` and `light=halo` on the album page's
 * round one; `fall=push` on album-motion's, with his note keeping the stream on
 * both sides of the words. What it replaces is the album FILLING from the top, a
 * demonstration of a mechanic; what stands here now is the album itself,
 * working, with the page's own sentence drawn around it.
 *
 * ★ THE MOTION IS BEHIND THE ALBUM. The stream rides `PageHero`'s `backdrop`
 * slot, which paints UNDER the page's container, so a photograph dissolving
 * into the album's top edge goes in behind the frame; what arrives is the
 * album's own push, one photograph at a time.
 *
 * ★ A SERVER COMPONENT, AND THE H1 NEVER MOVES. The lockup and its copy render
 * on the server; `LiveAlbum` (the album the stream hands its photographs to)
 * wraps the hero only to share that album between its backdrop and its stage,
 * and the lockup passes through it as server-rendered children. The H1 is
 * static by `PageHero`'s contract (the LCP rule), and the stream's rest state
 * IS server HTML, so a reader with scripting off gets the settled composition
 * rather than an empty hero (his `no-script=settled`).
 *
 * ★ `relative`, AND `overflow-x-clip` RATHER THAN `hidden`. The backdrop is
 * absolutely positioned inside this section, so the section has to be its
 * containing block; the stream runs to the window's edges at 1280, where the
 * room beside the words is thinnest, and clipping on ONE axis stops the page
 * scrolling sideways while leaving the halo's light free to spill below.
 *
 * ★ THE PADDING IS THE STREAM'S OWN ROOM. `pt` is the band above the eyebrow
 * the frames are born in at a desk; `pb` is the floor the album's light pools
 * on, and it is `STAGE.floor` on the other side of the same arithmetic, which is
 * why it is written in pixels rather than on the spacing scale, and why it
 * steps at `xl` (1280), where the stream and the stage change composition.
 */
export function ArrivalsHero() {
  const page = featurePage("album");

  return (
    <LiveAlbum>
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
        backdrop={<AlbumStream />}
        className="relative overflow-x-clip pt-14 pb-[110px] sm:pt-20 xl:pb-[150px]"
      >
        <LiveAlbumStage />
      </PageHero>
    </LiveAlbum>
  );
}
