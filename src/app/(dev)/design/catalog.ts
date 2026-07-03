import { SURFACE_LABEL, type Surface, TOUCHPOINTS } from "./touchpoints";

/**
 * THE WORKBENCH CATALOG (2026-06-19) — the SINGLE source for the lab's contents
 * and its navigation. Everything the sidebar, search, and landing show comes from
 * here, so the tool stays synced and adding any UI is ONE entry.
 *
 * Two halves under one shell (Will's vision): REFERENCE is the real shipped UI,
 * synced by construction (Foundations + Components import production source);
 * SANDBOX is prototype explorations of new designs before integrating. LAB holds
 * the diagnostics. Sandbox groups derive from `touchpoints.ts` (by surface), so a
 * new exploration appears here automatically.
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

// Sandbox = the touchpoint explorations, grouped by the surface they prototype.
// Shipped (a direction landed in production) vs exploring (still a sandbox idea).
function sandboxGroups(): LabGroup[] {
  return SURFACE_ORDER.flatMap((surface) => {
    const items = TOUCHPOINTS.filter((t) => t.surface === surface);
    if (items.length === 0) return [];
    return [
      {
        label: SURFACE_LABEL[surface],
        entries: items.map((t) => ({
          href: `/design/c/${t.id}`,
          label: t.title,
          status: (t.decision !== undefined
            ? "shipped"
            : "exploring") as Status,
          note: t.note,
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
        ],
      },
      {
        label: "Showcases",
        entries: [
          {
            href: "/design/system",
            label: "Composed screens",
            status: "reference",
            note: "The system read across five surfaces.",
          },
          {
            href: "/design/demo",
            label: "Cohesive demo",
            status: "reference",
            note: "Shipped pieces composed together on one screen set.",
          },
        ],
      },
    ],
  },
  {
    id: "sandbox",
    label: "Sandbox",
    blurb:
      "Prototype explorations of new designs, built before integrating into the data-heavy app.",
    groups: sandboxGroups(),
  },
  {
    id: "lab",
    label: "Lab",
    blurb: "Diagnostics and runtime probes (gated, permanent).",
    groups: [
      {
        label: "Prototypes",
        entries: [
          {
            href: "/design/event-feed",
            label: "Event feed",
            status: "exploring",
            note: "Feel + ratify the stacked-feed pill behavior, the swap transition, and the urgency-reorder (+ the motion trial).",
          },
        ],
      },
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
            href: "/design/reel-spike",
            label: "Reel engine spike",
            status: "exploring",
            note: "Plan-A gate: one canvas draw fn as live player + WebCodecs h264 encode, verdict on real devices (temporary; dies with the verdict).",
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
