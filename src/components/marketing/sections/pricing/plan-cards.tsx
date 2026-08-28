"use client";

import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { Reveal } from "@/components/marketing/system/reveal";
import { Button } from "@/components/ui/button";
import {
  friendlyCapacity,
  GATED_EVENT_SETTINGS,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  planById,
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
 * Every number renders from tiers.ts. The A16 rule holds on both surfaces:
 * green check = you get this; muted minus = a cap, not an inclusion.
 */

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
            ink ? "text-background/50" : "text-muted-foreground/60",
          )}
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

/** The hairline-divided stat pair (the Biograph proof cluster, mono numerals). */
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
        ink
          ? "divide-background/15 border-background/15"
          : "divide-border border-border",
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="flex-1 py-3 pr-3 first:pl-0 not-first:pl-3">
          <dt
            className={cn(
              "text-[10px] tracking-[0.14em] uppercase",
              ink ? "text-background/50" : "text-muted-foreground/70",
            )}
          >
            {s.label}
          </dt>
          <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PlanPair() {
  const free = planById("free");
  const proPlans = plansForTier("pro");
  const [proId, setProId] = useState(proPlans[0].id);
  const pro = planById(proId);
  const freeCap = friendlyCapacity(free.storageBytes);
  const proCap = friendlyCapacity(pro.storageBytes);

  return (
    <Reveal className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
      {/* ── Free: the paper sheet ─────────────────────────────────────────── */}
      <div
        data-mkt-reveal
        style={{ "--i": 0 } as CSSProperties}
        className="flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7"
      >
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl">{free.name}</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            Your first event, covered.
          </p>
          <div className="mt-3 font-mono text-4xl font-medium tracking-tight tabular-nums">
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
          <Item limit>{MAX_REEL_SECONDS.free}-second reel with a small mark</Item>
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
            <Link href="/login">Start free</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground/70">
            No card. Upgrade only when you host again.
          </p>
        </div>
      </div>

      {/* ── Pro: the same sheet, in ink ───────────────────────────────────── */}
      <div
        data-mkt-reveal
        style={{ "--i": 1 } as CSSProperties}
        className="relative flex flex-col rounded-2xl bg-foreground p-6 text-background sm:p-7"
      >
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-foreground uppercase">
          Most popular
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl">Pro</h2>
          <p className="text-sm text-pretty text-background/75">
            For hosts who host again.
          </p>
          <div className="mt-3 font-mono text-4xl font-medium tracking-tight tabular-nums">
            {/* Keyed remount so a size change swaps the price instantly
                (high-frequency interaction: no re-pop theater). */}
            <PricePop key={pro.id} label={pro.priceLabel} />
          </div>
        </div>

        <ul className="mt-6 flex-1 space-y-2.5 text-sm">
          <Item ink>
            {MAX_EVENTS.pro === null ? "Unlimited events" : "More events"}, one
            album each
          </Item>
          <Item ink>
            {videosAllowedForTier("pro") ? "Photos and video" : "Photos"}
          </Item>
          <Item ink>
            {MAX_REEL_SECONDS.pro}-second reels, no watermark
          </Item>
          <Item ink>
            {GATED_EVENT_SETTINGS.includes("password")
              ? "Password-locked albums"
              : "Locked albums"}{" "}
            and custom links
          </Item>
          <Item ink>Your public host page at /u/you</Item>
        </ul>

        <div className="mt-6">
          {/* The size selector: a segmented control, not three CTAs. The track
              rides the inverted surface (background at low alpha). */}
          <div
            role="group"
            aria-label="Pro storage size"
            className="relative grid grid-cols-3 gap-1 rounded-lg bg-background/10 p-1 select-none"
          >
            <span
              aria-hidden
              className="absolute inset-y-1 left-1 w-[calc((100%-1rem)/3)] rounded-md bg-background/20 transition-transform ease-emphasis [transition-duration:var(--mkt-tabs-dur)] motion-reduce:transition-none"
              style={{
                transform: `translateX(calc(${proPlans.findIndex((p) => p.id === proId)} * (100% + 0.25rem)))`,
              }}
            />
            {proPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={proId === p.id}
                onClick={() => setProId(p.id)}
                className={cn(
                  "relative z-10 rounded-md px-2 py-1.5 text-center font-mono text-sm font-medium tabular-nums transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-background/60",
                  "active:scale-[0.98] motion-reduce:active:scale-100",
                  proId === p.id
                    ? "text-background"
                    : "text-background/55 hover:text-background/80",
                )}
              >
                {formatBytes(p.storageBytes)}
              </button>
            ))}
          </div>

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
            planId={pro.id}
            className="mt-5 w-full bg-background text-foreground hover:bg-background/90"
          >
            Get Pro at {pro.priceLabel}
          </CheckoutButton>
          <p className="mt-3 text-center text-xs text-background/60">
            Change size or cancel any time in the billing portal.
          </p>
        </div>
      </div>
    </Reveal>
  );
}
