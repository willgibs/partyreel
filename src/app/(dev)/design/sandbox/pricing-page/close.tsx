"use client";

import type { CSSProperties } from "react";

import { HomeFaqAccordion } from "@/components/marketing/sections/home/faq-accordion";
import { PRICING_FAQ_ITEMS } from "@/components/marketing/sections/pricing/pricing-faq-data";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * HOW THE PAGE ENDS: eight folded questions and a band, four open ones, or the
 * band alone.
 *
 * ★ THE FOUR ARE THE FOUR THAT SETTLE MONEY, and which four is not a taste
 * call: `pricing-faq-data.ts` is one list feeding both the accordion and the
 * page's FAQPage JSON-LD, and four of its eight are the ones a buyer cannot
 * commit without (can I run one event without subscribing, what happens to a
 * pass when I go Pro, what happens at the cap, can I cancel). They are picked
 * out of that list by their own text, never retyped, so a reworded answer
 * follows into this board and the structured data can never describe a page
 * that is not there.
 *
 * ★ BIBLE 21 IS IN PLAY: all copy is open. An accordion of eight is eight
 * clicks between a buyer and the four answers they need, which is the argument
 * for reading them open in two columns and sending the other four to /help.
 */

export type Close = "eight" | "four" | "none";

/** The four that settle money, matched by their first words, never retyped. */
const MONEY_STARTS = [
  "Can I run one big event",
  "What happens when I move",
  "What happens if I hit",
  "Can I cancel Pro",
];

const MONEY = MONEY_STARTS.map((start) => {
  const found = PRICING_FAQ_ITEMS.find((i) => i.q.startsWith(start));
  if (!found) throw new Error(`No pricing FAQ starting "${start}"`);
  return found;
});

function Band() {
  return (
    <div data-pp-inert>
      <CtaBand
        heading="Ready when you are."
        subhead="Start your first event free, and upgrade only when you host again."
        demoLink
      />
    </div>
  );
}

export function CloseBlock({ close }: { close: Close }) {
  if (close === "none") {
    return <Band />;
  }

  if (close === "four") {
    return (
      <>
        <SectionShell
          id="faq"
          eyebrow="Questions"
          heading="The four that settle the money."
        >
          <Reveal className="mx-auto mt-10 grid max-w-4xl gap-x-10 gap-y-8 sm:grid-cols-2">
            {MONEY.map((item, i) => (
              <div
                key={item.q}
                data-mkt-reveal
                style={{ "--i": i + 3 } as CSSProperties}
              >
                <h3 className="font-heading text-card-title">{item.q}</h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {item.a}
                </p>
              </div>
            ))}
          </Reveal>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Everything else, from uploads to guests to what happens to an old
            album, is in <span className="underline underline-offset-4">Help</span>.
          </p>
        </SectionShell>
        <Band />
      </>
    );
  }

  return (
    <>
      <SectionShell
        id="faq"
        width="narrow"
        eyebrow="Questions"
        heading="The fine print, in plain words."
      >
        <Reveal className="mt-10">
          <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
            <HomeFaqAccordion items={PRICING_FAQ_ITEMS} />
          </div>
        </Reveal>
      </SectionShell>
      <Band />
    </>
  );
}
