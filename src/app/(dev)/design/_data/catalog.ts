/**
 * THE NAVIGATION MODEL (the Library x Lab round, 2026-09-15): two areas, their
 * sections, their items. Pure data plus the helpers every piece of chrome
 * reads (the active item, the breadcrumbs, the neighbours), with NO heavy
 * imports, so the client sidebar and top bar can use them. The data itself is
 * built server-side by `nav.ts` (it reads the gallery registry, the manifests
 * and the specs) and handed to the chrome as props: the client never imports
 * a board or a component.
 *
 * Vocabulary (the glossary at /design/library/glossary): the LIBRARY is
 * everything that binds or informs; the LAB is everything exploratory.
 */

export type Area = "library" | "lab";

export type NavBadge =
  | "new"
  | "updated"
  | "exploring"
  | "shipped"
  | "proposal"
  | "retired"
  | "tool"
  | "legacy"
  | `round ${number}`;

export type NavItem = {
  /** The unkeyed lab route. */
  href: string;
  label: string;
  /** A rule, component, board or doc id, for search and the tests. */
  id?: string;
  /** The library card: a for-line, a board note; searched. */
  note?: string;
  badge?: NavBadge;
  /** `prefix` lights the item for nested routes (the default for a section home). */
  match?: "exact" | "prefix";
  keywords?: string[];
};

export type NavSection = {
  id: string;
  label: string;
  href?: string;
  items: NavItem[];
  /** Collapsed unless it holds the active item. */
  collapsed?: boolean;
};

export type NavArea = {
  id: Area;
  label: string;
  href: string;
  blurb: string;
  sections: NavSection[];
};

export type Nav = NavArea[];

export const AREA_HREF: Record<Area, string> = {
  library: "/design/library",
  lab: "/design/lab",
};

export function areaOf(pathname: string): Area {
  return pathname === "/design/lab" || pathname.startsWith("/design/lab/")
    ? "lab"
    : "library";
}

function matches(item: NavItem, pathname: string): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export type ActiveHit = { area: NavArea; section: NavSection; item: NavItem };

/**
 * The item the pathname lights: the LONGEST matching href wins, so a section
 * home (`/design/library`, prefix) yields to a deeper item (`/design/library/rules`).
 */
export function activeItem(nav: Nav, pathname: string): ActiveHit | null {
  let best: ActiveHit | null = null;
  for (const area of nav) {
    for (const section of area.sections) {
      for (const item of section.items) {
        if (!matches(item, pathname)) continue;
        if (!best || item.href.length > best.item.href.length)
          best = { area, section, item };
      }
    }
  }
  return best;
}

export type Crumb = { label: string; href: string };

/** Area, section, item: the eyebrow every page header renders. */
export function breadcrumbs(nav: Nav, pathname: string): Crumb[] {
  const hit = activeItem(nav, pathname);
  if (!hit) {
    const area = nav.find((a) => a.id === areaOf(pathname));
    return area ? [{ label: area.label, href: area.href }] : [];
  }
  const crumbs: Crumb[] = [{ label: hit.area.label, href: hit.area.href }];
  if (hit.section.href && hit.section.href !== hit.item.href)
    crumbs.push({ label: hit.section.label, href: hit.section.href });
  if (hit.item.href !== hit.area.href)
    crumbs.push({ label: hit.item.label, href: hit.item.href });
  return crumbs;
}

/** Prev and next within the active section, in declared order. */
export function neighbours(
  nav: Nav,
  pathname: string,
): { prev?: NavItem; next?: NavItem } {
  const hit = activeItem(nav, pathname);
  if (!hit) return {};
  const items = hit.section.items;
  const i = items.findIndex((it) => it.href === hit.item.href);
  return { prev: items[i - 1], next: items[i + 1] };
}

export function flatten(nav: Nav): NavItem[] {
  return nav.flatMap((a) => a.sections.flatMap((s) => s.items));
}

/** The sidebar's local filter: label, note, id and keywords, case-insensitive. */
export function filterNav(nav: Nav, query: string): Nav {
  const q = query.trim().toLowerCase();
  if (!q) return nav;
  const hit = (item: NavItem) =>
    [item.label, item.note ?? "", item.id ?? "", ...(item.keywords ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(q);
  return nav
    .map((area) => ({
      ...area,
      sections: area.sections
        .map((s) => ({ ...s, items: s.items.filter(hit), collapsed: false }))
        .filter((s) => s.items.length > 0),
    }))
    .filter((a) => a.sections.length > 0);
}

/**
 * Segments a component or board id may never take, because a section lives
 * there; pinned by catalog.test.ts against the registries.
 */
export const RESERVED = {
  library: [
    "components",
    "patterns",
    "compositions",
    "marketing",
    "foundations",
    "rules",
    "policies",
    "guidance",
    "doctrine",
    "glossary",
  ],
  lab: ["proposals", "tracks", "kit", "tools"],
} as const;
