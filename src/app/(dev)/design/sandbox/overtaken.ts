/**
 * THE QUESTIONS AN EARLIER RULING REACHED (Will, 2026-09-19, the fifth batch;
 * extended 2026-09-20 for the sixth batch and its second paste).
 *
 * ★ HIS RULING IS THE WHOLE SPEC. "I'd still like to see the explorations that
 * were voided by my decisions. There's a chance that their opportunities or
 * ideas would have been more helpful than the selection I made that voided
 * them. Don't want an earlier selection to kill what could have been a better
 * idea down the road." So nothing is deleted, nothing is redrawn, and no answer
 * is ever recorded by precedent. A question a later ruling reaches stays in its
 * board's walk, wearing a badge that says which ruling reached it and one line
 * from the agent that read the options against it; he can answer it as drawn
 * (an OVERRIDE, recorded as the new ruling) or press "The ruling stands" (the
 * trash he asked for, drawn as the answer it actually is).
 *
 * ★ WHY THIS FILE EXISTS AT ALL, RATHER THAN A FIELD ON THE ASK. A board's
 * `spec.ts` is the one home of its questions and it is NEVER edited by another
 * lane: an ask reached by a ruling made after it was drawn is a fact about the
 * ruling, not about the question. Putting it here keeps the boards' specs
 * untouched (so their authors, their rounds and their ledgers all still line
 * up), keeps `docs/reviews/` free of anything a lane writes, and gives the desk
 * and the step ONE list to read. It is pure data: no React, no `server-only`,
 * so the server desk and the client step both import it.
 *
 * ★ AND THE OUTCOME IS DERIVED, NEVER STORED. Whether a ruling stood or was
 * overridden is a fact about the LEDGER (`docs/reviews/<board>.json`), which is
 * the one home of what was answered; a copy of it here would drift the first
 * time he changed his mind. `outcomeOf` joins the two at read time, exactly as
 * `status.ts` derives "answered" from a spec minus a ledger.
 *
 * Keyed `<board>.<ask>`, which is `stepId`'s spelling, so a key is readable as
 * the URL it badges.
 */

/** The reserved answer: the earlier ruling stands, and the wiring follows it. */
export const STANDS = "stands";

/**
 * The note that rides a `stands` clause by default. The grammar refuses a bare
 * reserved word for the reason it refuses a bare `?`: a ledger row nobody can
 * read back is a decision that has to be reconstructed from memory.
 */
export const STANDS_NOTE = "the earlier ruling stands";

export type OvertakenNote = {
  /** The board whose ruling reached this ask; the `on:` of the window echo. */
  by: string;
  /** When, in plain words: "app-shape r1, 19 Sep". */
  since: string;
  /** What was ruled, in plain words a stranger knows: "sharing is a sheet". */
  ruling: string;
  /**
   * The lane's one line, and the only judgment in this file. Exactly
   * `stands: <why this option may beat the ruling>` or
   * `concedes: <what the ruling covers>`. Never longer, never a redraw.
   *
   * ★ A SECOND RULING APPENDS, IT NEVER REPLACES (the sixth batch's pass). An
   * ask the first pass already badged keeps its first entry word for word, and
   * a later ruling that reaches the same question rides behind ALSO_REACHED:
   * the judgment that was made stays readable beside the fact that moved under
   * it, which is the whole point of a file that never deletes anything.
   */
  line: string;
};

/**
 * The clause a second ruling appends to a line the first pass already wrote.
 * One sentence, in the badge's own plain words, naming the board and the date.
 */
export const ALSO_REACHED = " Also reached by ";

/** What the ledger says happened to an overtaken ask. Derived, never stored. */
export type Outcome = "open" | "stood" | "overrode";

/* The fifth batch (2026-09-19): four boards ruled, thirteen reached. */
const APP_SHAPE = { by: "app-shape", since: "app-shape r1, 19 Sep" } as const;
const GLASS = { by: "glass", since: "glass r1, 19 Sep" } as const;

