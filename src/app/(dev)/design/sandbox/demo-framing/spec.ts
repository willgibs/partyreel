import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DEMO'S STORY, ROUND TWO (his round one answers, 2026-09-29).
 *
 * His words, `story`, no pick: "we'll be replacing our full media kit
 * pre-launch, so not worried about which exact pictures we're using. Most
 * focused on the best slug here that conveys the idea, almost like
 * 'our-wedding' or 'my-party' ... Unless we did some sort of typewriter effect
 * on the slug, occasionally typing out different slugs for ways it can be used
 * to show the customizability? ... the variants in that exploration should
 * attempt to get the stream and typewriter to either work together (both in
 * full force would be overwhelming, eye goes everywhere), or let the
 * typewriter effect take center stage with new more subtle surrounding
 * animation and repurpose the centered qr + stream for the QR code page
 * hero." And `demo=one`: "Let's drop the 'try our demo event' eyebrow and
 * simply add a subtle touch to make the hero visual feel clickable."
 *
 * ★ THREE DECISIONS, IN THE ORDER A VISITOR MEETS THEM: the address the card
 * prints (drawn still, as reduced motion and a first paint both show it, and
 * at the head of the album it opens, which is titled in its words), how that
 * address shares the first screen with the stream (still, or typing hosts'
 * addresses three ways), and the touch that says the card opens. Each is
 * drawn in the world the others hold: the stage in the address picked, the
 * touch on whatever object the stage leaves on the home.
 *
 * ★ STILL-OR-TYPEWRITER AND THE TYPEWRITER'S VARIANTS ARE ONE DECISION, on
 * purpose (the lane's first Question): he compares the still hero with each
 * variant side by side, and a variant cannot be drawn without its stage.
 *
 * ★ ROUND ONE'S `names` RETIRES INTO `slug` (the carried call `title`): the
 * album is titled in the address's own words, so each address is drawn on the
 * card, at the album's head and in the welcome. Its `story` and `demo` are
 * answered, so neither is asked again.
 *
 * ★ EVERY LOOP IS ONE TABLE (`typing.ts`): the frames run it, the captions read
 * the addresses it holds, and the score under each `stage` option is drawn
 * from it, so the words, the motion and the score cannot disagree.
 */
export const DEMO_FRAMING = defineExploration({
  id: "demo-framing",
  title: "The demo's story",
  surface: "marketing",
  desk: 90,
  lives: [
    "docs/systems/marketing-content.md",
    "src/components/marketing/sections/home/cinema-hero.tsx",
    "src/components/marketing/sections/home/cinema-hero-card.tsx",
    "src/components/marketing/sections/home/hero-stream.ts",
    "src/components/marketing/sections/features/qr/qr-hero.tsx",
    "src/lib/demo.ts",
    "src/lib/constants/reserved-slugs.ts",
    "scripts/seed-demo-event.mjs",
  ],
  round: {
    n: 2,
    date: "2026-09-29",
    changed:
      "From your round one notes: the demo's address in a host's own words, a typewriter of hosts' addresses drawn three ways against the stream, and four touches that say the card opens, in place of the eyebrow.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-29",
      changed:
        "The demo's story, drawn on the home hero's card at 1440 and 375 and at the head of the album it opens: five parties, five ways to name one, and three ways for the card to reach its album.",
    },
  ],
  context:
    "Round two, from your notes on round one. Every photograph is a stand-in from the band's twelve stills: the kit is replaced before launch, so judge the words, the layout and the motion. The demo event itself (its address claimed, its album seeded) is built after your picks.",
  opening: {
    about:
      "The demo's invite on the home's first screen: the address its card prints, whether that address types others, and what says the card opens.",
    settled: [
      "The card opens one demo, renamed to its address (your round one pick): every door to the demo opens the album the card shows.",
      "The demo's album holds every kind of party, so any host sees their event in it; its photographs are the new media kit's.",
      "Every address the demo prints is reserved to it, as partyreel-demo is, so a printed address always opens the demo.",
      "The eyebrow over the headline, Try our demo event, goes (your note): the card becomes the first screen's one door to the demo.",
      "Round one's calls stand: the chip counts the guests past the four prints, faces on the prints, no date, and the host's own line.",
    ],
    earlier: [
      "The party, no pick: 'Most focused on the best slug here that conveys the idea, almost like our-wedding or my-party.'",
      "'Unless we did some sort of typewriter effect on the slug, occasionally typing out different slugs.'",
      "Its variants: the stream and the typing working together (both at full force is too much), or the typing taking the stage.",
      "And for that one, 'repurpose the centered qr + stream for the QR code page hero'.",
      "Which event it opens, one demo: 'drop the try our demo event eyebrow and simply add a subtle touch to make the hero visual feel clickable'.",
    ],
  },
  terms: [
    {
      term: "slug",
      means:
        "The part of an event's link its host names, after partyreel.com/e/: our-party in partyreel.com/e/our-party.",
    },
    {
      term: "card",
      means:
        "The small white invite at the centre of the home's first screen: a code, the address and four prints.",
    },
    {
      term: "prints",
      means:
        "The four photographs standing out of the card, each with the face of the guest who added it.",
    },
    {
      term: "stream",
      means:
        "The photographs pouring out from behind the card, left and right, across the home's first screen.",
    },
    {
      term: "typewriter",
      means:
        "The address typing itself a key at a time, then erasing and typing another host's.",
    },
    {
      term: "eyebrow",
      means:
        "The small line over a headline; the home's says Try our demo event, beside a live dot.",
    },
    {
      term: "live dot",
      means:
        "The small green dot that breathes beside every link to the demo, saying its album is live.",
    },
    {
      term: "lamp",
      means:
        "The soft light behind the card on the dark ground, which swells once as the page opens.",
    },
    {
      term: "QR code page",
      means:
        "The page about the event's code, /features/qr; today its hero is a lit code beside its words.",
    },
    {
      term: "reduced motion",
      means:
        "A visitor's setting asking for less motion: they see one still address and the stream at rest.",
    },
  ],
  carried: [
    {
      id: "title",
      question:
        "What is the demo's album called, now its address is in a host's own words?",
      taken:
        "The address's own words (our-party is Our party), so the card, the album's head and the welcome say one name; round one's names ask retires.",
      overrule:
        "A name of its own at the album's head, as today's Partyreel Demo, which the welcome then says.",
    },
    {
      id: "prints",
      question: "What do the card's four prints show at rest?",
      taken:
        "Four kinds of party from the one album (a wedding, a 30th, a lake weekend, a team party), so the card says any party before a word is read.",
      overrule:
        "Four from one party, so the card tells one story and the address alone says any kind.",
    },
    {
      id: "host",
      question: "Who hosts the demo?",
      taken:
        "A persona on a demo account of its own, Sam Okafor, named in the byline and the welcome, never your own account.",
      overrule: "Your own account, as today: Hosted by Will Gibson.",
    },
    {
      id: "typed",
      question: "Which addresses does the typewriter type?",
      taken:
        "Round one's five parties in a host's words: our-wedding, my-30th, lake-weekend, our-reunion, team-party, then the demo's own again.",
      overrule:
        "Fewer, or others: the list is one line, and every address in it is reserved to the demo.",
    },
    {
      id: "air",
      question: "Where does the eyebrow's line go?",
      taken:
        "The block is re-solved without it, as production solves it: the headline is its first line, the card stays, and the air under the block grows.",
      overrule: "Re-balance the whole first screen round the shorter block.",
    },
    {
      id: "qr-hero",
      question:
        "If the stream moves to the QR code page, what does that page's hero become?",
      taken:
        "The home's composition moved whole: the card and its stream centred over the page's own words, the card's lamp standing for the code's.",
      overrule: "The page's own lit code as the object the stream pours from.",
    },
  ],
  asks: [
    /* ── 1. The address ───────────────────────────────────────────────── */
    {
      id: "slug",
      label: "The demo's address",
      question:
        "Which address, in a host's own words, should the demo's card print?",
      where: ["Marketing", "The home's first screen", "The card's address"],
      when: "Anyone arriving at partyreel.com: the card over the headline is the demo's invite, and its address the first link they read.",
      matters:
        "It is the demo's real address and its name everywhere, and the one line that says a host names their own link.",
      context:
        "Drawn still, as reduced motion and a first paint show it: the home at 1440 and 375, then at 375 the album the card opens, its head and its welcome, titled in the address's words.",
      options: [
        {
          id: "our-party",
          label: "partyreel.com/e/our-party",
          means:
            "The party as its hosts would name it, in the plural most parties are thrown in: a couple, a family, a team, friends.",
          gains:
            "Fits every kind of party the album holds, and reads as a party the visitor could throw.",
          costs:
            "Names no kind of party, so the card's four prints have to say what it was.",
        },
        {
          id: "my-party",
          label: "partyreel.com/e/my-party",
          means:
            "One host's party, in the first person: the shortest address of the four, and the most personal.",
          gains:
            "The shortest and the most personal: it reads as the visitor's own.",
          costs:
            "Reads as a birthday; a couple, a family or a team would say our.",
        },
        {
          id: "our-big-night",
          label: "partyreel.com/e/our-big-night",
          means:
            "The night itself, in its hosts' words: a wedding, a 30th, a launch and a gala each has one.",
          gains:
            "The most life in it, and it still fits most of the parties the album holds.",
          costs:
            "A reunion or a weekend away is not a night, and it is the longest of the four.",
        },
        {
          id: "our-wedding",
          label: "partyreel.com/e/our-wedding",
          means:
            "Your example: the wedding in the couple's own words, the custom link couples most want.",
          gains:
            "The Event Pass's biggest buyer, in the address couples most want for their own.",
          costs:
            "Tells a birthday or a work host the demo is a wedding, over an album of every party.",
        },
      ],
      recommended: "our-party",
      because:
        "It fits every party the album holds, in the voice most are thrown in, and 'You're a guest at Our party' reads true.",
      overrule:
        "If the demo should speak to one host first, my-party; to its biggest buyer, our-wedding.",
      lands:
        "OBJECT_EVENT.slug, the demo event's name and custom address in its seed, and the reserved slugs that keep it the demo's.",
    },

    /* ── 2. The address and the stream ─────────────────────────────────── */
    {
      id: "stage",
      label: "The address and the stream",
      question:
        "How should the card's address and the stream share the home's first screen?",
      where: ["Marketing", "The home's first screen", "Its motion"],
      when: "The first seconds on partyreel.com with motion allowed: the stream pours out of the card while a visitor reads the headline.",
      matters:
        "The first screen has one motion to say what Partyreel is; two at full force and the eye goes everywhere.",
      context:
        "Each drawn live at 1440 and 375, with the loop's score under the desk, what moves when; the last also on the QR code page's hero, where the stream moves. Reduced motion sees one still address in every option.",
      options: [
        {
          id: "still",
          label: "The address stays still, as today",
          means:
            "The stream as it ships and the card's address still: the stream is the first screen's one motion.",
          gains:
            "Keeps the hero as composed: one motion, and nothing new to watch.",
          costs:
            "Shows one party, and leaves that a host names their link to the words.",
        },
        {
          id: "turns",
          label: "They take turns",
          means:
            "Every few seconds the stream eases to a drift, the address types another host's, and the stream pours again.",
          gains:
            "Both motions, never at full force together: the eye goes to the address, then back.",
          costs:
            "The pour pauses every few seconds, so the stream is no longer one flow.",
        },
        {
          id: "together",
          label: "The stream pours the party it types",
          means:
            "A calmer stream, and each address the card types turns its prints, then the photographs it pours, to that party.",
          gains:
            "One story: every address brings its own album out of the card.",
          costs:
            "Two motions at once, if calmer, and the typing is small beside the band.",
        },
        {
          id: "centre",
          label: "The address takes the stage",
          means:
            "The address, large, types hosts' own with their prints dealt round it; the card and its stream move to the QR code page.",
          gains:
            "Says the one idea first, this link is yours to name, with nothing beside it.",
          costs:
            "The home loses its album pouring out of the link, and two heroes change.",
        },
      ],
      today: "still",
      recommended: "turns",
      because:
        "It keeps the hero's rule of one motion at a time and lets the address type in the stream's rest, so neither competes.",
      overrule:
        "If the home should say 'yours to name' before 'everyone's photos', the address takes the stage.",
      lands:
        "cinema-hero.tsx's loop and the card's address; for the last, a home hero of its own and /features/qr's hero.",
    },

    /* ── 3. The touch ──────────────────────────────────────────────────── */
    {
      id: "touch",
      label: "What says the card opens",
      question:
        "With the eyebrow gone, what should tell a visitor the card opens the demo?",
      where: ["Marketing", "The home's first screen", "The card"],
      when: "A visitor sees the card: pressing it opens the demo, in a modal at a desk and in a new tab on a phone.",
      matters:
        "The card becomes the first screen's one door to the demo; if it does not look pressable, the demo goes unopened.",
      context:
        "Each close at a desk's size, at rest and under the pointer; then the home at 375, where there is no pointer and the resting cue is the whole cue, and at 1440, where hovering the card lifts it.",
      options: [
        {
          id: "lift",
          label: "It rises under the pointer",
          means:
            "Nothing at rest; under a pointer or focus the card lifts a few pixels, its prints fan a little and its shadow deepens.",
          gains: "Adds nothing at rest: the first screen stays as composed.",
          costs: "A phone, where most visitors are, gets no cue at all.",
        },
        {
          id: "arrow",
          label: "An arrow after the address",
          means:
            "A small arrow after the address, the web's own sign for a link that opens, and the lift under a pointer.",
          gains:
            "Reads as a link at a glance on every screen, and never moves.",
          costs:
            "One more mark on a small card; it says the address opens, not what.",
        },
        {
          id: "live",
          label: "The live dot moves onto the card",
          means:
            "The eyebrow's breathing live dot stands before the address, and the lift under a pointer.",
          gains:
            "Keeps the demo's one sign, live, on the thing it now describes.",
          costs:
            "A second small motion on the card, and live reads as a state before a door.",
        },
        {
          id: "lamp",
          label: "Its light swells now and then",
          means:
            "Every few seconds the lamp behind the card swells and settles, and the lift under a pointer.",
          gains:
            "Draws the eye with the house's own light, adding nothing to the card.",
          costs:
            "A second motion beside the stream, and soft enough to go unseen.",
        },
      ],
      recommended: "arrow",
      because:
        "It is the one cue a phone gets at rest, it never moves beside the stream, and the web already reads it as a link.",
      overrule:
        "If the card should wear the sign every other door to the demo wears, the live dot.",
      lands:
        "The card's door in cinema-hero.tsx and its address in cinema-hero-card.tsx; the eyebrow leaves the block (GEO.blockH).",
    },
  ],
});
