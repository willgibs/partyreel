"use client";

import Link from "next/link";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { PRESS_BOILERPLATE_SHORT, PRESS_FACTS } from "@/lib/constants/press";

import { MiniPlates } from "./shared";

/**
 * DECISION 1: WHO THE PAGE IS FOR. Three structural shapes on the real
 * PageHero / PaperChapter grammar, abbreviated (a representative row per
 * section, never the full sheet or the full fact list, which `the-sheet`,
 * `the-words` and `the-facts` already argue at real size). Structure is the
 * question here, not content depth.
 */

/** A stand-in section row: a pinned label and one line of real content,
 *  PressSection's own two-column spine at a fraction of its height. */
function MiniRow({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 border-t py-8 sm:grid-cols-[8rem_1fr] sm:gap-10">
      <h3 className="font-heading text-prose">{heading}</h3>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function OnePage() {
  return (
    <>
      <PageHero
        className="pt-16 pb-10"
        scale="lg"
        eyebrow="Media assets"
        heading="Press"
        subhead="The boilerplate, the fact sheet, and the brand files, ready to quote and ready to publish."
        actions={
          <>
            <Button size="cta">Download kit</Button>
            <Button asChild size="cta" variant="outline">
              <Link href="/contact">Contact</Link>
            </Button>
          </>
        }
      />
      <PaperChapter>
        <Container className="py-4">
          <MiniRow heading="Assets">
            <MiniPlates className="max-w-md" />
          </MiniRow>
          <MiniRow heading="Words">
            <p className="max-w-lg text-pretty text-muted-foreground">
              {PRESS_BOILERPLATE_SHORT}
            </p>
          </MiniRow>
          <MiniRow heading="Fact sheet">
            <dl className="max-w-lg divide-y divide-border border-t">
              {PRESS_FACTS.slice(0, 3).map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[7rem_1fr] gap-4 py-3">
                  <dt className="text-sm font-medium">{label}</dt>
                  <dd className="text-sm text-pretty text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </MiniRow>
        </Container>
      </PaperChapter>
    </>
  );
}

function TwoDoors() {
  return (
    <>
      <PageHero
        className="pt-16 pb-10"
        scale="lg"
        eyebrow="Two kinds of ask"
        heading="Press & partners"
        subhead="A reporter wants the kit. A venue or planner wants a promise. Pick a door."
      />
      <PaperChapter>
        <Container className="grid gap-6 py-10 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-tile border p-6">
            <Eyebrow>For the press</Eyebrow>
            <h3 className="font-heading text-subsection">Press</h3>
            <p className="text-sm text-pretty text-muted-foreground">
              The kit, the boilerplate, the fact sheet. Ready to quote, ready to
              publish.
            </p>
            <MiniPlates className="mt-1 max-w-[14rem]" />
            <Button asChild size="sm" variant="outline" className="mt-2 w-fit">
              <Link href="/contact">Contact press</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-4 rounded-tile border p-6">
            <Eyebrow>For partners</Eyebrow>
            <h3 className="font-heading text-subsection">Partners</h3>
            <p className="text-sm text-pretty text-muted-foreground">
              Hosting at your venue, running it for your clients. What Partyreel
              offers a business, not a guest.
            </p>
            <p className="mt-1 text-xs text-faint">
              New: no partner promise or partner contact exists to show here yet.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2 w-fit">
              <Link href="/contact">Contact partners</Link>
            </Button>
          </div>
        </Container>
      </PaperChapter>
    </>
  );
}

function FoldedIntoAbout() {
  return (
    <>
      <PageHero
        className="pt-16 pb-10"
        scale="lg"
        eyebrow="About"
        heading="Partyreel"
        subhead="Everyone at the event is already shooting it, from angles you will never get. We built the album that catches all of it."
        actions={
          <Button asChild size="cta" variant="outline">
            <Link href="/careers">Join us</Link>
          </Button>
        }
      />
      <PaperChapter>
        <Container className="max-w-2xl py-10">
          <p className="text-pretty text-muted-foreground">
            Six convictions would run here, each linking the page that proves
            it, closing on careers rather than the kit below.
          </p>
        </Container>
        <Container className="border-t py-10">
          <div className="flex flex-col gap-4 rounded-tile border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <MiniPlates className="w-32 shrink-0" />
              <div>
                <h3 className="font-heading text-prose">Press kit</h3>
                <p className="text-sm text-muted-foreground">
                  Marks, a fact sheet, and the boilerplate. /press redirects here.
                </p>
              </div>
            </div>
            <Button size="sm">Download kit</Button>
          </div>
        </Container>
      </PaperChapter>
    </>
  );
}

export function WhoForPreview({
  variant,
}: {
  variant: "one-page" | "two-doors" | "folded-into-about";
}) {
  if (variant === "two-doors") return <TwoDoors />;
  if (variant === "folded-into-about") return <FoldedIntoAbout />;
  return <OnePage />;
}
