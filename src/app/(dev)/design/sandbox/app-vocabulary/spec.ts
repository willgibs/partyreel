import { defineExploration } from "@/components/lab/exploration";

import { WIDTH } from "./scene";

/**
 * THE APP'S SHARED VOCABULARY, ROUND ONE (2026-09-19).
 *
 * Will opened the app and the guest pages as unprotected, to be reconceived
 * from the foundation ("closer to a Frankenstein's monster", docs/design/
 * rulings.md). Two read-only explorations found the seams (docs/tracks/
 * orchestrator.md, "The app round's map"); this board draws the parts that
 * sit UNDER both shapes, once, so `app-shape` and `guest-shape` can assume
 * them rather than each inventing its own: what an empty section says, what a
 * route shows while it loads, the one tile grammar, the one bulk toolbar, the
 * gallery's own tile-size control (his ask), and the switch that asks first.
 *
 * ★ NOTHING HERE IS A NEW LOOK. Every option is drawn on the REAL components,
 * imported and never edited; where an option proposes a future merge this
 * round cannot make (no production byte), the same real, unchanged evidence
 * is drawn with a grouping or an excerpt that argues the case, captioned as
 * such. Measured on the galleries as wired: 240px tiles, the window's width.
 */
const DRAFT = defineExploration({
  id: "app-vocabulary",
  title: "The app's shared vocabulary",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: the shared parts under both shapes, drawn once. Five empty states, loading on two of seven routes, four tile grammars, two bulk toolbars, the gallery's tile-size control, and the confirm switch, each a decision on the real components.",
  },
  context:
    "Will, 2026-09-19: \"a better system from its foundation\" for an app that is \"closer to a Frankenstein's monster\". Seven decisions on the real host and guest components, at 1440 and 375, on the galleries now wired to the window at 240px tiles. Not in this round: any production byte.",
  bible: [12, 15, 19, 21, 22],
  asks: [
    {
      id: "empty-states",
      label: "Nothing here yet",
      question: 'How many ways should the product say "nothing here yet"?',
      context:
        "Five real components answer one interaction: EmptyState, EmptySectionTeaser, EventsEmptyTeaser, FeedSectionEmpty, TrashSection's paragraph. Likes hides a sixth, disagreeing with itself by timing. Drawn on the dashboard and the event page.",
      options: [
        {
          id: "primitive",
          label: "One primitive",
          means: "Every one becomes EmptyState. Consistent, but the zero-events hero loses its ghost imagery and its CTA's prominence.",
        },
        {
          id: "tiers",
          label: "Three ratified tiers",
          means: "A neutral line, the ratified card-less icon section (Will's own \"Reel treatment\"), and a hero with imagery and a CTA for zero events alone.",
        },
        {
          id: "statusquo",
          label: "The status quo, written down",
          means: "Nothing merges; the five (six, counting Likes' own mismatch) stay, named as a rule for which to reach for next.",
        },
      ],
      recommended: "tiers",
      because:
        "The zero-events moment is the one place imagery and a loud CTA earn their keep, so folding it into a bare icon costs the app's strongest growth push. Three tiers keep that hero, retire Likes' second treatment, and give a future empty state one of three doors instead of a sixth original.",
      overrule:
        "If one component everywhere is worth more than the hero's imagery, primitive is the simpler system to hold in your head.",
      lands:
        "Every \"nothing here yet\" moment across the host app and the personal feeds, and whether EmptyState or FeedSectionEmpty is the one that survives.",
      configs: [WIDTH],
    },
    {
      id: "loading",
      label: "Loading",
      question: "Should a route show a skeleton while it loads, and which ones?",
      context:
        "Two of seven host routes carry a loading.tsx (Dashboard, the event page). A third, the Reel Studio, awaits the same shape of read and has neither, freezing the previous screen. The other four are instant or already own their own wait.",
      options: [
        {
          id: "everywhere",
          label: "One primitive, everywhere",
          means: "All seven routes get the shared skeleton, whether or not they ever really wait on anything.",
        },
        {
          id: "none",
          label: "None",
          means: "Both existing skeletons retire; every route's shell paints at once and only a genuine wait gets its own scoped placeholder.",
        },
        {
          id: "asneeded",
          label: "One primitive, as needed",
          means: "One shared skeleton, wired to exactly the routes with a real pre-paint wait: Dashboard, the event page, and the Studio.",
        },
      ],
      recommended: "asneeded",
      because:
        "Dashboard, the event page and the Studio share one real trait the other four do not: a genuine wait before first paint. One shared primitive belongs on exactly those three, named as a rule, rather than spread to routes already instant or stripped from the two that need it.",
      overrule:
        "If the two existing skeletons read as theater on a route opened dozens of times a day, none is the honest high-frequency answer (bible 12).",
      lands:
        "Whether a seventh loading.tsx gets written for the Studio, and whether the two that exist today survive as one shared component.",
      configs: [WIDTH],
    },
    {
      id: "tile-grammar",
      label: "One tile, one grammar",
      question: "Should the product's four tile grammars share one component?",
      context:
        "Hover-reveal chips on the host grid, an always-on bar on the bin, tap-to-select on the review queue, and no chrome on the personal feeds: four behaviours for one idea, a tile with something to do to it. No production byte moves this round.",
      options: [
        {
          id: "mode",
          label: "One component, a mode",
          means: "One component takes a mode prop (hover / always / select / none) and every caller passes its own. The widest convergence, and the hardest single file to read.",
        },
        {
          id: "tree",
          label: "A written decision tree",
          means: "The four stay separate files; a written rule says which grammar a new surface inherits. Cheapest, and the least DRY.",
        },
        {
          id: "twotwo",
          label: "Two unified, two distinct",
          means: "The two button-row overlays (host, bin) merge into one TileActionRow; whole-tile select and the chrome-less feeds stay their own, genuinely different.",
        },
      ],
      recommended: "twotwo",
      because:
        "Host and bin already share one grid and differ only in their overlay's trigger and its actions, a real merge. Select swaps the whole grid component and chrome-less is the absence of an overlay: forcing either into the button-row's shape would be a mode prop standing in for a switch statement.",
      overrule:
        "If a future surface needs a fifth grammar, one component with a mode scales without a new file; two unified and two distinct adds one every time.",
      lands:
        "Whether HostTileOverlay and BinTileOverlay become one file, and what a future tile grammar gets: a new component, or a new mode.",
      configs: [WIDTH],
    },
    {
      id: "bulk-toolbar",
      label: "The bulk toolbar",
      question: "Should the bulk toolbar speak in words or in icons?",
      context:
        "Review's bulk bar spells out Hide and Approve; the Gallery's spells nothing, five icon-only chips because \"the four fit the 375px bar\", its own comment. Both do the same shape of job over a selected set, at the width each ships at.",
      options: [
        {
          id: "label",
          label: "Words, on both bars",
          means: "Every action gets its word back. Review already fits; the Gallery's five, plus All, count and Cancel, will not fit its own 375px bar.",
        },
        {
          id: "icon",
          label: "Icons, on both bars",
          means: "Every action loses its word, backed by the native title tooltip already used elsewhere. The one grammar that fits the Gallery's five at its real width.",
        },
        {
          id: "hybrid",
          label: "Hide/Show worded, the rest icons",
          means: "The one binary, reversible verb keeps its word everywhere; reel, like, download and delete stay icon-only, already learned from the tile.",
        },
      ],
      recommended: "icon",
      because:
        "The two bars are not symmetric: Gallery already carries five actions in the row Review carries two, and its own code says why it is icon-only. The grammar that survives both real widths is the icon one, and a host meets every one of these icons on the tile itself before ever opening a bulk bar.",
      overrule:
        "If Approve/Hide are worth spelling out because Review IS the moderation screen, hybrid keeps just those two worded and lets the crowded bar alone go icon-only.",
      lands:
        "ReviewActions and GalleryBulkBar's shared vocabulary, and every bulk bar a future surface adds.",
      configs: [WIDTH],
    },
    {
      id: "gallery-controls-home",
      label: "The gallery's controls",
      question: "Where does the tile-size control live, and what shape does it take?",
      context:
        "Will asked for tile size as an adjustable option, near our filter/sort/controls. Both surfaces carry a control row: the guest album's Download all, the host's Download plus Select. The knob is --album-column; the steps are 180, 240, 300.",
      options: [
        {
          id: "segmented",
          label: "A segmented control, alone",
          means: "A three-glyph control joins the existing row on both surfaces, alone. Every step is one press away, nothing hides behind a click.",
        },
        {
          id: "cluster",
          label: "The same, with room reserved",
          means: "The same control, plus two reserved, non-interactive slots naming Sort and Filter, so the row already reads as a group the day those exist.",
        },
        {
          id: "popover",
          label: "One button, a panel",
          means: "One small button opens a panel holding the three steps. Costs the row the least width, at the price of a second tap and nothing visible to compare.",
        },
      ],
      recommended: "cluster",
      because:
        "Will's own question named sort and filter in the same breath as tile size (\"we could open a ton of app exploratory tracks\"); planting the seam now costs two static pills and saves a second relayout the day they land. Every option previews fully on press, which a hidden popover does not.",
      overrule:
        "If the measured row is already tight at 375 with the two buttons it carries today, popover is the one shape guaranteed to fit.",
      lands:
        "The Gallery section header's action slot and the guest album's control row, and the shape any future gallery control joins.",
      configs: [WIDTH],
    },
    {
      id: "gallery-controls-persistence",
      label: "How the choice persists",
      question: "How should a picked tile size be remembered?",
      context:
        "The control just answered, drawn wearing it, still has to decide what happens on the next visit: nothing, this device, or this account. A guest has no account at all; a host has one on every device.",
      options: [
        {
          id: "session",
          label: "Not at all",
          means: "Nothing is saved. Every visit opens at 240, the wired default.",
        },
        {
          id: "device",
          label: "This device",
          means: "Saved to localStorage, per browser. A returning guest or host keeps their own last pick there; nobody else's view changes.",
        },
        {
          id: "account",
          label: "This account, synced",
          means: "Saved to the host's profile, syncing across their devices. Costs a column and a migration; a guest still gets nothing, having no account.",
        },
      ],
      recommended: "device",
      because:
        "Tile size is a personal viewing preference, not an event setting, so it should never write to the event row or need a sign-in. localStorage already works identically for an anonymous guest and a signed-in host, and it costs nothing: no migration, no RPC, no recurring service.",
      overrule:
        "If a host's own pick is worth carrying between their phone and their laptop, account is the real column once tile size proves worth persisting that far.",
      lands:
        "Whether the control reads and writes localStorage alone or needs a profile column, and whether a guest's pick can ever differ from a host's own.",
      after: { ask: "gallery-controls-home" },
      configs: [WIDTH],
    },
    {
      id: "confirm-switch",
      label: "The confirm switch",
      question: "How should a host tell which switches ask before they flip?",
      context:
        "Three switches, one settings card: Accepting uploads flips at once; Review uploads and Require accounts each open a confirm dialog, via one hand-rolled setTimeout dodge, written twice. Nothing says which is which before it is tapped.",
      options: [
        {
          id: "label",
          label: "A worded description",
          means: "The FormDescription leads with \"Asks to confirm.\" Costs nothing to ship, reads only if the host stops to read the paragraph.",
        },
        {
          id: "icon",
          label: "A small glyph",
          means: "A glyph sits beside the label of any switch that will ask. Scannable without reading the description.",
        },
        {
          id: "primitive",
          label: "A shared ConfirmSwitch",
          means: "One component owns the glyph and the deferred-open dance once; the two hand-rolled copies in uploads-section.tsx retire into it.",
        },
      ],
      recommended: "primitive",
      because:
        "The setTimeout dance is a symptom of one race (radix's dismissable layer), duplicated by hand rather than named once; a primitive fixes the system the two switches are both working around, not just the page they happen to sit on, and every future consequential switch inherits the cue for free.",
      overrule:
        "If the two switches never grow a third sibling, icon alone gets the visible cue without writing a new component.",
      lands:
        "Whether a ConfirmSwitch primitive exists at all, and every switch on the site that would reach for it next.",
      configs: [WIDTH],
    },
  ],
});

/**
 * ★ ONE WIDTH KNOB, NOT SEVEN. `defineExploration` flattens every decision's
 * `configs` into the board's controls, so the shared `WIDTH` knob arrives once
 * per decision and the dock would draw it seven times (body-type found this
 * first, 2026-09-18). Dedupe by id once, here, rather than in the constructor.
 */
export const APP_VOCABULARY: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
