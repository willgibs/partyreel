"use client";

import { type ReactNode, useState } from "react";
import { ChevronLeft, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type Plan,
  formatCapacity,
  plansForTier,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import {
  CURRENT_PLAN,
  GAP_BYTES,
  TARGET_PLAN,
  TOTAL_ACTIVE_BYTES,
} from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE PLAN SHEET'S TWO NEW FACES, quoted from `pricing-sheet.tsx`'s own
 * private pieces (`PlanCard`, `holds()`) rather than imported: neither is
 * exported, both are re-typed here class for class, and the real `Sheet` is a
 * radix `Dialog` that would portal out of this frame (`surfaces.tsx`'s own
 * `.hs-sheet`/`.hs-scrim` are reused for the same reason).
 *
 * ★ NOTHING HERE STARTS CHECKOUT OR OPENS THE REAL PORTAL. Every button is
 * drawn, never wired: `billing-caps.md`'s own rule that a Pro SWITCH finishes in
 * Stripe's own billing portal is untouched by this board, decision 5 included
 * — six prices being VISIBLE in the sheet is a comparison the host could not
 * make before, not a new route to Checkout.
 */

export type RefusalOption = "inline" | "swap" | "banner";
export type PricesLayout = "rows" | "cards" | "matrix";

const fits = (plan: Plan) => plan.storageBytes >= TOTAL_ACTIVE_BYTES;
const holds = (bytes: number) => `about ${formatCapacity(bytes)}`;

function SheetShell({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <>
      <div className="hs-scrim" aria-hidden />
      <div
        className="hs-sheet"
        data-screen={screen}
        role="dialog"
        aria-label="Your plan"
      >
        {children}
      </div>
    </>
  );
}

function SheetHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 pr-10">
      <p className="font-heading text-card-title font-medium">{title}</p>
      <p className="text-sm text-pretty text-muted-foreground">{sub}</p>
    </div>
  );
}

/** The tapped size's own numbers: stored, what it holds, the gap. */
function RefusalNumbers() {
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-muted-foreground">Stored</dt>
        <dd className="font-medium tabular-nums">
          {formatBytes(TOTAL_ACTIVE_BYTES)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-muted-foreground">{TARGET_PLAN.name} holds</dt>
        <dd className="font-medium tabular-nums">
          {formatBytes(TARGET_PLAN.storageBytes)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-muted-foreground">Free at least</dt>
        <dd className="font-medium tabular-nums text-destructive">
          {formatBytes(GAP_BYTES)}
        </dd>
      </div>
    </dl>
  );
}

/** The two ways out: the size that fits, and free up space. */
function WaysOut({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex gap-2", compact ? "flex-col" : "sm:flex-row")}>
      <Button type="button" size="sm" variant="secondary" className="flex-1">
        Choose {CURRENT_PLAN.name} instead
      </Button>
      <Button type="button" size="sm" variant="outline" className="flex-1">
        See what&rsquo;s using space
      </Button>
    </div>
  );
}

function BannerLine() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {TARGET_PLAN.name} would not fit: free {formatBytes(GAP_BYTES)} first.
      </span>
    </div>
  );
}

/** `pricing-sheet.tsx`'s private `PlanCard`, re-typed, plus the two refused
 *  tones this board adds: `refused` (the card becomes the numbers and the two
 *  ways out) and `disabled` (dimmed, a banner said it already). */
