import "server-only";

import { BIBLE, BIBLE_GROUP_LABEL } from "../rules/bible";
import {
  CATALOG_FAMILIES,
  FAMILY_LABEL,
  FAMILY_ROUTE,
  familyItems,
  type GalleryFamily,
  type GalleryItem,
  ITEMS,
} from "../gallery/registry";
import { boardSpec } from "../sandbox/registry";
import { SANDBOX, SURFACE_LABEL, type Surface } from "../touchpoints";
import { flatten, type Nav, type NavItem, type NavSection } from "./catalog";
import { listSpecs, listTracks } from "./docs";
import { GLOSSARY, RETIRED } from "./glossary";
import type { SearchEntry, SearchIndex } from "./search";

/**
 * BUILDS THE NAV (server-only): the two areas from the registries, as plain
 * data the client chrome receives as props. Reading the gallery registry here
 * (and never in a client file) is what keeps every production component out
 * of the sidebar's bundle.
 *
 * The Library is three parts, in this order: the brand kit, the catalog (its
 * four families open by default, so a reader sees what exists before anything
 * else), and the bible's ten. The glossary is a quiet link on the ten's page.
 *
 * Badges are data, never dates: a `new`/`updated` mark is set on a catalog
 * entry or a board and cleared by the Orchestrator at a window's close, so a
 * Vercel build (which has no git) prints the same badge as the dev server.
 */

const FAMILY_NOTE: Record<GalleryFamily, string> = {
  components: "The UI primitives, rendered from production source.",
  patterns: "The composed shared pieces: the logo, empty states, dead ends.",
  compositions: "The product's own components, from sample props.",
  marketing: "The marketing system and its section pieces, on the real skin.",
  foundations:
    "Colour, type, radius, motion, elevation and light, from the live tokens.",
};

const SURFACE_ORDER: Surface[] = [
  "guest",
  "host",
  "shared",
  "marketing",
  "admin",
];

const TOOLS: NavItem[] = [
  {
    href: "/design/lab/tools/motion",
    label: "Motion tuner",
    badge: "tool",
    note: "The live knobs behind every animated surface, with replayable specimens.",
  },
  {
    href: "/design/lab/tools/reel-parity",
    label: "Reel canvas styles",
    badge: "tool",
    note: "Every reel style side by side: play, scrub, export.",
  },
  {
    href: "/design/lab/tools/reel-live",
    label: "Live reel",
    badge: "tool",
    note: "The rolling composer: a take per loop, arrivals spliced in, a drop on the next frame.",
  },
  {
    href: "/design/lab/tools/reel-video",
    label: "Reel video windows",
    badge: "tool",
    note: "A real mov and webm range-read and decoded into the reel, with the budget's knobs.",
  },
  {
    href: "/design/lab/tools/stream-probe",
    label: "Stream probe",
    badge: "tool",
    note: "Three streaming shapes against the production runtime.",
  },
  {
    href: "/design/lab/tools/boom",
    label: "Error boundary",
    badge: "tool",
    note: "Throws on render, on purpose, to check the boundary.",
  },
];

/**
 * A BOARD'S ROUND COMES OFF ITS OWN SPEC, never off the track manifests: a
 * manifest is deleted at the merge that integrates it, so a badge counted from
 * manifests would go blank the moment its track retired. `spec.round.n` is the
 * board's own record of which round it is in, and a board with no spec simply
 * has no badge.
 */
function roundBadge(id: string): NavItem["badge"] {
  const n = boardSpec(id)?.round.n;
  return n ? `round ${n}` : undefined;
}

/** One catalog entry as a sidebar row. */
function entryItem(it: GalleryItem): NavItem {
  return {
    href: it.href,
    label: it.title,
    id: it.entry.id,
    note: it.entry.for,
    badge: it.entry.badge,
    match: "exact",
    keywords: [it.file],
  };
}

/** A family as an open section: its gallery page first, then every entry. */
function familySection(family: GalleryFamily): NavSection {
  return {
    id: `family-${family}`,
    label: FAMILY_LABEL[family],
    href: FAMILY_ROUTE[family],
    items: [
      {
        href: FAMILY_ROUTE[family],
        label: `The ${FAMILY_LABEL[family].toLowerCase()} gallery`,
        match: "exact",
        note: FAMILY_NOTE[family],
      },
      ...familyItems(family).map(entryItem),
    ],
  };
}

