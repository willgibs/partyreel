import { SANDBOX, SURFACE_LABEL, type Surface } from "./touchpoints";

/**
 * THE WORKBENCH CATALOG (2026-06-19; reshaped in the library round, 2026-09-02):
 * the SINGLE source for the lab's contents and its navigation. Everything the
 * sidebar, search, and landing show comes from here, so adding a page is ONE
 * entry.
 *
 * Three zones under one shell. REFERENCE is the real shipped UI, synced by
 * construction (every page imports production source), plus the record of every
 * ruling. SANDBOX is the workshop: only the boards whose ruling is still open
 * stand here (derived from `touchpoints.ts`, so a board appears and retires with
 * its `board` field). LAB holds the diagnostics and runtime probes.
 */

export type Status = "shipped" | "exploring" | "reference";

export type LabEntry = {
  href: string;
  label: string;
  status: Status;
  /** A short catalog note (the "library card"). */
  note?: string;
};

export type LabGroup = { label: string; entries: LabEntry[] };

export type LabZone = {
  id: "reference" | "sandbox" | "lab";
  label: string;
  blurb: string;
  groups: LabGroup[];
};

const SURFACE_ORDER: Surface[] = ["guest", "host", "shared", "marketing"];

// Sandbox = the standing boards, grouped by the surface they prototype. A board
// with a shipped pick still standing (a mixed verdict) reads as shipped.
function sandboxGroups(): LabGroup[] {
  return SURFACE_ORDER.flatMap((surface) => {
    const items = SANDBOX.filter((r) => r.surface === surface);
    if (items.length === 0) return [];
    return [
      {
        label: SURFACE_LABEL[surface],
        entries: items.map((r) => ({
          href: `/design/c/${r.id}`,
          label: r.title,
          status: (r.shipped ? "shipped" : "exploring") as Status,
          note: r.board?.note ?? r.why,
        })),
      },
    ];
  });
}

export const ZONES: LabZone[] = [
  {
    id: "reference",
    label: "Reference",
    blurb:
      "The real shipped UI, synced by construction. Browse it here to tune it everywhere.",
    groups: [
      {
        label: "Live",
        entries: [
          {
            href: "/design/foundations",
            label: "Foundations",
            status: "reference",
            note: "Color, type, radius, motion, and elevation: the live design tokens.",
          },
          {
            href: "/design/components",
            label: "Components",
            status: "reference",
            note: "The real UI primitives, rendered from production source.",
          },
          {
            href: "/design/patterns",
            label: "Patterns",
            status: "reference",
            note: "The composed shared pieces (logo, empty states, dead ends).",
          },
          {
            href: "/design/compositions",
            label: "Compositions",
            status: "reference",
            note: "The real product components (event card, meter, share) from sample props.",
          },
          {
            href: "/design/marketing",
            label: "Marketing",
            status: "reference",
            note: "The marketing system and the shared section atoms, on the real cinema skin.",
          },
        ],
      },
      {
        label: "History",
        entries: [
          {
            href: "/design/rules",
            label: "The rules",
            status: "reference",
            note: "Every rule a test or a doc actually enforces, with its scope, its provenance and Will's verdict.",
          },
          {
            href: "/design/record",
            label: "The record",
            status: "reference",
            note: "Every ruling the lab has taken, one line each, with where the rule lives now.",
          },
        ],
      },
    ],
  },
  {
    id: "sandbox",
    label: "Sandbox",
    blurb:
      "The workshop: boards whose ruling is still open, grouped by the surface they prototype.",
    groups: sandboxGroups(),
  },
  {
    id: "lab",
    label: "Lab",
    blurb: "Diagnostics and runtime probes (gated, permanent).",
    groups: [
      {
        label: "Diagnostics",
        entries: [
          {
            href: "/design/motion",
            label: "Motion tuner",
            status: "reference",
            note: "Live-tune the --tune-* motion vars against replayable dummy animations, then bake.",
          },
          {
            href: "/design/stream-probe",
            label: "Stream probe",
            status: "reference",
            note: "The streaming-pattern probe against the real prod runtime.",
          },
          {
            href: "/design/boom",
            label: "Error boundary",
            status: "reference",
            note: "Throws on render to exercise the boundary chain + Sentry.",
          },
          {
            href: "/design/reel-parity",
            label: "Reel canvas styles",
            status: "reference",
            note: "Every reel style on the canvas engine, on shared props: play, frame-lock + scrub for a still, and export the mp4 via the on-device WebCodecs encoder.",
          },
        ],
      },
    ],
  },
];

/** Flat list for the sidebar search + the landing overview. */
export const ALL_ENTRIES = ZONES.flatMap((z) =>
  z.groups.flatMap((g) => g.entries),
);

export const COUNTS = {
  reference: ZONES[0].groups.reduce((n, g) => n + g.entries.length, 0),
  sandbox: ZONES[1].groups.reduce((n, g) => n + g.entries.length, 0),
};
