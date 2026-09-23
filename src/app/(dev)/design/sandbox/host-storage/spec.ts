import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHERE THE LARGEST FILES ARE, ROUND ONE (Will, 2026-09-22).
 *
 * His words, verbatim: "media size per item should be included for hosts
 * somewhere, so they know how to get rid of the largest files first if
 * needed. Should be a separate view than the media cards themselves because
 * including the storage on each card makes the gallery less beautiful, and
 * including it in the lightbox exclusively makes the host have to hunt
 * through each media item individually." It follows his ruling that no plan
 * change may leave a host storing more than the new plan's cap: "show them
 * their total storage used now and ask them to delete media to get under the
 * storage cap of their selected pro plan before being able to switch."
 *
 * ★ A CATALOG, NOTHING WIRING PRODUCTION. `storage-guard` is building the
 * server-side check and a plain refusal right now, in parallel; this board
 * draws where a host finds sizes, how they free space, and the plan sheet's
 * two new faces. No button here starts Checkout, opens the real billing
 * portal, or calls a Server Function — every act is local, resolved-promise
 * state (`storage-list.tsx`), the same convention `host-curation` set.
 *
 * ★ THE FACTS EVERY OPTION IS DRAWN OVER (`billing-caps.md`,
 * `lifecycle-recovery.md`). The cap counts ACTIVE bytes (non-removed media in
 * non-deleted events), so a Remove frees room at once; Pro is 100 GB / 500 GB
 * / 2 TB, monthly or yearly, and passes stack; the standby (Deleted) budget is
 * one multiple of the cap, so a shrink purges its oldest items sooner; per-
 * item sizes are stored (`media.file_size_bytes`) but no screen shows one
 * today; the album's View menu keeps Sort disabled ("Coming soon"); a Pro
 * host's plan sheet shows only Manage billing; the over-cap grace banner says
 * "largest files first" with no way to find one.
 *
 * ★ NEVER ASKED AGAIN, EACH NAMED WHERE IT IS CARRIED. `host-curation` ruled
 * the bulk-act toast (Undo) and what a tap opens; this board's own Remove
 * bulk act reuses that toast rather than re-litigating it, and no row here
 * opens a viewer. `export-flow` owns how a download reads, its cap and its
 * failure states; the Download entry beside Remove hands off to it and stops
 * there. `media-viewer`'s open `holds` question (what stands beside a photo-
 * graph) is why no size is drawn in a lightbox here. `reel-host`'s own
 * question is whether the reel ever explains a waiting queue; storage is not
 * that queue and is not reasked here. The ruled `app-pricing` row keeps every
 * pricing door on the ONE sheet (decisions 4 and 5 stay inside it, never a
 * second surface); the ruled `app-vocabulary` row keeps every view option
 * inside the ONE View menu (the `album` option below adds a group to it,
 * never a second button).
 *
 * ★ THE FIXTURES ARE THIS BOARD'S OWN (`fixtures.ts`), not
 * `sandbox/gallery-fixtures.ts`, which still mints a nameless anonymous
 * uploader the identity reshape retired — an impossible person on a screen
 * whose whole subject is "who added it." One host, four events (three
 * clients' weddings she shoots and hosts herself, plus her own kid's
 * birthday), 64 real items, real byte counts: a handful of near-the-ceiling
 * 4K files account for most of the 110.8 GB total, which is the whole point
 * — the largest files are the story, not the count of small ones.
 */

const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

