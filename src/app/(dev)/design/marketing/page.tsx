import Image from "next/image";
import Link from "next/link";

import {
  BulkBarMock,
  SelectTile,
} from "@/components/marketing/sections/shared/bulk-select-mock";
import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { CardGrid } from "@/components/marketing/system/card-grid";
import { Conveyor } from "@/components/marketing/system/conveyor";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { DemoTicket } from "@/components/marketing/system/demo-ticket";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { MorphDelegate } from "@/components/marketing/system/morph-delegate";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { marketingImage } from "@/lib/constants/marketing-media";
import { requireDesignKey } from "@/lib/design-gate/server";

import {
  LIBRARY_CARD_IDS,
  LIBRARY_CONVEYOR_IDS,
  LIBRARY_MORPH_SLUG,
  LIBRARY_REEL_ID,
  LIBRARY_SELECT_TILES,
} from "../reference/marketing-sample-data";
import { RefHeader, RefSection, Row, Spec } from "../reference/reference-ui";
import {
  ConfettiDemo,
  OverlayDemo,
  RevealDemo,
  StatBandDemo,
  TextsRevealDemo,
} from "./marketing-demos";

// THE MARKETING LIBRARY (the library round, 2026-09-02): every component of the
// marketing system (@/components/marketing/system) and every shared section atom
// (sections/shared), imported from production and rendered on the real cinema
// skin. The page is a specimen sheet, not a board: it declares no component of
// its own and uses only the props that exist today (marketing-library.test.ts
// pins both, and that every system file appears here). Edit a component, this
// updates. The skin wrapper mirrors (cinema)/layout.tsx so the [data-mkt-*]
// grammar, the room ink and the paper chapter cut render as they ship.
export default async function MarketingLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const cards = LIBRARY_CARD_IDS.map((id) => marketingImage(id));
  const strip = LIBRARY_CONVEYOR_IDS.map((id) => marketingImage(id));
  const split = marketingImage("reception-table");
  const morphCover = marketingImage("wedding-petals");

  return (
    <div
      className="dark overflow-x-clip bg-background text-foreground"
      data-mkt
      data-mkt-skin="cinema"
    >
      <main className="mx-auto w-full max-w-5xl px-6 pt-8 pb-20">
        <RefHeader
          eyebrow="Reference · live · cinema skin"
          title="Marketing"
          blurb="The marketing system and the shared section atoms, rendered from production source on the real cinema skin. Every specimen uses the props that exist today; the motion is marketing.css's own grammar, loaded by the lab layout."
        />

        <RefSection
          title="Shells"
          blurb="SectionShell carries the header lockup and the reveal; PaperChapter flips the token subtree to paper for a chapter cut."
        >
          <div className="space-y-3">
            <Spec
              label="SectionShell · standard"
              hint="reveal=standard · align=center"
              contentClassName="p-0"
            >
              <SectionShell
                eyebrow="One link"
                heading="Everything guests need is one scan away"
                subhead="The QR opens the event; the same link is the album."
                className="py-12"
              >
                <p className="mx-auto max-w-md text-center text-sm text-muted-foreground">
                  Children render under the lockup.
                </p>
              </SectionShell>
            </Spec>
            <Spec
              label="SectionShell · large, left"
              hint="scale=lg · align=left · width=narrow"
              contentClassName="p-0"
            >
              <SectionShell
                eyebrow="Curation"
                heading="Tidy it up, then share it"
                subhead="A left-aligned lockup at the large scale."
                scale="lg"
                align="left"
                width="narrow"
                className="py-12"
              />
            </Spec>
            <Spec
              label="SectionShell · cinema reveal"
              hint="reveal=cinema"
              contentClassName="p-0"
            >
              <SectionShell
                eyebrow="The reel"
                heading="The cinema reveal, with its cut"
                reveal="cinema"
                className="py-12"
              />
            </Spec>
            <Spec
              label="PaperChapter"
              hint="a reveal=none shell inside the paper cut"
              contentClassName="p-0"
            >
              <PaperChapter>
                <SectionShell
                  eyebrow="Paper"
                  heading="A chapter on paper"
                  subhead="The token subtree flips to paper; the hairline marks the cut."
                  reveal="none"
                  className="py-12"
                />
              </PaperChapter>
            </Spec>
          </div>
        </RefSection>

        <RefSection
          title="Heroes"
          blurb="PageHero at its three scales, on today's props (scale, align, eyebrow, heading, subhead, actions). A page renders one; three here is the specimen."
        >
          <div className="space-y-3">
            <Spec label="display" hint="scale=display" contentClassName="p-0">
              <PageHero
                scale="display"
                eyebrow="Press"
                heading="The whole event, in one album."
                subhead="The largest lockup, for the pages that open on a statement."
                className="py-12"
              />
            </Spec>
            <Spec
              label="xl"
              hint="scale=xl · with actions"
              contentClassName="p-0"
            >
              <PageHero
                scale="xl"
                eyebrow="Pricing"
                heading="Start free. Grow when the room does."
                actions={
                  <Row className="justify-center">
                    <span className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                      Primary action
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Secondary
                    </span>
                  </Row>
                }
                className="py-12"
              />
            </Spec>
            <Spec
              label="lg, left"
              hint="scale=lg · align=left"
              contentClassName="p-0"
            >
              <PageHero
                scale="lg"
                align="left"
                eyebrow="Help"
                heading="How can we help?"
                subhead="The compact lockup, left-aligned."
                className="py-12"
              />
            </Spec>
          </div>
        </RefSection>

        <RefSection
          title="Type atoms and links"
          blurb="The small pieces the sections are set in."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Spec label="Eyebrow" hint="system/eyebrow">
              <Eyebrow>How it works</Eyebrow>
            </Spec>
            <Spec label="MonoCaption" hint="system/mono-caption">
              <MonoCaption>00:00:12 · rendered on your device</MonoCaption>
            </Spec>
            <Spec label="LearnMoreLink" hint="sections/shared/learn-more-link">
              <LearnMoreLink href="/features">See every feature</LearnMoreLink>
            </Spec>
            <Spec
              label="LearnChevron"
              hint="inside an ancestor carrying .mkt-learn"
            >
              <Link
                href="/contact"
                className="mkt-learn inline-flex items-center gap-1 text-sm"
              >
                Ask a question
                <LearnChevron />
              </Link>
            </Spec>
            <Spec
              label="TextsReveal"
              hint="class-keyed lines · Replay re-mounts"
            >
              <TextsRevealDemo />
            </Spec>
            <Spec
              label="Reveal"
              hint="data-inview flips once · Replay re-mounts"
            >
              <RevealDemo />
            </Spec>
          </div>
        </RefSection>

        <RefSection
          title="Media"
          blurb="The frames the photographs and the reel sit in. Images come from the marketing manifest."
        >
          <div className="space-y-3">
            <Spec
              label="CardGrid of TiltCards"
              hint="tilt · columns=3 · pointer-tracked, flat under reduced motion"
            >
              <CardGrid tilt columns={3}>
                {cards.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl bg-card"
                  >
                    <Image
                      src={image.src}
                      alt=""
                      width={image.width}
                      height={image.height}
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="aspect-4/3 w-full object-cover"
                    />
                    <p className="px-4 py-3 text-sm font-medium">
                      {image.subject}
                    </p>
                  </div>
                ))}
              </CardGrid>
            </Spec>
            <Spec label="TiltCard alone" hint="maxTiltDeg=6">
              <div className="max-w-xs">
                <TiltCard className="rounded-2xl" maxTiltDeg={6}>
                  <div className="rounded-2xl border border-border bg-card p-5 text-sm">
                    A card that leans toward the pointer.
                  </div>
                </TiltCard>
              </div>
            </Spec>
            <Spec
              label="MediaSplit · media start"
              hint="mediaSide=start (default)"
            >
              <MediaSplit
                media={
                  <Image
                    src={split.src}
                    alt=""
                    width={split.width}
                    height={split.height}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="w-full rounded-xl object-cover"
                  />
                }
              >
                <Eyebrow>One link</Eyebrow>
                <p className="mt-3 text-lg font-medium">
                  Copy sits beside the media.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Seven columns of media, five of copy; one column on a phone.
                </p>
              </MediaSplit>
            </Spec>
            <Spec label="MediaSplit · media end" hint="mediaSide=end">
              <MediaSplit
                mediaSide="end"
                media={
                  <Image
                    src={split.src}
                    alt=""
                    width={split.width}
                    height={split.height}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="w-full rounded-xl object-cover"
                  />
                }
              >
                <Eyebrow>Mirrored</Eyebrow>
                <p className="mt-3 text-lg font-medium">
                  The same split, flipped.
                </p>
              </MediaSplit>
            </Spec>
            <Spec
              label="Conveyor"
              hint="six manifest images · pauses offscreen · static row under reduced motion"
              contentClassName="p-0 py-5"
            >
              <Conveyor>
                {strip.map((image) => (
                  <Image
                    key={image.id}
                    src={image.src}
                    alt=""
                    width={image.width}
                    height={image.height}
                    sizes="240px"
                    className="h-36 w-auto shrink-0 rounded-lg object-cover"
                  />
                ))}
              </Conveyor>
            </Spec>
            <Spec
              label="InlineReelPlayer"
              hint={`reelId=${LIBRARY_REEL_ID} · poster first, click to play`}
              contentClassName="p-0"
            >
              <InlineReelPlayer reelId={LIBRARY_REEL_ID} />
            </Spec>
          </div>
        </RefSection>

        <RefSection title="Beats" blurb="The moments that count or celebrate.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Spec label="StatBand · spin" hint="animate=spin">
              <StatBandDemo animate="spin" />
            </Spec>
            <Spec label="StatBand · pop" hint="animate=pop">
              <StatBandDemo animate="pop" />
            </Spec>
            <Spec
              label="ConfettiBurst"
              hint="fire increments · collides with the pill"
            >
              <ConfettiDemo />
            </Spec>
            <Spec
              label="SampleReelOverlay"
              hint="lazy default export · Escape closes"
            >
              <OverlayDemo />
            </Spec>
          </div>
        </RefSection>

        <RefSection
          title="Conversion"
          blurb="The demo pieces render only when a demo event is configured (NEXT_PUBLIC_DEMO_QR_TOKEN); without it, DemoTicket and DemoCtaLink render nothing, by design."
        >
          <div className="space-y-3">
            <Spec
              label="CtaBand"
              hint="demoLink · credit"
              contentClassName="p-0"
            >
              <CtaBand
                heading="Your next event ends with a reel."
                subhead="A sample band: the primary defaults to the marketing CTA."
                demoLink
                credit
                className="py-12"
              />
            </Spec>
            <div className="grid gap-3 sm:grid-cols-2">
              <Spec
                label="DemoTicket · row"
                hint="layout=row · dark glass, for a media backdrop"
              >
                <div className="rounded-lg bg-gallery p-4">
                  <DemoTicket />
                </div>
              </Spec>
              <Spec
                label="DemoTicket · column"
                hint="layout=column · the nav panel card"
              >
                <DemoTicket layout="column" />
              </Spec>
              <Spec
                label="DemoCtaLink"
                hint="source=library · null without a demo"
              >
                <DemoCtaLink source="library" />
              </Spec>
            </div>
          </div>
        </RefSection>

        <RefSection
          title="Product mocks"
          blurb="Static pictures of the app's select mode, shared by the home and the curation feature page."
        >
          <Spec label="BulkBarMock + SelectTile" hint="count=3 · four tiles">
            <div className="space-y-4">
              <div className="grid max-w-sm grid-cols-4 gap-1">
                {LIBRARY_SELECT_TILES.map((tile) => (
                  <SelectTile
                    key={tile.id}
                    id={tile.id}
                    selected={tile.selected}
                    sizes="96px"
                  />
                ))}
              </div>
              <BulkBarMock count={3} />
            </div>
          </Spec>
        </RefSection>

        <RefSection
          title="Delegates and singletons"
          blurb="The invisible pieces: a delegate renders nothing and listens; a singleton mounts once per document."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Spec
              label="MorphDelegate"
              hint="the blog cover morph, on a real post"
            >
              <MorphDelegate
                name="blog-cover"
                linkAttr="data-cover-morph"
                plateAttr="data-cover-plate"
              />
              <Link
                href={`/blog/${LIBRARY_MORPH_SLUG}`}
                data-cover-morph=""
                className="group relative block aspect-4/5 max-w-[14rem] overflow-hidden rounded-lg bg-muted"
              >
                <span data-cover-plate="" className="absolute inset-0">
                  <Image
                    src={morphCover.src}
                    alt=""
                    fill
                    sizes="224px"
                    className="object-cover"
                  />
                </span>
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">
                Click the cover: the plate grows into the article&rsquo;s own
                plate where the browser supports view transitions, and navigates
                plainly where it does not.
              </p>
            </Spec>
            <Spec label="WebAnalytics" hint="listed, never mounted here">
              <p className="text-sm text-muted-foreground">
                Mounted once in the marketing layout. It installs the Vercel
                analytics script and the data-track click listener; a second
                mount would double every event, so this page lists it and leaves
                it there.
              </p>
            </Spec>
          </div>
        </RefSection>
      </main>
    </div>
  );
}
