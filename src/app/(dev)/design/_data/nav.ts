import "server-only";

import { BIBLE, BIBLE_GROUP_LABEL, BIBLE_GROUPS } from "../rules/bible";
import {
  FAMILY_LABEL,
  familyItems,
  type GalleryFamily,
} from "../gallery/registry";
import { SANDBOX, SURFACE_LABEL, type Surface } from "../touchpoints";
import type { Nav, NavItem, NavSection } from "./catalog";
import { listSpecs, listTracks } from "./docs";
import { readTrackStates } from "./tracks";

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

const SURFACE_ORDER: Surface[] = ["guest", "host", "shared", "marketing"];

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

function roundBadge(track?: { rounds?: number }): NavItem["badge"] {
  return track?.rounds ? `round ${track.rounds}` : undefined;
}

export async function buildNav(): Promise<Nav> {
  const tracks = readTrackStates();
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
        items: items.map((r) => {
          const names = r.board?.tracks ?? [r.id];
          const rounds = Math.max(
            0,
            ...names.map((n) => tracks.get(n)?.rounds ?? 0),
          );
          return {
            href: `/design/lab/${r.id}`,
            label: r.title,
            id: r.id,
            note: r.board?.note ?? r.why,
            badge: r.shipped
              ? ("shipped" as const)
              : rounds
                ? roundBadge({ rounds })
                : ("exploring" as const),
            match: "prefix" as const,
          };
        }),
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
        {
          id: "history",
          label: "History",
          items: [
            {
              href: "/design/library/record",
              label: "The record",
              note: "Every ruling: what was decided, where it lives now.",
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
              label: "The lab kit",
              note: "The pieces every board composes: the dock, the stage, the frame, the compare.",
            },
          ],
        },
        { id: "tools", label: "Tools", items: TOOLS },
      ],
    },
  ];
}
