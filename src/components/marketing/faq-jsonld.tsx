import { FAQ_ITEMS } from "./faq-data";

// FAQPage structured data for search rich results. Sourced from the same
// FAQ_ITEMS the visible accordion renders, so the markup always matches the
// page. Content is our own static strings (no user input) → safe to inline.
export function FaqJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
