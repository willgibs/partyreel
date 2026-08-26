import {
  Check,
  Clapperboard,
  Download,
  EyeOff,
  Link2,
  Lock,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { marketingImage } from "@/lib/constants/marketing-media";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Features",
  description: `Everything Partyreel does: the live album, a styled QR code, host curation, full-quality sharing and downloads, guest profiles, privacy controls, and a highlight reel in ${STYLE_CATALOG.length} styles.`,
  alternates: { canonical: "/features" },
};

/**
 * THE FEATURES HUB AS A DIRECTORY (the events-hub precedent): land, see the
 * seven doors, pick the question that matters to you. The old flat spotlight
 * depth REDISTRIBUTED into the dedicated feature pages; this page's job is
 * orientation + routing (the progressive-disclosure ladder's middle rung).
 *
 * R4 fix (B24 + B5): the directory was seven identical text rectangles with the
 * REEL — the payoff — orphaned alone on row three. Each door now carries a tiny
 * SIGNATURE MOTIF (a mini device quoting that feature's own surface), and the
 * reel leads as a full-width card instead of ranking last. The motifs live in
 * this file on purpose: they are hub-only compositions of existing primitives,
 * not a new shared vocabulary. Register stays tight and quiet — motifs, not
 * posters; the depth belongs on the pages behind the doors.
 */

/** A tiny photo tile for the imagery motifs (decorative, fixed box). */
function Thumb({ id, className }: { id: string; className?: string }) {
  return (
    <span
      className={cn("relative block shrink-0 overflow-hidden rounded", className)}
    >
      <Image
        src={marketingImage(id).src}
        alt=""
        fill
        sizes="96px"
        className="object-cover"
      />
    </span>
  );
}

/** A masonry fragment: uneven tiles, the album's own shape at thumbnail size. */
function AlbumMotif() {
  return (
    <span className="flex h-14 items-end gap-1">
      <Thumb id="wedding-golden" className="h-11 w-9" />
      <Thumb id="wedding-toast" className="h-14 w-11" />
      <Thumb id="reception-table" className="h-9 w-9" />
      <Thumb id="party-balloons" className="h-12 w-10 opacity-55" />
    </span>
  );
}

/**
 * A QR finder corner, drawn as modules (the real thing's top-left eye plus a
 * scatter of data cells). Hand-placed on a 14x14 module grid at 4px a module.
 */
function QrMotif() {
  const cells = [
    [8, 0],
    [10, 1],
    [8, 2],
    [12, 2],
    [9, 3],
    [11, 4],
    [13, 4],
    [0, 8],
    [2, 8],
    [1, 9],
    [3, 10],
    [0, 11],
    [2, 12],
    [8, 8],
    [10, 9],
    [12, 8],
    [9, 11],
    [12, 12],
    [11, 10],
  ];
  return (
    <span className="flex h-14 items-center">
      <svg
        viewBox="0 0 56 56"
        width="56"
        height="56"
        fill="currentColor"
        className="text-foreground/70"
        aria-hidden
      >
        <rect
          x="2"
          y="2"
          width="24"
          height="24"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
        <rect x="10" y="10" width="8" height="8" rx="2" />
        {cells.map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={x * 4}
            y={y * 4}
            width="4"
            height="4"
            rx="0.8"
          />
        ))}
      </svg>
    </span>
  );
}

/**
 * The review band with its verdicts landed on the tiles: the amber count, an
 * approved shot, a hidden one, and the next still waiting. Hues follow the app
 * (green approves, amber holds and hides); nothing else is tinted.
 */
function CurationMotif() {
  return (
    <span className="flex h-14 flex-col justify-center gap-2">
      <span className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold tracking-wide text-warning uppercase">
          Review
        </span>
        <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-warning/15 px-1 text-[9px] font-semibold text-warning tabular-nums">
          6
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="relative">
          <Thumb id="wedding-rings" className="h-7 w-10" />
          <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="size-2.5" />
          </span>
        </span>
        <span className="relative">
          <Thumb id="concert-confetti" className="h-7 w-10 opacity-40" />
          <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-card text-warning ring-1 ring-border">
            <EyeOff className="size-2.5" />
          </span>
        </span>
        <span className="h-7 w-10 rounded border border-dashed border-border/70" />
      </span>
    </span>
  );
}

/** One link out, one archive back: the two things this page is about. */
function SharingMotif() {
  return (
    <span className="flex h-14 flex-col justify-center gap-2">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
        <Link2 className="size-3" />
        partyreel.com/a/maya-and-jay
      </span>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Download className="size-3" />
        Download all
      </span>
    </span>
  );
}

/** The room, as the app draws it: initial-letter avatars, combed. */
function GuestsMotif() {
  return (
    <span className="flex h-14 items-center">
      {["M", "J", "P", "A"].map((letter) => (
        <span
          key={letter}
          className="-ml-2 flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground first:ml-0"
        >
          {letter}
        </span>
      ))}
      <span className="-ml-2 flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground tabular-nums">
        +19
      </span>
    </span>
  );
}