const DRAFT = defineExploration({
  id: "host-storage",
  title: "Where the largest files are",
  round: {
    n: 1,
    date: "2026-09-22",
    changed: "First round.",
  },
  context:
    "A host near a cap cannot find what is filling it: sizes are stored but no screen shows one. Five decisions, drawn over one wedding videographer's account at 110.8 GB across four events, on the shipped Plan card, storage meter, grace banner, View menu and pricing sheet.",
  bible: [1, 7, 12, 15, 21, 22],
  carried: [
    {
      id: "row-contents",
      question: "What should a row in the size list carry?",
      taken: "A thumbnail, the size (and duration for video), the event, who added it, and the date.",
      overrule: "Drop the uploader and the date if the row should read faster with less.",
    },
    {
      id: "bulk-remove",
      question: "How does a host act on several large items at once?",
      taken: "Multi-select with a Remove to Deleted bulk action, on the same bar host-curation ships.",
      overrule: "A one-at-a-time Remove is simpler if bulk feels premature on this screen.",
    },
    {
      id: "download-first",
      question: "Should a host be offered a copy before removing anything?",
      taken: "A Download entry sits beside Remove; the download itself is export-flow's own flow.",
      overrule: "Skip it if Remove to Deleted's own 30-day window already reads as the safety net.",
    },
    {
      id: "deleted-shrinks",
      question: "Does the Deleted bin's own budget change when a host shrinks their plan?",
      taken: "One line says Deleted only holds items up to the new plan's size, so older ones purge sooner.",
      overrule: "Leave it unsaid if the standby sweep already covers it quietly enough.",
    },
  ],
  asks: [
    {
      id: "where",
      label: "Where sizes live",
      question: "Where should a host see each item's size?",
      context:
        "Sizes are stored but shown nowhere. A host near a cap needs to find the largest files fast, from wherever the cap already comes up: the Plan card, the meter's popover, a refusal, the grace banner.",
      options: [
        {
          id: "account",
          label: "An account-level Storage page",
          means: "Every live event's items in one place, reached from the Plan card, the meter and any refusal.",
        },
        {
          id: "album",
          label: "A details list in the View menu",
          means: "Per event, from the album's own View menu; the largest-first sort finally has somewhere to lead.",
        },
        {
          id: "sheet",
          label: "A Storage sheet from the meter",
          means: "The meter's popover gains View details, opening the same list as a sheet instead of a page.",
        },
      ],
      recommended: "account",
      because:
        "The cap is account-wide, so the one screen that explains it should be too; a per-event list sends a host hunting across events for the same total the meter already knows.",
      overrule:
        "If a host almost always has one event live, the album's own list is one tap closer and never leaves it.",
      lands: "Whether Storage gets a page of its own, and what every surface that mentions the cap links to.",
      configs: [SCREEN],
    },
    {
      id: "order",
      label: "The order",
      question: "Should the list read largest-first across every event, or grouped by event?",
      context:
        "Freeing space for a plan switch favours one flat ranking; browsing what one event cost favours a total per event. The album option is one event already, so only the account-wide surfaces truly choose here.",
      options: [
        {
          id: "flat",
          label: "Largest first, every event mixed",
          means: "One ranked list, so the files actually filling the cap sit at the top regardless of event.",
        },
        {
          id: "grouped",
          label: "Grouped by event, largest within each",
          means: "Each event's own total first, its heaviest items under it, before diving into any one of them.",
        },
      ],
      recommended: "flat",
      because:
        "Freeing space for a plan switch is about the biggest offenders, not about any one event; a flat rank gets a host to them in one glance.",
      overrule:
        "If a host thinks in events first, grouping keeps the total-per-event story a flat rank buries.",
      lands: "How the account-wide list reads, and whether an event's own total is ever the headline.",
      after: { ask: "where" },
      configs: [SCREEN],
    },
    {
      id: "goal",
      label: "The goal",
      question: "How should freeing space read when a smaller plan is the reason a host is here?",
      context:
        "A host who tapped a Pro size that does not fit lands on this same list. Nothing today distinguishes that visit from ordinary tidying, or tells them when they have freed enough.",
      options: [
        {
          id: "live",
          label: "A live count that finishes the switch",
          means: "A sticky strip counts down as items are selected for Remove; at zero its own button finishes the switch.",
        },
        {
          id: "plain",
          label: "Plain totals, the plan named",
          means: "A static line states what is stored, what the plan holds and the gap; switching happens back in the sheet.",
        },
      ],
      recommended: "live",
      because:
        "The whole reason a host is on this screen is to close one gap; watching the count reach zero is the confirmation, and finishing the switch on the spot saves a second trip.",
      overrule:
        "If Storage should only ever find files and never sell a plan, the plain line keeps the two rooms honestly separate.",
      lands: "Whether the list ever knows why a host is looking at it, and whether a switch can finish there.",
      after: { ask: "order" },
      configs: [SCREEN],
    },
    {
      id: "refusal",
      label: "The refusal",
      question: "How should the pricing sheet refuse a size that would not fit?",
      context:
        "His ruling: a plan change may never leave a host storing more than the new cap. Today nothing enforces or explains that; tapping a smaller Pro size just starts checkout.",
      options: [
        {
          id: "inline",
          label: "The tapped card itself flips to the refusal",
          means: "In place, over the same size: what is stored, what it holds, the gap, then the two ways out.",
        },
        {
          id: "swap",
          label: "A dedicated refusal screen replaces the grid",
          means: "The whole sheet swaps to one focused screen; a back arrow returns to the prices.",
        },
        {
          id: "banner",
          label: "A banner up front, the size just disabled",
          means: "The sheet opens already warning which size would not fit; that one is greyed rather than tappable.",
        },
      ],
      recommended: "inline",
      because:
        "The refusal belongs exactly where the host reached for the wrong size, with the least travel back to the one that fits or to the file list.",
      overrule:
        "If a refusal deserves more room than a card can hold, the swap gives the numbers and the two ways out a full screen.",
      lands: "What tapping an undersized plan does, and the numbers and ways out every option has to carry.",
      after: { ask: "goal" },
      configs: [SCREEN],
    },
    {
      id: "prices",
      label: "The six prices",
      question: "How should a Pro host's six prices sit in the sheet, including a size that does not fit?",
      context:
        "A Pro host opening the sheet sees only Manage billing today; every size and interval change happens blind, inside Stripe's own portal.",
      options: [
        {
          id: "rows",
          label: "Three rows, one interval toggle above",
          means: "The sizes stacked as compact rows; Monthly/Yearly above changes every price at once.",
        },
        {
          id: "cards",
          label: "Three cards, the current one held",
          means: "The same ink PlanCard the sheet already uses, one per size, the current plan marked Your plan.",
        },
        {
          id: "matrix",
          label: "A small grid, every price already visible",
          means: "Sizes down, Monthly and Yearly across: all six numbers at once, no toggle to miss one behind.",
        },
      ],
      recommended: "matrix",
      because:
        "Six honest numbers fit in one glance with no toggle hiding four of them, and the size that does not fit wears whichever refusal decision 4 chose, right inside the grid a host is already scanning.",
      overrule:
        "If six numbers at once reads as a spreadsheet, the toggle keeps the sheet to three at a time, closer to how it reads today.",
      lands: "Whether Pro ever compares its own sizes inside the sheet, and how the size that does not fit sits among the rest.",
      after: { ask: "refusal" },
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT. `defineExploration`
 * flattens every decision's `configs` into the board's controls, so the
 * screen knob all five decisions share would arrive five times: the dock
 * would draw it five times and React would warn on the duplicate key.
 */
export const HOST_STORAGE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
