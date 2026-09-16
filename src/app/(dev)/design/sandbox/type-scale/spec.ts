import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE TYPE-SCALE BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15;
 * the four asks rewritten in plain words the same night, the clarity round).
 *
 * Nothing here is new argument. Every ask, candidate and departure is round
 * four's, moved out of `board.tsx` (its `ASKS`, its `DEPARTURES`, its
 * `BoardMeta` props) so that the template, the desk, the record and the review
 * ledger read ONE list. What changed is where a reviewer meets them: the
 * verdict and the four one-word calls are the first screen instead of sitting
 * under two paragraphs of preamble, and the board's four acts are declared
 * sections the dock can jump to and the walk can drive.
 *
 * ★ AN ASK IS ANSWERABLE WHERE IT IS MET, NOT ONLY ON THE BOARD. Will's first
 * review through the desk stopped at questions that were a label and a row of
 * tokens ("it was tough to understand what I was being asked for most of those
 * questions"), and a desk session shows an ask with the board a tab away. So
 * each question here says what the thing is and where it lives on the site
 * (`context`), which section and which switch to look at (`look`), and what
 * each option would actually do (`means`), and each option is NAMED rather
 * than lettered. The jargon this board runs on is glossed where it is first
 * met or dropped: a ladder is a set of heading sizes, leading is line spacing,
 * tracking is letter spacing, a register is one half of the site. The ids
 * never changed and never will: the review ledger joins on them.
 *
 * ★ THIS FILE IS ALSO THE ASK LIST `ladders.ts` COUNTS. `candidateCss` prints
 * "the fourth ask" inside the block Will copies, and round three proved that a
 * hand-typed ordinal goes stale the moment an ask is cut: `askOrdinal` reads
 * THIS array. The import points one way only (ladders.ts imports the spec, the
 * spec imports nothing but the kit's types), so the spec stays pure data and
 * `registry.ts` can hand it to a server page and to a node test.
 *
 * ★ AND THE CANDIDATE IDS ARE THE LADDER IDS, deliberately: `b`, `c`, `a`,
 * `today` are what `ladders.ts` calls them, what the two dock switches write
 * into the URL, and what a one-word ruling says. `ladders.test.ts` pins the two
 * lists equal so a ladder cannot be renamed here and not there.
 */
export const TYPE_SCALE = defineBoard({
  id: "type-scale",
  title: "The type scale",

  question:
    "Which heading sizes should the site use, one set for the marketing pages and one for the signed-in app, chosen separately and judged on the real pages at 1440 and at 375?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The four questions rewritten in plain words: each says what the thing is, where to look and what choosing an option would do, and each option is named rather than lettered. The candidates carry those names on the evidence and in the dock. No size, candidate or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The marketing reconstructions came off and seven real ROUTES went on, in frames exactly the canvas wide. The two registers became two switches in the dock, so any pair of ladders composes into one set.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "The board started answering: four asks with the board's own answer beside each, and the tracking law made adoptable on its own.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "Apply to the site, so a ladder is judged on the real pages, and the clamp the wiring round bakes.",
    },
    {
      n: 1,
      date: "2026-09-14",
      changed:
        "Four ladders written out at both ends, because today's phone end is hidden inside a class string.",
    },
  ],
  context:
    "Bible 5 holds and its numbers were never written. Today's ladder hides its phone end inside a class string, and written out that end has three distinct sizes doing the work of six: a page title and a chapter opener are both 36px, and the masthead sits four pixels above the home hero. Line-height arrives with whichever size class a ramp lands on. And every heading, from a 160px masthead to a 16px card title, is tracked at the same -0.03em.",

  verdict: {
    recommendation:
      "B on both halves of the site, with letter spacing made a function of size, and the page-not-found heading brought onto the same set.",
    because:
      "One set of sizes from 12 to 160 that widens as it climbs: every heading has a size at both ends of the screen and takes its line spacing and letter spacing from that size instead of picking them. Today's desktop sizes are already a rough, unevenly rounded version of that set, and the app finally gets the middle size it has never had.",
    overrule:
      "C, if the public pages should read like a poster and the signed-in app should go quieter than it is today rather than louder.",
  },

  asks: [
    {
      id: "marketing",
      question: "Which heading sizes should the marketing pages use?",
      context:
        "Marketing is the public half of the site: the home page, pricing, the feature pages, about, help. Its headings run from the huge word at the top of a page down to a card title, and each size also carries a line spacing (the gap between wrapped lines) and a letter spacing (how tightly the letters sit). Four candidates propose a set of them. Today's set was never written down.",
      look: "Section 01, the Marketing table: each row is one candidate read left to right, and the last columns mark only the faults that candidate's own numbers fix. Picking a row wears it on every page below.",
      options: [
        {
          id: "b",
          label: "B, rungs: one size set, 12 to 160",
          means:
            "Marketing stands on a shared set of sizes that widens as it climbs; the phone middle goes quieter to buy the top of the page its room.",
        },
        {
          id: "c",
          label: "C, registers: the public pages as a poster",
          means:
            "Five louder steps, a 200px word over a 120px headline, and the 24 to 30px tier folded up into the section heading above it.",
        },
        {
          id: "a",
          label: "A, tuned: today's sizes, kept",
          means:
            "Every desktop size the site ships stays; the phone end is unpacked so six headings separate, and each size names its own spacing.",
        },
        {
          id: "today",
          label: "Today, exactly as it ships",
          means:
            "Nothing changes: five marketing sizes, and at 375 three of them doing the work of six.",
        },
      ],
      recommended: "b",
      because:
        "One set of sizes from 12 to 160 that widens as it climbs, so every heading has a size at both ends of the screen and takes its spacing from that size rather than picking one. Today's desktop sizes are already a rough version of it.",
      overrule:
        "C, if the front of the site should read like a poster: 200px over 120px rather than 160 over 100, and one fewer size in the middle.",
      evidence: "glance",
      state: { canvas: "desktop" },
      control: "marketing",
    },
    {
      id: "app",
      question: "Which heading sizes should the signed-in app use?",
      context:
        "The app is everything behind sign-in: the dashboard, an event's page, the guest album, the admin portal. It has two heading sizes today, a 24px page title and a 16px card title, with nothing between them, so the row headings that belong in the gap are written as small uppercase labels inside a heading tag.",
      look: "Section 01's second table, then section 06: the dashboard, the missing middle size and an admin page, each beside what production writes there today. Flip the App switch to compare two candidates.",
      options: [
        {
          id: "b",
          label: "B, rungs: one size set, 12 to 160",
          means:
            "The app gets a middle size at last, and the page title grows from 24px on a phone to 28px on a desktop instead of standing still at both.",
        },
        {
          id: "c",
          label: "C, registers: the app as an instrument",
          means:
            "Quieter than today: a 20px page title, with weight and colour carrying the rank beneath it, so the photographs stay the loud thing.",
        },
        {
          id: "a",
          label: "A, tuned: today's sizes, kept",
          means:
            "The app is untouched, which is this candidate's cost: no middle size, so the row headings stay labels wearing a heading tag.",
        },
        {
          id: "today",
          label: "Today, exactly as it ships",
          means:
            "Nothing changes: a 24px page title and a 16px card title, the same two at both screen widths.",
        },
      ],
      recommended: "b",
      because:
        "The app gets the middle size it has never had, so the three row headings wearing a heading tag become headings, and the page title grows from 24px on a phone to 28px on a desktop instead of standing still at both.",
      overrule:
        "C, if the app's chrome should go quieter than today rather than louder: a 20px title, with weight and colour carrying the rank under it.",
      evidence: "app",
      state: { canvas: "desktop" },
      control: "app",
    },
    {
      id: "tracking",
      question: "Should a heading's letter spacing change with its size?",
      context:
        "Letter spacing is how tightly the letters of a word sit together. Every heading on the site, from the 160px word at the top of /about down to a 16px card title, is pulled in by the same amount today. The proposal makes it a function of size instead: tighter as a heading grows, looser as it shrinks. It moves no sizes, so it can be adopted whichever candidate wins.",
      look: "Section 08: the same word at the masthead size and the same card title at 16px, once under each option. Neither of those rows moves when you flip the Marketing or App switch, which is what makes this its own call.",
      options: [
        {
          id: "adopt",
          label: "Adopt it: spacing follows size",
          means:
            "Each size carries its own letter spacing and line spacing. No size moves anywhere on the site under this option on its own.",
        },
        {
          id: "keep",
          label: "Keep one value for every heading",
          means:
            "The single value stays, and so do a loose 160px word and a card title pulled tight at the size that is read most.",
        },
      ],
      recommended: "adopt",
      because:
        "It is a function of size, so it moves no size and can be taken whichever candidate wins, and it is the only one of today's faults that today's numbers can fix by themselves.",
      overrule:
        "Keep the one value, if one number for every heading is the simplicity worth a loose masthead and a tight card title.",
      evidence: "law",
      state: { canvas: "desktop" },
    },
    {
      id: "not-found",
      question:
        "Should the page-not-found heading use the site's heading font?",
      context:
        "One screen catches every dead link: a mistyped public URL, a signed-in page that no longer exists, an admin page, and every guest link to a deleted event. Its title is the only page title on the site set in Inter, the body font, and it sits at a size no candidate's set reaches.",
      look: "Section 07: the same screen twice, exactly as it ships on the left and on the chosen set of sizes on the right. The left half is pinned, so it never moves when you flip a switch.",
      options: [
        {
          id: "on-ladder",
          label: "Put it on the site's heading set",
          means:
            "The title joins the set: the heading font, the app 404 at the page size and the public 404 at the size just above a card title.",
        },
        {
          id: "leave-off",
          label: "Leave it in Inter, as it ships",
          means:
            "The one page title in the body font stays, and the exception is written down rather than quietly fixed.",
        },
      ],
      recommended: "on-ladder",
      because:
        "It is the only page title on the site in Inter, and it is not an edge case: the marketing 404, the app 404, the admin 404 and every dead guest link.",
      overrule:
        "Leave it off, and the exception becomes documented rather than swept.",
      evidence: "not-found",
      state: { canvas: "desktop" },
    },
  ],

  candidates: [
    {
      id: "b",
      name: "B, rungs",
      recommended: true,
      rationale:
        "One rung set from 12 to 160 with the ratio widening as it climbs. Every step sits on a rung at both ends, and leading and tracking are read off the rung, never chosen.",
    },
    {
      id: "c",
      name: "C, registers",
      rationale:
        "Two registers rather than one ladder. Marketing becomes editorial and much louder at the top; the app becomes an instrument and goes quieter, with weight carrying the hierarchy.",
    },
    {
      id: "a",
      name: "A, tuned",
      rationale:
        "Today's desktop numbers, kept. The phone end unpacked so six steps separate, a named leading on every step, and tracking inverse to size. The app is untouched, which is its cost.",
    },
    {
      id: "today",
      name: "Today",
      rationale:
        "The shipped ladder, both ends written out. Five marketing steps, two app steps, one tracking value for all of them. The control every other column is read against.",
    },
    {
      id: "law",
      name: "The spacing law alone",
      rationale:
        "Today's sizes, every one of them, with leading and tracking running inverse to size instead of a flat -0.03em. The smallest thing the board can ship, and its own apply button.",
    },
  ],

  departures: [
    {
      id: "registers",
      from: "precedent",
      text: "One token set with two registers, and it was the board's call to make rather than Will's ask: nine names, one @theme block, and the register is only which rungs each half stands on. The full case is the argument under the glance.",
      evidence: "glance",
    },
    {
      id: "c-prose-tier",
      from: "ruling",
      text: "C collapses marketing's six heading steps to five and folds the 24/30 prose tier into the section step, so /about's story sections and /press's sections move up a tier. That contradicts design-system.md's documented three-tier h2 ladder; it is C's argument, not an oversight.",
      evidence: "pair",
    },
    {
      id: "b-arithmetic",
      from: 2,
      text: "B states bible 2 as arithmetic: marketing travels four rungs between 375 and 1440 and the app travels one. That turns 'marketing may be louder' from a judgement into a rule, which is a bible finding if B is adopted, and B is what the board recommends for both registers.",
      evidence: "pair",
    },
    {
      id: "404-face",
      from: 5,
      text: "Bible 5 says one heading face on one site ladder, and the 404's h1 has always been outside both: Inter at 600, the only page title on the site that is not the heading face. Every paste puts it on the ladder, which is a change no ruling has made yet, so it is an ask rather than a silent fix.",
      evidence: "not-found",
    },
    {
      id: "masthead-squeeze",
      from: "precedent",
      text: "Every candidate closes the masthead's tracking squeeze (.mkt-name opens to +0.022em) onto the display step's OWN tracking, between -0.04em and -0.05em, rather than the shared -0.03em constant it lands on today. The paste closes it in marketing.css's own two places and leaves the squeeze itself running.",
      evidence: "loudness",
    },
  ],

  assets: [],

  sections: [
    {
      id: "glance",
      title: "The four candidates, side by side",
      lede: "One table per half of the site: each row is a candidate read left to right at the selected screen width, every number taken from the candidate itself, and the last columns marking only the faults its own numbers actually fix.",
      argument: [
        "Nine names, one @theme block, and the register is which rungs each half stands on: display through prose are marketing's, page through card are the app's. Two distinct sets would name every role twice and then have to answer which set a Card wears, since CardTitle is one component that ships on /pricing and on the dashboard, and it would duplicate the tracking law, which is a function of size and not of surface. Nothing in the set is computed from anything else in it, so the two halves are ruled separately without the set splitting: that is what the two switches in the dock are.",
        "A row is a fix only if the ladder data makes it true, so a column cannot claim a fix it does not make: the ticks are computed by fixes() from the same steps the specimen renders. At 1440 that is also why A's marketing column reads as today's column, and the flat line under the table says so rather than letting a dead-looking control read as a broken one.",
      ],
      eager: true,
    },
    {
      id: "pair",
      title: "Every size, written out",
      lede: "Each heading size the chosen pair would use at this screen width: the numbers, the word Partyreel set at that size, and a hairline the height of today's letters beside it, so the change reads as a shape before it reads as two numbers.",
    },
    {
      id: "loudness",
      title: "How loud the top of a page is",
      lede: "The one huge word at the top of /about, at all four marketing candidates on one dark ground, loudest first. B and A keep today's 160px; C proposes 200px over a 120px headline.",
      argument: [
        "This is the one thing on the board that changes what the front of the site feels like, which is why it is judged on its own ground rather than inside the specimen: a 200px word beside a 160px word is a comparison the eye can make, and the same two numbers in a table is not.",
      ],
    },
    {
      id: "tokens",
      title: "The set a later round would bake in",
      lede: "The chosen pair as the table a wiring round types into the stylesheet: one fluid rule per size, so the set runs smoothly from 375 to 1440 with no width left to jump at, plus the two blocks this board hands the site.",
      wiring: [
        "Three tiers move with the wiring round rather than with a paste, and a heading that does not budge under an applied block is one of them, not a broken block: the app's section heading, which production writes as a label inside an h2 with no class worth aiming at; sixteen hand-rolled marketing headings at 30 / 36 that stop one rung short of SectionShell's ramp; and the guest entry title, written inline. Aiming a step at any of the three would move the real site under the Today pair, which is the control this board rests on.",
        "What the other boards changed here, re-read in round five: nothing moved. The kill-mono sweep left the stat register on the heading face at 30 / 36, a size no hook reaches, so the wiring round takes it as a step and not as a class. Palette, light, floating-surfaces, rounding and media-kit still move no size, leading or tracking, and the one shell change this board asked for (an island on admin and on the guest routes) landed in round four and is reported live beside the Apply buttons.",
      ],
    },
    {
      id: "pages",
      title: "Real pages, at the pixels they ship",
      lede: "Seven real pages, each in a window exactly as wide as the selected screen and wearing the chosen sizes: the page's own layout at that width, the sizes resolved by the browser, nothing scaled or redrawn.",
      argument: [
        "A frame gets three things a stage cannot. The canvas's own breakpoints, so at 375 the page's real phone layout runs instead of a desktop layout in a narrow box; an EVALUATED clamp rather than one resolved here by hand, so the board shows the token the wiring round bakes instead of arithmetic about it; and everything else on the page moving with the step, which is the reach of the ruling made visible.",
      ],
    },
    {
      id: "app",
      title: "The app, where the headings are quiet",
      lede: "The guest album as a real page, then the four signed-in surfaces a window cannot hold still, built here from the production components with the chosen sizes handed to them.",
      argument: [
        "The dashboard, the event page and admin are stages rather than frames, and the reason is not reach: all three mount a design island and all three are in the walk, so an applied block reaches them in a real tab. What a frame of them cannot do is hold still. /admin is behind a second factor, and the dashboard and the event page render whichever events the reviewer's own account holds that morning, so the surface being compared would change between two flips of a switch. A composed stage also carries the one thing no frame can: a tier production does not have.",
      ],
    },
    {
      id: "not-found",
      title: "The page-not-found heading",
      lede: "The screen every dead link lands on sets its title in Inter, the body font, at a size no candidate reaches. It is the marketing 404, the app 404, the admin 404 and every dead guest link.",
    },
    {
      id: "law",
      title: "Letter spacing, on its own",
      lede: "The same word at the masthead size and the same card title at 16px, under one flat value and under the proposal. No size moves in the top half, which is what makes this a separate ruling.",
      argument: [
        "The pairing is not departed from, and it is no longer an ask. Inter with Urbanist survives the loudest step once tracking runs inverse to size: what reads wrong at 160px and again at 16px is the constant -0.03em, not the face. The pairing check sits under the law because it is the same evidence read twice, and a face round would be its own ruling.",
        "The dock applies the law to the real site on its own, so this ask can be walked on the real pages with no size moving underneath the answer. That is the whole reason it keeps a second button beside the pair's.",
      ],
    },
  ],

  controls: [
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    // ★ THE TWO SWITCHES WEAR THE CANDIDATES' OWN NAMES (the clarity round,
    // 2026-09-15), so the option a question offers is the option the dock
    // previews. They carry the NAME and the asks carry the name plus its gloss,
    // the way the light board's Register switch does: the kit's ControlKnobs
    // only wraps a segmented control above six options, and four glossed labels
    // measure 372px inside a 327px dock at 375, which is a sideways-scrolling
    // document rather than a wide control (toggle.tsx's own landmine).
    {
      id: "marketing",
      label: "Marketing",
      options: [
        { id: "b", label: "B, rungs" },
        { id: "c", label: "C, registers" },
        { id: "a", label: "A, tuned" },
        { id: "today", label: "Today" },
      ],
      default: "b",
    },
    {
      id: "app",
      label: "App",
      options: [
        { id: "b", label: "B, rungs" },
        { id: "c", label: "C, registers" },
        { id: "a", label: "A, tuned" },
        { id: "today", label: "Today" },
      ],
      default: "b",
    },
  ],

  lookFirst: [
    {
      section: "glance",
      note: "Both halves of the site at once, with the faults each candidate fixes. If the shape is wrong here, the rest of the walk is the wrong argument.",
    },
    {
      section: "loudness",
      state: { marketing: "c" },
      note: "C, registers at its loudest: a 200px word over a 120px headline. This is the one call that changes what the front of the site feels like, and it is the fastest to make.",
    },
    {
      section: "pair",
      state: { canvas: "phone", marketing: "today" },
      note: "Today, exactly as it ships, at 375: the page title and the chapter opener both at 36px, and the huge word only four pixels above the one under it. Six sizes reading as three is the whole phone fault.",
    },
    {
      section: "pages",
      state: { canvas: "desktop", marketing: "b" },
      note: "The home page at 1440, wearing B, rungs. Scroll inside the window: this is the whole real page at the pixels it ships, not a drawing of it.",
    },
    {
      section: "app",
      state: { app: "c" },
      note: "C, registers on a real dashboard, and the middle size beside what production writes there today. Flip the App switch to B, rungs and back here.",
    },
    {
      section: "law",
      note: "The masthead and a card title under one flat letter spacing and under the proposal. No size moves in the top half, which is what makes it a ruling of its own.",
    },
  ],

  notes: [
    {
      section: "pair",
      state: { canvas: "phone" },
      text: "At 375 today's page title and chapter opener are both 36px, and the huge word sits four pixels above the one under it. That collapse is only visible at this width, which is why every candidate carries both ends rather than one list of sizes.",
    },
    {
      section: "app",
      state: { canvas: "desktop" },
      text: "Measured in the album window: the guest entry title is written inline at 28px, a third hand-rolled heading outside both halves of the set, so nothing there moves under any pair. It is the surface most people who ever see Partyreel see.",
    },
  ],

  links: {
    bible: [2, 5],
    spec: "docs/specs/type-scale.md",
    pages: [
      {
        label: "the home",
        path: "/",
        note: "the display step and the whole arc",
      },
      {
        label: "/pricing",
        path: "/pricing",
        note: "the title step over plan cards",
      },
      {
        label: "a feature page",
        path: "/features/curation",
        note: "the title step as six pages wear it",
      },
      {
        label: "/help",
        path: "/help",
        note: "the title step on a dense index",
      },
      { label: "/about", path: "/about", note: "the masthead, on paper" },
      {
        label: "/contact",
        path: "/contact",
        note: "the title step, short page",
      },
      {
        label: "the dashboard",
        path: "/dashboard",
        note: "the app register, signed in",
      },
      {
        label: "the admin portal",
        path: "/admin",
        note: "the quietest surface in the product",
      },
      {
        label: "a marketing 404",
        path: "/events/not-a-real-event",
        note: "the one h1 that is off the ladder",
      },
    ],
  },
});
