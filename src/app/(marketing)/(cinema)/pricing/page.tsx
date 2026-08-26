import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { PricingJsonLd } from "@/components/marketing/jsonld";
import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";
import {
  friendlyCapacity,
  MAX_REEL_SECONDS,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple storage-based pricing. Start free with one event, upgrade to Pro for more storage, or buy a one-time Event Pass. No per-guest fees.",
  alternates: { canonical: "/pricing" },
};

// Derived from the universal limit so the copy can never drift from what the
// uploader actually enforces (see lib/media/limits.ts).
const uploadSize = formatBytes(MAX_UPLOAD_BYTES);

// "≈ X photos or Y min of video" from a byte cap — translated for shoppers.
function capacityLine(bytes: number): string {
  const cap = friendlyCapacity(bytes);
  return `≈ ${cap.photos.toLocaleString()} photos or ${cap.videoMinutes.toLocaleString()} min of video`;
}

// Free is photos-only (video is a paid feature, Phase 2), so its capacity reads in
// photos alone — never "or N min of video", which would imply video on Free.
function photosCapacityLine(bytes: number): string {
  return `≈ ${friendlyCapacity(bytes).photos.toLocaleString()} photos`;
}

/**
 * ACCENT (the ruled achromatic-with-accents exception): the feature checks read
 * --success, the one hue on this page; the "Most popular" marker stays inverted
 * ink (the strongest mark the mono system has) so green keeps the viewport.
 */
function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

/**
 * A CAP, NOT AN INCLUSION (R4/A16): "Photos only" and "30-second reels" wore
 * the same green check as real inclusions, which dressed the free plan's
 * limits as features. Same row, same copy, a muted neutral mark: green now
 * means "you get this" everywhere on the page.
 */
