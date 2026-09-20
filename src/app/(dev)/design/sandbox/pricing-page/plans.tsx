"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";

import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { StatRow } from "@/components/marketing/sections/pricing/plan-cards";
import { marketingImage } from "@/lib/constants/marketing-media";
import { PRO_LINE } from "@/lib/constants/marketing-voice";
import {
  annualPlanFor,
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  friendlyCapacity,
  GATED_EVENT_SETTINGS,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  planById,
  type PlanId,
  plansForTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { cn, formatBytes } from "@/lib/utils";

import { BuyButton } from "./scene";

/**
 * THE GIVEN WORLD, ROUND TWO: Free and Pro as the wired pair, the Event Pass as
 * the wired ticket. Round one's `pair`, `size` and `pass` axes are answered and
 * shipped (`pricing-wiring`, 58f7acbd): there is nothing left to configure here,
 * only to reproduce faithfully so `fit` and `phone` are judged on the page as it
 * actually reads today.
 *
 * ★ STILL A COPY, ON PURPOSE (round one's own rule, carried forward): the buy
 * control is dead (`BuyButton`), so no preview can open a real Checkout or
 * Billing Portal session. `StatRow` is imported from the shipped file rather
 * than retyped (it is pure and carries no wire), exactly as `pass-card.tsx`
 * itself imports it; everything else here is drawn from `tiers.ts` and
 * `plan-cards.tsx` / `pass-card.tsx`, read but never edited.
 */

const free = planById("free");
const pass = planById("event_pass");
const PRO = plansForTier("pro");

export type Cadence = "month" | "year";

/* ── The stacked-photo identity (plan-cards.tsx, verbatim) ───────────────── */

const STACK_IDS = {
  free: ["wedding-golden", "reception-table"],
  pro: ["wedding-golden", "party-balloons", "concert-confetti", "wedding-toast"],
} as const;

function PhotoStack({ ink }: { ink?: boolean }) {
  const ids = ink ? STACK_IDS.pro : STACK_IDS.free;
  const n = ids.length;
  return (
    <div aria-hidden className="relative h-24">
      <div className="absolute inset-x-0 top-1 flex justify-center">
        {ids.map((id, i) => {
          const m = marketingImage(id);
          const off = i - (n - 1) / 2;
          return (
            <div
              key={id}
              className="absolute"
              style={{ transform: `rotate(${off * (ink ? 9 : 7)}deg) translateX(${off * 16}px)` }}
            >
              <Image
                src={m.src}
                alt=""
                width={88}
                height={88}
                className={cn(
                  "size-20 rounded-md border-4 object-cover shadow-lift",
                  ink ? "border-background/90" : "border-background opacity-85 grayscale",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Item({ children, ink }: { children: ReactNode; ink?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
      <span className={ink ? "text-background/75" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}

/* ── The size slider (plan-cards.tsx's SizeSlider, verbatim) ─────────────── */

function SizeSlider({
  value,
  onPick,
}: {
  value: PlanId;
  onPick: (id: PlanId) => void;
}) {
  const i = Math.max(0, PRO.findIndex((p) => p.id === value));
  const pct = PRO.length > 1 ? (i / (PRO.length - 1)) * 100 : 0;
  return (
    <div>
      <input
        type="range"
        min={0}
        max={PRO.length - 1}
        step={1}
        value={i}
        onChange={(e) => onPick(PRO[Number(e.target.value)].id)}
        aria-label="Pro storage size"
        aria-valuetext={formatBytes(PRO[i].storageBytes)}
        style={{ "--fill": `${pct}%` } as CSSProperties}
        className={cn(
          "h-6 w-full cursor-pointer appearance-none rounded-full bg-transparent outline-none",
          "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-background)_var(--fill),color-mix(in_oklch,var(--color-background)_20%,transparent)_var(--fill))]",
          "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-background/20",
          "[&::-webkit-slider-thumb]:-mt-[0.4375rem] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background",
          "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-background",
        )}
      />
      <div aria-hidden className="mt-2 flex justify-between text-[10px] tracking-[0.1em] uppercase tabular-nums">
        {PRO.map((p) => (
          <span key={p.id} className={p.id === value ? "text-background" : "text-background/45"}>
            {formatBytes(p.storageBytes)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── The cadence toggle, shared above the pair ────────────────────────────── */

export function CadenceToggle({
  cadence,
  onPick,
}: {
  cadence: Cadence;
  onPick: (c: Cadence) => void;
}) {
  return (
    <div className="mb-8 flex justify-center">
      <div role="group" aria-label="Billing cadence" className="relative grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none">
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background transition-transform [transition-duration:var(--mkt-tabs-dur)] ease-emphasis motion-reduce:transition-none"
          style={{ transform: `translateX(calc(${cadence === "year" ? 1 : 0} * (100% + 0.25rem)))` }}
        />
        {(
          [
            { id: "month", label: "Monthly" },
            { id: "year", label: "Yearly, 2 months free" },
          ] as const
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={cadence === o.id}
            onClick={() => onPick(o.id)}
            className={cn(
              "relative z-10 rounded-md px-4 py-1.5 text-sm font-medium transition-colors outline-none",
              cadence === o.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Free: the paper sheet ─────────────────────────────────────────────────── */

export function FreeCard() {
  const cap = friendlyCapacity(free.storageBytes);
  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
      <PhotoStack />
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-subsection">{free.name}</h2>
        <p className="text-sm text-pretty text-muted-foreground">Your first event, covered.</p>
        <div className="mt-3 font-heading text-section tabular-nums">
          <PricePop label={free.priceLabel} />
        </div>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        <Item>{MAX_EVENTS.free} event, every guest, the album and the reel</Item>
        <Item>No watermark on photos or the album</Item>
        <Item>Verified-email uploads, on by default</Item>
      </ul>
      <div className="mt-6">
        <StatRow
          stats={[
            { value: formatBytes(free.storageBytes), label: "Storage" },
            { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
          ]}
        />
        <BuyButton className="mt-5 w-full" variant="outline">
          Start free
        </BuyButton>
        <p className="mt-3 text-center text-xs text-faint">No card. Upgrade only when you host again.</p>
      </div>
    </div>
  );
}

/* ── Pro: the same sheet, in ink, its slider inside it ────────────────────── */

export function ProCard({ cadence }: { cadence: Cadence }) {
  const [proId, setProId] = useState<PlanId>(PRO[0].id);
  const plan = planById(proId);
  const shown = cadence === "year" ? (annualPlanFor(proId) ?? plan) : plan;
  const cap = friendlyCapacity(plan.storageBytes);
  return (
    <div className="group relative flex flex-col rounded-2xl bg-foreground p-6 text-background sm:p-7">
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-foreground uppercase">
        Most popular
      </span>
      <PhotoStack ink />
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-subsection">Pro</h2>
        <p className="text-sm text-pretty text-background/75">{PRO_LINE}</p>
        <div className="mt-3 font-heading text-section tabular-nums">
          <PricePop key={shown.id} label={shown.priceLabel} />
        </div>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        <Item ink>{MAX_EVENTS.pro === null ? "Unlimited events" : "More events"}, one album each</Item>
        <Item ink>{videosAllowedForTier("pro") ? "Photos and video" : "Photos"}</Item>
        <Item ink>{MAX_REEL_SECONDS.pro}-second reels, no watermark</Item>
        <Item ink>
          {GATED_EVENT_SETTINGS.includes("password") ? "Password-locked albums" : "Locked albums"} and custom links
        </Item>
      </ul>
      <div className="mt-6">
        <SizeSlider value={proId} onPick={setProId} />
        <div className="mt-4">
          <StatRow
            ink
            stats={[
              { value: formatBytes(plan.storageBytes), label: "Storage" },
              { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
              { value: `${Math.round(cap.videoMinutes / 60).toLocaleString()} h`, label: "Video" },
            ]}
          />
        </div>
        <BuyButton className="mt-5 w-full bg-background text-foreground hover:bg-background/90">
          Get Pro at {shown.priceLabel}
        </BuyButton>
        <p className="mt-3 text-center text-xs text-background/60">
          {cadence === "year"
            ? "One payment a year, two months free. Change or cancel any time."
            : "Change size or cancel any time in the billing portal."}
        </p>
      </div>
    </div>
  );
}

/** Free and Pro, side by side today, one column under `lg` (no axis left to pick). */
export function PlanPairGiven() {
  const [cadence, setCadence] = useState<Cadence>("month");
  return (
    <div className="mx-auto max-w-4xl">
      <CadenceToggle cadence={cadence} onPick={setCadence} />
      <div className="grid gap-5 lg:grid-cols-2">
        <FreeCard />
        <ProCard cadence={cadence} />
      </div>
    </div>
  );
}

/* ── The Event Pass, as the wide ticket (pass-card.tsx, verbatim shape) ──── */

const PASS_IMAGE = "wedding-petals";

function Perforation() {
  return (
    <>
      <div aria-hidden className="relative hidden shrink-0 lg:block">
        <div className="h-full border-l border-dashed" />
        <span className="absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full border bg-background" />
        <span className="absolute -bottom-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full border bg-background" />
      </div>
      <div aria-hidden className="relative lg:hidden">
        <div className="border-t border-dashed" />
        <span className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full border bg-background" />
        <span className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full border bg-background" />
      </div>
    </>
  );
}

function PassPoint({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

export function PassTicketGiven() {
  const cap = friendlyCapacity(pass.storageBytes);
  const frame = marketingImage(PASS_IMAGE);
  return (
    <div className="relative mx-auto mt-5 flex max-w-4xl flex-col overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5 lg:flex-row lg:items-stretch">
      <div className="relative h-44 w-full shrink-0 sm:h-52 lg:h-auto lg:w-60">
        <Image src={frame.src} alt="" fill sizes="(min-width: 1024px) 15rem, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col gap-2 p-6 sm:p-7 lg:w-72 lg:shrink-0">
        <h2 className="font-heading text-subsection">{pass.name}</h2>
        <p className="text-sm text-pretty text-muted-foreground">One big event, paid once.</p>
        <div className="mt-2 font-heading text-section tabular-nums">
          <PricePop label={pass.priceLabel} />
        </div>
        <div className="mt-3">
          <StatRow
            stats={[
              { value: formatBytes(pass.storageBytes), label: "Storage" },
              { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
              { value: `${Math.round(cap.videoMinutes / 60).toLocaleString()} h`, label: "Video" },
            ]}
          />
        </div>
        <div className="mt-auto pt-5">
          <BuyButton variant="outline" className="w-full">
            Buy a pass
          </BuyButton>
        </div>
      </div>
      <Perforation />
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
        <ul className="flex flex-col gap-2.5">
          <PassPoint>Photos and video, like Pro</PassPoint>
          <PassPoint>{MAX_REEL_SECONDS.event_pass}-second reels, no watermark</PassPoint>
          <PassPoint>Password lock, custom link, your host page</PassPoint>
          <PassPoint>Passes stack: each one adds an event and {formatBytes(pass.storageBytes)}</PassPoint>
        </ul>
        <p className="mt-auto text-xs text-pretty text-faint">
          Covers its event for about a year. Renew for {EVENT_PASS_RENEWAL_PRICE_LABEL} a year or let it lapse: you
          drop back to Free with a {OVER_CAP_GRACE_DAYS}-day window to free up space or upgrade.
        </p>
      </div>
    </div>
  );
}

/** The pass, reshaped to the pair's own card grammar: for a row of peers (the
 *  swipe phone option), the wide ticket is a different silhouette by design
 *  and does not belong beside two square cards. */
export function PassCardGiven() {
  const cap = friendlyCapacity(pass.storageBytes);
  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
      <div aria-hidden className="relative h-24 overflow-hidden rounded-lg">
        <Image src={marketingImage(PASS_IMAGE).src} alt="" fill className="object-cover" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <h2 className="font-heading text-subsection">{pass.name}</h2>
        <p className="text-sm text-pretty text-muted-foreground">One big event, paid once.</p>
        <div className="mt-3 font-heading text-section tabular-nums">
          <PricePop label={pass.priceLabel} />
        </div>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        <Item>Photos and video, like Pro</Item>
        <Item>{MAX_REEL_SECONDS.event_pass}-second reels, no watermark</Item>
      </ul>
      <div className="mt-6">
        <StatRow
          stats={[
            { value: formatBytes(pass.storageBytes), label: "Storage" },
            { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
          ]}
        />
        <BuyButton className="mt-5 w-full" variant="outline">
          Buy a pass
        </BuyButton>
        <p className="mt-3 text-center text-xs text-faint">
          Renew for {EVENT_PASS_RENEWAL_PRICE_LABEL} a year, or let it lapse.
        </p>
      </div>
    </div>
  );
}
