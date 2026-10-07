import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE MARKS, FINAL (the brand-marks-r1 track, cut 2026-10-06 from brand r2's
 * answer, take=aperture).
 *
 * Brand r2 settled the system (Aperture: light lives in the dark; on paper it
 * stays inside pieces of the room) and left its marks for this board: the
 * wordmark (Will's v1 untouched there, "the brand-marks board redraws it, if
 * at all, after this pick"), the icon (the Ring, the shutter's puck in its
 * ring of light), the palette as tokens production can wear, and the status
 * set beside the tally he picked at event-header r6.
 *
 * ★ EVERY OPTION IS ITS ANSWER'S OWN SIZE: a wordmark is one path production's
 * `Logo` draws, a grade is a block of `globals.css` tokens, a status set is a
 * few tokens and the Badge's point, so each frame wears its option as one
 * paste on production's own surfaces (the site's bar and foot, sign-in, the
 * host's app, the pricing page), the fix at its source rather than a page's.
 * The icon has no surface in production yet (its stand-in is mounted nowhere
 * but the tab), so it is drawn where an icon lives: a home screen and tabs.
 *
 * ★ FOUR INDEPENDENT ASKS: none waits on another, so they can be taken in any
 * order; each preview wears today's answer for the other three.
 *
 * ★ ASKS NOTHING desk 6 asks after it: where the light lives across app and
 * marketing (the signature board), each page's theme, the hero, the guest
 * row and the hashvatar.
 */
