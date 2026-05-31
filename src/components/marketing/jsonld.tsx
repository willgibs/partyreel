import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants/site";

import type { FaqItem } from "./faq-data";

// Structured-data helpers for the marketing site. All content is our own static
// strings (no user input) → safe to inline as application/ld+json, same as the
// FaqJsonLd pattern. Org + Website mount site-wide in the marketing layout;
// BreadcrumbJsonLd is per nested page (use-cases / help / blog / careers).
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description: SITE_DESCRIPTION,
      }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      }}
    />
  );
}

// Reusable FAQPage schema from any FaqItem[] (use-case pages, help articles…).
// The home FAQ keeps its own `faq-jsonld.tsx`; this is for per-page FAQ sets.
export function FaqPageJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

export type BreadcrumbItem = { name: string; href: string };

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.href.startsWith("http")
            ? item.href
            : `${SITE_URL}${item.href}`,
        })),
      }}
    />
  );
}
