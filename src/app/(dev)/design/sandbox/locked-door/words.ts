import { EVENT, HOST } from "./fixtures";

/**
 * EVERY WORD A LOCKED DOOR SAYS, IN ONE TABLE.
 *
 * ★ TRUE OF ALL THREE CAUSES, OR NOT SAID. One screen answers a private album,
 * an album closed to newcomers and a block, so the words may only say what the
 * three share: the reader can't open it, and only the host can change that.
 * "Closed" is the umbrella a private album, a closed one and a block all fit
 * under; "private" fits one of them. Today's line (`today`) is the measure of
 * why: "ask them to make it public" is no help to a closed-out newcomer, whose
 * album is already public, or to a blocked guest, whom public would not let in.
 *
 * ★ NO PRONOUN FOR THE HOST. A host's display name can be anyone's ("Maya", "The
 * Chens", "Maya & Jay"), so a line that names her says her name again rather
 * than guess a "she" (`guest-flow.md`: the door's lede names nobody for the
 * same reason, a long name breaks it).
 *
 * ★ A PREVIOUS GUEST'S LINE SPEAKS OF THE ALBUM, NEVER OF HER (the `previous`
 * ask). She meets the lock only when the album is private or she is blocked, so
 * whatever she reads a blocked guest reads too: a line about her own photos
 * would tell the two apart (a block removed his), so none is drawn.
 */

export type LockId = "today" | "lit" | "door" | "host" | "cover";
export type LineId = "one" | "private" | "changed";

/**
 * A line and the glyph its row leads with where the screen draws rows (the
 * welcome's promise rows, `host` and `cover`): the glyph follows what the line
 * says, never its place, so a line keeps its mark in whichever row it lands.
 */
export type Line = { text: string; mark: "key" | "link" | "lock" | "eye" };

/** One screen's message: what the reader is told, header and ways out apart. */
export type Words = {
  /** The small line over the headline (the door's eyebrow). */
  eyebrow?: string;
  title: string;
  /** The lines under it: one for the page, one or two for the door's rows. */
  lines: readonly Line[];
};

const says = (text: string, mark: Line["mark"] = "key"): Line => ({
  text,
  mark,
});

const HOST_WAY = says(`Only ${HOST.name} can let you in.`, "key");
const KEEP_LINK = says(
  "Keep this link. It opens the album the moment you're let in.",
  "link",
);

/** What a newcomer reads, and everyone under `previous=one`. */
const EVERYONE: Record<LockId, Words> = {
  // Production's private branch, word for word (`e/[token]/page.tsx`).
  today: {
    title: "This event is private",
    lines: [
      says(
        "The host has this event set to private. Check back later, or ask them to make it public.",
      ),
    ],
  },
  lit: {
    title: "This album is closed",
    lines: [
      says(
        "Only the host can let you in. This link works again the moment they do.",
      ),
    ],
  },
  door: {
    eyebrow: "Closed",
    title: "Only the host can let you in",
    lines: [says("This link works again the moment they do.")],
  },
  host: { eyebrow: "Closed", title: EVENT.name, lines: [HOST_WAY, KEEP_LINK] },
  cover: { eyebrow: "Closed", title: EVENT.name, lines: [HOST_WAY, KEEP_LINK] },
};

/** What someone who was in reads instead, under the two lines of their own. */
const PREVIOUS: Record<Exclude<LineId, "one">, Record<LockId, Words>> = {
  // His "private version": the state named, which a blocked guest reads too.
  private: {
    // Today already says private to everyone, so it has nothing to add.
    today: EVERYONE.today,
    lit: {
      title: "This album is private",
      lines: [
        says(
          "The host made it private. This link works again the moment they let you in.",
        ),
      ],
    },
    door: {
      eyebrow: "Private",
      title: "Only the host can let you in",
      lines: [
        says(
          "The host made this album private. This link works again once they let you in.",
        ),
      ],
    },
    host: {
      eyebrow: "Private",
      title: EVENT.name,
      lines: [says(`${HOST.name} made this album private.`, "lock"), HOST_WAY],
    },
    cover: {
      eyebrow: "Private",
      title: EVENT.name,
      lines: [says(`${HOST.name} made this album private.`, "lock"), HOST_WAY],
    },
  },
  // What a private album and a block share, said to someone who was in.
  changed: {
    today: {
      title: EVERYONE.today.title,
      lines: [
        says("The host changed who can see this event since you were in."),
      ],
    },
    lit: {
      title: "This album is closed",
      lines: [
        says(
          "The host changed who can see it since you were in. This link works again once they let you in.",
        ),
      ],
    },
    door: {
      eyebrow: "Closed",
      title: "Only the host can let you in",
      lines: [
        says("The host changed who can see this album since you were in."),
      ],
    },
    host: {
      eyebrow: "Closed",
      title: EVENT.name,
      lines: [
        says(
          `${HOST.name} changed who can see this album since you were in.`,
          "eye",
        ),
        HOST_WAY,
      ],
    },
    cover: {
      eyebrow: "Closed",
      title: EVENT.name,
      lines: [
        says(
          `${HOST.name} changed who can see this album since you were in.`,
          "eye",
        ),
        HOST_WAY,
      ],
    },
  },
};

/** The words one reader meets on one screen, under the board's previous-guest line. */
export function wordsFor(lock: LockId, line: LineId, wasIn: boolean): Words {
  if (!wasIn || line === "one") return EVERYONE[lock];
  return PREVIOUS[line][lock];
}

/** The quiet way back for someone already in on a new phone (event-safety's `back-in`). */
export const BACK_IN = {
  lead: "Already a guest?",
  link: "Confirm your email",
} as const;

/** The one way out every dead end in the not-found family carries. */
export const WAY_OUT = "What is Partyreel?";
