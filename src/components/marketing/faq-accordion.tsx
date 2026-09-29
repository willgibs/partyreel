"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, useSyncExternalStore } from "react";

import type { FaqItem } from "@/components/marketing/faq-data";
import { cn } from "@/lib/utils";

/**
 * THE ONE FAQ, on every page that has one (home, pricing, /events, every
 * /features page): a bordered, divided list where each question is a real
 * heading (`loose-ends` r1, `faq-look=heading`: the quiet size, as a heading,
 * everywhere). The CALLER owns the <Section> wrapper (its own eyebrow and
 * heading); this renders only the list. Pair it with FaqPageJsonLd (or the
 * home's FaqJsonLd) over the same items for the FAQPage rich result.
 *
 * ★ THE HEADING IS AN <h3> AROUND A <button>, NEVER A HEADING INSIDE A NATIVE
 * <summary>. The pick was drawn on the zero-JS <details>, with the question in
 * an <h3> inside its <summary>: legal HTML that a screen reader cannot be
 * trusted to keep. Browsers give <summary> a button-like role whose children
 * are presentational, so the nested heading drops out of the heading list in
 * some browser and screen reader pairs (MDN's <summary> page says so; Chromium's
 * own tree keeps it, which is why a check in Chrome alone passes). An <h3>
 * around a <button aria-expanded> is the WAI-ARIA accordion pattern and reads
 * the same to every reader, so the /events and /features FAQs took the home's
 * accordion rather than a <details> with a heading in it, and there is one
 * list now (two had drifted into two looks, and that was the question). The
 * cost is a client island where those pages shipped none; the <noscript> rule
 * below keeps every answer readable with scripting off.
 *
 * ★ THE QUESTION WEARS THE HEADING FACE AT ITS ONE WEIGHT. The pick said
 * 14/500; production's rule since crumbs-12 is that every heading is
 * `font-heading` at 700 (a weight class beside it beats it, and
 * type-ladder-policy refuses one), so the size is the pick's (the `working`
 * step, 14) and the weight is the face's. Question and answer now share a
 * size, so the question leads by face, weight and colour.
 *
 * MOTION: the ratified chapter-2 clocks (.mkt-acc: the grid-rows 0fr/1fr height
 * animation and the scaleY chevron flip; padding lives INSIDE .mkt-acc-panel-inner
 * per the recipe's never-fully-closes warning). One question is open at a time,
 * so the list stays a quiet block. A closed panel is `inert`, because 0fr only
 * collapses it visually: without it a screen reader reads every answer while
 * its button says collapsed, and a Tab could land inside one.
 */

/** Scripting off has nothing to open a panel, so every answer shows: the same
 *  <noscript> companion the hero uses for its rest state. */
const NOSCRIPT_RULE =
  "<style>[data-faq] .mkt-acc-panel{grid-template-rows:1fr}[data-faq] .mkt-acc-panel-inner{opacity:1;filter:none}</style>";

const noopSubscribe = () => () => {};

export function FaqAccordion({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();
  // The server and a scripting-off reader never get an inert panel (inert text
  // cannot be selected or found, and the <noscript> rule shows every answer);
  // the client applies it from its first render.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  return (
    <>
      <div
        data-faq=""
        className={cn(
          "mx-auto mt-10 max-w-2xl divide-y rounded-xl border bg-card/40",
          className,
        )}
      >
        {items.map((item, i) => {
          const isOpen = open === i;
          const buttonId = `${baseId}-q-${i}`;
          const panelId = `${baseId}-a-${i}`;
          return (
            <div
              key={item.q}
              className="mkt-acc px-5"
              data-open={isOpen ? "true" : "false"}
            >
              {/* The button inherits the face, size, leading, tracking and
                  weight from its heading (the preflight sets font: inherit),
                  so nothing on it may name a weight of its own. */}
              <h3 className="font-heading text-working">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
                >
                  {item.q}
                  <span
                    className="mkt-acc-chevron text-muted-foreground"
                    aria-hidden
                  >
                    <ChevronDown className="size-4" />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                inert={hydrated && !isOpen}
                className="mkt-acc-panel"
              >
                <div className="mkt-acc-panel-inner">
                  <p className="pb-4 text-working text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Outside the list on purpose: a trailing sibling would make the last
          row a `divide-y` row and double the card's own bottom border. */}
      <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_RULE }} />
    </>
  );
}
