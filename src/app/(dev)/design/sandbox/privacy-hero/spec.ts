import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PRIVACY PAGE'S HERO: "the field" as two spirals (the heroes lane,
 * 2026-09-18). Round one of a new board, cut from Will's note on the album
 * hero's round three: "I'd love to revamp 'the field' for the 'Privacy &
 * trust' page hero. I love the images popping in spiraling opposite two sides.
 * Increasing the pace, reducing the gap between images and leaving a decaying
 * trail behind the 2 spirals should hopefully be perfect for that page hero."
 *
 * ★ FOUR DECISIONS, SHAPED PROGRESSIVELY: the pace first, the gap drawn at the
 * pace he picks, the trail at both, the phone at all three. Every option is the
 * live privacy page's first screen at 1440 and at 375, and every pace is graded
 * against the home hero's, which he called perfect, never against a cap.
 *
 * ★ THE NUMBERS IN THE WORDS ARE THE ENGINE'S. `spirals.test.ts` holds each
 * option's figures to what `spirals.ts` measures, so a retune turns the test
 * red rather than leaving a tile that says one thing and draws another.
 *
 * Pure data (registry.test.ts): the board route is a server page and reads
 * this for its header.
 */
export const PRIVACY_HERO = defineExploration({
  id: "privacy-hero",
  title: "The privacy page's hero",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The album hero's round-three field, recut as two spirals behind the privacy page's words: its pace, its gap, its trail and its phone, each drawn at 1440 and 375 against the home hero's pace.",
  },
  bible: [1, 13, 14, 22],
  asks: [
    {
      id: "pace",
      label: "The pace",
      question: "How fast should the spirals travel?",
      context:
        "The reference is the home hero, which you called perfect: each frame leaves the code at 40 px a second and speeds up. Here each leaves the words on that curve while the source behind them turns. A notch: a quarter slower, a third faster.",
      options: [
        {
          id: "home",
          label: "The home hero's speed",
          means:
            "Each frame leaves the words at 40 px a second on the home hero's own curve, and the source turns once every 13 seconds.",
        },
        {
          id: "under",
          label: "A notch under it",
          means:
            "30 px a second off the words and a turn every 17 seconds: three quarters of the home hero.",
        },
        {
          id: "over",
          label: "A notch over it",
          means:
            "53 px a second off the words and a turn every 10 seconds: a third faster than the home hero.",
        },
      ],
      recommended: "home",
      because:
        "It is the speed you called perfect, read off the shipped home hero rather than retyped, so the two heroes move as one site.",
      overrule:
        "If the turning makes it busier than the home hero at the same speed, a notch under.",
      lands: "The tempo of the privacy hero's field: its travel, its turn and its clock together.",
    },
    {
      id: "gap",
      label: "The gap",
      question: "How close should the photographs sit along each spiral?",
      after: { ask: "pace" },
      context:
        "The space between neighbours on one arm, in photograph widths. At the home hero's own clock, a pair every 1250 ms, they sit two and a half apart, round three's gap, so a smaller gap is a quicker clock. Drawn at your pace.",
      options: [
        {
          id: "half",
          label: "Half a photograph apart",
          means:
            "1.5 widths centre to centre: at the home hero's speed a pair every 860 ms, 10 frames lit at the busiest instant (the home hero: 12).",
        },
        {
          id: "edge",
          label: "Edge to edge",
          means:
            "1 width, so the frames just touch: a pair every 550 ms, 16 lit.",
        },
        {
          id: "overlap",
          label: "Overlapping",
          means:
            "0.75 of a width, each tucked under the next: a pair every 410 ms, 21 lit.",
        },
      ],
      recommended: "half",
      because:
        "Enough dark between neighbours that each photograph reads as one, while the arm still reads as a line, and about as many frames lit as the home hero.",
      overrule: "If the arms read as scattered frames rather than two lines, edge to edge.",
      lands: "The launch clock of the privacy hero's field.",
    },
    {
      id: "trail",
      label: "The trail",
      question: "What should each spiral leave behind it?",
      after: { ask: "gap" },
      context:
        "The spiral you saw is the point where frames pop in, sweeping round the words; behind it is where the arm just was. A trail fades in real time, so a faster spiral draws a longer one. Drawn at your pace and gap.",
      options: [
        {
          id: "wake",
          label: "A fading wake",
          means:
            "Each arm dims from its newest frame to its oldest, and every photograph leaves a soft smear of its own colours where the arm just was.",
        },
        {
          id: "echoes",
          label: "Echoes",
          means:
            "Each arm dims the same way, and every photograph leaves two fading copies of itself a few degrees back in the turn.",
        },
        {
          id: "none",
          label: "No trail",
          means:
            "The frames stay lit until they leave the screen, as round three drew them.",
        },
      ],
      recommended: "wake",
      because:
        "It draws each arm as a comet, bright where the frames pop in and fading behind, which is the trail you described; echoes double the photographs on screen.",
      overrule: "If the smear reads as blur rather than light, echoes.",
      lands: "What the privacy hero's frames draw behind them.",
    },
    {
      id: "phone",
      label: "At a phone",
      question: "At a phone, should the photographs still spiral?",
      after: { ask: "trail" },
      tile: "phone",
      context:
        "At 375 the words fill the column, so a frame is only ever seen in the strips above and below them. Drawn at your pace, gap and trail.",
      options: [
        {
          id: "spirals",
          label: "The two spirals, sized to the column",
          means:
            "The same turning source with smaller frames: the strips fill while an arm points up or down, and go quiet while it points sideways.",
        },
        {
          id: "cones",
          label: "Two cones, up and down",
          means:
            "Frames thrown within thirty degrees of straight up and straight down, fanned across the column, so both strips always hold two or three.",
        },
      ],
      recommended: "cones",
      because:
        "Drawn at 375, the spirals spend half of every turn pointing into the words' own width, where nothing can be seen, and the strips go dark; the cones keep them full.",
      overrule: "If the phone should read as the same object as the desktop, the spirals.",
      lands: "The privacy hero's field below 640 px.",
    },
  ],
});
