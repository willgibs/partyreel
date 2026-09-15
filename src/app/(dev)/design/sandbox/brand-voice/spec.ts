import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE BRAND-VOICE BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15).
 *
 * Nothing here is new argument. Every ask, candidate, departure and section
 * lede is round four's, moved out of `board.tsx` and out of its hand-drawn lead
 * card so that the template, the desk, the record and the review ledger read
 * ONE list. What changed is where a reviewer meets them: the verdict and the
 * seven one-word calls are the first screen instead of a card the board drew
 * itself, and a ruling is composed by the review panel rather than typed.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or `voices.ts` (which imports two production copy modules) would drag a
 * client tree into a server render.
 */
export const BRAND_VOICE = defineBoard({
  id: "brand-voice",
  title: "The brand voice",
  question:
    "What Partyreel sounds like, written on sixteen real surfaces across marketing, the host's app and a guest's phone, then priced on whole pages.",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template, and every specimen moved into a true viewport. A surface is now judged inside a real 1440 or 375 document rather than a div, which retires the board's own heading-ladder and gutter workarounds. No candidate, number or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Turned around on Will's two notes: the board opens on the voices WRITING sixteen real surfaces on the components that ship them, and every voice writes every line, so no comparison prints the word unchanged.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "The walk Will would take, taken first: the verdict on top, the cost measured rather than asserted, and the three pages the arc never reaches.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "Whole pages instead of headers: the home arc top to bottom, two feature pages with their cards, the thirty identity strings as a paste. Candidate C retired.",
    },
    {
      n: 1,
      date: "2026-09-14",
      changed:
        "The voice written down for the first time: a guide, three registers, and three candidates on the seven provisional home headers.",
    },
  ],
  context:
    "There was no voice doc anywhere: the only written copy rule in the repo was the em-dash ban. Bible 20 (affirmative only) was messy, don'ts without do's, and bible 21 opened every line until a voice existed. So the guide is written from the ground up and argued here, and two parked copy rulings ride the board: the account-required unfurl line, and the five copy-alternative picks. No production byte changes on this track; a later round, voice-infusion, carries the ruled voice site-wide.",

  verdict: {
    recommendation:
      "B, the room: the voice built from the one thing only this product does, a code on a table becoming an album while the party is still going.",
    because:
      "It is the only candidate whose sentences could not be said by a shared folder or a group chat, because it stays inside the moment the album fills instead of describing it from the morning after. A, the house, is the cheap answer and a real one: it tunes the register the eight ratified lines already speak, and it barely moves the feature pages, which are finished.",
    overrule:
      "B costs a row on the loudest line: the h1 takes 3 rows at 1440 and 4 at 375 against today's 2 and 3. If that row is too expensive, A carries none of it and none of the lift.",
  },

  asks: [
    {
      id: "voice",
      question: "The voice",
      options: ["b", "a", "today"],
      recommended: "b",
      because:
        "Read the five loudest surfaces in all three columns before anything else. B is the only one that says what only this product does; A is the register the ratified lines already speak, written down.",
      overrule:
        "If B reads as writing rather than as talking on the hero, A is the answer and the rest of the guide is unchanged.",
      evidence: "marketing",
    },
    {
      id: "headers",
      question: "The seven provisional home headers",
      options: ["whole", "line-by-line"],
      recommended: "whole",
      because:
        "The arc is the one stretch of the site that has to read as one voice, and seven headers chosen from different columns is how it stops. Line by line is available in the ledger under every chapter.",
      evidence: "arc-event",
    },
    {
      id: "arc",
      question: "The rest of the arc: its eyebrows, supporting lines and CTAs",
      options: ["take", "hold"],
      recommended: "take",
      because:
        "The headers are a third of the arc's 65 lines. Ruling the headers and holding the rest leaves the loudest sentence in one voice and the sentence under it in another.",
      evidence: "arc-close",
    },
    {
      id: "bible-20",
      question: "Bible 20's replacement, in one sentence",
      options: ["yes", "send-back"],
      recommended: "yes",
      because:
        "Lead with what arrives; an absence may be the second beat, never the first, and never both. It keeps the ruled Scan, upload, done. No app to install. and kills the doubled-absence header.",
      evidence: "voice",
    },
    {
      id: "thesis",
      question: "The thesis",
      options: ["keep", "take"],
      recommended: "keep",
      because:
        "In one album is the line the site has said long enough to be recognised, and B already carries the perspective argument in the hero's second line. The alternative costs a row at 1440 and nothing at 375.",
      evidence: "thesis",
    },
    {
      id: "noun",
      question: "One noun for the thing",
      options: ["album", "split"],
      recommended: "album",
      because:
        "The site says album in every heading, nav label and directory line; a guest's screen says gallery in five places. A guest who scans a code on the site's promise lands on a different product's noun.",
      evidence: "guest",
    },
    {
      id: "unfurl",
      question: "The account-required unfurl line",
      options: ["email", "sign-in"],
      recommended: "email",
      because:
        "It is what the host is actually asking for, and it is the smaller promise. Sign in names our machinery on a link a host pastes into their own group chat.",
      evidence: "unfurl",
    },
  ],

  candidates: [
    {
      id: "room",
      name: "B, the room",
      recommended: true,
      rationale:
        "A rebuild from the product's one idea, the code becoming the album. Verb in front, present tense, the room as the setting, real counts as evidence. A sentence is about the moment, not the object. It rewrites half again as much of the site as A.",
    },
    {
      id: "house",
      name: "A, the house",
      rationale:
        "A tuning. The voice already exists in the eight ratified lines; write it down, then bring back the lines that drifted. A sentence is about what the host ends up holding. It changes the least, so it lifts the least.",
    },
    {
      id: "today",
      name: "Today",
      rationale:
        "The control, not a candidate: the shipped strings verbatim. The voice is unwritten, so the arc drifts between an absence, a state and an instruction, and nothing holds the next hundred lines to anything.",
    },
  ],

  departures: [
    {
      id: "candidate-c",
      from: "precedent",
      text: "Candidate C was RETIRED as a column in round two, which is the board's judgment rather than a ruling. Across fifteen sections and two whole pages it read as B with everyone substituted in seven places, so it cost a third of the board and answered nothing B did not. Its one real question, the thesis, is its own section and ask. Say the word and it comes back.",
      evidence: "thesis",
    },
    {
      id: "copy-picks",
      from: "ruling",
      text: "The five copy-alternative picks have lost their list: the queue item predates the docs consolidation and no list survives in the repo. The board reads it as the five headers carrying an appetite for a DIFFERENT line (liveDemo, album, curation, privacy, reel), marked with a dot in the ledgers. Correct it and the board adds the missing picks.",
      evidence: "arc-event",
    },
    {
      id: "two-counts",
      from: "precedent",
      text: "The home page is about to carry two different counts: the hero variations propose 312 photos from 48 guests as a stand-in, and the decomposition band two sections below ships Built from 214 photos. Shot by 23 guests. Do 3 of the guide makes that one source and one pair of numbers, read from the demo event.",
      evidence: "arc-event",
    },
    {
      id: "never-expire",
      from: "precedent",
      text: "The create wizard's date helper says events never expire, and the product's rule is that an event stays until the host deletes it: there is deliberately no end date, which is the anti-abuse core. The line is on the board in all three voices, and the fix belongs to the sweep whichever voice wins.",
      evidence: "app",
    },
  ],

  assets: [],

  sections: [
    {
      id: "marketing",
      title: "In use: marketing, loud",
      lede: "Five surfaces a reader meets before they sign up, each written three ways inside a real viewport on the real ground: the home hero, the album chapter, a card set, the pricing pair and a help opening.",
      argument: [
        "Will, on round three: there is a handful of notes about the voices, but not a lot of actual usage examples to get a feel for each voice through. So the board opens on the voices WRITING rather than on notes about them, on the components that ship the line rather than in a card.",
        "Every voice writes every line here, even where a sweep would keep today's, because a comparison exists to show a difference and a row printing the same string twice under the word unchanged teaches nothing. Where all three still land on the same string, the row carries the REASON. What a sweep would actually MOVE is the ledgers, from the arc on.",
      ],
    },
    {
      id: "app",
      title: "In use: the host's app, quiet",
      lede: "Seven surfaces of real app UI on the app's own theme: the dashboard's empty state, the shipped event card in the dashboard's grid, the create wizard, two toasts, the two errors, a notification and the account page.",
      argument: [
        "The app's UI is open to a lab track this round (Will, 2026-09-15), so these render as UI rather than as text in a card, which is what round three did and what made the quiet register hard to judge at all.",
        "Some app copy is a prop and some is a component edit, and the difference sets the size of the sweep: the event card's two pills arrive from the dashboard, its amber review chip is hardcoded in the card itself.",
      ],
    },
    {
      id: "guest",
      title: "In use: a guest's phone, and the inbox",
      lede: "Four surfaces at 375, always, because that is the only place they render: the door in its three gates, the upload sheet, the empty album and the inactivity mail.",
      argument: [
        "Bible 4 decides more here than the voice does: a guest surface belongs to the host's event and Partyreel stays nearly silent. That is why the door's account-required line is marked compelled rather than chosen: the shipped line asks a guest to make an account with US on the host's own page, so the sweep rewrites it whichever voice wins. Its only choosable part is the noun, which is its own ask.",
      ],
    },
    {
      id: "voice",
      title: "The voice, in one paragraph",
      lede: "The selected voice written out, with what it costs, the three registers shown once, and the sentence that replaces bible 20.",
      argument: [
        "The three registers do NOT fork with the voice: round one found it on four surfaces, round two confirmed it on eleven, round four wrote all sixteen and counted. Only the marketing register's default sentence shape moves, so a ruling on the voice is a ruling on one row of the guide's table.",
      ],
    },
    {
      id: "arc-event",
      title: "The home arc I: the event",
      lede: "Seven sections in shipped order on cinema, in the selected voice, with today beside them line by line and every held line marked. The h1's rows are measured under the stage rather than asserted.",
      wiring: [
        "The ledger is the surface a line-by-line ruling is written on: every slot, today above the candidate, with held marked where a voice keeps the shipped string.",
      ],
    },
    {
      id: "arc-paper",
      title: "The home arc II: the morning after",
      lede: "The three sections of the host's desk, on paper. The album chapter opens it as a left masthead at the lg tier, which is why its line carries more weight than the two beneath it.",
    },
    {
      id: "arc-close",
      title: "The home arc III: the payoff",
      lede: "The last five, back on cinema, and the SECTION_HEADERS paste. The arc has to land in the voice it opened in, which is the thing a header-by-header comparison cannot show.",
      wiring: [
        "The paste is the artifact a ruling lands: real TypeScript for marketing-voice.ts, generated from the same data the stage above renders, never typed by hand.",
      ],
    },
    {
      id: "thesis",
      title: "The thesis, both ways",
      lede: "All that survives of candidate C, on the surface it actually renders: the site's loudest line at the hero tier, on cinema. One clause settles it, and the ruler says what the clause costs in rows.",
    },
    {
      id: "album-page",
      title: "A feature page, whole: album",
      lede: "The h1, the hero sub, every eyebrow, header and supporting line, and all nineteen cards with their titles, in order, on the two grounds the page really uses. The cards are its body weight, so the ledger counts them.",
    },
    {
      id: "curation-page",
      title: "A feature page, whole: curation",
      lede: "The second page, and the harder one: its whole body is one paper chapter of decisions, cards included, so the voice has to stay quiet enough to read as a working document and loud enough to still be marketing.",
    },
    {
      id: "strings",
      title: "The thirty strings, as a paste",
      lede: "The identity layer behind all six feature pages: the nav label, the panel one-liner, the h1, the hero sub and the directory line, with the bands the panel and the six hub doors wrap against.",
    },
    {
      id: "utility",
      title: "Help, contact and pricing",
      lede: "The three pages a reader reaches when they are deciding or when something broke. They carry the site's two most generic sentences, and two real help article heads close the last gap in the guide's surfaces table.",
    },
    {
      id: "unfurl",
      title: "The unfurl, both ways",
      lede: "The parked ruling on the surface it renders: what a host's group chat shows. The public variant sits above as the control, because the two lines have to read as one set.",
    },
  ],

  controls: [
    {
      id: "voice",
      label: "Voice",
      options: [
        { id: "today", label: "Today" },
        { id: "house", label: "A, the house" },
        { id: "room", label: "B, the room" },
      ],
      default: "room",
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
      id: "app",
      label: "The app's theme",
      options: [
        { id: "app-light", label: "App light" },
        { id: "app-dark", label: "App dark" },
      ],
      default: "app-light",
    },
  ],

  lookFirst: [
    {
      section: "marketing",
      note: "The hero, three ways, at 1:1 on cinema. A writes today's two ratified lines back, because keeping them IS A's argument, so only the eyebrow and the second CTA move.",
    },
    {
      section: "marketing",
      state: { canvas: "phone" },
      note: "The same five surfaces in three real 375 viewports, abreast. B's extra row on the h1 is visible here rather than asserted, because these are documents and not scaled boxes.",
    },
    {
      section: "app",
      state: { canvas: "desktop", app: "app-dark" },
      note: "The wizard and the notification, on the app's dark. Two of the three corrections are on screen: one line says something the product does not do.",
    },
    {
      section: "guest",
      note: "The door in three gates, three voices, nine cards. Bible 4 decides more than the voice does, and the album and gallery split is visible in one screen.",
    },
    {
      section: "arc-event",
      note: "Now the price. Fifteen sections in shipped order with today beside every line: A moves 23 of 65 arc lines, B moves 33.",
    },
    {
      section: "album-page",
      note: "Where a voice does the LEAST. The feature pages are finished, so A moves 3 of 48 card strings and B moves 6. That gap is the sharpest thing on the board about what adopting a voice means.",
    },
  ],

  notes: [
    {
      section: "marketing",
      text: "The pricing card is the shipped markup with the shipped numbers: the price, the storage and the event cap all render from tiers.ts, so no voice can move one. Two of its five feature lines are shown rather than all five.",
    },
    {
      section: "app",
      text: "All three event cards say the same words on the amber chip on purpose: that string is hardcoded in event-card.tsx while the other two pills arrive as props. The row below is where the candidates part, and the difference is a component edit.",
    },
    {
      section: "utility",
      text: "Both help article heads hold in every column, which is the finding rather than an omission: the 59 articles were written to the shape the guide prescribes, so a voice ruling costs the help catalogue nothing.",
    },
  ],

  links: {
    bible: [2, 4, 6, 19, 20, 21],
    spec: "docs/specs/brand-voice.md",
  },
});
