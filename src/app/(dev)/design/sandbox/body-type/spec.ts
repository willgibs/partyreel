import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE BODY AND LABEL LADDER, AS DECISIONS (2026-09-18).
 *
 * Will, on the heading ladder: "We really shouldn't have any one-off adding
 * instances. Everything should be addressed in our design system type ladder."
 * Asked whether that reaches body and label sizes: yes, and one question-first
 * board before any sweep.
 *
 * ★ WHAT IS ON A LADDER TODAY STOPS AT 16. The ten heading steps run from
 * `display` down to `card-title` (1rem), and BELOW that nothing is on anything:
 * production outside the lab carries `text-sm` 366 times, `text-xs` 243,
 * `text-[11px]` 88, `text-[10px]` 60, `text-base` 25, `text-[15px]` 24,
 * `text-lg` 21, `text-[13px]` 8 and `text-[17px]` 2, plus 67 hand-set trackings
 * on uppercase labels. About 920 sites, and the sweep that moves them is the
 * wiring's, not this board's.
 *
 * ★ THE ONE FACT EVERY DECISION HERE TURNS ON: the ladder's rungs are a single
 * set (12, 14, 16, 18, 20, 24, 28 …, theme.css) and it BOTTOMS OUT AT 12. So a
 * body ladder either lands on those rungs (16 / 14 / 12, with 12 the floor) or
 * it invents half-rungs the heading ladder has never needed (15, 13, 11, 10).
 * Each decision says which of the two it is choosing, on the step, measured.
 *
 * The order is the reading order of the product: what a guest reads, what the
 * app works in, what marketing reads, then the small end. The label and the
 * buttons wait on the decisions they depend on, so each is asked in a world
 * where the one under it is settled. THE NAMES are not asked here: the two
 * namings worth having (copy/body/caption/label against body/ui/caption/label)
 * draw the same picture, and a decision whose options look identical is a
 * paragraph pretending to be a step. It is in the track manifest's Questions
 * with a recommendation instead.
 */

/**
 * THE WIDTH, one knob the decisions share, so one frame is on screen at a time
 * and each is a real viewport at 1:1. A `vw` clamp reads the BROWSER's width,
 * so the phone end can only be judged in a frame that is actually 375 wide.
 * The guest's own decision takes no knob: its surface is a phone.
 */
