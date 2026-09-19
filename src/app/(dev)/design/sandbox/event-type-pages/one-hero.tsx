"use client";

import Link from "next/link";

import { EventHeroMedia } from "@/components/marketing/sections/events/event-hero-media";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { EVENTS_HUB, EVENT_TYPES } from "@/lib/constants/events";

import type { HeroPictureShape } from "./hero-picture";

/**
 * DECISION 3: ONE HERO, staged after THE HERO'S PICTURE. `today` is the type
 * page's hand-rolled hero copied verbatim from `[slug]/page.tsx` (its own
 * `gap-5` container, its own `data-mkt-cut` markers) so the option is what
 * ships, not a paraphrase of it; `page-hero` rebuilds the SAME page on the
 * real `PageHero` (`gap-6`, its own cut register, the breadcrumb passed as the
 * eyebrow slot's content). The two read as almost the same hero for a reason:
 * that IS the finding.
 */
export type OneHeroShape = "today" | "page-hero" | "hub-on-type";

const WEDDING = EVENT_TYPES[0];

function Actions({ demoWord }: { demoWord?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button size="cta">Create your event</Button>
        <Button size="cta" variant="outline">
          See pricing
        </Button>
      </div>
      {demoWord && <DemoCtaLink />}
    </div>
  );
}

/** Copied from `[slug]/page.tsx`'s hero verbatim (its own `gap-5`, its own
 *  breadcrumb `Link`, no `PageHero` in sight): what ships today. */
function HandRolledHero({ heading, subhead, backHref, backLabel }: {
  heading: string;
  subhead: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 text-center">
        <Link
          href={backHref}
          className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
        >
          {backLabel}
        </Link>
        <h1 className="font-heading text-title text-balance">{heading}</h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          {subhead}
        </p>
        <div className="mt-2">
          <Actions demoWord />
        </div>
      </div>
    </div>
  );
}

export function OneHeroPreview({
  shape,
  heroShape,
}: {
  shape: OneHeroShape;
  heroShape: HeroPictureShape;
}) {
  const stage = heroShape === "split" || heroShape === "photos" ? (
    <EventHeroMedia slug="weddings" />
  ) : null;

  if (shape === "today") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-4">
        <HandRolledHero
          heading={WEDDING.headline}
          subhead={WEDDING.subhead}
          backHref="/events"
          backLabel="Events"
        />
        {stage}
      </div>
    );
  }

  if (shape === "page-hero") {
    return (
      <PageHero
        entrance="cut"
        scale="lg"
        eyebrow={
          <Link href="/events" className="hover:text-foreground">
            Events
          </Link>
        }
        heading={WEDDING.headline}
        subhead={WEDDING.subhead}
        actions={<Actions demoWord />}
        className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14"
      >
        {stage}
      </PageHero>
    );
  }

  // hub-on-type: the hub's own copy, wearing the type page's anatomy (a real
  // breadcrumb Link standing in for the plain eyebrow, the hand-rolled gap).
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="overflow-hidden pt-14 pb-4 sm:pt-20 sm:pb-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
          >
            Home
          </Link>
          <h1 className="font-heading text-title text-balance">
            {EVENTS_HUB.headline}
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            {EVENTS_HUB.subhead}
          </p>
          <div className="mt-2">
            <Actions demoWord />
          </div>
        </div>
      </div>
    </div>
  );
}
