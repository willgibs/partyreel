import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE BRAND-VOICE BOARD, AS DATA (round six, the catalog rebuild, 2026-09-16).
 *
 * ★ THE ROUND IS A SUBTRACTION AND A WIDENING AT ONCE. Will's brief was "a
 * couple dozen spot examples across the marketing site and app" where he can
 * "compare 2 brand voices in usage side by side", with "a config to choose
 * which 2, then select my winner". So thirteen sections became five, seven asks
 * became three, and the 13,000 words of argument left: what stayed is six
 * voices as cards and twenty-four real places drawn twice.
 *
 * ★ THE SIX ARE WRITTEN OUT HERE AND NOWHERE ELSE, and that is not laziness
 * about DRY, it is the desk. `pnpm lab:review` reads a spec as TEXT rather than
 * importing it (so a board's items and asks can be read with no build step), so
 * `candidates: VOICES.map(...)` would read as a board with NO items and every
 * ruling on a card would be refused. The structure of a voice lives in
 * `voices.ts`; the words a reviewer compares across six cards live here, and
 * `voices.test.ts` pins the two lists equal id for id, line for line, so the
 * duplication cannot drift.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or `voices.ts` (which is plain data but sits beside a client board)
 * would risk dragging a client tree into a server render.
 */
const ITEMS: readonly Candidate<
  "catalog" | "spots" | "calls" | "pages" | "paste"
>[] = [
  {
    id: "today",
    name: "Today",
    one: "The lines the site ships, word for word. Nothing is written down, so nothing holds the next hundred.",
    verdict: "kill",
    facts: [
      ["Shape", "Unwritten"],
      ["A line is about", "Whatever the line was about"],
      ["Rewrites", "0 of 85 lines"],
      ["Risk", "Nothing holds the next hundred lines"],
    ],
    rationale:
      "The one to come back to. Every other card is judged against it, and a ruling of Today changes no line.",
  },
  {
    id: "keepsake",
    name: "Keepsake",
    one: "Warm and plain, about what the host ends up holding. The register the approved lines already speak.",
    verdict: "refine",
    facts: [
      ["Shape", "A noun phrase, then a turn on a comma"],
      ["A line is about", "The thing you keep"],
      ["Rewrites", "31 of 85 lines"],
      ["Risk", "Changes least, so lifts least"],
    ],
    rationale:
      "The cheap answer and a real one. The voice already lives in the ratified lines; this writes it down and brings back the ones that drifted, so a ruling costs a sweep rather than a rewrite.",
  },
  {
    id: "live",
    name: "Live",
    one: "Present tense, verb in front: the album filling while the party is still going.",
    verdict: "ship",
    recommended: true,
    facts: [
      ["Shape", "Verb first, one breath"],
      ["A line is about", "The moment it is happening"],
      ["Rewrites", "58 of 85 lines"],
      ["Risk", "Runs long; a row on the h1 at 375"],
    ],
    rationale:
      "The only voice a shared folder could not say back, because it stays inside the moment the album fills. It is also the only one that makes the live demo, the album and the reel sound like one product.",
  },
  {
    id: "plain",
    name: "Plain",
    one: "Short declaratives. Nothing in a line that is not a fact, and no scene at all.",
    verdict: "refine",
    facts: [
      ["Shape", "Subject, verb, object. Full stop."],
      ["A line is about", "The mechanism"],
      ["Rewrites", "52 of 85 lines"],
      ["Risk", "Never sells; reads as documentation"],
    ],
    rationale:
      "The register a reader trusts fastest, and the only one that never has to be turned down for the app: the quiet volume IS the voice. If the product is obvious enough, plain is the strongest thing here.",
  },
  {
    id: "everyone",
    name: "Everyone",
    one: "The room's point of view: what the people there do, not what the host walks away with.",
    verdict: "refine",
    facts: [
      ["Shape", "Everyone is the subject"],
      ["A line is about", "The people who were there"],
      ["Rewrites", "51 of 85 lines"],
      ["Risk", "Rarely says you, and the host is the buyer"],
    ],
    rationale:
      "The product's real asset is forty phones, not one, and this is the only voice that says so. It is also the closest thing here to a reason to pass the link on.",
  },
  {
    id: "aside",
    name: "Aside",
    one: "Confident and dry: a claim, then the thing it spares you, said as an aside.",
    verdict: "refine",
    facts: [
      ["Shape", "A claim, then a wink"],
      ["A line is about", "What you will not have to do"],
      ["Rewrites", "50 of 85 lines"],
      ["Risk", "Wit ages badly and does not travel"],
    ],
    rationale:
      "The only one anybody would quote. It names no competitor, but every line is shaped by a chore the reader recognises, which is the edge of bible 20 on purpose.",
  },
];

export const BRAND_VOICE = defineBoard({
  id: "brand-voice",
  title: "The brand voice",

  question:
    "Which of six voices should Partyreel write in, read on two dozen real places?",

  round: {
    n: 6,
    date: "2026-09-16",
    changed:
      "Rebuilt as a catalog and a spot list: six voices as cards, and twenty-four real places drawn twice under whichever two you press A and B on. Thirteen sections became five and the argument went under the evidence.",
  },
  history: [
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "Every specimen moved into a true viewport, and the seven asks were rewritten in plain words.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The board opened on the voices WRITING sixteen real surfaces, on the components that ship them.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "The verdict on top, the cost measured rather than asserted, and the three pages the home page never reaches.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "Whole pages instead of headers, and candidate C retired as a column.",
    },
    {
      n: 1,
      date: "2026-09-14",
      changed:
        "The voice written down for the first time: a guide, three volumes, three candidates on seven headers.",
    },
  ],
  context:
    "No voice was written down anywhere: the only copy rule in the repo was the ban on em-dashes. Bible 20 (say who we are, never who we are not) was don'ts with no do's, and bible 21 opened every line on the site until a voice existed. Five rounds argued three candidates in prose; this one writes six of them into the product and lets the product do the arguing. No production byte changes on this track.",

  verdict: {
    recommendation:
      "Live: present tense, verb in front, the album filling while the party is still going.",
    because:
      "It is the only one of the six whose sentences a shared folder could not say back, because it stays inside the moment the album fills rather than describing it the morning after. Keepsake is the cheap answer and a real one.",
    overrule:
      "Live costs a row on the biggest headline at 375. If that row is too expensive, Keepsake carries none of it and none of the lift.",
  },

  asks: [
    {
      id: "noun",
      question:
        "On a guest's phone, is the thing they are looking at an album or a gallery?",
      context:
        "The site, the app and the reel say album. The shipped guest pages say gallery, and no voice decides which is right.",
      look: "Section three: the same two guest lines under each word.",
      options: [
        {
          id: "album",
          label: "Album",
          means: "One noun everywhere. The guest pages are swept to match.",
        },
        {
          id: "gallery",
          label: "Gallery",
          means:
            "The guest keeps its own word, and the site keeps album. Two nouns, on purpose.",
        },
      ],
      recommended: "album",
      because:
        "A guest who becomes a host meets the word twice, and two words for one object teach a vocabulary badly.",
      evidence: "calls",
      control: "noun",
    },
    {
      id: "unfurl",
      question:
        "What should a group chat show when a host pastes the event link?",
      context:
        "A chat draws a preview card from the page. Where an event needs an email first, this line is the only warning anyone gets.",
      look: "Section three, top: the preview card, each line in turn.",
      options: [
        {
          id: "email",
          label: "Say the email up front",
          means: "Fewer taps, and nobody hits a wall halfway through a party.",
        },
        {
          id: "join",
          label: "Just invite them in",
          means: "More taps, and a share of them bounce at the email step.",
        },
        {
          id: "one-step",
          label: "Warn without saying what",
          means:
            "Hints that something is asked. It is also the shape a phishing warning takes.",
        },
      ],
      recommended: "email",
      because:
        "A tap that bounces at a gate is worse than one that never happened: the guest is in the room when it fails.",
      evidence: "calls",
      control: "unfurl",
    },
    {
      id: "counts",
      question: "Which pair of numbers does the home page quote?",
      context:
        "The hero proposes 312 photos from 48 guests; a band below ships 214 photos, 23 guests. Both claim the demo event.",
      look: "Section three, bottom: the same line under each pair.",
      options: [
        {
          id: "demo",
          label: "The demo event's real numbers",
          means: "214 and 23, read from the demo, and the hero drops its pair.",
        },
        {
          id: "hero",
          label: "The bigger pair",
          means:
            "312 and 48 everywhere, which no live event on the site backs.",
        },
      ],
      recommended: "demo",
      because:
        "A number a reader can go and count beats a bigger one, and the demo is one click away.",
      evidence: "calls",
      control: "counts",
    },
  ],

  /**
   * ★ THE CANDIDATES ARE THE VOICES, and the spot list is how they are judged.
   * A catalog card is a glance; the ruling is made two dozen places down.
   */
  candidates: ITEMS,

  catalog: {
    section: "catalog",
    control: "voice",
    compare: ["compare-a", "compare-b"],
  },

  departures: [
    {
      id: "aside-tests-20",
      from: 20,
      text: "Bible 20 says name what we are, never what we are not. Aside is on the board to test that edge: it names no competitor, but every line is shaped by a chore the reader recognises. If the rule means the shape and not the naming, Aside is a kill on sight.",
      evidence: "spots",
    },
    {
      id: "never-expire",
      from: "precedent",
      text: "The create wizard's date helper says events never expire. The rule is that an event stays until the host deletes it: there is deliberately no end date, which is the anti-abuse core. The fix belongs to the sweep whichever voice wins.",
      evidence: "spots",
    },
    {
      id: "guest-account-line",
      from: 4,
      text: "Bible 4 says a guest surface belongs to the host's event. The shipped door asks a guest to make an account with US on someone else's page: the one line here that is wrong in every voice, so it is marked compelled rather than offered.",
      evidence: "spots",
    },
  ],

  assets: [],

  /**
   * ★ THE BUDGET IS DECLARED, AND THE NUMBER IS THE WORK RATHER THAN AN EXCUSE.
   * Round five weighed 13,024 words; this one weighs about 2,600, and roughly
   * 900 of those are the template's own (the answer, the three asks, the meta
   * panel's six ideas and three rules-broken, the review panel's instructions),
   * which no board can fold. The rest is arithmetic: Will asked for two dozen
   * places, and each one costs its name, the kit's own "under A and under B"
   * line and two frame captions, about forty words a place before the board
   * says anything of its own. Every word that CAN be folded is folded.
   */
  reading: {
    words: 2700,
    why: "Will asked for two dozen real places: each one costs its name, the kit's compare line and its captions before the board speaks. The argument is folded; this is names and labels.",
  },

  sections: [
    {
      id: "catalog",
      title: "The six voices",
      lede: "Each card writes the same two screens, loud over quiet, at a phone's own column and type.",
      argument: [
        "WHY A CARD SHOWS TWO SCREENS AND NOT ONE HEADLINE. What separates these six is not a headline, it is whether the headline and an empty state sound like the same person. A card that shows only the loud volume is a card that cannot be wrong about the quiet one, and the quiet one is nine tenths of the words a host ever reads.",
        "HOW SIX WERE CHOSEN. Each is a coherent answer somebody could prefer for a reason they could say out loud: keep every line; tune the register the approved lines already speak; rebuild around the one thing only this product does; say nothing that is not a fact; speak for the room rather than the host; lead with the chore it spares you. Two that differ only in temperature would be one card.",
        "THE CARDS ARE NOT FRAMES, and every other board's are. Fifty documents mounted to answer which of six is a board that cannot open, so a card paints its ground itself and pins its column to the 343px a 375 viewport gives. Nothing is scaled; the desktop rungs simply do not fire, because nothing on a card asks for one.",
        "WHAT A VOICE DOES NOT DECIDE. The three volumes (loud in marketing, quiet in the app, nearly silent on a guest's phone) do not fork with the voice; round one found that on four surfaces and round four confirmed it on sixteen. Only the loud volume's default sentence shape moves, so a ruling here is a ruling on vocabulary and shape, never on how loud the app may be.",
      ],
    },
    {
      id: "spots",
      title: "The same places, two voices at a time",
      lede: "Twenty-four real places, each drawn twice in a real document: the component that ships it, with the board's strings in it.",
      argument: [
        "EVERY SPOT IS THE COMPONENT THAT SHIPS IT. PageHero and SectionShell for the chapters, the pricing markup with its figures read from tiers.ts, the create wizard's card, a toast at sonner's own 356px, the guest sheet's dropzone at 375. The strings are the board's; the components, the density and the breakpoint are the product's.",
        "AND NOTHING IS SCALED. A frame is a document at exactly 1440 or exactly 375, so a breakpoint resolves against the canvas rather than the browser. Whether a headline takes three rows or four at 375 is the sharpest fact on this board about a voice, and a scaled box cannot tell you.",
        "THE COUNTS IN THE COPY (214 photos, 23 guests, forty phones) are the demo event's or the board's own, which is what the third ask is about: one source and one pair of numbers, or the page quotes two.",
        "WHERE A VOICE DOES NOT BITE IS ALSO A RULING. Twenty-five of the eighty-five lines are the same in every voice, and each one says WHY: a verb on a button the host is about to press, an error that names a fact, a billing sentence that is a promise about money. A row printing the same string six times under the word unchanged teaches nothing, so no row does.",
      ],
    },
    {
      id: "calls",
      title: "The three calls a voice does not decide",
      lede: "A noun, a link preview and a pair of numbers: none of them settled by picking a card.",
    },
    {
      id: "pages",
      title: "The home page, wearing the pick",
      lede: "The page top to bottom in the picked voice. It has to land in the voice it opened in.",
      wiring: [
        "The four frames are the page's real ground order: cinema, paper, cinema, ink. marketing.css flips the whole document on `data-mkt-skin`, so a single frame showing two grounds at once would be a lie about both.",
      ],
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The picked voice as the block that lands in marketing-voice.ts, generated from the data above.",
      wiring: [
        "The three volumes (loud in marketing, quiet in the app, nearly silent on a guest's phone) are the guide rather than evidence, so they live in docs/specs/brand-voice.md and not on the board.",
        "The paste covers the thesis, the subhead and the six section headers. The rest of a sweep is component edits rather than constants: the feature cards, the wizard's helper, the guest door and the mail templates each carry their own strings, and the spot list names the file for every one.",
      ],
    },
  ],

  controls: [
    /**
     * ★ THE PICK IS CLEARABLE AND OPENS ON NOTHING (Will, 2026-09-16: "I can't
     * unpick a selection to return to a non-selected state"). Nothing picked
     * means the page walk and the paste show the site as it ships.
     */
    {
      id: "voice",
      label: "The winner",
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "today", label: "Today" },
        { id: "keepsake", label: "Keepsake" },
        { id: "live", label: "Live" },
        { id: "plain", label: "Plain" },
        { id: "everyone", label: "Everyone" },
        { id: "aside", label: "Aside" },
      ],
      default: "none",
      clearable: true,
    },
    // A and B: the two the spot list draws. They open on the control against
    // the board's own pick, which is the comparison a reader wants first.
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "today", label: "Today" },
        { id: "keepsake", label: "Keepsake" },
        { id: "live", label: "Live" },
        { id: "plain", label: "Plain" },
        { id: "everyone", label: "Everyone" },
        { id: "aside", label: "Aside" },
      ],
      default: "today",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "today", label: "Today" },
        { id: "keepsake", label: "Keepsake" },
        { id: "live", label: "Live" },
        { id: "plain", label: "Plain" },
        { id: "everyone", label: "Everyone" },
        { id: "aside", label: "Aside" },
      ],
      default: "live",
    },
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    {
      id: "area",
      label: "Where",
      options: [
        { id: "all", label: "Everywhere" },
        { id: "marketing", label: "The site" },
        { id: "app", label: "The app" },
        { id: "guest", label: "A guest's phone" },
      ],
      default: "all",
    },
    {
      id: "noun",
      label: "The noun",
      options: [
        { id: "album", label: "Album" },
        { id: "gallery", label: "Gallery" },
      ],
      default: "album",
    },
    {
      id: "unfurl",
      label: "The link preview",
      options: [
        { id: "email", label: "Say the email up front" },
        { id: "join", label: "Just invite them in" },
        { id: "one-step", label: "Warn without saying what" },
      ],
      default: "email",
    },
    {
      id: "counts",
      label: "The numbers",
      options: [
        { id: "demo", label: "The demo event's real numbers" },
        { id: "hero", label: "The bigger pair" },
      ],
      default: "demo",
    },
  ],

  lookFirst: [
    {
      section: "catalog",
      note: "Read the six cards. The loud screen and the quiet one under it are the whole voice; nothing has to be switched to compare them.",
    },
    {
      section: "spots",
      note: "Today against Live, from the top. The first three places are the loudest on the site and the gap is widest there.",
    },
    {
      section: "spots",
      state: { canvas: "phone", "compare-a": "keepsake", "compare-b": "aside" },
      note: "The same places at 375, in the two candidates furthest apart in temperature. The headline rows are read here, not asserted.",
    },
    {
      section: "spots",
      state: { area: "app", "compare-a": "plain", "compare-b": "aside" },
      note: "The quiet volume, where a voice earns or loses its keep. An error and a storage warning are where wit stops being free.",
    },
    {
      section: "pages",
      state: { voice: "live" },
      note: "The board's own pick, worn by the whole page. A page has to land in the voice it opened in.",
    },
  ],

  links: {
    bible: [2, 4, 20, 21, 22],
    spec: "docs/specs/brand-voice.md",
    pages: [
      { label: "Home", path: "/", note: "the arc every spot comes from" },
      { label: "Pricing", path: "/pricing", note: "the cards, unchanged" },
      { label: "Help", path: "/help", note: "the one place a voice yields" },
    ],
  },
});
