import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE BRAND-VOICE BOARD, AS DATA (round seven, the stepped review, 2026-09-16).
 *
 * ★ SIX VARIANTS OF ONE THING ARE DECIDED BY ONE PICK, AND THE SHAPE SAYS SO.
 * Round six returned six finished voices and twenty-four real places; not one
 * line of copy moved this round. What moved is the ASKING. `catalog.mode` is
 * `pick-one`, the `voice` ask records the winner (its options are the six cards
 * plus "None of these", which clears the board and is the right preview of
 * none), and the real home page under the tiles wears whatever card is being
 * pressed. The three calls a voice does not decide became steps of their own,
 * each drawn on one specimen with every answer visible at once, and the reach
 * question the round left open (`scope`) is asked out loud for the first time.
 *
 * ★ A VOICE IS READ, NOT LOOKED AT, so the tiles are the SAME THREE LINES in
 * each voice, on the same spot, at the size a phone draws them: the headline,
 * the sentence under it and the button. Six pictures of six different screens
 * would compare six screens; three lines on one spot compare six voices.
 *
 * ★ THE SIX ARE WRITTEN OUT HERE AND NOWHERE ELSE, and that is not laziness
 * about DRY, it is the desk. `pnpm lab:review` reads a spec as TEXT rather than
 * importing it (so a board's items and asks can be validated with no build
 * step), so `candidates: VOICES.map(...)` would read as a board with NO items
 * and every ruling on a card would be refused. The structure of a voice lives
 * in `voices.ts`; the words a reviewer compares live here, and `voices.test.ts`
 * pins the two lists equal id for id.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or `voices.ts` (which is plain data but sits beside a client board)
 * would risk dragging a client tree into a server render.
 */
const ITEMS: readonly Candidate<
  | "catalog"
  | "pages"
  | "noun"
  | "unfurl"
  | "counts"
  | "volumes"
  | "spots"
  | "paste"
>[] = [
  {
    id: "today",
    name: "Today",
    one: "The lines the site ships, word for word.",
    verdict: "kill",
    facts: [
      ["Rewrites", "0 of 85 lines"],
      ["Risk", "Nothing holds the next hundred lines"],
    ],
    lands:
      "Nothing: the 85 lines stay as they ship and the voice stays unwritten.",
    rationale:
      "The one to come back to. Every other card is judged against it, and a ruling of Today changes no line.",
  },
  {
    id: "keepsake",
    name: "Keepsake",
    one: "Warm and plain, about what the host ends up holding.",
    verdict: "refine",
    facts: [
      ["Rewrites", "31 of 85 lines"],
      ["Risk", "Changes least, so lifts least"],
    ],
    lands:
      "31 lines rewritten and the drifted ones brought back; the guide writes down what the site already speaks.",
    rationale:
      "The cheap answer and a real one. The voice already lives in the ratified lines; this writes it down and brings back the ones that drifted, so a ruling costs a sweep rather than a rewrite.",
  },
  {
    id: "live",
    name: "Live",
    one: "Present tense, verb in front, while the party is on.",
    verdict: "ship",
    recommended: true,
    facts: [
      ["Rewrites", "58 of 85 lines"],
      ["Risk", "Runs long; a row on the h1 at 375"],
    ],
    lands:
      "58 lines rewritten in the present tense; the demo, the album and the reel start sounding like one product.",
    rationale:
      "The only voice a shared folder could not say back, because it stays inside the moment the album fills. It is also the only one that makes the live demo, the album and the reel sound like one product.",
  },
  {
    id: "plain",
    name: "Plain",
    one: "Short declaratives. Nothing that is not a fact.",
    verdict: "refine",
    facts: [
      ["Rewrites", "52 of 85 lines"],
      ["Risk", "Never sells; reads as documentation"],
    ],
    lands:
      "52 lines rewritten as facts; the app's quiet volume becomes the whole voice, with nothing to turn down.",
    rationale:
      "The register a reader trusts fastest, and the only one that never has to be turned down for the app: the quiet volume IS the voice. If the product is obvious enough, plain is the strongest thing here.",
  },
  {
    id: "everyone",
    name: "Everyone",
    one: "The room's point of view, not the host's.",
    verdict: "refine",
    facts: [
      ["Rewrites", "51 of 85 lines"],
      ["Risk", "Rarely says you, and the host is the buyer"],
    ],
    lands:
      "51 lines rewritten around the room rather than the host, guest surfaces included.",
    rationale:
      "The product's real asset is forty phones, not one, and this is the only voice that says so. It is also the closest thing here to a reason to pass the link on.",
  },
  {
    id: "aside",
    name: "Aside",
    one: "A claim, then the chore it spares you.",
    verdict: "refine",
    facts: [
      ["Rewrites", "50 of 85 lines"],
      ["Risk", "Wit ages badly and does not travel"],
    ],
    lands:
      "50 lines rewritten dry, and bible 20 is tested at its edge on every one of them.",
    rationale:
      "The only one anybody would quote. It names no competitor, but every line is shaped by a chore the reader recognises, which is the edge of bible 20 on purpose.",
  },
];