export const BRAND_MARKS = defineExploration({
  id: "brand-marks",
  title: "The brand's marks",
  surface: "shared",
  desk: 6,
  lives: [
    "src/lib/brand/wordmark.ts",
    "src/components/shared/logo.tsx",
    "src/app/icon.svg",
    "src/app/apple-icon.png",
    "src/app/favicon.ico",
    "src/app/manifest.ts",
    "public/icons/",
    "src/app/globals.css",
    "src/components/ui/badge.tsx",
    "docs/systems/design-system.md",
    "kit/logo/",
  ],
  tracks: ["brand-marks-r1"],
  round: {
    n: 1,
    date: "2026-10-06",
    changed:
      "A new board from your brand r2 pick: Aperture's marks made final, each drawn on production's own surfaces: the wordmark, the icon, the grade's tokens and the status set.",
  },
  context:
    "Every option is drawn on production's own surfaces at a laptop or a phone (the Screen knob), the room and paper side by side: the site's first screen and its foot, sign-in, the host's app, the pricing page; the icon on a home screen and among a browser's tabs. Each option reaches production as one paste, so what a frame shows is what its answer lands.",
  opening: {
    about:
      "Aperture's marks, made final on production's own surfaces: the wordmark, the icon, the grade's tokens and the status set beside the tally.",
    settled: [
      "Aperture is the brand (your brand r2 pick): light lives in the dark, and on paper it stays inside a piece of the room.",
      "The icon is the Ring, the shutter's puck in its ring of light, lit by the house ember: one warm glow, never a spectrum.",
      "A status is a point and its word: Standby half-lit with no hue, and a count that needs you wears the tally (event-header r6).",
      "The wordmark stands alone in the bars and the foot, never beside the icon, and it never glows.",
    ],
    earlier: [
      "Brand r2: you picked Aperture, light kept in pieces of the room.",
      "Desk 4: 'not like a junior designer was told to build a rainbow app. We are world-class tastemakers.'",
      "Sep 17, your v1: 'The wordmark should exist alone in the nav & footer, I'll upload new v1 icon separately later.'",
      "Event-header r6: you picked the tally, the camera's red, for a count that needs you.",
      "Event-header r3: 'don't love our yellow color, makes the page feel dull.'",
    ],
  },
  terms: [
    {
      term: "Ring",
      means:
        "The icon: the shutter's dark puck inside a ring of light, the album's own Add drawn as a mark.",
    },
    {
      term: "house ember",
      means:
        "The light where there is no photograph: the warm house lamps lit as one glow, amber to coral.",
    },
    {
      term: "piece of the room",
      means:
        "A dark object on a paper page (the code's plate, the Pro card, the foot's slab), where light may live.",
    },
    {
      term: "small cut",
      means:
        "A wordmark's drawing for small sizes, spaced so no two letters blot at the bars' 22 pixels.",
    },
    {
      term: "grade",
      means:
        "The greys a ground is built from: its blacks, its whites, its ink and its lines, as tokens.",
    },
    {
      term: "tally",
      means:
        "The camera's red the palette holds, worn by a count that needs you: solid, never a glow.",
    },
    {
      term: "status set",
      means:
        "Standby (waiting on us), Ready (done) and Fault (failed): each a point and its word.",
    },
  ],
  carried: [
    {
      id: "word-alone",
      question: "Does the icon ever stand beside the wordmark as a lockup?",
      taken:
        "No, as your note had it: the word alone in the bars and the foot, the Ring alone on tabs and home screens.",
      overrule:
        "A lockup, the Ring then the word, where both are wanted: a press kit, a mail's head.",
    },
    {
      id: "v1-icon",
      question:
        "Is the Ring your v1 icon, or a stand-in until your own file lands?",
      taken:
        "Your v1: the Ring picked here answers the icon's asset ask, drawn from it at every size.",
      overrule: "A stand-in: your own drawing replaces it when you upload it.",
    },
    {
      id: "house-icon",
      question: "Does the icon ever wear an event's own light?",
      taken:
        "No: it is the house's, lit by the house ember everywhere; an event's light stays on its own pages.",
      overrule:
        "An event's saved icon (its bookmark, its share card) lit by its photographs.",
    },
    {
      id: "lamps",
      question: "Where do the five house lamps go?",
      taken:
        "Into the ember at their source: every grade relights them as its stops, so the foot's seam and every lamp glow as one.",
      overrule:
        "Keep the five beside the ember, for the confetti and the reel's own light.",
    },
    {
      id: "live-breathes",
      question: "Does the live mark keep its breath?",
      taken:
        "Yes: live is the tally's red, the one point that breathes, since it alone is happening now.",
      overrule: "Live stands still, a point like every other state.",
    },
  ],
  asks: [
    {
      id: "wordmark",
      label: "The wordmark",
      question:
        "Which wordmark should sign every surface, from the bars to the foot?",
      where: ["Shared", "The wordmark", "Every bar and foot"],
      when: "Every page: the site's bar and foot, sign-in, the host's app, the admin, a guest's album bar, each mail's head.",
      matters:
        "It is on every page and never glows: where the light is off, its drawing alone carries the brand.",
      lands:
        "The wordmark's one path, drawn by every bar, foot and mail, the social card and the press kit.",
      context:
        "The word first, large on paper and in the room and at the bars' sizes (22 pixels, enlarged), then production's own surfaces signing with it: the site's first screen, sign-in and the site's foot.",
      options: [
        {
          id: "finished",
          label: "Your v1, finished",
          means:
            "Your letters exactly, with a small cut for the bars: the three pairs that touch (Pa, ee, el) parted so the word never blots at 22 pixels.",
          gains:
            "Your drawing and its energy kept, crisp at every size it is drawn.",
          costs: "A sporty italic is the loudest thing on a calm page.",
        },
        {
          id: "nameplate",
          label: "A nameplate in spaced capitals",
          means:
            "PARTYREEL redrawn in wide capitals, spaced the way a camera engraves its name: the readout's voice made the mark.",
          gains: "The calmest mark: one family with the camera's readouts.",
          costs:
            "Your v1 retired; capitals read formal, a wedding before a party.",
        },
        {
          id: "lowercase",
          label: "A lowercase word on the Ring",
          means:
            "partyreel redrawn upright in lowercase, its p, a and e bowls the Ring's own circle, one family with the headings' Urbanist.",
          gains:
            "Friendly and round, of a piece with the icon and the headings.",
          costs:
            "Your v1 retired, and a round lowercase is the most common mark there is.",
        },
      ],
      recommended: "finished",
      because:
        "Your v1 carries the one motion in a still brand; finishing it at the bars' size fixes what reads wrong without a new word.",
      overrule:
        "If the mark should be as quiet as the light, the nameplate; if it should match the Ring and the headings, the lowercase.",
      configs: [SCREEN],
    },
    {
      id: "icon",
      label: "The icon",
      question: "Which Ring should be the icon, on a home screen and in a tab?",
      where: ["Shared", "The icon", "Home screens and tabs"],
      when: "A host saves Partyreel to her home screen; a guest keeps the album open in a tab among a dozen others.",
      matters:
        "The Ring is the one mark that holds the light, and it must read at 16 pixels as well as at 1024.",
      lands:
        "The favicon, the home-screen and app icons, the manifest's icons and the press kit's mark.",
      context:
        "The icon first, at its home-screen sizes and as a favicon (16 and 32 pixels, enlarged), with its paper form; then a home screen at night and by day, and a browser's tabs on a dark window and a light one.",
      options: [
        {
          id: "ember",
          label: "Key-lit, as brand r2 drew it",
          means:
            "The puck in its ring lit from the top-left by the house ember, the light spent to dark at the bottom-right: an object lit by one lamp.",
          gains:
            "An object in a room, warm and calm: the brand's one light, drawn.",
          costs:
            "Half the ring is dark, so the smallest sizes need a cut of their own.",
        },
        {
          id: "whole",
          label: "The whole ring, lit evenly",
          means:
            "The ring lit all the way round in the ember, amber at its top to coral at its foot, the puck dark inside: a sign before an object.",
          gains:
            "One lit circle that reads at any size; the boldest on a home screen.",
          costs:
            "Less an object than a sign, and an even ring nears a ring light.",
        },
        {
          id: "shutter",
          label: "The shutter, with its add",
          means:
            "The album's Add itself: the puck carries the shutter's plus inside its key-lit ring, so the icon is the button a guest presses.",
          gains:
            "Says what Partyreel is for, before a word: add your photographs.",
          costs:
            "A plus reads as any 'add' app, and a glyph in an icon ages first.",
        },
      ],
      recommended: "ember",
      because:
        "One lamp from the top-left is how the brand lights everything; its small sizes keep the whole ring lit faintly, so it never reads as a moon.",
      overrule:
        "If the icon must read whole at a glance, the even ring; if it should say what it does, the shutter.",
      configs: [SCREEN],
    },
    {
      id: "palette",
      label: "The grade",
      question:
        "Which grade should production's tokens take, in the room and on paper?",
      where: ["Shared", "The palette", "Every ground"],
      when: "Every screen: the room where photographs play, paper where people decide, a piece of the room on a paper page.",
      matters:
        "Light only reads against its dark: the grade sets how bright the ember and every photograph look.",
      lands:
        "globals.css's grounds: the room's blacks, the plate, paper's whites, the ink, the lines and the ember's stops.",
      context:
        "The grade first as its tokens, by globals.css's names; then production's own pages wearing it: the pricing page on paper with its Pro card, the host's app in the room and the site's foot on its slab.",
      options: [
        {
          id: "graphite",
          label: "Graphite, today's grade named",
          means:
            "Production's cool graphite room and gallery white kept exactly; the plate, the printed rule and the ember's stops added as tokens beside them.",
          gains:
            "Nothing you have seen moves but the light: the smallest change.",
          costs:
            "The room keeps its cool cast, a blue-grey dark for a warm light.",
        },
        {
          id: "black",
          label: "Camera black, a step deeper",
          means:
            "The blacks go neutral and a step deeper, the plate the room's own black, paper a hair whiter, the ink and the lines neutral.",
          gains:
            "The deepest dark, so the ember and every photograph read brightest.",
          costs:
            "True black is starker on a phone's screen and on a long night.",
        },
        {
          id: "warm",
          label: "Warm dark, the ember's room",
          means:
            "The room's blacks and its lines take a breath of the ember's warmth; paper stays gallery white.",
          gains: "Room and light one family: the dark of a lit room at night.",
          costs:
            "A warm black can read brown, and competes with warm photographs.",
        },
      ],
      recommended: "graphite",
      because:
        "Aperture is the take closest to production: its grade already works, so the answer is naming the plate and the ember.",
      overrule:
        "If the light should read brighter, camera black; if the room should feel warm, the ember's room.",
      configs: [SCREEN],
    },
    {
      id: "status",
      label: "The status set",
      question: "How should Standby, Ready and Fault read beside the tally?",
      where: ["Shared", "The status set", "Every state"],
      when: "On one screen: a guest's photos sending, 12 approved, an upload that failed, and 8 waiting for her in Review.",
      matters:
        "The tally took the red for 'needs you', so a fault and a waiting guest must never be mistaken for each other.",
      lands:
        "The status tokens and the Badge's points, the toasts' glyphs and every state's word, on both grounds.",
      context:
        "The status set first, each state's point and word on paper and in the room beside the tally (given); then a host's night on production's own pieces: her events, the live mark and the album going to Drive.",
      options: [
        {
          id: "pilot",
          label: "Green and red, like a camera",
          means:
            "Standby half-lit, Ready a green point, Fault the red point; the tally keeps its red, and the word tells a fault from a count.",
          gains: "Every state reads at a glance, as on any camera.",
          costs:
            "Fault and 'needs you' share one red, told apart by their words.",
        },
        {
          id: "ink",
          label: "Ink until it needs you",
          means:
            "Standby half-lit, Ready lit full in ink with no hue; Fault and the tally share the one red, which means 'act on this'.",
          gains:
            "One accent, as the brand asks: colour only where she must act.",
          costs: "Done has no colour, so a success feels quieter.",
        },
        {
          id: "amber",
          label: "A fault in amber",
          means:
            "Standby half-lit, Ready green, Fault amber, since nothing was lost; red is the tally's alone.",
          gains:
            "Red means one thing, someone needs you, and a failure never alarms.",
          costs:
            "Amber is the dull yellow you called out, and a real failure may be read past.",
        },
      ],
      recommended: "ink",
      because:
        "The brand has one accent: red, only where she must act. Ready reads as the ink lit full, and a fault is something to act on.",
      overrule:
        "If done should be green, green and red; if red should only ever mean a person waiting, a fault in amber.",
      configs: [SCREEN],
    },
  ],
});
