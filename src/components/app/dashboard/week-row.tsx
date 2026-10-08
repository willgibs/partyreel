"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { ActDoor } from "@/components/app/dashboard/act-door";
import { Mark, StateDot } from "@/components/app/dashboard/marks";
import { PhotoImg } from "@/components/app/photo-img";
import type { WeekCard } from "@/lib/dashboard/home-view";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { cn } from "@/lib/utils";

/**
 * THIS WEEK (host-dashboard r1, `needs=week`, Will 2026-10-02: "This stacks amazingly with the featured
 * event. Loving the new UI over our previous simple gallery cards, which felt generic and bland."). Every
 * party within seven days of its date, either way, nearest first, each with its one step or, asking
 * nothing, its quiet state: Ready for guests before, the album's count after, because "ready" is the
 * answer a planner looks for on a Friday. The stage's own event is left out (it is on the stage), and
 * a queue on a party further off waits in the bell and on its tile's mark, so forty events never stack
 * forty steps.
 *
 * At a desk the parties stand as cards; in a hand, as one list. One markup for both: the list's row
 * becomes a card from `md`, so a party is one link, one face and one act at every width.
 *
 * ★ THE TALLY COUNTS THE STAGE'S OWN EVENT (crumbs-87, from the gap audit): the stage's party is one of the week's
 * (the week is every party within seven days of its date, and the stage's only leaves the cards because it stands above
 * them), so "Nothing needs you" under a stage whose live event reads 105 to review was a line the page contradicted. The
 * tally reads the week's whole set; the cards stay the other parties. And a stage that is not the week's (a far party,
 * an undated album busy today) that still needs her takes the zero's "else", since the page above says what does.
 */

/** The stage's own event as the tally reads it: one of the week's parties, and whether it asks anything of her. */
export type StageTally = { inWeek: boolean; needsYou: boolean };

/** What the week says it asks of her: the parties that ask, of the week's own, the stage's included where it is one. */
export function weekTally(
  cards: readonly WeekCard[],
  stage: StageTally | null,
): string {
  const stageIn = stage?.inWeek === true;
  const parties = cards.length + (stageIn ? 1 : 0);
  const needing =
    cards.filter((c) => c.item).length + (stageIn && stage.needsYou ? 1 : 0);
  if (needing === 0) {
    return stage?.needsYou ? "Nothing else needs you" : "Nothing needs you";
  }
  return `${formatCount(needing)} of ${formatCount(parties)} ${needing === 1 ? "needs" : "need"} you`;
}

function Face({ card }: { card: WeekCard }) {
  if (card.coverUrl)
    return (
      <PhotoImg
        src={card.coverUrl}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    );
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center bg-muted leading-none text-foreground">
      {card.face ? (
        <>
          <span className="text-micro text-muted-foreground uppercase md:text-label">
            <span className="hidden md:inline">{`${card.face.weekday} · `}</span>
            {card.face.month}
          </span>
          <span className="mt-0.5 font-heading text-card-title tabular-nums md:mt-1.5 md:text-section">
            {card.face.day}
          </span>
        </>
      ) : null}
    </span>
  );
}

export function WeekRow({
  cards,
  stage = null,
}: {
  cards: readonly WeekCard[];
  /** The stage's own event, which the tally counts; null where there is no stage. */
  stage?: StageTally | null;
}) {
  if (cards.length === 0) return null;
  return (
    <section
      data-week={cards.length}
      aria-labelledby="this-week"
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="this-week"
          className="text-label text-muted-foreground uppercase"
        >
          This week
        </h2>
        <p className="text-xs text-muted-foreground">
          {weekTally(cards, stage)}
        </p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border md:grid md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-x-4 md:gap-y-6 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0">
        {cards.map((card) => {
          const item = card.item;
          return (
            <li
              key={card.id}
              data-week-card={item?.kind ?? "quiet"}
              className="flex items-center gap-3 p-3 md:block md:p-0"
            >
              <Link
                href={card.href}
                tabIndex={-1}
                aria-hidden
                data-lit={card.coverUrl ? "" : undefined}
                className="relative block size-12 shrink-0 overflow-hidden rounded-md md:aspect-[16/10] md:size-auto md:rounded-lg"
              >
                <Face card={card} />
                {card.live && (
                  <span className="absolute top-2 left-2 hidden md:block">
                    <Mark tone="live" on={card.coverUrl ? "photo" : "page"}>
                      Live
                    </Mark>
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1 md:mt-3">
                <p className="hidden text-xs text-muted-foreground md:block">
                  <RangeText text={card.when} />
                </p>
                <h3 className="truncate font-heading text-card-title md:mt-0.5">
                  <Link
                    href={card.href}
                    className="focus-halo outline-none hover:underline hover:underline-offset-4"
                  >
                    {card.name}
                  </Link>
                </h3>
                <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground md:hidden">
                  <RangeText
                    text={`${card.when} · ${item ? item.line : card.quiet}`}
                  />
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 md:mt-2.5 md:min-h-8 md:justify-between">
                <span
                  className={cn(
                    "hidden min-w-0 items-center gap-2 text-sm md:flex",
                    !item && "text-muted-foreground",
                  )}
                >
                  {item ? (
                    <StateDot
                      tone={item.tone}
                      className={
                        item.tone === "setup" ? "text-muted-foreground" : ""
                      }
                    />
                  ) : (
                    <Check
                      className="size-3.5 shrink-0 text-success"
                      aria-hidden
                    />
                  )}
                  <span className="truncate">
                    {item ? item.line : card.quiet}
                  </span>
                </span>
                {item ? (
                  <ActDoor
                    eventId={card.id}
                    eventName={card.name}
                    share={card.share}
                    label={item.act}
                    to={item.to}
                    location="dashboard-week"
                    size="xs"
                    variant={item.tone === "waiting" ? "default" : "outline"}
                  />
                ) : (
                  <Check
                    className="size-4 text-success md:hidden"
                    aria-label={card.quiet}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
