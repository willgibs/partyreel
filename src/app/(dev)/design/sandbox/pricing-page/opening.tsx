"use client";

import { useState } from "react";

import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { EVENT_PASS_RENEWAL_PRICE_LABEL, planById, plansForTier } from "@/lib/constants/tiers";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";
import { cn, formatBytes } from "@/lib/utils";

import { type Pair, type PassPlace, PlanBlock, type SizePick } from "./plans";

/**
 * WHAT THE PAGE OPENS ON: the real first screen, three ways, with the header.
 *
 * ★ THE REAL LOCKUP AND THE REAL HEADER, never a drawing of them. `today` is
 * literally what `pricing/page.tsx` renders: `MarketingHeader skin="cinema"
 * overlay`, then `PageHero` at `rise`/`lg` with the ruled golden line out of
 * `marketing-voice.ts`, then the `PaperChapter` the money turns the page to.
 * The two candidates change ONE thing each and keep everything else.
 *
 * ★ AND THE FOLD IS DRAWN, because on this decision the fold IS the question.
 * A visitor arrives asking what it costs; today the first price is most of a
 * screen below the one thing they came for. The dashed rule at 900 px is a
 * laptop's screen, and the caption under each frame says how far down the
 * first price actually landed, measured rather than asserted.
 */

export type Opening = "line" | "plans" | "fork";

const SUBHEAD =
  "No per-guest fees. Plans are sized by storage, so pick the room your event actually needs.";

/* ── The fork's two doors ────────────────────────────────────────────────── */

const pass = planById("event_pass");
const free = planById("free");
const proFrom = plansForTier("pro")[0];

function Door({
  on,
  title,
  price,
  under,
  onPick,
}: {
  on: boolean;
  title: string;
  price: string;
  under: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={cn(
        "group flex flex-1 flex-col items-start gap-1 rounded-2xl border p-6 text-left transition-colors outline-none sm:p-7",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        on ? "border-foreground/40 bg-card" : "bg-card/30 hover:bg-card/60",
      )}
    >
      <span className="font-heading text-subsection">{title}</span>
      <span
        data-pp-price
        className="font-heading text-section tabular-nums"
      >
        {price}
      </span>
      <span className="text-sm text-pretty text-muted-foreground">{under}</span>
    </button>
  );
}

/* ── The three openings ──────────────────────────────────────────────────── */

export function PageTop({
  opening,
  pair,
  size,
  pass: place,
}: {
  opening: Opening;
  pair: Pair;
  size: SizePick;
  pass: PassPlace;
}) {
  const [side, setSide] = useState<"once" | "again">("once");

  if (opening === "line") {
    return (
      <>
        <MarketingHeader skin="cinema" overlay />
        <PageHero
          entrance="rise"
          scale="lg"
          eyebrow="Pricing"
          heading={<>{GOLDEN_LINES.pricing}.</>}
          subhead={SUBHEAD}
          className="pt-14 pb-4 sm:pt-20 sm:pb-6"
        />
        <PaperChapter>
          <SectionShell id="plans">
            <PlanBlock pair={pair} size={size} pass={place} />
          </SectionShell>
        </PaperChapter>
      </>
    );
  }

  if (opening === "plans") {
    return (
      <>
        {/* ★ THE HEADER FOLLOWS THE GROUND. A page that opens on paper takes
            the paper skin and the in-flow header, exactly as the `(paper)`
            route group renders it: the cinema skin's overlay header is
            transparent by design, so over a white chapter its light nav would
            be invisible. Caught by reading the first capture: it drew a 64 px
            dark strip above the paper, which is neither of the two chromes the
            site actually has. */}
        <MarketingHeader />
        {/* The page opens ON the paper chapter: the same words, set at the
            chapter step instead of the page step, sitting directly over the
            cards. The cinema room the page used to open in is not lost, it
            starts one section later (the unlock grid), so the brand's
            dark/paper alternation still runs, out of phase by one. */}
        <PaperChapter>
          <section className="pt-24 pb-20 sm:pt-28 sm:pb-24">
            <Container>
              <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Pricing
                </p>
                <h1 className="font-heading text-chapter text-balance">
                  {GOLDEN_LINES.pricing}.
                </h1>
                <p className="text-pretty text-muted-foreground">{SUBHEAD}</p>
              </div>
              <div className="mt-12">
                <PlanBlock pair={pair} size={size} pass={place} />
              </div>
            </Container>
          </section>
        </PaperChapter>
      </>
    );
  }

  // "fork": the page's real question, asked first, and the plans arranged by
  // the answer. Both doors carry a price, so nobody reaches them and still
  // does not know what this costs.
  return (
    <>
      <MarketingHeader skin="cinema" overlay />
      <section className="pt-14 pb-10 sm:pt-20 sm:pb-12">
        <Container>
          <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Pricing
            </p>
            <h1 className="font-heading text-title text-balance">
              One event, or hosting again?
            </h1>
          </div>
          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-4 sm:flex-row">
            <Door
              on={side === "once"}
              onPick={() => setSide("once")}
              title="One event"
              price={`${free.priceLabel} to ${pass.priceLabel.replace(" one-time", "")}`}
              under={`Free covers ${formatBytes(free.storageBytes)} of photos. A pass adds video and ${formatBytes(pass.storageBytes)}, paid once, ${EVENT_PASS_RENEWAL_PRICE_LABEL} a year to keep it.`}
            />
            <Door
              on={side === "again"}
              onPick={() => setSide("again")}
              title="Hosting again"
              price={`from ${proFrom.priceLabel}`}
              under="Pro keeps every event you host in one place, with three sizes of room and two months free on a year."
            />
          </div>
        </Container>
      </section>
      <PaperChapter>
        <SectionShell id="plans">
          <PlanBlock pair={pair} size={size} pass={place} only={side} />
        </SectionShell>
      </PaperChapter>
    </>
  );
}
