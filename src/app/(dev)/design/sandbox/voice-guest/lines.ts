/**
 * THE CANDIDATE LINES, AND NOTHING ELSE (the retired `voice` board's own
 * shape: the words in one pure module, so the preview that sets a line, the
 * reader that measures it and the Handoff that quotes it read one string).
 *
 * ★ FOUR KEYS PER LINE, THE SAME FOUR EVERYWHERE: `today` is the shipped
 * string, read out of the file named above it; `warm`, `bright` and `exact`
 * are the three registers the brief asks the candidates to span (plain and
 * warm, bright and playful, quiet and exact). The keys ARE the option ids, so
 * a ledger of answers reads as a voice at a glance: welcome=bright,
 * failed=warm, and so on. Each register is written for its place, never as
 * a costume: a line that could not ship where it is drawn is not a candidate.
 *
 * ★ EVERY LINE CLEARS THE FENCES BEFORE IT IS A CANDIDATE: no em-dash (bible
 * 19), never "no account" (bible 20), never "anonymous" (the identity rule),
 * the album is the noun, "in your account" and never "on your profile", no
 * promise of what the host will decide, and "night" never used as identity.
 * Lines Will ruled verbatim stay verbatim inside every candidate that carries
 * them ("No app required.", "The album starts with you").
 *
 * The host's and the event's names are PARAMETERS, never typed into a line,
 * because the product fills them from the event; a candidate that only reads
 * well for "Maya" is not one.
 */

export type Register = "today" | "warm" | "bright" | "exact";

/** 1. The door's welcome: its two rows under the event's name
 *  (`entry-modal.tsx`, `WelcomeStep`). */
export const WELCOME: Record<
  Register,
  { lead: string; album: (host: string, count: number) => string }
> = {
  today: {
    lead: "Add your photos and videos in seconds. No app required.",
    album: (_host, count) =>
      `Everyone’s shots land in one album. ${count} are already inside.`,
  },
  warm: {
    lead: "Add your photos and videos in a few taps. No app required.",
    album: (host, count) =>
      `They join everyone else’s in ${host}’s album. ${count} so far.`,
  },
  bright: {
    lead: "Caught something good? Add it in seconds. No app required.",
    album: (host, count) =>
      `It all lands in ${host}’s album. ${count} got there first.`,
  },
  exact: {
    lead: "Add photos and videos from your phone. No app required.",
    album: (_host, count) => `One shared album. ${count} so far.`,
  },
};

/** 2. The password step's lede, under "Almost in" and "<event> is private"
 *  (`password-gate.tsx`). */
export const ASK: Record<Register, string> = {
  today:
    "The host keeps this album private for guests. Enter the password from your invite to come in.",
  // The ruled gate line's own shape (`account-door.tsx`, `gate`): why, then
  // the cost, then "and you're in".
  warm: "This album is just for the guests. One password and you’re in.",
  bright: "Guests only, and that means you. The password is on your invite.",
  exact: "Enter the password the host shared with guests.",
};

/** 3. The stack tile's last beat, as the last of a pick lands
 *  (`upload/stack-tile.tsx`). `null` is today: the tile leaves and says
 *  nothing. `member` is the same line for a signed-in guest, whose upload is
 *  already the save. */
export const LANDED: Record<
  Register,
  { guest: (n: number) => string; member: (n: number) => string } | null
> = {
  today: null,
  warm: {
    guest: (n) => `All ${n} are in the album`,
    member: (n) => `All ${n} are in, and in your account`,
  },
  bright: {
    guest: (n) => `All ${n} landed`,
    member: (n) => `All ${n} landed. Yours to keep.`,
  },
  exact: {
    guest: (n) => `${n} added`,
    member: (n) => `${n} added · in your account`,
  },
};

/** 4. The failure sheet's own words: its heading, its line, and the one
 *  button that retries (`upload/failure-sheet.tsx`). The rows under them
 *  carry the server's own sentence and stay as shipped. */
