"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { fittingProPlans, refusalSentence } from "@/lib/billing/storage-guard";
import { planById, type Plan } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";
import { PRO_PLAN_IDS } from "@/lib/validation/checkout";

import {
  type Billing,
  billingOf,
  CURRENT_PLAN,
  dollars,
  money,
  perYear,
  PRO_SIZES,
  type ProSize,
  sizeOf,
  yearlySaving,
} from "./fixtures";
import {
  FitMeter,
  fits,
  holds,
  nameWithBilling,
  type Press,
  PriceTile,
  RefusalFace,
  STORED,
} from "./parts";

/**
 * THE SIX PRICES, FIVE WAYS (his round-one note on `prices`: "I don't believe
 * these are the best ideas we can come up with here"). Each is a whole
 * strategy for the same six numbers (`tiers.ts`: three sizes, monthly or
 * yearly), and each answers a different first question:
 *
 *  - `shipped`: here is every price (production's `pro-price-list.tsx`, the
 *    reference, with his `refusal=inline` built in);
 *  - `sizes`: how much room do you want (three sizes, her bytes in each, both
 *    prices on each);
 *  - `moves`: what do you want to change (her plan held, then the ways to
 *    change it, each priced against today);
 *  - `pick`: build the plan you want (two choices, one result, one button);
 *  - `advised`: here is the one change that suits you (a suggestion from what
 *    she stores, every price under it).
 *
 * ★ EVERY ONE STACKS (his `plans=wide` note: "stack this rather than a 2col
 * row") and every refusal flips in place, full width (his `refusal` note:
 * "stacked vertically so each card's lines don't break").
 */

export type PricesOption = "shipped" | "sizes" | "moves" | "pick" | "advised";

type Props = { press: Press; onSeeSpace: (plan: Plan) => void };

/** The other billing of the same size ("Pro 500 GB, yearly" for hers). */
const otherBilling = (plan: Plan): Plan => {
  const size = sizeOf(plan);
  return billingOf(plan) === "month" ? size.yearly : size.monthly;
};

/** "$20 more a month", "$38 less a year": a price against what she pays now. */
function againstToday(plan: Plan): string {
  if (billingOf(plan) === "month" && billingOf(CURRENT_PLAN) === "month") {
    const d = dollars(plan) - dollars(CURRENT_PLAN);
    return d === 0
      ? "What you pay now"
      : `${money(Math.abs(d))} ${d > 0 ? "more" : "less"} a month`;
  }
  const d = perYear(plan) - perYear(CURRENT_PLAN);
  return d === 0
    ? "What you pay now"
    : `${money(Math.abs(d))} ${d > 0 ? "more" : "less"} a year`;
}

/** Under a price that already says /mo or /yr: what the billing means. */
const billingLine = (plan: Plan) =>
  billingOf(plan) === "year" ? "2 months free" : "Monthly";

/* ── 1. shipped: production's six rows ───────────────────────────────────── */

/** Size first, then monthly before yearly: production's own order. */
const ROWS: Plan[] = PRO_PLAN_IDS.map((id) => planById(id)).sort(
  (a, b) =>
    a.storageBytes - b.storageBytes ||
    Number(billingOf(a) === "year") - Number(billingOf(b) === "year"),
);

/**
 * `ProPriceList` AS IT SHIPS, class for class and sentence for sentence (the
 * fit line is production's own `refusalSentence`, fed exactly as the list
 * feeds it), with one change his round-one pick makes: "Too small" is a press
 * now, and the row it sits in flips to the refusal in place.
 */
