import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuiltFor } from "@/components/marketing/built-for";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { EventDoor } from "@/components/marketing/sections/events/event-door";
import { EventObject } from "@/components/marketing/sections/events/event-object";
import { EventStatement } from "@/components/marketing/sections/events/event-statement";
import { EventTurn } from "@/components/marketing/sections/events/event-turn";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionLight } from "@/components/marketing/system/section-light";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_SLUGS, getEventType } from "@/lib/constants/events";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

export function generateStaticParams() {
  return EVENT_TYPE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const eventType = getEventType(slug);
  if (!eventType) return {};
  return {
    title: eventType.navLabel,
    description: eventType.intro,
    alternates: { canonical: `/events/${slug}` },
  };
}

/**
 * ONE TEMPLATE, FOUR TYPES (Will, `one-page-or-four=template`, 2026-09-19:
 * "Let's start with the four pages, one template direction, so that we can get
 * all four beautiful quickly"), rebuilt from the ground up on the seven
 * directions of `event-identity` round one. His bar for it, verbatim: the
 * drawings "are not nearly good enough for an event page this is the proposed
 * final page design", and the pages "should feel very polished, beautiful, and
 * constantly incentivize further exploration".
 *
 * ── THE ARC, AND WHY IT HAS THIS SHAPE ──────────────────────────────────────
 *
 *   1. THE HERO, dark. The shared lockup that every page on this site wears
 *      (`one-hero=page-hero`: "our heroes and headers should share similar
 *      design patterns"), and under it ONE lit object that is only this type's
 *      (`hero-theme=object`). The object carries the demo's REAL code, which is
 *      the sentence he picked it for: it "conveys more about how we actually
 *      help that event (such as incorporating the QR)".
 *   2. THE STATEMENT, still dark. One claim and one visual in place of the
 *      paragraph and its tag list, which he named as the page's worst moment
 *      ("for the second section that needs to catch attention after a hero it's
 *      doing horribly").
 *   3. THE TURN. A photograph across the full width, and the ground has changed
 *      under the reader by the time they look up (`the-arc=chapter`: "paper
 *      chapter with photo transition").
 *   4. THE PLANNING CHAPTER, on paper, holding the benefits ALONE: two openers
 *      rather than one, and the one thing on these pages a
 *      reader studies rather than skims is what earns the light ground.
 *   5. THE PROOF, dark again: a door with photographs pouring through it, the
 *      reel beside it rather than under it (`the-proof=door`).
 *   6. THE FAQ, then the close.
 *
 * ★ THE ONE H1 IS THE HERO'S, through `PageHero` (marketing-h1-policy). The
 * eyebrow is a LINK back to the hub, which is the one navigational thing these
 * four pages owe a reader who arrived on one from search.
 *
 * ★ THE PHONE IS DESIGNED, NOT INHERITED (Will, `the-phone`): "it should have
 * an appearance closer to half-and-half, but the visual may cross above/below
 * the fold as a teaser to incentivize the scroll down to explore more. The copy
 * on this one is too bulky now, pushing the visual down too far (sub hero
 * particularly)." So below `sm` the lockup takes the short subhead
 * (`events.ts`), the hero's padding closes up, and the object runs off the
 * bottom of the first screen on purpose. The FAQ-to-close gap is halved at the
 * same width, his direct pick (`the-phone=tightened`).
 */
export default async function EventTypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventType = getEventType(slug);
  if (!eventType) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Events", href: "/events" },
          { name: eventType.navLabel, href: `/events/${slug}` },
        ]}
      />
      <FaqPageJsonLd items={eventType.faq} />

      {/* ONE POOL OF LIGHT, cast from the floor the object stands on: the room
          composition, chosen here because this section's subject IS an object
          on a surface, and a field at the edges would light the air around it
          instead (section-light.tsx: the geometry is the call site's). */}
      <SectionLight placement="room" from={{ x: "50%", y: "78%" }} reach="112%">
        <PageHero
          entrance="cut"
          eyebrow={
            <Link
              href="/events"
              className="transition-colors duration-150 hover:text-foreground"
            >
              Events
            </Link>
          }
          heading={eventType.headline}
          subhead={
            /* The phone's own line, CSS-only so the lockup stays server HTML
               and no layout depends on hydration. */
            <>
              <span className="sm:hidden">{eventType.subheadShort}</span>
              <span className="hidden sm:inline">{eventType.subhead}</span>
            </>
          }
          actions={
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <Button asChild size="cta" className="w-full sm:w-auto">
                  <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
                </Button>
                <Button
                  asChild
                  size="cta"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
              <DemoCtaLink />
            </div>
          }
          /* `pb-0` below sm is the fold crossing: the object's own bottom edge
             is the last thing on the first screen, and the statement's own
             top padding supplies the air under it. */
          className="relative overflow-x-clip pt-10 pb-0 sm:pt-20 sm:pb-16"
        >
          <EventObject
            kind={eventType.object}
            stills={eventType.media.object}
            albumName={eventType.albumName}
          />
        </PageHero>
      </SectionLight>

      <EventStatement type={eventType} />

      <EventTurn
        stillId={eventType.media.turn}
        line={`Here is how it works for your ${eventType.singularLabel}.`}
      />

      {/* THE ONE PAPER CHAPTER, and it holds the planning document alone. The
          intro paragraph that used to open it moved into the statement above
          (its claim) and stays whole in this page's `description`, so the
          crawler's paragraph did not go anywhere. */}
      <PaperChapter>
        <BuiltFor help={eventType.howItHelps} navLabel={eventType.navLabel} />
      </PaperChapter>

      <EventDoor
        singular={eventType.singularLabel}
        angle={eventType.reelAngle}
      />

      {/* The FAQ-to-close gap, halved below `sm` and only below it (Will,
          `the-phone=tightened`): two full section paddings stacked put a ~160px
          dead band between the last answer and the last button on a phone. */}
      <SectionShell
        width="narrow"
        eyebrow="FAQ"
        heading="Common questions"
        className="max-sm:pb-10"
      >
        <FaqAccordion items={eventType.faq} />
      </SectionShell>

      <CtaBand
        className="border-t max-sm:pt-10"
        heading={`${eventType.ctaTitle}.`}
        subhead="Free to start. Your guests need nothing but their phones."
        demoLink
      />
    </>
  );
}
