import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * THE HOME HERO'S CARD, ROUND TWO (2026-09-28).
 *
 * Round one (docs/reviews/hero-card.json): `card=link`, "the link, the album
 * rising out of it". His note: "Everything else felt too tall to be a more
 * 'visually scannable' item, took too much of the center stage within the
 * hero. This visual works much better with everything around it, while
 * offering lots of feature details within it (QR, custom link, guests,
 * photos, etc). Would love to see a few more ideas branching from this."
 *
 * ★ ONE QUESTION, AND HIS LINK IS ITS REFERENCE. Every branch keeps what he
 * named (low, read at a glance, one link with the code as one face of it, the
 * guests and the photos inside it) and pushes ONE idea further: where the
 * guests show, what the link reads as (two of his own phrasings on
 * `reel-story` r3: "send a link in a group chat" and "write your custom link
 * for people to copy/type"), and how low the album can sit. Round one's other
 * three cards and today's framed photograph left with the round.
 *
 * ★ TWO QUESTIONS WAIT BEHIND THE CARD, because each is drawn in the card he
 * picks and neither changes which card it is. The light: round one carried
 * "no" and promised to draw a halo or a pool next round (ROADMAP's line from
 * story-r3), so here are the house's two object lights. The tablet: `loose-ends`'
 * `hero-tablet` sized the hero at 900 around an object this board replaces,
 * so it moved here (its drawing: `git show e199f43f:"src/app/(dev)/design/sandbox/loose-ends/hero-tablet.tsx"`);
 * every card is drawn at 900 on the knob in today's geometry, and the
 * geometry itself is `tablet.ts`'s three tables.
 *
 * Nothing here asks what another standing board asks: the eyebrow is
 * demo-doors' and ships, the modal's surface is `popups`'.
 */
export const HERO_CARD = defineExploration({
  id: "hero-card",
  title: "The home hero's card",
  round: {
    n: 2,
    date: "2026-09-28",
    changed:
      "Your link, branched four ways: the guests on the photographs they added, the link as it lands in the group chat, the album spread lower along it, the address typed out in front. At 1440, 900 and 375; the light and the tablet wait behind the card.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-27",
      changed:
        "Four cards in the real first screen: today's framed photograph, the album on a card, the event's own page, and the link. You took the link: the rest stood too tall to read at a glance.",
    },
  ],
  context:
    "Your round one note, as the direction: the link works with everything around it while carrying the QR, the custom link, the guests and the photos, and you asked for more ideas branching from it. Each branch keeps it low and pushes one idea further, graded against the link as you picked it, in the real first screen at 1440, 900 and 375.",
  carried: [
    {
      id: "place",
      question: "Where does a card stand against the band's axis?",
      taken:
        "In the middle of its air, and never so high the band is born in the open under it: on a tall screen it drops onto the axis.",
      overrule:
        "Centred on the axis everywhere, which leaves a card all of its air above it and almost none over the eyebrow.",
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
        "No, in every branch: the band is the hero's one motion (your reel-story note: two motions cancel each other out); typed's caret stands still.",
      overrule:
        "A print could lift into the band each time a pair leaves, or the address type itself once as the band opens.",
    },
    {
      id: "tablet-screen",
      question: "Which tablet does the 900 frame stand for?",
      taken:
        "One held upright, 900 by 1200: every tablet held upright is 768 to 1023 wide, where the hero wears the phone's geometry today.",
      overrule:
        "A narrow desk window, about 900 by 700, where the hero is shorter than its block and the axis clamps.",
    },
  ],
  asks: [
    {
      id: "card",
      label: "The link card",
      question:
        "Which version of the link card should stand at the centre of the home hero, the one its album streams out of?",
      context:
        "The home's first screen: the album streams out of this card, and pressing it opens the demo. Your link is the reference; each branch keeps it low and pushes one idea further. The Screen knob draws 1440, a tablet at 900, and 375.",
      options: [
        {
          id: "link",
          label: "Your link, as you picked it",
          means:
            "The code beside the custom address on a white card, the guests' faces at its end, four prints standing up out of its top edge. The reference.",
        },
        {
          id: "guests",
          label: "The guests on their photographs",
          means:
            "The faces leave the card's end for the prints, each wearing the guest who added it, the toast a video; the card counts the other 30 in.",
        },
        {
          id: "chat",
          label: "The link in the group chat",
          means:
            "The card becomes the host's message, unfurled in the product's own words with the code as its picture; the guests are a reaction pill at its foot.",
        },
        {
          id: "spread",
          label: "The album spread lower",
          means:
            "Eight smaller prints fanned evenly along the card's top edge: more of the album and a quarter less height, each photograph smaller.",
        },
        {
          id: "typed",
          label: "The address typed out",
          means:
            "The whole custom address on one line, the caret after the slug, the code its badge; a lower, wider card that reads as a link first.",
        },
      ],
      recommended: "typed",
      because:
        "It reads as a link before anything else, the code one face of it, which is your reel-story note's one-link idea taken literally. Lower than your link and still carrying the QR, the custom address, the guests and the photos.",
      overrule:
        "If the code should stay the address's equal, your link; if everyone adding photos should lead, guests.",
      lands:
        "The object DemoQr mounts in cinema-hero.tsx (DemoFrame retires from the hero), with its height re-solving the axis's floor.",
      configs: [SCREEN],
    },
    {
      id: "light",
      label: "The card's own light",
      question:
        "With your card picked, should it stand in a light of its own, as the event pages' objects and the QR page's plate do?",
      context:
        "Round one carried no light: white paper stands clear of the room and the band carries the colour. Every event page stands its object in the house light and /features/qr lights its plate. Drawn in the card you picked, behind the band.",
      options: [
        {
          id: "none",
          label: "No light, as round one carried",
          means:
            "White paper on the dark room, the band's photographs the only colour.",
        },
        {
          id: "pool",
          label: "A pool of the house light under it",
          means:
            "The Library's throw under a plate: the lamp at the card's foot cast out and up, its light travelling slowly as the event pages' does.",
        },
        {
          id: "bloom",
          label: "The QR page's glow behind it",
          means:
            "/features/qr's plate recipe: light swells from behind the card once as the band opens, then rests lit and still.",
        },
      ],
      today: "none",
      recommended: "bloom",
      because:
        "It is the house's own light for a live code: it swells once with the band and rests still, so the hero keeps one motion and the card reads as the lit source the album pours from.",
      overrule:
        "If white on the dark room should stay the hero's whole palette, no light; if the room should be lit rather than the card, the pool.",
      lands:
        "A Glow lamp behind the band at the card's point in cinema-hero.tsx, the section's first layer.",
      after: { ask: "card" },
      configs: [SCREEN],
    },
    {
      id: "tablet",
      label: "The hero at a tablet",
      question:
        "With your card picked, what geometry should the home hero wear on a tablet, between 768 and 1023 wide?",
      context:
        "hero-stream.ts carries a phone geometry and a desktop one, and every tablet held upright gets the phone's: its card, band and 343 measure, stretched across 900. Drawn at 900 by 1200 in your card; 375 and 1440 do not change.",
      options: [
        {
          id: "today",
          label: "Today: the phone's geometry",
          means:
            "The phone's card, band and 343 measure: the headline in three lines and the lowest quarter of the screen empty.",
        },
        {
          id: "tablet",
          label: "A third geometry, composed",
          means:
            "Every length between the phone's and the desktop's, and the axis set so the whole composition centres on an upright screen. One more table to keep.",
        },
        {
          id: "early",
          label: "The desktop geometry, from 768",
          means:
            "The desktop's own card, band and measures from 768 instead of 1024: no new table, and the band's largest photographs close round the card.",
        },
      ],
      today: "today",
      recommended: "tablet",
      because:
        "A tablet gets a middle step everywhere else on the ladder: the headline in two lines, a middle card and band, and the composition centred where the phone's leaves a quarter of the screen empty.",
      overrule:
        "If a third table is not worth its upkeep before launch, the desktop's geometry from 768.",
      lands:
        "hero-stream.ts's Bp union and its GEO, BEAT and SPAN tables (or LG_MIN at 768), and the card's third size.",
      after: { ask: "card" },
    },
  ],
});