/** The locked album: shape and count, zero pixels (the app's ghost grid). */
function PrivacyMotif() {
  return (
    <span className="flex h-14 items-center gap-2.5">
      <span className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className="size-4 rounded-sm border border-border/70 bg-muted/50"
          />
        ))}
      </span>
      <span className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground">
        <Lock className="size-4" strokeWidth={1.5} />
      </span>
    </span>
  );
}

/** The lead card's filmstrip: the event, already cut into shots. */
const REEL_STRIP_IDS = [
  "wedding-golden",
  "wedding-petals",
  "party-balloons",
  "wedding-toast",
  "festival-crowd",
];

function ReelStrip() {
  return (
    <span className="flex items-center gap-1.5">
      {REEL_STRIP_IDS.map((id, i) => (
        <Thumb
          key={id}
          id={id}
          className={cn(
            "h-12 w-[4.5rem] sm:h-14 sm:w-24",
            // The tail fades: a strip that keeps going past the card.
            i === 4 && "hidden opacity-45 lg:block",
            i === 3 && "opacity-80",
          )}
        />
      ))}
    </span>
  );
}

const MOTIFS: Record<string, ReactNode> = {
  album: <AlbumMotif />,
  qr: <QrMotif />,
  curation: <CurationMotif />,
  sharing: <SharingMotif />,
  guests: <GuestsMotif />,
  privacy: <PrivacyMotif />,
};

export default function FeaturesPage() {
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
        ]}
      />

      <section className="overflow-hidden pt-14 pb-4 sm:pt-20 sm:pb-6">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow {...cut(0)}>Features</Eyebrow>
            <h1
              {...cut(1)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              Everything you need, nothing to chase.
            </h1>
            <p
              {...cut(2)}
              className="max-w-xl text-lg text-pretty text-muted-foreground"
            >
              One QR code in, one album out. This is everything Partyreel does
              in between, for your guests and for you.
            </p>
            <div
              {...cut(3)}
              className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
            >
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <DemoCtaLink />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* The directory: the payoff leads full-width, then the six feature pages,
          each one buyer question. Whole tiles are mkt-learn links (the paper-card
          interaction recipe on the cinema field). The stagger groups by ROW
          (lead=0, row one=1, row two=2) so the whole choreography lands inside
          the ~300ms budget instead of drifting to 540ms across seven items. */}
      <SectionShell>
        <Reveal className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/reel"
            data-mkt-reveal
            className="mkt-learn group flex flex-col gap-6 rounded-xl border bg-card/40 p-6 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99] sm:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:col-span-3"
            style={{ "--i": 0 } as CSSProperties}
          >
            <span className="flex max-w-md flex-col gap-2">
              <span className="flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-reel uppercase">
                <Clapperboard className="size-3" />
                The payoff
              </span>
              <span className="flex items-center gap-1.5 font-heading text-xl sm:text-2xl">
                The highlight reel
                <LearnChevron />
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">
                The whole event, cut into a cinematic minute you can restyle
                instantly and take home.
              </span>
            </span>
            <span aria-hidden className="shrink-0">
              <ReelStrip />
            </span>
          </Link>

          {FEATURE_PAGES.map((page, i) => (
            <Link
              key={page.slug}
              href={`/features/${page.slug}`}
              data-mkt-reveal
              className="mkt-learn group flex flex-col gap-4 rounded-xl border bg-card/40 p-6 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
              style={{ "--i": Math.floor(i / 3) + 1 } as CSSProperties}
            >
              <span aria-hidden>{MOTIFS[page.slug]}</span>
              <span className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 font-heading text-lg sm:text-xl">
                  {page.navLabel}
                  <LearnChevron />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {page.heroSub}
                </span>
              </span>
            </Link>
          ))}
        </Reveal>
      </SectionShell>

      {/* The two-sided teaser: the one concept the directory can't carry in
          tiles — the product has a guest side and a host side — routing to the
          walkthrough that interleaves them, then the hub's one GoDeeper rung
          into the help center (the detail pages all carry one; this page had
          no deep link at all). */}
      <SectionShell
        width="narrow"
        eyebrow="How it works"
        heading="Two sides, one album."
        subhead="Guests scan and shoot. You curate and keep. The walkthrough shows both sides, start to finish."
      >
        <Reveal className="mt-8 flex justify-center">
          {/* The Reveal was here already but wrapped an unmarked child, so it
              animated nothing; the button now rides the header's choreography
              on the slot after its three lines. */}
          <span data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </span>
        </Reveal>
        {/* Still by convention: GoDeeper rows are a pointer you find, not a
            beat that performs (the quiet register). */}
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <MonoCaption>the exact details live in the help center</MonoCaption>
          <LearnMoreLink href="/help/how-partyreel-works">
            How Partyreel works
          </LearnMoreLink>
        </div>
      </SectionShell>

      <CtaBand
        className="border-t"
        heading="Start your first event free."
        subhead="Create the event, put the QR where people can see it, and the album fills itself."
        demoLink
      />
    </>
  );
}