export async function buildNav(): Promise<Nav> {
  const specs = listSpecs();
  const trackList = listTracks();

  const boards: NavSection[] = SURFACE_ORDER.flatMap((surface) => {
    const items = SANDBOX.filter((r) => r.surface === surface);
    if (items.length === 0) return [];
    return [
      {
        id: `boards-${surface}`,
        label: `${SURFACE_LABEL[surface]} boards`,
        items: items.map((r) => ({
          href: `/design/lab/${r.id}`,
          label: r.title,
          id: r.id,
          note: r.board.note,
          badge: roundBadge(r.id) ?? ("exploring" as const),
          match: "prefix" as const,
        })),
      },
    ];
  });

  return [
    {
      id: "library",
      label: "Library",
      href: "/design/library",
      blurb:
        "The brand kit, the component catalog and the bible's ten principles: what exists today, and what design starts from.",
      sections: [
        {
          id: "brand-kit",
          label: "Brand kit",
          href: FAMILY_ROUTE.foundations,
          items: [
            {
              href: FAMILY_ROUTE.foundations,
              label: "The brand kit",
              match: "exact",
              note: FAMILY_NOTE.foundations,
            },
            ...familyItems("foundations").map(entryItem),
          ],
        },
        {
          id: "catalog",
          label: "Catalog",
          href: "/design/library",
          items: [
            {
              href: "/design/library",
              label: "The index",
              match: "exact",
              note: "Every component, searchable, under the design recipe.",
            },
          ],
        },
        ...CATALOG_FAMILIES.map(familySection),
        {
          id: "ten",
          label: "The ten",
          href: "/design/library/rules",
          items: [
            {
              href: "/design/library/rules",
              label: "The bible's ten",
              note: "The ten principles every design starts from, each with its reason.",
              keywords: Object.values(BIBLE_GROUP_LABEL),
            },
          ],
        },
      ],
    },
    {
      id: "lab",
      label: "Lab",
      href: "/design/lab",
      blurb:
        "Everything exploratory: the desk, the boards, the proposals, the tracks, the kit, the tools.",
      sections: [
        {
          id: "desk",
          label: "The desk",
          items: [
            {
              href: "/design/lab",
              label: "The desk",
              match: "exact",
              note: "Every standing board, what it asks, what waits on Will.",
            },
          ],
        },
        ...boards,
        // A proposal document is rare (a board's argument lives in its own
        // spec.ts), so the section appears only while docs/specs holds one.
        ...(specs.length > 0
          ? [
              {
                id: "proposals",
                label: "Proposals",
                items: specs.map((s) => ({
                  href: `/design/lab/proposals/${s.slug}`,
                  label: s.title,
                  id: s.slug,
                  badge: "proposal" as const,
                  note: s.status ?? "A board's argument, waiting on Will.",
                })),
              },
            ]
          : []),
        {
          id: "tracks",
          label: "Tracks",
          collapsed: true,
          items: trackList.map((t) => ({
            href: `/design/lab/tracks/${t.name}`,
            label: t.name,
            id: t.name,
            note: `${t.status}${t.preview ? ", preview" : ""}`,
            badge: t.status === "integrated" ? ("retired" as const) : undefined,
          })),
        },
        {
          id: "kit",
          label: "The kit",
          items: [
            {
              href: "/design/lab/kit",
              label: "The toolbox",
              note: "The pieces every board composes: the dock, the stage, the frame, the compare.",
            },
          ],
        },
        { id: "tools", label: "Tools", items: TOOLS },
      ],
    },
  ];
}

// ── The search index ─────────────────────────────────────────────────────────

const clip = (text: string, n = 120): string =>
  text.length <= n ? text : `${text.slice(0, n - 1).trimEnd()}…`;

const entry = (
  kind: SearchEntry["kind"],
  id: string,
  title: string,
  href: string,
  context?: string,
  keywords?: string[],
): SearchEntry => ({
  key: `${kind}:${id}`,
  kind,
  id,
  title,
  href,
  context: context ? clip(context) : undefined,
  keywords: keywords?.length
    ? keywords.filter(Boolean).join(" ").toLowerCase()
    : undefined,
});

/**
 * ONE INDEX OVER EVERYTHING THE SHELL RENDERS (server-only, built beside the
 * nav and handed to the palette as props): the ten, every catalog entry, every
 * board, the proposals, the tracks and the glossary, then the pages no kind
 * above already answers.
 */
export function buildSearchIndex(nav: Nav): SearchIndex {
  const out: SearchIndex = [];
  // The nav lists every entry and every board as an item of its own, and each
  // of those already has a richer entry below (its file, its family, its
  // surface). The page entries are therefore added LAST and any whose href a
  // specific kind already claims is dropped, or "Glow" would answer twice.
  const pages = flatten(nav);

  for (const r of BIBLE)
    out.push(
      entry(
        "rule",
        r.id,
        `${r.n}. ${r.statement}`,
        `/design/library/rules#${r.id}`,
        r.why,
        [`bible ${r.n}`, String(r.n), BIBLE_GROUP_LABEL[r.group]],
      ),
    );

  for (const it of ITEMS)
    out.push(
      entry(
        "component",
        it.entry.id,
        it.title,
        it.href,
        it.entry.for ?? it.entry.lede ?? it.file,
        [it.file, FAMILY_LABEL[it.entry.family]],
      ),
    );

  for (const r of SANDBOX)
    out.push(
      entry(
        "board",
        r.id,
        r.title,
        `/design/lab/${r.id}`,
        r.board.note,
        [SURFACE_LABEL[r.surface], ...(r.board.tracks ?? [])],
      ),
    );

  for (const s of listSpecs())
    out.push(
      entry(
        "proposal",
        s.slug,
        s.title,
        `/design/lab/proposals/${s.slug}`,
        s.status ?? undefined,
      ),
    );

  for (const t of listTracks())
    out.push(
      entry(
        "track",
        t.name,
        `lp/${t.name}`,
        `/design/lab/tracks/${t.name}`,
        t.status,
        [t.status],
      ),
    );

  for (const t of GLOSSARY)
    out.push(
      entry(
        "glossary",
        t.term.toLowerCase(),
        t.term,
        t.href ?? "/design/library/glossary",
        t.meaning,
      ),
    );
  for (const t of RETIRED)
    out.push(
      entry(
        "glossary",
        `retired-${t.term.toLowerCase()}`,
        `${t.term} (retired)`,
        "/design/library/glossary#retired",
        `Now: ${t.now}`,
        ["retired"],
      ),
    );

  // The pages last, minus every href a specific kind already answers, and
  // minus any repeat inside the page list itself.
  const claimed = new Set(out.map((e) => e.href));
  for (const it of pages) {
    if (claimed.has(it.href)) continue;
    claimed.add(it.href);
    out.push(
      entry("page", it.id ?? it.href, it.label, it.href, it.note, it.keywords),
    );
  }

  // `key` must stay unique for React even when two entries of a kind share an
  // href (two glossary terms can point at one page).
  const keys = new Set<string>();
  return out.filter((e) => {
    if (keys.has(e.key)) return false;
    keys.add(e.key);
    return true;
  });
}
