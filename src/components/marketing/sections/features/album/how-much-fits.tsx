import { Check, Minus } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  friendlyCapacity,
  MAX_EVENTS,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { HOW_MUCH_FITS } from "./album-copy";

/**
 * HOW MUCH FITS: the plans as ONE ruled comparison strip, framed as album
 * size, because that is the question a host has ("is there a total cap, and
 * what happens when we hit it?"). Every number DERIVES from tiers.ts (caps,
 * prices, event counts, the friendly photo count) so this page cannot
 * disagree with /pricing; the storage bar makes "amount of album" literal
 * (ink on muted, never amber, never lit); the price sits in the heading face
 * (the pricing ruling: money in Urbanist with tabular figures); and Free's photos-only
 * line takes the honest floor's muted minus. The cap behaviour beneath quotes
 * the guest's real refusal as the toast the app fires.
 */

type Row = { text: string; included: boolean };

function Column({
  name,
  bytes,
  fill,
  price,
  rows,
  index,
}: {
  name: string;
  bytes: number;
  /** The bar's fill, relative to the Pro entry size. */
  fill: number;
  price: string;
  rows: Row[];
  index: number;
}) {
  const photos = friendlyCapacity(bytes).photos;
  return (
    <div
      data-mkt-reveal
      className="flex flex-col gap-5 px-6 py-6 sm:py-7"
      style={{ "--i": 3 + index } as CSSProperties}
    >
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {name}
      </p>
      <div className="flex flex-col gap-2">
        <p className="font-heading text-section tabular-nums">
          {formatBytes(bytes)}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          about {photos.toLocaleString("en-US")} photos
        </p>
        <span
          aria-hidden
          className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <span
            className="block h-full rounded-full bg-foreground"
            style={{ width: `${Math.max(fill * 100, 2.5)}%` }}
          />
        </span>
      </div>
      <p className="border-t pt-4 font-heading text-subsection tabular-nums">
        {price}
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <li
            key={row.text}
            className={
              row.included
                ? "flex items-center gap-2"
                : "flex items-center gap-2 text-muted-foreground"
            }
          >
            {row.included ? (
              <Check
                className="size-3.5 shrink-0 text-success"
                strokeWidth={2.5}
              />
            ) : (
              <Minus
                className="size-3.5 shrink-0 text-faint"
                strokeWidth={2.5}
              />
            )}
            {row.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HowMuchFits() {
  const free = planById("free");
  const pass = planById("event_pass");
  const pro = plansForTier("pro");
  // The bars are relative to the Pro ENTRY size (2% / 75% / 100%), not the 2 TB
  // top tier: against 2 TB every bar reads as empty and the device says nothing.
  const largest = pro[0].storageBytes;
  const proSizes = pro.map((p) => formatBytes(p.storageBytes));

  return (
    <SectionShell
      eyebrow="How much fits"
      heading="Room for the whole event."
      subhead={HOW_MUCH_FITS.subhead}
    >
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <div className="grid divide-y rounded-2xl border bg-card ring-1 ring-foreground/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Column
            name={free.name}
            bytes={free.storageBytes}
            fill={free.storageBytes / largest}
            price={free.priceLabel}
            rows={[
              { text: "Photos only", included: false },
              { text: `${MAX_EVENTS.free} event`, included: true },
              { text: "No end date", included: true },
            ]}
            index={0}
          />
          <Column
            name={pass.name}
            bytes={pass.storageBytes}
            fill={pass.storageBytes / largest}
            price={pass.priceLabel}
            rows={[
              { text: "Photos and video", included: true },
              { text: "1 event per pass", included: true },
              { text: "Covers a year", included: true },
            ]}
            index={1}
          />
          <Column
            name="Pro"
            bytes={pro[0].storageBytes}
            fill={pro[0].storageBytes / largest}
            price={`from ${pro[0].priceLabel}`}
            rows={[
              // ★ VIDEO LEADS, and it already did here (Will, 2026-09-19, voice
              // r1 `pro-line=video`: "Videos and unlimited events is huge").
              // This column is one of five places Pro's value is stated in a
              // breath; the plan card, the home teaser, the FAQ and llms.txt all
              // moved to this order, so keep video above events on any rewrite.
              { text: "Photos and video", included: true },
              { text: "Unlimited events", included: true },
              {
                text: `${proSizes.slice(0, -1).join(", ")}, or ${proSizes[proSizes.length - 1]}`,
                included: true,
              },
            ]}
            index={2}
          />
        </div>
      </Reveal>

      {/* The cap, honestly: the guest's refusal as the toast the app fires,
          beside two one-line facts. */}
      <Reveal className="mx-auto mt-10 grid max-w-5xl items-center gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div
          data-mkt-toast
          data-on="true"
          aria-hidden
          className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-layer"
          style={{ "--i": 0 } as CSSProperties}
        >
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-destructive" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              Couldn&rsquo;t add that photo
            </span>
            <span className="text-sm text-muted-foreground">
              This album is full right now. The host needs to free up space.
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
            <span className="font-medium text-foreground">
              At the cap, uploads pause.{" "}
            </span>
            Nothing already in the album changes.
          </p>
          {HOW_MUCH_FITS.facts.map((fact, i) => (
            <p
              key={fact}
              data-mkt-reveal
              className="text-pretty"
              style={{ "--i": 2 + i } as CSSProperties}
            >
              {fact}
            </p>
          ))}
          <div data-mkt-reveal style={{ "--i": 4 } as CSSProperties}>
            <LearnMoreLink href="/pricing">
              Every plan, side by side
            </LearnMoreLink>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
