"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  fittingProPlans,
  formatBytesUp,
  planHolds,
} from "@/lib/billing/storage-guard";
import { formatCapacity, type Plan } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import { billingOf, CURRENT_PLAN, TOTAL_ACTIVE_BYTES } from "./fixtures";

/**
 * THE PIECES EVERY OPTION SHARES, so the five answers differ only in how the
 * six prices sit, never in what a price, a fit or a refusal says.
 *
 * ★ FIT IS THE STORAGE GUARD'S OWN ARITHMETIC (`storage-guard.ts`), imported,
 * never re-derived: `planHolds` against the plain cap, `fittingProPlans` for
 * the size that fits at the billing she tapped, `formatBytesUp` for the two
 * numbers that are instructions. A tile can therefore never refuse a size the
 * route would sell, or sell one it would refuse.
 */

export const STORED = TOTAL_ACTIVE_BYTES;
export const fits = (plan: Plan) => planHolds(plan, STORED);

/** "about 25,600 photos or 11 hours of video", the plan card's own sentence. */
export const holds = (bytes: number) => `about ${formatCapacity(bytes)}`;

/** "Pro 500 GB, yearly": a plan's name says its size and never its billing. */
export const nameWithBilling = (plan: Plan) =>
  billingOf(plan) === "year" ? `${plan.name}, yearly` : plan.name;

/* ── the press: what a tap on a price does, locally ─────────────────────── */

export type Press = {
  /** The price she tapped that cannot hold what she stores, flipped in place. */
  refused: Plan | null;
  /** A price that fits, pressed: production's own "Opening…" beat. */
  opening: string | null;
  press: (plan: Plan) => void;
  keep: () => void;
};

/**
 * ★ A SWITCH STOPS AT "OPENING…". In production it asks `/api/stripe/
 * change-plan`, which checks the storage and answers with Stripe's confirm
 * page for exactly that price; this board shows the button's own pending
 * label for a beat and goes nowhere, so a press is felt and nothing is bought.
 */
export function usePress(initial: Plan | null = null): Press {
  const [refused, setRefused] = useState<Plan | null>(initial);
  const [opening, setOpening] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return {
    refused,
    opening,
    press(plan) {
      if (plan.id === CURRENT_PLAN.id) return;
      if (!fits(plan)) {
        setRefused(plan);
        return;
      }
      setRefused(null);
      setOpening(plan.id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpening(null), 1400);
    },
    keep() {
      setRefused(null);
    },
  };
}

/* ── how full her 110.8 GB would make a size ─────────────────────────────── */

/**
 * ONE BAR PER SIZE, HER BYTES IN IT: a sliver of 2 TB, a fifth of 500 GB, and
 * 100 GB full with the rest spilling past its end. The fill is the storage
 * meter's own (`bg-foreground/70`, a bar with no light: the design system's
 * "light never goes near a cap"), and past the plain cap it is
 * `--destructive`, the one colour failure wears.
 */
export function FitMeter({
  bytes,
  ink = false,
  caption = true,
  className,
}: {
  bytes: number;
  ink?: boolean;
  /** The line under the bar; the refusal drops it, its numbers say it. */
  caption?: boolean;
  className?: string;
}) {
  const ratio = STORED / bytes;
  const over = ratio > 1;
  const pct = Math.min(100, Math.max(2, ratio * 100));
  return (
    <div className={cn("space-y-1", className)} data-hs-meter="">
      <span
        className={cn(
          "block h-1.5 overflow-hidden rounded-full",
          ink ? "bg-background/20" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "block h-full rounded-full",
            over
              ? "bg-destructive"
              : ink
                ? "bg-background/85"
                : "bg-foreground/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      {caption && (
        <p
          className={cn(
            "text-xs tabular-nums",
            over
              ? "text-destructive"
              : ink
                ? "text-background/70"
                : "text-muted-foreground",
          )}
        >
          {over
            ? `${formatBytesUp(STORED)} of ${formatBytes(bytes)} · over by ${formatBytesUp(STORED - bytes)}`
            : `${formatBytes(STORED)} of ${formatBytes(bytes)} · ${Math.max(1, Math.round(ratio * 100))}% full`}
        </p>
      )}
    </div>
  );
}

/* ── one price you can press ─────────────────────────────────────────────── */

