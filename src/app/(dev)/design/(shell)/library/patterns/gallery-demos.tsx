import Link from "next/link";
import { CircleAlert, Compass, ImageUp } from "lucide-react";

import { AnonymousInfo } from "@/components/shared/anonymous-info";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { Kbd } from "@/components/shared/kbd";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Logo } from "@/components/shared/logo";
import { CornerPlayBadge } from "@/components/shared/masonry";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { PageHeading } from "@/components/shared/page-heading";
import { PlayBadge } from "@/components/shared/play-badge";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";

import type { GalleryEntry } from "@/app/(dev)/design/gallery/entry";
import { Row } from "@/app/(dev)/design/reference/reference-ui";
import {
  ActionTooltipDemo,
  FloatingAddDemo,
  RouteSkeletonDemo,
  SetNameStepDemo,
  TileSizeControlDemo,
} from "./interactive-demos";

/**
 * THE COMPOSED PATTERNS, declared (the gallery round, 2026-09-12).
 *
 * The shared/* pieces an app surface is assembled from: the brand lockup, the
 * two media affordances, the dead ends, the form and info lines, and the small
 * chrome atoms. Every specimen is the REAL component imported from production
 * (which is also how the collector learns this page renders it), so editing a
 * component updates the block.
 *
 * TWO of them can never mount live, and the block says so rather than a
 * comment nobody reads: RouteError reports to Sentry in a mount effect, so its
 * specimen is a static mirror of the screen (RouteErrorMock, below), and
 * SetNameStep's submit runs a server action, so its preview is `inert`.
 *
 * Where a variants axis carries no `sample`, the specimen beneath it already
 * shows every option in the one context the component reads in; the axis is
 * there to name the prop and pin its values to the source.
 */