/* The sixth batch and its second paste (2026-09-20): eight boards ruled. */
const GUEST_SHAPE = {
  by: "guest-shape",
  since: "guest-shape r1, 20 Sep",
} as const;
const VOCABULARY = {
  by: "app-vocabulary",
  since: "app-vocabulary r1, 20 Sep",
} as const;
const AVATAR = { by: "seed-avatar", since: "seed-avatar r1, 20 Sep" } as const;
const ADMIN = { by: "admin", since: "admin r1, 20 Sep" } as const;
const DOOR = { by: "app-door", since: "app-door r1, 20 Sep" } as const;
const CRYSTAL = { by: "glass", since: "glass r2, 20 Sep" } as const;
const DEMO = { by: "demo-event", since: "demo-event r1, 20 Sep" } as const;
const PRICING = {
  by: "pricing-page",
  since: "pricing-page r1, 20 Sep",
} as const;

/**
 * THE ASKS AN EARLIER RULING HAS REACHED, in desk order, across two passes.
 *
 * The first pass (`overtaken`, the fifth batch) read 29 asks across thirteen
 * boards against four rulings. This one reads every open ask on every standing
 * board against the sixth batch's eight, and the second paste's two: 47 more
 * questions, and nine of the first pass's lines gain a second clause because a
 * later ruling reached the same question again. Every line was written from the
 * board's own option set read against the ruling that reaches it; none of them
 * redraws anything, and a board never overtakes its own question (his own note
 * on the board he is walking is an answer, not a backdrop that moved).
 *
 * Three kinds, and the line says which without a field for it: the ones he
 * answered OUTRIGHT in a note on another board (the line concedes), the ones
 * whose option or whose "as today" baseline is now GONE (the line says whether
 * what is left still beats the ruling), and the ones still STANDING with the
 * backdrop moved under them.
 */