/**
 * A PRICE IS ITS OWN SWITCH: the amount on top, what it means under it, the
 * whole tile the button. Her own price is the same tile, held, with a check
 * and "Your plan", never a button (pressing the plan you are on does nothing,
 * and production's route answers `already_on_plan`).
 */
export function PriceTile({
  plan,
  under,
  press,
  ink = false,
}: {
  plan: Plan;
  /** The line under the amount: its billing, a saving, or its difference. */
  under: ReactNode;
  press: Press;
  ink?: boolean;
}) {
  const held = plan.id === CURRENT_PLAN.id;
  const opening = press.opening === plan.id;
  const body = (
    <>
      <span
        data-hs-price={plan.id}
        className="flex items-center gap-1.5 text-sm font-medium tabular-nums"
      >
        {held && <Check className="size-3.5 shrink-0" aria-hidden />}
        {opening ? "Opening…" : plan.priceLabel}
      </span>
      <span
        className={cn(
          "text-xs text-pretty",
          ink ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {held ? "Your plan" : under}
      </span>
    </>
  );
  const shape =
    "flex min-w-0 flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left";
  if (held) {
    return (
      <div
        className={cn(
          shape,
          ink
            ? "border-background/25 bg-background/10 text-background"
            : "border-border bg-muted/50",
        )}
      >
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => press.press(plan)}
      aria-label={`Switch to ${nameWithBilling(plan)}, ${plan.priceLabel}`}
      className={cn(
        shape,
        "transition-[background-color,border-color,scale] duration-150 ease-emphasis outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:active:scale-100",
        ink
          ? "border-background/25 text-background hover:bg-background/10"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {body}
    </button>
  );
}

/* ── the refusal, in place (`refusal=inline`, stacked full width) ────────── */

/**
 * WHAT THE TAPPED SIZE FLIPS TO (his round-one pick, with his note: stacked
 * vertically so no line breaks as the three-column cards did). It says what
 * she stores, what the size holds and the gap, over the size's own bar, then
 * the two ways out, the fix first.
 *
 * ★ THE SECOND WAY OUT IS THE SMALLEST SIZE THAT FITS AT THE BILLING SHE
 * TAPPED, and when that is the plan she is on it is "Keep", never "Choose Pro
 * 500 GB instead" to a host already on Pro 500 GB (production's plain sentence
 * says exactly that today: plan names carry no billing). Tapped yearly, it is
 * the yearly price of her size, a real switch.
 */
export function RefusalFace({
  plan,
  press,
  onSeeSpace,
  framed = true,
}: {
  plan: Plan;
  press: Press;
  /** Opens the list for the size she tapped. */
  onSeeSpace: (plan: Plan) => void;
  /** A card of its own; bare inside a row or a card that already frames it. */
  framed?: boolean;
}) {
  const fit = fittingProPlans(STORED, billingOf(plan))[0] ?? null;
  const keeps = !fit || fit.id === CURRENT_PLAN.id;
  return (
    <div
      data-hs-refusal=""
      data-hs-state="refused"
      className={cn(
        "hs-swap space-y-3",
        framed &&
          "rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-4",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        {/* The SIZE is what cannot hold it, whichever billing was tapped; the
            price beside it says which one she pressed. */}
        <p className="min-w-0 text-sm font-medium text-pretty text-foreground">
          <span data-hs-refused="">{plan.name}</span> is smaller than what you
          store
        </p>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {plan.priceLabel}
        </span>
      </div>
      <FitMeter bytes={plan.storageBytes} caption={false} />
      <dl className="space-y-1 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">You store</dt>
          <dd className="font-medium tabular-nums">{formatBytesUp(STORED)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{plan.name} holds</dt>
          <dd className="font-medium tabular-nums">
            {formatBytes(plan.storageBytes)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Free at least</dt>
          <dd
            data-hs-gap=""
            className="font-medium text-destructive tabular-nums"
          >
            {formatBytesUp(STORED - plan.storageBytes)}
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="sm"
          className="sm:flex-1"
          onClick={() => onSeeSpace(plan)}
        >
          See what&rsquo;s using space
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="sm:flex-1"
          onClick={() => (keeps || !fit ? press.keep() : press.press(fit))}
        >
          {keeps
            ? `Keep ${CURRENT_PLAN.name}`
            : `${nameWithBilling(fit)} instead`}
        </Button>
      </div>
    </div>
  );
}
