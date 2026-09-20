/**
 * THE QUESTIONS AN EARLIER RULING REACHED (Will, 2026-09-19, the fifth batch).
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
   */
  line: string;
};

/** What the ledger says happened to an overtaken ask. Derived, never stored. */
export type Outcome = "open" | "stood" | "overrode";

const APP_SHAPE = { by: "app-shape", since: "app-shape r1, 19 Sep" } as const;
const GLASS = { by: "glass", since: "glass r1, 19 Sep" } as const;

/**
 * THE 29 ASKS THE FIFTH BATCH REACHED, across thirteen boards, in desk order.
 *
 * Three kinds, and the line says which without a field for it: four he answered
 * OUTRIGHT in a note on another board (the line concedes), ten whose option or
 * whose "as today" baseline is now GONE (the line says whether what is left
 * still beats the ruling), and fifteen still STANDING with the backdrop moved
 * under them. Every line was written from the board's own option set read
 * against the ruling that reaches it; none of them redraws anything.
 */
export const OVERTAKEN: Readonly<Record<string, OvertakenNote>> = {
  /* ── app-vocabulary ──────────────────────────────────────────────────── */
  "app-vocabulary.empty-states": {
    ...APP_SHAPE,
    ruling: "the dashboard is a pulse and the personal feeds move to the profile",
    line: "stands: the pulse deletes the feed's empty rows but not the zero-events hero, which is the tier this ask exists to keep.",
  },
  "app-vocabulary.loading": {
    ...APP_SHAPE,
    ruling: "the dashboard is a pulse, the event a hub, settings a sheet",
    line: "stands: the ruling moves which routes wait before first paint, and as-needed is the only option that survives a moved list.",
  },
  "app-vocabulary.tile-grammar": {
    ...GLASS,
    ruling: "a media tile carries only state: an active like, a play mark, a subtle count",
    line: "stands: the rule empties both overlays on a phone and leaves the desk's two button rows still worth merging into one.",
  },
  "app-vocabulary.bulk-toolbar": {
    ...GLASS,
    ruling: "every action on a photograph lives in the lightbox, never on the tile",
    line: "stands: the icon case rested on learning the glyphs from the tile, and the tiles rule takes that teacher away.",
  },
  "app-vocabulary.gallery-controls-home": {
    ...GLASS,
    ruling: "one glass bar holds the host's controls in a single pane",
    line: "stands: the bar rules the pane, never what sits in it, so reserving Sort and Filter is still the cheaper seam.",
  },

  /* ── admin ───────────────────────────────────────────────────────────── */
  "admin.home": {
    ...APP_SHAPE,
    ruling: "the host's home opens on what needs you, then what just arrived",
    line: "stands: the host home is now a ranked pulse, which makes the operator's console the same idea rather than a second one.",
  },
  "admin.chrome": {
    ...APP_SHAPE,
    ruling: "the app's bar carries a crumb trail: Partyreel, the event, the room",
    line: "stands: the crumb is the product's own bar now, so the tool bar's breadcrumb is shared vocabulary and not a departure.",
  },
  "admin.density": {
    ...APP_SHAPE,
    ruling: "the events list gains a sortable row and table view behind a toggle",
    line: "stands: the app owns a real table now, which makes one dense table here cheaper than it was when this was drawn.",
  },

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
  "app-pricing.doors": {
    ...APP_SHAPE,
    ruling: "plans and billing live on the account page",
    line: "concedes: his You answer puts billing on the account page, which is this ask's third option word for word.",
  },

  /* ── first-event ─────────────────────────────────────────────────────── */
  "first-event.style": {
    ...APP_SHAPE,
    ruling: "one share sheet holds the code, the posters and anything future",
    line: "concedes: the share sheet is where the designer lands, which is this ask's on-the-real-code option.",
  },
  "first-event.landing": {
    ...APP_SHAPE,
    ruling: "the event is a hub: a cards row, a live QR in the header, the gallery beneath",
    line: "stands: the hub rules what the event page is, never what Create ends on, and the one-time beat is still unasked.",
  },
  "first-event.hand": {
    ...APP_SHAPE,
    ruling: "sharing is a sheet, with a QR mini-modal for a bigger scannable code",
    line: "stands: the mini-modal is a modal doing three jobs; full screen at full brightness is the only one that reads across a dark room.",
  },
  "first-event.empty": {
    ...APP_SHAPE,
    ruling: "the event is a hub: a cards row, a live QR in the header, the gallery beneath",
    line: "stands: the hub puts the code in the header and says nothing about the album's empty room, which the launch list still fills.",
  },

  /* ── guest-upload ────────────────────────────────────────────────────── */
  "guest-upload.landing": {
    ...GLASS,
    ruling: "a media tile carries only state: an active like, a play mark, a subtle count",
    line: "stands: the rule clears the tile of controls, which is the empty surface the single shimmer pass was drawn for.",
  },
  "guest-upload.held": {
    ...GLASS,
    ruling: "a media tile carries only state, never a control",
    line: "stands: a tile waiting under a clock is state and nothing else, which is exactly what the rule leaves a tile allowed to say.",
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
    line: "stands: the rule says the controls carry every action, not what shape they take, and one strip holds more of them than two capsules.",
  },

  /* ── host-curation ───────────────────────────────────────────────────── */
  "host-curation.peek": {
    ...GLASS,
    ruling: "every action on a photograph lives in the lightbox's controls",
    line: "concedes: his tiles rule puts every action in the one lightbox, which is this ask's media-viewer option.",
  },
  "host-curation.count": {
    ...APP_SHAPE,
    ruling: "the dashboard opens on what needs you: the waiting queues first",
    line: "stands: the pulse answers the aggregate count, leaving the bell and the chip to agree or go, which is still this question.",
  },

  /* ── reel-studio ─────────────────────────────────────────────────────── */
  "reel-studio.door": {
    ...APP_SHAPE,
    ruling: "the event is a row of cards: Review, Reel, Guests, Settings",
    line: "concedes: the Reel card in the hub's row is the door now, and it is none of these three.",
  },
  "reel-studio.sharing": {
    ...APP_SHAPE,
    ruling: "sharing gets one comprehensive sheet, reached from the event",
    line: "stands: the sheet holds where sharing is asked, never what taking it back costs, which is all this ask decides.",
  },

  /* ── export-flow ─────────────────────────────────────────────────────── */
  "export-flow.object": {
    ...APP_SHAPE,
    ruling: "the album's link and a copy button sit under the event's metadata and in the share sheet",
    line: "concedes: the share ruling already places the link and its copy twice, which is what this ask wanted the dialog to lead with.",
  },

  /* ── guest-shape ─────────────────────────────────────────────────────── */
  "guest-shape.dialogs": {
    ...APP_SHAPE,
    ruling: "one responsive sheet everywhere: a side panel at a desk, a bottom sheet in a hand",
    line: "concedes: apply this sheet concept everywhere names the sheet option, and the guest door already is one.",
  },

  /* ── profile-page ────────────────────────────────────────────────────── */
  "profile-page.quick-look": {
    ...APP_SHAPE,
    ruling: "one responsive sheet everywhere, and a mini-modal for the QR",
    line: "stands: both halves of the adaptive answer are ruled objects now, so the question is which one a look is, not whether to build one.",
  },
  "profile-page.way-back": {
    ...APP_SHAPE,
    ruling: "the app's bar carries a crumb trail: Partyreel, the event, the room",
    line: "stands: the crumb rides the host app's bar and a scanned guest is on the album's header, where the pill is the only way back.",
  },

  /* ── seed-avatar ─────────────────────────────────────────────────────── */
  "seed-avatar.after-upload": {
    ...APP_SHAPE,
    ruling: "the avatar may be changed on the profile page and on the account page",
    line: "stands: a photograph can land from two surfaces now, and waiting underneath is the one answer that covers both.",
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
  if (choice === null || choice === undefined || choice === "" || choice === "?")
    return "open";
  return choice === STANDS ? "stood" : "overrode";
}
