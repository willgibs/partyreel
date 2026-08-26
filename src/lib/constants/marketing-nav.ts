// Single source of marketing-site navigation — consumed by the header (mega
// panels + mobile sheet), the footer, and the sitemap-adjacent pins. Each
// build-out round APPENDS its routes here as they ship, so the nav never points
// at a route that doesn't exist yet. The header renders flat items as links and
// `children` items as PANELS (the expansion-round mega-menu); the footer
// renders columns. This module stays dependency-free / light in the client
// bundle: children are plain strings, and Vitest asserts they mirror their
// owning single-sources (EVENT_TYPE_SLUGS, FEATURE_PAGE_SLUGS + the registry
// labels) instead of importing them here.

export type NavLink = {
  label: string;
  href: string;
  /** The mega-panel one-liner under the label (panels only; footer ignores). */
  description?: string;
};
export type NavGroup = { label: string; href?: string; children: NavLink[] };
export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

// The primary conversion CTA, single-sourced (Track B): the header, the mobile
// sheet, and CtaBand all read THIS, so the label can never drift back to the
// retired "Get started" (a Vitest pin holds it). The ruled label is "Start free".
export const MARKETING_CTA: NavLink = { label: "Start free", href: "/login" };

// Desktop header primary nav (between the logo and the CTAs). The 2026-08-26
// expansion IA: Features is a PANEL group (the six feature pages + the reel,
// per Will's nest-the-reel ruling; top-level Reel retired), Events stays the
// use-cases panel, Pricing stays flat, Resources is the reading panel. Panel
// descriptions are PROVISIONAL copy (the registry pattern).
export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Features",
    href: "/features",
    children: [
      {
        label: "The live album",
        href: "/features/album",
        description: "Every photo and video, full quality, live.",
      },
      {
        label: "The QR code",
        href: "/features/qr",
        description: "One scan and everyone's in.",
      },
      {
        label: "Curation",
        href: "/features/curation",
        description: "Approve, hide, and shape the album.",
      },
      {
        label: "Sharing & downloads",
        href: "/features/sharing",
        description: "One link out, originals for everyone.",
      },
      {
        label: "Guests & profiles",
        href: "/features/guests",
        description: "Names on every photo, profiles to follow.",
      },
      {
        label: "Privacy & trust",
        href: "/features/privacy",
        description: "Private by default, yours to open up.",
      },
      {
        label: "The highlight reel",
        href: "/reel",
        description: "The whole event, cut into a minute.",
      },
    ],
  },
  {
    label: "Events",
    href: "/events",
    children: [
      {
        label: "Weddings",
        href: "/events/weddings",
        description: "Every angle of the day, one album.",
      },
      {
        label: "Parties",
        href: "/events/parties",
        description: "The dance floor, from every phone.",
      },
      {
        label: "Conferences",
        href: "/events/conferences",
        description: "Sessions and hallways, collected.",
      },
      {
        label: "Trips",
        href: "/events/trips",
        description: "The whole trip, one shared roll.",
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  {
    // No `href` (there is no /resources hub) → the panel renders just the
    // children, no "All resources" link. Mirrors the footer Resources column.
    label: "Resources",
    children: [
      {
        label: "Help center",
        href: "/help",
        description: "Exact answers, step by step.",
      },
      {
        label: "Blog",
        href: "/blog",
        description: "Notes on hosting and sharing.",
      },
      {
        label: "Press & brand",
        href: "/press",
        description: "Logos, facts, and who to ask.",
      },
      {
        label: "Contact",
        href: "/contact",
        description: "A real person answers.",
      },
    ],
  },
];

export type FooterColumn = { title: string; links: NavLink[] };

// Footer columns: Product / Features / Events / Resources / Company.
// The Features column carries the six pages (the expansion IA); Product keeps
// the cross-cutting routes. "How it works" now points at the PAGE (the home
// film-strip keeps its /#how-it-works anchor id for deep links). Privacy/Terms
// live under Company: a separate 2-link Legal column made the footer's 6th
// column WRAP at 1440 (the R4-A19 orphan; 6 × min-w-28 + gaps overflow the row).
export const FOOTER_NAV: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Reel", href: "/reel" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Features",
    links: [
      { label: "All features", href: "/features" },
      { label: "The live album", href: "/features/album" },
      { label: "The QR code", href: "/features/qr" },
      { label: "Curation", href: "/features/curation" },
      { label: "Sharing & downloads", href: "/features/sharing" },
      { label: "Guests & profiles", href: "/features/guests" },
      { label: "Privacy & trust", href: "/features/privacy" },
    ],
  },
  {
    title: "Events",
    links: [
      { label: "Weddings", href: "/events/weddings" },
      { label: "Parties", href: "/events/parties" },
      { label: "Conferences", href: "/events/conferences" },
      { label: "Trips", href: "/events/trips" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Blog", href: "/blog" },
      { label: "Press & brand", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      // About is FOOTER-ONLY by ruling (R5, 2026-08-26): quiet placement, no
      // header-nav row. It leads the column as the column's anchor.
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
