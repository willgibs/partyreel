import { shutDoorCopy } from "@/components/guest/door/shut-door";
import { waitingCopy } from "@/components/guest/door/waiting-step";

import { EVENT, HOST, PICKS } from "./fixtures";

/**
 * EVERY WORD THE DIRECTIONS SAY, IN ONE TABLE: three directions by four states,
 * the wait's three shapes, the shut door's foot, the 404.
 *
 * ★ TODAY SAYS NOTHING HERE. Every state of today's door is production's own
 * piece (`today.tsx`), which speaks its own words. Where a direction says what
 * today says, it reads production's copy function (`waitingCopy`,
 * `shutDoorCopy`) rather than a copy of it, so the next change to the door's
 * words reaches every direction; where production says a word inline, with no
 * function to read (the welcome, the 404, the held door's eyebrow and mark, the
 * shut door's way out and its way back in), it is quoted here beside its file.
 *
 * ★ THE SHUT DOOR'S WORDS ARE TRUE OF ALL FIVE, OR NOT SAID (event-safety's
 * `newcomer=same`). One screen answers an Only me album, an album closed to
 * newcomers, a decline, an address not on the invite list and a block, so the
 * words may only say what the five share: she can't open it, and only the host
 * can change that. Production says it as "This album is closed", round one's
 * lit column's words, which is why the lit column's shut door reads today's.
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
 * Maya" and "Only Maya can" hold for every name. (Production's own "Maya will
 * let you in" holds too: "will" takes no agreement.)
 *
 * ★ THE GUEST'S WORD IS ALBUM (`guest-flow.md`), so every new line says album.
 * The 404's words are quoted as they ship, "event" included, because they are
 * the reference and not a draft.
 */

export type DirectionId = "today" | "host" | "lit" | "doorway";
/** A direction this table words: today's door speaks production's own. */
export type DrawnId = Exclude<DirectionId, "today">;
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
  | "bell"
  | "clock";

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
 * are not what this round asks (voice-guest settled them), its look is. Quoted
 * from `entry-modal.tsx`'s `WelcomeStep`, which exports none. The count is the
 * album's live number, said as the welcome's own promise row says it
 * (`LiveCount` ticks it in production).
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

/* ── the wait: today's words, then what each shape of wait adds ────────── */

/** The held door's own words for Maya (`waiting-step.tsx`). */
const WAITING = waitingCopy(HOST.name);

/**
 * WHAT THE HELD DOOR SAYS INLINE (`WaitingDoor`, which has no function for
 * them): its eyebrow beside a clock, the live mark under its words, and its one
 * way out.
 */
export const HELD = {
  eyebrow: "Asked",
  mark: "Waiting at the door",
  other: "Use a different email",
} as const;

const REASON = says(WAITING.reason, "door");
/** The live wait's one true line about the other side. */
export const TOLD = says(`${HOST.name} has been told you're here.`, "bell");
/** The host's door says today's title as its first line, under the plate. */
const LETS_IN = says(`${WAITING.title}.`, "key");

/**
 * The waiting door's head: today's eyebrow over today's title, but the host's
 * door keeps the album's name as its title on every state (the plate on the
 * door), so today's title is its first line instead.
 */
const WAIT_HEAD: Record<DrawnId, Omit<Words, "lines">> = {
  host: { eyebrow: HELD.eyebrow, title: EVENT.name },
  lit: { eyebrow: HELD.eyebrow, title: WAITING.title },
  doorway: { eyebrow: HELD.eyebrow, title: WAITING.title },
};

/**
 * THE WAIT'S THREE SHAPES (the `wait` ask). `still` is today's wait as it
 * ships (event-settings' `waiting=held`): its words, and under them the dot
 * that breathes while she waits (`WaitHold`). `live` adds the one true thing a
 * wait can say about the other side, that the host has been told (the hub's
 * Guests card, the pulse and the bell do tell her, and nothing is mailed), and
 * a clock that ticks. `pick` keeps today's words and hands her something to do
 * (`PICK`).
 */
const WAIT_LINES: Record<WaitId, readonly Line[]> = {
  still: [REASON],
  live: [TOLD, REASON],
  pick: [REASON],
};

export function waitWords(direction: DrawnId, wait: WaitId): Words {
  const lines = WAIT_LINES[wait];
  return {
    ...WAIT_HEAD[direction],
    lines: direction === "host" ? [LETS_IN, ...lines] : lines,
  };
}

/** How long she has waited, ticking under the live wait. */
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

/**
 * What a newcomer reads at the shut door, whichever of the five keeps her out,
 * and (`wasIn`) what someone who was in reads instead: Priya, and Dom too. The
 * host's door and the doorway name the album on its plate; the lit column
 * names nothing, in today's words.
 */
const SHUT: Record<Exclude<DrawnId, "lit">, Record<"out" | "was", Words>> = {
  host: {
    out: { eyebrow: "Closed", title: EVENT.name, lines: [ONLY, KEEP] },
    was: { eyebrow: "Private", title: EVENT.name, lines: [MADE_PRIVATE, BACK] },
  },
  doorway: {
    out: { eyebrow: "Closed", title: EVENT.name, lines: [ONLY, KEEP] },
    was: { eyebrow: "Private", title: EVENT.name, lines: [MADE_PRIVATE, BACK] },
  },
};

/** The words one reader meets at the shut door, in one direction. */
export function shutWords(direction: DrawnId, wasIn: boolean): Words {
  if (direction === "lit") {
    const copy = shutDoorCopy(wasIn);
    return {
      title: copy.title,
      lines: [says(copy.description, wasIn ? "lock" : "key")],
    };
  }
  return SHUT[direction][wasIn ? "was" : "out"];
}

/* ── the shut door's foot, which follows who is reading ─────────────────── */

/** The one way out every dead end in the not-found family carries (`shut-door.tsx`, `not-found.tsx`). */
export const WAY_OUT = "What is Partyreel?";

/**
 * THE QUIET WAY BACK IN, as the shut door ships it (`shut-door.tsx`,
 * event-safety's `back-in`): for a visitor signed out, since someone already in
 * signs in on the new phone and the door knows her by her account.
 */
export const BACK_IN = {
  lead: "Already a guest?",
  link: "Log in",
} as const;

/* ── the beat, the moment the door opens itself ─────────────────────────── */

/** "You're in", as `entry-modal.tsx`'s `SuccessStep` says it (it exports none). */
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
 * A LINK THAT OPENS NOTHING (`e/[token]/not-found.tsx`), word for word, for
 * the directions that redraw it (today's is the page itself): the `lost` ask
 * is about its look, so its words stay today's in both options.
 * ★ It never says an event "ended": there is no end date in this product.
 */
export const LOST = {
  eyebrow: "Event link",
  title: "This event link didn't work",
  line: "The link may be mistyped, or the host may have deleted the event. Double-check the QR code or link, or ask the host to resend it.",
  help: { lead: "Still stuck?", link: "Visit the help center" },
  demo: "See how it works with a live demo",
} as const;

/** A message's lines, read as one paragraph where a direction draws prose. */
export const prose = (lines: readonly Line[]) =>
  lines.map((l) => l.text).join(" ");
