import type { CSSProperties, ReactNode } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { SideChip } from "./side-chip";
import {
  CreateFrame,
  ExportFrame,
  GuestEntryFrame,
  LiveAlbumFrame,
  ReelPayoffFrame,
  ReviewFrame,
} from "./step-frames";

/**
 * THE TWO-SIDED SPINE (this page's signature): the whole product as six
 * numbered steps, the HOST side and the GUEST side interleaved as one
 * timeline in the order a real event runs. Each step = the mono number + a
 * side chip (the ONE quiet convention, side-chip.tsx) + two sentences + a
 * static product frame + a door into that feature's own page (the
 * progressive-disclosure ladder: this page orients, the feature pages carry
 * depth). Frames alternate sides down the spine so the read has a rhythm;
 * below lg everything stacks copy-first.
 */

type Step = {
  side: string;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
  frame: ReactNode;
};

const STEPS: Step[] = [
  {
    side: "Host",
    title: "Create the event",
    body: "Name it and it exists: the name is the only required field, and the event is live the moment you create it. Style the QR code to match the invite and you're ready to share.",
    href: "/features/qr",
    linkLabel: "Inside the QR code",
    frame: <CreateFrame />,
  },
  {
    side: "Guest",
    title: "Scan and you're in",
    body: "Guests point a camera at the code and land on a welcome screen, with no app and no account. When you require accounts, they confirm their email with a one-time code and they're in.",
    href: "/features/guests",
    linkLabel: "What guests see",
    frame: <GuestEntryFrame />,
  },
  {
    side: "Both",
    title: "The album fills live",
    body: "Uploads land in the album as they're taken, from every phone in the room. Watch it fill from the head table while the event is still going.",
    href: "/features/album",
    linkLabel: "Inside the live album",
    frame: <LiveAlbumFrame />,
  },
  {
    side: "Host",
    title: "Shape it",
    body: "Turn on review and new uploads wait for your approval, or let everything appear live and tidy up afterward. Approve the lot in one tap, hide anything with another.",
    href: "/features/curation",
    linkLabel: "How curation works",
    frame: <ReviewFrame />,
  },
  {
    side: "Everyone",
    title: "Browse, save, download",
    body: "The album is one link, and everything comes back out at the quality it went in. Save a favorite, or download the whole album as a single zip.",
    href: "/features/sharing",
    linkLabel: "Sharing and downloads",
    frame: <ExportFrame />,
  },
  {
    side: "The payoff",
    title: "The reel",
    body: "One tap on Create reel and the event cuts itself into a highlight video. Pick a style from the catalog and render it free, right on your phone.",
    href: "/reel",
    linkLabel: "Everything about the reel",
    frame: <ReelPayoffFrame />,
  },
];

export function Spine() {
  return (
    <SectionShell
      eyebrow="The walkthrough"
      heading="Six steps, two sides."
      subhead="What you set up as the host and what your guests see, interleaved in the order a real event runs."
    >
      {/* The two-sided legend, moved down from the hero (where two inert chips
          sat in the primary-action slot and read as dead buttons). Here it
          annotates the chips it actually explains. */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <SideChip>Host</SideChip>
          what you set up
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <SideChip>Guest</SideChip>
          what your guests see
        </span>
      </div>

      <div className="mx-auto mt-14 flex max-w-5xl flex-col gap-20 sm:gap-24">
        {STEPS.map((step, i) => (
          <Reveal
            key={step.title}
            className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-12"
          >
            <div
              className={`flex flex-col gap-3 lg:col-span-5 ${i % 2 === 1 ? "lg:order-2" : ""}`}
            >
              <div
                data-mkt-reveal
                className="flex items-center gap-3"
                style={{ "--i": 0 } as CSSProperties}
              >
                <Caption className="text-sm tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </Caption>
                <SideChip>{step.side}</SideChip>
              </div>
              <h3
                data-mkt-reveal
                className="font-heading text-lg sm:text-xl"
                style={{ "--i": 1 } as CSSProperties}
              >
                {step.title}
              </h3>
              <p
                data-mkt-reveal
                className="text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base"
                style={{ "--i": 2 } as CSSProperties}
              >
                {step.body}
              </p>
              <div data-mkt-reveal style={{ "--i": 2 } as CSSProperties}>
                <LearnMoreLink href={step.href}>{step.linkLabel}</LearnMoreLink>
              </div>
            </div>
            {/* ONE width for every mock, centered in a column that never
                changes size: the six frames used to run 280px to 448px with
                different insets per step, so the two-column rhythm wobbled all
                the way down the spine. The frame arrives with the step's body,
                not before it. */}
            <div
              aria-hidden
              data-mkt-reveal
              className={`lg:col-span-7 ${i % 2 === 1 ? "lg:order-1" : ""}`}
              style={{ "--i": 2 } as CSSProperties}
            >
              <div className="mx-auto w-full max-w-md">{step.frame}</div>
            </div>
          </Reveal>
        ))}
      </div>
      {/* GoDeeper: the one help article that retells this whole page plainly.
          STILL by convention (a pointer you find, not a beat that performs);
          the old <Reveal> here wrapped children with no [data-mkt-reveal] and
          animated nothing anyway. */}
      <div className="mt-20 flex flex-col items-center gap-2 text-center">
        <Caption>The exact details live in the help center</Caption>
        <LearnMoreLink href="/help/how-partyreel-works">
          How Partyreel works
        </LearnMoreLink>
      </div>
    </SectionShell>
  );
}
