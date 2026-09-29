import { EVENT, HOST, PICKS } from "./fixtures";

/**
 * EVERY WORD THE DOOR SAYS, IN ONE TABLE: four directions by four states, the
 * wait's three shapes, the shut door's foot, the 404.
 *
 * ★ THE SHUT DOOR'S WORDS ARE TRUE OF ALL FIVE, OR NOT SAID (event-safety's
 * `newcomer=same`). One screen answers an Only me album, an album closed to
 * newcomers, a decline, an address not on the invite list and a block, so the
 * words may only say what the five share: she can't open it, and only the host
 * can change that. Today's ("This event is private", "ask them to make it
 * public") are true of one cause, which is why today is on every step as the
 * measure.
 *
 * ★ THE LINE SOMEONE WHO WAS IN READS IS SETTLED (`previous=private`, his r1
 * answer): she is told the host made it private, as her dashboard card says,
 * and a blocked former guest reads the same, so the block keeps its cover. Only
 * an Only me album and a block shut out someone already in, so the line is
 * true of the first and a cover story for the second, and it is drawn in every
 * direction rather than asked again. It speaks of the album, never of her: a
 * line about her own photos would tell the two apart (a block may remove his).
 *
 * ★ NO PRONOUN FOR THE HOST, AND NO VERB AFTER HER NAME. A display name can be
 * anyone's ("Maya", "The Chens", "Maya & Jay"), so a line that names her again
 * never guesses a "she", and no line puts a verb straight after her name that a
 * plural host would break ("Maya invites" and "The Chens invites"): "Hosted by
 * Maya" and "Only Maya can" hold for every name.
 *
 * ★ THE GUEST'S WORD IS ALBUM (`guest-flow.md`), so every new line says album.
 * Today's words are quoted as they ship, "event" included, because today is the
 * reference and not a draft.
 */

export type DirectionId = "today" | "host" | "lit" | "doorway";
export type StateId = "welcome" | "wait" | "shut" | "was-in";
export type WaitId = "still" | "live" | "pick";

/** What a line's glyph shows: it follows what the line says, never its place. */
export type Mark =
  | "camera"
  | "images"
  | "key"
  | "link"
  | "lock"
  | "door"
  | "bell";

export type Line = { text: string; mark: Mark };

/** One screen's message: what the reader is told, header and ways out apart. */
export type Words = {
  /** The small line over the headline (the door's eyebrow). */
  eyebrow?: string;
  title: string;
  lines: readonly Line[];
};

const says = (text: string, mark: Mark = "key"): Line => ({ text, mark });

/* ── the welcome: one set of words, every direction ─────────────────────── */

/**
 * THE INVITATION, today's words, kept by every direction: the welcome's words
 * are not what this round asks (voice-guest settled them), its look is. The
 * count is the album's live number, said as the welcome's own promise row says
 * it (`LiveCount` ticks it in production).
 */
export const WELCOME: Words & { hostedBy: string; cta: string } = {
  eyebrow: "You're invited to",
  title: EVENT.name,
  lines: [
    says("Add your photos and videos in seconds. No app required.", "camera"),
    says(
      `Everyone's shots land in one album. ${EVENT.count} are already inside.`,
      "images",
    ),
  ],
  /** Said before the host's name, which is set apart in the foreground ink. */
  hostedBy: "Hosted by",
  cta: "Continue",
};

/* ── the wait: a base per direction, lines per shape of wait ───────────── */

const OPENS = says(
  `This opens by itself the moment ${HOST.name} lets you in.`,
  "door",
);
const TOLD = says(`${HOST.name} has been told you're here.`, "bell");

/**
 * The waiting door's head. The host's door keeps the album's name as its title
 * on every state (the plate on the door); the others name who she waits for.
 */
const WAIT_HEAD: Record<DirectionId, Omit<Words, "lines">> = {
  today: { eyebrow: "Almost in", title: `Waiting for ${HOST.name}` },
  host: { eyebrow: "Almost in", title: EVENT.name },
  lit: { eyebrow: "Almost in", title: `Waiting for ${HOST.name}` },
  doorway: { eyebrow: "Almost in", title: `Waiting for ${HOST.name}` },
};

/**
 * THE WAIT'S THREE SHAPES (the `wait` ask). `still` is the pick as
 * `settings-wiring` builds it (event-settings' `waiting=held`): one line and a
 * still mark. `live` adds the one true thing a wait can say about the other
 * side, that the host has been told (the hub's Guests card, the pulse and the
 * bell do tell her, and nothing is mailed), and its mark ticks. `pick` keeps
 * the still words and hands her something to do (`PICK`).
 */
const WAIT_LINES: Record<WaitId, readonly Line[]> = {
  still: [OPENS],
  live: [TOLD, OPENS],
  pick: [OPENS],
};

