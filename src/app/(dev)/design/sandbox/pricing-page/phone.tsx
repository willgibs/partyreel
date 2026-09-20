"use client";

import { useState } from "react";

import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { GOLDEN_LINES } from "@/lib/constants/marketing-voice";
import { cn } from "@/lib/utils";

import {
  type Cadence,
  CadenceToggle,
  FreeCard,
  PassCardGiven,
  PassTicketGiven,
  PlanPairGiven,
  ProCard,
} from "./plans";

/**
 * THE PAGE IN A HAND, ROUND TWO: its demo repaired first (the manifest's own
 * order). The board's `phone` step reads BLANK once its round-one ask is
 * fully ruled: the desk's queue (`queue.ts`, `boardWork` → `r.open`) only ever
 * builds a walkable step for an ask with NO answer on the ledger yet, so a
 * closed round's step is unreachable by a direct `?session=` link even though
 * `lab:demo`'s own comment promises otherwise ("`--only` may name a step the
 * desk no longer lists... a layout can be measured on any step the board
 * still declares"). That plumbing is the desk's (`src/components/lab/step.tsx`,
 * `_desk/queue.ts`), outside this lane's `owns`, and is left as a finding
 * rather than patched here. What this round DOES own is making `phone` a
 * genuinely open ask again (round 2 re-asks it fresh, so the ledger carries no
 * round-2 answer yet and the step walks) and making sure the option it
 * actually draws is solid: verified structurally (a real
 * `overflow-x-auto`/`snap-x` row with `scrollWidth > clientWidth`, confirmed
 * against the live sandbox) and now proven end to end with `lab:demo` pressing
 * the reopened step, never again taken on faith.
 *
 * ★ DRAWN ON THE SETTLED PAIR. Round one's `pair`, `size` and `pass` are
 * shipped, so there is nothing left to stage this behind: every option here
 * is the real Free/Pro pair and the real Event Pass, at 375, the only
 * question being how the three of them travel in a hand.
 */

export type Phone = "stack" | "swipe" | "tabs";

function Head({ note }: { note?: string }) {
  return (
    <div className="flex flex-col gap-3 text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Pricing</p>
      <h1 className="font-heading text-chapter text-balance">{GOLDEN_LINES.pricing}.</h1>
      {note ? <p className="text-sm text-pretty text-muted-foreground">{note}</p> : null}
    </div>
  );
}

/** Free, Pro and the Pass as three peers in one snapping row: the phone's own
 *  way to show three plans without three screens of scroll. `-mx-4 px-4` lets
 *  the row run to both bezels while the cards keep the page's gutter. */
function SwipeRow({ cadence }: { cadence: Cadence }) {
  const cards = [
    { id: "free", node: <FreeCard /> },
    { id: "pro", node: <ProCard cadence={cadence} /> },
    { id: "pass", node: <PassCardGiven /> },
  ];
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
      {cards.map((c) => (
        <div key={c.id} className="flex w-[86%] shrink-0 snap-center *:w-full">
          {c.node}
        </div>
      ))}
    </div>
  );
}

function TabsBody({ cadence, setCadence }: { cadence: Cadence; setCadence: (c: Cadence) => void }) {
  const [side, setSide] = useState<"once" | "again">("once");
  return (
    <>
      <div role="group" aria-label="What you are paying for" className="mt-8 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none">
        {(
          [
            { id: "once", label: "Free & one event" },
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
              side === o.id ? "bg-background text-foreground" : "text-muted-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-5">
        {side === "once" ? (
          <>
            <FreeCard />
            <PassCardGiven />
          </>
        ) : (
          <>
            <CadenceToggle cadence={cadence} onPick={setCadence} />
            <ProCard cadence={cadence} />
          </>
        )}
      </div>
    </>
  );
}

export function PhonePlans({ phone }: { phone: Phone }) {
  const [cadence, setCadence] = useState<Cadence>("month");

  if (phone === "stack") {
    // Today, unchanged: the pair's own responsive grid collapses to one
    // column below `lg`, and the ticket already stacks its own three parts.
    return (
      <PaperChapter>
        <section className="py-14">
          <Container>
            <Head note="No per-guest fees. Plans are sized by storage." />
            <div className="mt-8">
              <PlanPairGiven />
              <PassTicketGiven />
            </div>
          </Container>
        </section>
      </PaperChapter>
    );
  }

  if (phone === "tabs") {
    return (
      <PaperChapter>
        <section className="py-14">
          <Container>
            <Head note="Two ways to pay, and only one of them is a subscription." />
            <TabsBody cadence={cadence} setCadence={setCadence} />
          </Container>
        </section>
      </PaperChapter>
    );
  }

  // "swipe"
  return (
    <PaperChapter>
      <section className="py-14">
        <Container>
          <Head note="Swipe to compare Free, Pro and the Event Pass." />
          <div className="mt-8">
            <CadenceToggle cadence={cadence} onPick={setCadence} />
            <SwipeRow cadence={cadence} />
          </div>
        </Container>
      </section>
    </PaperChapter>
  );
}
