"use client";

import { TiltCard } from "@/components/marketing/system/tilt-card";

import { type DirectoryCard, REAL_CARDS, SCHOOLS_CARD } from "./fixtures";

/**
 * DECISION 6: HOW MANY. Icon tiles, on purpose, for every card: this decision
 * is the COUNT, and a per-card photograph is THE HERO'S PICTURE's claim, not
 * this one's. `five` adds the one invented type the manifest names (Schools);
 * `three` removes trips, its themes folded into the caption naming exactly
 * where they would need to land.
 */
export type HowManyShape = "four" | "five" | "three";

function cardsFor(shape: HowManyShape): DirectoryCard[] {
  if (shape === "five") return [...REAL_CARDS, SCHOOLS_CARD];
  if (shape === "three") return REAL_CARDS.filter((c) => c.slug !== "trips");
  return REAL_CARDS;
}

function Card({ card, isNew }: { card: DirectoryCard; isNew?: boolean }) {
  const Icon = card.icon;
  return (
    <TiltCard className="rounded-2xl">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
        <div className="flex aspect-[16/10] items-center justify-center bg-muted/40">
          <Icon className="size-9 text-muted-foreground" strokeWidth={1.25} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-6">
          <h3 className="flex items-center gap-2 font-heading text-subsection">
            {card.navLabel}
            {isNew && (
              <span className="rounded-full border border-foreground/30 px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-foreground uppercase">
                new
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">{card.teaser}</p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {card.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export function HowManyPreview({ shape }: { shape: HowManyShape }) {
  const cards = cardsFor(shape);
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.slug} card={card} isNew={shape === "five" && card.slug === "schools"} />
        ))}
      </div>
      {shape === "three" && (
        <p className="mx-auto mt-6 max-w-md text-center text-sm text-muted-foreground">
          Trips&rsquo; own themes (group vacations, family reunions, road trips)
          fold into parties&rsquo; nested themes.
        </p>
      )}
    </div>
  );
}
