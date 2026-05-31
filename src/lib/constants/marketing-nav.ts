// Single source of marketing-site navigation — consumed by the header, the footer,
// and (later) the sitemap generator. Each build-out round APPENDS its routes here as
// they ship, so the nav never points at a route that doesn't exist yet. The header
// renders flat items as links and `children` items as dropdowns; the footer renders
// columns.

export type NavLink = { label: string; href: string };
export type NavGroup = { label: string; href?: string; children: NavLink[] };
export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

// Desktop header primary nav (between the logo and the CTAs). Anchors use `/#id`
// (not `#id`) so they resolve from any page. The Events children mirror EVENT_TYPES
// in lib/constants/events.ts (kept here as plain strings so this nav module stays
// dependency-free / light in the client bundle); a Vitest test asserts they don't
// drift from EVENT_TYPE_SLUGS.
export const PRIMARY_NAV: NavItem[] = [
  { label: "Features", href: "/features" },
  {
    label: "Events",
    href: "/events",
    children: [
      { label: "Weddings", href: "/events/weddings" },
      { label: "Parties", href: "/events/parties" },
      { label: "Conferences", href: "/events/conferences" },
      { label: "Trips", href: "/events/trips" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  {
    // No `href` (there is no /resources hub) → the dropdown renders just the
    // children, no "All resources" item. Mirrors the footer Resources column.
    label: "Resources",
    children: [
      { label: "Help center", href: "/help" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export type FooterColumn = { title: string; links: NavLink[] };

// Footer columns: Product / Events / Resources / Company / Legal.
export const FOOTER_NAV: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
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
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "Careers", href: "/careers" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