function PlanCardQuote({
  plan,
  ink = false,
  held = false,
  tone = "normal",
  children,
}: {
  plan: Plan;
  ink?: boolean;
  held?: boolean;
  tone?: "normal" | "refused" | "disabled";
  children?: ReactNode;
}) {
  if (tone === "refused") {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-foreground">{plan.name}</p>
        <RefusalNumbers />
        <WaysOut compact />
      </div>
    );
  }
  return (
    <div
      data-plan={plan.id}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 rounded-xl border p-4",
        ink ? "border-transparent bg-foreground" : "bg-card",
        tone === "disabled" && "opacity-50",
      )}
    >
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            ink ? "text-background" : "text-foreground",
          )}
        >
          {plan.name}
        </p>
        <p
          className={cn(
            "font-heading text-subsection tabular-nums",
            ink && "text-background",
          )}
        >
          {plan.priceLabel}
        </p>
        <p className={cn("text-xs", ink ? "text-background/70" : "text-faint")}>
          {holds(plan.storageBytes)}
        </p>
      </div>
      {children}
      {held ? (
        <span className="mt-auto inline-flex h-7 items-center justify-center rounded-action-sm border border-border text-xs text-muted-foreground">
          Your plan
        </span>
      ) : null}
      {tone === "disabled" ? (
        <span className="text-xs text-muted-foreground">Won&rsquo;t fit</span>
      ) : null}
    </div>
  );
}

/* ── decision 4: the refusal ─────────────────────────────────────────────── */

const PRO_MONTHLY = plansForTier("pro", "month");

export function RefusalShowcase({
  option,
  screen,
}: {
  option: RefusalOption;
  screen: ScreenId;
}) {
  if (option === "swap") {
    return (
      <SheetShell screen={screen}>
        <SheetHead
          title={`${TARGET_PLAN.name} does not fit`}
          sub="Free up space, or pick a size that does."
        />
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <Button type="button" variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft /> Back to sizes
          </Button>
          <div className="rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-5">
            <RefusalNumbers />
          </div>
          <WaysOut />
        </div>
      </SheetShell>
    );
  }

  return (
    <SheetShell screen={screen}>
      <SheetHead
        title="You are on Pro already"
        sub="Change your storage size, switch to yearly or cancel in the billing portal."
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {option === "banner" && <BannerLine />}
        <div
          className={cn("flex gap-3", screen === "375" ? "flex-col" : "flex-row")}
        >
          {PRO_MONTHLY.map((p) => {
            const ok = fits(p);
            const current = p.id === CURRENT_PLAN.id;
            const tone =
              !ok && option === "inline"
                ? "refused"
                : !ok && option === "banner"
                  ? "disabled"
                  : "normal";
            return (
              <PlanCardQuote key={p.id} plan={p} held={current} tone={tone}>
                {!current && ok && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-auto w-full"
                  >
                    Switch
                  </Button>
                )}
              </PlanCardQuote>
            );
          })}
        </div>
      </div>
    </SheetShell>
  );
}

/* ── decision 5: the six prices ──────────────────────────────────────────── */

/** The real /pricing page's own sliding segmented control, quoted static: two
 *  states, no radix, so it needs no root context to sit inside this frame. */
function IntervalToggle({
  value,
  onChange,
}: {
  value: "month" | "year";
  onChange: (v: "month" | "year") => void;
}) {
  return (
    <div
      role="group"
      aria-label="Billing cadence"
      className="relative grid w-fit grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-md bg-background transition-transform duration-200 ease-emphasis motion-reduce:transition-none"
        style={{ transform: `translateX(${value === "year" ? "100%" : "0%"})` }}
      />
      {(["month", "year"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "relative z-10 rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === v ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {v === "month" ? "Monthly" : "Yearly"}
        </button>
      ))}
    </div>
  );
}

