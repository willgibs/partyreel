import { defineExploration } from "@/components/lab/exploration";

import { WIDTH } from "./scene";

/**
 * THE APP'S SHARED VOCABULARY, ROUND TWO: WHERE THE CONTROLS LIVE
 * (2026-09-20).
 *
 * Round one's seven decisions are ruled (docs/reviews/app-vocabulary.json;
 * verbatim in docs/design/rulings.md, "the sixth batch") and `vocab-wiring`
 * wired six of them; the tile-size cluster (`gallery-controls-home=cluster`)
 * shipped as the interim shape, with his own crowding note carried forward:
 * "with download, tile size, sort, filter, and select, it looks like it's
 * starting to get crowded, and we may need to rethink where all of these
 * actions live. Am I overriding anything with this answer, or does this
 * work with the glass?" (Answered by the desk lane: no override, the glass
 * rules the pane the cluster sits inside, never what fills it.)
 *
 * ★ ROUND ONE'S SEVEN ASKS ARE GONE FROM `asks` ON PURPOSE (the `profile-page`
 * precedent: a round replaces its questions rather than accreting them). The
 * ledger keeps their answers for ever; this board only ever carries what is
 * still open, which this round narrows to one.
 *
 * ★ NOTHING HERE IS A NEW LOOK, and this round draws on the WIRED surface
 * rather than round one's stand-in: every option is the real, shipped Album
 * header (`event-gallery.tsx`, `vocab-wiring`, 2026-09-20) with its real
 * leaf components (`TileSizeControl`, `GalleryDownloadAllButton`,
 * `GallerySelectButton`, `FeedSectionHeader`) imported and never edited.
 * Where an option opens a real Radix-portalled surface (a menu, the
 * responsive Sheet), the portal would leave this board's frame entirely
 * (`frame.tsx`'s own note; round one's `gallery-controls.tsx` found it
 * first for a Popover), so that surface is reproduced open, on its shipped
 * floating-layer tokens, never mounted live. The guest album's row is NOT
 * drawn here (`guest-shape` round two's, the dock).
 */
const DRAFT = defineExploration({
  id: "app-vocabulary",
  title: "The app's shared vocabulary",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round one's seven decisions are ruled; vocab-wiring wires six, the tile-size cluster the interim shape. This round drops all seven and asks the one he named back: where the crowded five (download, tile size, sort, filter, select) live, on the wired header itself.",
  },
  context:
    'Will, on the wired cluster (gallery-controls-home=cluster, 2026-09-20): "with download, tile size, sort, filter, and select, it looks like it\'s starting to get crowded, and we may need to rethink where all of these actions live." One decision on the real, wired Album header (event-gallery.tsx) at 1440 and 375: the row as shipped, a View menu, a control sheet, or the sticky cards row (event-cards-row.tsx) that already condenses on scroll. The guest album\'s row is guest-shape round two\'s, not drawn here; nothing reaches a Server Function.',
  bible: [12, 15, 19, 21, 22],
  asks: [
    {
      id: "controls-home",
      label: "Where the controls live",
      question:
        "Where should the host gallery's crowded controls (download, tile size, sort, filter, select) live?",
      context:
        'His own note on the wired row: "it looks like it\'s starting to get crowded, and we may need to rethink where all of these actions live." Drawn on the real Album header (event-gallery.tsx) at 1440 and 375, Add photos and Deleted untouched.',
      options: [
        {
          id: "row",
          label: "The row, as wired",
          means:
            "Every control stays inline: Add photos, Download, the tile-size cluster with its two reserved slots, Select, Deleted. The crowding is exactly what ships today.",
        },
        {
          id: "view-menu",
          label: "One View menu",
          means:
            "Tile size, Sort and Filter move behind one button; Download and Select stay the row's only two verbs.",
        },
        {
          id: "sheet",
          label: "A sheet, phone only",
          means:
            "The view controls move into the ruled responsive Sheet at 375; the row is untouched at 1440, where there is room.",
        },
        {
          id: "pills",
          label: "The sticky pill row",
          means:
            "Every control rides down into the cards row that already condenses on scroll; the header keeps only its label and count.",
        },
      ],
      recommended: "view-menu",
      because:
        'His own first instinct named it: "nest this under a parent menu." One View button holds tile size, Sort and Filter at both widths, so the row behaves the same on every device, and it is the one shape built to take his next view config without another relayout.',
      overrule:
        "If only a phone is truly tight, the sheet costs less: it reuses the ruled primitive and leaves the desk row exactly as shipped.",
      lands:
        "The Gallery header's action slot everywhere it appears, and the shape a future view control (a date filter, a fourth tile step) joins.",
      configs: [WIDTH],
    },
  ],
});

/**
 * ★ ONE WIDTH KNOB, NOT DOUBLED. `defineExploration` flattens the one
 * decision's `configs` into the board's controls; this filter is a no-op
 * with a single ask but stays for the same reason round one carried it: the
 * next ask this board ever grows inherits the dedupe for free.
 */
export const APP_VOCABULARY: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
