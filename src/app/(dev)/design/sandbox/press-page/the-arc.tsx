"use client";

import { ArrowDown } from "lucide-react";

import { CopyButton } from "@/components/marketing/press/copy-button";
import { PressSection } from "@/components/marketing/press/press-section";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { PRESS_BOILERPLATE_SHORT, PRESS_FACTS } from "@/lib/constants/press";

import { MiniPlates } from "./shared";

/**
 * DECISION 7 (waits on `who-for` landing on `one-page`): HOW THE PAGE READS,
 * TOP TO BOTTOM. All three options share the same three sections' worth of
 * real content, abbreviated exactly as `who-for`'s is (structure is the
 * question; `the-sheet` / `the-words` / `the-facts` already argue depth); only
 * the ORDER and the LAYOUT change.
 */

function ArcAssets() {
  return (
    <MiniPlates className="max-w-sm" />
  );
}

function ArcWords() {
  return (
    <div className="flex max-w-sm flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>The boilerplate</Eyebrow>
        <CopyButton value={PRESS_BOILERPLATE_SHORT} label="Copy the boilerplate" />
      </div>
      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        {PRESS_BOILERPLATE_SHORT}
      </p>
    </div>
  );
}

function ArcFacts({ count = 4 }: { count?: number }) {
  return (
    <dl className="max-w-sm divide-y divide-border border-t">
      {PRESS_FACTS.slice(0, count).map(({ label, value }) => (
        <div key={label} className="grid grid-cols-[6rem_1fr] gap-4 py-2.5">
          <dt className="text-sm font-medium">{label}</dt>
          <dd className="text-sm text-pretty text-muted-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const CLOSE = (
  <section className="border-t py-14 sm:py-16">
    <Container className="flex flex-col items-center gap-4 text-center">
      <h2 className="max-w-xl font-heading text-prose text-balance">
        Need anything else?
      </h2>
      <Button size="cta">Send a message</Button>
    </Container>
  </section>
);

function StackedArc({ order }: { order: ("assets" | "words" | "facts")[] }) {
  const SECTIONS = {
    assets: {
      heading: "Assets",
      note: "Artwork, an app icon, and a code that resolves to partyreel.com.",
      body: <ArcAssets />,
    },
    words: {
      heading: "Words",
      note: "Quote any of it, whole or in part.",
      body: <ArcWords />,
    },
    facts: {
      heading: "Fact sheet",
      note: "The checkable version.",
      body: <ArcFacts />,
    },
  } as const;

  return (
    <>
      <PageHero
        className="pt-14 pb-8"
        scale="lg"
        eyebrow="Media assets"
        heading="Press"
        subhead="The boilerplate, the fact sheet, and the brand files."
        actions={
          <Button size="cta">
            Download kit
            <ArrowDown aria-hidden className="ml-1 size-3.5" />
          </Button>
        }
      />
      <PaperChapter>
        {order.map((key, i) => (
          <PressSection
            key={key}
            id={key}
            heading={SECTIONS[key].heading}
            note={SECTIONS[key].note}
            className={i > 0 ? "border-t" : undefined}
          >
            {SECTIONS[key].body}
          </PressSection>
        ))}
        {CLOSE}
      </PaperChapter>
    </>
  );
}

function OneScreen() {
  return (
    <>
      <div className="border-b py-6">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Eyebrow>Media assets</Eyebrow>
            <h1 className="font-heading text-subsection">Press</h1>
          </div>
          <Button size="cta">
            Download kit
            <ArrowDown aria-hidden className="ml-1 size-3.5" />
          </Button>
        </Container>
      </div>
      <PaperChapter compressStacked={false}>
        <Container className="grid gap-8 py-10 sm:grid-cols-3">
          <div>
            <h2 className="font-heading text-prose">Assets</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Artwork, an icon, a code.
            </p>
            <ArcAssets />
          </div>
          <div>
            <h2 className="font-heading text-prose">Words</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Quote it freely.
            </p>
            <ArcWords />
          </div>
          <div>
            <h2 className="font-heading text-prose">Fact sheet</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              The checkable version.
            </p>
            <ArcFacts count={5} />
          </div>
        </Container>
      </PaperChapter>
      {CLOSE}
    </>
  );
}

export function ArcPreview({
  variant,
}: {
  variant: "today-order" | "facts-words-first" | "one-screen";
}) {
  if (variant === "facts-words-first")
    return <StackedArc order={["facts", "words", "assets"]} />;
  if (variant === "one-screen") return <OneScreen />;
  return <StackedArc order={["assets", "words", "facts"]} />;
}
