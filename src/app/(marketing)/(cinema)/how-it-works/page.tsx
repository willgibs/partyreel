import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { DemoDoor } from "@/components/marketing/sections/how-it-works/demo-door";
import { Spine } from "@/components/marketing/sections/how-it-works/spine";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { planById } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From one QR code to the highlight reel: how a host sets up Partyreel, what guests see, and how the whole event lands in one album.",
  alternates: { canonical: "/how-it-works" },
};

/**
 * THE WALKTHROUGH, rebuilt on Will's round-one picks (2026-09-19,
 * docs/design/rulings.md, "the third batch").
 *
 * Four beats, down from six, and each one does a different job:
 *
 *   1. THE HERO stays as it was. `who=host` ("Guests and planners are smart
 *      enough to read this from a perspective of a host and understand"), and
 *      the page's copy already greeted one, so there was nothing to change.
 *   2. THE PAPER SPINE, the page's signature: six steps in one scroll
 *      (`shape=scroll`) with a Host/Guest toggle above them and a step set per
 *      side, twelve bespoke pictures between them (`pictures=bespoke`).
 *      A plan is read at a desk, so the chapter cuts to paper for it.
 *   3. THE PROOF, lights back down: the demo as a finished album rather than a
 *      second reel (`proof=demo`, and his note against ending every page the
 *      same way).
 *   4. THE CLOSE, one section instead of two (`close=folded`): the free-plan
 *      line is inside the band's own subhead, so the page ends on one seam.
 *      PricingPointer and ReelPayoff retired with this rebuild; git keeps them.
 */
export default function HowItWorksPage() {
  const free = planById("free");
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "How it works", href: "/how-it-works" },
        ]}
      />

      {/* The short dark hero on the shared lockup (the PageHero sweep, the
          feature-pages round), on the cinema cut. The two-sided legend USED to
          sit here, and two inert chips directly above the buttons read as a
          pair of dead controls in the primary-action slot. Both sides now live
          on a REAL control, the walkthrough's own toggle; the hero keeps only
          CTAs. */}
      <PageHero
        entrance="cut"
        eyebrow="How it works"
        heading="From QR to reel, start to finish."
        subhead="What you set up, what your guests see, and how the whole event comes back as one album and a highlight reel."
        actions={
          <>
            <Button asChild size="cta">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href="/features">Browse the features</Link>
            </Button>
          </>
        }
        className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14"
      />

      {/* THE PAPER SPINE: a plan is read at a desk (the chapter doctrine). */}
      <PaperChapter>
        <Spine />
      </PaperChapter>

      <DemoDoor />

      {/* ONE closing section. The pricing pointer used to be its own border-y
          strip directly above this band, two hairlines making the same closing
          argument twice (what it costs, then what to do); its one fact now
          rides the band's own subhead and derives from tiers.ts exactly as it
          did before, so the number still cannot drift, and its pointer becomes
          the band's second button rather than a whole section transition. The
          hero's second button is Browse the features, so the close does not
          spend its own on the same door. */}
      <CtaBand
        heading="Start your first event free."
        subhead={`${formatBytes(free.storageBytes)} covers a whole first event, and plans are sized by storage, not guest counts. Create the event, share one QR code, and the whole thing lands in one album.`}
        secondary={{ label: "See full pricing", href: "/pricing" }}
        demoLink
      />
    </>
  );
}
