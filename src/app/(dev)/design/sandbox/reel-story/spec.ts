import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * THE MARKETING STORY OF THE REEL, ROUND THREE (2026-09-27).
 *
 * Round two is answered (`docs/reviews/reel-story.json`) and `reel-marketing`
 * is wiring its four picks tonight, so they are ground here and their
 * drawings left the board (git holds them): the close invites ("Your next
 * event starts here."), the reel's door and the /reel heading say "Your event,
 * playing as it happens.", the event pages' reel is the demo door's still
 * twin, the teaser opens a contained player, the footer has its photo stack
 * back and the demo link stands alone in all 19 places.
 *
 * ★ HIS NOTES, AS DIRECTION.
 * - close, on the album and code: "when we replaced the QR in the home hero
 *   with the album + QR, I didn't realize we were replacing every instance...
 *   It looks really silly here beside the 'Try the live demo...' CTA link.
 *   Would like something totally new here (or nothing at all beside the
 *   link)... The home hero version also needs a ton of work to feel more
 *   polished." So `hero` grades polished takes against today's object, and
 *   `beside` draws new marks with nothing as one of them. The footer is his
 *   "swap back in the old version", the wiring's, and `site-chrome` asks the
 *   footer's own questions.
 * - card=as-it-happens: "Could use a few better options though. The
 *   'everyone's photos... live' and 'every new photo joins' from the other
 *   options also added value beyond this version's 'Your event', which is
 *   less clear." So `line` draws lines that carry those two, graded against
 *   the working one.
 * - play=modal, the principle for every preview: "an exciting
 *   intro/feature/reel video made for its own purpose in a section will
 *   always beat using a generic reel from a fake demo that our site visitors
 *   aren't auditing." Round two drew every option on the demo album's live
 *   reel; this round draws on the media registry's stand-ins for each slot
 *   and names what a pick would need made.
 *
 * Nothing here asks what another standing board asks: the footer is
 * `site-chrome`'s, the hero at a tablet width is `loose-ends`' `hero-tablet`
 * (this board draws 1440 and 375 only), and a popup's surface is `popups`'.
 */
export const REEL_STORY = defineExploration({
  id: "reel-story",
  title: "The marketing story of the reel",
  round: {
    n: 3,
    date: "2026-09-27",
    changed:
      "Three new questions from your round-two notes: the hero's album and code, polished and graded against today's; what stands beside the demo link now the frame has gone; and better lines for the reel. Round two's answers are being wired, so their drawings left the board.",
  },
  history: [
    {
      n: 2,
      date: "2026-09-25",
      changed:
        "The thesis split into the home's close and the reel's card, each in its own words; the events column became the reel beside the demo door, redrawn as its equal; the poster became a looped clip, and the ask was where its play mark leads. Every frame became a real viewport.",
    },
    {
      n: 1,
      date: "2026-09-25",
      changed:
        "The noun is clip now: every option that offered cut offers clip, and the two asks that drew clip beside cut (the pricing rows, the steps) fold each pair into one option. Nothing else moved, and it stays round one.",
    },
  ],
  context:
    "Round two is being wired: the close invites, the reel's door and heading say \"Your event, playing as it happens.\", the event pages' reel stands still beside the demo door, the teaser opens a contained player. Your notes open three questions. The album and code that replaced the hero's QR had replaced the mark beside every demo link and the footer's stack too; the footer gets its stack back, and the other two are asked here, each on its own. Every frame is real, at 1440 and 375.",
  carried: [
    {
      id: "hero-code",
      question: "What should the hero's code encode?",
      taken:
        "The QR door's short /demo link (your opens=short): 25 modules against the event link's 33, so each polished take's code scans at the size drawn.",
      overrule:
        "The event link again, at a code about a quarter bigger than each take draws it.",
    },
    {
      id: "hero-ground",
      question: "Does anything but the object change in the hero?",
      taken:
        "No: the band, its tables and the headline block are production's. The print hangs by its code; the pair on paper sits a little high, for air over the headline.",
      overrule:
        "A take that wants the axis or the block moved is a hero-stream.ts retune, drawn next round.",
    },
    {
      id: "peek-phone",
      question: "What does the peek do on a phone?",
      taken:
        "Nothing: a phone has no hover, so the link stands alone there and a tap opens the demo, as it does today.",
      overrule:
        "A first tap could open the peek and a second the demo, at the cost of a tap.",
    },
    {
      id: "line-sizes",
      question:
        "Does the reel's line stay one string at both door sizes and as the /reel heading?",
      taken:
        "Yes, as round two carried it and the wiring lands it; the hub's longer door line stays retired.",
      overrule:
        "A longer hub line can come back as the door's second string, with the heading keeping this one.",
    },
  ],
  asks: [
    {
      id: "hero",
      label: "The hero's album and code",
      question:
        "What should the object at the centre of the home hero be, the one the album streams out of?",
      context:
        "The home's first screen: the album streams out of this object along the band's axis, and pressing it opens the demo. You asked for today's, a framed photograph with its code on a corner plate, much more polished. Drawn in the real hero.",
      options: [
        {
          id: "today",
          label: "Today: the framed photograph",
          means:
            "A photograph in a dark mat, its code on a white plate hung off the corner, centred on the axis. The reference every take is graded against.",
        },
        {
          id: "refined",
          label: "The same pair, on paper",
          means:
            "Today's two pieces made with care: the photograph on white paper, and the code on a card of the same stock tucked into its corner at a slight turn.",
        },
        {
          id: "print",
          label: "One print, its code on the axis",
          means:
            "A white print with the code in its deeper foot, hung so the code sits on the band's axis: the album leaves the code, the photograph above it.",
        },
        {
          id: "plate",
          label: "The code alone, as the QR door",
          means:
            "The white plate the band was drawn around, finished like the QR door's code you called the first truly beautiful card. The band is the photographs.",
        },
      ],
      today: "today",
      recommended: "print",
      because:
        "It keeps the photograph your frame pick added, makes the object one piece of paper rather than a dark box with a plate stuck on, and puts the code back where the album leaves from, on the axis, at a size that scans.",
      overrule:
        "If the photograph is what felt unfinished, the code alone; if only the finish was off, the same pair on paper.",
      lands:
        "The object DemoQr mounts in cinema-hero.tsx and what its code encodes; the footer and the demo line keep their own.",
      configs: [SCREEN],
    },
    {
      id: "beside",
      label: "Beside the demo link",
      question:
        'What, if anything, should stand beside the "Try the live demo, no signup." link?',
      context:
        "The line under the buttons in 14 closing bands and five heroes; the framed photograph left it at your note. Each mark rides inside the one link, drawn beside the real words in the home's close and in the /reel hero.",
      options: [
        {
          id: "none",
          label: "Nothing: the link alone",
          means:
            "The words and the chevron, as the wiring leaves them in all 19 places. The reference.",
        },
        {
          id: "live",
          label: "A live dot",
          means:
            'The dot the album door\'s "Filling live" chip wears, breathing on the house pulse and still under reduced motion: the album behind the link is live.',
        },
        {
          id: "faces",
          label: "The guests' faces",
          means:
            "Three of the demo album's guests in the guest list's own face row. Seeded avatars stand in until portraits made for the line land.",
        },
        {
          id: "peek",
          label: "A peek on hover",
          means:
            "Nothing at rest; a pointer or a focus opens a card of the album under the link: three photographs, its name and its count. A phone keeps the link alone.",
        },
      ],
      recommended: "live",
      because:
        "It is the smallest thing that is new: one dot in the product's own live colour, which says what the link opens is alive, costs no asset, reads the same at 375 and never outweighs the words, the frame's failure.",
      overrule:
        "If anything beside the words is too much, nothing; if a visitor should see the album before the press, the peek.",
      lands:
        "What DemoCtaLink draws inside its one link in all 19 places (demo-cta-link.tsx).",
      configs: [SCREEN],
    },
    {
      id: "line",
      label: "The reel's line",
      question:
        "Which line should tell a reader what the highlight reel is, on its door and as the /reel heading?",
      context:
        'The hub\'s lead door, the same door in a related row, and the /reel heading. You picked "Your event, playing as it happens." and asked for lines carrying "everyone\'s photos, live" and "every new photo joins".',
      options: [
        {
          id: "as-it-happens",
          label: '"Your event, playing as it happens."',
          means:
            "The working line the wiring round is landing: that it is live, said the way a guest would say it. The reference.",
        },
        {
          id: "as-they-land",
          label: '"Everyone\'s photos, live as they land."',
          means:
            "Whose photos, that it is live and that each one arrives into it, at the working line's own length: two lines on /reel, one on each door.",
        },
        {
          id: "new-photo",
          label: '"Every new photo plays as it lands."',
          means:
            "Said from the photo's side: every new one plays the moment it lands, which is the reel growing as the party goes on.",
        },
        {
          id: "two-beats",
          label: '"Everyone\'s photos, live. Every new one joins."',
          means:
            "Your two round-two picks as two short beats: the fullest of the four, and the one that takes a third line on /reel at 1440 and a second on the small door.",
        },
      ],
      today: "as-it-happens",
      recommended: "as-they-land",
      because:
        "It carries what both your round-two picks said, whose photos, that it is live, that each one lands in it, at the working line's own length: two lines on /reel, one on each door. Nothing in it needs decoding.",
      overrule:
        "If each photo's arrival is the point, every new photo plays; if your two picks should stand as written, the two beats, at a third line.",
      lands:
        "The reel door's line at both sizes and the /reel hero's heading (feature-door.tsx, reel-hero.tsx, marketing-voice.ts).",
      configs: [SCREEN],
    },
  ],
});
