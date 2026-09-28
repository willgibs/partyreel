import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE LOCKED DOOR, ROUND ONE (Will's event-safety r1 notes, 2026-09-28).
 *
 * His words. On `door=private`: "Nice use reusing an existing lock screen to
 * lock out blocked users, without the 'blocked' experience feeling distinct so
 * guests won't be able to immediately discern they were blocked. Sneaky block,
 * I like it." On `newcomer=same`: "Maybe a private version so previous guests
 * of an event can see the host made it private versus a closed album (gated
 * access) ... Feel like the design could be polished though, if this'll be a
 * high-traffic screen."
 *
 * ★ ONE SCREEN, THREE CAUSES. His two answers make the private album's locked
 * screen the door a blocked person meets AND the door a newcomer meets at an
 * album closed to newcomers, so every option here is one render for all three:
 * what moves between readers is the header (who this device is) and the
 * back-in line (whether she has an email to confirm), never the reason she is
 * out. `fixtures.ts` carries the cause for the frames' titles and no drawing
 * reads it.
 *
 * ★ EVERY OPTION'S WORDS ARE TRUE OF ALL THREE (`words.ts`): she can't open it,
 * only the host can change that. Today's are the measure of why the screen
 * needs this round: "private" and "ask them to make it public" are true of a
 * private album alone, and no help to the other two.
 *
 * ★ THE PREVIOUS GUEST'S TRAP, DRAWN RATHER THAN ARGUED (`previous`). Someone
 * who was in meets the lock only when the album is private or she is blocked,
 * so whatever line she reads, a blocked guest reads too. Its three phones
 * measure exactly that: Dom's words against Priya's, word for word.
 *
 * ★ WHAT A LOCK MAY SHOW IS PART OF THE PICK. Today's private branch reveals
 * nothing (no name, no host, no photograph). Two options name the album and
 * its host, which a password album already does, and one shows its newest
 * photograph behind the door's own blur; each says what it costs.
 *
 * ★ NEVER ASKED HERE, EACH ANSWERED OR ASKED ELSEWHERE: a way to ask the host
 * from the door (`newcomer=same` left the closed door without one); the invite
 * list's own door for an unlisted address (`unlisted=ask`, carried by
 * `event-settings`); whether anyone is mailed when let in (`emails.letin`).
 */

/** The width a door is read at: a phone off a printed code first. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/**
 * WHO IS AT THE DOOR: the three people it stops, one per cause. Flipping it
 * moves the header and the back-in line and nothing else, which is the point.
 */
const WHO: Control = {
  id: "who",
  label: "Who is at the door",
  options: [
    { id: "newcomer", label: "A newcomer, closed out" },
    { id: "priya", label: "Priya, who was in (private)" },
    { id: "dom", label: "Dom, who was in (blocked)" },
  ],
  default: "newcomer",
};

