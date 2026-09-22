import "server-only";

import { BIBLE, BIBLE_GROUP_LABEL, BIBLE_GROUPS } from "../rules/bible";
import {
  FAMILY_LABEL,
  familyItems,
  type GalleryFamily,
  ITEMS,
} from "../gallery/registry";
import { COMPONENTS, componentTitle } from "../rules/rules";
import { boardSpec } from "../sandbox/registry";
import { SANDBOX, SURFACE_LABEL, type Surface } from "../touchpoints";
import { flatten, type Nav, type NavItem, type NavSection } from "./catalog";
import {
  DOCS,
  type DocId,
  headingsOf,
  landminesOf,
  listRulings,
  listSpecs,
  listTracks,
  readDoc,
} from "./docs";
import { GLOSSARY, RETIRED } from "./glossary";
import { POLICY_TESTS } from "./links";
import type { SearchEntry, SearchIndex } from "./search";

/**
 * BUILDS THE NAV (server-only; the Library x Lab round, 2026-09-15): the two
 * areas from the registries and the docs, as plain data the client chrome
 * receives as props. Reading the gallery registry here (and never in a client
 * file) is what keeps every production component out of the sidebar's bundle.
 *
 * Badges are data, never dates: a `new`/`updated` mark is set on a gallery
 * entry or a board and cleared by the Orchestrator at a window's close, so a
 * Vercel build (which has no git) prints the same badge as the dev server.
 */

const FAMILIES: GalleryFamily[] = [
  "components",
  "patterns",
  "compositions",
  "marketing",
  "foundations",
];

const FAMILY_NOTE: Record<GalleryFamily, string> = {
  components: "The real UI primitives, rendered from production source.",
  patterns: "The composed shared pieces: logo, empty states, dead ends.",
  compositions: "The real product components from sample props.",
  marketing:
    "The marketing system and the shared section atoms, on the real skin.",
  foundations:
    "Colour, type, radius, motion, elevation and light as live swatches.",
};

const SURFACE_ORDER: Surface[] = ["guest", "host", "shared", "marketing", "admin"];

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
 * A BOARD'S ROUND COMES OFF ITS OWN SPEC (the sweep, 2026-09-16), never off the
 * track manifests. It used to count a manifest's `merged_round_N` keys, and
 * since `44090827` a manifest is DELETED at the merge that integrates it, so
 * every standing board's badge would have quietly gone blank the moment its
 * track retired. `spec.round.n` is the board's own record of which round it is
 * in, it survives the track, and a board with no spec simply has no badge.
 */
function roundBadge(id: string): NavItem["badge"] {
  const n = boardSpec(id)?.round.n;
  return n ? `round ${n}` : undefined;
}

