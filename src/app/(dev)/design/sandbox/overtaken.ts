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
 * shape the test proves stay exactly as written, because the next question a
 * held ruling reaches will be badged this way and no other.
 *
 * ★ AND THE THIRD WAY A HOLD ENDS: HIS OWN NEXT SHAPE SUPERSEDES IT (the
 * identity reshape, Will, 2026-09-21). `gate=after` was neither lifted by round
 * two nor spent by an answer to the question it badged: `address=none` removed
 * anonymity from the product and the host's switch became Require verified
 * emails, so verification is BEFORE access in the one mode and absent in the
 * other, and nothing waits on a mail for a photograph to go live. The held
 * ruling did not lose an argument, the ground it was standing on went, and its
 * three siblings went the same way in the same paste (`expiry=host` moot,
 * `badge=mark` and `host-lens=badge` carried onto the unverified name). A
 * succession is recorded where his words are (docs/design/rulings.md, "the
 * identity reshape") and NEVER as a badge here, because a hold that has been
 * superseded leaves no question to badge: this file only says which earlier
 * ruling a still-open question must be read against. Which is also why the
 * reshape's own reach, every upload carrying a name, adds nothing below: the
 * overtaken audit folded that context into the fourteen standing boards'
 * questions themselves, and a badge would tell him a settled thing twice. One
 * caveat for whoever writes the next hold: `HELD` still names the round two
 * that has now happened, and wants renaming with that hold, not before it.
 */
export const HELD = "held for guest-verify round two: ";

/** Whether this badge names a ruling that is recorded but not yet law. */
export const isHeld = (note: OvertakenNote): boolean =>
  note.line.startsWith(HELD);

/** What the ledger says happened to an overtaken ask. Derived, never stored. */
export type Outcome = "open" | "stood" | "overrode";

/* THE PER-BATCH HANDLES ARE GONE (the overtaken audit's last record, 2026-09-21). Sixteen of them once carried
   `by` and `since` for the fifth batch through the closing sitting's third; every entry that spread one has
   been folded into its question's own context by the audit's four reshape lanes, and the file's own rule is
   that a handle leaves with the last entry that spreads it. A future pass that fills the map declares its own
   handle beside its entries; the batches themselves are told in rulings.md and the CHANGELOG. */

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

  /* ── guest-verify ──────────────────────────────────────────────────
   * RULED WHOLE AND RETIRED (2026-09-21, `verified-email-lab`). Round two's
   * `address=none` removed anonymity from the product, which answered the rest
   * of the board with it, so the three badges this section carried (`unproven`,
   * `gate-switch`, `allowance`) are gone with the asks they named: a badge
   * pointing at a question nobody is asking any more is worse than an answer
   * left orphaned, the same convention as `app-vocabulary`, `toasts` and
   * `seed-avatar` below. His own round one rulings reached nothing from here in
   * the end, and the HELD note above says why they never will now. */

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

  /* ── media-viewer, and host-curation ─────────────────────────────────────
   * ★ FOURTEEN BADGES FOLDED INTO THEIR QUESTIONS AND DELETED (the overtaken
   * audit, Will 2026-09-21: "for any open questions that have been 'overtaken',
   * please evaluate whether they should be reshaped or removed"). Seven asks on
   * each board wore one. None of them was removable: his own criterion is that
   * a question is deleted only when an earlier selection "has solved it
   * optimally and offers no potential additional value", and every one of these
   * fourteen still had a better answer available than the ruling that reached
   * it. So each was RESHAPED in its own spec, with the ruling written into the
   * question as the ground its answer stands on, which is where the badge's
   * context now lives. A badge and a question that already carries the same
   * fact would say it twice, and the second copy is the one that rots.
   *
   * ★ WHAT THE FOLD DID BESIDES MOVE WORDS. `media-viewer.opening` was redrawn
   * on the ruled ground rather than reworded (the album blurred at half
   * brightness; the dark room it used to draw was the option `behind=album`
   * had already killed). `media-viewer.who` LOST an option, the only one this
   * lane dropped: "no name on the photograph" cannot survive an identity shape
   * where every upload carries a name, verified or marked. And it GAINED one,
   * because two rulings made it possible: a credit led by the seeded face every
   * account now has, pressable as a door to that person's page.
   *
   * ★ AND `host-curation.peek` IS THE AUDIT'S OWN CASE, MADE TWICE. It was the
   * one entry here that CONCEDED, to the rule that every action on a photograph
   * lives in the lightbox's controls; he then narrowed that rule to a phone in
   * his own words. A question that had conceded whole is open again on the half
   * the narrowing left, which is exactly the outcome his flow chart asks for:
   * an earlier selection must not kill what could have been a better idea. */

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

  /* ── admin-triage ─────────────────────────────────────────────────────────
   * The overtaken audit's reshape (`reshape-admin-help-emails`, 2026-09-21):
   * all eight badges (look, reason, verdict, closed, escalate, phone, idiom,
   * notice) are gone with the questions they named, on the app-vocabulary
   * precedent above (a badge pointing at a question nobody is asking any
   * more is worse than an answer left orphaned): every reached ruling now
   * lives inside its ask's own reworded question and context rather than
   * sitting beside it as a badge (admin r1, app-shape r2, guest-shape and
   * guest-upload r1). Unlike that precedent the BOARD does not retire: it
   * stays open, unanswered, at round one, with `round.changed` saying what
   * moved. `reason` narrows from three options to two (`same` and `quiet`
   * both leave; a new `chrono` stands for "keeps its place"); `verdict`,
   * `closed` and `phone` each drop one option a ruling made incoherent
   * (`required`, `card`, `none`); `look` drops `card` the same way; escalate,
   * idiom and notice keep their option sets and reword only the question,
   * the context and, on notice, the recommendation (silence to host). */

  /* ── help-center ──────────────────────────────────────────────────────────
   * The overtaken audit's reshape (`reshape-admin-help-emails`, 2026-09-21):
   * all five badges (from-product, hub, article, feedback, search) are gone
   * with the questions they named, the same convention as admin-triage
   * above: each reached ruling (guest-shape r2, app-pricing r1, first-event
   * r1, app-door r2, admin r1) now lives inside its ask's own reworded
   * question rather than beside it as a badge. Every option set stands as
   * drawn; only the question, the context and the reasoning changed.
   * `who-first` and `dead-end` carried no badge and are untouched. The
   * board does not retire: it stays open, unanswered, at round one. */

  /* ── emails ───────────────────────────────────────────────────────────────
   * The overtaken audit's reshape (`reshape-admin-help-emails`, 2026-09-21):
   * all four badges (shell, code, moments, guest) are gone with the
   * questions they named, the same convention as admin-triage and
   * help-center above: each reached ruling (app-vocabulary r1, app-door r1,
   * first-event r1, app-shape r2, and now the identity reshape) lives
   * inside its ask's own reworded question. `code` drops the now-incoherent
   * `button` option (a mail with no code is no longer real once app-door r1
   * makes the code everybody's door); `moments` drops `today` (a dead
   * switch is ruled absent, never drawn) and gains a new option, `identity`,
   * for the moment the identity reshape's capture flow implies; `shell` and
   * `guest` keep their option sets. `brand`, `sender`, `foot` and `dark`
   * carried no badge and are untouched. The board does not retire: it stays
   * open, unanswered, at round one.
   *
   * ── site-chrome, profile-page, privacy-hero, album-motion, loose-ends,
   * contact-page, press-page ──────────────────────────────────────────────
   * The overtaken audit's reshape (`reshape-marketing-boards`, 2026-09-21):
   * all nineteen badges these seven boards carried are gone with the
   * questions they named, the same convention as admin-triage, help-center
   * and emails above: each reached ruling now lives inside its ask's own
   * reworded question and context. Two redraws (site-chrome.foot-after,
   * album-motion.fall) and two new concepts (privacy-hero.concept's
   * `sweep`, loose-ends.everywhere-pill's `sweep` replacing the dropped
   * `hover`) beyond the reshape alone; every other option set stands as
   * drawn. None of the seven boards retires: all seven stay open,
   * unanswered, at their own round, with `round.changed` saying what
   * moved. See each board's own `spec.ts` and the track's manifest
   * (deleted at this lane's merge) for the full reading. */
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