function Limit({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Minus
        className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"
        strokeWidth={2}
      />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

function PlanCard({
  name,
  whyLine,
  priceLabel,
  popular = false,
  index,
  children,
  note,
  footer,
}: {
  name: string;
  /** The why-framing line (T2.5 B2): what this plan is FOR, not just numbers. */
  whyLine: string;
  priceLabel: string;
  popular?: boolean;
  index: number;
  children: ReactNode;
  /**
   * The one line above the CTA (R4/A15). Pro's storage selector made its
   * footer ~80px taller than a single button, which left the other two cards
   * with a dead band above their CTAs. Every card now ends the same way: list,
   * then the sentence a shopper needs at the decision point, then the action.
   */
  note: string;
  footer: ReactNode;
}) {
  return (
    // The paper-card recipe (bg-card + border + whisper ring): these live in
    // the page's PAPER chapter since the 2026-08-26 mixed-theme ruling, so the
    // dark-tuned translucent bg-card/40 gave way to the paper surface the help
    // cards use. Popular keeps the stronger ink ring.
    <div
      data-mkt-reveal
      className={
        popular
          ? "relative flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/25"
          : "flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5"
      }
      style={{ "--i": index } as CSSProperties}
    >
      {popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-background uppercase">
          Most popular
        </span>
      )}
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg">{name}</h2>
        <p className="text-sm text-pretty text-muted-foreground">{whyLine}</p>
        <div className="mt-2 font-mono text-3xl font-medium tracking-tight tabular-nums">
          <PricePop label={priceLabel} />
        </div>
      </div>
      <div className="mt-6 flex-1">
        <ul className="space-y-2.5 text-sm">{children}</ul>
      </div>
      <div className="mt-6">
        <p className="mb-3 text-sm text-pretty text-muted-foreground">{note}</p>
        {footer}
      </div>
    </div>
  );
}

export default function PricingPage() {
  // Cards + every number render from lib/constants/tiers.ts — the single source
  // of truth that server-side enforcement (tier_limits/create_media) also reads.
  const free = planById("free");
  const eventPass = planById("event_pass");
  const proPlans = plansForTier("pro");
  const proFrom = proPlans[0]; // cheapest Pro = the "from" price anchor

  return (
    <>
      <PricingJsonLd />

      {/* Hero: the golden pricing line at the route-H1 scale. QUIET-confident
          per the loud/quiet map: standard reveals, no cinema cut, no media. */}
      <section className="pt-14 pb-4 sm:pt-20 sm:pb-6">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
              Pricing
            </Eyebrow>
            <h1
              data-mkt-reveal
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              {GOLDEN_LINES.pricing}.
            </h1>
            <p
              data-mkt-reveal
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              {/* PROVISIONAL (R4 truth ruling A2): the flat "no expiry clock"
                  moved OUT of the hero. It is true on Free and Pro but not on
                  an Event Pass, and the qualified version belongs in one
                  place: the footnote under the cards. */}
              No per-guest fees. Plans are sized by storage, so pick the room
              your event actually needs.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* THE PAPER DOCUMENT IN A DARK ROOM (the 2026-08-26 chapter ruling):
          the money turns the page to paper — plans read as the honest sheet
          (receipts, clarity, trust), framed by the dark hero above and the
          dark close below. No chapter label: the "On paper" kicker confused
          its first reader (Will's checkpoint review) — the cut speaks for
          itself. */}
      <PaperChapter>
        <SectionShell>
          <Reveal className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-3">
            {/* Free */}
            <PlanCard
              name={free.name}
              whyLine="Free covers your whole first event."
              priceLabel={free.priceLabel}
              index={0}
              note="Upgrade only when you host again."
              footer={
                <Button asChild className="w-full" variant="outline">
                  <Link href="/login">Start free</Link>
                </Button>
              }
            >
              <Feature>1 event</Feature>
              <Feature>{formatBytes(free.storageBytes)} of storage</Feature>
              <Feature>{photosCapacityLine(free.storageBytes)}</Feature>
              <Limit>Photos only</Limit>
              <Limit>{MAX_REEL_SECONDS.free}-second reels</Limit>
              <Feature>No watermark on photos or the album</Feature>
              {/* The guest-verification control is FREE on every plan and on by
                  default, and saying so here is what keeps the free card from
                  reading as the stripped-of-safety plan (it also earns back the
                  height Pro's three-button selector takes). */}
              <Feature>Require a verified email to upload</Feature>
            </PlanCard>

            {/* Pro — the storage selector lives in one card. */}
            <PlanCard
              name="Pro"
              whyLine={`Pro unlocks video, unlimited events, and the ${MAX_REEL_SECONDS.pro}-second cut with no watermark.`}
              priceLabel={`from ${proFrom.priceLabel}`}
              popular
              index={1}
              note="Pick the storage you need:"
              footer={
                // The 3 storage options ARE the selector — each starts checkout.
                // The FILLED one is the "from" tier the headline quotes (R4/A17):
                // pre-filling 500 GB sold a $19 plan under a $9 promise. Derived
                // from proFrom so the two can never drift apart.
                <div className="grid w-full gap-2">
                  {proPlans.map((p) => (
                    <CheckoutButton
                      key={p.id}
                      planId={p.id}
                      variant={p.id === proFrom.id ? "default" : "outline"}
                    >
                      {formatBytes(p.storageBytes)} for {p.priceLabel}
                    </CheckoutButton>
                  ))}
                </div>
              }
            >
              <Feature>Unlimited events</Feature>
              <Feature>Photos and video</Feature>
              <Feature>
                {MAX_REEL_SECONDS.pro}-second reels, no watermark
              </Feature>
              <Feature>Password-protected albums</Feature>
            </PlanCard>

            {/* Event Pass */}
            <PlanCard
              name={eventPass.name}
              whyLine="One big event, paid once, kept for about a year."
              priceLabel={eventPass.priceLabel}
              index={2}
              note="Need it longer? Move to Pro before the pass ends."
              footer={
                <CheckoutButton
                  planId="event_pass"
                  variant="outline"
                  className="w-full"
                >
                  Buy a pass
                </CheckoutButton>
              }
            >
              {/* "about a year", not "~1 year": the tilde read as a spec, and
                  the term is a real 365-day clock (tiers.ts termDays). */}
              <Feature>1 event, kept for about a year</Feature>
              <Feature>
                {formatBytes(eventPass.storageBytes)} of storage
              </Feature>
              <Feature>{capacityLine(eventPass.storageBytes)}</Feature>
              <Feature>Photos and video</Feature>
              <Feature>{MAX_REEL_SECONDS.event_pass}-second reels</Feature>
              <Feature>No subscription, pay once</Feature>
            </PlanCard>
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-2xl">
            <p
              data-mkt-reveal
              className="text-center text-sm text-pretty text-muted-foreground"
              style={{ "--i": 0 } as CSSProperties}
            >
              {/* One template string on purpose: the JSX-text space after the
                {uploadSize} expression was stripped at compile ("10 GBeach"),
                caught in the screenshot pass.
                PROVISIONAL (R4 truth rulings A2 + A34): "each" read as a
                per-upload total, so it is now "per file"; and the retention
                promise carries the Event Pass term in the same breath (the
                pass covers its event for about a year, help doc
                how-long-media-is-kept.mdx). */}
              {`Video uploads come with Pro and Event Pass, up to ${uploadSize} per file. On Free and Pro, your events stay up until you delete them, with no expiry clock counting down on your memories. An Event Pass covers its event for about a year: move it to Pro before the pass ends to keep it longer.`}
            </p>
          </Reveal>
        </SectionShell>
      </PaperChapter>

      {/* No border-t here: the chapter's own bottom hairline marks the cut
          back to the cinema (a second rule would double the seam). */}
      <CtaBand
        heading="Ready when you are."
        subhead="Start your first event free, and upgrade only when you host again."
        demoLink
      />
    </>
  );
}