export const PATTERN_ENTRIES: GalleryEntry[] = [
  {
    id: "logo",
    file: "src/components/shared/logo.tsx",
    for: "the brand: the v1 wordmark alone, in the colour of whatever ground it sits on",
    test: "src/components/shared/logo.test.tsx",
    family: "patterns",
    section: "Brand",
    play: "logo",
    badge: "updated",
    lede: "The v1 wordmark, alone: the nav, the footer and every door wear the same drawing with no mark beside it. It is drawn in the text colour of the ground it sits on, from one path in src/lib/brand/wordmark.ts, and sized by its height. The v1 icon is still to come, so the mark is a stand-in that nothing in production mounts.",
    // No variants axis: markOnly is a boolean with no value names to pin, and
    // the config panel above already toggles it.
    specimens: [
      {
        // The size every bar wears, on both grounds: the wordmark takes
        // `currentColor`, so the paper half is the same component with nothing
        // passed, which is the whole reason it has no fill of its own.
        label: "In a bar",
        hint: "<Logo /> · 22px tall, the nav and the footer · the ground sets the colour",
        node: (
          <div className="flex flex-col gap-px overflow-hidden rounded-lg border">
            <div className="dark flex h-14 items-center bg-background px-5 text-foreground">
              <Logo />
            </div>
            <div className="surface-paper flex h-14 items-center bg-background px-5 text-foreground">
              <Logo />
            </div>
          </div>
        ),
      },
      {
        label: "At display size",
        hint: 'className="h-12" · sized by height, the width follows',
        node: (
          <div className="dark flex items-center rounded-lg bg-background px-6 py-8 text-foreground">
            <Logo className="h-12" />
          </div>
        ),
      },
      {
        // Shown so nobody reaches for it thinking it is the brand: the Aperture
        // tile is what stood in before the wordmark and stands in for the icon
        // until Will's v1 icon lands.
        label: "The mark, a stand-in",
        hint: "markOnly · the placeholder tile until the v1 icon arrives · no production call site",
        node: <Logo markOnly />,
      },
    ],
  },

  {
    id: "play-badge",
    file: "src/components/shared/play-badge.tsx",
    for: "the this-is-a-video badge on a poster; pointer-transparent, so it never eats a swipe",
    family: "patterns",
    section: "Media affordances",
    play: "play-badge",
    variants: [
      {
        prop: "size",
        source: "prop",
        fallback: "md",
        options: ["md", "lg"],
      },
    ],
    specimens: [
      {
        label: "On a poster",
        hint: "the nearest positioned ancestor frames it",
        node: (
          <Row>
            <Poster>
              <PlayBadge />
            </Poster>
            <Poster>
              <PlayBadge size="lg" />
            </Poster>
          </Row>
        ),
      },
    ],
  },
  {
    id: "masonry",
    file: "src/components/shared/masonry.tsx",
    for: "the shared masonry grid: true aspect ratios, space reserved before an image loads",
    test: "src/components/shared/masonry.test.tsx",
    family: "patterns",
    section: "Media affordances",
    title: "CornerPlayBadge",
    lede: "The subtle corner marker a video tile wears. The file's other export, MasonryColumns, is the grid itself: it owns a lightbox and wants real media, so the lab shows the marker alone.",
    variants: [
      {
        prop: "layout",
        source: "prop",
        fallback: "masonry",
        note: "MasonryColumns, not the badge: natural-ratio CSS columns for the gallery wow, or a fixed-aspect grid where drag order and selection have to read.",
        options: ["masonry", "uniform"],
      },
    ],
    specimens: [
      {
        label: "Corner play badge",
        hint: "tile marker",
        node: (
          <Poster>
            <CornerPlayBadge />
          </Poster>
        ),
      },
    ],
  },

  {
    id: "empty-state",
    file: "src/components/shared/empty-state.tsx",
    for: "the neutral placeholder for an empty gallery, dashboard or list",
    family: "patterns",
    section: "Empty states",
    play: "empty-state",
    variants: [
      {
        prop: "variant",
        source: "prop",
        fallback: "icon",
        note: "The prop's own doc comment calls quiet the default; the code defaults to icon. Declared here is what the code does.",
        // The order of the prop's own union, which is also the order the config
        // panel's select offers: gallery.test.ts compares the two lists element
        // for element, so the two move together.
        options: ["quiet", "icon"],
      },
    ],
    specimens: [
      {
        label: "Icon",
        hint: "variant=icon",
        node: (
          <EmptyState
            icon={ImageUp}
            title="No photos yet"
            description="Guests add photos and videos in seconds."
          />
        ),
      },
      {
        label: "Quiet",
        hint: "variant=quiet",
        node: (
          <EmptyState
            variant="quiet"
            title="Nothing here yet"
            description="The typographic treatment, no icon chip."
          />
        ),
      },
    ],
  },

  {
    id: "not-found-screen",
    file: "src/components/shared/not-found-screen.tsx",
    for: "the shared dead end for EVERY failure page, 404 and crash alike; content only, it wraps itself in nothing, and it carries no reporting",
    test: "src/components/shared/failure-grammar.test.tsx",
    family: "patterns",
    section: "Dead ends",
    specimens: [
      {
        label: "Not found",
        hint: "eyebrow, title, description, actions",
        node: (
          <div className="flex justify-center">
            <NotFoundScreen
              icon={Compass}
              eyebrow="404"
              title="Event not found"
              description="This link may have expired or the event was removed."
              actions={
                <Button asChild size="sm">
                  <Link href="#">Back home</Link>
                </Button>
              }
            />
          </div>
        ),
      },
    ],
  },
  {
    id: "route-error",
    file: "src/components/shared/route-error.tsx",
    for: "the route error boundary: the reporting effect, the digest and the per-surface help line around the shared dead-end screen",
    test: "src/components/shared/failure-grammar.test.tsx",
    badge: "updated",
    family: "patterns",
    section: "Dead ends",
    lede: "The route error boundary, shown as a static mirror and never live: the real one reports to Sentry in a mount effect, so a specimen would file an error on every load of this page. Same chrome, no reset and no reporting.",
    specimens: [
      {
        label: "Route error",
        hint: "static preview",
        node: <RouteErrorMock />,
      },
    ],
  },

  {
    id: "anonymous-info",
    file: "src/components/shared/anonymous-info.tsx",
    for: "unused in the product and drawn only by this gallery: the (i) beside an Anonymous credit; a marked name wears unverified-mark.tsx instead",
    family: "patterns",
    section: "Forms and info",
    specimens: [
      {
        // On the gallery skin because that is where it ships: the trigger is
        // painted in white/60 for the always-dark lightbox, and on the lab's
        // light card it is nearly invisible.
        label: "Guest and host",
        hint: "the guest copy, then the host copy",
        skin: "gallery",
        node: (
          <Row>
            <span className="flex items-center gap-1.5 text-sm">
              Anonymous
              <AnonymousInfo />
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              Host view
              <AnonymousInfo viewerIsHost />
            </span>
          </Row>
        ),
      },
    ],
  },
  {
    id: "set-name-step",
    file: "src/components/shared/set-name-step.tsx",
    for: "the one required add-your-name step, reused at every gate that asks for one",
    family: "patterns",
    section: "Forms and info",
    specimens: [
      {
        label: "Set name step",
        hint: "inert preview · submit disabled",
        node: <SetNameStepDemo />,
      },
    ],
  },
  {
    id: "legal-consent-line",
    file: "src/components/shared/legal-consent-line.tsx",
    for: "the one acceptance line tying a sign-in or a guest's entry to Terms and Privacy",
    test: "src/components/shared/legal-consent-line.test.tsx",
    family: "patterns",
    section: "Forms and info",
    specimens: [
      {
        label: "Consent line",
        hint: "newTab keeps the guest's sheet open",
        node: <LegalConsentLine newTab />,
      },
    ],
  },

  {
    id: "page-heading",
    file: "src/components/shared/page-heading.tsx",
    for: "the app's one h1 source: the page tier of the heading scale, above CardTitle",
    family: "patterns",
    section: "App chrome atoms",
    specimens: [
      {
        label: "PageHeading",
        hint: "font-heading at text-2xl; size rides className",
        node: <PageHeading>Dashboard</PageHeading>,
      },
    ],
  },
  {
    id: "kbd",
    file: "src/components/shared/kbd.tsx",
    for: "the keyboard-key chip; dropped in a tooltip it picks that treatment up by data-slot",
    family: "patterns",
    section: "App chrome atoms",
    play: "kbd",
    specimens: [
      {
        label: "In a hint row",
        hint: "set in the UI face, not mono",
        node: (
          <Row className="text-sm text-muted-foreground">
            <Kbd>&#8593;</Kbd>
            <Kbd>&#8595;</Kbd>
            Navigate
            <Kbd>Esc</Kbd>
            Close
          </Row>
        ),
      },
    ],
  },
  {
    id: "container",
    file: "src/components/shared/container.tsx",
    for: "the centered page gutter: the single source of horizontal rhythm",
    family: "patterns",
    section: "App chrome atoms",
    specimens: [
      {
        // Bleed, so the frame's own padding does not fake a gutter the
        // component is not drawing: the dashed edges ARE the measurement.
        label: "Container",
        hint: "the dashed edges are the gutter",
        bleed: true,
        node: (
          <Container className="border-x border-dashed border-border py-4 text-center text-xs text-muted-foreground">
            max-w-7xl, px-4 / sm:px-6 / lg:px-8
          </Container>
        ),
      },
    ],
  },

  {
    id: "action-tooltip",
    file: "src/components/shared/action-tooltip.tsx",
    for: "the lightbox's icon tooltips; never on the SSR'd gallery tiles, which use native title",
    family: "patterns",
    section: "Actions",
    specimens: [
      {
        label: "ActionTooltip",
        hint: "hover or focus",
        node: <ActionTooltipDemo />,
      },
    ],
  },
  {
    id: "floating-add-button",
    file: "src/components/shared/floating-add-button.tsx",
    for: "the floating Add photos pill, unused in the product (the guest album's deep-scroll chrome is `guest/guest-action-dock.tsx`, which carries Invite beside Add); three lab surfaces still draw it",
    family: "patterns",
    section: "Actions",
    specimens: [
      {
        label: "FloatingAddButton",
        hint: "fixed to the bottom of the viewport",
        node: <FloatingAddDemo />,
      },
    ],
  },
  {
    id: "route-skeleton",
    file: "src/components/shared/route-skeleton.tsx",
    for: "the one loading.tsx shape, wired to exactly the three routes with a real pre-paint wait (the dashboard, the event hub, the reel Studio); the pulse and the hub mirror their real page, the Studio is its own always-dark full-bleed room",
    test: "src/components/shared/route-skeleton.test.tsx",
    badge: "new",
    family: "patterns",
    section: "Surfaces",
    lede: "One loading.tsx shape, wired to exactly the three routes with a real pre-paint wait: the dashboard and the event hub mirror the page they precede byte for byte, and the Studio's skeleton is its own real shape rather than a rough sketch.",
    specimens: [
      {
        label: "The three shapes",
        hint: "pulse and hub inline; the Studio is the real fixed room, shown on demand like FloatingAddButton above",
        node: <RouteSkeletonDemo />,
      },
    ],
  },
  {
    id: "tile-size-control",
    file: "src/components/shared/tile-size-control.tsx",
    for: "the gallery's first tile-size cluster: three steps setting --album-column, plus two reserved slots naming Sort and Filter. Production uses ViewMenu's Tile size group instead; this stays on disk, unmounted, for the lab. Controlled: the caller owns the persistence",
    test: "src/components/shared/tile-size-control.test.tsx",
    badge: "new",
    family: "patterns",
    section: "Surfaces",
    lede: "The gallery's first tile-size cluster: three steps setting --album-column, plus two reserved, non-interactive slots naming Sort and Filter so the row reads as a group of controls.",
    specimens: [
      {
        label: "TileSizeControl",
        hint: "controlled: the caller owns persistence (use-tile-size.ts) and applies --album-column to its own grid's ancestor",
        node: <TileSizeControlDemo />,
      },
    ],
  },
];

