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

// Desktop header primary nav (between the logo and the CTAs). Today these are the
// live routes + home-section anchors; Features / Use-cases dropdown / Resources land
// in their rounds. Anchors use `/#id` (not `#id`) so they resolve from any page.
export const PRIMARY_NAV: NavItem[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Use cases", href: "/#use-cases" },
  { label: "FAQ", href: "/#faq" },
  { label: "Pricing", href: "/pricing" },
];

export type FooterColumn = { title: string; links: NavLink[] };

// Footer columns grow as rounds ship (Use cases / Resources / Company appear with
// their pages). Product + Legal exist today.
export const FOOTER_NAV: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
