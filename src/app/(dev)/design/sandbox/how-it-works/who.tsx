"use client";

import Link from "next/link";

import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";

import { Widths } from "./scene";

/**
 * WHO: who the hero greets first. Drawn on the real `PageHero` alone (the
 * spine and everything after it read the same regardless of who the hero
 * opens on, so this decision's evidence stops at the fold, the same scope
 * help-center's own `who-first` decision holds to).
 */
export type WhoShape = "host" | "guest" | "planner";

const HEADING: Record<WhoShape, string> = {
  host: "From QR to reel, start to finish.",
  guest: "Just scanned a code? Here's what happens to your photos.",
  planner: "One QR code, every guest's phone, one album for your client.",
};

const SUBHEAD: Record<WhoShape, string> = {
  host: "What you set up, what your guests see, and how the whole event comes back as one album and a highlight reel.",
  guest: "Nothing to install and nothing to sign up for: your photos land in the host's album the moment you upload them, full quality.",
  planner: "Hand every guest one code instead of chasing photos afterward. Curate what shows, then hand the finished album and reel back to whoever's event it was.",
};

const PRIMARY: Record<WhoShape, string> = {
  host: "Start your first event free",
  guest: "See what a guest sees",
  planner: "See how it works for events you run",
};

const SECONDARY: Record<WhoShape, string> = {
  host: "Browse the features",
  guest: "Browse the features",
  planner: "Browse the features",
};

function WhoPage({ shape }: { shape: WhoShape }) {
  return (
    <div data-hiw-picture>
      <PageHero
        entrance="cut"
        eyebrow="How it works"
        heading={HEADING[shape]}
        subhead={SUBHEAD[shape]}
        actions={
          <>
            <Button asChild size="cta">
              <Link href="#">{PRIMARY[shape]}</Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href="#">{SECONDARY[shape]}</Link>
            </Button>
          </>
        }
        className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14"
      />
    </div>
  );
}

const WHO_H = { d: 560, p: 700 };

const NOTE: Record<WhoShape, string> = {
  host: "As today: every CTA assumes an undecided host.",
  guest: "Opens on what happens to a guest's own photos and video.",
  planner: "Opens on running Partyreel for other people's events.",
};

export function whoPreview(shape: WhoShape) {
  return (
    <Widths
      id={`who-${shape}`}
      ground="cinema"
      desktopH={WHO_H.d}
      phoneH={WHO_H.p}
      note={NOTE[shape]}
      render={() => <WhoPage shape={shape} />}
    />
  );
}
