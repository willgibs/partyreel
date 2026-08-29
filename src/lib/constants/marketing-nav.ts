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

/** Does `pathname` sit under `href`? Exact match, or a real path segment below
 *  it — never a prefix match, or /press would light up /pressure. */
function isUnder(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Is this nav item the section the visitor is currently in? Used by the header
 *  to ink the current trigger and to set aria-current on flat links. A GROUP is
 *  current when the visitor is under its hub OR under any of its children —
 *  Resources has no hub of its own, so its children are the only signal. */
export function isNavItemCurrent(item: NavItem, pathname: string): boolean {
  if (isNavGroup(item)) {
    if (item.href && isUnder(pathname, item.href)) return true;
    return item.children.some((child) => isUnder(pathname, child.href));
  }
  return isUnder(pathname, item.href);
}

// The primary conversion CTA, single-sourced (Track B): the header, the mobile
// sheet, and CtaBand all read THIS, so the label can never drift back to the
// retired "Get started" (a Vitest pin holds it). The ruled label is "Start free".
export const MARKETING_CTA: NavLink = { label: "Start free", href: "/login" };

// Desktop header primary nav (between the logo and the CTAs). The 2026-08-26
// expansion IA: Features is a PANEL group (the six feature pages + the reel,
// per Will's nest-the-reel ruling; top-level Reel retired), Events stays the
// use-cases panel, Resources is the reading panel. Panel descriptions are
// PROVISIONAL copy (the registry pattern).
//
// ORDER IS LOAD-BEARING (Will, 2026-08-28): the three PANEL groups sit
// CONTIGUOUS and Pricing goes last as the only flat link. Radix derives its
// side-by-side cross-slide (`data-motion` from-start/from-end) from the index
// delta between adjacent items, so a flat link wedged between two panels left
// one of the three pairs without a sweep. Groups first, links last.
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
        label: "Press",
        href: "/press",
        description: "Logos, facts, and who to ask.",
      },
      {
        label: "Contact",
        href: "/contact",
        description: "Any question, any topic.",
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

export type FooterColumn = {
  title: string;
  /**
   * The column's own hub route, when it has one. The TITLE becomes the link
   * (rendered with a hairline underline so it reads as one), which is tidier
   * than spending a row on "All features" and puts the directory where the eye
   * already lands. Columns with no hub (Product, Resources) leave this unset.
   */
  href?: string;
  links: NavLink[];
  /**
   * A second group under a hairline, inside the same column. The reference
   * shape: it lets a short group (Company: two links) read as deliberate
   * instead of as a stunted fifth column, and it keeps the footer at four nav
   * columns so none of them has to be narrow.
   */
  tail?: NavLink[];
};

// THE FOOTER IA (the ink-slab rebuild, revised after Will's review).
//
// FEATURES AND EVENTS ARE FULL COLUMNS, NOT DISCLOSURES. The first pass folded
// them into collapsed groups at the bottom of Product, which buried the two most
// core marketing page families behind a chevron. Will's rule was that anything
// core to conversion stays one glance away, and these are exactly that. No
// accordion survives: the whole sitemap is ~22 links, which fits four columns on
// desktop and a two-up grid on phones, so collapsing anything only ever cost a
// click and hid the good stuff.
//
// Four columns, tallest first (the reference's own arrangement), beside the
// brand block. Company rides as Resources' TAIL under a hairline rather than a
// fifth two-link column: five nav columns plus the brand block is the R4-A19
// overflow shape, and a two-item column reads as a mistake.
//
// SUPERSEDES R4-A19 for legal: Privacy and Terms sat under Company only because
// a separate two-link Legal COLUMN wrapped at 1440. A bar is a different shape,
// so FOOTER_LEGAL owns them and they read as legal, not as company.
//
// UNCHANGED: the Resources LINKS still mirror the header's Resources panel
// exactly (a two-way Vitest pin), and About still leads its group (the R5 pin,
// the only mechanical guard keeping /about reachable).
export const FOOTER_NAV: FooterColumn[] = [
  {
    title: "Features",
    href: "/features",
    links: [
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
    href: "/events",
    links: [
      { label: "Weddings", href: "/events/weddings" },
      { label: "Parties", href: "/events/parties" },
      { label: "Conferences", href: "/events/conferences" },
      { label: "Trips", href: "/events/trips" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "The reel", href: "/reel" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
    // About is FOOTER-ONLY by ruling (R5, 2026-08-26): quiet placement, no
    // header-nav row. It leads the tail as the group's anchor.
    tail: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
    ],
  },
];

/** The legal bar (the footer's last row, beside the copyright). Separate from
 *  FOOTER_NAV because these are not a sitemap column: they read as legal, and
 *  the bar shape is what let them leave Company (see the R4-A19 note above). */
export const FOOTER_LEGAL: NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];
