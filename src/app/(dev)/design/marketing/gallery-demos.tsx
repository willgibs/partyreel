import Image from "next/image";
import Link from "next/link";

import { FAQ_ITEMS } from "@/components/marketing/faq-data";
import {
  AlbumFrame,
  BrowserFrame,
  GalleryFrame,
  PhoneFrame,
  PhoneShell,
  QrFrame,
  ReelFrame,
} from "@/components/marketing/frames";
import { LiveQr } from "@/components/marketing/frames/live-qr";
import { FeatureDoor } from "@/components/marketing/sections/features/shared/feature-door";
import { FeatureFaq } from "@/components/marketing/sections/features/shared/feature-faq";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { GhostBackdrop } from "@/components/marketing/sections/features/shared/ghost-grid";
import { GoDeeper } from "@/components/marketing/sections/features/shared/go-deeper";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import {
  BulkBarMock,
  SelectTile,
} from "@/components/marketing/sections/shared/bulk-select-mock";
import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Caption } from "@/components/marketing/system/caption";
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
import { ScreenLamp } from "@/components/marketing/system/screen-lamp";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { marketingImage } from "@/lib/constants/marketing-media";

import type { GalleryEntry } from "../gallery/entry";
import {
  LIBRARY_CARD_IDS,
  LIBRARY_CONVEYOR_IDS,
  LIBRARY_MORPH_SLUG,
  LIBRARY_REEL_ID,
  LIBRARY_SELECT_TILES,
} from "../reference/marketing-sample-data";
import { Row } from "../reference/reference-ui";
import {
  ConfettiDemo,
  OverlayDemo,
  RevealDemo,
  StatBandDemo,
  TextsRevealDemo,
  TextSwapDemo,
} from "./marketing-demos";

/**
 * THE MARKETING SYSTEM, declared (the gallery round, 2026-09-12).
 *
 * Every component of @/components/marketing/system, every shared section atom,
 * every frame and the feature family's furniture, each with an entry of its
 * own. The page it renders on supplies the real cinema skin, so a specimen
 * here needs no wrapper of its own; what it does need, and now has, is a
 * declared variants model, because these are the components with real prop
 * axes (three hero scales, three entrances, three reveals) and the page used
 * to show whichever subset somebody had written a Spec for.
 *
 * It declares NO component of its own: marketing-library.test.ts checks that,
 * and it is the line between a specimen sheet and a board.
 */

const cards = LIBRARY_CARD_IDS.map((id) => marketingImage(id));
const strip = LIBRARY_CONVEYOR_IDS.map((id) => marketingImage(id));
const split = marketingImage("reception-table");
const morphCover = marketingImage("wedding-petals");
const stageIds = [
  "wedding-golden",
  "party-balloons",
  "reception-table",
] as const;

const tiles = (sizes: string) =>
  stageIds.map((id) => (
    <span
      key={id}
      className="relative aspect-square overflow-hidden rounded-[3px]"
    >
      <Image
        src={marketingImage(id).src}
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
      />
    </span>
  ));