/** A small media poster so the play affordances have a positioned ancestor. */
function Poster({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative size-24 overflow-hidden rounded-lg bg-gallery">
      {/* eslint-disable-next-line @next/next/no-img-element -- a local manifest asset */}
      <img
        src={marketingImage("concert-confetti").src}
        alt=""
        className="size-full object-cover opacity-90"
      />
      {children}
    </div>
  );
}

// A STATIC mirror of shared/route-error.tsx. The real component fires
// captureError(Sentry) in a mount effect, so we never render it live; this shows
// the same chrome (no reset, no reporting). It deliberately does NOT import
// RouteError: the collector reads this file's imports, and an import here would
// claim the boundary has a specimen it does not have.
function RouteErrorMock() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CircleAlert className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="font-heading text-2xl text-balance">
          Something went wrong
        </h3>
        <p className="text-sm text-pretty text-muted-foreground">
          That&apos;s on us, not you. Try again, and if it keeps happening, let
          us know.
        </p>
      </div>
      <div className="flex gap-3">
        <Button size="sm">Try again</Button>
        <Button size="sm" variant="outline">
          Back home
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/70">
        Error code:{" "}
        <span className="rounded bg-muted px-1.5 py-0.5 text-foreground/80 tabular-nums select-all">
          a1b2c3
        </span>
      </p>
    </div>
  );
}
