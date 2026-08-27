import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Press & brand",
  description:
    "The Partyreel press kit: the boilerplate, the fact sheet, and downloadable brand marks. Writing about Partyreel? Everything you need is here.",
  alternates: { canonical: "/press" },
};

// THE PRESS KIT v1 (R5): boilerplate + fact sheet + brand marks. Structured to
// grow into the partnerships/ambassador kit (visuals + resources) in a later
// round. Product imagery deliberately NOT faked here: the live demo album is
// the honest source until a curated shot set exists. Copy PROVISIONAL.
const FACTS: { label: string; value: string }[] = [
  { label: "What", value: "Guest-powered event albums" },
  { label: "How", value: "One QR code in, one album out" },
  { label: "Guests need", value: "A phone and a browser. No app, no account." },
  { label: "Pricing", value: "Free to start; plans sized by storage" },
  { label: "Launched", value: "2026" },
];

const MARKS: {
  variant: "dark" | "light" | "mono";
  title: string;
  note: string;
  /** Preview chip classes (the on-page swatch behind the img). */
  plate: string;
}[] = [
  {
    variant: "dark",
    title: "Dark chip",
    note: "For light backgrounds",
    plate: "bg-background",
  },
  {
    variant: "light",
    title: "Light chip",
    note: "For dark backgrounds",
    plate: "bg-foreground",
  },
  {
    variant: "mono",
    title: "Bare mark",
    note: "One color, any surface",
    plate: "bg-muted/50",
  },
];

export default function PressPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Press & brand", href: "/press" },
        ]}
      />

      {/* Hero: the careers idiom (texts-reveal, calm paper register). */}
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <TextsReveal className="flex flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              Press &amp; brand
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Writing about Partyreel?
            </h1>
            <p
              className="mkt-line max-w-2xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              Everything you need is on this page: the one-paragraph version,
              the facts, and the brand marks. If you need more than that, a
              real person answers.
            </p>
          </TextsReveal>
        </Container>
      </section>

      {/* The boilerplate: one quotable card. */}
      <SectionShell reveal="none">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>The boilerplate</Eyebrow>
          <blockquote className="mt-4 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
            <p className="text-pretty leading-7">
              Partyreel turns every guest&rsquo;s phone into the event&rsquo;s
              camera. Hosts share one QR code; guests scan and upload photos
              and videos with no app and no account; everything lands in one
              live album at full quality. Hosts curate, everyone leaves with
              the originals, and the event can end as a one-minute highlight
              reel.
            </p>
          </blockquote>
          <MonoCaption className="mt-3">
            Quote it whole or in part. &ldquo;Partyreel&rdquo; is one word,
            capital P.
          </MonoCaption>
        </div>
      </SectionShell>

      {/* The fact sheet: mono-label rows (the spec-sheet register). */}
      <SectionShell reveal="none" className="bg-muted/30">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>The fact sheet</Eyebrow>
          <dl className="mt-6 divide-y rounded-2xl border bg-card">
            {FACTS.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <dt className="w-32 shrink-0 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="text-sm text-pretty">{value}</dd>
              </div>
            ))}
          </dl>
          <MonoCaption className="mt-3">
            For product imagery, lift anything from the live demo album, or ask
            us for a shot set.
          </MonoCaption>
        </div>
      </SectionShell>

      {/* Brand marks: preview + downloads per variant. */}
      <SectionShell reveal="none">
        <div className="mx-auto max-w-3xl">
          <div className="max-w-2xl">
            <Eyebrow>The marks</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl text-balance sm:text-3xl">
              The aperture, three ways.
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              SVG scales forever; PNG is 1024px with a transparent background.
              Please keep the mark unrecolored and undistorted, with a little
              room to breathe.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {MARKS.map(({ variant, title, note, plate }) => (
              <li
                key={variant}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-4"
              >
                <span
                  className={`flex aspect-square items-center justify-center rounded-xl border ${plate}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a
                      static press asset previewing itself; no optimization
                      pipeline wanted for the downloadable file. */}
                  <img
                    src={`/press/partyreel-mark-${variant}.svg`}
                    alt={`Partyreel mark, ${title.toLowerCase()}`}
                    className="size-20"
                  />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-heading text-base">{title}</h3>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
                <div className="mt-auto flex gap-2">
                  {(["svg", "png"] as const).map((ext) => (
                    <a
                      key={ext}
                      href={`/press/partyreel-mark-${variant}.${ext}`}
                      download
                      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs tracking-wide text-muted-foreground transition-colors duration-150 hover:border-foreground/25 hover:text-foreground"
                    >
                      <Download className="size-3.5" aria-hidden />
                      {ext.toUpperCase()}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <MonoCaption className="mt-4">
            Ink: #101010. The wordmark is set in Urbanist, next to the dark
            chip.
          </MonoCaption>
        </div>
      </SectionShell>

      {/* Close: the human. */}
      <SectionShell reveal="none" className="border-t">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="font-heading text-2xl text-balance sm:text-3xl">
            Need something that is not here?
          </h2>
          <p className="text-pretty text-muted-foreground">
            Interviews, higher-resolution assets, partnership ideas, or a
            walkthrough of the product: send a note and a real person will get
            back to you.
          </p>
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </SectionShell>
    </>
  );
}
