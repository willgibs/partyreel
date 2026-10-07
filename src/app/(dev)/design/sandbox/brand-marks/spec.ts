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
 * ★ THE PALETTE IS ONE ASK AND TWO CALLS (the creative director's pass): drawn
 * as three grades, production's room stood the same in all three (its black is
 * already at the floor), so the grade stays production's, named (a call), the
 * ember's stops join it and relight the five lamps (a call), and the one
 * visible decision left is asked: what a piece of the room on paper is made of.
 *
 * ★ EVERY OPTION IS ITS ANSWER'S OWN SIZE: a wordmark is one path production's
 * `Logo` draws, a plate is a few `globals.css` tokens, a status set is a
 * few tokens and the Badge's point, so each frame wears its option as one
 * paste on production's own surfaces (the site's bar and foot, sign-in, the
 * host's app and her hub), the fix at its source rather than a page's.
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
      "A new board from your brand r2 pick: Aperture's marks made final, each drawn on production's own surfaces: the wordmark, the icon, the plate a piece of the room is made of and the status set.",
  },
  context:
    "Every option is drawn on production's own surfaces at a laptop or a phone (the Screen knob), the room and paper side by side: the site's first screen and its foot, sign-in, the social card, the host's app and her hub; the icon on a home screen, a launcher and among a browser's tabs. Each option reaches production as one paste, so what a frame shows is what its answer lands.",
  opening: {
    about:
      "Aperture's marks, made final on production's own surfaces: the wordmark, the icon, the plate a piece of the room is made of, and the status set.",
    settled: [
      "Aperture is the brand (your brand r2 pick): light lives in the dark, and on paper it stays inside a piece of the room.",
      "The icon is the Ring, the shutter's puck in its ring of light, lit by the house ember: one warm glow, never a spectrum.",
      "A status is a point and its word: Standby half-lit with no hue, and a count that needs you wears the tally (event-header r6).",
      "The wordmark stands alone in the bars and the foot, and it never glows.",
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
      term: "plate",
      means:
        "What a piece of the room on paper is made of: the foot's slab, a menu's screen, one dark for all.",
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
        "Not in the bars or the foot, as your note had it, nor anywhere yet: the word alone, the Ring alone on tabs and home screens.",
      overrule:
        "A lockup, the Ring then the word, where both are wanted: a press kit, a mail's head.",
    },
    {
      id: "v1-icon",
      question:
        "Is the Ring your v1 icon, or a stand-in until your own file lands?",
      taken:
        "Your v1, unless you still mean to draw it ('I'll upload new v1 icon separately later'): the Ring picked here answers that ask.",
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
        "Into the ember at their source: the foot's seam, the confetti and a photo-less event's lamp on the dashboard glow as one warm family.",
      overrule:
        "Keep the five beside the ember, so photo-less events on the dashboard still differ in hue.",
    },
    {
      id: "live-breathes",
      question: "Does the live mark keep its breath?",
      taken:
        "Yes: live is the tally's red, the one point that breathes, since it alone is happening now.",
      overrule: "Live stands still, a point like every other state.",
    },
    {
      id: "grade",
      question:
        "Does production's grade change: its blacks, its whites, its ink and its lines?",
      taken:
        "No: Aperture is the take closest to production, so its grade stays value for value, the ember's four stops joining it as tokens.",
      overrule:
        "Camera black: every dark neutral and a step deeper, paper a hair whiter, its cards white.",
    },
    {
      id: "display-kisses",
      question:
        "At 48 pixels and up, do your v1's near-touching pairs (Pa, yr, ee) part a hair?",
      taken:
        "Yes, in the finished option: a hair at large sizes and a step more in the bars, so no two letters touch at any size.",
      overrule: "As you drew them from 48 pixels up, parted only in the bars.",
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
        "The word first, large on paper and in the room and at the bars' sizes (22 pixels, enlarged); then production's own surfaces signing with it: the site's first screen, sign-in, the foot and the social card.",
      options: [
        {
          id: "finished",
          label: "Your v1, finished",
          means:
            "Your letters exactly, spaced so no two touch: a hair at large sizes, a small cut a step more for the bars (Pa, yr, ee), so it reads from 16 pixels to a poster.",
          gains:
            "Your drawing and its energy kept, every letter clear from the bars to a poster.",
          costs:
            "A sporty italic is the loudest thing on a calm page; the bars' cut is a touch looser.",
        },
        {
          id: "nameplate",
          label: "A nameplate in spaced capitals",
          means:
            "PARTYREEL redrawn in wide capitals, spaced the way a camera engraves its name on its body: the readouts' own voice, made the mark.",
          gains:
            "The calmest mark: one voice with the camera's readouts, crisp from 16 pixels to a poster.",
          costs:
            "Your v1 retired; spaced capitals are common and read formal, a wedding before a party.",
        },
        {
          id: "lowercase",
          label: "A lowercase word on the Ring",
          means:
            "partyreel redrawn upright on the Ring's circle: one round draws every bowl and the r's shoulder, at Urbanist's weight; the t and l keep your v1's cut.",
          gains:
            "Friendly and calm, of a piece with the icon and the headings, and open down to 16 pixels.",
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
      question: "Which Ring should be the icon on a home screen?",
      where: ["Shared", "The icon", "A home screen"],
      when: "A host saves Partyreel to her home screen; a guest keeps the album open in a tab among a dozen others.",
      matters:
        "The Ring is the one mark that holds the light, and it must read at 16 pixels as well as at 1024.",
      lands:
        "The favicon, the home-screen and app icons, the manifest's icons and the press kit's mark.",
      context:
        "The icon first, at its sizes and on paper; then a home screen at night and by day, and a launcher's round mask. A tab shows one small ring for all three (16 and 32 pixels, enlarged), so it is shown, not asked.",
      options: [
        {
          id: "ember",
          label: "Key-lit, as brand r2 drew it",
          means:
            "The puck in its ring lit from the top-left by the house ember, deepening to an ember red at the bottom-right: one lamp, and a whole ring at every size.",
          gains:
            "An object in a room, warm and calm: the brand's one light, drawn, and still a ring in a tab.",
          costs:
            "The quietest of the three on a home screen, half its ring dim; at 16 pixels the lamp is a hint.",
        },
        {
          id: "whole",
          label: "The whole ring, lit all round",
          means:
            "The ring lit all the way round, amber at its crown warming to coral at its foot, the puck dark inside: the album's shutter at rest, a sign before an object.",
          gains:
            "The clearest mark at every size, from a tab to a home screen: one warm ring.",
          costs:
            "A sign, not an object lit from the top-left; in its tinted grey it nears a ring light.",
        },
        {
          id: "shutter",
          label: "The shutter, with its add",
          means:
            "The album's Add itself: the shutter's plus on the puck, drawn as heavy as the ring and lit by the same lamp; a tab shows the ring alone.",
          gains:
            "Says what Partyreel is for before a word: it is the button guests press to add photos.",
          costs:
            "A plus is any add app's glyph, and the Add must wear it too (today it wears a picture).",
        },
      ],
      recommended: "ember",
      because:
        "One lamp from the top-left is how the brand lights everything; its small sizes keep the whole ring lit faintly, so it never reads as a moon.",
      overrule:
        "If the icon must read the same at every size, the whole ring; if it should say what it does, the shutter.",
      configs: [SCREEN],
    },
    {
      id: "plate",
      label: "The plate",
      question:
        "On a paper page, what should a piece of the room be: lifted, or the room's own black?",
      where: ["Shared", "Paper pages", "A piece of the room"],
      when: "A paper page holds a dark piece: the site's foot, a menu or a toast on a light page, the code's plate.",
      matters:
        "It is the dark the light lives in on paper: how deep it is sets how bright that light reads, and how heavy the piece sits.",
      lands:
        "One plate token for every piece of the room on paper: the foot's slab (.surface-ink) and paper's display.",
      context:
        "The foot and a menu on a paper page first, each wearing the plate on production's own pieces; then the tokens by globals.css's names, the plate among them and production's grade beside it.",
      options: [
        {
          id: "lifted",
          label: "Lifted, as the foot is today",
          means:
            "Every piece of the room on paper a step above the room's black, as production's foot and menus already stand: an object set on the page.",
          gains:
            "Reads as a thing the page holds, never a hole in it; nothing you have seen moves.",
          costs:
            "Its light sits on a lifted grey, a step less bright than in the room.",
        },
        {
          id: "room",
          label: "The room's own black",
          means:
            "Every piece of the room on paper is the room itself, its own black: a window onto the room, its light exactly as bright as there.",
          gains:
            "Aperture's promise to the letter: light on paper as bright as in the room.",
          costs:
            "A deep black on white can read as a hole in the page, the reason production lifted its foot.",
        },
      ],
      recommended: "lifted",
      today: "lifted",
      because:
        "A piece of the room is an object the page holds, as brand r2 drew it: lifted a step, it reads as set on the page, never as a hole.",
      overrule:
        "If the light on paper must be as bright as in the room, the room's own black.",
      configs: [SCREEN],
    },
    {
      id: "status",
      label: "The status set",
      question: "How should Standby, Ready and Fault read beside the tally?",
      where: ["Shared", "The status set", "Every state"],
      when: "On one screen: a guest's photos sending, 12 approved, an upload that failed, and 8 waiting for her in Review.",
      matters:
        "Red already means a count that needs her and live; whether a failure shares it, and whether done keeps a colour, sets how loud a night is.",
      lands:
        "The status tokens, the Badge's points, a meter's fill by its state, the toasts' glyphs and every state's word, on both grounds.",
      context:
        "The status set first, each state's point and word on paper and in the room beside the tally (given); then a host's night on production's own pieces: her hub's doors, the live mark and the album going to Drive.",
      options: [
        {
          id: "pilot",
          label: "Green and red, like a camera",
          means:
            "Standby half-lit, Ready a camera's green, Fault the red point; the tally keeps its red, and the word tells a fault from a count.",
          gains:
            "Every state its own lamp, read at a glance as on any camera: done looks done.",
          costs:
            "Fault shares the tally's red, told apart by its word; to one man in twelve, green and red match.",
        },
        {
          id: "ink",
          label: "Ink until it needs you",
          means:
            "Standby half-lit, Ready lit full in ink with no hue, a lamp's own levels; Fault and the tally share the one red, which means 'act on this'.",
          gains:
            "One accent: red only where she must act or it is live, and every eye tells ink from red.",
          costs:
            "Done has no colour, so a success feels quieter, and approve gives up its green.",
        },
        {
          id: "amber",
          label: "A fault in amber",
          means:
            "Standby half-lit, Ready green, Fault a vivid amber that deepens to orange on white so it stands; red stays the tally's and live's.",
          gains:
            "A failure never wears red: red is only a count that needs her, or live.",
          costs:
            "A fourth colour; on white it must turn orange to stand, and a real failure may be read past.",
        },
      ],
      recommended: "ink",
      because:
        "The brand has one accent, red, where she must act and on the live point; Ready reads as the ink lit full, and a fault is hers to act on.",
      overrule:
        "If done should be green, green and red; if a failure should never wear red, a fault in amber.",
      configs: [SCREEN],
    },
  ],
});