export async function buildNav(): Promise<Nav> {
  const specs = listSpecs();
  const trackList = listTracks();

  // One section per family: the family page first (the gallery, or the
  // tokens for foundations), then its components by permalink.
  const families: NavSection[] = FAMILIES.map((family) => ({
    id: `family-${family}`,
    label: FAMILY_LABEL[family],
    href: `/design/library/${family}`,
    collapsed: true,
    items: [
      {
        href: `/design/library/${family}`,
        label:
          family === "foundations"
            ? "The tokens"
            : `The ${FAMILY_LABEL[family].toLowerCase()} gallery`,
        match: "exact" as const,
        note: FAMILY_NOTE[family],
      },
      ...familyItems(family).map((it) => ({
        href: it.href,
        label: it.title,
        id: it.entry.id,
        note: it.note?.for,
        // The entry's own mark ("new"/"updated"), set by the registry and
        // cleared by the Orchestrator at a window's close, so a Vercel build
        // (which has no git) prints the same badge as the dev server.
        badge: it.entry.badge,
        match: "exact" as const,
        keywords: [it.file ?? ""],
      })),
    ],
  }));

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
          note: r.board?.note ?? r.why,
          badge: r.shipped
            ? ("shipped" as const)
            : (roundBadge(r.id) ?? ("exploring" as const)),
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
        "Everything that binds or informs design work: the rules, the policies, the guidance, the rulings, the doctrine, the components with their contracts, the record.",
      sections: [
        {
          id: "start",
          label: "Start here",
          items: [
            {
              href: "/design/library",
              label: "Every component",
              match: "exact",
              note: "The index: every component with its for-line and its contracts; what binds you.",
            },
            {
              href: "/design/library/glossary",
              label: "Glossary",
              note: "The words this app uses, and the ones it retired.",
            },
          ],
        },
        {
          id: "rules",
          label: "Rules",
          href: "/design/library/rules",
          items: [
            {
              href: "/design/library/rules",
              label: "The bible",
              note: `${BIBLE.length} rules in ${BIBLE_GROUPS.length} groups, Will's; the whole of the design law.`,
              keywords: BIBLE_GROUPS.map((g) => BIBLE_GROUP_LABEL[g]),
            },
            {
              href: "/design/library/policies",
              label: "Policies and landmines",
              note: "The tests that hold a line across the tree, and the silent breakages a revert would cause.",
            },
            {
              href: "/design/library/guidance",
              label: "Guidance",
              note: "The craft stack and the skills: the default you leave on purpose.",
            },
            {
              href: "/design/library/rulings",
              label: "Will's rulings",
              note: "What Will said, verbatim and dated.",
            },
            {
              href: "/design/library/doctrine/design-system",
              label: "Doctrine: the design system",
              note: "The system doc, rendered: precedent, not law.",
            },
            {
              href: "/design/library/doctrine/marketing-content",
              label: "Doctrine: marketing",
              note: "The marketing content doc, rendered.",
            },
            {
              href: "/design/library/doctrine/program",
              label: "Doctrine: the program",
              note: "How a round works.",
            },
            {
              href: "/design/library/doctrine/agent-guide",
              label: "Doctrine: the agent guide",
              note: "CLAUDE.md, rendered.",
            },
            {
              href: "/design/library/doctrine/craft",
              label: "Doctrine: the craft skill",
              note: "The installed design-engineering skill, declared primary.",
            },
          ],
        },
        ...families,
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
        {
          id: "proposals",
          label: "Proposals",
          items: specs.map((s) => ({
            href: `/design/lab/proposals/${s.slug}`,
            label: s.title,
            id: s.slug,
            badge: "proposal" as const,
            note: s.status ?? "A board's argument; not law until Will rules.",
          })),
        },
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

/** The doctrine whose headings are worth an index entry, shallowest first. */
const INDEXED_DOCS: DocId[] = [
  "design-system",
  "marketing-content",
  "program",
  "agent-guide",
  "craft",
];

/**
 * ONE INDEX OVER EVERYTHING THE SHELL RENDERS (server-only, built beside the
 * nav and handed to the palette as props). Doc headings are taken at depth 2
 * on purpose: every `###` of five long documents would double the payload the
 * layout ships for hits a reader reaches through the page's own table of
 * contents anyway.
 */
export function buildSearchIndex(nav: Nav): SearchIndex {
  const out: SearchIndex = [];
  // The nav lists every component and every board as an item of its own, and
  // each of those already has a richer entry below (its file, its family, its
  // surface). The page entries are therefore added LAST and any whose href a
  // specific kind already claims is dropped, or "Glow" would answer twice.
  const pages = flatten(nav);

  for (const r of BIBLE)
    out.push(
      entry(
        "rule",
        r.id,
        `${r.n}. ${r.statement}`,
        `/design/library/rules/${r.id}`,
        r.why,
        [
          `bible ${r.n}`,
          String(r.n),
          BIBLE_GROUP_LABEL[r.group],
          r.status ?? "",
        ],
      ),
    );

  const galleryById = new Map(ITEMS.map((i) => [i.entry.id, i]));
  for (const c of COMPONENTS) {
    const g = galleryById.get(c.id);
    out.push(
      entry(
        "component",
        c.id,
        g?.title ?? componentTitle(c),
        `/design/library/${c.id}`,
        g?.note?.for ?? g?.entry.lede ?? c.file,
        [c.file, ...c.names, g ? FAMILY_LABEL[g.entry.family] : ""],
      ),
    );
  }

  for (const r of SANDBOX)
    out.push(
      entry(
        "board",
        r.id,
        r.title,
        `/design/lab/${r.id}`,
        r.board?.note ?? r.why,
        [SURFACE_LABEL[r.surface], ...(r.board?.tracks ?? [])],
      ),
    );

  for (const [id, file] of Object.entries(POLICY_TESTS))
    out.push(
      entry("policy", id, id, `/design/library/policies#${id}`, file, [file]),
    );

  for (const doc of ["design-system", "marketing-content"] as const) {
    const { path, title } = DOCS[doc];
    landminesOf(readDoc(path).body).forEach((mine, i) => {
      const text = mine.text.replace(/[*`]/g, "").trim();
      out.push(
        entry(
          "landmine",
          `${doc}-${i}`,
          clip(text, 90),
          "/design/library/policies#landmines",
          `★ in ${title}, under ${mine.under}`,
          [mine.under],
        ),
      );
    });
  }

  for (const doc of INDEXED_DOCS) {
    const { path, title } = DOCS[doc];
    for (const h of headingsOf(readDoc(path).body, 2))
      if (h.depth === 2)
        out.push(
          entry(
            "doc",
            `${doc}#${h.id}`,
            h.text,
            `/design/library/doctrine/${doc}#${h.id}`,
            title,
            [title],
          ),
        );
  }

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

  for (const h of listRulings())
    out.push(
      entry(
        "ruling",
        h.id,
        h.text,
        `/design/library/rulings#${h.id}`,
        "Will's ruling, verbatim",
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
  // href (every landmine points at the same anchor).
  const keys = new Set<string>();
  return out.filter((e) => {
    if (keys.has(e.key)) return false;
    keys.add(e.key);
    return true;
  });
}
