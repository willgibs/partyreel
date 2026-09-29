import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DEMO'S STORY, ROUND ONE (2026-09-29).
 *
 * Will: "I don't love our working title of 'Mia & Theo', it feels kind of
 * weird for a demo name. Before we create a dedicated demo event for the home
 * hero (or even just modify our current demo), let's land on the best framing
 * of it."
 *
 * ★ WHERE IT STANDS, READ OFF THE LIVE ROW (2026-09-28). The home hero's card
 * (`hero-card` r2's `guests`, `cinema-hero-card.tsx`) prints
 * partyreel.com/e/mia-and-theo, and no event holds that slug: the homepage's
 * one printed address 404s, and any host on any plan could claim it and have
 * the homepage advertise their event. Pressing the card opens the demo,
 * "Partyreel Demo" at /e/partyreel-demo, hosted on Will's own account, nine
 * photographs and videos from three guests, under the line "Try uploading to
 * our (fake) event!". It matches neither the card's wedding nor its 34.
 *
 * ★ THREE DECISIONS, IN THE ORDER A VISITOR MEETS THEM: what party it is
 * (drawn on the card at 1440 and 375 and at the head of the album it opens),
 * what it is called (drawn in the party picked, where the name is said: the
 * card's link at its narrowest, the demo's welcome, the album's title), and
 * which event the card opens (the card, what pressing it opens, and what
 * every other demo door opens). The name waits on the party because its five
 * kinds are drawn in it; which event opens is its own question.
 *
 * ★ THE NAME IS MEASURED WHERE IT IS SAID. A slug is `truncate`d on the card,
 * so a long one is cut rather than wrapped: the card's caption reads whether
 * the slug sets whole in its column (about 116 px on a phone, 172 at a desk).
 * The welcome says the name inside "You're a guest at", which is where a name
 * written in the host's own voice ("My 30th") stops reading.
 *
 * Nothing here asks what another standing board asks: the card's design is
 * production's (`hero-card` retired into it), and the demo modal is `popups`'
 * and ships.
 */
export const DEMO_FRAMING = defineExploration({
  id: "demo-framing",
  title: "The demo's story",
  round: {
    n: 1,
    date: "2026-09-29",
    changed:
      "The demo's story, drawn on the home hero's card at 1440 and 375 and at the head of the album it opens: five parties, five ways to name one, and three ways for the card to reach its album.",
  },
  context:
    "Your note: 'Mia & Theo' feels weird for a demo name, so land the framing before the demo is made or renamed. Today the card prints partyreel.com/e/mia-and-theo, a link no event holds (it 404s, and any host could claim it), and opens 'Partyreel Demo', nine photos from three guests. Every photograph is a stand-in from the band's stills; the four the month makes for each party are listed under its frames.",
  carried: [
    {
      id: "count",
      question: "What does the card's chip count?",
      taken:
        "The album's own guests less the four on the prints (24 at the 30th, so +20), and the seed gives the album exactly that many named guests.",
      overrule: "A round +30 whatever the album holds, or no count at all.",
    },
    {
      id: "guests",
      question: "What do the prints call their guests?",
      taken:
        "Faces only, each a guest the album credits by first name and initial; the initial stands in until the row 34 portraits land.",
      overrule: "A first name beside each face, like a caption on a print.",
    },
    {
      id: "date",
      question: "Does the demo carry a date?",
      taken:
        "No: none on the card, and the album's byline names only its host, so the demo never ages; today's July 9, 2026 goes.",
      overrule:
        "A date under the card's link and in the byline, as an invite carries one.",
    },
    {
      id: "host",
      question: "Who hosts the demo?",
      taken:
        "The party's own host (Sam Okafor at the 30th), on a demo account of its own, so the byline and the welcome name them rather than you.",
      overrule:
        "Your own account, as today: Hosted by Will Gibson over the story.",
    },
    {
      id: "line",
      question: "What does the album's line under the title say?",
      taken:
        "The host's own words, as a real host writes them; the Demo mark and the welcome already say it is a demo.",
      overrule: "Keep a line that says so: Try uploading to our (fake) event!",
    },
    {
      id: "band",
      question: "Does the band stream the demo's own party?",
      taken:
        "No: it stays every kind of party (ASSETS row 2), so the first screen keeps its breadth and the card is the one party you open.",
      overrule:
        "The card's own party, so one shoot fills the band, the card and the album.",
    },
  ],
  asks: [
    /* ── 1. The party ───────────────────────────────────────────────────── */
    {
      id: "story",
      label: "The demo's party",
      question:
        "What party should the demo be, on the home hero's card and in the album it opens?",
      context:
        "The card is the demo's invite: its link, four prints each credited to a guest, and the rest counted in. Pressing it opens the demo's album. Drawn on the home at 1440 and 375, named by first names as today, beside the album's head.",
      options: [
        {
          id: "wedding",
          label: "A wedding, as the card is today",
          means:
            "The party most paid hosts buy an Event Pass for: the rings, the first dance, the toast on video. The one every wedding app shows.",
        },
        {
          id: "birthday",
          label: "A milestone birthday",
          means:
            "A 30th: the candles, the dance floor, the toast on video. The party nearly everyone throws, big enough to need every guest's photos.",
        },
        {
          id: "weekend",
          label: "A weekend away with friends",
          means:
            "A lake house: the dock, the fire, dinner on the porch. No occasion to explain, and fewer guests, about nine.",
        },
        {
          id: "reunion",
          label: "A family reunion",
          means:
            "Three generations on the steps, the long lunch, the cousins' race: every age adding photos, grandparents to teenagers.",
        },
        {
          id: "work",
          label: "A work party",
          means:
            "A studio's holiday party: the photo booth, the dance floor, the team toast. Says Partyreel works for a company too.",
        },
      ],
      today: "wedding",
      recommended: "birthday",
      because:
        "Nearly everyone throws one, so the most visitors read the card as a party they could host, and a 30th is big enough to need every guest's photos. The band and the wedding page keep weddings in view.",
      overrule:
        "If the demo should sell the Event Pass's biggest buyer first, the wedding.",
      lands:
        "OBJECT_EVENT and OBJECT_PRINTS in hero-stream.ts, the demo event's name and album (its seed), and what ASSETS rows 33, 34 and 5 show.",
    },

    /* ── 2. What it is called (after the party) ─────────────────────────── */
    {
      id: "names",
      label: "What it is called",
      question:
        "With the party picked, what should the demo be called, on the card's link and at the album's head?",
      context:
        "The name is said where a visitor reads it: the card's link, the demo's welcome ('You're a guest at'), the album's title and the tab. Drawn in the party you picked, the card at 375, where its link has the least room.",
      options: [
        {
          id: "first-names",
          label: "First names, as today",
          means:
            "Whose party it is, by first name: Mia & Theo's Wedding at mia-and-theo, Sam's 30th at sams-30th. The kind you flagged.",
        },
        {
          id: "voice",
          label: "The host's own voice",
          means:
            "Written as the host would: Our wedding, My 30th. It reads as the visitor's own on the card, and as nobody's in the welcome.",
        },
        {
          id: "occasion",
          label: "The occasion, no names",
          means:
            "The party itself: The big 3-0, The lake weekend. No stranger's name to explain; the host is named once, in the byline.",
        },
        {
          id: "family",
          label: "A family name",
          means:
            "A surname for the party: The Calder wedding, The Parker reunion. Reads like a printed invite, and needs a full name for a birthday.",
        },
        {
          id: "playful",
          label: "A playful line, like a hashtag",
          means:
            "The line a host prints on the napkins: Happily ever after, Lake daze. Memorable, and it can read as a joke the visitor is not in on.",
        },
      ],
      today: "first-names",
      recommended: "occasion",
      because:
        "It names the party rather than people, so the card reads as a party a visitor could throw instead of a stranger's, it holds in every sentence the demo says it in, and the host is still named where a guest meets them.",
      overrule:
        "If the welcome should put the visitor at somebody's party by name, first names with the occasion: Sam's 30th.",
      lands:
        "OBJECT_EVENT.slug, the demo event's name and custom slug (the unique index holds it), and the welcome's sentence.",
      after: { ask: "story" },
    },

    /* ── 3. Which event it opens ─────────────────────────────────────────── */
    {
      id: "demo",
      label: "Which event it opens",
      question:
        "Which event should the home hero's card open when it is pressed?",
      context:
        "Pressing the card opens the demo: a modal at a desk, a new tab on a phone. The footer's code, the nav's pane and every event page open it too. Drawn at 375: the card, what pressing it opens, and what every other door opens.",
      options: [
        {
          id: "one",
          label: "One demo, renamed to the party",
          means:
            "Today's demo takes the party's name, link and album, re-seeded to match, so every door opens the party the card shows.",
        },
        {
          id: "hero",
          label: "A hero event of its own",
          means:
            "The card opens a new event with the party's album and its own code; every other door keeps today's demo. Two albums to keep.",
        },
        {
          id: "picture",
          label: "The card as a picture of one",
          means:
            "The card keeps the party's prints but prints the demo's own link, partyreel.com/e/partyreel-demo, and opens today's demo.",
        },
      ],
      recommended: "one",
      because:
        "It keeps the card's promise: pressing the party opens that party, with the guests and photographs it shows. One album to curate, one token for the demo's simulated uploads, and /demo needs nothing.",
      overrule:
        "If each event page should open a party of its own kind, a hero event now, and one per type later.",
      lands:
        "The demo event's name, slug and album (the seed), with one home for its slug in lib/demo.ts that the card prints and the seed sets.",
    },
  ],
});
