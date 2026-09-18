"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { CANVAS, type Mode } from "@/components/lab";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { MarketingNotFound } from "@/components/marketing/marketing-not-found";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import type { HomeId } from "./looks";

/**
 * THE HOMES: the real places on the site the trail could live, drawn whole so
 * the question "where does this go" is answered on the page rather than on a
 * swatch (guidance: compare against the real thing).
 *
 * ★ EVERY HOME IS THE CANVAS TALL, and that is not decoration. The trail's paths
 * are written in canvas pixels, so a stage shorter than the canvas would draw a
 * different composition than the one measured. It is also honest: each of these
 * is a whole SCREEN of the site, which is the unit a hero is judged in.
 *
 * ★ THE GROUND IS THE HOME'S OWN, never a knob on top of it. Three of the four
 * are cinema and the 404 is paper, so "does this work on light" is answered by
 * a real light page rather than by the same dark picture with the background
 * swapped underneath it (the dark and light are chosen separately rule, read the
 * way it is meant).
 */

/** A press inside a preview is looking, not leaving. */
const lookOnly = (e: React.MouseEvent) => {
  if ((e.target as Element).closest?.("a[href]")) e.preventDefault();
};

function Screen({
  mode,
  skin,
  children,
  className,
}: {
  mode: Mode;
  skin: "cinema" | "paper";
  children: ReactNode;
  className?: string;
}) {
  const cinema = skin === "cinema";
  return (
    <div
      className={`${cinema ? "dark" : ""} flex flex-col bg-background text-foreground ${className ?? ""}`}
      data-mkt=""
      data-mkt-skin={skin}
      onClickCapture={lookOnly}
      style={{ height: CANVAS[mode].h } as CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * THE PRIVACY PAGE'S FIRST SCREEN. Will's own "if the hero explorations do not
 * pan out, maybe it can serve as one instead", drawn as exactly that: the live
 * `PageHero` at scale `lg` with the page's real eyebrow, headline, sentence and
 * actions, the trail on its `backdrop` slot, and the section pulled up under the
 * transparent header so the photographs run beneath the bar as they do on the
 * home page. The words are judged for size and wrapping here, never for
 * themselves.
 */
export function PrivacyHome({ mode, trail }: { mode: Mode; trail: ReactNode }) {
  const page = featurePage("privacy");
  return (
    <Screen mode={mode} skin="cinema">
      <MarketingHeader skin="cinema" overlay />
      <PageHero
        entrance="cut"
        eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
        heading={page.h1}
        subhead={page.heroSub}
        actions={
          <>
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/features/curation">How curation works</Link>
            </Button>
          </>
        }
        backdrop={trail}
        className="relative -mt-[var(--mkt-header-h,4rem)] flex flex-1 flex-col justify-center overflow-clip pt-[var(--mkt-header-h,4rem)]"
      />
    </Screen>
  );
}

/**
 * THE HOME PAGE'S CLOSING CHAPTER. The last screen of the film, which ships
 * today as the credit CtaBand over an aurora horizon. The trail replaces
 * nothing: it rides behind the words on the same band, so the page ends on
 * photographs rather than on a gradient, which is the identity line ("crisp
 * media motion design is going to be the foundation of our visual identity")
 * applied to the one screen everybody reaches last.
 */
export function CloseHome({ mode, trail }: { mode: Mode; trail: ReactNode }) {
  return (
    <Screen mode={mode} skin="cinema" className="justify-center">
      <div className="relative flex flex-1 flex-col justify-center overflow-clip">
        {trail}
        <div className="relative">
          <CtaBand
            reveal="cinema"
            heading="Roll credits on the group chat."
            subhead="The night, cut into one reel. Free to host, and guests join with one scan."
            demoLink
            credit
          />
        </div>
      </div>
    </Screen>
  );
}

/**
 * THE 404, WHICH IS THE LIGHT ANSWER. A page nobody plans to see is the classic
 * home for a rare delight, and it is the one real surface here that stands on
 * paper, so it is where "do our photographs hold up over light ground" gets a
 * truthful answer. The footer is cut for the canvas: the screen judged is the
 * one the reader lands on.
 */
export function NotFoundHome({
  mode,
  trail,
}: {
  mode: Mode;
  trail: ReactNode;
}) {
  return (
    <Screen mode={mode} skin="paper" className="surface-paper">
      <MarketingHeader />
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-clip px-6">
        {trail}
        <div className="relative">
          <MarketingNotFound />
        </div>
      </main>
      <div className="pointer-events-none hidden">
        <MarketingFooter />
      </div>
    </Screen>
  );
}

/**
 * BANKED: no page at all, which is the honest fourth answer. If none of the
 * three homes is right, the trail is a working version in the Library waiting
 * for a page that wants it, and this is what it is: the effect alone on the
 * house's cinema ground, at the size and pace picked above.
 */
export function BankHome({ mode, trail }: { mode: Mode; trail: ReactNode }) {
  return (
    <Screen mode={mode} skin="cinema">
      <div className="relative flex-1 overflow-clip">{trail}</div>
    </Screen>
  );
}

export function Home({
  id,
  mode,
  trail,
}: {
  id: HomeId;
  mode: Mode;
  trail: ReactNode;
}) {
  if (id === "privacy") return <PrivacyHome mode={mode} trail={trail} />;
  if (id === "close") return <CloseHome mode={mode} trail={trail} />;
  if (id === "notfound") return <NotFoundHome mode={mode} trail={trail} />;
  return <BankHome mode={mode} trail={trail} />;
}
