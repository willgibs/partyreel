import { ChevronDown } from "lucide-react";

import type { FaqItem } from "@/components/marketing/faq-data";
import { cn } from "@/lib/utils";

// Shared FAQ accordion: a bordered, divided list of native zero-JS <details>. The CALLER
// owns the <Section> wrapper (its own eyebrow/heading) — this renders only the list — so
// the same accordion serves the /events hub AND each /events/[slug] page. Pair it with
// FaqPageJsonLd (lib jsonld) over the same items for FAQPage rich results.
//
// MOTION (R4 census): the panel CANNOT ride the house .mkt-acc grammar — <details> keeps
// closed content out of layout, so the 0fr/1fr grid-rows animation has nothing to size
// (that is exactly why the home FAQ is a separate JS accordion). What it CAN share is the
// clock: the chevron now reads the same --mkt-acc-chevron duration and --ease-emphasis
// curve as the home accordion instead of an ad-hoc 150ms, so retuning the token retunes
// both. Kept zero-JS on purpose: these pages ship no island for a disclosure list.
export function FaqAccordion({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto mt-10 max-w-2xl divide-y rounded-xl border bg-card/40",
        className,
      )}
    >
      {items.map((item) => (
        <details key={item.q} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium">
            {item.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--mkt-acc-chevron,250ms)] ease-emphasis group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
