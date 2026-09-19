"use client";

import { Check, Minus } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, Fragment, type ReactNode, useState } from "react";

import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { marketingImage } from "@/lib/constants/marketing-media";
import {
  annualPlanFor,
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  friendlyCapacity,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  planById,
  type Plan,
  type PlanId,
  plansForTier,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import { BuyButton } from "./scene";

/**
 * THE PLANS, AS ONE SYSTEM WITH THREE KNOBS.
 *
 * Three decisions on this board ask about the same block of the page (how Free
 * and Pro stand, how Pro's size and cadence are chosen, and where the Event
 * Pass stands), so they are ONE component with three axes rather than nine
 * hand-drawn layouts. That is what makes them three questions instead of three
 * boards: the pass is judged inside the pair he picked, and the size control is
 * judged on the card it will actually live on.
 *
 * ★ EVERY NUMBER AND NAME IS READ FROM `tiers.ts`. Not one price, cap, event
 * count, reel length or plan name is typed here: `PLANS` is the single source
 * the Stripe webhook and the SQL enforcement read, and a board that retyped
 * "$9" could show Will a price the product does not charge. The annual sibling
 * comes from `annualPlanFor`, which is pinned to exactly ten months by
 * `tiers.test.ts`.
 *
 * ★ IT IS A COPY OF THE SHIPPED CARDS, ON PURPOSE, and the copy buys two
 * things the real ones cannot give: the buy control is dead (`BuyButton`, so no
 * preview can open a Checkout or a Billing Portal session), and the size
 * control is a prop rather than a hardcoded segmented switch. The classes,
 * the ink inversion, the A16 check/minus grammar and the ruled photo stack are
 * production's, verbatim, so what is judged is today's card with one axis
 * moved.
 */

export type Pair = "two" | "pro" | "even";
export type SizePick = "selector" | "rows" | "slider";
export type PassPlace = "under" | "beside" | "first";
export type Cadence = "month" | "year";

/* ── The ruled photo stack (V2, 2026-08-27) ──────────────────────────────── */

const STACK = {
  free: ["wedding-golden", "reception-table"],
  pro: ["wedding-golden", "party-balloons", "concert-confetti", "wedding-toast"],
  // The pass has no stack today because it is a wide ticket under the pair.
  // Standing in the row it needs one or it reads as the row's afterthought;
  // three vivid prints on paper sit between Free's two grey and Pro's four.
  pass: ["wedding-rings", "reception-hall", "festival-lights"],
} as const;

function PhotoStack({
  ids,
  ink = false,
  grey = false,
}: {
  ids: readonly string[];
  ink?: boolean;
  grey?: boolean;
}) {
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
                  "size-20 rounded-md border-4 object-cover shadow-lift",
                  "transition-transform duration-300 ease-emphasis motion-reduce:transition-none",
                  "group-hover:translate-x-(--sx) group-hover:rotate-(--sr)",
                  ink
                    ? "border-background/90"
                    : grey
                      ? "border-background opacity-85 grayscale"
                      : "border-background",
                )}
                style={
                  { "--sx": `${off * 30}px`, "--sr": `${off * 3}deg` } as CSSProperties
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── The card furniture (production's, verbatim) ─────────────────────────── */

function Item({
  children,
  ink,
  limit = false,
}: {
  children: ReactNode;
  ink?: boolean;
  limit?: boolean;
}) {
  return (
    <li className="flex items-start gap-2">
      {limit ? (
        <Minus
          className={cn("mt-0.5 size-4 shrink-0", ink ? "text-background/50" : "text-faint")}
          strokeWidth={2}
        />
      ) : (
        <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
      )}
      <span className={ink ? "text-background/75" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

function StatRow({
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
        ink ? "divide-background/15 border-background/15" : "divide-border border-border",
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="flex-1 py-3 pr-3 not-first:pl-3 first:pl-0">
          <dt
            className={cn(
              "text-[10px] tracking-[0.14em] uppercase",
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

/** The card's price, in the display face, and the hook the caption measures. */
function Price({ label }: { label: string }) {
  return (
    <div data-pp-price className="mt-3 font-heading text-section tabular-nums">
      <PricePop label={label} />
    </div>
  );
}

function Badge({ children, ink }: { children: string; ink?: boolean }) {
  return (
    <span
      className={cn(
        "absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] uppercase",
        ink ? "border bg-card text-foreground" : "bg-foreground text-background",
      )}
    >
      {children}
    </span>
  );
}

/* ── The two segmented switches ──────────────────────────────────────────── */

function Segmented({
  label,
  value,
  options,
  onPick,
  ink = false,
  cols,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onPick: (id: string) => void;
  ink?: boolean;
  cols: number;
}) {
  const i = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "relative grid gap-1 rounded-lg p-1 select-none",
        ink ? "bg-background/10" : "bg-muted",
      )}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 rounded-md transition-transform [transition-duration:var(--mkt-tabs-dur)] ease-emphasis motion-reduce:transition-none",
          ink ? "bg-background/20" : "bg-background",
        )}
        style={{
          width: `calc((100% - ${0.25 * (cols + 1)}rem) / ${cols})`,
          transform: `translateX(calc(${i} * (100% + 0.25rem)))`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onPick(o.id)}
          className={cn(
            "relative z-10 rounded-md px-2 py-1.5 text-center text-sm font-medium tabular-nums transition-colors outline-none",
            "active:scale-[0.98] motion-reduce:active:scale-100",
            ink
              ? value === o.id
                ? "text-background focus-visible:ring-2 focus-visible:ring-background/60"
                : "text-background/55 hover:text-background/80"
              : value === o.id
                ? "text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Today's cadence control: one switch above the whole block. */
export function CadenceToggle({
  cadence,
  onPick,
}: {
  cadence: Cadence;
  onPick: (c: Cadence) => void;
}) {
  return (
    <div className="mb-8 flex justify-center">
      <Segmented
        label="Billing cadence"
        cols={2}
        value={cadence}
        onPick={(id) => onPick(id as Cadence)}
        options={[
          { id: "month", label: "Monthly" },
          { id: "year", label: "Yearly, 2 months free" },
        ]}
      />
    </div>
  );
}

/* ── The three size controls ─────────────────────────────────────────────── */

const PRO = plansForTier("pro");

function priceFor(plan: Plan, cadence: Cadence): Plan {
  return cadence === "year" ? (annualPlanFor(plan.id) ?? plan) : plan;
}

function SizeControl({
  pick,
  proId,
  cadence,
  setProId,
  ink,
}: {
  pick: SizePick;
  proId: PlanId;
  cadence: Cadence;
  setProId: (id: PlanId) => void;
  ink: boolean;
}) {
  if (pick === "selector") {
    return (
      <Segmented
        label="Pro storage size"
        cols={3}
        ink={ink}
        value={proId}
        onPick={(id) => setProId(id as PlanId)}
        options={PRO.map((p) => ({ id: p.id, label: formatBytes(p.storageBytes) }))}
      />
    );
  }

  if (pick === "slider") {
    const i = Math.max(0, PRO.findIndex((p) => p.id === proId));
    return (
      <div>
        <input
          type="range"
          min={0}
          max={PRO.length - 1}
          step={1}
          value={i}
          onChange={(e) => setProId(PRO[Number(e.target.value)].id)}
          aria-label="Pro storage size"
          aria-valuetext={formatBytes(PRO[i].storageBytes)}
          className={cn(
            "h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none",
            "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-emphasis [&::-webkit-slider-thumb]:active:scale-110",
            "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0",
            ink
              ? "bg-background/20 [&::-moz-range-thumb]:bg-background [&::-webkit-slider-thumb]:bg-background"
              : "bg-border [&::-moz-range-thumb]:bg-foreground [&::-webkit-slider-thumb]:bg-foreground",
          )}
        />
        <div
          className={cn(
            "mt-2 flex justify-between text-[10px] tracking-[0.1em] uppercase tabular-nums",
            ink ? "text-background/50" : "text-faint",
          )}
        >
          {PRO.map((p) => (
            <span key={p.id}>{formatBytes(p.storageBytes)}</span>
          ))}
        </div>
      </div>
    );
  }

  // "rows": all three prices on screen at once, which is the one thing a
  // segmented control cannot do.
  return (
    <div className={cn("divide-y rounded-lg border", ink ? "divide-background/15 border-background/20" : "")}>
      {PRO.map((p) => {
        const shown = priceFor(p, cadence);
        const on = p.id === proId;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            onClick={() => setProId(p.id)}
            className={cn(
              "flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left transition-colors outline-none first:rounded-t-lg last:rounded-b-lg",
              ink
                ? on
                  ? "bg-background/15 text-background"
                  : "text-background/60 hover:bg-background/8"
                : on
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            <span className="text-sm font-medium tabular-nums">
              {formatBytes(p.storageBytes)}
            </span>
            <span className={cn("text-xs tabular-nums", ink ? "text-background/50" : "text-faint")}>
              ≈ {friendlyCapacity(p.storageBytes).photos.toLocaleString()} photos
            </span>
            <span className="ml-auto text-sm font-semibold tabular-nums">
              {shown.priceLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The cadence, where the "rows" control carries it: beside the money it moves. */
function CadenceInline({
  cadence,
  setCadence,
  ink,
}: {
  cadence: Cadence;
  setCadence: (c: Cadence) => void;
  ink: boolean;
}) {
  return (
    <div className="flex gap-1 text-xs">
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
          onClick={() => setCadence(o.id)}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition-colors outline-none",
            ink
              ? cadence === o.id
                ? "bg-background/20 text-background"
                : "text-background/55 hover:text-background/80"
              : cadence === o.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── The cards ───────────────────────────────────────────────────────────── */

const free = planById("free");
const pass = planById("event_pass");

function FreeCard() {
  const cap = friendlyCapacity(free.storageBytes);
  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
      <PhotoStack ids={STACK.free} grey />
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-subsection">{free.name}</h2>
        <p className="text-sm text-pretty text-muted-foreground">
          Your first event, covered.
        </p>
        <Price label={free.priceLabel} />
      </div>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        <Item>{MAX_EVENTS.free} event, every guest, the album and the reel</Item>
        <Item>No watermark on photos or the album</Item>
        <Item>Verified-email uploads, on by default</Item>
        <Item limit>Photos only</Item>
        <Item limit>{MAX_REEL_SECONDS.free}-second reel with a small mark</Item>
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
        <p className="mt-3 text-center text-xs text-faint">
          No card. Upgrade only when you host again.
        </p>
      </div>
    </div>
  );
}

/** Free as one honest line, for the pair that gives Pro the whole row. */
function FreeLine() {
  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-xl border border-dashed px-5 py-4 text-sm sm:flex-row">
      <p className="text-pretty text-muted-foreground">
        <span className="font-medium text-foreground">{free.name}, {free.priceLabel}.</span>{" "}
        One event, {formatBytes(free.storageBytes)}, photos only, no card. Upgrade
        when you host again.
      </p>
      <BuyButton variant="outline" size="sm" className="shrink-0">
        Start free
      </BuyButton>
    </div>
  );
}

function ProCard({
  ink,
  wide,
  badge,
  size,
  proId,
  cadence,
  setProId,
  setCadence,
}: {
  ink: boolean;
  wide: boolean;
  badge: boolean;
  size: SizePick;
  proId: PlanId;
  cadence: Cadence;
  setProId: (id: PlanId) => void;
  setCadence: (c: Cadence) => void;
}) {
  const plan = planById(proId);
  const shown = priceFor(plan, cadence);
  const cap = friendlyCapacity(plan.storageBytes);

  const head = (
    <>
      <PhotoStack ids={STACK.pro} ink={ink} />
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-subsection">Pro</h2>
        <p className={cn("text-sm text-pretty", ink ? "text-background/75" : "text-muted-foreground")}>
          For hosts who host again.
        </p>
        <Price label={shown.priceLabel} />
        {size === "rows" ? (
          <div className="mt-2">
            <CadenceInline cadence={cadence} setCadence={setCadence} ink={ink} />
          </div>
        ) : null}
      </div>
    </>
  );

  const bullets = (
    <ul className={cn("space-y-2.5 text-sm", wide ? "" : "mt-6 flex-1")}>
      <Item ink={ink}>
        {MAX_EVENTS.pro === null ? "Unlimited events" : "More events"}, one album each
      </Item>
      <Item ink={ink}>Photos and video</Item>
      <Item ink={ink}>{MAX_REEL_SECONDS.pro}-second reels, no watermark</Item>
      <Item ink={ink}>Password-locked albums and custom links</Item>
      <Item ink={ink}>Your public host page at /u/you</Item>
    </ul>
  );

  const foot = (
    <div className={wide ? "" : "mt-6"}>
      <SizeControl
        pick={size}
        proId={proId}
        cadence={cadence}
        setProId={setProId}
        ink={ink}
      />
      <div className="mt-4">
        <StatRow
          ink={ink}
          stats={[
            { value: formatBytes(plan.storageBytes), label: "Storage" },
            { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
            {
              value: `${Math.round(cap.videoMinutes / 60).toLocaleString()} h`,
              label: "Video",
            },
          ]}
        />
      </div>
      <BuyButton
        className={cn("mt-5 w-full", ink && "bg-background text-foreground hover:bg-background/90")}
      >
        Get Pro at {shown.priceLabel}
      </BuyButton>
      <p className={cn("mt-3 text-center text-xs", ink ? "text-background/60" : "text-faint")}>
        {cadence === "year"
          ? "One payment a year, two months free. Change or cancel any time."
          : "Change size or cancel any time in the billing portal."}
      </p>
    </div>
  );

  const skin = ink
    ? "bg-foreground text-background"
    : "border bg-card ring-1 ring-foreground/5";

  if (!wide) {
    return (
      <div className={cn("group relative flex flex-col rounded-2xl p-6 sm:p-7", skin)}>
        {badge ? <Badge ink={ink}>Most popular</Badge> : null}
        {head}
        {bullets}
        {foot}
      </div>
    );
  }

  // Pro alone across the row: the ticket's own two-half geometry rather than a
  // column stretched to 4xl, which leaves a card of white space beside a list.
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-6 rounded-2xl p-6 sm:p-7 lg:flex-row lg:items-stretch lg:gap-0",
        skin,
      )}
    >
      {badge ? <Badge ink={ink}>Most popular</Badge> : null}
      <div className="flex flex-col lg:w-[42%] lg:pr-7">
        {head}
        <div className="mt-auto pt-6">{foot}</div>
      </div>
      <div className={cn("hidden lg:block", ink ? "border-l border-background/15" : "border-l")} aria-hidden />
      <div className={cn("lg:hidden", ink ? "border-t border-background/15" : "border-t")} aria-hidden />
      <div className="flex flex-1 flex-col gap-4 lg:pt-2 lg:pl-7">{bullets}</div>
    </div>
  );
}

/** The pass as a column in the row: the same card grammar as Free and Pro. */
function PassColumn() {
  const cap = friendlyCapacity(pass.storageBytes);
  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
      <PhotoStack ids={STACK.pass} />
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-subsection">{pass.name}</h2>
        <p className="text-sm text-pretty text-muted-foreground">
          One big event, paid once.
        </p>
        <Price label={pass.priceLabel} />
      </div>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        <Item>1 event, about a year, {EVENT_PASS_RENEWAL_PRICE_LABEL} a year to keep it</Item>
        <Item>Photos and video, like Pro</Item>
        <Item>{MAX_REEL_SECONDS.event_pass}-second reels, no watermark</Item>
        <Item>Password lock, custom link, your host page</Item>
        <Item>Passes stack, and unused time converts to Pro credit</Item>
      </ul>
      <div className="mt-6">
        <StatRow
          stats={[
            { value: formatBytes(pass.storageBytes), label: "Storage" },
            { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
            {
              value: `${Math.round(cap.videoMinutes / 60).toLocaleString()} h`,
              label: "Video",
            },
          ]}
        />
        <BuyButton className="mt-5 w-full" variant="outline">
          Buy a pass
        </BuyButton>
        <p className="mt-3 text-center text-xs text-faint">
          No subscription. Renew for {EVENT_PASS_RENEWAL_PRICE_LABEL} or let it lapse.
        </p>
      </div>
    </div>
  );
}

/** Today's wide ticket, with the dashed stub rule. */
function PassTicket({ badge = false }: { badge?: boolean }) {
  const cap = friendlyCapacity(pass.storageBytes);
  return (
    <div className="relative flex flex-col gap-6 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7 lg:flex-row lg:items-stretch lg:gap-0">
      {badge ? <Badge>Most hosts start here</Badge> : null}
      <div className="flex flex-col gap-2 lg:w-[38%] lg:pr-7">
        <h2 className="font-heading text-subsection">{pass.name}</h2>
        <p className="text-sm text-pretty text-muted-foreground">
          One big event, paid once.
        </p>
        <Price label={pass.priceLabel} />
        <p className="text-xs text-faint">
          Covers its event for about a year. Keep it live longer for{" "}
          {EVENT_PASS_RENEWAL_PRICE_LABEL} a year.
        </p>
        <div className="mt-auto pt-5">
          <BuyButton variant="outline" className="w-full lg:w-auto lg:px-8">
            Buy a pass
          </BuyButton>
        </div>
      </div>
      <div className="hidden border-l border-dashed lg:block" aria-hidden />
      <div className="border-t border-dashed lg:hidden" aria-hidden />
      <div className="flex flex-1 flex-col gap-4 lg:pl-7">
        <ul className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
          <PassPoint>
            {formatBytes(pass.storageBytes)} of storage: about{" "}
            {cap.photos.toLocaleString()} photos or {Math.round(cap.videoMinutes / 60)}{" "}
            hours of video
          </PassPoint>
          <PassPoint>Photos and video, like Pro</PassPoint>
          <PassPoint>
            {MAX_REEL_SECONDS.event_pass}-second reels, no watermark
          </PassPoint>
          <PassPoint>Password lock, custom link, your host page</PassPoint>
          <PassPoint>
            Passes stack: each one adds an event and {formatBytes(pass.storageBytes)}
          </PassPoint>
          <PassPoint>
            Go Pro later and unused pass time converts to credit, prorated to the day
          </PassPoint>
        </ul>
      </div>
    </div>
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

/* ── The block ───────────────────────────────────────────────────────────── */

/** Written out so Tailwind sees every class it has to compile. */
const COLS: Record<number, string> = {
  1: "",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * The plans, under the three axes. `phone` collapses every row to one column,
 * which is what the page does at 375 today and what the phone decision then
 * asks a real question about.
 */
export function PlanBlock({
  pair,
  size,
  pass: place,
  flow = "grid",
  only,
}: {
  pair: Pair;
  size: SizePick;
  pass: PassPlace;
  /** "stack" is what 375 does today; "swipe" is the phone decision's candidate. */
  flow?: "grid" | "stack" | "swipe";
  /** The fork opening shows one side of the page's real question at a time. */
  only?: "once" | "again";
}) {
  const [proId, setProId] = useState<PlanId>(PRO[0].id);
  const [cadence, setCadence] = useState<Cadence>("month");

  const phone = flow !== "grid";
  const ink = pair !== "even";
  const wide =
    !phone && (only === "again" || (pair === "pro" && place !== "beside" && !only));
  // The badge belongs to whatever the page is pointing at, and the pass placed
  // first IS the page pointing at it.
  const proBadge = place !== "first";

  const pro = (
    <ProCard
      key="pro"
      ink={ink}
      wide={wide}
      badge={proBadge}
      size={size}
      proId={proId}
      cadence={cadence}
      setProId={setProId}
      setCadence={setCadence}
    />
  );

  const columns: { id: string; node: ReactNode }[] = [];
  if (only === "once") {
    columns.push(
      { id: "free", node: <FreeCard /> },
      { id: "pass", node: <PassColumn /> },
    );
  } else if (only === "again") {
    columns.push({ id: "pro", node: pro });
  } else {
    if (pair !== "pro") columns.push({ id: "free", node: <FreeCard /> });
    if (place === "beside") columns.push({ id: "pass", node: <PassColumn /> });
    columns.push({ id: "pro", node: pro });
  }

  // ★ THE COLUMN COUNT IS A BREAKPOINT, NEVER AN INLINE STYLE. This block first
  // shipped with `style={{ gridTemplateColumns: repeat(n, 1fr) }}`, which a
  // media query cannot reach: the 375 frame drew two cards side by side in a
  // phone, and the caption measured that lie as 1,410 px. Production's own pair
  // is `grid gap-5 lg:grid-cols-2` for exactly this reason. Caught by reading
  // the first captures against their captions.
  const cols = phone ? "" : (COLS[columns.length] ?? "");
  // Production clamps the pair at 4xl; a third or fourth card needs the wider
  // room or the cards fall under 300 px and the bullet lists wrap to three
  // lines each.
  const room = columns.length >= 3 ? "max-w-6xl" : "max-w-4xl";

  return (
    <div className={cn("mx-auto", room)}>
      {/* Today's cadence switch sits above the block; the "rows" control carries
          it inside the card instead, so the page never shows two of them. */}
      {size !== "rows" && only !== "once" ? (
        <CadenceToggle cadence={cadence} onPick={setCadence} />
      ) : null}

      {place === "first" && !only ? (
        <div className="mb-5">
          <PassTicket badge />
        </div>
      ) : null}

      {flow === "swipe" ? (
        // One card at a time, the rest peeking: the phone's own way of showing
        // three plans without three screens of scroll. `-mx-4 px-4` lets the
        // row run to both bezels while the cards keep the page's gutter.
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex w-[86%] shrink-0 snap-center *:w-full"
            >
              {col.node}
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("grid gap-5", cols)}>
          {columns.map((col) => (
            <Fragment key={col.id}>{col.node}</Fragment>
          ))}
        </div>
      )}

      {pair === "pro" && !only ? <FreeLine /> : null}

      {place === "under" && !only ? (
        <div className="mt-5">
          <PassTicket />
        </div>
      ) : null}
    </div>
  );
}
