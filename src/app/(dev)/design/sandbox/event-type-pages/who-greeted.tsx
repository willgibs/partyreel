"use client";

import { EventHeroMedia } from "@/components/marketing/sections/events/event-hero-media";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES } from "@/lib/constants/events";

import { GREETING_LINES } from "./fixtures";

/**
 * DECISION 4: WHO IS GREETED. The real `PageHero`, the weddings copy, one
 * line added beneath the actions for a second audience — never replacing the
 * host's heading, which is who signs up.
 */
export type WhoGreetedShape = "host" | "guest-line" | "planner-line";

const WEDDING = EVENT_TYPES[0];

function Line({ text }: { text: string }) {
  return (
    <p className="max-w-md text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export function WhoGreetedPreview({ shape }: { shape: WhoGreetedShape }) {
  return (
    <PageHero
      entrance="rise"
      scale="lg"
      eyebrow="Weddings"
      heading={WEDDING.headline}
      subhead={WEDDING.subhead}
      actions={
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button size="cta">Create your event</Button>
            <Button size="cta" variant="outline">
              See pricing
            </Button>
          </div>
          <DemoCtaLink />
          {shape === "guest-line" && <Line text={GREETING_LINES.guest} />}
          {shape === "planner-line" && <Line text={GREETING_LINES.planner} />}
        </div>
      }
      className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14"
    >
      <EventHeroMedia slug="weddings" />
    </PageHero>
  );
}