export const OVERTAKEN: Readonly<Record<string, OvertakenNote>> = {
  /* ── app-shape ───────────────────────────────────────────────────────── */
  "app-shape.you": {
    ...DOOR,
    ruling:
      "one account object wears every door, and the account page takes a passkey card",
    line: "stands: the account page is already collecting the person's own rows, and One You is the only option that gives them one door.",
  },

  /* ── guest-shape ─────────────────────────────────────────────────────── */

  /* ── app-vocabulary ──────────────────────────────────────────────────── */
  // Round one's seven asks (empty-states, loading, tile-grammar,
  // bulk-toolbar, gallery-controls-home, gallery-controls-persistence,
  // confirm-switch) are ruled and gone from the board (album-controls,
  // 2026-09-20, the `profile-page` precedent: a round drops its questions
  // rather than accreting them). The five badges that named them are gone
  // with the asks they pointed at (the first test's own contract: a badge
  // pointing at a question nobody is asking any more is worse than an
  // answer left orphaned). Round two's `controls-home` is too new for
  // anything to have overtaken it yet.

  /* ── admin ───────────────────────────────────────────────────────────── */

  /* ── app-door ────────────────────────────────────────────────────────────
   * Round one's `surfaces`, `welcome` and `page` were badged here (all
   * "stands"); round two replaces round one's seven asks with one, `tour`
   * ("a round replaces its questions rather than accreting them", spec.ts),
   * so all three questions this section badged are gone from the board's own
   * walk. The ledger keeps his "stands" answers for ever
   * (docs/reviews/app-door.json once transcribed); this file only holds a
   * badge on a QUESTION STILL ASKED, and none of the three still is
   * (overtaken.test.ts, "the one failure this exists to catch"). Removed by
   * `welcome-tour`, the lane that retired the asks, rather than left dangling
   * for whichever lane happened to run the suite next. */

  /* ── app-pricing ─────────────────────────────────────────────────────── */
  "app-pricing.object": {
    ...GUEST_SHAPE,
    ruling: "the guest's four dialogs all wear the one responsive sheet",
    line: "concedes: the one sheet is built and ruled for the whole product, which is this ask's sheet option word for word.",
  },
  "app-pricing.first": {
    ...DOOR,
    ruling:
      "one account object worn four ways, each wear passing the reason it asks",
    line: "stands: a surface told why it opened is ruled vocabulary now, so this asks which reason wins, not whether to carry one.",
  },
  "app-pricing.carry": {
    ...PRICING,
    ruling:
      "the pricing page keeps its tiles and its table and loses the shared band",
    line: "stands: the marketing page's contents are settled now, so parity has a measured height and fitted is the only one a hand holds.",
  },
  "app-pricing.pass": {
    ...PRICING,
    ruling: "the Event Pass gets a wide card of its own beneath Free and Pro",
    line: "stands: the pass just won a card of its own on the page, which is the full option's argument, and a hand still has to hold it.",
  },
  "app-pricing.doors": {
    ...APP_SHAPE,
    ruling: "plans and billing live on the account page",
    line: "concedes: his You answer puts billing on the account page, which is this ask's third option word for word. Also reached by app-door r1, 20 Sep: a passkey card lands on that page too, so it is where rows go.",
  },
  "app-pricing.words": {
    ...VOCABULARY,
    ruling:
      "a repeated control becomes one component with props, never four hand-rolled copies",
    line: "stands: one component for a repeated pattern is ruled twice over, so this asks how much the chip says rather than whether to unify.",
  },

  /* ── first-event ─────────────────────────────────────────────────────── */
  "first-event.style": {
    ...APP_SHAPE,
    ruling: "one share sheet holds the code, the posters and anything future",
    line: "concedes: the share sheet is where the designer lands, which is this ask's on-the-real-code option.",
  },
  "first-event.landing": {
    ...APP_SHAPE,
    ruling:
      "the event is a hub: a cards row, a live QR in the header, the gallery beneath",
    line: "stands: the hub rules what the event page is, never what Create ends on, and the one-time beat is still unasked. Also reached by app-door r1, 20 Sep: the welcome tour now holds the product's one-time screen.",
  },
  "first-event.hand": {
    ...APP_SHAPE,
    ruling:
      "sharing is a sheet, with a QR mini-modal for a bigger scannable code",
    line: "stands: the mini-modal is a modal doing three jobs; full screen at full brightness is the only one that reads across a dark room.",
  },
  "first-event.empty": {
    ...APP_SHAPE,
    ruling:
      "the event is a hub: a cards row, a live QR in the header, the gallery beneath",
    line: "stands: the hub puts the code in the header and says nothing about the album's empty room, which the launch list still fills. Also reached by guest-shape r1, 20 Sep: the guest's own empty album carries the river.",
  },

  /* ── guest-upload ────────────────────────────────────────────────────── */
  "guest-upload.tap": {
    ...GUEST_SHAPE,
    ruling: "the guest's four dialogs all wear the one responsive sheet",
    line: "stands: our own chooser is a ruled sheet now and free to build, and two buttons still save a tap nobody else is charging for.",
  },
  "guest-upload.sending": {
    ...GUEST_SHAPE,
    ruling: "a new photograph grows into its column under a glow that fades",
    line: "stands: the arrival itself is designed now, so all this decides is whether the seconds before it are narrated at all.",
  },
  "guest-upload.batch": {
    ...CRYSTAL,
    ruling:
      "one media tile draws every album grid, each tile placed in an explicit column",
    line: "stands: an arriving tile keeps every other one in its column now, which takes the reflow out of the case against a tile per file.",
  },
  "guest-upload.landing": {
    ...GLASS,
    ruling:
      "a media tile carries only state: an active like, a play mark, a subtle count",
    line: "stands: the rule clears the tile of controls, which is the empty surface the single shimmer pass was drawn for. Also reached by guest-shape r1, 20 Sep: an arrival now lands under a glow that fades.",
  },
  "guest-upload.held": {
    ...GLASS,
    ruling: "a media tile carries only state, never a control",
    line: "stands: a tile waiting under a clock is state and nothing else, which is exactly what the rule leaves a tile allowed to say.",
  },
  "guest-upload.failed": {
    ...DOOR,
    ruling:
      "a failure keeps its line short and puts the ways out on real buttons",
    line: "stands: the door's failures carry their recoveries as buttons now, so a tile keeping its reason is house style, not a proposal.",
  },
  "guest-upload.warning": {
    ...GUEST_SHAPE,
    ruling: "a gated event opens on a welcome, and the gate comes after it",
    line: "stands: a screen whose whole job is context before the act exists now, which gives the terms a second home to be weighed against.",
  },
  "guest-upload.words": {
    ...GUEST_SHAPE,
    ruling:
      "the account is asked at the door, and keeping the album is offered after the first photograph",
    line: "stands: Save has already left the head of the album, so the banner is the last thing standing above the grid and may follow it.",
  },

  /* ── media-viewer ────────────────────────────────────────────────────── */
  "media-viewer.opening": {
    ...GLASS,
    ruling: "the album sits blurred at half brightness behind the lightbox",
    line: "stands: the ruling fixes the ground behind a photograph, never the way it opens, and growing from its tile still says which one.",
  },
  "media-viewer.holds": {
    ...GLASS,
    ruling: "every action on a photograph lives in the lightbox's controls",
    line: "stands: the rule says the controls carry every action, not what shape they take, and one strip holds more than two capsules. Also reached by app-vocabulary r1, 20 Sep: he narrowed that rule to a phone.",
  },
  "media-viewer.who": {
    ...AVATAR,
    ruling:
      "every account wears a colour of its own, with the initial at every size",
    line: "stands: attribution has a face to ride now, so this asks where the name sits rather than whether it has anything to sit on.",
  },
  "media-viewer.video": {
    ...VOCABULARY,
    ruling:
      "one media tile draws every album grid, carrying a play mark as state",
    line: "stands: the play mark is one component on every tile now, so the badge is the tile's own glyph grown up rather than a new one.",
  },
  "media-viewer.wayout": {
    ...GUEST_SHAPE,
    ruling:
      "the guest's dialogs wear one sheet: a side panel at a desk, a bottom sheet in a hand",
    line: "stands: the sheet teaches a drag back down in a hand now, so swiping a photograph into the grid is a gesture the product has.",
  },

  /* ── host-curation ───────────────────────────────────────────────────── */
  "host-curation.queue": {
    ...VOCABULARY,
    ruling:
      "one media tile draws every album grid, from the guest's to the bin",
    line: "stands: one tile draws every grid now, so the queue inherits the album's own shapes and the square crop is the exception to build.",
  },
  "host-curation.peek": {
    ...GLASS,
    ruling: "every action on a photograph lives in the lightbox's controls",
    line: "concedes: his tiles rule puts every action in the one lightbox, which is this ask's media-viewer option. Also reached by app-vocabulary r1, 20 Sep: he narrowed that rule to a phone, so the desk's half is open again.",
  },
  "host-curation.undo": {
    ...VOCABULARY,
    ruling:
      "the review bar and the gallery's bulk bar become one bar with an actions prop",
    line: "stands: both bulk bars are one component now, so whatever this answers lands on the gallery's bar in the same breath.",
  },
  "host-curation.arrivals": {
    ...GUEST_SHAPE,
    ruling:
      "a new photograph grows into its column and the album re-flows around it",
    line: "stands: the guest's album already takes an arrival without moving anything else, so the machinery is built and this sets its manners.",
  },
  "host-curation.count": {
    ...APP_SHAPE,
    ruling: "the dashboard opens on what needs you: the waiting queues first",
    line: "stands: the pulse answers the aggregate count, leaving the bell and the chip to agree or go, which is still this question.",
  },
  "host-curation.told": {
    ...GUEST_SHAPE,
    ruling:
      "a guest may delete any photograph they uploaded, for ever, and the host cannot restore it",
    line: "stands: a guest owns their own photographs for good now, which gives the quiet line in their own feed a claim it never had.",
  },

  /* ── reel-studio ─────────────────────────────────────────────────────── */
  "reel-studio.door": {
    ...APP_SHAPE,
    ruling: "the event is a row of cards: Review, Reel, Guests, Settings",
    line: "concedes: the Reel card in the hub's row is the door now, and it is none of these three.",
  },
  "reel-studio.room": {
    ...CRYSTAL,
    ruling:
      "one glass material everywhere, and the reel's own controls are one pane of it",
    line: "stands: a control floating over the reel has a ruled material now, so the room's shape is the only thing this still picks.",
  },
  "reel-studio.moments": {
    ...GUEST_SHAPE,
    ruling:
      "the guest's dialogs wear one sheet: a side panel at a desk, a bottom sheet in a hand",
    line: "stands: the one sheet is a side panel at a desk, so it stops covering the reel there and only a hand still pays this option's price.",
  },
  "reel-studio.blocked": {
    ...VOCABULARY,
    ruling:
      "the product's own tooltip opens the instant a pointer arrives, never delayed",
    line: "stands: our tooltip is ruled and instant now, which replaces the native one at a mouse and still says nothing at all to a thumb.",
  },
  "reel-studio.sharing": {
    ...APP_SHAPE,
    ruling: "sharing gets one comprehensive sheet, reached from the event",
    line: "stands: the sheet holds where sharing is asked, never what taking it back costs, which is all this ask decides.",
  },

  /* ── export-flow ─────────────────────────────────────────────────────── */
  "export-flow.means": {
    ...GUEST_SHAPE,
    ruling:
      "a guest may delete any photograph they personally uploaded, for ever",
    line: "stands: the product has to know a guest's own photographs for good now, so leading the bundle with them costs nothing new.",
  },
  "export-flow.wait": {
    ...GUEST_SHAPE,
    ruling: "the guest's Download wears the one responsive sheet",
    line: "stands: Download wears the one sheet now, so holding it open until the bytes land is a decision about that sheet.",
  },
  "export-flow.stuck": {
    ...DOOR,
    ruling:
      "a failure keeps its line short and puts the ways out on real buttons",
    line: "stands: the ways out of a failure are real buttons now, which is Try again by another name, leaving only the timer to pick.",
  },
  "export-flow.object": {
    ...APP_SHAPE,
    ruling:
      "the album's link and a copy button sit under the event's metadata and in the share sheet",
    line: "concedes: the share ruling already places the link and its copy twice, which is what this ask wanted the dialog to lead with. Also reached by guest-shape r1, 20 Sep: Download is one of the four dialogs on the one sheet.",
  },

  /* ── admin-triage ────────────────────────────────────────────────────── */
  "admin-triage.look": {
    ...ADMIN,
    ruling:
      "the portal is a table for data and a list beside the message for a prose inbox",
    line: "concedes: a prose inbox is ruled a list beside the message, which is this ask's frame beside the reason, a row each.",
  },
  "admin-triage.verdict": {
    ...ADMIN,
    ruling:
      "a destructive act opens one sheet sized to the damage, and only a permanent act makes you type",
    line: "stands: typing is reserved for the permanent act now, which is the half of this his own sheet rule already argues against.",
  },
  "admin-triage.closed": {
    ...ADMIN,
    ruling:
      "the portal is a table for data and a list beside the message for a prose inbox",
    line: "stands: history is data and the portal's data is a table now, so the log option has the component it was asking for.",
  },
  "admin-triage.escalate": {
    ...ADMIN,
    ruling: "a destructive act opens one sheet sized to the damage",
    line: "stands: the preserve panel is one of those sheets now, so a door from the report opens a surface that already exists.",
  },
  "admin-triage.phone": {
    ...ADMIN,
    ruling:
      "the portal wears a 44 px tool bar with a crumb, a live tag, a health chip and an initial",
    line: "stands: the portal's bar is measured for a thumb now, so the shell already reaches 375 and only the verbs are left to pick.",
  },
  "admin-triage.idiom": {
    ...ADMIN,
    ruling: "a prose inbox is a list beside the message, on every one of them",
    line: "stands: the inboxes share one shape now, which leaves this asking about their words and their statuses, not their furniture.",
  },
  "admin-triage.notice": {
    ...GUEST_SHAPE,
    ruling:
      "a guest may delete any photograph they uploaded, and the host cannot restore it",
    line: "stands: a host already meets one silent gap in the album now, so this asks whether the portal is allowed to make a second.",
  },

  /* ── help-center ─────────────────────────────────────────────────────── */
  "help-center.from-product": {
    ...GUEST_SHAPE,
    ruling:
      "the guest's actions dock at the foot of the album, and go to a second round",
    line: "stands: the guest's own action block is still being redrawn, so a standing Help row would be joining something unfinished.",
  },
  "help-center.feedback": {
    ...ADMIN,
    ruling:
      "the portal opens on four figures and a fortnight's trend, the queue beneath",
    line: "stands: the portal's home is numbers now, so a per-article miss rate has a page to land on rather than needing one of its own.",
  },
  "help-center.search": {
    ...ADMIN,
    ruling:
      "the portal gets a rail and a command palette, built on the help palette if it can be",
    line: "stands: the portal is ruled to build on this very palette, so where it mounts is now a question with a second tenant.",
  },

  /* ── emails ──────────────────────────────────────────────────────────── */
  "emails.shell": {
    ...VOCABULARY,
    ruling:
      "a repeated control becomes one component with props, never four hand-rolled copies",
    line: "stands: the batch folded four near-identical components into one apiece, which is this ask's own wrapper argument made elsewhere.",
  },
  "emails.code": {
    ...DOOR,
    ruling: "one email field, and the code is the way in for everybody",
    line: "stands: the code is the product's one door now, so the button alone is gone and this asks only what rides under the digits.",
  },
  "emails.guest": {
    ...GUEST_SHAPE,
    ruling:
      "keeping the album becomes a one-tap offer after a guest's first photograph",
    line: "stands: the address is taken on a promise to keep the album now, and this mail is the only thing that would keep it.",
  },

  /* ── site-chrome ─────────────────────────────────────────────────────── */
  "site-chrome.foot-after": {
    ...DEMO,
    ruling:
      "every demo door shows the party: the footer's photo pile, skinned per place",
    line: "stands: he took that pile for the demo's doors and still read the reuse as unpolished, which is this ask's own worry about it.",
  },

  /* ── profile-page ────────────────────────────────────────────────────── */
  "profile-page.view-all": {
    ...GUEST_SHAPE,
    ruling:
      "the guest's dialogs wear one sheet: a side panel at a desk, a bottom sheet in a hand",
    line: "stands: the sheet is built and ruled now, so it is the cheapest of the four and a page is the only one that buys anything new.",
  },
  "profile-page.quick-look": {
    ...APP_SHAPE,
    ruling: "one responsive sheet everywhere, and a mini-modal for the QR",
    line: "stands: both halves of the adaptive answer are ruled objects now, so the question is which one a look is, not whether to build one. Also reached by seed-avatar r1, 20 Sep: every guest has a face of their own now.",
  },
  "profile-page.way-back": {
    ...APP_SHAPE,
    ruling:
      "the app's bar carries a crumb trail: Partyreel, the event, the room",
    line: "stands: the crumb rides the host app's bar and a scanned guest is on the album's header, where the pill is the only way back. Also reached by guest-shape r1, 20 Sep: the guest's chrome goes to a second round.",
  },

  /* ── privacy-hero ────────────────────────────────────────────────────── */
  "privacy-hero.concept": {
    ...CRYSTAL,
    ruling:
      "one glass material everywhere, with a double edge and nothing borrowed",
    line: "stands: frosted is a named material now, so the access grid's tiles would wear it and the choice is the mechanism, not the finish.",
  },

  /* ── album-motion ────────────────────────────────────────────────────── */
  "album-motion.fall": {
    ...GUEST_SHAPE,
    ruling: "a new photograph grows into its column under a glow that fades",
    line: "stands: the product's own arrival settles into the album rather than passing under it, so one of these three tells the truth.",
  },

  /* ── loose-ends ──────────────────────────────────────────────────────── */
  "loose-ends.chart-light": {
    ...ADMIN,
    ruling: "the portal opens on four figures and a fortnight's trend",
    line: "stands: these five tones finally have a page that leads with them, so the cast they carry is about to be read every day.",
  },
  "loose-ends.chart-dark": {
    ...ADMIN,
    ruling: "the portal is a devtool, with a 44 px tool bar and a health band",
    line: "stands: the console that leads on these charts reads as a tool, so the dark ramp is the one an operator will live in.",
  },
  "loose-ends.faq-look": {
    ...PRICING,
    ruling:
      "the pricing page ends on a folded accordion, with fewer questions in the row",
    line: "stands: one of the two looks this reconciles was just decided on its own page, which leaves the other to follow it or stay.",
  },
  "loose-ends.everywhere-pill": {
    ...VOCABULARY,
    ruling:
      "a tile carries an active like, a play mark and a subtle count, and nothing else",
    line: "stands: a tile's marks are ruled exactly now, and the hover pill is a desk verb, so a phone stage showing one would be a fiction.",
  },

  /* ── contact-page ────────────────────────────────────────────────────── */
  "contact-page.page": {
    ...PRICING,
    ruling:
      "the pricing page opens on paper, because a dark chapter above the plans read as harsh",
    line: "stands: he just moved a page onto paper to soften that very seam, which is the transition this one is being asked to open with.",
  },
};