const WIDTH: Control = {
  id: "width",
  label: "Width",
  options: [
    { id: "1440", label: "1440, a desktop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

const DRAFT = defineExploration({
  id: "body-type",
  title: "Body and label type",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round: the body and label ladder as seven decisions, every option drawn on the real surface it governs at a real viewport, with its size and leading measured inside the frame.",
  },
  context:
    "The heading ladder is ten steps and it stops at 16. Everything under it is a stock or arbitrary size chosen site by site: about 920 of them. These seven decisions set the steps that replace them, and no production byte moves here.",
  bible: [5, 7, 21],
  asks: [
    {
      id: "reading",
      label: "A guest's reading copy",
      tile: "phone",
      question: "How big is a guest's reading copy on a phone?",
      context:
        "The event description, the locked page's line and the entry sheet's rows are an arbitrary 15px today, at 24 sites. Drawn on the real guest page at 375; the numbers under each frame are read off the element inside it.",
      lands:
        "The step every guest-facing sentence wears, on a phone and everywhere else.",
      options: [
        {
          id: "15",
          label: "15px, today's size",
          means:
            "An arbitrary size between the ladder's 14 and 16 rungs, at 24 sites. A new half-rung the heading ladder has never needed.",
        },
        {
          id: "16",
          label: "16px, a rung the ladder has",
          means:
            "The browser's own base, so a reader who raises theirs raises this. Level with card-title rather than over it.",
        },
        {
          id: "17",
          label: "17px, one size up",
          means:
            "The most generous read, and the only option that puts body copy ABOVE card-title (16), which breaks the order.",
        },
      ],
      recommended: "16",
      because:
        "16 is a rung the ladder already holds and the browser's own base, so a reader's size setting carries and 24 arbitrary sites go. 17 would outrank the card title it sits under, which is the one law the ladder has.",
      overrule:
        "If a guest should see more of the album in the first screen, 15 keeps today's measure and costs a rung.",
    },
    {
      id: "working",
      label: "The app's working body",
      question:
        "How big is the app's working body, on a dashboard and a table?",
      context:
        "The host app and the admin portal are on 14, two rungs under a guest's page (docs/design/guidance.md). Drawn on the real dashboard over the real jobs table; flip the width for a phone.",
      lands:
        "The step the host app and the admin portal wear for every working sentence.",
      options: [
        {
          id: "14",
          label: "14px, as today",
          means:
            "The ladder's own rung, kept: 366 text-sm sites stay where they are and a table keeps its density.",
        },
        {
          id: "15",
          label: "15px, nearer the guest's page",
          means:
            "One pixel up, off the rungs, and a long table grows most of a screen. It closes the gap to reading copy to one size.",
        },
        {
          id: "13",
          label: "13px, denser",
          means:
            "More rows in a screen, off the rungs, and only one size over the caption step's loudest option.",
        },
      ],
      recommended: "14",
      because:
        "14 is the only rung on offer and the one 366 sites already wear, so the app's step costs nothing to adopt. The two-rung gap to a guest's 16 is what makes these two steps rather than one.",
      overrule:
        "If the dashboard should read like the album it manages rather than like a tool, 15 closes the gap.",
      configs: [WIDTH],
    },
    {
      id: "marketing",
      label: "Marketing reading copy",
      question:
        "How big is marketing's reading copy, and does it grow with the screen?",
      context:
        "A section's lede sets no size at all and takes the document's 16; a feature paragraph is 15 or 17. Drawn on a real feature section. A fluid step is a clamp through 375 and 1440, exactly like a heading step.",
      lands:
        "The step marketing's ledes and paragraphs wear, and whether the body ladder has a fluid rung at all.",
      options: [
        {
          id: "16",
          label: "16px flat, the guest's own step",
          means:
            "One step for every sentence on the site. Marketing's louder scale then lives in its headings alone.",
        },
        {
          id: "18",
          label: "18px flat, a marketing size",
          means:
            "A rung louder than the guest's page at every width, including a phone, where it is the widest thing on screen.",
        },
        {
          id: "fluid",
          label: "16 at a phone, 18 on a desktop",
          means:
            "A clamp like every heading step, so body copy travels with the headings over it and agrees with the guest's at 375.",
        },
      ],
      recommended: "fluid",
      because:
        "Marketing's headings travel two to four rungs between a phone and a desktop; copy that does not travel with them reads smaller the bigger the page gets. At 375 it is the guest's own step, which is the width that matters most.",
      overrule:
        "If one flat step for every sentence on the site is worth more than the travel, 16 is that step already.",
      configs: [WIDTH],
    },
    {
      id: "caption",
      label: "The caption step, and the floor",
      question: "How small does the smallest type in the product get?",
      context:
        "Counters, badges and labels run 12, 11 and 10 today, at 243, 88 and 60 sites. ONE step replaces all three, and it is the floor: nothing goes under it. Drawn on the event card's pills, two feed headers and a table's head row.",
      lands:
        "The caption step, and the smallest size any surface in the product is allowed to set.",
      options: [
        {
          id: "12",
          label: "12px, the ladder's bottom rung",
          means:
            "Rung-true: the 243 sites at 12 stay and 148 smaller ones rise. Pills over a photograph grow and a few need refitting.",
        },
        {
          id: "11",
          label: "11px, where small labels sit today",
          means:
            "Off the rungs: 243 sites drop a pixel and 60 rise one. The badges stay about the size they are now.",
        },
        {
          id: "10",
          label: "10px, today's smallest, kept",
          means:
            "Nothing grows: 331 sites come down to the smallest thing we set today, which is very small in a hand.",
        },
      ],
      recommended: "12",
      because:
        "It is the rung the heading ladder's own scale bottoms out at, it retires 148 arbitrary sizes in one step, and it is a floor that can be said out loud: nothing on Partyreel is under 12.",
      overrule:
        "If a pill over a photograph has to stay quiet more than it has to be read, 11 keeps the badges where they are.",
      configs: [WIDTH],
    },
    {
      id: "label",
      label: "The label step",
      question: "What size and tracking does an uppercase label wear?",
      context:
        "Uppercase labels carry tracking by hand: 0.14em at 31 sites, 0.025em at 21, then 0.16, 0.08, 0.24 and 0.4. One pair for all of them, drawn on a marketing eyebrow beside the app's section labels.",
      lands:
        "Every uppercase label on the site, marketing and app, as one size-and-tracking pair.",
      options: [
        {
          id: "12-14",
          label: "12px on 0.14em",
          means:
            "The marketing eyebrow's pair today, carried into the app. The most editorial of the three, and the loudest.",
        },
        {
          id: "11-14",
          label: "11px on 0.14em",
          means:
            "The app's label size with marketing's tracking. Off the table if the floor you just picked is 12.",
        },
        {
          id: "12-08",
          label: "12px on 0.08em",
          means:
            "The same size, tracked half as far: closer to a UI label than to an editorial eyebrow.",
        },
      ],
      recommended: "12-14",
      because:
        "It is one of the two pairs already on the site, it is the louder one, and at 12 it sits on the floor rather than under it. Uppercase at 11 is the thing that reads as small print.",
      overrule:
        "If an app section label should whisper where a marketing eyebrow announces, 12 on 0.08em is the quiet one.",
      after: { ask: "caption" },
      configs: [WIDTH],
    },
    {
      id: "buttons",
      label: "Buttons on the ladder",
      question:
        "Do buttons take the ladder's steps, or keep sizes of their own?",
      context:
        "A button is 14 by default and on lg, 16 on the cta, 12 on xs and an arbitrary 12.8 on sm. Drawn on the real Button in the places each size ships: a guest's block, the host's strip, a feed header's pair and a review chip.",
      lands:
        "Whether Button sets its own sizes or reads them off the ladder, at every size it has.",
      options: [
        {
          id: "ladder",
          label: "Each size takes a step",
          means:
            "xs and sm take the caption step, default and lg the working step, cta the reading step. The 12.8 goes.",
        },
        {
          id: "own",
          label: "Buttons keep their own four",
          means:
            "Nothing moves, and Button stays the one component setting a size the ladder has never heard of.",
        },
        {
          id: "one",
          label: "One size on every button",
          means:
            "The working step everywhere; only height and padding separate the sizes. The cta stops shouting in type.",
        },
      ],
      recommended: "ladder",
      because:
        "A button's four sizes already mean the caption, the body and the read; they just spell them in numbers of their own, one of which is an arbitrary 12.8. Naming the steps changes almost nothing and leaves nothing off the ladder.",
      overrule:
        "If a small button has to fit a 28px row more than it has to be on a step, `own` keeps the 12.8 that does.",
      after: { ask: "working" },
      configs: [WIDTH],
    },
    {
      id: "leading",
      label: "The line-height rule",
      question: "How does a body step carry its line height?",
      context:
        "A heading step carries a LENGTH. A stock class carries a pair too (text-sm is 14 on 20). An arbitrary size carries nothing and inherits the preflight's 1.5, so text-[15px] computes to 22.5. Drawn on a feature section over a table.",
      lands:
        "Whether a body step is a triple like a heading step, or a size plus one rule the whole ladder shares.",
      options: [
        {
          id: "length",
          label: "A length per step, as the headings do",
          means:
            "12 on 16, 14 on 20, 16 on 24, 18 on 28: the pairs the site already wears, and every rung lands on the 4px grid.",
        },
        {
          id: "ratio",
          label: "One ratio for the whole ladder",
          means:
            "1.5, which is what an arbitrary size already inherits. It lands 15 on 22.5 and 11 on 16.5, off the whole pixel.",
        },
        {
          id: "two",
          label: "A reading ratio and a working one",
          means:
            "1.6 where it is read, 1.4 where it is scanned. Two numbers, and it lands 16 on 25.6 and 14 on 19.6.",
        },
      ],
      recommended: "length",
      because:
        "At every rung it is the pair the site already wears (2 x size - 8 gives Tailwind's own 12/16, 14/20, 16/24, 18/28) and lands on the 4px grid, which no ratio does at an odd size. It is also the shape a heading step has.",
      overrule:
        "If a step is retuned often, a ratio cannot go stale where a generated length can. 1.5 is also what we inherit today.",
      configs: [WIDTH],
    },
  ],
});

/**
 * ★ ONE WIDTH KNOB, NOT SEVEN. `defineExploration` flattens every decision's
 * `configs` into the board's controls, so a knob the decisions share arrives
 * once per decision and the dock would draw it seven times, with React warning
 * about the duplicate key. Each decision keeps it on its strip (that is what
 * `configs` is for); the board declares it once. gallery-width found this on
 * 2026-09-18 and it is still a finding for the constructor, which could dedupe
 * by id itself.
 */
export const BODY_TYPE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
