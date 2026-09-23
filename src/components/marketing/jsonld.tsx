import { FOUNDED_YEAR } from "@/lib/constants/press";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
} from "@/lib/constants/site";
import { INACTIVE_DAYS } from "@/lib/lifecycle/inactivity";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

import type { FaqItem } from "./faq-data";
import { pricingJsonLdData } from "./pricing-jsonld";

// Structured-data helpers for the marketing site. All content is our own static
// strings (no user input) → safe to inline as application/ld+json, same as the
// FaqJsonLd pattern. Org + Website mount site-wide in the marketing layout;
// BreadcrumbJsonLd is per nested page (events / help / blog / careers).
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // `<` is escaped as \u003c (valid JSON, identical when parsed) so no string that reaches
      // any emitter (a blog title, a FAQ question) can close the script tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
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
        email: SUPPORT_EMAIL,
        foundingDate: FOUNDED_YEAR,
        contactPoint: {
          "@type": "ContactPoint",
          email: SUPPORT_EMAIL,
          contactType: "customer support",
          url: `${SITE_URL}/contact`,
        },
      }}
    />
  );
}

/**
 * The sitewide "what is this product" signal (2026-08-28, the AI-discoverability
 * layer): Product schema only lived on /pricing, so a crawler landing anywhere
 * else saw a bare Organization. Mounted beside Org + WebSite in the marketing
 * layout. Prices reuse the same AggregateOffer the pricing page emits (one
 * derivation, pricing-jsonld.ts). No ratings and no reviews by design: the
 * social-proof fence bans fabricating them, and an absent field beats a fake
 * one with every ranking system that matters.
 */
export function SoftwareApplicationJsonLd() {
  const pricing = pricingJsonLdData({
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
  });
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        offers: pricing.offers,
        featureList: [
          "Guests upload photos and videos by scanning one QR code, from the browser, with no app required",
          "One live shared album per event, full resolution, never watermarked",
          "Automatic highlight reel cut from the album, rendered on-device",
          "Host moderation: approve, hide, and feature anything",
          "No per-guest fees and no guest limit; plans are sized by storage",
          `An inactive free album is eventually removed after about ${Math.round(INACTIVE_DAYS / 30)} months; every other album never expires, and deletions wait ${RECENTLY_DELETED_WINDOW_DAYS} days in Deleted`,
          // ★ The ruled short form (Will, 2026-09-02): the clause "for the
          // common formats" rides every shortened version of this claim (HEIC,
          // HEIF, AVIF and WebM are stored exactly as sent). Structured data is
          // quoted back by assistants verbatim, so it carries the clause too.
          "Location data is stripped in the browser before a photo ever uploads, for the common formats.",
          "Open, link-only, or password-locked album visibility",
        ],
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

// Article schema for help-center / blog pages. `author`/`publisher` are the Org;
// dates come from the article's frontmatter `updated`. All values are our own static
// content (no user input) → safe to inline, same as the other helpers above.
export function ArticleJsonLd({
  headline,
  description,
  path,
  datePublished,
  dateModified,
  authorName,
}: {
  headline: string;
  description: string;
  /** Site-relative path, e.g. "/help/how-partyreel-works". */
  path: string;
  datePublished?: string;
  dateModified?: string;
  /** A named human author (blog posts) → `author` becomes a Person; else the Org. */
  authorName?: string;
}) {
  const url = `${SITE_URL}${path}`;
  const org = { "@type": "Organization", name: SITE_NAME, url: SITE_URL };
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        author: authorName ? { "@type": "Person", name: authorName } : org,
        publisher: {
          ...org,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
        },
        ...(datePublished ? { datePublished } : {}),
        ...(dateModified ? { dateModified } : {}),
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      }}
    />
  );
}

// Blog collection node for the /blog index — lists each post as a BlogPosting so
// search engines understand the feed. Posts are our own content → safe to inline.
export function BlogJsonLd({
  posts,
}: {
  posts: { title: string; slug: string; date: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Blog",
        name: `${SITE_NAME} Blog`,
        url: `${SITE_URL}/blog`,
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: `${SITE_URL}/blog/${post.slug}`,
          datePublished: post.date,
        })),
      }}
    />
  );
}

/**
 * The /pricing Product + AggregateOffer node. The builder lives in
 * pricing-jsonld.ts (pure, Vitest-pinned against PLANS); this wires the real
 * site strings in and renders the script tag.
 */
export function PricingJsonLd() {
  return (
    <JsonLd
      data={pricingJsonLdData({
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
      })}
    />
  );
}

/**
 * The /contact page node: names this page as THE support surface and binds the
 * support email to it. Deliberately minimal — no response-time or channel
 * promises in structured data (the neutralization ruling covers schema too).
 */
export function ContactPageJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: `Contact ${SITE_NAME}`,
        url: `${SITE_URL}/contact`,
        mainEntity: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          email: SUPPORT_EMAIL,
        },
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
