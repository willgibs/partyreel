/**
 * THE QUESTIONS AN EARLIER RULING REACHED (Will, 2026-09-19, the fifth batch;
 * extended 2026-09-20 for the sixth batch and its second paste, and twice more
 * the same night for the closing sitting's two batches).
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
   * ★ A LATER RULING APPENDS, IT NEVER REPLACES (the sixth batch's pass, and
   * the closing sitting's after it). An ask an earlier pass already badged
   * keeps its first entry word for word, and a later ruling that reaches the
   * same question rides behind ALSO_REACHED: the judgment that was made stays
   * readable beside the fact that moved under it, which is the whole point of
   * a file that never deletes anything. One clause per pass, so counting them
   * counts the rounds of rulings that have landed on top of the judgment.
   */
  line: string;
};

/**
 * The clause a later ruling appends to a line an earlier pass already wrote.
 * One sentence, in the badge's own plain words, naming the board and the date.
 */
export const ALSO_REACHED = " Also reached by ";

/**
 * ★ A RULING HE MAY RELITIGATE REACHES NOTHING (the closing sitting, Will,
 * 2026-09-20). Four of `guest-verify` round one's answers are recorded and HELD
 * rather than wired, on his own words: "Sorry if any of these selections are
 * starting to cross wires. May have to relitigate." A held ruling still MOVED
 * the backdrop under other questions, so the reach is worth saying; but the
 * lane may not weigh an option against it, because the thing being weighed may
 * not survive round two. So a question a held ruling reaches carries the badge
 * and NO judgment: this prefix and the clause he wrote, and nothing else.
 *
 * ★ AND A HELD RULING NEVER APPENDS. Where a question is already badged, the
 * standing ruling keeps the line and the hold is recorded in the lane's handoff
 * instead: an appended clause rides INSIDE a judgment, and there is no judgment
 * to ride in. The one place a hold is drawn is a question nothing else reached.
 *
 * ★ AND A HOLD IS SPENT THE MOMENT HE ANSWERS THE QUESTION IT BADGED (the
 * closing sitting's second batch, and its third). `badge=mark` reached
 * `seed-avatar.look` and nothing else; he then answered `look` outright, so the
 * badge retired with the ask and that hold reached nothing at all in the end.
 * `gate=after` reached `first-event.first` the same way, and he answered
 * `first=live` in the third batch: the ask retired with its board and that hold
 * is spent too.
 *
 * ★ SO EVERY HELD RULING NOW REACHES NOTHING, AND THE GRAMMAR STAYS. Both of
 * the identity board's badges were spent by his own answers rather than by
 * round two, which is the second way a hold ends arriving twice before the
 * first ever did. The map holds no held badge today; the words below and the
 * shape the test proves stay exactly as written, because round two rules on a
 * board whose four rulings are still held and the next question one of them
 * reaches will be badged this way and no other.
 */
export const HELD = "held for guest-verify round two: ";

/** Whether this badge names a ruling that is recorded but not yet law. */
export const isHeld = (note: OvertakenNote): boolean =>
  note.line.startsWith(HELD);

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

/* The closing sitting's first batch (2026-09-20, 18:20 EDT): five boards, four
   of them a round two. `body-type` r2 is deliberately absent: a rung that pairs
   an icon with its text is mechanical, it reaches no open question, and round
   one reached none either. `guest-verify`'s four are HELD (above). */
const APP_SHAPE_2 = { by: "app-shape", since: "app-shape r2, 20 Sep" } as const;
const GUEST_SHAPE_2 = {
  by: "guest-shape",
  since: "guest-shape r2, 20 Sep",
} as const;
const VOCABULARY_2 = {
  by: "app-vocabulary",
  since: "app-vocabulary r2, 20 Sep",
} as const;
const VERIFY = {
  by: "guest-verify",
  since: "guest-verify r1, 20 Sep",
} as const;

