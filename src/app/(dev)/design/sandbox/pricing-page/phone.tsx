"use client";

import { useState } from "react";

import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";
import { cn } from "@/lib/utils";

import { type Pair, type PassPlace, PlanBlock, type SizePick } from "./plans";

/**
 * THE PAGE IN A HAND.
 *
 * Every plan card is a column of five bullets, a stat row, a control and a
 * button, and at 375 the page simply puts them one under another: two or three
 * full screens of card before the first section that is not a card. The
 * candidates are the two ways a phone shows several priced things without
 * spending a screen on each.
 *
 * ★ DRAWN IN THE PAIR HE PICKED (the decision is staged behind it), so the
 * swipe is judged on however many cards the row actually has: two under the
 * pair that gives Pro the row, three under today's, four with the pass beside
 * it. That is also why the caption's height is the honest number here: it is
 * the page's own scroll, not a claim about it.
 */

export type Phone = "stack" | "swipe" | "tabs";

function Head({ note }: { note?: string }) {
  return (
    <div className="flex flex-col gap-3 text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Pricing
      </p>
      <h1 className="font-heading text-chapter text-balance">
        {GOLDEN_LINES.pricing}.
      </h1>
      {note ? (
        <p className="text-sm text-pretty text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export function PhonePlans({
  phone,
  pair,
  size,
  pass: place,
}: {
  phone: Phone;
  pair: Pair;
  size: SizePick;
  pass: PassPlace;
}) {
  const [side, setSide] = useState<"once" | "again">("once");

  return (
    <PaperChapter>
      <section className="py-14">
        <Container>
          {phone === "tabs" ? (
            <>
              <Head note="Two ways to pay, and only one of them is a subscription." />
              <div
                role="group"
                aria-label="What you are paying for"
                className="mt-8 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
              >
                {(
                  [
                    { id: "once", label: "One event" },
                    { id: "again", label: "Hosting again" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={side === o.id}
                    onClick={() => setSide(o.id)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none",
                      side === o.id
                        ? "bg-background text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="mt-8">
                <PlanBlock
                  pair={pair}
                  size={size}
                  pass={place}
                  flow="stack"
                  only={side}
                />
              </div>
            </>
          ) : (
            <>
              <Head note="No per-guest fees. Plans are sized by storage." />
              <div className="mt-8">
                <PlanBlock
                  pair={pair}
                  size={size}
                  pass={place}
                  flow={phone === "swipe" ? "swipe" : "stack"}
                />
              </div>
            </>
          )}
        </Container>
      </section>
    </PaperChapter>
  );
}
