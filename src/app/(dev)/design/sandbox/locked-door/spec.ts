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
  surface: "guest",
  desk: 30,
  lives: [
    "docs/systems/guest-flow.md",
    "src/app/(guest)/e/[token]/page.tsx",
    "src/app/(guest)/e/[token]/not-found.tsx",
    "src/components/shared/not-found-screen.tsx",
    "src/components/guest/entry-shell.tsx",
    "src/components/guest/entry-modal.tsx",
    "src/components/guest/door/lit.tsx",
    "src/components/guest/door/lit.css",
    "src/components/guest/door/heading.tsx",
  ],
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
  opening: {
    about:
      "The door a guest meets before an album opens: its welcome, the wait while the host decides, the one shut door, and a dead link's page.",
    settled: [
      "Someone who was in reads that Maya made it private (your round one pick); a guest Maya blocked reads the same line.",
      "One shut door for all five ways a newcomer is kept out: Only me, a closed door, a decline, the invite list, a block.",
      "An address not on the invite list is offered Ask Maya to let me in, then Use a different email.",
      "The welcome keeps today's words; this round asks only how the door looks and behaves.",
    ],
    earlier: [
      "The host's door, 'not a direct selection': push it and today's lit column further, and try one fresh.",
      "'Today's closed screen falls short, but I'm still not in love with our door design either.'",
      "'Curious if we can unlock something perfect for everything, whether shared or bespoke to each screen.'",
      "From event settings: the wait while Maya decides could be a more engaging waiting experience.",
    ],
  },
  terms: [
    {
      term: "shut door",
      means:
        "The one screen every newcomer who can't get in meets, whatever the reason.",
    },
    {
      term: "lit column",
      means:
        "A centred layout: one emblem in a pool of light, a headline and one line, as today's not-found page.",
    },
    {
      term: "held sheet",
      means:
        "The panel that rises over the blurred album on a phone, where today's welcome stands.",
    },
    {
      term: "not-found family",
      means:
        "The screens every broken link on the site shares: the QR glyph, a headline and a way out.",
    },
    {
      term: "lamp",
      means:
        "The glow along the door's edge, coloured by the album's newest photos.",
    },
    {
      term: "Public album",
      means: "An album anyone with the link opens straight away.",
    },
    {
      term: "Private album",
      means:
        "An album with a step before it opens: a password, Maya's yes, or the invite list.",
    },
    { term: "Only me", means: "An album only its host can see." },
    {
      term: "closed door",
      means: "An album whose host has stopped letting newcomers in.",
    },
    {
      term: "decline",
      means: "Maya turning down a newcomer's request to join.",
    },
    {
      term: "block",
      means: "Maya barring one person from the album, even after they were in.",
    },
  ],
  carried: [
    {
      id: "unlisted",
      question:
        "Where does a guest whose address is not on the invite list get the way to ask?",
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
      where: ["Guest", "The album's door", "Before the album opens"],
      when: "A guest scans Maya and Jay's code; the album may welcome her, make her wait for Maya, or stay shut.",
      context:
        "Four frames each: a Public album's welcome, the wait while Maya decides, the shut door every newcomer turned away meets, and that door for someone who was in. Each in its own shape.",
      options: [
        {
          id: "today",
          label: "Today's door, as it ships",
          means:
            "Today's welcome and wait in the sheet over the album, then the not-found page with a lock, whose words say private.",
          gains: "Nothing to build or learn: it is what guests meet now.",
          costs:
            "The shut door says private, which is true of only one of five reasons she is out.",
        },
        {
          id: "host",
          label: "The host's door",
          means:
            "Maya's face leads every state in a halo of the lamp's light, lit, breathing or unlit. Shut, it still shows the album's name and her face.",
          gains:
            "Maya's face on every state says whose party it is and who can let her in.",
          costs:
            "A shut door still shows the album's name and Maya's face to someone kept out.",
        },
        {
          id: "lit",
          label: "The lit column",
          means:
            "One centred emblem per state in a pool of light: the album, an hourglass, the lock. Shut, it names no album and no host.",
          gains:
            "The calmest: one emblem, one headline and one line per state.",
          costs:
            "Shut, it names no album and no host, so she may not know whose door it is.",
        },
        {
          id: "doorway",
          label: "The doorway",
          means:
            "A door on the page, its leaf the state: open onto the album, ajar, shut with light under it. The album shows through it, not behind a sheet.",
          gains:
            "One picture every state reads at a glance: open, ajar, or shut with light under it.",
          costs:
            "At a desk the welcome no longer sits beside the blurred album that pulls her in.",
        },
      ],
      recommended: "doorway",
      because:
        "Every state reads at a glance before a word: open, ajar while Maya decides, shut with the party's light under it.",
      overrule:
        "If the door should stay the sheet over the album, the host's door keeps today's grammar and makes Maya the way on.",
      lands:
        "The look of every door screen: the welcome, the wait, the shut door's page and the lines on it.",
      matters:
        "It is the first thing of an album anyone sees, and all a guest who is kept out ever sees.",
      configs: [SCREEN, WELCOME_AT, AT, WAS],
    },
    {
      id: "shape",
      label: "One design or four",
      question:
        "Should the door's four states share one design, or should each get its own?",
      where: ["Guest", "The album's door", "Welcome, wait and shut"],
      when: "The same guests at the same door: welcomed, waiting for Maya, or kept out, drawn in the direction you pick.",
      context:
        "Drawn in your direction. One design stands every state in one frame; two is today's, the sheet for the doors that open and a page for the one that does not; each its own builds every state for its job.",
      options: [
        {
          id: "shared",
          label: "One design for every state",
          means:
            "The same frame, emblem and heading from the welcome to the shut door; only the words and the light move. One door to learn, once.",
          gains: "One door to learn once; only the words and the light change.",
          costs: "The shut door looks like a door that might still open.",
        },
        {
          id: "split",
          label: "Two, as today: a sheet and a page",
          means:
            "The welcome and the wait in the held sheet; the shut door a page of its own, as the not-found family draws it today.",
          gains:
            "Today's arrangement: the sheet over the album, then a plain page when shut.",
          costs:
            "A turned-away guest lands on a page that looks unrelated to the door she met.",
        },
        {
          id: "bespoke",
          label: "Each state its own",
          means:
            "The welcome the sheet over the album, the wait a page of its own to hold, the shut door a quiet page: each shaped for its one job.",
          gains:
            "Each screen built for its one job: a welcome that sells, a wait to hold.",
          costs:
            "Three designs to build and keep in step, and a new look at every state.",
        },
      ],
      today: "split",
      recommended: "shared",
      because:
        "A guest meets the door once; one design means a wait or a shut door reads as the same door, not a new screen.",
      overrule:
        "If the shut door should never look like a door that might open, the split keeps it a page apart.",
      lands:
        "Which states stand in the held sheet and which on a page of their own.",
      matters:
        "It decides whether a guest who waits or is turned away still feels at the same door, or lost on a new screen.",
      after: { ask: "family" },
      configs: [SCREEN, WELCOME_AT, AT, WAS],
    },
    {
      id: "wait",
      label: "The wait",
      question:
        "What should a newcomer hold while Maya decides whether to let her in?",
      where: ["Guest", "The album's door", "Waiting for Maya"],
      when: "Lena asked to join a Private album where Maya lets each newcomer in herself, and Maya has not answered yet.",
      context:
        "From your event settings note that the wait could be more engaging. Drawn in your door: the wait, then the moment Maya lets her in and it opens itself. She sees nothing of the album until then.",
      options: [
        {
          id: "still",
          label: "A still wait, as it will ship",
          means:
            "One line and how long ago she asked. The door opens by itself when Maya lets her in; nothing moves while she waits.",
          gains: "Simple and honest: one line, and the door opens itself.",
          costs:
            "Nothing to do or watch, so a long wait feels like being ignored.",
        },
        {
          id: "live",
          label: "A wait to watch",
          means:
            "The door breathes and its clock ticks, and it says the one true thing about the other side: Maya has been told she is here.",
          gains:
            "She sees the wait is alive: Maya has been told, and the clock ticks.",
          costs:
            "Still nothing to do, and a ticking clock can make a long wait feel longer.",
        },
        {
          id: "pick",
          label: "A wait to spend",
          means:
            "She chooses what she will add while she waits. Nothing leaves her phone until Maya lets her in, and then it goes straight in.",
          gains:
            "She spends the wait choosing photos, which go in the moment she is let in.",
          costs:
            "Asks a stranger to pick photos before she knows she's in; a no wastes it.",
        },
      ],
      today: "still",
      recommended: "pick",
      because:
        "It gives her the reason she came: her photos are picked and go in the moment Maya lets her in, and nothing is sent before.",
      overrule:
        "If picking before she is in asks too much of a stranger, the wait to watch keeps her company with nothing to do.",
      lands:
        "What the waiting door holds, and whether the upload queue takes her picks before she is let in.",
      matters:
        "A wait can run minutes; what she holds decides whether she stays or leaves the page.",
      after: { ask: "shape" },
      configs: [SCREEN],
    },
    {
      id: "lost",
      label: "The 404",
      question:
        "Should a link that opens nothing wear the shut door's design, or keep the not-found family's?",
      where: ["Guest", "The 404 page", "A link that opens nothing"],
      when: "Someone opens a mistyped link, or the link to an album the host deleted, off the same printed code.",
      context:
        "Today a broken link and the shut door share one look, the site's not-found page, the shut door with a lock on it. Drawn beside your shut door; the words stay today's in both.",
      options: [
        {
          id: "own",
          label: "Keep the not-found family's",
          means:
            "The QR glyph and the dead-end grammar every 404 on the site wears; the shut door leaves that family.",
          gains:
            "Every dead end on the site keeps one look: the QR glyph and a way out.",
          costs: "The shut door and a broken link stop looking related.",
        },
        {
          id: "follows",
          label: "Wear the shut door's design",
          means:
            "The same door with nothing in it, in its own words, so a link's two dead ends stay siblings, as they are today.",
          gains:
            "A link's two dead ends stay siblings, told apart by their words.",
          costs:
            "The 404 leaves the look every other dead end on the site shares.",
        },
      ],
      today: "own",
      recommended: "follows",
      because:
        "Off the same code, an empty door says the link is wrong as plainly as a locked one says she can't come in.",
      overrule:
        "If every dead end on the site should share one grammar, the 404 keeps the not-found family's.",
      lands:
        "What a guest's broken link draws: the not-found family, or the door's own.",
      matters:
        "Both dead ends start at the same code, so the page must tell 'wrong link' apart from 'you can't come in'.",
      after: { ask: "family" },
      configs: [SCREEN],
    },
  ],
});
