import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DOOR FAMILY, ROUND TWO (his locked-door r1 answers, 2026-09-29).
 *
 * His words. `lock=host`, not a direct selection: "I'd like to see more
 * polished/creative explorations off of this and option 2 (today's lit), as
 * well as maybe one fresh one. Today's closed screen falls short, but I'm still
 * not in love with our door design either. Curious if we can unlock something
 * perfect for everything, whether shared or bespoke to each screen." And from
 * event-settings r1, `waiting=held`: "This could definitely be redesigned to be
 * a more engaging waiting experience."
 *
 * ★ THE BOARD WIDENS INTO THE DOOR FAMILY. "Our door design" is the door every
 * guest meets, so every state is drawn together and judged whole: the welcome
 * that opens (a Public album's), the wait while the host decides (which opens
 * itself the moment she is let in), the one shut door every newcomer turned
 * away meets, and that door as someone who was in reads it. Four frames a
 * direction, 375 first with 1440 on the knob.
 *
 * ★ FOUR QUESTIONS, ONE ROOT. `family` is the direction (today, the host's door
 * pushed further, the lit column pushed further, the doorway), each drawn in
 * its own shape (`family.tsx`'s NATURAL). The other three wait on it and are
 * drawn in it: `shape` (one design or each its own, drawn all three ways),
 * `wait` (a wait worth holding), `lost` (whether the 404 follows the shut door).
 *
 * ★ `family` DECLARES NO `today`, ON PURPOSE. Its control's default is what the
 * three staged asks are drawn in before he answers it, and in today's door two
 * of them have nothing to ask: today's shut door is already the 404's sibling,
 * so `lost`'s two options draw one picture, and today's welcome stands in the
 * sheet in every shape. Drawn in the recommendation they each show a real
 * choice, and once `family` is answered every step wears his answer instead.
 *
 * ★ SETTLED, DRAWN AND NEVER ASKED: `previous=private` (someone who was in reads
 * that Maya made it private, and Dom, blocked, reads the same, the `was` knob
 * proving it word for word); `newcomer=same` (one shut door for an Only me
 * album, a closed door, a decline, an address not on the list and a block, its
 * words true of all five); `unlisted=ask` (Ask Maya to let me in, then Use a
 * different email); `back-in` (a phone with nothing confirmed is offered its
 * way back). The vocabulary is `settings-wiring`'s, built beside this round:
 * Public, Private (a gate) and Only me; a gate stops newcomers, and only Only me
 * and a block shut out someone already in.
 *
 * ★ NEVER ASKED HERE: `disposable-mode` r2's waiting room, which is the
 * camera's, inside the album after the door (a sibling in mood, not in job);
 * whether anyone is mailed when let in (the Emails bucket); the welcome's words
 * (voice-guest's), which every direction keeps.
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
 * WHERE THE WELCOME IS MET: a Public album's first screen (the album behind, its
 * own light), or a gate's first step, a password album before the password
 * (nothing of the album behind, the house light, and today no host or date).
 */
const WELCOME_AT: Control = {
  id: "welcome",
  label: "The welcome at",
  options: [
    { id: "public", label: "A Public album" },
    { id: "gate", label: "A password gate" },
  ],
  default: "public",
};

/**
 * WHO IS AT THE SHUT DOOR: flipping it moves the header and the foot and
 * nothing else, which is `newcomer=same` made visible. A newcomer off the code
 * is offered the way back in; Lena, confirmed and turned away, is not; Lena at
 * an invite list that does not hold her address is offered the ask.
 */
const AT: Control = {
  id: "at",
  label: "At the shut door",
  options: [
    { id: "code", label: "A newcomer off the code" },
    { id: "declined", label: "Lena, turned away" },
    { id: "unlisted", label: "Lena, not on the list" },
  ],
  default: "code",
};

/** WHO WAS IN: Priya reads Maya made it private; Dom, blocked, must read the same. */
const WAS: Control = {
  id: "was",
  label: "Who was in",
  options: [
    { id: "priya", label: "Priya, made private" },
    { id: "dom", label: "Dom, blocked" },
  ],
  default: "priya",
};

export const LOCKED_DOOR = defineExploration({
  id: "locked-door",
  title: "The door family",
  round: {
    n: 2,
    date: "2026-09-29",
    changed:
      "From your round one notes: the whole door as one family (the welcome, the wait, the shut door, and the line someone who was in reads), drawn three ways against today's, then one design or four, a wait worth holding, and the 404.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-28",
      changed:
        "The one locked screen, two decisions. lock came back as host, not a direct selection: push it and today's lit column further, and try one fresh. previous came back private.",
    },
  ],
  context:
    "Round two, from your notes: the door judged whole. Maya and Jay's wedding, every state a guest can meet: a Public album's welcome, the wait while Maya lets newcomers in one by one, the one shut door for all five reasons, and that door for Priya, who was in. Every frame's caption says what it shows of the album and whose light it wears.",
  carried: [
    {
      id: "unlisted",
      question:
        "Where does an address not on the invite list meet your unlisted=ask?",
      taken:
        "On the shut door, under its one message: Ask Maya to let me in, then Use a different email. Asking takes her to the wait.",
      overrule:
        "Put the ask on the invite list's own step, and the shut door keeps one foot for everyone.",
    },
    {
      id: "shows",
      question: "What may each direction's shut door show of the album?",
      taken:
        "Its own, measured under every frame: the host's door the name and Maya's face, at a gate too; the doorway the name and Maya's; the lit column nothing.",
      overrule:
        "Hold every direction to nothing, as a private album today, and the host's door loses its face.",
    },
    {
      id: "own-shape",
      question: "Is each direction drawn in a shape of its own?",
      taken:
        "Yes, at its best: the host's door and the doorway one design throughout, the lit column and today a sheet and a page.",
      overrule:
        "Draw all four in one shape if the directions should be compared frame for frame.",
    },
  ],
  asks: [
    {
      id: "family",
      label: "The door's direction",
      question:
        "Which direction should the door take, across every state a guest can meet it in?",
      context:
        "Four frames each: a Public album's welcome, the wait while Maya decides, the shut door every newcomer turned away meets, and that door for someone who was in. Each in its own shape.",
      options: [
        {
          id: "today",
          label: "Today's door, as it ships",
          means:
            "The lit sheet's welcome and wait, then the not-found lock, whose words say private: true of one of the five ways a newcomer is shut out.",
        },
        {
          id: "host",
          label: "The host's door",
          means:
            "Maya's face leads every state in a halo of the lamp's light, lit, breathing or unlit. Shut, it still shows the album's name and her face.",
        },
        {
          id: "lit",
          label: "The lit column",
          means:
            "One centred emblem per state in a pool of light: the album, an hourglass, the lock. Shut, it names no album and no host.",
        },
        {
          id: "doorway",
          label: "The doorway",
          means:
            "A door on the page, its leaf the state: open onto the album, ajar, shut with light under it. The album shows through it, not behind a sheet.",
        },
      ],
      recommended: "doorway",
      because:
        "It is the one design every state reads at a glance, before a word: open onto the album, ajar while Maya decides, shut with the party's light under it. And the light a shut-out guest sees is the house's, never the album's.",
      overrule:
        "If the door should stay the sheet over the album, the host's door keeps today's grammar and makes Maya the way on.",
      lands:
        "The look of every door screen: the welcome, the wait, the shut door's page and the lines on it.",
      configs: [SCREEN, WELCOME_AT, AT, WAS],
    },
    {
      id: "shape",
      label: "One design or four",
      question:
        "Should the door's four states share one design, or should each get its own?",
      context:
        "Drawn in your direction. One design stands every state in one frame; two is today's, the sheet for the doors that open and a page for the one that does not; each its own builds every state for its job.",
      options: [
        {
          id: "shared",
          label: "One design for every state",
          means:
            "The same frame, emblem and heading from the welcome to the shut door; only the words and the light move. One door to learn, once.",
        },
        {
          id: "split",
          label: "Two, as today: a sheet and a page",
          means:
            "The welcome and the wait in the held sheet; the shut door a page of its own, as the not-found family draws it today.",
        },
        {
          id: "bespoke",
          label: "Each state its own",
          means:
            "The welcome the sheet over the album, the wait a page of its own to hold, the shut door a quiet page: each shaped for its one job.",
        },
      ],
      today: "split",
      recommended: "shared",
      because:
        "A guest meets the door once, and one design means a wait or a shut door reads as the same door she was at, not a new screen to decode. The words and the light carry the state.",
      overrule:
        "If the shut door should never look like a door that might open, the split keeps it a page apart.",
      lands:
        "Which states stand in the held sheet and which on a page of their own.",
      after: { ask: "family" },
      configs: [SCREEN, WELCOME_AT, AT, WAS],
    },
    {
      id: "wait",
      label: "The wait",
      question:
        "What should a newcomer hold while Maya decides whether to let her in?",
      context:
        "Your waiting=held note: a more engaging wait. Drawn in your door: the wait, then the moment Maya lets her in and it opens itself. She reads nothing of the album until then.",
      options: [
        {
          id: "still",
          label: "A still wait, as it will ship",
          means:
            "One line and how long ago she asked. The door opens by itself when Maya lets her in; nothing moves while she waits.",
        },
        {
          id: "live",
          label: "A wait to watch",
          means:
            "The door breathes and its clock ticks, and it says the one true thing about the other side: Maya has been told she is here.",
        },
        {
          id: "pick",
          label: "A wait to spend",
          means:
            "She chooses what she will add while she waits. Nothing leaves her phone until Maya lets her in, and then it goes straight in.",
        },
      ],
      today: "still",
      recommended: "pick",
      because:
        "It is the only wait that gives her something to do, and the something is the reason she came: the moment Maya lets her in, her photos are already going in. Nothing is sent before.",
      overrule:
        "If picking before she is in asks too much of a stranger, the wait to watch keeps her company with nothing to do.",
      lands:
        "What the waiting door holds, and whether the upload queue takes her picks before she is let in.",
      after: { ask: "shape" },
      configs: [SCREEN],
    },
    {
      id: "lost",
      label: "The 404",
      question:
        "Should a link that opens nothing wear the shut door's design, or keep the not-found family's?",
      context:
        "A mistyped or deleted link shows the not-found screen, which today's lock shares. Drawn beside your shut door, its words today's in both.",
      options: [
        {
          id: "own",
          label: "Keep the not-found family's",
          means:
            "The QR glyph and the dead-end grammar every 404 on the site wears; the shut door leaves that family.",
        },
        {
          id: "follows",
          label: "Wear the shut door's design",
          means:
            "The same door with nothing in it, in its own words, so a link's two dead ends stay siblings, as they are today.",
        },
      ],
      today: "own",
      recommended: "follows",
      because:
        "A guest meets both from the same printed code, and the difference that matters is the words: a door with nothing in it says a link is wrong as plainly as a lock says she cannot come in.",
      overrule:
        "If every dead end on the site should share one grammar, the 404 keeps the not-found family's.",
      lands:
        "What a guest's broken link draws: the not-found family, or the door's own.",
      after: { ask: "family" },
      configs: [SCREEN],
    },
  ],
});