export function ShippedPrices({ press, onSeeSpace }: Props) {
  const tooSmall = ROWS.filter((plan) => !fits(plan));
  const largestTooSmall = tooSmall[tooSmall.length - 1] ?? null;
  const smallestFit = ROWS.find(
    (plan) =>
      fits(plan) &&
      (!largestTooSmall || billingOf(plan) === billingOf(largestTooSmall)),
  );
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-xl border">
        {ROWS.map((plan) => {
          const isCurrent = plan.id === CURRENT_PLAN.id;
          if (press.refused?.id === plan.id) {
            return (
              <li key={plan.id} className="bg-destructive/5 p-3">
                <RefusalFace
                  plan={plan}
                  press={press}
                  onSeeSpace={onSeeSpace}
                  framed={false}
                />
              </li>
            );
          }
          return (
            <li
              key={plan.id}
              className="flex min-h-12 items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {plan.name}
                </p>
                <p
                  data-hs-price={plan.id}
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  {plan.priceLabel}
                </p>
              </div>
              {isCurrent ? (
                <span className="inline-flex h-7 items-center rounded-action-sm border border-border px-2.5 text-xs text-muted-foreground">
                  Your plan
                </span>
              ) : !fits(plan) ? (
                <button
                  type="button"
                  onClick={() => press.press(plan)}
                  className="rounded-sm text-xs text-faint underline-offset-4 outline-none hover:text-muted-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  Too small
                </button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => press.press(plan)}
                >
                  {press.opening === plan.id ? "Opening…" : "Switch"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {!press.refused && largestTooSmall ? (
        <p className="text-xs text-pretty text-muted-foreground">
          {refusalSentence(STORED, largestTooSmall, smallestFit ?? null)}
        </p>
      ) : null}
    </div>
  );
}

/* ── 2. sizes: three sizes, her bytes in each, both prices on each ───────── */

/**
 * ONE CARD PER SIZE, SMALLEST FIRST, the sheet's own `PlanCard` stacked full
 * width: its name and what it holds, a bar of how full her 110.8 GB would make
 * it, and both of its prices as the two switches. Her size is the ink card the
 * sheet already gives the plan it offers; her price is the held tile in it.
 */
export function SizePrices({ press, onSeeSpace }: Props) {
  return (
    <div className="space-y-2.5">
      {PRO_SIZES.map((size) => {
        const refused = press.refused;
        if (refused && refused.storageBytes === size.bytes) {
          return (
            <RefusalFace
              key={size.bytes}
              plan={refused}
              press={press}
              onSeeSpace={onSeeSpace}
            />
          );
        }
        const ink = size.bytes === CURRENT_PLAN.storageBytes;
        return (
          <div
            key={size.bytes}
            className={cn(
              "hs-swap space-y-3 rounded-xl border p-4",
              ink
                ? "border-transparent bg-foreground text-background"
                : "bg-card",
            )}
          >
            {/* Name and what it holds side by side at a desk, stacked in a
                hand: a name never breaks ("Pro 100 / GB" did at 375). */}
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <p className="text-sm font-medium whitespace-nowrap">
                {size.monthly.name}
              </p>
              <p
                className={cn(
                  "text-xs",
                  ink ? "text-background/70" : "text-faint",
                )}
              >
                {holds(size.bytes)}
              </p>
            </div>
            <FitMeter bytes={size.bytes} ink={ink} />
            <div className="grid grid-cols-2 gap-2">
              <PriceTile
                plan={size.monthly}
                under={billingLine(size.monthly)}
                press={press}
                ink={ink}
              />
              <PriceTile
                plan={size.yearly}
                under={billingLine(size.yearly)}
                press={press}
                ink={ink}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 3. moves: her plan held, then the ways to change it ─────────────────── */

type Move = { id: string; title: string; line: string; plans: Plan[] };

/** The changes open to her, in the order a host reaches for them. */
function movesFrom(current: Plan): Move[] {
  const here = sizeOf(current);
  const other = otherBilling(current);
  const bigger = PRO_SIZES.filter((s) => s.bytes > here.bytes);
  const smaller = PRO_SIZES.filter((s) => s.bytes < here.bytes);
  const both = (sizes: readonly ProSize[]) =>
    sizes.flatMap((s) => [s.monthly, s.yearly]);
  const moves: Move[] = [
    {
      id: "billing",
      title: billingOf(other) === "year" ? "Pay yearly" : "Pay monthly",
      line:
        billingOf(other) === "year"
          ? `The same ${formatBytes(here.bytes)}, paid for the year at once: two months free.`
          : `The same ${formatBytes(here.bytes)}, paid month by month.`,
      plans: [other],
    },
  ];
  if (bigger.length > 0)
    moves.push({
      id: "more",
      title: "More room",
      line: `${bigger.map((s) => s.monthly.name).join(" or ")}, ${holds(bigger[0].bytes)}.`,
      plans: both(bigger),
    });
  if (smaller.length > 0) {
    const nearest = smaller[smaller.length - 1];
    moves.push({
      id: "less",
      title: "Less room",
      // Said at rest, before any tap: a smaller size that cannot hold what
      // she stores names both numbers, as the storage guard would.
      line: fits(nearest.monthly)
        ? `${nearest.monthly.name}, ${holds(nearest.bytes)}.`
        : `${nearest.monthly.name} holds ${formatBytes(nearest.bytes)}, less than the ${formatBytes(STORED)} you store.`,
      plans: both(smaller),
    });
  }
  return moves;
}

/**
 * HER PLAN, HELD, THEN WHAT SHE CAN DO WITH IT: pay yearly, more room, less
 * room, each a card whose prices say what they cost against today ("$20 more
 * a month"), since a host changing plans thinks in changes rather than in a
 * price list. Every one of the six prices is still here: hers on top, the
 * other five inside the moves.
 */
export function MovePrices({ press, onSeeSpace }: Props) {
  const here = sizeOf(CURRENT_PLAN);
  return (
    <div className="space-y-2.5">
      <div className="space-y-3 rounded-xl bg-foreground p-4 text-background">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {nameWithBilling(CURRENT_PLAN)}, billed{" "}
              {billingOf(CURRENT_PLAN) === "month" ? "monthly" : "yearly"}
            </p>
            <p
              data-hs-price={CURRENT_PLAN.id}
              className="font-heading text-subsection tabular-nums"
            >
              {CURRENT_PLAN.priceLabel}
            </p>
          </div>
          <span className="inline-flex h-7 shrink-0 items-center rounded-action-sm border border-background/25 px-2.5 text-xs text-background/80">
            Your plan
          </span>
        </div>
        <FitMeter bytes={here.bytes} ink />
      </div>

      {movesFrom(CURRENT_PLAN).map((move) => {
        const refused = press.refused;
        if (refused && move.plans.some((p) => p.id === refused.id)) {
          return (
            <RefusalFace
              key={move.id}
              plan={refused}
              press={press}
              onSeeSpace={onSeeSpace}
            />
          );
        }
        return (
          <div
            key={move.id}
            className="hs-swap space-y-3 rounded-xl border bg-card p-4"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{move.title}</p>
              <p className="text-xs text-pretty text-muted-foreground">
                {move.line}
              </p>
            </div>
            <div
              className={cn(
                "grid gap-2",
                move.plans.length > 1 ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {move.plans.map((plan) => (
                <PriceTile
                  key={plan.id}
                  plan={plan}
                  under={againstToday(plan)}
                  press={press}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 4. pick: two choices, one result, one button ────────────────────────── */

/** The /pricing page's own segmented control, quoted still (no radix root). */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const at = options.findIndex((o) => o.id === value);
  return (
    <div className="space-y-1.5" data-hs-choice="">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        role="group"
        aria-label={label}
        className="relative grid gap-1 rounded-lg bg-muted p-1 select-none"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 rounded-md bg-background transition-transform duration-200 ease-emphasis motion-reduce:transition-none"
          style={{
            width: `calc((100% - 0.5rem - ${(options.length - 1) * 0.25}rem) / ${options.length})`,
            transform: `translateX(calc(${at} * (100% + 0.25rem)))`,
          }}
        />
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={o.id === value}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative z-10 truncate rounded-md px-2 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              o.id === value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * BUILD THE PLAN SHE WANTS: the size and the billing as two choices, opening
 * on hers, and ONE result under them with one button that names the exact
 * change ("Switch to Pro 2 TB, yearly"). The fewest prices on screen of any
 * answer, and the least doubt about what the one button does. A size that
 * cannot hold what she stores flips the result to the refusal as she picks it.
 */
export function PickPrices({
  press,
  onSeeSpace,
  start,
}: Props & { start: Plan }) {
  const [bytes, setBytes] = useState(start.storageBytes);
  const [billing, setBilling] = useState<Billing>(billingOf(start));
  const size = PRO_SIZES.find((s) => s.bytes === bytes) ?? PRO_SIZES[0];
  const chosen = billing === "year" ? size.yearly : size.monthly;
  const same = chosen.id === CURRENT_PLAN.id;
  const refused = !fits(chosen);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <Choice
        label="Size"
        value={String(bytes)}
        options={PRO_SIZES.map((s) => ({
          id: String(s.bytes),
          label: formatBytes(s.bytes),
        }))}
        onChange={(v) => {
          const next = Number(v);
          setBytes(next);
          press.keep();
        }}
      />
      <Choice<Billing>
        label="Billing"
        value={billing}
        options={[
          { id: "month", label: "Monthly" },
          { id: "year", label: "Yearly" },
        ]}
        onChange={(v) => {
          setBilling(v);
          press.keep();
        }}
      />
      {refused ? (
        <div className="border-t pt-4">
          <RefusalFace
            plan={chosen}
            press={{
              ...press,
              keep: () => {
                setBytes(CURRENT_PLAN.storageBytes);
                setBilling(billingOf(CURRENT_PLAN));
              },
              press: (p) => {
                setBytes(p.storageBytes);
                setBilling(billingOf(p));
                press.press(p);
              },
            }}
            onSeeSpace={onSeeSpace}
            framed={false}
          />
        </div>
      ) : (
        <div className="hs-swap space-y-3 border-t pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{nameWithBilling(chosen)}</p>
              <p
                data-hs-price={chosen.id}
                className="font-heading text-subsection tabular-nums"
              >
                {chosen.priceLabel}
              </p>
            </div>
            <p className="shrink-0 pb-1 text-xs text-muted-foreground">
              {same ? "Your plan" : againstToday(chosen)}
            </p>
          </div>
          <FitMeter bytes={chosen.storageBytes} />
          <Button
            type="button"
            className="w-full"
            disabled={same}
            onClick={() => press.press(chosen)}
          >
            {same
              ? "This is your plan"
              : press.opening === chosen.id
                ? "Opening…"
                : `Switch to ${nameWithBilling(chosen)}`}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── 5. advised: the one change that suits her, then every price ─────────── */

type Advice = { headline: string; why: string; plan: Plan; act: string };

/**
 * THE ONE CHANGE WHAT SHE STORES MAKES SENSIBLE, from the same facts the sheet
 * already reads when it opens (`plan-facts`): near the top of her size, the
 * next size up; a smaller size that holds it, that size; else, on monthly, the
 * year; else nothing, and the rows stand alone.
 */
function adviceFor(current: Plan): Advice | null {
  const here = sizeOf(current);
  if (STORED / here.bytes >= 0.85) {
    const up = PRO_SIZES.find((s) => s.bytes > here.bytes);
    if (up) {
      const plan = billingOf(current) === "year" ? up.yearly : up.monthly;
      return {
        headline: `More room: ${plan.name} for ${plan.priceLabel}`,
        why: `You store ${formatBytes(STORED)} of ${formatBytes(here.bytes)}.`,
        plan,
        act: `Switch to ${nameWithBilling(plan)}`,
      };
    }
  }
  const down = fittingProPlans(STORED, billingOf(current))[0];
  if (down && down.storageBytes < here.bytes) {
    return {
      headline: `Pay less: ${down.name} for ${down.priceLabel}`,
      why: `It holds the ${formatBytes(STORED)} you store.`,
      plan: down,
      act: `Switch to ${nameWithBilling(down)}`,
    };
  }
  if (billingOf(current) === "month") {
    const year = here.yearly;
    return {
      headline: `Pay yearly: ${money(perYear(year))} instead of ${money(perYear(current))}`,
      why: `${current.name} is already the smallest size that holds your ${formatBytes(STORED)}, so the year is what saves: two months free, ${money(yearlySaving(here))} less.`,
      plan: year,
      act: "Switch to yearly",
    };
  }
  return null;
}

/**
 * LED BY THE ONE CHANGE THAT SUITS HER, the sheet's own principle carried to
 * a Pro host ("led by the reason it opened": the one thing a static /pricing
 * can never say), then every price as production's quiet rows under it.
 */
export function AdvisedPrices({ press, onSeeSpace }: Props) {
  const advice = adviceFor(CURRENT_PLAN);
  return (
    <div className="space-y-3">
      {advice && (
        <div className="space-y-3 rounded-xl bg-foreground p-4 text-background">
          <div className="space-y-1">
            <p className="text-xs text-background/70">Suggested for you</p>
            <p className="font-heading text-subsection text-pretty">
              <span data-hs-price={advice.plan.id}>{advice.headline}</span>
            </p>
            <p className="text-xs text-pretty text-background/80">
              {advice.why}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => press.press(advice.plan)}
          >
            {press.opening === advice.plan.id ? "Opening…" : advice.act}
          </Button>
        </div>
      )}
      <p className="pt-1 text-xs font-medium text-muted-foreground">
        Every price
      </p>
      <ShippedPrices press={press} onSeeSpace={onSeeSpace} />
    </div>
  );
}

export function PricesFor({
  option,
  press,
  onSeeSpace,
}: Props & { option: PricesOption }) {
  switch (option) {
    case "shipped":
      return <ShippedPrices press={press} onSeeSpace={onSeeSpace} />;
    case "sizes":
      return <SizePrices press={press} onSeeSpace={onSeeSpace} />;
    case "moves":
      return <MovePrices press={press} onSeeSpace={onSeeSpace} />;
    case "pick":
      return (
        <PickPrices
          press={press}
          onSeeSpace={onSeeSpace}
          start={press.refused ?? CURRENT_PLAN}
        />
      );
    case "advised":
      return <AdvisedPrices press={press} onSeeSpace={onSeeSpace} />;
  }
}