/* The closing sitting's second batch (2026-09-20, 22:45 EDT; 21 Sep in the
   ledgers, which stamp UTC): thirteen verdicts, four of them a round two and
   `app-pricing` a whole round one. Every one of the five boards retires at its
   wiring, and a retiring board's ruling goes on reaching from here. */
const AVATAR_2 = {
  by: "seed-avatar",
  since: "seed-avatar r2, 20 Sep",
} as const;
const DOOR_2 = { by: "app-door", since: "app-door r2, 20 Sep" } as const;
const DEMO_2 = { by: "demo-event", since: "demo-event r2, 20 Sep" } as const;
const PRICING_2 = {
  by: "pricing-page",
  since: "pricing-page r2, 20 Sep",
} as const;
const APP_PRICING = {
  by: "app-pricing",
  since: "app-pricing r1, 20 Sep",
} as const;

/* The closing sitting's third batch (2026-09-21, ~01:40 EDT, the same stamp the
   ledgers carry): sixteen verdicts on the desk's second and third boards, both
   ruled whole and both retiring at their wiring. The first two rulers whose own
   questions were all answered in the same paste, so neither keeps a badge and
   both start reaching the moment they are recorded. */
const CREATE = {
  by: "first-event",
  since: "first-event r1, 21 Sep",
} as const;
const UPLOAD = {
  by: "guest-upload",
  since: "guest-upload r1, 21 Sep",
} as const;

/**
 * THE ASKS AN EARLIER RULING HAS REACHED, in desk order, across four passes.
 *
 * The first pass (`overtaken`, the fifth batch) read 29 asks across thirteen
 * boards against four rulings. The second read every open ask on every standing
 * board against the sixth batch's eight, and the second paste's two: 47 more
 * questions, and nine of the first pass's lines gained a second clause because
 * a later ruling reached the same question again. The third (`overtaken-3`) is
 * the closing sitting's first batch, fourteen verdicts on five boards: eight
 * more questions judged, two carrying a HELD ruling and no judgment at all,
 * and nineteen lines gaining a clause behind the one they had. The fourth
 * (`overtaken-4`) is that sitting's second batch, thirteen verdicts on the
 * five boards that retire with it: fourteen more questions judged, fifteen
 * lines gaining a clause, and the seven badges his own answers closed removed
 * with the asks they named. The fifth (`overtaken-5`) is that sitting's third
 * batch, sixteen verdicts on the two boards it answered whole: seven questions
 * badged for the first time, thirty-one lines gaining a clause, and the fifteen
 * badges those two boards carried removed with them.
 *
 * ★ AND THE FIFTH PASS DID NOT RAISE THE CLAUSE CAP, which is worth saying
 * because the rule of thumb said it would. Only two lines had ever carried
 * three clauses and both were `first-event`'s, so they left with the board
 * rather than taking a fourth: the cap held at three and this pass refilled it
 * from lines that had two. A pass raises the cap when it appends BEHIND three,
 * never merely because it is the fourth to append.
 *
 * Every line was written from the board's own option set read against the
 * ruling that reaches it; none of them redraws anything, and a board never
 * overtakes its own question (his own note on the board he is walking is an
 * answer, not a backdrop that moved).
 *
 * Three kinds, and the line says which without a field for it: the ones he
 * answered OUTRIGHT in a note on another board (the line concedes), the ones
 * whose option or whose "as today" baseline is now GONE (the line says whether
 * what is left still beats the ruling), and the ones still STANDING with the
 * backdrop moved under them.
 */
