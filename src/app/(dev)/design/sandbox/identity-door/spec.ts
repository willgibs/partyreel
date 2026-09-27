import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DOOR'S ICONS, WORDS AND BEATS, ROUND THREE (2026-09-27).
 *
 * Round two answered (docs/reviews/identity-door.json): `look=lit`, over his
 * own recommendation `peek`, with the note "The remaining icon + copy items
 * could likely be redesigned within this as well." In chat he chose to see
 * them drawn first, so this round draws them, inside lit, over every screen a
 * guest meets: the ones round two drew and the five it never did (the
 * password step, the upload step, the demo's welcome, the stalled opening and
 * the keep screen `guest-door` is building as the door's last).
 *
 * ★ FIVE ASKS, SPLIT WHERE ONE ANSWER CARRIES. Two are dimensions whose answer
 * every screen follows at once (the icons' language, the beats); three are the
 * screens whose words hold a real decision (the chooser, the line under her
 * name, the code screen). Everything else a guest reads is either his own
 * words or another board's line, held at today's: nothing is asked where no
 * drawn contender beat production.
 *
 * ★ TODAY IS PRODUCTION, NOT ROUND TWO'S BOARD. The board had drifted ("How
 * would you like to join?", a plus on the email row, Mail icons in the menu);
 * every `today` option here is production's words, icons and spacing, quoted.
 *
 * ★ WHAT THE STANDING BOARDS ASK, THIS ONE DOES NOT: `voice-guest.welcome`
 * (the welcome's two rows), `.ask` (the password step's words), `.keep` (the
 * keep screen's ask) and `.landed` (the stack tile's), all drawn at today's.
 * The gate's line is his, ruled verbatim. `popups` asks which surface a popup
 * uses; the door stays a lit held sheet (his pick).
 */

/** Where in her walk `icons` is drawn: every screen a guest meets, in six moments. */
const STAGE: Control = {
  id: "stage",
  label: "The door at",
  options: [
    { id: "arriving", label: "Arriving: welcome, chooser, name" },
    { id: "proving", label: "Proving: password, gate, code" },
    { id: "accounts", label: "Accounts: Log in, Create" },
    { id: "landing", label: "Landing: upload, keep, You're in" },
    { id: "inside", label: "Inside: her menu and its sheet" },
    { id: "edges", label: "Edges: the demo, a stall" },
  ],
  default: "arriving",
};

const DRAFT = defineExploration({
  id: "identity-door",
  title: "Asking for an email at the door",
  round: {
    n: 3,
    date: "2026-09-27",
    changed:
      "Five asks inside lit, his pick: the icons' language and the beats across every screen, and the words of the chooser, the name step and the code screen. Five screens are drawn for the first time; today is production, quoted.",
  },
  history: [
    {
      n: 2,
      date: "2026-09-25",
      changed:
        "One ask, on his note that the door does not feel alive: four looks, each walked through his settled flow on the stage knob, a 1440 frame over three 375 frames with the keyboard up. He picked lit.",
    },
    {
      n: 1,
      date: "2026-09-24",
      changed:
        "The refresh: a sixth question (`walk`) asked whether the welcome deserves its own screen at all; the gate's copy stopped leaning on being the ruled line.",
    },
  ],
  context:
    "Priya at Maya and Jay's wedding, off the code, the album blurred behind a lit sheet: his flow and his look are ground. Every screen she can meet is drawn, the password step, the upload step, the demo's welcome, a stalled opening and the keep screen among them. Each ask moves one thing; the others stay as production has them, or as he has already answered.",
  carried: [
    {
      id: "password-left",
      question: "Does the password step keep its centred head?",
      taken:
        "No: it reads from the left like every other step of the door, lit like them, its words untouched (voice-guest asks them).",
      overrule:
        "If a locked event should feel set apart, its centred block comes back.",
    },
    {
      id: "controls-stay",
      question: "Do the controls' glyphs change with the icons?",
      taken:
        "No: back, close, the password's eye, Google, the upload's two buttons and her menu's rows keep theirs; an action icon stays monochrome.",
      overrule:
        "If the controls should speak the new language too, the chevron and the rows follow the icons' answer.",
    },
    {
      id: "held-words",
      question: "Which words does no ask move?",
      taken:
        "His (the chooser's buttons, the name step's line, his menu card), the gate's ruled line, and voice-guest's four; each drawn as today.",
      overrule:
        "If one of them should move with this round, a note names it and it joins the next.",
    },
  ],
  asks: [
    {
      id: "icons",
      label: "The door's icons",
      question:
        "Now that the album lights the door, what should its icons be, from the welcome to her menu?",
      context:
        "The door's own icons: the welcome's rows (and the demo's), the lock beside Almost in, the email row's envelope. A control keeps its glyph in every option: back, close, the eye, Google, the upload's buttons, her menu's rows.",
      options: [
        {
          id: "today",
          label: "As shipped: small grey line icons",
          means:
            "Lucide glyphs in the muted grey at 12 to 18 px, each spot sizing its own: quiet, and the same as every other guest surface.",
        },
        {
          id: "lit",
          label: "Lit: in pools of the album's colour",
          means:
            "Each row leads with a round of the lamp's own sampled hue, and the small glyphs take the same light: the edge's colour carried into the words.",
        },
        {
          id: "bare",
          label: "None: the words carry the door",
          means:
            "The rows read as two lines of an invitation and Almost in stands alone; a glyph stays only where it is a control.",
        },
      ],
      recommended: "lit",
      today: "today",
      because:
        "Lit's light stops at the edge today, and grey glyphs under it read as a form. Pools finish the thought with the album's own colour (bible 6), cost no word and leave every control as it is.",
      overrule:
        "If colour beside the words reads as decoration at a party, none keeps the lit door calm and loses nothing a guest acts on.",
      lands:
        "What every decorative icon on a guest surface is: grey, lit by the album, or gone.",
      configs: [STAGE],
    },
    {
      id: "chooser",
      label: "The chooser",
      question: "How should the chooser offer its three ways in?",
      context:
        "His chooser, after the welcome on a name-only event: Continue as guest, Create account and Log in, his words in his order, at 1440, 375 and a 320 phone. Only what surrounds the buttons moves.",
      options: [
        {
          id: "today",
          label: "As shipped: a line above three buttons",
          means:
            "\"How do you want to join?\" and one sentence on what a name and an account each give, over three full-width buttons, the last two alike.",
        },
        {
          id: "told",
          label: "Each way in says what it gives",
          means:
            "The sentence goes; each button carries a small line from it (Just your name, and what an account keeps), so the choice explains itself.",
        },
        {
          id: "link",
          label: "Log in steps down to a link",
          means:
            "Two buttons under the question, then \"Already on Partyreel? Log in\": a member finds it where members look, and the loud choice is guest or account.",
        },
        {
          id: "bare",
          label: "The buttons alone, under the event",
          means:
            "No question and no sentence: the event's name heads the step and the three buttons say enough. The fewest words the door can ask.",
        },
      ],
      recommended: "told",
      today: "today",
      because:
        "It answers the question at the place she chooses: what each way costs sits on the button she presses, so an account's reason reaches the guest deciding, not a paragraph she skips.",
      overrule:
        "If three two-line buttons read heavier than a sentence, the link keeps his three ways and makes guest or account the only loud choice.",
      lands:
        "How the door presents a choice of paths, and whether an account's reason is read before or instead of the button.",
    },
    {
      id: "hint",
      label: "Under her name",
      question: "What should the line under her name say?",
      context:
        "The name step, Continue as guest's own screen: his heading and line, Priya typed with the keyboard up, the email row under it; the same line sits under Change name. Only that line moves.",
      options: [
        {
          id: "today",
          label: "As shipped: \"Nobody has to prove a name\"",
          means:
            "\"Just a name. Nobody has to prove a name.\" says nothing is being checked, since every other door she meets asks her to prove something.",
        },
        {
          id: "change",
          label: "\"You can change it anytime\"",
          means:
            "The reassurance that is also a fact: her menu's Change name edits it later, so a name typed in a hurry costs nothing.",
        },
        {
          id: "none",
          label: "Nothing: the email row sits under it",
          means:
            "The field and the email row alone; the heading's line already says why she is asked, so the step is one line shorter.",
        },
      ],
      recommended: "change",
      today: "today",
      because:
        "It lowers the stakes with a true thing she can use: the name she types in a dark room is not final. Today's line answers a worry the step never raised.",
      overrule:
        "If every word under the field slows the busiest step, nothing makes the email row the only thing under her name.",
      lands:
        "The name step's small print in all three of its modes: joining, a confirmed account with no name, and Change name.",
    },
    {
      id: "code",
      label: "The code screen",
      question: "Once the code is on its way, what should the screen say?",
      context:
        "After Email me a code: a verification event, Create account and Log in, the digits keyboard up, three of six typed. Today the step's own heading stays and a small centred block asks for the code beneath it.",
      options: [
        {
          id: "today",
          label: "As shipped: the code under the step's head",
          means:
            "The step's title and line stay, \"Enter your code\" small and centred under them; its last line still says \"to sign in\", where the door says Log in.",
        },
        {
          id: "mail",
          label: "\"Check your email\" heads it",
          means:
            "The code takes the heading like every step: Check your email, the address, six slots full width, then the link and the resend.",
        },
        {
          id: "inplace",
          label: "The code arrives under her email",
          means:
            "The head stays and the fields stay filled, her address with a Change beside it, six slots under it: she can see a typo before she waits for a code.",
        },
      ],
      recommended: "mail",
      today: "today",
      because:
        "The code is the moment she leaves for her inbox; one heading that says where to look is the whole screen's job, and it drops the \"sign in\" the rest of the door no longer says.",
      overrule:
        "If a mistyped address is the likelier failure, the code under her filled email lets her see it, at the cost of a taller screen.",
      lands:
        "Every code screen `EmailSignIn` draws: the gate, Create account, Log in, the confirm sheet, and the host's /login, which shares it.",
    },
    {
      id: "beat",
      label: "The beats",
      question: "How should the door answer her the moment she is in?",
      context:
        "The door's beats: a password opening the album, a code confirmed (the \"You're in\"), and her first photo sent at the head of the keep screen. Lit already blooms its light on each; only the mark beside the words moves.",
      options: [
        {
          id: "today",
          label: "As shipped: a green check",
          means:
            "The success green: a check in a disc over \"You're in\", the password's button turning green, and \"Sent\" with nothing beside it.",
        },
        {
          id: "lit",
          label: "The check, in the album's light",
          means:
            "The same beats with the green swapped for the lamp's three hues: the check blooms in the album's colour, the button fills with it.",
        },
        {
          id: "hers",
          label: "What just became hers",
          means:
            "\"You're in, Priya\" over her initial in her colour, and the photo she sent beside Sent, a small check on each; the password's beat has no name yet and stays.",
        },
      ],
      recommended: "hers",
      today: "today",
      because:
        "A beat is the one rare moment the door may delight (bible 5), and a check says only that something worked. Her name and her photo say what she now has here.",
      overrule:
        "If success must stay the one green the product uses, lit keeps the moment in the album's colour without a second green.",
      lands:
        "How the door marks success: the system green, the album's light, or the guest's own name and photo.",
    },
  ],
});

/**
 * ★ ONE KNOB PER ID. `defineExploration` already dedupes by id; this filter is
 * the one every board over this world carries (deduping twice is deduping
 * once), kept so the day the constructor's own filter moves, nothing here
 * draws a knob twice.
 */
export const IDENTITY_DOOR: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