export const MARKETING_ENTRIES: GalleryEntry[] = [
  /* ─────────────────────────────── Shells ─────────────────────────────── */
  {
    id: "section-shell",
    family: "marketing",
    section: "Shells",
    play: "section-shell",
    variants: [
      {
        prop: "scale",
        source: "prop",
        fallback: "default",
        options: ["default", "lg"],
      },
      {
        prop: "align",
        source: "prop",
        fallback: "center",
        options: ["center", "left"],
      },
      {
        prop: "width",
        source: "prop",
        fallback: "default",
        options: ["default", "narrow", "wide"],
      },
      {
        prop: "reveal",
        source: "prop",
        fallback: "standard",
        options: ["cinema", "standard", "none"],
        note: "The cut the section arrives on. A chapter opener takes cinema; a supporting section takes standard; a shell inside a paper cut takes none.",
      },
    ],
    specimens: [
      {
        label: "Standard, centred",
        hint: "reveal=standard · align=center",
        bleed: true,
        node: (
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
        ),
      },
      {
        label: "Large, left, narrow",
        hint: "scale=lg · align=left · width=narrow",
        bleed: true,
        node: (
          <SectionShell
            eyebrow="Curation"
            heading="Tidy it up, then share it"
            subhead="A left-aligned lockup at the large scale."
            scale="lg"
            align="left"
            width="narrow"
            className="py-12"
          />
        ),
      },
      {
        label: "The cinema reveal",
        hint: "reveal=cinema",
        bleed: true,
        node: (
          <SectionShell
            eyebrow="The reel"
            heading="The cinema reveal, with its cut"
            reveal="cinema"
            className="py-12"
          />
        ),
      },
    ],
  },
  {
    id: "paper-chapter",
    family: "marketing",
    section: "Shells",
    specimens: [
      {
        label: "A chapter on paper",
        hint: "a reveal=none shell inside the paper cut",
        bleed: true,
        node: (
          <PaperChapter>
            <SectionShell
              eyebrow="Paper"
              heading="A chapter on paper"
              subhead="The token subtree flips to paper; the hairline marks the cut."
              reveal="none"
              className="py-12"
            />
          </PaperChapter>

      },
    ],
  },

  /* ─────────────────────────────── Heroes ─────────────────────────────── */
  {
    id: "page-hero",
    family: "marketing",
    section: "Heroes",
    play: "page-hero",
    lede: "A page renders one. The h1 holds at paint in every register, which is rule 13 and why no entrance may gate it.",
    variants: [
      {
        prop: "scale",
        source: "prop",
        fallback: "lg",
        options: ["display", "xl", "lg"],
        note: "The display step is single-line under its 12vw clamp, so its heading is one or two words by contract.",
      },
      {
        prop: "align",
        source: "prop",
        fallback: "center",
        options: ["center", "left"],
      },
      {
        prop: "entrance",
        source: "prop",
        fallback: "rise",
        options: ["rise", "cut", "blur"],
        note: "Rise for the identity pages and /pricing, cut for the cinema family, blur for the utility trio. The cut register, with a stage under the lockup, is on the ScreenLamp entry below.",
      },
    ],
    specimens: [
      {
        label: "display",
        hint: "scale=display · one or two words, by contract",
        bleed: true,
        node: (
          <PageHero
            scale="display"
            eyebrow="Press"
            heading="Press kit"
            subhead="The largest lockup: one or two words by contract, since the step is single-line under its 12vw clamp."
            className="py-12"
          />
        ),
      },
      {
        label: "xl, with actions",
        hint: "scale=xl",
        bleed: true,
        node: (
          <PageHero
            scale="xl"
            eyebrow="Pricing"
            heading="Start free. Grow when the room does."
            actions={
              <Row className="justify-center">
                <span className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                  Primary action
                </span>
                <span className="text-sm text-muted-foreground">Secondary</span>
              </Row>
            }
            className="py-12"
          />
        ),
      },
      {
        label: "lg, left",
        hint: "scale=lg · align=left",
        bleed: true,
        node: (
          <PageHero
            scale="lg"
            align="left"
            eyebrow="Help"
            heading="How can we help?"
            subhead="The compact lockup, left-aligned."
            className="py-12"
          />
        ),
      },
      {
        label: "blur",
        hint: "entrance=blur · the texts-reveal on the slots, the h1 still",
        bleed: true,
        node: (
          <PageHero
            scale="lg"
            entrance="blur"
            eyebrow="Help center"
            heading="How can we help?"
            subhead="The utility trio's register: eyebrow, subhead and actions rise through the blur while the title is already there."
            actions={
              <Row className="justify-center">
                <span className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                  Search the guides
                </span>
              </Row>
            }
            className="py-12"
          />
        ),
      },
    ],
  },
  {
    id: "screen-lamp",
    family: "marketing",
    section: "Heroes",
    specimens: [
      {
        // The stage slot and the one underlight, as a feature hero composes
        // them: the lockup holds still (the H1 never moves), the object arrives
        // under it, and ScreenLamp throws the object's own sampled light down
        // off its bottom edge. The section is overflow-x-clip (the lamp's
        // contract: never overflow-hidden) and reserves the lamp's height below
        // the frame, since the field is absolute.
        label: "A hero's stage, lit",
        hint: "entrance=cut · children under the lockup · the lamp samples the frame",
        bleed: true,
        node: (
          <PageHero
            scale="lg"
            entrance="cut"
            eyebrow="Album"
            heading="One album, filling itself."
            subhead="The cut register with a stage: the type holds, the object under it arrives with its own lamp."
            className="overflow-x-clip py-12 pb-72"
          >
            <div className="mt-10">
              <ScreenLamp>
                <div className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-xl border border-border bg-card p-2">
                  {tiles("140px")}
                </div>
              </ScreenLamp>
            </div>
          </PageHero>

      },
    ],
  },

  /* ────────────────────── Type atoms and links ─────────────────────────── */
  {
    id: "eyebrow",
    family: "marketing",
    section: "Type atoms and links",
    play: "eyebrow",
    specimens: [],
  },
  {
    id: "caption",
    family: "marketing",
    section: "Type atoms and links",
    play: "caption",
    specimens: [
      {
        label: "Beside the data it describes",
        hint: "every label and descriptor",
        node: (
          <Caption>
            Mono holds the data (timecodes, counts, sizes, URLs, indices); a
            sentence like this one is Inter.
          </Caption>
        ),
      },
    ],
  },
  {
    id: "mono-caption",
    family: "marketing",
    section: "Type atoms and links",
    play: "mono-caption",
    specimens: [
      {
        label: "Data only",
        hint: "a label in mono is the tell this rule exists to stop",
        node: <MonoCaption>00:00:12 · rendered on your device</MonoCaption>,
      },
    ],
  },
  {
    id: "learn-more-link",
    family: "marketing",
    section: "Type atoms and links",
    specimens: [
      {
        label: "LearnMoreLink",
        node: <LearnMoreLink href="/features">See every feature</LearnMoreLink>,
      },
    ],
  },
  {
    id: "learn-chevron",
    family: "marketing",
    section: "Type atoms and links",
    specimens: [
      {
        label: "LearnChevron",
        hint: "inside an ancestor carrying .mkt-learn",
        node: (
          <Link
            href="/contact"
            className="mkt-learn inline-flex items-center gap-1 text-sm"
          >
            Ask a question
            <LearnChevron />
          </Link>
        ),
      },
    ],
  },
  {
    id: "texts-reveal",
    family: "marketing",
    section: "Type atoms and links",
    specimens: [
      {
        label: "TextsReveal",
        hint: "class-keyed lines · Replay re-mounts",
        node: <TextsRevealDemo />,
      },
    ],
  },
  {
    id: "reveal",
    family: "marketing",
    section: "Type atoms and links",
    specimens: [
      {
        label: "Reveal",
        hint: "data-inview flips once · Replay re-mounts",

      },
    ],
  },

  /* ─────────────────────────────── Media ──────────────────────────────── */
  {
    id: "card-grid",
    family: "marketing",
    section: "Media",
    variants: [
      {
        prop: "columns",
        source: "declared",
        fallback: "3",
        options: ["2", "3", "4"],
        note: "The desktop column count; a phone is always one column.",
      },
      {
        prop: "tilt",
        source: "declared",
        fallback: "false",
        options: ["false", "true"],
        note: "Wraps each child in the pointer-tracked TiltCard.",
      },
    ],
    specimens: [
      {
        label: "Of TiltCards",
        hint: "tilt · columns=3 · pointer-tracked, flat under reduced motion",
        node: (
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
                <p className="px-4 py-3 text-sm font-medium">{image.subject}</p>
              </div>
            ))}
          </CardGrid>
        ),
      },
    ],
  },
  {
    id: "tilt-card",
    family: "marketing",
    section: "Media",
    specimens: [
      {
        label: "On its own",
        hint: "maxTiltDeg=6",
        node: (
          <div className="max-w-xs">
            <TiltCard className="rounded-2xl" maxTiltDeg={6}>
              <div className="rounded-2xl border border-border bg-card p-5 text-sm">
                A card that leans toward the pointer.
              </div>
            </TiltCard>
          </div>
        ),
      },
    ],
  },
  {
    id: "media-split",
    family: "marketing",
    section: "Media",
    variants: [
      {
        prop: "mediaSide",
        source: "prop",
        fallback: "start",
        options: ["start", "end"],
        note: "Seven columns of media, five of copy; one column on a phone.",
      },
    ],
    specimens: [
      {
        label: "Media start",
        hint: "mediaSide=start (default)",
        node: (
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
        ),
      },
      {
        label: "Media end",
        hint: "mediaSide=end",
        node: (
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
            <p className="mt-3 text-lg font-medium">The same split, flipped.</p>
          </MediaSplit>
        ),
      },
    ],
  },
  {
    id: "conveyor",
    family: "marketing",
    section: "Media",
    specimens: [
      {
        label: "Six manifest images",
        hint: "pauses offscreen · static row under reduced motion",
        bleed: true,
        contentClassName: "py-5",
        node: (
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
        ),
      },
    ],
  },
  {
    id: "inline-reel-player",
    family: "marketing",
    section: "Media",
    specimens: [
      {

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
        ),
      },
    ],
  },

  /* ─────────────────────────────── Frames ─────────────────────────────── */
  {
    id: "browser-frame",
    family: "marketing",
    section: "Frames",
    lede: "The media-frame library: a set of distinct frames, never one visual reused. All share BrowserFrame's tokens, all aria-hidden and reduced-motion-safe.",
    specimens: [
      {
        label: "BrowserFrame",
        hint: "label + children",
        node: (
          <BrowserFrame
            label={
              <span className="font-mono text-[11px]">
                partyreel.com/a/maya-and-jay
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-1 p-2">{tiles("120px")}</div>
          </BrowserFrame>
        ),
      },
    ],
  },
  {
    id: "phone-frame",
    family: "marketing",
    section: "Frames",
    title: "PhoneFrame",
    specimens: [
      {
        label: "PhoneShell",
        hint: "the bezel with a children slot",
        node: (
          <PhoneShell className="mx-auto max-w-[220px]">
            <p className="text-xs font-medium">Any screen goes here.</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              The album&rsquo;s phones and the getting-in stage compose it.
            </p>
          </PhoneShell>
        ),
      },
      {
        label: "PhoneFrame",
        hint: "the upload mock inside the shell",
        node: <PhoneFrame />,
      },
    ],
  },
  {
    id: "album-frame",
    family: "marketing",
    section: "Frames",
    specimens: [
      { label: "AlbumFrame", hint: "default label", node: <AlbumFrame /> },
    ],
  },
  {
    id: "gallery-frame",
    family: "marketing",
    section: "Frames",
    specimens: [
      { label: "GalleryFrame", hint: "default label", node: <GalleryFrame /> },
    ],
  },
  {
    id: "qr-frame",
    family: "marketing",
    section: "Frames",
    specimens: [
      {
        label: "QrFrame",
        hint: "decorative without liveQrUrl",
        node: <QrFrame />,
      },
    ],
  },
  {
    id: "reel-frame",
    family: "marketing",
    section: "Frames",
    specimens: [
      {
        label: "ReelFrame",
        hint: "no media = the player at rest",

        hint: `reelId=${LIBRARY_REEL_ID} · poster first, click to play`,
        bleed: true,
        node: <InlineReelPlayer reelId={LIBRARY_REEL_ID} />,
      },
    ],
  },

  /* ─────────────────────────────── Beats ──────────────────────────────── */
  {
    id: "stat-band",
    family: "marketing",
    section: "Beats",
    variants: [
      {
        prop: "animate",
        source: "prop",
        fallback: "spin",
        options: ["spin", "pop", "none"],
        note: "How the numerals arrive: the odometer spin, a scale pop, or already there.",
      },
    ],
    specimens: [
      {
        label: "Spin",
        hint: "animate=spin",
        node: <StatBandDemo animate="spin" />,
      },
      {
        label: "Pop",
        hint: "animate=pop",
        node: <StatBandDemo animate="pop" />,
      },
    ],
  },
  {
    id: "confetti-burst",
    family: "marketing",
    section: "Beats",
    specimens: [
      {
        label: "ConfettiBurst",
        hint: "fire increments · collides with the pill",
        node: <ConfettiDemo />,
      },
  {
    id: "go-deeper",
    family: "marketing",
    section: "Feature pieces",
    specimens: [
      {
        label: "GoDeeper",
        hint: "the quiet help pointer, on its own",
        node: (
          <GoDeeper
            links={[
              { href: "/help", label: "How curation works" },
              { href: "/pricing", label: "Every plan, side by side" },
            ]}
          />
        ),
      },
    ],
  },

  /* ────────────────────────────── Delegates ───────────────────────────── */
  {
    id: "morph-delegate",
    family: "marketing",
    section: "Beats",
    lede: "A delegate renders nothing and listens. The other invisible piece, WebAnalytics, is a document singleton the library lists and never mounts.",
    specimens: [
      {
        label: "The blog cover morph, on a real post",
        hint: "name=blog-cover",
        node: (
          <>
            <MorphDelegate
              name="blog-cover"
              linkAttr="data-cover-morph"
              plateAttr="data-cover-plate"
            />
            <Link
              href={`/blog/${LIBRARY_MORPH_SLUG}`}
              data-cover-morph=""
              className="group relative block aspect-4/5 max-w-[14rem] overflow-hidden rounded-lg bg-muted"

  },
  {
    id: "sample-reel-overlay.lazy",
    family: "marketing",
    section: "Beats",
    title: "SampleReelOverlay",
    specimens: [
      {
        label: "SampleReelOverlay",
        hint: "lazy default export · Escape closes",
        node: <OverlayDemo />,
      },
    ],
  },

  /* ──────────────────────────── Conversion ────────────────────────────── */
  {
    id: "cta-band",
    family: "marketing",
    section: "Conversion",
    lede: "The demo pieces render only when a demo event is configured (NEXT_PUBLIC_DEMO_QR_TOKEN); without it, DemoTicket and DemoCtaLink render nothing, by design.",
    variants: [
      {
        prop: "reveal",
        source: "prop",
        fallback: "standard",
        options: ["cinema", "standard", "none"],
      },
      {
        prop: "demoLink",
        source: "declared",
        fallback: "false",
        options: ["false", "true"],
      },
      {
        prop: "credit",
        source: "declared",
        fallback: "false",
        options: ["false", "true"],
      },
    ],
    specimens: [
      {
        label: "With the demo link and the credit",
        hint: "demoLink · credit",
        bleed: true,
        node: (
          <CtaBand
            heading="Your next event ends with a reel."
            subhead="A sample band: the primary defaults to the marketing CTA."
            demoLink
            credit
            className="py-12"
          />
        ),
      },
    ],
  },
  {
    id: "demo-ticket",
    family: "marketing",
    section: "Conversion",
    variants: [
      {
        prop: "layout",
        source: "prop",
        fallback: "row",
        options: ["row", "column"],
      },
    ],
    specimens: [
      {
        label: "Row",
        hint: "layout=row · dark glass, for a media backdrop",
        node: (
          <div className="rounded-lg bg-gallery p-4">
            <DemoTicket />
          </div>
        ),
      },
      {
        label: "Column",
        hint: "layout=column · the nav panel card",
        node: <DemoTicket layout="column" />,

  /* ─────────────────────────── Feature pieces ─────────────────────────── */
    ],
  },
  {
    id: "live-qr",
    family: "marketing",
    section: "Frames",
    specimens: [
      {
        label: "LiveQr",
        hint: "a real, scannable code",
        node: (
          <LiveQr
            url="https://partyreel.com"
            caption="Scan to open partyreel.com"
          />
        ),
      },
    ],
  },

  /* ───────────────────────── The feature family ───────────────────────── */
  {
    id: "feature-door",
    family: "marketing",
    section: "Feature pieces",
    lede: "The shared furniture of the six feature pages (the album is the model). The registry is src/lib/constants/feature-pages.ts.",
    variants: [
      {
        prop: "aspect",
        source: "prop",
        fallback: "landscape",
        options: ["portrait", "landscape", "wide"],
      },
      {
        prop: "copy",
        source: "prop",
        fallback: "short",
        options: ["short", "long"],
        note: "Short is the panel one-liner; long is the directory line the hub uses.",
      },
    ],
    specimens: [
      {
        label: "The album door",
        hint: "slug=album · copy=long",
        node: (
          <div className="max-w-sm">
            <FeatureDoor slug="album" copy="long" />
          </div>
        ),
      },
    ],
  },
  {
    id: "feature-hero-eyebrow",
    family: "marketing",
    section: "Feature pieces",
    specimens: [
      {
        label: "FeatureHeroEyebrow",
        hint: "the feature hero's one eyebrow",
        node: <FeatureHeroEyebrow label="The live album" />,
      },
    ],
  },
  {
    id: "ghost-grid",
    family: "marketing",
    section: "Feature pieces",
    title: "GhostBackdrop",
    specimens: [
      {
        label: "GhostBackdrop",
        hint: "cells=8 · the locked-gallery grid",
        node: (
          <div className="relative h-40 overflow-hidden rounded-lg border border-border">
            <GhostBackdrop cells={8} />
          </div>
        ),
      },
    ],
  },
  {
    id: "text-swap",
    family: "marketing",
    section: "Feature pieces",
    specimens: [
      {
        label: "TextSwap",
        hint: "imperative, exits up with blur",
        node: <TextSwapDemo />,
      },
    ],
  },
  {
    id: "related-features",
    family: "marketing",
    section: "Feature pieces",
    variants: [
      {
        prop: "opener",
        source: "declared",
        fallback: "false",
        options: ["false", "true"],
        note: "The band opens a page's close on the hard cut.",
      },
    ],
    specimens: [
      {
        label: "Three doors",
        hint: "slugs=qr, curation, sharing",
        bleed: true,
        node: <RelatedFeatures slugs={["qr", "curation", "sharing"]} />,
      },
    ],
  },
  {
    id: "feature-faq",
    family: "marketing",
    section: "Feature pieces",
    specimens: [
      {
        label: "One FAQ band, with GoDeeper inside it",
        hint: "items · children=GoDeeper",
        bleed: true,
        node: (
          <FeatureFaq items={FAQ_ITEMS.slice(0, 3)}>
            <GoDeeper
              links={[
                { href: "/help", label: "How curation works" },
                { href: "/pricing", label: "Every plan, side by side" },
              ]}
            />
          </FeatureFaq>
        ),
      },
  },
  {
    id: "demo-cta-link",
    family: "marketing",
    section: "Conversion",
    specimens: [
      {
        label: "DemoCtaLink",
        hint: "source=library · null without a demo",
        node: <DemoCtaLink source="library" />,
      },
    ],
  },

  /* ────────────────────────── Product mocks ───────────────────────────── */
  {
    id: "bulk-select-mock",
    family: "marketing",
    section: "Feature pieces",
    title: "BulkBarMock",
    lede: "Static pictures of the app's select mode, shared by the home and the curation feature page.",
    specimens: [
      {
        label: "BulkBarMock and SelectTile",
        hint: "count=3 · four tiles",
        node: (
          <div className="space-y-4">
            <div className="grid max-w-sm grid-cols-4 gap-1">
];
