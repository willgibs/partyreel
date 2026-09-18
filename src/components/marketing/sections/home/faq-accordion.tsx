"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import type { FaqItem } from "@/components/marketing/faq-data";
import { cn } from "@/lib/utils";

/**
 * The home FAQ accordion on the ratified chapter-2 clocks (.mkt-acc: the
 * grid-rows 0fr/1fr height animation + the scaleY chevron flip; padding lives
 * INSIDE .mkt-acc-panel-inner per the recipe's never-fully-closes warning).
 * A11y stays native: real <button aria-expanded aria-controls> in an <h3>,
 * labelled role="region" panels, keyboard for free. This replaces the old
 * zero-JS <details> pattern ON THE HOME only, because <details> hides closed
 * content from layout so the 0fr track cannot animate it; the shared
 * FaqAccordion (details) still serves the events pages.
 */
export function HomeFaqAccordion({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className={cn("divide-y rounded-xl border bg-card/40", className)}>
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
            {/* A question is the title of its row in one bordered card, so
                the h3 wears the card step (it inherited 16px Inter before, the
                one heading on the page off the ladder). The button inherits
                the face, the size, the leading and the tracking from it (the
                preflight sets font: inherit) and keeps a card title's 600. */}
            <h3 className="font-heading text-card-title">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-semibold"
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
              className="mkt-acc-panel"
            >
              <div className="mkt-acc-panel-inner">
                <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