export function waitWords(direction: DirectionId, wait: WaitId): Words {
  return { ...WAIT_HEAD[direction], lines: WAIT_LINES[wait] };
}

/** How long she has waited: still under `still`, ticking under `live`. */
export const ASKED = "Asked 2 min ago";

/** The `pick` wait's own block: her choices, held on her phone. */
export const PICK = {
  title: "While you wait",
  line: `Choose what you'll add. Nothing leaves your phone until ${HOST.name} lets you in.`,
  button: "Choose photos",
  ready: `${PICKS.length} photos ready`,
  change: "Change",
} as const;

/* ── the shut door and the line someone who was in reads ────────────────── */

const ONLY = says(`Only ${HOST.name} can let you in.`, "key");
const KEEP = says(
  "Keep this link. It opens the album the moment you're let in.",
  "link",
);
const MADE_PRIVATE = says(`${HOST.name} made this album private.`, "lock");
const BACK = says(`Only ${HOST.name} can let you back in.`, "key");

/** What a newcomer reads at the shut door, whichever of the five keeps her out. */
const SHUT: Record<DirectionId, Words> = {
  // Production's private branch, word for word (`e/[token]/page.tsx`).
  today: {
    title: "This event is private",
    lines: [
      says(
        "The host has this event set to private. Check back later, or ask them to make it public.",
      ),
    ],
  },
  host: { eyebrow: "Closed", title: EVENT.name, lines: [ONLY, KEEP] },
  // Round one's lit column: it names no album and no host.
  lit: {
    title: "This album is closed",
    lines: [
      says(
        "Only the host can let you in. This link works again the moment they do.",
      ),
    ],
  },
  doorway: { eyebrow: "Closed", title: EVENT.name, lines: [ONLY, KEEP] },
};

/** What someone who was in reads instead (`previous=private`): Priya, and Dom too. */
const WAS_IN: Record<DirectionId, Words> = {
  // Today's screen with the line `settings-wiring` adds to it.
  today: {
    title: "This event is private",
    lines: [says(`${MADE_PRIVATE.text} ${BACK.text}`, "lock")],
  },
  host: { eyebrow: "Private", title: EVENT.name, lines: [MADE_PRIVATE, BACK] },
  lit: {
    title: "This album is private",
    lines: [
      says(
        "The host made it private. This link works again the moment they let you back in.",
        "lock",
      ),
    ],
  },
  doorway: {
    eyebrow: "Private",
    title: EVENT.name,
    lines: [MADE_PRIVATE, BACK],
  },
};

/** The words one reader meets at the shut door, in one direction. */
export function shutWords(direction: DirectionId, wasIn: boolean): Words {
  return wasIn ? WAS_IN[direction] : SHUT[direction];
}

/* ── the shut door's foot, which follows who is reading ─────────────────── */

/** The one way out every dead end in the not-found family carries. */
export const WAY_OUT = "What is Partyreel?";

/** The quiet way back for someone already in, on a new phone (event-safety's `back-in`). */
export const BACK_IN = {
  lead: "Already a guest?",
  link: "Confirm your email",
} as const;

/**
 * `unlisted=ask`, his words: "Let's do this as the primary, but also add the
 * 'use a different email' below as a secondary action." Drawn for a confirmed
 * address the invite list does not hold, and for nobody else (`fixtures.ts`'s
 * `unlisted`): asking takes her to the waiting door, and a declined ask meets
 * the shut door with no ask on it.
 */
export const UNLISTED = {
  ask: `Ask ${HOST.name} to let me in`,
  other: "Use a different email",
} as const;

/* ── the beat, the moment the door opens itself ─────────────────────────── */

export const BEAT = {
  title: "You're in",
  line: "Welcome to the party",
  /**
   * The host's door says who opened it: the past tense takes no agreement, so
   * it holds for "The Chens" as it does for "Maya".
   */
  byHost: `${HOST.name} let you in`,
  sending: `Sending your ${PICKS.length} photos`,
} as const;

/* ── the 404, today's words in both of its looks ────────────────────────── */

/**
 * A LINK THAT OPENS NOTHING (`e/[token]/not-found.tsx`), word for word: the
 * `lost` ask is about its look, so its words stay today's in both options.
 * ★ It never says an event "ended": there is no end date in this product.
 */
export const LOST = {
  eyebrow: "Event link",
  title: "This event link didn't work",
  line: "The link may be mistyped, or the host may have deleted the event. Double-check the QR code or link, or ask the host to resend it.",
  help: { lead: "Still stuck?", link: "Visit the help center" },
  demo: "See how it works with a live demo",
} as const;

/** A shut door's text, read as one paragraph where a direction draws prose. */
export const prose = (lines: readonly Line[]) =>
  lines.map((l) => l.text).join(" ");
