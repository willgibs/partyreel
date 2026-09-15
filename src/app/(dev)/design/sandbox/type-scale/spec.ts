import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE TYPE-SCALE BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15).
 *
 * Nothing here is new argument. Every ask, candidate and departure is round
 * four's, moved out of `board.tsx` (its `ASKS`, its `DEPARTURES`, its
 * `BoardMeta` props) so that the template, the desk, the record and the review
 * ledger read ONE list. What changed is where a reviewer meets them: the
 * verdict and the four one-word calls are the first screen instead of sitting
 * under two paragraphs of preamble, and the board's four acts are declared
 * sections the dock can jump to and the walk can drive.
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
    "One heading ladder for marketing and one for the app, chosen separately, on the real pages at 1440 and 375: which sizes, leading and tracking?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. The answer block became the template's Answer, the two glance tables became the kit's SelectTable, the acts became declared sections a walk can drive, and the page frames became the kit's Frame. No ladder, number or recommendation changed.",
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
      "B on both registers, with the tracking law adopted and the 404's h1 brought onto the ladder.",
    because:
      "One rung set from 12 to 160 with the ratio widening as it climbs: every step sits on a rung at both ends and reads its leading and its tracking off the rung rather than choosing them. Today's desktop ladder is an unevenly rounded version of it already, so this is the ladder the site is a rough draft of, and the app finally gets the middle tier it has never had.",
    overrule:
      "C, if the front of the site should read as a poster and the app's chrome should go quieter than today rather than louder.",
  },

  asks: [
    {
      id: "marketing",
      question: "The marketing ladder",
      options: ["b", "c", "a", "today"],
      recommended: "b",
      because:
        "One rung set from 12 to 160 with the ratio widening as it climbs, every step sitting on a rung at both ends and reading its leading and its tracking off the rung. Today's desktop ladder is an unevenly rounded version of it already.",
      overrule:
        "C, if the front of the site should read as a poster: 200 over 120 rather than 160 over 100, and the prose tier folded away.",
      evidence: "glance",
    },
    {
      id: "app",
      question: "The app ladder",
      options: ["b", "c", "a", "today"],
      recommended: "b",
      because:
        "The app gets the middle tier it has never had, so the three h2s that are labels wearing a heading tag become a heading, and the page title grows from 24 on a phone to 28 on a desktop instead of standing still at both.",
      overrule:
        "C, if the chrome should go quieter than today rather than louder: a 20px title, with weight and colour carrying the rank under it.",
      evidence: "app",
    },
    {
      id: "tracking",
      question: "The tracking law",
      options: ["adopt", "keep"],
      recommended: "adopt",
      because:
        "It is a function of size, so it moves no size and can be taken whichever ladder wins, and it is the only one of today's faults that today's numbers can fix by themselves.",
      overrule:
        "Keep the constant, if one value for every heading is the simplicity worth paying a loose masthead and a tight card title for.",
      evidence: "law",
    },
    {
      id: "not-found",
      question: "The 404's h1",
      options: ["on-ladder", "leave-off"],
      recommended: "on-ladder",
      because:
        "It is the only page title on the site in Inter, and it is not an edge case: the marketing 404, the app 404, the admin 404 and every dead guest link.",
      overrule:
        "Leave it off, and the exception becomes documented rather than swept.",
      evidence: "not-found",
    },
  ],

  candidates: [
    {
      id: "b",
      name: "B. Rungs",
      recommended: true,
      rationale:
        "One rung set from 12 to 160 with the ratio widening as it climbs. Every step sits on a rung at both ends, and leading and tracking are read off the rung, never chosen.",
    },
    {
      id: "c",
      name: "C. Registers",
      rationale:
        "Two registers rather than one ladder. Marketing becomes editorial and much louder at the top; the app becomes an instrument and goes quieter, with weight carrying the hierarchy.",
    },
    {
      id: "a",
      name: "A. Tuned",
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
      name: "The law alone",
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
      title: "The ladders at a glance",
      lede: "The four ladders per register at the selected canvas, every number read off the ladder data, with the faults each column fixes counted rather than claimed.",
      argument: [
        "Nine names, one @theme block, and the register is which rungs each half stands on: display through prose are marketing's, page through card are the app's. Two distinct sets would name every role twice and then have to answer which set a Card wears, since CardTitle is one component that ships on /pricing and on the dashboard, and it would duplicate the tracking law, which is a function of size and not of surface. Nothing in the set is computed from anything else in it, so the two halves are ruled separately without the set splitting: that is what the two switches in the dock are.",
        "A row is a fix only if the ladder data makes it true, so a column cannot claim a fix it does not make: the ticks are computed by fixes() from the same steps the specimen renders. At 1440 that is also why A's marketing column reads as today's column, and the flat line under the table says so rather than letting a dead-looking control read as a broken one.",
      ],
      eager: true,
    },
    {
      id: "pair",
      title: "The pair, written out",
      lede: "Every step of both registers at the selected canvas: the numbers, the brand word set at that step, and today's cap beside it as a hairline so the delta reads as a shape before it reads as two numbers.",
    },
    {
      id: "loudness",
      title: "The loudness question",
      lede: "The masthead at all four marketing ladders on one dark ground, strongest first. B and A keep today's 160; C proposes 200 over a 120 hero.",
      argument: [
        "This is the one thing on the board that changes what the front of the site feels like, which is why it is judged on its own ground rather than inside the specimen: a 200px word beside a 160px word is a comparison the eye can make, and the same two numbers in a table is not.",
      ],
    },
    {
      id: "tokens",
      title: "One token set, two registers",
      lede: "The pair as the token table the wiring round bakes, one clamp a step, and the two blocks this board hands the whole site.",
      wiring: [
        "Three tiers move with the wiring round rather than with a paste, and a heading that does not budge under an applied block is one of them, not a broken block: the app's section heading, which production writes as a label inside an h2 with no class worth aiming at; sixteen hand-rolled marketing headings at 30 / 36 that stop one rung short of SectionShell's ramp; and the guest entry title, written inline. Aiming a step at any of the three would move the real site under the Today pair, which is the control this board rests on.",
        "What the other boards changed here, re-read in round five: nothing moved. The kill-mono sweep left the stat register on the heading face at 30 / 36, a size no hook reaches, so the wiring round takes it as a step and not as a class. Palette, light, floating-surfaces, rounding and media-kit still move no size, leading or tracking, and the one shell change this board asked for (an island on admin and on the guest routes) landed in round four and is reported live beside the Apply buttons.",
      ],
    },
    {
      id: "pages",
      title: "Real pages, at the pixels they ship",
      lede: "Seven real routes in frames exactly the canvas wide, with the pair written into each document: real breakpoints, evaluated clamps, nothing scaled.",
      argument: [
        "A frame gets three things a stage cannot. The canvas's own breakpoints, so at 375 the page's real phone layout runs instead of a desktop layout in a narrow box; an EVALUATED clamp rather than one resolved here by hand, so the board shows the token the wiring round bakes instead of arithmetic about it; and everything else on the page moving with the step, which is the reach of the ruling made visible.",
      ],
    },
    {
      id: "app",
      title: "The app, where the ladder is quiet",
      lede: "The guest album as a real page, then the four app surfaces a frame cannot hold still, composed from the production components with three custom properties handed to them.",
      argument: [
        "The dashboard, the event page and admin are stages rather than frames, and the reason is not reach: all three mount a design island and all three are in the walk, so an applied block reaches them in a real tab. What a frame of them cannot do is hold still. /admin is behind a second factor, and the dashboard and the event page render whichever events the reviewer's own account holds that morning, so the surface being compared would change between two flips of a switch. A composed stage also carries the one thing no frame can: a tier production does not have.",
      ],
    },
    {
      id: "not-found",
      title: "The 404's h1",
      lede: "not-found-screen.tsx renders its title in Inter at 600, with a tracking-tight the theme zeroes. It is the marketing 404, the app 404, the admin 404 and every dead guest link.",
    },
    {
      id: "law",
      title: "The tracking law, alone",
      lede: "The same word at the masthead size and the same card title at 16, under the flat -0.03em and under the law. No size moves in the top half, which is what makes this a separate ruling.",
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
    {
      id: "marketing",
      label: "Marketing",
      options: [
        { id: "b", label: "B" },
        { id: "c", label: "C" },
        { id: "a", label: "A" },
        { id: "today", label: "Today" },
      ],
      default: "b",
    },
    {
      id: "app",
      label: "App",
      options: [
        { id: "b", label: "B" },
        { id: "c", label: "C" },
        { id: "a", label: "A" },
        { id: "today", label: "Today" },
      ],
      default: "b",
    },
  ],

  lookFirst: [
    {
      section: "glance",
      note: "Both registers at once, with the faults each column fixes. If the shape is wrong here the rest of the walk is the wrong argument.",
    },
    {
      section: "loudness",
      state: { marketing: "c" },
      note: "C's 200px masthead over a 120 hero. This is the one call that changes what the front of the site feels like, and it is the fastest one to make.",
    },
    {
      section: "pair",
      state: { canvas: "phone", marketing: "today" },
      note: "Today's phone end, written out: title and chapter both at 36 and display four pixels above hero. Six steps reading as three is the whole phone-end fault.",
    },
    {
      section: "pages",
      state: { canvas: "desktop", marketing: "b" },
      note: "The home arc at 1440, wearing B. Scroll inside the frame: this is the whole page at the pixels it ships, not a reconstruction of it.",
    },
    {
      section: "app",
      state: { app: "c" },
      note: "The quiet register on a real dashboard, and the missing middle beside what production writes there today. Flip the App switch to B and back here.",
    },
    {
      section: "law",
      note: "The masthead and a card title under the flat -0.03em and under the law. No size moves in the top half, which is what makes it a ruling of its own.",
    },
  ],

  notes: [
    {
      section: "pair",
      state: { canvas: "phone" },
      text: "At 375 today's title and chapter are both 36px and display sits four pixels above hero. That collapse is only visible at this canvas, which is why every ladder carries both ends rather than a list of sizes.",
    },
    {
      section: "app",
      state: { canvas: "desktop" },
      text: "Measured in the album frame: the guest entry title is written inline as font-heading text-[28px], a third hand-rolled heading outside both registers, so nothing there moves under any pair. It is the surface most people who ever see Partyreel see.",
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
