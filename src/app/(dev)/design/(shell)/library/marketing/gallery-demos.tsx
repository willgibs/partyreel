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
import { CinemaHero } from "@/components/marketing/sections/home/cinema-hero";
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
import { MorphDelegate } from "@/components/marketing/system/morph-delegate";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { ScreenLamp } from "@/components/marketing/system/screen-lamp";
import { SectionLight } from "@/components/marketing/system/section-light";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { marketingImage } from "@/lib/constants/marketing-media";

import type { GalleryEntry } from "@/app/(dev)/design/gallery/entry";
import {
  LIBRARY_CARD_IDS,
  LIBRARY_CONVEYOR_IDS,
  LIBRARY_MORPH_SLUG,
  LIBRARY_REEL_ID,
  LIBRARY_SELECT_TILES,
} from "@/app/(dev)/design/reference/marketing-sample-data";
import { Row } from "@/app/(dev)/design/reference/reference-ui";
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
 * every media frame and the feature family's furniture, each with an entry of
 * its own. The page it renders on supplies the real cinema skin, so a specimen
 * here needs no wrapper; what it did need, and now has, is a declared variants
 * model, because these are the components with real prop axes (three hero
 * scales, three entrances, three reveals) and the page this replaced showed
 * whichever subset somebody had written a <Spec> for.
 *
 * ONE COMPONENT, ONE ENTRY, which is what keying an entry to the file forces:
 * ScreenLamp used to live inside a PageHero specimen, GhostBackdrop shared a
 * frame with FeatureHeroEyebrow and GoDeeper shared one with FeatureFaq, so
 * three real components had no block and no permalink of their own.
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
        note: "lg is the one empty slot in the h2 ladder: above every body section, below the page h1.",
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
        note: "The inner Container's clamp: narrow is the reading column, wide the showcase bleed.",
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
        ),
      },
    ],
  },
  {
    id: "section-light",
    title: "SectionLight",
    badge: "new",
    family: "marketing",
    section: "Shells",
    lede: "The Aurora at chapter scale: a section's own two boundaries lit, with the copy in the clean band between them. Two seams, the bottom one the top one flipped on its own axis, each 42 percent of the section's height, on the accent register and a clock three laps slower than a lamp's. Dark grounds only, by construction.",
    variants: [
      {
        prop: "placement",
        source: "prop",
        fallback: "both",
        options: ["both", "top", "bottom", "room"],
        note: "Which of the section's boundaries carry the light. `middle` and `behind` are not values: the copy then sits IN the light instead of in the clean band between two of them, which is the half of the grammar a call site is most likely to get wrong.",
      },
    ],
    specimens: [
      {
        // The default, and the form Will approved: a chapter lit at both of its
        // own edges and nowhere in its middle. A real SectionShell underneath,
        // so the copy is real copy on the real ground.
        label: "both",
        hint: "a chapter's two boundaries · the copy in the clean band between them",
        bleed: true,
        node: (
          <SectionLight>
            <SectionShell
              eyebrow="Aurora"
              heading="A chapter with a temperature"
              subhead="The room is lit at its own edges. Nothing is glowing: the light is in the air, behind everything, on a clock three times slower than a lamp's."
              reveal="none"
              className="py-24"
            />
          </SectionLight>
        ),
      },
      {
        label: "top",
        hint: "one band, at the opening edge · a page's first chapter",
        bleed: true,
        node: (
          <SectionLight placement="top">
            <SectionShell
              eyebrow="Aurora"
              heading="Light at the opening edge"
              subhead="One band, where the chapter begins."
              reveal="none"
              className="py-24"
            />
          </SectionLight>
        ),
      },
      {
        label: "bottom",
        hint: "the same seam, flipped on its own axis · a page's closing chapter",
        bleed: true,
        node: (
          <SectionLight placement="bottom">
            <SectionShell
              eyebrow="Aurora"
              heading="Light at the closing edge"
              subhead="The engine has no bottom seam and should not grow one: the geometry is identical and only the vector differs."
              reveal="none"
              className="py-24"
            />
          </SectionLight>
        ),
      },
      {
        // The rarest of the four, and the one nearest a fence. It is still a
        // VECTOR (the cast is anchored at the section's own floor and thrown
        // upward), which is the whole difference between this and a fill behind
        // everything: that one sits its origin mid-box and becomes the wash the
        // doctrine refuses.
        label: "room",
        hint: "a cast from the section's own floor · for a chapter with nothing at its edges to light",
        bleed: true,
        node: (
          <SectionLight placement="room">
            <SectionShell
              eyebrow="Aurora"
              heading="The room, cast from its floor"
              subhead="One origin-anchored cast rather than two bands. Rare: it is the placement nearest the fence, and it still declares where its light comes from."
              reveal="none"
              className="py-24"
            />
          </SectionLight>
        ),
      },
      {
        // ★ THE FENCE, AS A SPECIMEN. Will, 2026-09-17: "we may not be able to
        // use the Aurora on white/paper surfaces. It's barely noticeable and
        // almost appears as a weird shadow or a stray artifact... No light
        // ground usage is a decision for now." So this frame is deliberately
        // unlit: the same component with the same props, inside a paper
        // chapter, painting nothing. A rule you can watch hold is worth more
        // than a rule in a comment.
        label: "on paper: nothing",
        hint: "the same component inside a PaperChapter · the fence is in globals.css, not in a prop",
        bleed: true,
        node: (
          <PaperChapter>
            <SectionLight>
              <SectionShell
                eyebrow="Aurora"
                heading="No light ground usage"
                subhead="The field paints nothing here, so a chapter that turns to paper a round later goes quiet on its own."
                reveal="none"
                className="py-24"
              />
            </SectionLight>
          </PaperChapter>
        ),
      },
    ],
  },

  /* ─────────────────────────────── Heroes ─────────────────────────────── */
  {
    id: "page-hero",
    badge: "updated",
    family: "marketing",
    section: "Heroes",
    play: "page-hero",
    lede: "A page renders one. The h1 holds at paint in every register, which is why no entrance may gate it.",
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
    badge: "updated",
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
        ),
      },
    ],
  },

  {
    id: "cinema-hero",
    title: "CinemaHero",
    badge: "new",
    family: "marketing",
    section: "Heroes",
    file: "src/components/marketing/sections/home/cinema-hero.tsx",
    lede: "The home's own first screen, and the one hero that is not a PageHero: the album streams out of the real demo code and the type sits where the band is measured never to reach.",
    specimens: [
      {
        // The REAL section at its real height, which is the only honest way to
        // show it: the composition is solved against the viewport (the axis is
        // clamped between the code clearing the site header and the block
        // clearing the fold), so a shrunken copy would be a different hero.
        // It is fluid by construction, so the frame's own width is what the
        // band measures itself against.
        label: "The home hero",
        hint: "the real section · the band runs, the code is the live demo's, the loop pauses off screen",
        bleed: true,
        node: <CinemaHero />,
      },
    ],
  },

  /* ────────────────────── Type atoms and links ─────────────────────────── */
  {
    id: "eyebrow",
    family: "marketing",
    section: "Type atoms and links",
    play: "eyebrow",
    // No specimen: for a one-line atom the config panel above IS the specimen,
    // and a static second copy of the same three words only reads as a
    // duplicate. The same call the Avatar entry makes on /design/components.
    specimens: [],
  },
  {
    id: "caption",
    badge: "new",
    family: "marketing",
    section: "Type atoms and links",
    play: "caption",
    specimens: [
      {
        label: "Beside the data it describes",
        hint: "every label and descriptor",
        node: (
          <Caption>
            Every label, hint and descriptor on the site, in the body face.
          </Caption>
        ),
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
    lede: "The bare chevron, for a card or row Link where nesting a LearnMoreLink (its own Link) would be invalid HTML.",
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
        node: <RevealDemo />,
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
        source: "prop",
        fallback: "3",
        options: ["2", "3", "4"],
        note: "The desktop column count; a phone is always one column. The other axis is the boolean tilt: without it the grid is pure layout and ships no JS, so the client island is opt-in per grid.",
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
    lede: "Mouse-only by deliberate deviation from the recipe: a finger over a marketing card must scroll the page, not tilt a tile.",
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
    lede: "The marquee shell, and the owner of the loop-pause contract: offscreen and hidden-tab freeze it, and reduced motion never mounts the marquee at all.",
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
    lede: "The one playback surface: the reel teaser's inline sample and the hero's overlay both render this, so the transport contract lives once and no video bytes load without intent.",
    specimens: [
      {
        label: "InlineReelPlayer",
        hint: `reelId=${LIBRARY_REEL_ID} · poster first, click to play`,
        bleed: true,
        node: <InlineReelPlayer reelId={LIBRARY_REEL_ID} />,
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
              <span className="text-[11px]">partyreel.com/a/maya-and-jay</span>
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
    lede: "The lightbox read of an album, deliberately distinct from AlbumFrame's even grid: one large media area on the dark gallery surface over a thumbnail strip.",
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
        node: <ReelFrame />,
      },
    ],
  },
  {
    id: "live-qr",
    family: "marketing",
    section: "Frames",
    lede: "The one frame that is not a picture of a thing: the app's own renderer on a real white plate, with the quiet zone a scanner needs.",
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

  /* ─────────────────────────────── Beats ──────────────────────────────── */
  {
    id: "stat-band",
    badge: "updated",
    family: "marketing",
    section: "Beats",
    lede: "It server-renders the FINAL digits, so no-JS and search always read the true numbers and the motion is pure enhancement.",
    variants: [
      {
        prop: "animate",
        source: "prop",
        fallback: "spin",
        options: ["spin", "pop", "none"],
        note: "How the numerals arrive: the odometer spin, a per-digit pop, or already there. Fired once in view, and reduced motion renders the final numbers whichever is set.",
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
    lede: "A one-shot beat with real physics, in the sanctioned confetti tokens. Never an ambient loop, so it sits outside the loop-pause contract by construction.",
    specimens: [
      {
        label: "ConfettiBurst",
        hint: "fire increments · collides with the pill",
        node: <ConfettiDemo />,
      },
    ],
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
  {
    id: "morph-delegate",
    family: "marketing",
    section: "Beats",
    lede: "A delegate renders nothing and listens, so N cards cost one listener and each of them stays a server component. The other invisible piece, WebAnalytics, is a document singleton the library lists and never mounts.",
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
          </>
        ),
      },
    ],
  },

  /* ──────────────────────────── Conversion ────────────────────────────── */
  {
    id: "cta-band",
    badge: "updated",
    family: "marketing",
    section: "Conversion",
    lede: "The one conversion band, composed from SectionShell so its heading scale and its entrance stay with every other section.",
    variants: [
      {
        prop: "reveal",
        source: "prop",
        fallback: "standard",
        options: ["cinema", "standard", "none"],
        note: "Passed straight through to the shell it composes.",
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
    badge: "updated",
    family: "marketing",
    section: "Conversion",
    lede: "The demo pieces render only when a demo event is configured (NEXT_PUBLIC_DEMO_QR_TOKEN); without it this and DemoCtaLink render nothing, by design, so a dead demo CTA is impossible.",
    variants: [
      {
        prop: "layout",
        source: "prop",
        fallback: "row",
        options: ["row", "column"],
        note: "The two shapes sit on different grounds and cannot share a palette: row is the hero's dark glass, column the opaque nav panel's card.",
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
      },
    ],
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

  /* ─────────────────────────── Feature pieces ─────────────────────────── */
  {
    id: "feature-door",
    family: "marketing",
    section: "Feature pieces",
    lede: "The shared furniture of the six feature pages (the album is the model). A door's labels and lines are read off src/lib/constants/feature-pages.ts, so its copy can never drift from the nav.",
    variants: [
      {
        prop: "slug",
        source: "prop",
        options: [
          "album",
          "qr",
          "curation",
          "sharing",
          "guests",
          "privacy",
          "reel",
        ],
        note: "Required, and it picks both the door's photograph and the chip that surface draws. reel is the one non-registry slug, special-cased the way the nav and the hub hand-append it.",
      },
      {
        prop: "aspect",
        source: "prop",
        fallback: "landscape",
        options: ["portrait", "landscape", "wide"],
        note: "Portrait is the app's uniform tile; landscape the sibling band's row of three; wide the hub's full-width lead.",
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
      {
        // The QR door is the one non-photograph, on purpose: a code is a made
        // object rather than a moment, so it renders through the real app
        // renderer on its own white plate over ink.
        label: "The QR door",
        hint: "slug=qr · aspect=portrait",
        node: (
          <div className="max-w-[14rem]">
            <FeatureDoor slug="qr" aspect="portrait" />
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
        fallback: "true",
        options: ["true", "false"],
        note: "True lands the doors on the hard cut with a chapter opener's air; false drops them to the body register, for a page whose close already opens on its own beat.",
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
    lede: "One FAQ band for all six feature pages: the shared accordion and the FAQPage JSON-LD over the same items, so the structured data cannot drift from what is on screen.",
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
    ],
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
  {
    id: "bulk-select-mock",
    family: "marketing",
    section: "Feature pieces",
    title: "BulkBarMock",
    lede: "Static pictures of the app's select mode, shared by the home and the curation feature page so the two can never drift from each other or from the app's own bar.",
    specimens: [
      {
        label: "BulkBarMock and SelectTile",
        hint: "count=3 · four tiles",
        node: (
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
        ),
      },
    ],
  },
];