export const FAILED: Record<
  Register,
  {
    heading: (failed: number, sent: number) => string;
    line: (host: string, landed: number) => string;
    retry: (failed: number) => string;
  }
> = {
  today: {
    heading: (failed) =>
      failed === 1 ? "1 file did not go" : `${failed} files did not go`,
    line: (host) => `Everything else is in ${host}’s album.`,
    retry: (failed) => (failed === 1 ? "Try again" : "Retry all"),
  },
  warm: {
    heading: (failed) => `${failed} didn’t make it`,
    line: (host, landed) => `The other ${landed} are in ${host}’s album.`,
    retry: (failed) => (failed === 1 ? "Send it again" : "Send them again"),
  },
  bright: {
    heading: (failed) => `${failed} got stuck on the way`,
    line: (host, landed) =>
      `The other ${landed} made it into ${host}’s album.`,
    retry: (failed) =>
      failed === 1 ? "Give it another go" : "Give them another go",
  },
  exact: {
    heading: (failed, sent) => `${failed} of ${sent} didn’t upload`,
    line: (_host, landed) => `The other ${landed} are in the album.`,
    retry: (failed) =>
      failed === 1 ? "Retry" : failed === 2 ? "Retry both" : `Retry all ${failed}`,
  },
};

/** 5. The empty album's one button, under the ruled heading
 *  (`gallery-empty-state.tsx`). */
export const EMPTY_HEADING = "The album starts with you";
export const EMPTY: Record<Register, string> = {
  today: "Be the first to add a photo",
  warm: "Add the first photo",
  bright: "Get it started",
  exact: "Add photos",
};

/** 6. A held photograph's own tile, as the guest who sent it sees it
 *  (`upload/stack-tile.tsx`, `WaitingTile`). */
export const WAITING: Record<Register, string> = {
  today: "Waiting for the host",
  warm: "The host sees it first",
  bright: "Over to the host",
  exact: "Only you see this for now",
};

/** 7. The capture after her first photographs: the card's heading, reason
 *  and button (`save-account-prompt.tsx`), and the door it opens
 *  (`account-door.tsx`'s `save` wear). The button holds at "Confirm your
 *  email" in every register: the Unverified mark and the name menu open the
 *  same door with those words (the board's carried `button` call). */
export const KEEP_BUTTON = "Confirm your email";
export const KEEP: Record<
  Register,
  {
    heading: (n: number) => string;
    body: (n: number, event: string) => string;
    doorHeading: string;
    doorReason: string;
  }
> = {
  today: {
    heading: (n) => (n === 1 ? "Keep this photo" : "Keep these photos"),
    body: (n) =>
      `Confirm your email and ${n === 1 ? "it stays" : `all ${n} stay`} with you: this event in your account, and everything you added to it.`,
    doorHeading: "Keep your photos",
    doorReason:
      "Confirm your email and every photo you add here stays in your account, with this event. Confirming makes a free account.",
  },
  warm: {
    heading: () => "Keep this event",
    body: (n, event) =>
      `Confirm your email and ${event} stays in your account with your ${n} photos, to come back to anytime.`,
    doorHeading: "Keep this event",
    doorReason:
      "Confirm your email and this event stays in your account with every photo you add, to come back to anytime. Confirming makes a free account.",
  },
  bright: {
    heading: () => "Take it with you",
    body: (n, event) =>
      `Confirm your email and ${event} goes where you go, with your ${n} photos and the whole album.`,
    doorHeading: "Take it with you",
    doorReason:
      "Confirm your email and this event goes where you go, with every photo you add. Confirming makes a free account.",
  },
  exact: {
    heading: (n) => `Keep your ${n} photos`,
    body: () =>
      "Confirm your email to keep this event and your photos in your account.",
    doorHeading: "Keep your photos",
    doorReason:
      "Confirm your email to keep this event and your photos in your account. Confirming makes a free account.",
  },
};
