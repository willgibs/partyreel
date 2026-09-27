import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * THE HOME HERO'S CARD, ROUND ONE (2026-09-27).
 *
 * Will, on `reel-story` r3's `hero` (he picked `print`, "far from perfect,
 * just inspired a better idea"): "let's design the item [to] be a compact
 * version of an event card, not text-heavy (if at all) but kind of showcasing
 * multiple images in an album rather than 1 and a QR code, plus whatever
 * other design touches you can think of... Want visitors to get an immediate
 * impression of 'oh, I make a shareable event and everyone uploads to it,
 * cool!'. The QR code alone feels limiting, like our product revolves around
 * QRs-only rather than a 'one link' concept." And in chat: "The QR does not
 * need to be scannable in this visual, just tie the idea of the QR to the
 * compact album visual." The scannable code moves to `demo-doors`' demo
 * modal, opened from the new "Try our demo event" eyebrow over the H1.
 *
 * ★ ONE QUESTION: WHICH CARD. Every option is drawn in the real first screen
 * (the header, the band on its own tables, the eyebrow, the block), graded
 * against today's object. The three cards are three readings of "a compact
 * event card", each an album with its one link and next to no words: the
 * album on paper with the code as one of its tiles, the event's own page as
 * a guest meets it, and the link as the object with the album rising out of
 * it.
 *
 * ★ THE APP'S DASHBOARD CARD WAS DRAWN AND LEFT OFF THE BOARD, AND WHY. His
 * words were "a compact version of an event card", so the product's own card
 * (`app/event-card.tsx`: photographs as the cover, the QR chip, glass chrome)
 * was the first reading built. In the real hero it is photographs in front of
 * a band of photographs, and it read as one more frame of the band at rest and
 * mid-loop alike (captured at 1440, 2026-09-27): the source has to be a
 * different material from what leaves it, which is why every card here is
 * paper.
 *
 * Nothing here asks what another standing board asks: the demo line and the
 * eyebrow are `demo-doors`' wiring, the hero at a tablet width is
 * `loose-ends`' `hero-tablet`, and the modal's surface is `popups`'.
 */
export const HERO_CARD = defineExploration({
  id: "hero-card",
  title: "The home hero's card",
  round: {
    n: 1,
    date: "2026-09-27",
    changed:
      "New, on your reel-story note on the hero: the object becomes a compact event card, an album with its one link and next to no words, drawn in the real first screen and graded against today's.",
  },
  context:
    "Your note on reel-story's hero: a compact event card, several photographs in an album rather than one, the QR tied in as one face of a single link rather than the whole idea, little or no text, so a visitor gets \"I make a shareable event and everyone uploads to it\" at a glance. The scannable code moves to the demo modal behind the new eyebrow. Each card is drawn in the real first screen at 1440 and 375, beside today's.",
  carried: [
    {
      id: "eyebrow",
      question: "What stands over the headline while demo-doors builds it?",
      taken:
        'Its "Try our demo event" eyebrow, drawn as a stand-in on the eyebrow atom as the block\'s first line; every caption measures air to it.',
      overrule:
        "Nothing on this board changes: the eyebrow is demo-doors' to finish, and the air is read again against what lands.",
    },
    {
      id: "place",
      question: "Where does a card stand against the band's axis?",
      taken:
        "In the middle of its air, between the header and the eyebrow; the axis runs through its lower half, so the band still leaves from behind it.",
      overrule:
        "Centred on the axis as today, which leaves a card all of its air above it and almost none over the eyebrow, as today's has.",
    },
    {
      id: "address",
      question: "What does a card's link say?",
      taken:
        "A custom address at an ordinary length, partyreel.com/e/mia-and-theo, the slug in ink; the code encodes the short /demo link, so a phone that scans lands.",
      overrule: "The demo's own link, or a generic partyreel.com/e/your-party.",
    },
    {
      id: "still",
      question: "Does the card move?",
      taken:
        "No: the band is the hero's one motion and the card stands still as its source (your reel-story note: two motions cancel each other out).",
      overrule:
        "A photograph could land in the card's album each time one leaves into the band, at the cost of a second motion.",
    },
    {
      id: "light",
      question:
        "Does the card stand in a light of its own, as the event pages' objects do?",
      taken:
        "No: white paper already stands clear of the room and the band, and the band's photographs carry the colour all round it.",
      overrule:
        "A halo behind the picked card or a pool under it, drawn next round (ROADMAP's line from story-r3).",
    },
  ],
  asks: [
    {
      id: "card",
      label: "The hero's card",
      question:
        "Which compact event card should stand at the centre of the home hero, the one its album streams out of?",
      context:
        "The home's first screen: the album streams out of this object along the band's axis, and pressing it opens the demo. Each card is an album with its one link, the QR one face of it, and next to no words.",
      options: [
        {
          id: "today",
          label: "Today: the framed photograph",
          means:
            "One photograph in a dark mat, its code on a white plate off the corner, centred on the axis. The reference every card is graded against.",
        },
        {
          id: "album",
          label: "The album on a card",
          means:
            "White paper: four photographs in two rows, one a video, with the code as the fifth tile; at the foot the custom address and three guests' faces.",
        },
        {
          id: "page",
          label: "The event's own page, as a guest sees it",
          means:
            "The event page in miniature: its code and custom address at the head, six photographs, and the guest's Add photos, a third button in the first screen.",
        },
        {
          id: "link",
          label: "The link, the album rising out of it",
          means:
            "The link is the object: the code beside the custom address on a white card, four prints standing up out of it; the least like an event card.",
        },
      ],
      today: "today",
      recommended: "album",
      because:
        "It says the whole sentence top to bottom with only its link for words: an album, its link, everyone in it. The code is one tile among the photographs rather than the idea, and white paper stands clear of the band where today's dark mat sinks.",
      overrule:
        "If the card should invite a guest in, the event's page; if the link should lead, the link.",
      lands:
        "The object DemoQr mounts in cinema-hero.tsx (demo-ticket.tsx's DemoFrame retires from the hero) and where it stands on the axis.",
      configs: [SCREEN],
    },
  ],
});
