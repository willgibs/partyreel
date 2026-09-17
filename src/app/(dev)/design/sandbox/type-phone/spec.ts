import { defineExploration } from "@/components/lab/exploration";

/**
 * TYPE AT A PHONE: the three calls the type ruling left open.
 *
 * `type-wiring` landed Will's ladder on 2026-09-17 and measured three things at
 * 375 it could not decide for him. They have sat in the ROADMAP as prose ever
 * since, which is exactly the shape a decision cannot be made in: there was
 * nothing to look at and nothing to press.
 *
 * ★ THE FIRST EXPLORATION IN THE QUESTION-FIRST SHAPE (`defineExploration`).
 * Every option here is drawn, at true pixels, in the surface it belongs to,
 * because the constructor makes that structural rather than optional. No
 * sections, no verdict essay, no departures, no catalog: three questions, each
 * with its own previews, each answerable on its own.
 */
export const TYPE_PHONE = defineExploration({
  id: "type-phone",
  title: "Type at a phone",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The three calls the type ruling measured and left open, each drawn at 375 in its own surface instead of described in a roadmap line.",
  },
  context:
    "Ladder B shipped on 2026-09-17 and every heading moved onto a step by role. Three places read wrong at a phone and right at 1440, which is the one thing a single clamp cannot fix by itself.",
  bible: [5],
  asks: [
    {
      id: "subhead",
      label: "The sub-head tier",
      tile: "phone",
      question:
        "At a phone, should a marketing sub-head be quieter than the heading it sits under?",
      context:
        "About nine h3s on /about and /help wear a flat 20px at 375. The prose h2 above them is 18px there, so the smaller heading is the louder one. At 1440 the order is right, which is why the ladder did not catch it.",
      lands:
        "The tier those nine h3s wear, and the two odd ones beside them.",
      options: [
        {
          id: "today",
          label: "As it ships: 20 at a phone",
          means:
            "The sub-head stays louder than the heading above it at 375, and reads correctly from 640 up.",
        },
        {
          id: "subsection",
          label: "On the ladder: 18 at a phone, 20 at 1440",
          means:
            "It matches the heading above it at a phone and never out-shouts it. It costs 24 down to 20 at 1440.",
        },
      ],
      recommended: "subsection",
      because:
        "A sub-head that is louder than its own heading is the one error a reader notices without knowing why, and it happens on the two pages people actually read.",
      overrule:
        "If the 1440 drop from 24 to 20 makes those sections read flat, the tier stays and the h2 above it moves instead.",
    },
    {
      id: "dead-link",
      label: "The dead-link title",
      tile: "phone",
      question: "How loud should the title on a dead marketing link be?",
      context:
        "The 404 title takes the prose step as ruled, which is 18px at a phone, sitting beside 17px body copy. One pixel of difference is doing the work of a page title.",
      lands: "The title step on every marketing 404.",
      options: [
        {
          id: "prose",
          label: "As ruled: prose, 18 at a phone",
          means:
            "One step for the whole marketing body, titles included. Nothing to remember.",
        },
        {
          id: "section",
          label: "Up one: section, 24 at a phone",
          means:
            "The title reads as a title at 375, and grows to 52 at 1440 instead of 34.",
        },
      ],
      recommended: "section",
      because:
        "A title a pixel larger than the sentence under it is not a title. This is the one page where a reader has already lost their way.",
      overrule:
        "If 52 at 1440 shouts on a page that is mostly an apology, chapter (28 to 64) is not the answer and prose stays.",
    },
    {
      id: "display-trim",
      label: "The display trim",
      tile: "phone",
      question:
        "Should the display step's optical trim change with the screen, or stay one number?",
      context:
        "A masthead takes back the space its own line height leaves above the caps with a flat -0.12em. But the display step's leading is 0.98 at 375 and 0.86 at 1440, so one number cannot be right at both ends: it under-corrects at a phone.",
      lands:
        "The trim on `page-hero.tsx`, which every marketing masthead rides.",
      options: [
        {
          id: "flat",
          label: "One number: -0.12em everywhere",
          means:
            "What ships. Correct at 1440, and leaves a sliver of air above the caps at 375.",
        },
        {
          id: "clamped",
          label: "A trim that tracks the leading",
          means:
            "The trim clamps the way the step does, so the masthead sits on its line at both ends. One more clamp to keep in step.",
        },
      ],
      recommended: "clamped",
      because:
        "The trim exists to cancel the leading, and the leading is already a clamp; a constant cancelling a variable is only ever right at one width.",
      overrule:
        "If the difference at 375 is smaller than the eye can hold, one number is the cheaper truth.",
    },
  ],
});
