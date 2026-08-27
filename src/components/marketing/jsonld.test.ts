import { describe, expect, it } from "vitest";

import { PLANS } from "@/lib/constants/tiers";

import { planPriceNumber, pricingJsonLdData } from "./pricing-jsonld";

type Offer = {
  "@type": string;
  name: string;
  price: number;
  priceCurrency: string;
  url: string;
};
type AggregateOffer = {
  "@type": string;
  priceCurrency: string;
  lowPrice: number;
  highPrice: number;
  offerCount: number;
  offers: Offer[];
};

const SITE = {
  url: "https://partyreel.com",
  name: "Partyreel",
  description: "Test description",
};

// The B2 pin: the /pricing structured data must equal the PLANS single source
// exactly (one Offer per plan, price = the label's number), so a tiers.ts price
// change propagates and a drifted emission fails here, never silently in search.
// (Tested via the pure builder: jsonld.tsx itself pulls site.ts → env.ts, whose
// eager validation is un-importable under Vitest.)
describe("pricing JSON-LD", () => {
  const data = pricingJsonLdData(SITE);
  const aggregate = data.offers as AggregateOffer;

  it("emits one Offer per plan, in PLANS order, with the label's price", () => {
    expect(aggregate.offerCount).toBe(PLANS.length);
    expect(aggregate.offers).toHaveLength(PLANS.length);
    PLANS.forEach((plan, i) => {
      const offer = aggregate.offers[i];
      expect(offer["@type"]).toBe("Offer");
      expect(offer.name).toBe(plan.name);
      expect(offer.price).toBe(planPriceNumber(plan));
      expect(offer.priceCurrency).toBe("USD");
      expect(offer.url).toBe(`${SITE.url}/pricing`);
    });
  });

  it("every plan's priceLabel parses to a finite number (the emission contract)", () => {
    for (const plan of PLANS) {
      expect(Number.isFinite(planPriceNumber(plan))).toBe(true);
    }
  });

  it("aggregate bounds equal the PLANS price range", () => {
    const prices = PLANS.map(planPriceNumber);
    expect(aggregate.lowPrice).toBe(Math.min(...prices));
    expect(aggregate.highPrice).toBe(Math.max(...prices));
    expect(aggregate["@type"]).toBe("AggregateOffer");
    expect(data["@type"]).toBe("Product");
  });
});