function PricesRows({
  refusal,
  screen,
}: {
  refusal: RefusalOption;
  screen: ScreenId;
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const sizes = plansForTier("pro", interval);
  return (
    <>
      <IntervalToggle value={interval} onChange={setInterval} />
      {refusal === "banner" && <BannerLine />}
      <div className="divide-y divide-border rounded-xl border border-border">
        {sizes.map((p) => {
          const ok = fits(p);
          const current = interval === "month" && p.id === CURRENT_PLAN.id;
          if (!ok && refusal === "inline") {
            return (
              <div key={p.id} className="space-y-2 p-3">
                <p className="text-sm font-medium">{p.name}</p>
                <RefusalNumbers />
                <WaysOut compact />
              </div>
            );
          }
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between gap-3 p-3",
                !ok && "opacity-50",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {p.name}
                  {current && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      Your plan
                    </span>
                  )}
                </p>
                {screen === "1440" && (
                  <p className="text-xs text-muted-foreground">
                    {holds(p.storageBytes)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium tabular-nums">
                  {p.priceLabel}
                </span>
                {!current && ok && (
                  <Button type="button" size="sm" variant="outline">
                    Switch
                  </Button>
                )}
                {!ok && refusal !== "inline" && (
                  <span className="text-xs text-muted-foreground">
                    Won&rsquo;t fit
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function PricesCards({
  refusal,
  screen,
}: {
  refusal: RefusalOption;
  screen: ScreenId;
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const sizes = plansForTier("pro", interval);
  return (
    <>
      <IntervalToggle value={interval} onChange={setInterval} />
      {refusal === "banner" && <BannerLine />}
      <div className={cn("flex gap-3", screen === "375" ? "flex-col" : "flex-row")}>
        {sizes.map((p) => {
          const ok = fits(p);
          const current = interval === "month" && p.id === CURRENT_PLAN.id;
          const tone =
            !ok && refusal === "inline"
              ? "refused"
              : !ok && refusal !== "inline"
                ? "disabled"
                : "normal";
          return (
            <PlanCardQuote key={p.id} plan={p} held={current} tone={tone}>
              {!current && ok && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-auto w-full"
                >
                  Switch
                </Button>
              )}
            </PlanCardQuote>
          );
        })}
      </div>
    </>
  );
}

function PricesMatrix({
  refusal,
  screen,
}: {
  refusal: RefusalOption;
  screen: ScreenId;
}) {
  const monthly = plansForTier("pro", "month");
  const yearly = plansForTier("pro", "year");
  return (
    <>
      {refusal === "banner" && <BannerLine />}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-3 bg-muted/40 text-xs font-medium text-muted-foreground">
          <span className="px-3 py-2">Size</span>
          <span className="px-3 py-2 text-right">Monthly</span>
          <span className="px-3 py-2 text-right">Yearly</span>
        </div>
        {monthly.map((m, i) => {
          const y = yearly[i];
          const ok = fits(m);
          const current = m.id === CURRENT_PLAN.id;
          return (
            <div
              key={m.id}
              className={cn(
                "grid grid-cols-3 items-center border-t border-border text-sm",
                current && "bg-muted/30",
                !ok && "opacity-50",
              )}
            >
              <span className="truncate px-3 py-2.5 font-medium">
                {m.name.replace("Pro ", "")}
                {current && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    Your plan
                  </span>
                )}
              </span>
              <span className="px-3 py-2.5 text-right tabular-nums">
                {m.priceLabel}
              </span>
              <span className="px-3 py-2.5 text-right tabular-nums">
                {y.priceLabel}
              </span>
            </div>
          );
        })}
      </div>
      {!fits(monthly.find((m) => m.id === TARGET_PLAN.id) ?? monthly[0]) &&
        refusal === "inline" && (
          <div className="space-y-2 rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-4">
            <p className="text-sm font-medium">
              {TARGET_PLAN.name} is struck through above because it does not fit
            </p>
            <RefusalNumbers />
            <WaysOut compact />
          </div>
        )}
      {screen === "375" && (
        <p className="text-xs text-muted-foreground">
          The same six numbers, unscrolled: nothing here needs the phone&rsquo;s
          width to read.
        </p>
      )}
    </>
  );
}

export function PricesShowcase({
  layout,
  refusal,
  screen,
}: {
  layout: PricesLayout;
  refusal: RefusalOption;
  screen: ScreenId;
}) {
  return (
    <SheetShell screen={screen}>
      <SheetHead
        title="Your plan"
        sub="Every Pro size, and how often it bills."
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {layout === "rows" && <PricesRows refusal={refusal} screen={screen} />}
        {layout === "cards" && <PricesCards refusal={refusal} screen={screen} />}
        {layout === "matrix" && (
          <PricesMatrix refusal={refusal} screen={screen} />
        )}
      </div>
    </SheetShell>
  );
}
