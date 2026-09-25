import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * FROM THE REEL TO A CLIP, ROUND TWO: THE BENCH, WITH ITS MOMENTS AND LOOKS
 * LIVING INSIDE IT (2026-09-25).
 *
 * Round one answered whole (docs/reviews/reel-cut.json): the creator is a room
 * of its own (`entry=room`), a workbench at a laptop (`room=bench`), the looks
 * a wall of fourteen (`looks=wall`) and the moments a pool never over the clip
 * (`moments=pool`), with his note on that last one opening this round: "The
 * media selection and reel style selector should both be redesigned into the
 * previously selected workbench idea, not feel like completely detached
 * config experiences on the same clip." The word is "clip" from now on, in
 * every line a reader meets; the folder keeps its id.
 *
 * ★ ONE ASK, `bench`, DRAWN AS WHOLE CREATORS. Three directions, each the
 * laptop and the phone together, because his note holds in a hand too: the
 * panel holding both (`column`), each where it acts (`strip`), and the clip
 * wearing its own look (`dial`). Round one's ten asks are gone from `asks` on
 * purpose (a round replaces its questions rather than accreting them); the
 * ledger keeps their answers.
 *
 * ★ GROUND, NEVER ASKED, DRAWN AS HE AMENDED IT. The bench's frame (the clip
 * at full height, a panel beside it, the filmstrip and tray below); a hidden
 * photograph in the host's pool dimmed with "Hidden · Show" (`blocked`, the
 * `maker` knob); the export's minute as the clip's own frame stacking and
 * counting (`wait`); the finish with Share leading, Save opening the
 * platform's options and Add to event behind a confirm, every action leaving
 * her on the finish with its done state (`finish`); the free mark quieter but
 * findable (`mark`); a device with no encoder keeping its greyed button and
 * explaining on a tap (`noencode`); and no sound anywhere (`sound`). The
 * `stage` knob walks each direction through all of it.
 *
 * The nearest open asks are `guest-capture.follow` and `reel-front`'s round
 * two (`signature`, `badge`); nothing here asks either.
 */

/** The creator's moment, so each direction is seen past picking too. */
const STAGE: Control = {
  id: "stage",
  label: "The creator at",
  options: [
    { id: "picking", label: "Picking, the question" },
    { id: "making", label: "Making it, settled" },
    { id: "finished", label: "Finished, settled" },
    { id: "adding", label: "Add to event, settled" },
    { id: "noencode", label: "No encoder, settled" },
  ],
  default: "picking",
};

/** Which look the clip is wearing, so each direction shows a pick landing. */
const LOOK: Control = {
  id: "look",
  label: "The look it wears",
  options: [
    { id: "classic", label: "Cinematic" },
    { id: "mono", label: "Noir" },
    { id: "polaroid", label: "Polaroid stack" },
  ],
  default: "classic",
};

/** Which fill the clip started from, which changes what is lit. */
const FILL: Control = {
  id: "fill",
  label: "Started from",
  options: [
    { id: "reel", label: "The reel's picks" },
    { id: "mine", label: "Only mine" },
    { id: "all", label: "Everything" },
  ],
  default: "reel",
};

/** Paid or free: whether Add to event exists, and whether the mark does. */
const PLAN: Control = {
  id: "plan",
  label: "The event",
  options: [
    { id: "paid", label: "Paid, so a clip can go back" },
    { id: "free", label: "Free, so it carries the mark" },
  ],
  default: "paid",
};

/** A guest never meets a hidden photograph; the host meets two. */
const MAKER: Control = {
  id: "maker",
  label: "Who is making it",
  options: [
    { id: "guest", label: "Priya, a guest" },
    { id: "host", label: "Maya, the host" },
  ],
  default: "guest",
};

const DRAFT = defineExploration({
  id: "reel-cut",
  title: "From the reel to a clip",
  round: {
    n: 2,
    date: "2026-09-25",
    changed:
      "One ask, on his note: where the moments and the looks live inside the bench he picked. Three directions, each a whole creator at 1440 and 375; every other round-one answer is drawn as ground, as he amended it, on the stage knob.",
  },
  context:
    "Priya is at Maya and Jay's wedding and has tapped Make your own. Her clip renders on her phone and leaves as a file; nothing is stored. The bench is settled: the clip at full height, a panel beside it, the filmstrip and tray below. Every frame of the clip is the real engine over the 23 photographs she may use.",
  carried: [
    {
      id: "tray",
      question:
        "What does the tray hold, now that moments and looks live on the bench?",
      taken:
        "Three chips, Length, Layout and Opening, each showing its value and opening a small menu, the same in every direction.",
      overrule:
        "If a setting deserves the bench itself, name it and it joins the panel in every direction.",
    },
    {
      id: "finish-laptop",
      question: "Where does the finish sit at a laptop?",
      taken:
        "In the panel beside the clip, which keeps playing at full height, with Back to editing above it; in a hand it is its own screen.",
      overrule:
        "If the finish should be its own screen at a laptop too, the hand's screen is drawn at 1440 instead.",
    },
    {
      id: "mark-line",
      question: "How quiet is the free mark's line now?",
      taken:
        "One micro line under the mark's corner: a guest's says free events mark their clips and Pro events don't; the host's offers the upgrade.",
      overrule:
        "If even that reads as a pitch inside her clip, it moves to the finish, beside Save.",
    },
    {
      id: "noencode-tap",
      question: "What does a tap on the greyed Make your own say?",
      taken:
        "A small bubble above it, gone after a few seconds: this browser can't make clips, so open the album on another device to make one.",
      overrule:
        "If the bubble should offer a way forward, it gains a Copy link to open the album somewhere that can.",
    },
  ],
  asks: [
    {
      id: "bench",
      label: "Moments and looks",
      question:
        "Where should the moments and the looks live inside the clip's workbench?",
      context:
        "Round one drew them as two panels the tray swapped, config screens detached from the clip. Each option here is a whole creator, the phone form part of it: the laptop on top, two moments of the phone beneath, every count read off the frame.",
      options: [
        {
          id: "column",
          label: "Both in the panel, one scroll",
          means:
            "The panel beside the clip holds the fourteen looks above the moments, nothing to open. In a hand the same column scrolls under the clip, which gives way.",
        },
        {
          id: "strip",
          label: "Moments on the strip, looks beside",
          means:
            "The filmstrip becomes the album, the clip's moments lit and numbered first; the panel is the wall of looks. In a hand: the clip, the strip, a row of looks.",
        },
        {
          id: "dial",
          label: "Looks on the clip, the album beside",
          means:
            "Swipe the clip, or turn the dial of names under it, to change its look; the panel is the album. In a hand the album rises under the clip from the +.",
        },
      ],
      recommended: "strip",
      because:
        "Each lives where it acts: the filmstrip the bench already has becomes the album, so choosing moments stops being a screen at all, and the fourteen looks stand beside the clip they change. At a laptop nothing scrolls; in a hand it is all one screen.",
      overrule:
        "If fourteen at once matters in a hand too, or a big album wants a grid, the panel holding both keeps the wall and the grid at every size.",
      lands:
        "Where a clip's moments and looks are chosen at each size, and whether choosing either ever opens a screen of its own.",
      configs: [STAGE, LOOK, FILL, PLAN, MAKER],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID. `defineExploration` already dedupes by id; this filter is
 * the one every board over this world carries (deduping twice is deduping
 * once), kept so the day the constructor's own filter moves, nothing here
 * draws a knob twice.
 */
export const REEL_CUT: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