export const OVERTAKEN: Readonly<Record<string, OvertakenNote>> = {
  /* ── app-shape ───────────────────────────────────────────────────────── */
  // Round one's eight asks (home, density, event, nav, share, settings, you,
  // phone) are ruled and gone from the board (`home-states`, 2026-09-20, the
  // `app-vocabulary`/`profile-page` precedent: a round drops its questions
  // rather than accreting them). The one badge that named `you` is gone with
  // the ask it pointed at (this file's own contract, below: a badge pointing
  // at a question nobody is asking any more is worse than an answer left
  // orphaned) — `you=?` was his own outright answer, not a still-open question
  // for a later ruling to reach, and it is wired (`home-wiring`, `docs/design/
  // rulings.md`). Round two's `empty`, `first` and `busy` are too new for
  // anything to have overtaken them yet.

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

  /* ── toasts ──────────────────────────────────────────────────────────── */
  // Ruled whole and wired (toasts-wiring, 2026-09-20): the two badges that
  // named `toasts.where` and `toasts.stack` are gone with the board itself,
  // on the same convention as app-vocabulary above (a badge pointing at a
  // question nobody is asking any more is worse than an answer left
  // orphaned).

  /* ── guest-verify ────────────────────────────────────────────────────── */
  // Round two relitigates the identity shape whole, so its five asks are the
  // newest questions on the desk; two of them already have a backdrop that
  // moved. His own round one answers are HELD (above) and reach from there,
  // never onto this board: a board never overtakes its own question.
  "guest-verify.unproven": {
    ...AVATAR_2,
    ruling:
      "a seeded avatar is one identity hue at four tonal depths, hashvatar's own register",
    line: "stands: the face a mark would ride is a blended mesh now, so a small dot has a busier ground to clear than the flat ramp it was drawn on. Also reached by guest-upload r1, 21 Sep: a photograph waiting on somebody else is a drawn tile now, which is the held option's own mechanism.",
  },
  "guest-verify.gate-switch": {
    ...UPLOAD,
    ruling:
      "a photograph held for the host waits at the album's head, dimmed under a clock, on its own device",
    line: "stands: the uploads section's other switch has a drawn guest side now, so this picks what the account row produces, not whether it has rows.",
  },
  "guest-verify.allowance": {
    ...APP_PRICING,
    ruling:
      "a locked control says why it is locked and offers the way through, never just sits unusable",
    line: "stands: a bound that only refuses is ruled out, so whichever cap wins has to arrive as an offer, and the size of it is still unpicked. Also reached by guest-upload r1, 21 Sep: the act now states its terms before the files fly, which is where a bound would first be said.",
  },

  /* ── seed-avatar ─────────────────────────────────────────────────────────
   * `look` was the one question a HELD ruling reached and nothing else had
   * (`badge=mark`, the closing sitting's first batch). He answered it outright
   * in the second batch (`look=mesh`, an override recorded in `_window.json`),
   * the board retires at `avatar-mesh-wiring`, and the badge goes with the ask
   * it named: a badge pointing at a question nobody is asking any more is
   * worse than an answer left orphaned (overtaken.test.ts, the one failure
   * this exists to catch). The hold it carried was spent by his own answer and
   * reached nothing in the end; the mesh itself now overtakes from above. */

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

  /* ── app-pricing ─────────────────────────────────────────────────────────
   * ★ THE BOARD A BATCH ANSWERED WHOLE, AND THE MECHANISM'S BEST DAY. Six of
   * its eight asks were badged by five different boards' rulings, and he
   * answered all eight in one paste (the closing sitting's second batch):
   * `object=sheet`, `first=trigger`, `carry=cards`, `pass=line`, `doors=menu`
   * and `words=chip` each OVERRODE the ruling that had reached them, which is
   * his own contract working exactly as written (an answer to an overtaken
   * question IS the new ruling), and `_window.json` echoes all six on the
   * boards they overrode. The board retires at `app-pricing-wiring`, so the
   * badges go with the asks, on the `app-vocabulary` precedent above; what
   * they decided lives on in the ledger, in rulings.md, and in the six lines
   * this batch's own rulings write across the standing boards below. */

  /* ── first-event ─────────────────────────────────────────────────────────
   * ★ THE BOARD THE DESK PROVED ITS JOIN ON, ANSWERED WHOLE AND GONE. Seven of
   * its eight asks were badged here, more than any other board ever carried,
   * and he answered all eight in one paste (the closing sitting's third batch):
   * `asks=one`, `style=step`, `limit=door`, `venue=sheet`, `landing=beat`,
   * `hand=same`, `empty=list` and `first=live`. Six of the seven badges were
   * live questions his answer overrode, which is his own contract working as
   * written (an answer to an overtaken question IS the new ruling); the
   * seventh, `first`, carried the last HELD badge in the file and his answer
   * spent it (above). The board retires at `first-event-wiring`, so the badges
   * go with the asks, on the `app-vocabulary` precedent: a badge pointing at a
   * question nobody is asking any more is worse than an answer left orphaned
   * (overtaken.test.ts, the one failure this exists to catch). What they
   * decided lives in the ledger, in rulings.md, and in the eight rulings this
   * board now writes across the standing boards below.
   *
   * ★ AND ITS DEPARTURE MOVED `_desk/queue.test.ts`, which proved the desk's
   * real join on this board by name. That block now derives the board it proves
   * on from this map, so the next board to be answered whole takes nothing with
   * it (`docs/tracks/overtaken-5.md`, the lane's one exception line). */

  /* ── guest-upload ─────────────────────────────────────────────────────────
   * ★ THE SECOND BOARD OF THE SAME PASTE, ALSO ANSWERED WHOLE. Every one of its
   * eight asks was badged and every one was answered: `tap=sheet`,
   * `sending=strip`, `batch=one`, `landing=sweep`, `held=tile`, `failed=sheet`,
   * `warning=both` and `words=read`. It was the one board in the file with no
   * unreached ask at all, which is why the desk's join could never have been
   * proved on it, and it leaves with all eight badges on the same convention as
   * `first-event` above. Two of his notes made the ruling bigger than the
   * option: one arrival grammar for a guest and a host alike, and a review step
   * before the send. Both reach questions on the standing boards below. */

  /* ── media-viewer ────────────────────────────────────────────────────── */
  "media-viewer.opening": {
    ...GLASS,
    ruling: "the album sits blurred at half brightness behind the lightbox",
    line: "stands: the ruling fixes the ground behind a photograph, never the way it opens, and growing from its tile still says which one. Also reached by guest-shape r2, 20 Sep: no centred float survives at a desk, which is the dark room's own shape. Also reached by app-pricing r1, 20 Sep: his pricing object centres at a laptop, so a centred surface is alive again at a desk. Also reached by guest-upload r1, 21 Sep: a tile is where a photograph's own moment is said now, which is the grow option's whole argument.",
  },
  "media-viewer.holds": {
    ...GLASS,
    ruling: "every action on a photograph lives in the lightbox's controls",
    line: "stands: the rule says the controls carry every action, not what shape they take, and one strip holds more than two capsules. Also reached by app-vocabulary r1, 20 Sep: he narrowed that rule to a phone. Also reached by app-vocabulary r2, 20 Sep: he refuses a crowded top level and folds the extras behind one button.",
  },
  "media-viewer.who": {
    ...AVATAR,
    ruling:
      "every account wears a colour of its own, with the initial at every size",
    line: "stands: attribution has a face to ride now, so this asks where the name sits rather than whether it has anything to sit on. Also reached by seed-avatar r2, 20 Sep: that face is a four-depth mesh now, so what a name would sit beside got richer rather than plainer. Also reached by guest-upload r1, 21 Sep: what a guest most needs is ruled up to reading size, so a name at the page's smallest argues against that.",
  },
  "media-viewer.next": {
    ...PRICING_2,
    ruling:
      "the plans stay a stack at a phone, because a swipe row is the thing a visitor misses",
    line: "stands: he refused a swipe row for plans and kept the gesture for galleries, which is exactly what a neighbour at the viewer's edge is. Also reached by guest-upload r1, 21 Sep: the act gains a review step before the send, whose thumbnails are the filmstrip's own furniture.",
  },
  "media-viewer.video": {
    ...VOCABULARY,
    ruling:
      "one media tile draws every album grid, carrying a play mark as state",
    line: "stands: the play mark is one component on every tile now, so the badge is the tile's own glyph grown up rather than a new one.",
  },
  "media-viewer.link": {
    ...CREATE,
    ruling:
      "the host hands the code over from the share surface, so a guest can pass the link on themselves",
    line: "stands: he took the surface that lets a guest pass a link on, which is exactly what an address for one photograph would buy.",
  },
  "media-viewer.wayout": {
    ...GUEST_SHAPE,
    ruling:
      "the guest's dialogs wear one sheet: a side panel at a desk, a bottom sheet in a hand",
    line: "stands: the sheet teaches a drag back down in a hand now, so swiping a photograph into the grid is a gesture the product has. Also reached by pricing-page r2, 20 Sep: he reads a swipe as the thing a visitor misses, so a way out that is only a swipe keeps the circle.",
  },

  /* ── host-curation ───────────────────────────────────────────────────── */
  "host-curation.queue": {
    ...VOCABULARY,
    ruling:
      "one media tile draws every album grid, from the guest's to the bin",
    line: "stands: one tile draws every grid now, so the queue inherits the album's own shapes and the square crop is the exception to build. Also reached by guest-upload r1, 21 Sep: the guest's side of a waiting photograph is drawn now, so the host's queue has a shape to answer.",
  },
  "host-curation.verb": {
    ...GUEST_SHAPE_2,
    ruling:
      "a guest's own tiles carry a mark, and a tap on it filters the album to theirs",
    line: "stands: a tile is ruled to carry a fourth mark now, so the Hidden chip has its precedent and the word on the bar is still unpicked.",
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
    line: "stands: both bulk bars are one component now, so whatever this answers lands on the gallery's bar in the same breath. Also reached by guest-upload r1, 21 Sep: the outcome of a run is ruled onto one surface at its end, which is where a bulk act's way back would sit.",
  },
  "host-curation.arrivals": {
    ...GUEST_SHAPE,
    ruling:
      "a new photograph grows into its column and the album re-flows around it",
    line: "stands: the guest's album already takes an arrival without moving anything else, so the machinery is built and this sets its manners. Also reached by app-shape r2, 20 Sep: a busy band folds its overflow behind one chip that expands in place. Also reached by first-event r1, 21 Sep: the host's page is ruled live, so arrivals in the queue are a matter of manners now, never of capability.",
  },
  "host-curation.count": {
    ...APP_SHAPE,
    ruling: "the dashboard opens on what needs you: the waiting queues first",
    line: "stands: the pulse answers the aggregate count, leaving the bell and the chip to agree or go, which is still this question. Also reached by app-shape r2, 20 Sep: he refuses a single event's prompt on the dashboard, which is what the bell is. Also reached by first-event r1, 21 Sep: the header's count is ruled to move as a photograph lands, so one of the three is already live.",
  },
  "host-curation.told": {
    ...GUEST_SHAPE,
    ruling:
      "a guest may delete any photograph they uploaded, for ever, and the host cannot restore it",
    line: "stands: a guest owns their own photographs for good now, which gives the quiet line in their own feed a claim it never had. Also reached by guest-shape r2, 20 Sep: a guest's own tiles carry a mark, which is that line's mechanism already built. Also reached by guest-upload r1, 21 Sep: a guest is told on one surface what did not make it, so telling them has both a place and a precedent.",
  },

  /* ── reel-studio ─────────────────────────────────────────────────────── */
  // All eight badges (door, room, styles, moments, blocked, sharing, wait,
  // guests) were deleted by the overtaken audit (2026-09-21), not by an answer:
  // Will asked for an overtaken question to be RESHAPED or REMOVED rather than
  // left standing with a badge on it, and every one of these was reshaped. The
  // ruling each badge named is now folded into the question's own context, the
  // door is redrawn onto the event hub's Reel card (`event=hub` deleted the
  // status row its three options lived in) and `wait` gained the stack the
  // rulings made possible. Nothing was answered, so nothing is recorded.

  /* ── export-flow ─────────────────────────────────────────────────────── */
  // The same, for all eight (means, chips, wait, stuck, hollow, cap, object,
  // phone): every ruling folded into its question, five options a ruling
  // forbids outright dropped (`chips.three`, `stuck.forever`, `hollow.silence`,
  // `cap.bite`, `object.link`), and the surface redrawn as the one responsive
  // sheet `guest-shape` r1 ruled the guest's dialogs onto.

  /* ── admin-triage ────────────────────────────────────────────────────── */
  "admin-triage.look": {
    ...ADMIN,
    ruling:
      "the portal is a table for data and a list beside the message for a prose inbox",
    line: "concedes: a prose inbox is ruled a list beside the message, which is this ask's frame beside the reason, a row each.",
  },
  "admin-triage.reason": {
    ...APP_SHAPE_2,
    ruling: "a band with nothing real in it is absent, never drawn empty",
    line: "concedes: an empty block is ruled absent rather than drawn hollow, which is this ask's nothing-said-so-nothing-drawn option.",
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
    line: "stands: the inboxes share one shape now, which leaves this asking about their words and their statuses, not their furniture. Also reached by app-vocabulary r2, 20 Sep: the album folds its sort and filter behind one button, which a filter bar does not.",
  },
  "admin-triage.notice": {
    ...GUEST_SHAPE,
    ruling:
      "a guest may delete any photograph they uploaded, and the host cannot restore it",
    line: "stands: a host already meets one silent gap in the album now, so this asks whether the portal is allowed to make a second. Also reached by guest-upload r1, 21 Sep: he refuses a gap a person has to notice themselves, which is the case against silence here.",
  },

  /* ── help-center ─────────────────────────────────────────────────────── */
  "help-center.from-product": {
    ...GUEST_SHAPE,
    ruling:
      "the guest's actions dock at the foot of the album, and go to a second round",
    line: "stands: the guest's own action block is still being redrawn, so a standing Help row would be joining something unfinished. Also reached by guest-shape r2, 20 Sep: the block is ruled now, a row on landing and a dock once it scrolls away. Also reached by app-pricing r1, 20 Sep: a surface now opens on the reason it was opened, which is the contextual link's own argument. Also reached by guest-upload r1, 21 Sep: a failure has a surface of its own at the end of a run now, which is where a contextual link would sit.",
  },
  "help-center.hub": {
    ...APP_PRICING,
    ruling:
      "the in-app surface holds the plans and a price, with the whole argument one click away",
    line: "stands: he took the short surface with everything else one click away, which is this ask's doors option argued on another screen. Also reached by first-event r1, 21 Sep: he took the shortest front door and left the rest for later screens, which is the doors option's case.",
  },
  "help-center.article": {
    ...DOOR_2,
    ruling:
      "the welcome tour is five screens of bespoke pictures, not the product's real screens",
    line: "stands: he took drawn pictures over the real screens for the tour, and a how-to is the one place the real screen is the whole point. Also reached by first-event r1, 21 Sep: he moved the teaching inside the act itself, so a how-to answers what the flow did not.",
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
    line: "stands: the code is the product's one door now, so the button alone is gone and this asks only what rides under the digits. Also reached by first-event r1, 21 Sep: the product typesets a code for a person to read off an object now, so a mail's digits have a house treatment.",
  },
  "emails.moments": {
    ...APP_SHAPE_2,
    ruling:
      "a control with nothing real behind it is absent, never drawn empty",
    line: "concedes: a switch with nothing behind it is ruled absent, which is the four dormant rows leaving until each mail is really wired. Also reached by first-event r1, 21 Sep: the moment an event exists is marked by a screen of its own now, which is one moment needing no mail.",
  },
  "emails.guest": {
    ...GUEST_SHAPE,
    ruling:
      "keeping the album becomes a one-tap offer after a guest's first photograph",
    line: "stands: the address is taken on a promise to keep the album now, and this mail is the only thing that would keep it. Also reached by guest-upload r1, 21 Sep: a held photograph is known only to the device that sent it, so a mail is the one thing that outlives the tab.",
  },

  /* ── site-chrome ─────────────────────────────────────────────────────── */
  "site-chrome.foot-after": {
    ...DEMO,
    ruling:
      "every demo door shows the party: the footer's photo pile, skinned per place",
    line: "stands: he took that pile for the demo's doors and still read the reuse as unpolished, which is this ask's own worry about it. Also reached by demo-event r2, 20 Sep: the pile is one framed photograph now, so today's register is already redrawn under this question.",
  },
  "site-chrome.foot-alone": {
    ...PRICING_2,
    ruling:
      "the pricing page closes on its folded questions, after the overview and the table",
    line: "stands: one more page now reaches the footer having closed on questions rather than an invitation, which is what the special case is for.",
  },
  "site-chrome.foot-phone": {
    ...DEMO_2,
    ruling:
      "every demo door is one framed photograph with the code tucked into its corner",
    line: "stands: the demo is one object now rather than a pile, so a phone takes it whole or keeps a line, and he already reads it as too quiet. Also reached by first-event r1, 21 Sep: a code's real home is ruled to be printed stock, so a code on a phone is decoration by his own order.",
  },

  /* ── profile-page ────────────────────────────────────────────────────── */
  "profile-page.view-all": {
    ...GUEST_SHAPE,
    ruling:
      "the guest's dialogs wear one sheet: a side panel at a desk, a bottom sheet in a hand",
    line: "stands: the sheet is built and ruled now, so it is the cheapest of the four and a page is the only one that buys anything new. Also reached by guest-shape r2, 20 Sep: no centred float survives at a desk, so the modal is off the one primitive. Also reached by app-pricing r1, 20 Sep: his pricing object centres at a laptop, so a centred list is not off the primitive after all.",
  },
  "profile-page.quick-look": {
    ...APP_SHAPE,
    ruling: "one responsive sheet everywhere, and a mini-modal for the QR",
    line: "stands: both halves of the adaptive answer are ruled objects now, so the question is which one a look is, not whether to build one. Also reached by seed-avatar r1, 20 Sep: every guest has a face of their own now. Also reached by guest-shape r2, 20 Sep: the sheet at a desk is a right-edge panel, so neither drawn shape is the primitive.",
  },
  "profile-page.way-back": {
    ...APP_SHAPE,
    ruling:
      "the app's bar carries a crumb trail: Partyreel, the event, the room",
    line: "stands: the crumb rides the host app's bar and a scanned guest is on the album's header, where the pill is the only way back. Also reached by guest-shape r1, 20 Sep: the guest's chrome goes to a second round. Also reached by app-pricing r1, 20 Sep: the account menu just took a standing row of its own, so one more row is cheap wherever a menu exists.",
  },

  /* ── privacy-hero ────────────────────────────────────────────────────── */
  "privacy-hero.concept": {
    ...CRYSTAL,
    ruling:
      "one glass material everywhere, with a double edge and nothing borrowed",
    line: "stands: frosted is a named material now, so the access grid's tiles would wear it and the choice is the mechanism, not the finish. Also reached by app-door r2, 20 Sep: the welcome runs its copy over bespoke pictures in motion, which is the aperture's own composition. Also reached by guest-upload r1, 21 Sep: one pass of light across a tile is the product's own arrival now, which is the access grid's mechanism.",
  },

  /* ── album-motion ────────────────────────────────────────────────────── */
  "album-motion.fall": {
    ...GUEST_SHAPE,
    ruling: "a new photograph grows into its column under a glow that fades",
    line: "stands: the product's own arrival settles into the album rather than passing under it, so one of these three tells the truth. Also reached by guest-upload r1, 21 Sep: he asked for one arrival everywhere, so the hero's telling of it owes the real one its shape.",
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
    line: "stands: one of the two looks this reconciles was just decided on its own page, which leaves the other to follow it or stay. Also reached by pricing-page r2, 20 Sep: the questions now close that page after the table, so the look they wear is the last thing read.",
  },
  "loose-ends.review-photo": {
    ...DEMO_2,
    ruling:
      "a demo visual no taller and no louder than the banner behind it is not noticeable enough",
    line: "stands: he judges a picture by whether it carries at the size it is drawn, which is this ask's whole test, and the three are still unranked. Also reached by guest-upload r1, 21 Sep: the tile a waiting photograph wears is drawn now, so the switch's own frame is redrawn under this.",
  },
  "loose-ends.everywhere-pill": {
    ...VOCABULARY,
    ruling:
      "a tile carries an active like, a play mark and a subtle count, and nothing else",
    line: "stands: a tile's marks are ruled exactly now, and the hover pill is a desk verb, so a phone stage showing one would be a fiction. Also reached by guest-shape r2, 20 Sep: a fourth mark joins the tile, so the three-marks rule has already moved. Also reached by guest-upload r1, 21 Sep: the newest tile is ruled to take one pass of light, so the stage's newest already owes a mark.",
  },

  /* ── contact-page ────────────────────────────────────────────────────── */
  "contact-page.page": {
    ...PRICING,
    ruling:
      "the pricing page opens on paper, because a dark chapter above the plans read as harsh",
    line: "stands: he just moved a page onto paper to soften that very seam, which is the transition this one is being asked to open with. Also reached by pricing-page r2, 20 Sep: he re-cut that page's chapters himself, so a dark chapter over a paper body is his own working order.",
  },
  "contact-page.topic": {
    ...CREATE,
    ruling:
      "creating an event asks one field, and the date and the note are set on the event itself",
    line: "stands: a door that asks one field and defers the rest is ruled now, which is this ask's optional option one surface over.",
  },
  "contact-page.urgency": {
    ...UPLOAD,
    ruling:
      "a failure is bubbled up clearly, because a party is where one is most costly",
    line: "stands: he reads a failure at a live party as the product's worst hour, which is this ask's premise and still does not pick the door.",
  },
  "contact-page.receipt": {
    ...APP_PRICING,
    ruling:
      "a confirmation worth feeling opens a modal, rather than a box at the top of the page",
    line: "stands: a box in the page is ruled the flat way to confirm something worth feeling, and a receipt still has to be a thing you can keep.",
  },

  /* ── press-page ──────────────────────────────────────────────────────── */
  // The desk's last board, and the last to be reached: nothing had touched it
  // until the closing sitting re-cut a marketing page's own order, and the
  // batch after that gave the product printed objects of its own to show.
  "press-page.the-sheet": {
    ...CREATE,
    ruling:
      "the app prints the code already set in paper: table cards, a sign, a poster",
    line: "stands: the product prints its own stock now, so the kit has real objects to show and the plates are not the only evidence.",
  },
  "press-page.the-arc": {
    ...PRICING_2,
    ruling:
      "the pricing page reads overview first, then the detail table, then the questions",
    line: "stands: he re-cut a marketing page into an overview, the detail, then the questions, which is this ask's own case for the claims leading.",
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
 * itself (showing is not choosing, step.tsx). A held badge carries no judgment
 * at all, so it never concedes and never primes anything: pressing the dock's
 * third button on one is HIS decision to let the held ruling stand, which is
 * the one way a hold is ever lifted.
 */
export const concedes = (note: OvertakenNote): boolean =>
  note.line.startsWith("concedes:");

/**
 * The badge's first line, in plain words with the date. Never the clause.
 *
 * ★ A HELD RULING SAYS SO IN THE FIRST WORD, because the badge is the only
 * thing a reviewer reads before the options: "Ruled since ..." over a decision
 * he has said he may relitigate would be the badge telling him his own hold
 * had been spent. The line under it names the clause that is held.
 */
export const badgeText = (note: OvertakenNote): string =>
  `${isHeld(note) ? "Ruled and held since" : "Ruled since"} ${note.since}: ${
    note.ruling
  }`;

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
