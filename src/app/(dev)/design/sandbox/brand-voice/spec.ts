import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE BRAND-VOICE BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15;
 * the seven asks rewritten in plain words the same night, the clarity round).
 *
 * Nothing here is new argument. Every ask, candidate, departure and section
 * lede is round four's, moved out of `board.tsx` and out of its hand-drawn lead
 * card so that the template, the desk, the record and the review ledger read
 * ONE list. What changed is where a reviewer meets them: the verdict and the
 * seven calls are the first screen instead of a card the board drew itself.
 *
 * ★ AND THE ASKS NOW CARRY THEIR OWN CONTEXT. Will's first review through the
 * desk (2026-09-15) stopped at questions that were labels over tokens: "when
 * you use very technical terms or nicknames from spots in these reports, it
 * makes me have to go deep into the track to gain the relevant context and even
 * begin understanding the question being asked". So every ask below is a real
 * question a stranger can answer where they meet it: what the thing is and
 * where it lives on the site (`context`), which section and which switch to
 * look at (`look`), and every option named in words with what choosing it does.
 * The nicknames this board had grown are glossed or gone: "the house" and "the
 * room" are now named by what each voice DOES, "bible 20" says which rule and
 * what it governs, "the thesis" is the site's one-line promise, "the unfurl" is
 * the preview card a group chat draws, and "the arc" is the home page.
 *
 * ★ THE IDS NEVER CHANGED, BECAUSE THE LEDGER JOINS ON THEM. Every ask id and
 * every option id below is the one round four shipped (`voice: b | a | today`),
 * so an answer recorded against the old wording still resolves. What DID move
 * is the voice CONTROL's option ids, from `today | house | room` to the ask's
 * `today | a | b`, which is what lets the review card preview a pick: the
 * template can only set a control from an option when the two id sets match.
 * `voices.ts` keeps its own internal `VoiceId` keys and `board.tsx` maps the
 * two at the one boundary, because "room" is also a word inside dozens of the
 * lines this board is arguing about and a blind rename would have rewritten
 * them.
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
    "What does Partyreel sound like? Three voices write the same sixteen real surfaces across marketing, the host's app and a guest's phone, then whole pages price the change.",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The seven asks rewritten in plain words: each says what the thing is, where it lives on the site and where to look, and every option is named in words instead of a letter or a token. No candidate, number or recommendation changed, and no new evidence was built.",
  },
  history: [
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "The board moved onto the kit's template, and every specimen moved into a true viewport: a surface is judged inside a real 1440 or 375 document rather than a div.",
    },
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
        "The walk Will would take, taken first: the verdict on top, the cost measured rather than asserted, and the three pages the home page never reaches.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "Whole pages instead of headers: the home page top to bottom, two feature pages with their cards, the thirty identity strings as a paste. Candidate C retired.",
    },
    {
      n: 1,
      date: "2026-09-14",
      changed:
        "The voice written down for the first time: a guide, three registers, and three candidates on the seven provisional home page headers.",
    },
  ],
  context:
    "No voice was written down anywhere: the only copy rule in the repo was the ban on em-dashes. The design bible's rule 20 (say who we are, never who we are not) was don'ts with no do's, and rule 21 opened every line on the site until a voice existed. So the guide is written from the ground up and argued here, and two copy rulings parked long ago ride the board: the line a group chat shows when an event needs an email, and the headers carrying an appetite for a different line. No production byte changes on this track.",

  verdict: {
    recommendation:
      "Take B, the voice rebuilt around the album filling: a code on a table, phones finding it, the event arriving while the party is still on.",
    because:
      "It is the only candidate whose sentences could not be said by a shared folder or a group chat, because it stays inside the moment the album fills instead of describing it the morning after. A is the cheap answer and a real one: it tunes the register the eight approved lines already speak, and it barely moves the feature pages, which are finished.",
    overrule:
      "B costs a row on the biggest headline: three rows at 1440 and four at 375, against today's two and three. If that row is too expensive, A carries none of it and none of the lift.",
  },

  asks: [
    {
      id: "voice",
      question: "Which of the three voices should Partyreel write in?",
      context:
        "A voice is the set of habits every line follows: what a sentence is about, how long it runs, which words are in and which are out. Nothing is written down today, so three are on the board and each writes the same real surfaces, from the home page's biggest headline down to a toast in the app.",
      look: "The first section, In use: marketing. Five surfaces a reader meets before signing up, each written three times in a real browser window, one document per voice, headed with the names below.",
      options: [
        {
          id: "b",
          label: "B, rebuilt around the album filling",
          means:
            "The voice is rebuilt from the one thing only this product does: a code on a table filling an album while the party is on.",
        },
        {
          id: "a",
          label: "A, a tuning of the lines we have",
          means:
            "The register the eight approved lines already speak, written down, with the lines that drifted brought back to it.",
        },
        {
          id: "today",
          label: "Today, the lines the site ships now",
          means:
            "Nothing is rewritten. The site keeps the strings it has, and nothing written down holds the next hundred lines to anything.",
        },
      ],
      recommended: "b",
      because:
        "Read the five loudest surfaces in all three columns before anything else. B is the only one that says what only this product does; A is the register the approved lines already speak, written down at last.",
      overrule:
        "If B reads as writing rather than as talking on the home page's biggest headline, A is the answer and the rest of the guide is unchanged.",
      evidence: "marketing",
      control: "voice",
    },
    {
      id: "headers",
      question:
        "Should all seven home page headers come from one voice, or be picked line by line?",
      context:
        "The home page runs as a column of big section headings (Scan, upload, done. No app to install.). All seven are still provisional, so this round settles them. Picking each from whichever column reads best is allowed; the cost is that the page stops sounding like one person talking.",
      look: "The home page, part 1: seven sections in shipped order inside a real document, with the ledger beside them carrying today's line above each candidate line, header by header.",
      options: [
        {
          id: "whole",
          label: "All seven from the voice you chose",
          means:
            "The seven headers land as one set in the voice picked above, so the page reads in one register from top to bottom.",
        },
        {
          id: "line-by-line",
          label: "Pick each header from any column",
          means:
            "Name the line you want for each of the seven in your note; every option is in the ledger beside the sections.",
        },
      ],
      recommended: "whole",
      because:
        "The home page is the one stretch of the site that has to read as one voice, and seven headers chosen from different columns is how that stops. Line by line stays available in the ledger under every chapter.",
      evidence: "arc-event",
    },
    {
      id: "arc",
      question:
        "Should the rest of the home page's copy move to the chosen voice too?",
      context:
        "The seven headers are a third of the home page's 65 lines. The rest is the small label above each heading, the sentence under it and the button text. This asks whether those move with the headers or keep the words they ship today.",
      look: "The home page, part 3, and the ledgers beside all three home page sections: every slot with today's line above the candidate's, and the lines a voice deliberately keeps marked held.",
      options: [
        {
          id: "take",
          label: "Move the whole page to the voice",
          means:
            "Every small label, supporting sentence and button on the home page is rewritten in the voice you picked.",
        },
        {
          id: "hold",
          label: "Move the seven headers only",
          means:
            "The headers change and everything around them keeps the words it ships today, in whatever register they were written in.",
        },
      ],
      recommended: "take",
      because:
        "Ruling the headers and holding the rest leaves the loudest sentence on the page in one voice and the sentence directly under it in another, which is how a page stops sounding like one person.",
      evidence: "arc-close",
    },
    {
      id: "bible-20",
      question:
        "Should this one sentence replace the design bible's rule 20 on copy?",
      context:
        "Rule 20 says copy should say who we are, never who we are not. It decides whether a line may sell by naming something the reader is spared (no app, no account), and as written it bans that outright, which also bans an approved line. The board proposes: lead with what arrives; an absence may be the second beat, never the first, and never both.",
      look: "The voice section, the card headed The sentence proposed in place of rule 20: the sentence at heading size, then the approved line it keeps and the header it kills.",
      options: [
        {
          id: "yes",
          label: "Yes, adopt that sentence",
          means:
            "Rule 20 is rewritten this way, so a line may name an absence as its second beat and never as its first.",
        },
        {
          id: "send-back",
          label: "Send it back for another try",
          means:
            "Rule 20 stays as it is and the board writes a new replacement; say in your note what is wrong with this one.",
        },
      ],
      recommended: "yes",
      because:
        "It keeps the approved line (Scan, upload, done. No app to install.) and it kills the header built from two absences and no product (Nothing to install. Nothing to sign up for.).",
      evidence: "voice",
    },
    {
      id: "thesis",
      question: "Should the site's one-line promise stay as it is?",
      context:
        "The promise is the sentence at the very top of the home page, above everything else: The whole event, in one album. It was ratified in 2026 and the site has said it ever since. The retired third candidate leaves one alternative clause behind, which moves the claim from where the photos end up to whose eyes they came from.",
      look: "The one-line promise section: both lines at the home page's biggest heading size inside a real document, each headed with its name below, and the row counter underneath saying what each costs in rows.",
      options: [
        {
          id: "keep",
          label: "Keep: The whole event, in one album",
          means:
            "The promise stays the ratified line, which the site has said long enough for a reader to recognise it.",
        },
        {
          id: "take",
          label: "Take: The whole event, as everyone saw it",
          means:
            "The promise changes to the alternative clause, which costs a row at 1440 and nothing at 375.",
        },
      ],
      recommended: "keep",
      because:
        "In one album is the line the site has said long enough to be recognised, and B already carries the perspective argument in the headline's second line.",
      evidence: "thesis",
    },
    {
      id: "noun",
      question: "Should a guest's screen say album, the word the site uses?",
      context:
        "The marketing site says album in every heading, nav label and directory line. The pages a guest lands on after scanning a code say gallery, in five places. So a guest who scans on the strength of the site's promise arrives at a different product's noun.",
      look: "The guest section, and the card headed One noun, or two at the top of it: the door in its three gates, the upload sheet and the empty album at 375, with the word in each heading and button.",
      options: [
        {
          id: "album",
          label: "Album everywhere, guests included",
          means:
            "The five guest-facing places that say gallery change to album, so the whole product has one noun for the thing.",
        },
        {
          id: "split",
          label: "Album on the site, gallery for guests",
          means:
            "The split stays as it ships: the site sells an album and a guest's own screen shows a gallery.",
        },
      ],
      recommended: "album",
      because:
        "A guest who scans a code on the strength of the site's promise should land on the same noun the promise used. Closing the split costs five strings and nothing else.",
      evidence: "guest",
    },
    {
      id: "unfurl",
      question:
        "When an event needs an email, what should the link preview say?",
      context:
        "When a host pastes their event link into a group chat, the chat draws a preview card: a title and one line under it. For an event whose host requires a verified email, that line has to warn the guest. Two wordings are on the board, and one word settles it.",
      look: "The link preview section: the two cards as a group chat draws them, headed with the names below, with an open event's card above as the control so the pair reads as one set.",
      options: [
        {
          id: "email",
          label: "This event asks guests for an email",
          means:
            "The smaller promise, in the host's own words: it names what the guest hands over, not the machinery behind it.",
        },
        {
          id: "sign-in",
          label: "Asks guests to sign in with an email",
          means:
            "The true shape of the door the guest meets, at the cost of naming our sign-in on a link the host pastes themselves.",
        },
      ],
      recommended: "email",
      because:
        "It is what the host is actually asking for, and it is the smaller promise. Sign in names our machinery on a card the host pastes into their own group chat.",
      evidence: "unfurl",
    },
  ],

  candidates: [
    {
      id: "room",
      name: "B, rebuilt around the album filling",
      recommended: true,
      rationale:
        "A rebuild from the product's one idea, the code becoming the album. Verb in front, present tense, the party as the setting, real counts as evidence. A sentence is about the moment, not the object. It rewrites half again as much of the site as A.",
    },
    {
      id: "house",
      name: "A, a tuning of the lines we have",
      rationale:
        "A tuning. The voice already exists in the eight approved lines; write it down, then bring back the lines that drifted. A sentence is about what the host ends up holding. It changes the least, so it lifts the least.",
    },
    {
      id: "today",
      name: "Today, the lines the site ships now",
      rationale:
        "The control, not a candidate: the shipped strings verbatim. No voice is written down, so the home page drifts between an absence, a state and an instruction, and nothing holds the next hundred lines.",
    },
  ],

  departures: [
    {
      id: "candidate-c",
      from: "precedent",
      text: "A third candidate, C, was RETIRED as a column in round two, which is the board's judgment rather than a ruling. Across fifteen sections and two whole pages it read as B with everyone substituted in seven places, so it cost a third of the board and answered nothing B did not. Its one real question, the site's one-line promise, is its own section and ask. Say the word and it comes back.",
      evidence: "thesis",
    },
    {
      id: "copy-picks",
      from: "ruling",
      text: "Five copy alternatives were parked for Will long ago and their list is lost: the queue item predates the docs consolidation and no list survives in the repo. The board reads it as the five home page headers that carry an appetite for a DIFFERENT line (the live demo, the album, curation, privacy, the reel), marked with a dot in the ledgers. Correct it and the board adds the missing ones.",
      evidence: "arc-event",
    },
    {
      id: "two-counts",
      from: "precedent",
      text: "The home page is about to carry two different counts: the hero variations propose 312 photos from 48 guests as a stand-in, and the band two sections below ships Built from 214 photos. Shot by 23 guests. The guide's third do makes that one source and one pair of numbers, read from the demo event.",
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
      lede: "Five surfaces a reader meets before they sign up, each written three ways inside a real browser window on the ground it ships on: the home hero, the album chapter, a card set, the pricing pair and a help opening.",
      argument: [
        "Will, on round three: there is a handful of notes about the voices, but not a lot of actual usage examples to get a feel for each voice through. So the board opens on the voices WRITING rather than on notes about them, on the components that ship the line rather than in a card.",
        "Every voice writes every line here, even where a sweep would keep today's, because a comparison exists to show a difference and a row printing the same string twice under the word unchanged teaches nothing. Where all three still land on the same string, the row carries the REASON. What a sweep would actually MOVE is the ledgers, from the home page on.",
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
      lede: "Four surfaces at 375, always, because that is the only width they render at: the door in its three gates, the upload sheet, the empty album and the inactivity mail. The album-or-gallery ask is judged here.",
      argument: [
        "The bible's fourth rule decides more here than the voice does: a guest surface belongs to the host's event and Partyreel stays nearly silent. That is why the door's account-required line is marked compelled rather than chosen: the shipped line asks a guest to make an account with US on the host's own page, so the sweep rewrites it whichever voice wins. Its only choosable part is the noun, which is its own ask.",
      ],
    },
    {
      id: "voice",
      title: "The voice, in one paragraph",
      lede: "The selected voice written out, with what it costs, the three volumes shown once, and the sentence proposed in place of the design bible's rule 20 on copy.",
      argument: [
        "The three volumes (loud in marketing, quiet in the app, nearly silent on a guest's screen) do NOT fork with the voice: round one found it on four surfaces, round two confirmed it on eleven, round four wrote all sixteen and counted. Only the marketing volume's default sentence shape moves, so a ruling on the voice is a ruling on one row of the guide's table.",
      ],
    },
    {
      id: "arc-event",
      title: "The home page, part 1: the event",
      lede: "Seven sections in shipped order on the dark marketing ground, in the selected voice, with today beside them line by line and every held line marked. The headline's rows are measured under the frame rather than asserted.",
      wiring: [
        "The ledger is the surface a line-by-line ruling is written on: every slot, today above the candidate, with held marked where a voice keeps the shipped string.",
      ],
    },
    {
      id: "arc-paper",
      title: "The home page, part 2: the morning after",
      lede: "The three sections of the host's desk, on the light marketing ground. The album chapter opens it as a left masthead on a wide screen, which is why its line carries more weight than the two beneath it.",
    },
    {
      id: "arc-close",
      title: "The home page, part 3: the payoff",
      lede: "The last five sections, back on the dark ground, and the paste a ruling lands as. The page has to land in the voice it opened in, which is the thing a header-by-header comparison cannot show.",
      wiring: [
        "The paste is the artifact a ruling lands: real TypeScript for marketing-voice.ts, generated from the same data the frame above renders, never typed by hand.",
      ],
    },
    {
      id: "thesis",
      title: "The site's one-line promise, both ways",
      lede: "All that survives of the retired third candidate, on the surface it actually renders: the site's loudest line at the home page's biggest heading size. One clause settles it, and the ruler says what that clause costs in rows.",
    },
    {
      id: "album-page",
      title: "A feature page, whole: album",
      lede: "The headline, the sentence under it, every small label, header and supporting line, and all nineteen cards with their titles, in order, on the two grounds the page really uses. The cards are its body weight, so the ledger counts them.",
    },
    {
      id: "curation-page",
      title: "A feature page, whole: curation",
      lede: "The second page, and the harder one: its whole body is one light-ground chapter of decisions, cards included, so the voice has to stay quiet enough to read as a working document and loud enough to still be marketing.",
    },
    {
      id: "strings",
      title: "The thirty feature-page strings, as a paste",
      lede: "The identity layer behind all six feature pages: the nav label, the panel one-liner, the headline, the sentence under it and the directory line, with the lengths the nav panel and the six hub doors wrap against.",
    },
    {
      id: "utility",
      title: "Help, contact and pricing",
      lede: "The three pages a reader reaches when they are deciding or when something broke. They carry the site's two most generic sentences, and two real help article openings close the last gap in the guide's table of surfaces.",
    },
    {
      id: "unfurl",
      title: "The link preview in a group chat",
      lede: "The parked ruling on the surface it renders: what a host's group chat draws when they paste the event link. An open event's card sits above as the control, because the two lines have to read as one set.",
    },
  ],

  controls: [
    /**
     * ★ THE VOICE CONTROL'S OPTION IDS ARE THE VOICE ASK'S (the clarity round).
     * `registry.test.ts` refuses a `control` whose id set differs from its ask's
     * because the pick IS the preview: the review card sets the control to the
     * option the reviewer chose. So the dock reads `today | a | b` and its
     * labels are the ask's own, word for word, which is also what every column
     * on the evidence is headed with.
     */
    {
      id: "voice",
      label: "Voice",
      options: [
        { id: "today", label: "Today, the lines the site ships now" },
        { id: "a", label: "A, a tuning of the lines we have" },
        { id: "b", label: "B, rebuilt around the album filling" },
      ],
      default: "b",
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
      note: "The home hero, three ways, at 1:1 on the dark ground. A writes today's two approved lines back, because keeping them IS A's argument, so only the small label and the second button move.",
    },
    {
      section: "marketing",
      state: { canvas: "phone" },
      note: "The same five surfaces in three real 375 windows, abreast. B's extra row on the headline is visible here rather than asserted, because these are documents and not scaled boxes.",
    },
    {
      section: "app",
      state: { canvas: "desktop", app: "app-dark" },
      note: "The create wizard and the notification, on the app's dark theme. Two of the three corrections are on screen: one line says something the product does not do.",
    },
    {
      section: "guest",
      note: "The door in three gates, three voices, nine cards. The bible's fourth rule decides more than the voice does, and the album against gallery split is visible in one screen.",
    },
    {
      section: "arc-event",
      note: "Now the price. Fifteen sections in shipped order with today beside every line: A moves 23 of the home page's 65 lines, B moves 33.",
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
      text: "Both help article openings hold in every column, which is the finding rather than an omission: the 59 articles were written to the shape the guide prescribes, so a voice ruling costs the help catalogue nothing.",
    },
  ],

  links: {
    bible: [2, 4, 6, 19, 20, 21],
    spec: "docs/specs/brand-voice.md",
  },
});