/** The key a board and ask are filed under; `stepId`'s spelling, deliberately. */
export const overtakenKey = (board: string, ask: string): string =>
  `${board}.${ask}`;

/** The note on one ask, or none. */
export function overtakenFor(
  board: string,
  ask: string,
): OvertakenNote | undefined {
  return OVERTAKEN[overtakenKey(board, ask)];
}

/** How many of a board's asks an earlier ruling reached: the desk's count. */
export function overtakenOn(board: string): number {
  const head = `${board}.`;
  return Object.keys(OVERTAKEN).filter((k) => k.startsWith(head)).length;
}

/**
 * Whether the lane conceded. A concession is what primes the dock's "The ruling
 * stands" button, so agreeing costs one press; it never records anything by
 * itself (showing is not choosing, step.tsx).
 */
export const concedes = (note: OvertakenNote): boolean =>
  note.line.startsWith("concedes:");

/** The badge's first line, in plain words with the date. Never the clause. */
export const badgeText = (note: OvertakenNote): string =>
  `Ruled since ${note.since}: ${note.ruling}`;

/**
 * ★ "AS TODAY" MEANS SOMETHING ELSE NOW, AND THE SPEC CANNOT SAY SO. An option
 * labelled "the share dialog at 375, as today" was drawn before sharing became
 * a sheet, and the board's spec is never edited by this lane, so the correction
 * rides the badge: one line per step, wherever the step has such an option.
 * Detected rather than listed, so it cannot fall out of step with the words.
 */
export const AS_TODAY_GLOSS = "'as today' here means before that ruling.";

export const saysAsToday = (text: string | undefined): boolean =>
  typeof text === "string" && text.toLowerCase().includes("as today");

/**
 * WHAT THE LEDGER SAYS BECAME OF IT. `open` while nothing is answered, `stood`
 * when the reserved word is held, `overrode` for any real option: an answer to
 * an overtaken question IS the new ruling (his contract, verbatim in
 * rulings.md). "Not clear to me" is not a decision, so it reads as open.
 */
export function outcomeOf(choice: string | null | undefined): Outcome {
  if (
    choice === null ||
    choice === undefined ||
    choice === "" ||
    choice === "?"
  )
    return "open";
  return choice === STANDS ? "stood" : "overrode";
}
