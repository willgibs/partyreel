"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { planById, plansForTier } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

/**
 * Touchpoint: PRICING PLAN CARDS (the pricing round, 2026-08-27).
 *
 * The rebuilt /pricing shipped the pair on the restrained default: paper Free,
 * ink Pro, typography only. This page decides the cards' VISUAL IDENTITY LAYER
 * (the Biograph-burst equivalent, ours built from media because media is the
 * color here). Three directions, each rendered as the REAL pair anatomy in
 * miniature so the identity is judged across both registers at once:
 *
 *  V1 MEDIA BURST — a radial fan of event tiles behind the card head. Free
 *     fans sparse and grayscale (the promise: your photos, before the color
 *     arrives); Pro fans dense and vivid on the ink.
 *  V2 STACKED PHOTOS — a physical stack tucked above the head, using the
 *     back-pocket soft-shadow exception (Will's note 3: shadows may return
 *     where photos physically stack for depth). Hover spreads the stack.
 *  V3 QUIET INK — no imagery: concentric hairline rings radiating from the
 *     price, the engraving read of Biograph's rays on our zero-chroma system.
 *
 * All three stay reduced-motion safe (the only motion is a hover spread /
 * nothing). The ruling lands in chat and is recorded on the touchpoint entry.
 */

const BURST_IDS = [
  "wedding-golden",
  "party-balloons",
  "concert-confetti",
  "reception-table",
  "wedding-toast",
  "festival-lights",
  "wedding-petals",
  "party-dj",
  "festival-crowd",
];

function MiniCard({
  ink,
  visual,
  children,
}: {
  ink?: boolean;
  visual: ReactNode;
  children?: ReactNode;
}) {
  const plan = ink ? plansForTier("pro")[0] : planById("free");
  return (
    <div
      className={cn(
        "group relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl p-5",
        ink
          ? "bg-foreground text-background"
          : "border bg-card ring-1 ring-foreground/5",
      )}
    >
      {visual}
      <div className="relative mt-2">
        <h4 className="font-heading text-lg">{ink ? "Pro" : "Free"}</h4>
        <p
          className={cn(
            "text-xs",
            ink ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {ink ? "For hosts who host again." : "Your first event, covered."}
        </p>
        <div className="mt-2 font-mono text-2xl font-medium tracking-tight tabular-nums">
          {ink ? `from ${plan.priceLabel}` : plan.priceLabel}
        </div>
        <div
          className={cn(
            "mt-3 border-t pt-3 text-xs",
            ink
              ? "border-background/15 text-background/60"
              : "text-muted-foreground",
          )}
        >
          {formatBytes(plan.storageBytes)} · the album and the reel
        </div>
        {children}
      </div>
    </div>
  );
}

/* V1 — the media burst: tiles fanned on an arc behind the card head. */
function Burst({ ink }: { ink?: boolean }) {
  const ids = ink ? BURST_IDS : BURST_IDS.slice(0, 4);
  const n = ids.length;
  return (
    <div aria-hidden className="relative h-28">
      <div className="absolute inset-x-0 top-24 flex justify-center">
        {ids.map((id, i) => {
          const m = marketingImage(id);
          const angle = (i - (n - 1) / 2) * (ink ? 16 : 22);
          return (
            <div
              key={id}
              className="absolute origin-bottom"
              style={
                {
                  transform: `rotate(${angle}deg) translateY(-58px)`,
                } as CSSProperties
              }
            >
              <Image
                src={m.src}
                alt=""
                width={44}
                height={44}
                className={cn(
                  "size-11 rounded-[3px] object-cover",
                  ink
                    ? "ring-1 ring-background/20"
                    : "opacity-70 grayscale ring-1 ring-foreground/10",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* V2 — the stacked photos: soft shadows sanctioned for physical depth. */
function Stack({ ink }: { ink?: boolean }) {
  const ids = ink ? BURST_IDS.slice(0, 4) : BURST_IDS.slice(0, 2);
  const spread = ink ? 10 : 7;
  return (
    <div aria-hidden className="relative h-28">
      <div className="absolute inset-x-0 top-3 flex justify-center">
        {ids.map((id, i) => {
          const m = marketingImage(id);
          const angle = (i - (ids.length - 1) / 2) * spread;
          return (
            <div
              key={id}
              className="absolute transition-transform duration-300 ease-emphasis motion-reduce:transition-none"
              style={
                {
                  transform: `rotate(${angle}deg) translateX(${(i - (ids.length - 1) / 2) * 14}px)`,
                  "--spread-x": `${(i - (ids.length - 1) / 2) * 26}px`,
                } as CSSProperties
              }
            >
              <Image
                src={m.src}
                alt=""
                width={80}
                height={80}
                className={cn(
                  "size-20 rounded-md border-4 object-cover shadow-lg transition-transform duration-300 ease-emphasis group-hover:translate-x-(--spread-x) motion-reduce:transition-none",
                  ink
                    ? "border-background/90"
                    : "border-background opacity-80 grayscale",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* V3 — quiet ink: concentric hairlines radiating from behind the price. */
function Rings({ ink }: { ink?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -top-10 -right-10">
      {[56, 96, 136, 176].map((size, i) => (
        <div
          key={size}
          className={cn(
            "absolute rounded-full border",
            ink ? "border-background" : "border-foreground",
          )}
          style={{
            width: size,
            height: size,
            top: -size / 2 + 80,
            right: -size / 2 + 40,
            opacity: 0.14 - i * 0.03,
          }}
        />
      ))}
    </div>
  );
}

function VariantBlock({
  label,
  title,
  note,
  children,
}: {
  label: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
          {label}
        </span>
        <h3 className="font-heading text-lg">{title}</h3>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{note}</p>
      <div className="flex flex-wrap gap-4 rounded-2xl border bg-background p-6">
        {children}
      </div>
    </section>
  );
}

export function PricingPlanCardsVariants() {
  return (
    <div className="space-y-12">
      <VariantBlock
        label="V1"
        title="Media burst"
        note="The Biograph burst rebuilt from event media: Free fans four grayscale tiles (your photos, before the color arrives); Pro fans nine, vivid, on the ink. Static geometry, zero shadows."
      >
        <MiniCard visual={<Burst />} />
        <MiniCard ink visual={<Burst ink />} />
      </VariantBlock>

      <VariantBlock
        label="V2"
        title="Stacked photos"
        note="A physical stack above the head, soft shadows sanctioned for the depth (the back-pocket exception). Hover the card and the stack spreads. The most tactile read, and the only one with shadows."
      >
        <MiniCard visual={<Stack />} />
        <MiniCard ink visual={<Stack ink />} />
      </VariantBlock>

      <VariantBlock
        label="V3"
        title="Quiet ink"
        note="No imagery: concentric hairline rings radiating from the corner, the engraving read of Biograph's rays on the zero-chroma system. The most restrained; the media stays the guest pages' job."
      >
        <MiniCard visual={<Rings />} />
        <MiniCard ink visual={<Rings ink />} />
      </VariantBlock>
    </div>
  );
}
