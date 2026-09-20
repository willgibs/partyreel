"use client";

import { Check, Minus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { Reveal } from "@/components/marketing/system/reveal";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { PRO_LINE } from "@/lib/constants/marketing-voice";
import {
  annualPlanFor,
  friendlyCapacity,
  GATED_EVENT_SETTINGS,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  type Plan,
  planById,
  type PlanId,
  plansForTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

/**
 * THE PAIR (Biograph-adapted, Will's 2026-08-27 design notes): Free is the paper
 * sheet, Pro is the same sheet in INK. The premium card is a full token
 * inversion (bg-foreground / text-background) rather than a nested .dark — the
 * PaperChapter doctrine forbids re-theming a subtree, and the inversion needs
 * no new tokens at all. Light/dark is tier identity here; the page's chapter
 * alternation stays brand rhythm (note 4).
 *
 * VISUAL IDENTITY = V2 "Stacked photos" (Will's sitting ruling, 2026-08-27:
 * "within the card v2 has a nice balance"): a small physical stack of real
 * event photos above each card head, wearing `shadow-lift`. This was the
 * back-pocket exception ("shadows may return where photos physically stack")
 * and it is the rule since the light ruling (2026-09-17): prints lying on
 * prints are the overlap the small shadow exists for. It reads on the ink card
 * with paper's alphas because it lands on the white border of the print below.
 * Free stacks two, grayscale (your photos, before the color arrives); Pro
 * stacks four, vivid, on the ink. Hovering the card spreads the stack.
 *
 * THE PAIR SURVIVED ITS OWN BOARD (`pair=pro` with Will's flip, 2026-09-20):
 * the option that won drew Pro alone across the row, and his note flipped it
 * back into two columns ("keeping free and pro side-by-side 2col above and the
 * event pass a 2col width card below helps frame the pro plan benefits more
 * against free, then make event pass feel more unique as its own option"). So
 * the ONE thing that changed in this file is the size control: a slider, not a
 * three-way switch (see SizeSlider), with the cadence toggle staying above the
 * pair where he wants it.
 *
 * PRICE REGISTER: money renders in the DISPLAY face (Urbanist via font-heading)
 * with tabular numerals, values in Inter. The old page set money in mono and it
 * read devtool on these cards (Will's sitting flag); the kill-mono sweep took
 * this register to every number that is the subject of its block (2026-09-14).
 *
 * Every number renders from tiers.ts. The A16 rule holds on both surfaces:
 * green check = you get this; muted minus = a cap, not an inclusion.
 */

const STACK_IDS = {
  free: ["wedding-golden", "reception-table"],
  pro: [
    "wedding-golden",
    "party-balloons",
    "concert-confetti",
    "wedding-toast",
  ],
} as const;

/** The ratified V2 stack. aria-hidden: pure identity, the copy carries meaning. */
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
              style={{
                transform: `rotate(${off * (ink ? 9 : 7)}deg) translateX(${off * 16}px)`,
              }}
            >
              <Image
                src={m.src}
                alt=""
                width={88}
                height={88}
                className={cn(
                  // Stacked prints: the overlap the small shadow was ruled for.
                  "size-20 rounded-md border-4 object-cover shadow-lift",
                  "transition-transform duration-300 ease-emphasis motion-reduce:transition-none",
                  "group-hover:translate-x-(--sx) group-hover:rotate-(--sr)",
                  ink
                    ? "border-background/90"
                    : "border-background opacity-85 grayscale",
                )}
                style={
                  {
                    "--sx": `${off * 30}px`,
                    "--sr": `${off * 3}deg`,
                  } as CSSProperties
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Item({
  children,
  ink,
  limit = false,
}: {
  children: ReactNode;
  /** Rendered inside the ink (inverted) card. */
  ink?: boolean;
  limit?: boolean;
}) {
  return (
    <li className="flex items-start gap-2">
      {limit ? (
        <Minus
          className={cn(
            "mt-0.5 size-4 shrink-0",
            ink ? "text-background/50" : "text-faint",
          )}
          strokeWidth={2}
        />
      ) : (
        <Check
          className="mt-0.5 size-4 shrink-0 text-success"
          strokeWidth={2}
        />
      )}
      <span className={ink ? "text-background/75" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

/**
 * The hairline-divided stat cluster (the Biograph proof cluster). EXPORTED
 * because the Event Pass answers its room in the same instrument (pass-card.tsx):
 * the pass is a different object, not a different grammar, and a second copy of
 * this markup is how the two drift apart one hairline at a time.
 *
 * The labels ride `text-label` (the ladder's uppercase step, 12 on 0.08em).
 * They used to spell `text-[10px] tracking-[0.14em]`, which is the pair the
 * body ladder replaced: a hand-set tracking beats the step through
 * --tw-tracking, silently. (`type-ladder-policy` carried this file as a lane
 * exception while voice-wiring owned it; that entry goes with this change.)
 */
export function StatRow({
  stats,
  ink,
}: {
  stats: { value: string; label: string }[];
  ink?: boolean;
}) {
  return (
    <dl
      className={cn(
        "flex divide-x border-y",
        ink
          ? "divide-background/15 border-background/15"
          : "divide-border border-border",
      )}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex-1 py-3 pr-3 not-first:pl-3 first:pl-0"
        >
          <dt
            className={cn(
              "text-label uppercase",
              ink ? "text-background/50" : "text-faint",
            )}
          >
            {s.label}
          </dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * THE SIZE SLIDER (`size=slider`, Will overruling `rows`, 2026-09-20): "This
 * keeps the monthly/yearly toggle above, which feels more intuitive/natural and
 * makes the slider more interactive, which is both more enjoyable (incentivizes
 * exploration) and reduces the height of the card itself."
 *
 * ★ IT IS A REAL `input[type=range]`, so the keyboard, the screen reader and a
 * finger dragging all work without a line of our own: arrows step, Home and End
 * jump, `aria-valuetext` says the room rather than "1 of 3". The stops ARE
 * `plansForTier("pro")` (tiers.ts, the source the Stripe webhook and the SQL
 * enforcement read), indexed, so a fourth Pro size appears on this slider the
 * day it appears in the table and nobody edits a control.
 *
 * ★ NOTHING GLIDES. Dragging is a high-frequency interaction (the motion rule),
 * so the fill and the price follow the thumb instantly and the one animated
 * thing is the press: the thumb swells 10 percent while it is held, which is
 * the feedback a finger needs when it covers the knob it is moving.
 *
 * ★ THE FILL IS THE TRACK'S OWN GRADIENT, not an overlay: one element keeps
 * the native hit target (the whole 24 px row, not the 6 px rule a phone cannot
 * hit) and leaves the thumb's position to the browser. Firefox paints the same
 * fill through ::-moz-range-progress, which is why the gradient is webkit-only.
 * The two percentage stops are the SAME value, so the fill has a hard edge.
 */
function SizeSlider({
  plans,
  value,
  onPick,
}: {
  plans: Plan[];
  value: PlanId;
  onPick: (id: PlanId) => void;
}) {
  const i = Math.max(
    0,
    plans.findIndex((p) => p.id === value),
  );
  const pct = plans.length > 1 ? (i / (plans.length - 1)) * 100 : 0;

  return (
    <div>
      <input
        type="range"
        min={0}
        max={plans.length - 1}
        step={1}
        value={i}
        onChange={(e) => onPick(plans[Number(e.target.value)].id)}
        aria-label="Pro storage size"
        aria-valuetext={formatBytes(plans[i].storageBytes)}
        style={{ "--fill": `${pct}%` } as CSSProperties}
        className={cn(
          "h-6 w-full cursor-pointer appearance-none rounded-full bg-transparent outline-none",
          "focus-visible:ring-2 focus-visible:ring-background/70",
          // The track, and the fill painted into it.
          "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-background)_var(--fill),color-mix(in_oklch,var(--color-background)_20%,transparent)_var(--fill))]",
          "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-background/20",
          "[&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-background",
          // The thumb, centred on a 6px track inside a 24px row.
          "[&::-webkit-slider-thumb]:-mt-[0.4375rem] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background",
          "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-background",
          "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-emphasis",
          "active:[&::-webkit-slider-thumb]:scale-110 active:[&::-moz-range-thumb]:scale-110",
          "motion-reduce:[&::-webkit-slider-thumb]:transition-none",
        )}
      />
      {/* The stops, named. Not buttons: one control does one job, and a native
          range already moves to wherever the track is pressed. */}
      <div
        aria-hidden
        className="mt-2 flex justify-between text-micro tabular-nums"
      >
        {plans.map((p) => (
          <span
            key={p.id}
            className={
              p.id === value ? "text-background" : "text-background/45"
            }
          >
            {formatBytes(p.storageBytes)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PlanPair() {
  const free = planById("free");
  const proPlans = plansForTier("pro");
  const [proId, setProId] = useState(proPlans[0].id);
  // The billing cadence (annual ruled 2026-08-27: x10 monthly, two months
  // free). Size and cadence are independent axes: the switcher picks the
  // MONTHLY plan, the toggle resolves its annual sibling for price + checkout.
  const [cadence, setCadence] = useState<"month" | "year">("month");
  const pro = planById(proId);
  const proDisplay = cadence === "year" ? (annualPlanFor(proId) ?? pro) : pro;
  const freeCap = friendlyCapacity(free.storageBytes);
  const proCap = friendlyCapacity(pro.storageBytes);

  return (
    <Reveal className="mx-auto max-w-4xl">
      {/* The cadence toggle (the reserved slot, now earned): one control above
          the pair, since it changes only what Pro costs. */}
      <div
        data-mkt-reveal
        style={{ "--i": 0 } as CSSProperties}
        className="mb-8 flex justify-center"
      >
        <div
          role="group"
          aria-label="Billing cadence"
          className="relative grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
        >
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background transition-transform [transition-duration:var(--mkt-tabs-dur)] ease-emphasis motion-reduce:transition-none"
            style={{
              transform: `translateX(calc(${cadence === "year" ? 1 : 0} * (100% + 0.25rem)))`,
            }}
          />
          {(
            [
              { value: "month", label: "Monthly" },
              { value: "year", label: "Yearly, 2 months free" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={cadence === opt.value}
              onClick={() => setCadence(opt.value)}
              className={cn(
                "relative z-10 rounded-md px-4 py-1.5 text-sm font-medium transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/50",
                "active:scale-[0.98] motion-reduce:active:scale-100",
                cadence === opt.value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Free: the paper sheet ─────────────────────────────────────────── */}
        <div
          data-mkt-reveal
          style={{ "--i": 1 } as CSSProperties}
          className="group flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7"
        >
          <PhotoStack />
          <div className="flex flex-col gap-2">
            {/* Both on the ladder by ROLE (2026-09-18): a plan's name is a
                card's title in the marketing register (`subsection`, as every
                tile title here is), and its price is the number the card is
                about, which is the `section` step's "stat numeral". The Pro
                card and the Event Pass wear the same pair. */}
            <h2 className="font-heading text-subsection">{free.name}</h2>
            <p className="text-sm text-pretty text-muted-foreground">
              Your first event, covered.
            </p>
            <div className="mt-3 font-heading text-section tabular-nums">
              <PricePop label={free.priceLabel} />
            </div>
          </div>

          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            <Item>
              {MAX_EVENTS.free} event, every guest, the album and the reel
            </Item>
            <Item>No watermark on photos or the album</Item>
            <Item>Verified-email uploads, on by default</Item>
            <Item limit>Photos only</Item>
            <Item limit>
              {MAX_REEL_SECONDS.free}-second reel with a small mark
            </Item>
          </ul>

          <div className="mt-6">
            <StatRow
              stats={[
                { value: formatBytes(free.storageBytes), label: "Storage" },
                {
                  value: `≈ ${freeCap.photos.toLocaleString()}`,
                  label: "Photos",
                },
              ]}
            />
            <Button asChild className="mt-5 w-full" variant="outline">
              <Link
                href="/login"
                {...trackAttrs("cta_click", {
                  cta: "start-free",
                  location: "pricing-free",
                })}
              >
                Start free
              </Link>
            </Button>
            <p className="mt-3 text-center text-xs text-faint">
              No card. Upgrade only when you host again.
            </p>
          </div>
        </div>

        {/* ── Pro: the same sheet, in ink ───────────────────────────────────── */}
        <div
          data-mkt-reveal
          style={{ "--i": 2 } as CSSProperties}
          className="group relative flex flex-col rounded-2xl bg-foreground p-6 text-background sm:p-7"
        >
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-card px-2.5 py-0.5 text-label font-medium text-foreground uppercase">
            Most popular
          </span>
          <PhotoStack ink />
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-subsection">Pro</h2>
            {/* RULED (Will, 2026-09-19, voice r1 `pro-line=video`). It used to
                read "For hosts who host again.", which describes the buyer
                rather than what they get; his line names the two things Pro
                actually unlocks, video first. The one home is marketing-voice.ts
                (the four sibling statements of the same value share its ORDER,
                never its bytes). */}
            <p className="text-sm text-pretty text-background/75">{PRO_LINE}</p>
            <div className="mt-3 font-heading text-section tabular-nums">
              {/* Keyed remount so a size/cadence change swaps the price instantly
                (high-frequency interaction: no re-pop theater). */}
              <PricePop key={proDisplay.id} label={proDisplay.priceLabel} />
            </div>
          </div>

          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            <Item ink>
              {MAX_EVENTS.pro === null ? "Unlimited events" : "More events"},
              one album each
            </Item>
            <Item ink>
              {videosAllowedForTier("pro") ? "Photos and video" : "Photos"}
            </Item>
            <Item ink>{MAX_REEL_SECONDS.pro}-second reels, no watermark</Item>
            <Item ink>
              {GATED_EVENT_SETTINGS.includes("password")
                ? "Password-locked albums"
                : "Locked albums"}{" "}
              and custom links
            </Item>
            <Item ink>Your public host page at /u/you</Item>
          </ul>

          <div className="mt-6">
            {/* The size, as one slider from the smallest room to the largest
                (his ruling): the price above, the stats below and the button
                under them all follow the thumb. */}
            <SizeSlider plans={proPlans} value={proId} onPick={setProId} />

            <div className="mt-4">
              <StatRow
                ink
                stats={[
                  { value: formatBytes(pro.storageBytes), label: "Storage" },
                  {
                    value: `≈ ${proCap.photos.toLocaleString()}`,
                    label: "Photos",
                  },
                  {
                    value: `${Math.round(proCap.videoMinutes / 60).toLocaleString()} h`,
                    label: "Video",
                  },
                ]}
              />
            </div>

            <CheckoutButton
              planId={proDisplay.id}
              {...trackAttrs("checkout_start", { plan: proDisplay.id })}
              className="mt-5 w-full bg-background text-foreground hover:bg-background/90"
            >
              Get Pro at {proDisplay.priceLabel}
            </CheckoutButton>
            <p className="mt-3 text-center text-xs text-background/60">
              {cadence === "year"
                ? "One payment a year, two months free. Change or cancel any time in the billing portal."
                : "Change size or cancel any time in the billing portal."}
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
