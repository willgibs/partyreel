import { ChevronDown } from "lucide-react";

import type { FaqItem } from "@/components/marketing/faq-data";
import { cn } from "@/lib/utils";

// Shared FAQ accordion: a bordered, divided list of native zero-JS <details>. The CALLER
// owns the <Section> wrapper (its own eyebrow/heading) — this renders only the list — so
// the same accordion serves the /events hub AND each /events/[slug] page. Pair it with
// FaqPageJsonLd (lib jsonld) over the same items for FAQPage rich results.
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
        "mx-auto mt-12 max-w-2xl divide-y rounded-xl border",
        className,
      )}
    >
      {items.map((item) => (
        <details key={item.q} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium">
            {item.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