export const LOCKED_DOOR = defineExploration({
  id: "locked-door",
  title: "The locked door",
  round: {
    n: 1,
    date: "2026-09-28",
    changed:
      "A new board on his event-safety notes: the one locked screen a guest meets whatever keeps her out, polished in the door's lit family, and a previous guest's line asked on its own.",
  },
  context:
    'Will, event-safety r1: a blocked guest meets the private album\'s locked screen ("Sneaky block"), a newcomer at a closed album meets the same one, and it "could be polished" for a high-traffic screen. So one screen answers three causes, in words true of all three. Drawn at Maya and Jay\'s wedding, 375 first with 1440 on the knob, in the door\'s own lit parts; the header and the back-in line follow who is reading, never why.',
  carried: [
    {
      id: "one-render",
      question: "Does every cause of a locked door get one render?",
      taken:
        "Yes, as door=private and newcomer=same have it: who is reading moves the header and the back-in line, never why she is out.",
      overrule:
        "Give each cause its own words once a block no longer needs the other two to hide behind.",
    },
    {
      id: "back-in",
      question:
        "Where does 'Already a guest? Confirm your email' stand, now the closed door is also the private and blocked one?",
      taken:
        "On every cause, for anyone with no confirmed email on the phone. event-safety drew it on the closed door alone, which told the causes apart.",
      overrule:
        "Drop it everywhere if a closed album should keep only the phones already in it.",
    },
    {
      id: "no-ask",
      question: "Does the locked door offer a button to ask the host?",
      taken:
        "No: newcomer=same left the closed door without one, and on a block it would hand Dom a way to reach Maya.",
      overrule:
        "Add one if a latecomer's ask is worth that reach, as the invite list's unlisted door (unlisted=ask) already offers.",
    },
  ],
  asks: [
    {
      id: "lock",
      label: "The locked screen",
      question: "Which screen should a guest meet whenever she can't get in?",
      context:
        "The host made the album private, closed it to newcomers, or blocked her: one screen answers all three, so a block reads as the other two. Today's says private and asks for it public, true of one cause.",
      options: [
        {
          id: "today",
          label: "Today's screen, as it ships",
          means:
            'The not-found family\'s lock: "This event is private" and "ask them to make it public". True of a private album only, and no help to the other two.',
        },
        {
          id: "lit",
          label: "Today's column, lit",
          means:
            "The same centred screen, its lock in a pool of the house light and its words true of all three: only the host can let you in. It names no album.",
        },
        {
          id: "door",
          label: "The door, held shut",
          means:
            'The lit door every guest meets rises over the ghost river and stays shut: "Closed" in its eyebrow, the host as the way on. It names no album.',
        },
        {
          id: "host",
          label: "The host's door, shut",
          means:
            "The welcome's hero, closed: the album's name beside Maya's face, then \"Only Maya can let you in\". A private album starts showing its name and host.",
        },
        {
          id: "cover",
          label: "The host's door, over its cover",
          means:
            "The host's door over the album's newest photograph, blurred as the door blurs an album, its lamp in that photograph's hues. Everyone shut out sees it.",
        },
      ],
      recommended: "host",
      because:
        "Most people at a locked door are guests, not the one blocked, and the host's name is the way on that is true of all three causes. A password album already shows its name, and Maya's settings promise guests a friendly locked screen.",
      overrule:
        "If a private album should keep saying nothing about itself, the held door gives the same light and way back without the name.",
      lands:
        "The private branch of the album page, which a block and a closed album then share, and whether a private album's lock names the album and its host.",
      tile: "phone",
      configs: [SCREEN, WHO],
    },
    {
      id: "previous",
      label: "A previous guest's line",
      question:
        "Should a guest who was already in read a different line from a newcomer?",
      context:
        "The server knows who was in. She meets the lock only when the album is private or she is blocked, so whatever she reads, a blocked guest reads too: her line may speak of the album, never of her.",
      options: [
        {
          id: "one",
          label: "One screen for everyone",
          means:
            "Priya, who was in, reads word for word what a newcomer reads, so nothing on the door tells who was in, or why she is out.",
        },
        {
          id: "private",
          label: "Told it's private",
          means:
            "Priya reads that Maya made it private, as her dashboard card already says. Dom, blocked, reads the same while his friends are still inside.",
        },
        {
          id: "changed",
          label: "Told who can see it changed",
          means:
            "Priya reads that Maya changed who can see it since she was in: true of a private album and of a block alike, and no more.",
        },
      ],
      recommended: "one",
      because:
        'A line only previous guests read reaches a blocked one too, so it can only say what a block and a private album share, and the one screen already says that. "Private" would be the product\'s one untrue sentence, said to the person it blocked.',
      overrule:
        'If Priya should hear "private", as her dashboard card already tells her, the private line gives her that and gives Dom a cover story.',
      lands:
        "Whether the lock reads who is asking (her cookie or account), as the block check already does, and the one line said to those who were in.",
      after: { ask: "lock" },
      configs: [SCREEN],
    },
  ],
});
