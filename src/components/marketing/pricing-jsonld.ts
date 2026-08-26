import { PLANS, type Plan } from "@/lib/constants/tiers";

/**
 * The /pricing Product + AggregateOffer structured data, as a PURE builder
 * (this module deliberately imports nothing env-touching: site.ts pulls env.ts,
 * whose eager validation makes it un-importable under Vitest, and the whole
 * point is a unit pin on emitted prices === PLANS). jsonld.tsx wires the real
 * SITE_* strings into `site` and renders the <script>; the test passes fixtures.
 */
export type PricingJsonLdSite = {
  /** Canonical origin, no trailing slash (SITE_URL). */
  url: string;
  name: string;
  description: string;
};

/**
 * Numeric price from a plan's display label ("$9/mo" → 9, "$24 one-time" → 24,
 * "$0" → 0). tiers.ts deliberately carries no separate numeric price (Stripe
 * Prices are the billing truth; priceLabel is the display truth), so the
 * structured data derives from the SAME string shoppers see, and the Vitest pin
 * fails loudly if a label ever stops parsing.
 */
export function planPriceNumber(plan: Plan): number {
  const match = plan.priceLabel.match(/^\$(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(
      `Unparseable priceLabel for plan ${plan.id}: ${plan.priceLabel}`,
    );
  }
  return Number(match[1]);
}

/**
 * One Offer per purchasable plan, every number derived from PLANS (the pricing
 * single source) so the emitted schema can never drift from the visible cards.
 */
export function pricingJsonLdData(
  site: PricingJsonLdSite,
): Record<string, unknown> {
  const prices = PLANS.map(planPriceNumber);
  const pricingUrl = `${site.url}/pricing`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: site.name,
    description: site.description,
    url: pricingUrl,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: PLANS.length,
      offers: PLANS.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: planPriceNumber(plan),
        priceCurrency: "USD",
        url: pricingUrl,
        availability: "https://schema.org/InStock",
      })),
    },
  };
}
