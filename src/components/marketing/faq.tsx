import { ChevronDown } from "lucide-react";

import { FAQ_ITEMS } from "./faq-data";
import { Section } from "./section";

// Native <details>/<summary> accordion: zero JS, keyboard-accessible, and good
// for SEO out of the box — and it avoids a dependency (the radix-nova registry
// has no accordion, same reason form.tsx is hand-authored).
export function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" heading="Questions, answered">
      <div className="mx-auto mt-12 max-w-2xl divide-y rounded-xl border bg-card">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
