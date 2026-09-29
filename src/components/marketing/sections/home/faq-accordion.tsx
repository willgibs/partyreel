import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { cn } from "@/lib/utils";

/**
 * THE HOME AND PRICING FAQ: the shared accordion (`marketing/faq-accordion.tsx`,
 * the one FAQ look since `loose-ends` r1) with no top gap of its own. Its two
 * callers hold the gap themselves (the home passes `mt-10`, pricing's Reveal
 * carries it), and the shared list's own `mt-10` would stack on a Reveal's.
 * The name stays because pricing-page.test.ts pins `<HomeFaqAccordion
 * items={PRICING_FAQ_ITEMS} />`, and a wrapper this thin is not worth a test
 * edit in another lane's file.
 */
export function HomeFaqAccordion({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  return <FaqAccordion items={items} className={cn("mt-0", className)} />;
}