export const BRAND_VOICE = defineBoard({
  id: "brand-voice",
  title: "The brand voice",

  question: "Which of six voices should Partyreel write in?",

  round: {
    n: 7,
    date: "2026-09-16",
    changed:
      "Reshaped as a walk: one voice from six or none, then the noun, the link preview, the numbers and the reach, each on one specimen. A card is the same three lines in each voice, and the home page below wears the one you press.",
  },
  history: [
    {
      n: 6,
      date: "2026-09-16",
      changed:
        "Rebuilt as a catalog and a spot list: six voices as cards, and twenty-four real places drawn twice under whichever two you press A and B on.",
    },
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "Every specimen moved into a true viewport, and the seven asks were rewritten in plain words.",
    },
  ],
  context:
    "No voice was written down anywhere: the only copy rule in the repo was the ban on em-dashes. Bible 20 (say who we are, never who we are not) was don'ts with no do's, and bible 21 opened every line on the site until a voice existed. Five rounds argued in prose; round six wrote six voices into the product, and this one asks in five steps.",

  verdict: {
    recommendation:
      "Live: present tense, verb in front, the album filling while the party is still going.",
    because:
      "It is the only one of the six whose sentences a shared folder could not say back, because it stays inside the moment the album fills rather than describing it the morning after. Keepsake is the cheap answer and a real one.",
    overrule:
      "Live costs a row on the biggest headline at 375. If that row is too expensive, Keepsake carries none of it and none of the lift.",
  },

  /**
   * ★ THE WINNER COMES FIRST, and the rest follow because they are about the
   * voice that won or about a call it never made. `scope` is staged behind the
   * pick: how far a voice reaches means nothing until there is a voice.
   */
  asks: [
    {
      id: "voice",
      question: "Which voice should Partyreel write in?",
      context:
        "Every line on the marketing site, in the host's app and on a guest's phone is written in one of these. Each card writes the same three lines of the home page's first screen, at the size a phone draws them. Press one to put the real page below in it.",
      options: [
        {
          id: "today",
          label: "Today, unchanged",
          means:
            "Every line stays as it ships. Nothing is written down, so nothing holds the next hundred lines.",
        },
        {
          id: "keepsake",
          label: "Keepsake, what you keep",
          means:
            "Warm and plain, about what the host ends up holding. It rewrites 31 lines and brings back the ones that drifted.",
        },
        {
          id: "live",
          label: "Live, while it happens",
          means:
            "Present tense, verb in front, inside the moment the album fills. It rewrites 58 lines and costs a row on the h1 at 375.",
        },
        {
          id: "plain",
          label: "Plain, facts only",
          means:
            "Short declaratives, nothing in a line that is not a fact. It never has to be turned down for the app, and it never sells.",
        },
        {
          id: "everyone",
          label: "Everyone, the room",
          means:
            "What forty phones did, rather than what the host walks away with. It rarely says you, and the host is the buyer.",
        },
        {
          id: "aside",
          label: "Aside, dry",
          means:
            "A claim, then the chore it spares you, said dry. The only one anybody would quote, and the one that ages fastest.",
        },
        {
          id: "none",
          label: "None of these",
          means:
            "New directions. Say in the note what the six are missing, and the next round starts from that rather than a card.",
        },
      ],
      recommended: "live",
      because:
        "Live is the only one of the six a shared folder could not say back: it stays inside the moment the album fills rather than describing it the morning after.",
      overrule: "The row Live costs the biggest headline at 375.",
      evidence: "catalog",
      control: "voice",
      lands:
        "docs/specs/brand-voice.md, promoted to docs/systems/brand-voice.md, and the 85 lines the voice-infusion round sweeps.",
      strip: ["canvas"],
    },
    {
      id: "noun",
      question:
        "On a guest's phone, is the thing they are looking at an album or a gallery?",
      context:
        "The site, the app and the reel say album. The shipped guest pages say gallery, in five places, and no voice decides which is right. A guest who becomes a host meets both words.",
      options: [
        {
          id: "album",
          label: "Album, everywhere",
          means:
            "One noun on every surface. The five guest strings and one component name are swept to match.",
        },
        {
          id: "gallery",
          label: "Gallery, on a guest's phone",
          means:
            "The guest keeps its own word and the site keeps album. Two nouns for one object, on purpose.",
        },
      ],
      recommended: "album",
      because:
        "Two words for one object teach a vocabulary badly, and a guest who becomes a host meets them both.",
      evidence: "noun",
      control: "noun",
      lands:
        "The five guest strings and the gallery component's name, or a written exception for the guest pages.",
    },
    {
      id: "unfurl",
      question:
        "What should a group chat show when a host pastes the event link?",
      context:
        "A chat draws a preview card from the page itself. Where an event needs an email before a guest can add, the line under the title is the only warning anyone gets before tapping.",
      options: [
        {
          id: "email",
          label: "Say the email up front",
          means:
            "Fewer taps wasted, and nobody hits a wall halfway through a party.",
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
      evidence: "unfurl",
      control: "unfurl",
      lands:
        "The event page's description meta tag, which every chat, mail client and search engine reads.",
    },
    {
      id: "counts",
      question: "Which pair of numbers does the home page quote?",
      context:
        "The hero proposes 312 photos from 48 guests; a band two sections below ships 214 photos, 23 guests. Both claim the demo event, and the demo is one click away.",
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
      evidence: "counts",
      control: "counts",
      lands:
        "One pair, read from the demo event, in the hero and in the band two sections below it.",
    },
    /**
     * ★ MEANS-ONLY ON PURPOSE. Both answers draw the same home page and the
     * same dashboard: what separates them is how many GUIDES the ruling
     * writes, which is a fact about the sweep rather than a look. So the tiles
     * are the two sentences, and the stage under them is the winner at both
     * volumes, which is what one voice covering everything sounds like.
     */
    {
      id: "scope",
      question:
        "Does one voice cover the whole product, or does the app get its own?",
      context:
        "The winner writes the marketing site loud, the app quiet and a guest's phone nearly silent. Round one found the volumes do not fork with the voice and round four confirmed it on sixteen surfaces, so the board has only ever written one.",
      look: "Nothing switches for this one. The stage below is the winner loud on the home page and quiet in the app, which is what one voice at two volumes sounds like.",
      options: [
        {
          id: "one",
          label: "One voice, three volumes",
          means:
            "Volume changes, vocabulary does not. One guide covers the site, the app and a guest's phone, and one sweep carries it.",
        },
        {
          id: "two",
          label: "A marketing voice and a product voice",
          means:
            "Two guides and two sweeps, with a seam at the sign-in page where a reader crosses from one into the other.",
        },
      ],
      recommended: "one",
      because:
        "The app's quiet lines are the same words with the shaping taken out, which is a volume rather than a second voice.",
      evidence: "volumes",
      after: { ask: "voice" },
      lands:
        "Whether the guide is one voice at three volumes or two voices with a seam at the sign-in page.",
    },
  ],

  candidates: ITEMS,

  /**
   * ★ ONE PICK DECIDES IT. The six are variants of one thing, so the review is
   * a gallery with a ring rather than six verdicts: the cards are the winner
   * ask's tiles, a verdict on a card that did not win is optional feedback, and
   * the real home page under the tiles wears whatever is pressed. A and B stay,
   * because the question under "which of these" is always "these two, then",
   * and the spot list is where that one is answered.
   */
  catalog: {
    section: "catalog",
    control: "voice",
    compare: ["compare-a", "compare-b"],
    mode: "pick-one",
    winner: "voice",
    stage: "pages",
  },

  departures: [
    {
      id: "aside-tests-20",
      from: 20,
      text: "Bible 20 says name what we are, never what we are not. Aside is on the board to test that edge: it names no competitor, but every line is shaped by a chore the reader recognises. If the rule means the shape and not the naming, Aside is a kill on sight.",
      evidence: "catalog",
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

  sections: [
    {
      id: "catalog",
      title: "The six voices",
      lede: "The same three lines in each voice, at the size a phone draws them.",
      argument: [
        "HOW SIX WERE CHOSEN. Each is a coherent answer somebody could prefer for a reason they could say out loud: keep every line; tune the register the approved lines already speak; rebuild around the one thing only this product does; say nothing that is not a fact; speak for the room rather than the host; lead with the chore it spares you. Two that differ only in temperature would be one card.",
        "THE CARDS ARE NOT FRAMES, and every other board's are. Fifty documents mounted to answer which of six is a board that cannot open, so a card paints its ground itself and pins its column to the 343px a 375 viewport gives. Nothing is scaled; the desktop rungs simply do not fire, because nothing on a card asks for one.",
      ],
    },
    {
      id: "pages",
      title: "The home page, wearing the pick",
      lede: "The page top to bottom. It has to land in the voice it opened in.",
      wiring: [
        "The four frames are the page's real ground order: cinema, paper, cinema, ink. marketing.css flips the whole document on `data-mkt-skin`, so a single frame showing two grounds at once would be a lie about both.",
      ],
    },
    {
      id: "noun",
      title: "The word on a guest's phone",
      lede: "Two shipped guest lines, under each word.",
    },
    {
      id: "unfurl",
      title: "The link preview, in a group chat",
      lede: "The card a chat draws from the event link, under each line.",
    },
    {
      id: "counts",
      title: "The numbers the home page quotes",
      lede: "The same line, under each pair.",
    },
    {
      id: "volumes",
      title: "One voice, loud and quiet",
      lede: "The winner on the home page and in the app: one voice at two volumes.",
    },
    {
      id: "spots",
      title: "The same places, two voices at a time",
      lede: "Twenty-four real places, each drawn twice in a real document.",
      argument: [
        "EVERY SPOT IS THE COMPONENT THAT SHIPS IT, at exactly 1440 or exactly 375, so a breakpoint resolves against the canvas rather than the browser. PageHero and SectionShell for the chapters, the pricing markup with its figures read from tiers.ts, the create wizard's card, a toast at sonner's own 356px, the guest sheet's dropzone. The strings are the board's; the components, the density and the breakpoint are the product's.",
        "WHERE A VOICE DOES NOT BITE IS ALSO A RULING. Twenty-five of the eighty-five lines are the same in every voice, and each one says WHY: a verb on a button the host is about to press, an error that names a fact, a billing sentence that is a promise about money. A row printing the same string six times under the word unchanged teaches nothing, so no row does.",
      ],
      wiring: [
        "The files a sweep edits, in the spot order: app/(marketing)/(cinema)/page.tsx (SITE_THESIS, SITE_SUBHEAD); under components/marketing/sections/home/, the film-strip, album, live-demo, curation, privacy and reel sections; components/marketing/sections/features/album/album-copy.ts; app/(marketing)/pricing/page.tsx with lib/constants/tiers.ts; components/marketing/sections/shared/cta-band.tsx; components/marketing/chrome/marketing-footer.tsx; content/help/getting-started/how-partyreel-works.mdx.",
        "And inside the product: app/(auth)/signin/page.tsx, app/(app)/dashboard/page.tsx, components/app/dashboard/empty-events.tsx, components/app/create-event/*, the sonner calls in the event and curation actions, components/app/notifications/*, app/(app)/account/page.tsx, components/guest/entry/*, components/guest/upload/*, components/guest/album/empty-album.tsx, and the mail templates behind the lifecycle cron.",
      ],
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The picked voice as the block that lands in marketing-voice.ts.",
      wiring: [
        "The paste covers the thesis, the subhead and the six section headers. The rest of a sweep is component edits rather than constants: the feature cards, the wizard's helper, the guest door and the mail templates each carry their own strings, and the spot section's wiring fold names the file for every one.",
      ],
    },
  ],

  controls: [
    /**
     * ★ THE PICK IS CLEARABLE AND OPENS ON NOTHING (Will, 2026-09-16: "I can't
     * unpick a selection to return to a non-selected state"). Nothing picked
     * means the page below and the paste show the site as it ships, and the
     * winner ask mirrors this control, so a press on a card IS the preview.
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
    // Three controls that serve one question each: declared, so their ask can
    // draw every answer as a tile, and kept off every strip, because a question
    // asked twice on one screen is the thing this round is deleting.
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
      note: "Read the six. The same headline, the same sentence under it and the same button, written six ways at a phone's own column.",
    },
    {
      section: "pages",
      state: { voice: "live" },
      note: "The board's own pick, worn by the whole page. A page has to land in the voice it opened in.",
    },
    {
      section: "spots",
      state: { area: "app", "compare-a": "plain", "compare-b": "aside" },
      note: "The quiet volume, where a voice earns or loses its keep. An error and a storage warning are where wit stops being free.",
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
