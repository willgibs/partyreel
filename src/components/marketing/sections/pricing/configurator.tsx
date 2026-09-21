"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trackAttrs } from "@/lib/analytics/events";
import {
  annualPlanFor,
  friendlyCapacity,
  GIGABYTE,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import { PhotoStack, StatRow } from "./plan-cards";
import { recommendPlan, type Recommendation } from "./recommend";

/**
 * THE CONFIGURATOR (`pricing-page` r2, `fit=split`, Will 2026-09-20). Round
 * one ratified the album WALL here and he then asked for this shape by name:
 * "I think Higgsfield does a good job of their 'find the best plan for you'
 * ... where they show a designed plan card as the result in a frame to the
 * right, with the config in the left half." Round two drew it and he took it,
 * so the wall is gone and this is the block: the controls recessed on the
 * left, one photographed plan card elevated on the right as the live result.
 *
 * ★ IT SITS INSIDE THE PAPER CHAPTER NOW, DIRECTLY UNDER THE PLANS, and that
 * is the other half of his verdict, in his words: "the configurator section
 * directly beneath the plan cards feels much better. We should swap the
 * configurator section and the 'Where Free ends and paid begins.' upgrade
 * section above. The upgrade section can start the next chapter as an
 * overview, then table next, then FAQ." So this block CLOSES the paper
 * chapter (a reader sizes their event while the pair is still in their eye)
 * and `UnlockGrid` opens the dark one. It supersedes his round-one line about
 * the tiles standing above Find your size, as he said himself it would.
 *
 * ★ TWO PLANES, NOT A SHADOW, AND THAT IS PEARL'S OWN ARITHMETIC. On paper
 * `--card` and `--background` are the SAME white (globals.css: "a card is
 * defined by its hairline, never by a step of 0.007 that no eye resolves"),
 * so "recessed" and "elevated" cannot be drawn as two card fills. The recess
 * is `bg-muted`, a real 0.032 step BELOW the page; the elevated half is the
 * page's own white; one hairline divides them and the panel's border wraps
 * both. The controls then sit on white INSIDE the recess, which is what makes
 * them read as things you may touch. The only shadow in the block is on the
 * prints, which is the one overlap `shadow-lift` exists for (elevation-policy).
 *
 * ★ THE DECK FANS AS THE SLIDER TRAVELS, and that is deliberate compensation.
 * The board's own overrule line warned that split trades away the wall's
 * "watch your album fill up" delight; it does not have to. The result card
 * carries the pair's stacked prints (`PhotoStack`, imported, never a second
 * copy of that grammar) and the number FANNED OUT rides the ladder, so
 * dragging for more room lays another print on the deck under a 300ms
 * transform. Reduced motion keeps the count and drops the travel, through the
 * same `motion-reduce` the pair's own hover spread uses.
 *
 * The brain stays `recommendPlan` (pure, unit-tested) and every number comes
 * out of tiers.ts, so this card can never offer a size Checkout does not sell.
 * The island holds the controls and the frame, nothing else.
 */

/** The curated stop ladder: meaningful detents (the 2 GB Free cap, the 75 GB
 *  pass, the three Pro sizes), clean keyboard steps, honest numbers. */
export const STOP_GB = [
  1, 2, 5, 10, 25, 50, 75, 100, 150, 250, 500, 750, 1024, 1536, 2048,
];

/**
 * The result card's own deck: four real events, none of them the pair's stack
 * or the ticket's frame, so the answer reads as its own object in the family
 * rather than as a fourth plan.
 */
const DECK = ["wedding-rings", "reception-hall", "party-dj", "festival-lights"];

/** How many prints are fanned out at a stop: one at the floor, the whole deck
 *  at the ceiling, evenly along the ladder. */
export function printsAt(stop: number): number {
  return 1 + Math.round((stop / (STOP_GB.length - 1)) * (DECK.length - 1));
}

export function Configurator() {
  const [stop, setStop] = useState(5); // 50 GB, a real wedding's neighborhood
  const [video, setVideo] = useState(true);
  const [hostingAgain, setHostingAgain] = useState(false);

  const bytes = STOP_GB[stop] * GIGABYTE;
  const rec = useMemo(
    () => recommendPlan({ bytes, video, hostingAgain }),
    [bytes, video, hostingAgain],
  );
  const need = friendlyCapacity(bytes);

  return (
    <SectionShell
      id="fit"
      eyebrow="Fit"
      heading="Find your size."
      subhead="Set what your event will collect, and the plan that fits takes shape as you go."
    >
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <div
          data-mkt-reveal
          style={{ "--i": 3 } as CSSProperties}
          className="overflow-hidden rounded-2xl border"
        >
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            {/* ── The recess: everything you can move ───────────────────
                `justify-center`, not `between`: the grid stretches both halves
                to the taller one (the card's), and three controls pinned to
                the top leave a hole the eye reads as unfinished, while spread
                to the edges they stop reading as one panel of controls. */}
            <div className="flex flex-col justify-center gap-6 bg-muted p-6 sm:p-8">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-label text-faint uppercase">
                    How much room
                  </span>
                  {/* A step UNDER the section's own h2, never level with it:
                      the figure is the subject of this panel, not of the
                      chapter, and at `section` the two were the same size. */}
                  <span className="font-heading text-prose tabular-nums">
                    {formatBytes(bytes)}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={STOP_GB.length - 1}
                  step={1}
                  value={stop}
                  onChange={(e) => setStop(Number(e.target.value))}
                  aria-label="How much storage your event needs"
                  aria-valuetext={formatBytes(bytes)}
                  className={cn(
                    "mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border outline-none",
                    "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-emphasis [&::-webkit-slider-thumb]:active:scale-110",
                    "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring/50",
                  )}
                />
                <div className="mt-2 flex justify-between text-micro text-faint uppercase">
                  <span>{formatBytes(STOP_GB[0] * GIGABYTE)}</span>
                  <span>
                    {formatBytes(STOP_GB[STOP_GB.length - 1] * GIGABYTE)}
                  </span>
                </div>

                {/* The equivalence: what that room actually holds, live. */}
                <p className="mt-4 text-caption text-pretty text-muted-foreground">
                  about {need.photos.toLocaleString()} photos
                  {video &&
                    ` or ${
                      need.videoMinutes >= 120
                        ? `${Math.round(need.videoMinutes / 60).toLocaleString()} hours`
                        : `${need.videoMinutes.toLocaleString()} minutes`
                    } of video`}
                </p>
              </div>

              {/* The two forks, each on the page's own white, so a control
                  inside the recess reads as something you may touch. */}
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-working">
                <span className={video ? "" : "text-muted-foreground"}>
                  Guests will add video
                </span>
                <Switch checked={video} onCheckedChange={setVideo} />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
                <span className="text-working text-muted-foreground">
                  How often you host
                </span>
                <OnceOrAgain again={hostingAgain} setAgain={setHostingAgain} />
              </div>
            </div>

            {/* ── The elevated half: the answer, as a card ─────────────── */}
            <ResultCard rec={rec} bytes={bytes} prints={printsAt(stop)} />
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

/** The one-event / hosting-again fork: the real Pass-to-Pro question. */
function OnceOrAgain({
  again,
  setAgain,
}: {
  again: boolean;
  setAgain: (v: boolean) => void;
}) {
  return (
    <div
      role="group"
      aria-label="How often you host"
      className="relative grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background transition-transform [transition-duration:var(--mkt-tabs-dur)] ease-emphasis motion-reduce:transition-none"
        style={{
          transform: `translateX(calc(${again ? 1 : 0} * (100% + 0.25rem)))`,
        }}
      />
      {(["One event", "Hosting again"] as const).map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={again === (i === 1)}
          onClick={() => setAgain(i === 1)}
          className={cn(
            "relative z-10 rounded-md px-3 py-1.5 text-working font-medium transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/50",
            "active:scale-[0.98] motion-reduce:active:scale-100",
            again === (i === 1)
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * The live result. `aria-live` so a keyboard slider announces the new verdict;
 * the prints are `aria-hidden` inside `PhotoStack`, so what is announced is
 * the plan, its price and the reason, never a deck of decoration.
 */
function ResultCard({
  rec,
  bytes,
  prints,
}: {
  rec: Recommendation;
  bytes: number;
  prints: number;
}) {
  const cap = friendlyCapacity(rec.plan.storageBytes);
  const annual = annualPlanFor(rec.planId);
  // How much of the recommended plan this setting actually spends: the one
  // thing a flat card cannot say, and the whole reason the room bar exists.
  const fill = Math.min(100, Math.round((bytes / rec.plan.storageBytes) * 100));

  return (
    /* The white half IS the frame, and the column inside it is the card (his
       Higgsfield reference: "a designed plan card as the result in a frame to
       the right"). The clamp is what makes that read: stretched across the
       whole half at 1440 the same content is a form, not a card, and a second
       hairline around it would be a card inside a card. */
    <div className="flex flex-col gap-4 border-t bg-card p-6 sm:p-8 lg:border-t-0 lg:border-l">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
        <PhotoStack ids={DECK} shown={prints} faded={false} />

        <div aria-live="polite" className="flex flex-col gap-4">
          <div>
            <p className="text-caption text-faint">We recommend</p>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-heading text-subsection">{rec.plan.name}</h3>
              <span className="font-heading text-subsection font-semibold tabular-nums">
                {/* Keyed on the label so every change re-pops the digits: the
                    price is the number a reader is dragging FOR. */}
                <PricePop
                  key={rec.plan.priceLabel}
                  label={rec.plan.priceLabel}
                />
              </span>
            </div>
            <p className="mt-1.5 text-caption text-pretty text-muted-foreground">
              {rec.reason}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-micro text-faint uppercase">
              <span>Expected room</span>
              <span className="tabular-nums">
                {fill}% of {formatBytes(rec.plan.storageBytes)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-emphasis motion-reduce:transition-none"
                style={{ width: `${fill}%` }}
              />
            </div>
          </div>

          <StatRow
            stats={[
              { value: formatBytes(rec.plan.storageBytes), label: "Storage" },
              { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
              {
                value: `${Math.round(cap.videoMinutes / 60).toLocaleString()} h`,
                label: "Video",
              },
            ]}
          />

          {annual && (
            <p className="text-caption text-faint">
              Or {annual.priceLabel} billed yearly, two months free.
            </p>
          )}
          {rec.alternative && (
            <p className="text-caption text-pretty text-faint">
              {rec.alternative}
            </p>
          )}
        </div>

        <div className="mt-auto">
          {rec.planId === "free" ? (
            <Button asChild variant="outline" className="w-full">
              <Link
                href="/login"
                {...trackAttrs("cta_click", {
                  cta: "start-free",
                  location: "pricing-configurator",
                })}
              >
                Start free
              </Link>
            </Button>
          ) : (
            <CheckoutButton
              planId={rec.planId}
              variant="outline"
              className="w-full"
              {...trackAttrs("checkout_start", { plan: rec.planId })}
            >
              {rec.planId === "event_pass"
                ? "Buy a pass"
                : `Get ${rec.plan.name}`}
            </CheckoutButton>
          )}
        </div>
      </div>
    </div>
  );
}
