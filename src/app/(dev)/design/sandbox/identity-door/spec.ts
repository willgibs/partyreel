import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DOOR'S LOOK, ROUND TWO (2026-09-25).
 *
 * Round one answered (docs/reviews/identity-door.json): the welcome keeps its
 * own screen (`walk=separate`), the email is a ghost tap (`field=ghost`), the
 * gate keeps its one line (`gate=line`), and her menu leads with a card
 * (`menu=card`, amended: her name over "Unverified" above "Save this event for
 * later"). Two answers were his own ideas instead: a chooser after the welcome
 * (`nudge`), and a typed email that can only change once confirmed (`remove`).
 * And the note under all of it: "I hate our welcome flow UI right now, doesn't
 * feel alive or engaging, which is critical to making users want to continue,
 * not just feel they have to for the sake of the host", with a blur and a soft
 * overlay behind the welcome, and the sheets "bland".
 *
 * ★ ONE ASK, `look`, DRAWN AS WHOLE WALKS THROUGH THE DOOR. Four directions,
 * each borrowing a pattern he already picked (named in its label) so "alive" is
 * graded against something he likes, each walked through his settled flow on
 * the `stage` knob: one 1440 frame above three 375 frames, every phone frame
 * with a field drawn with its keyboard up. Round one's six asks are gone from
 * `asks` on purpose (a round replaces its questions rather than accreting
 * them); the ledger keeps their answers.
 *
 * ★ GROUND, NEVER ASKED, THE SAME IN ALL FOUR: the welcome at today's words
 * (`voice-guest.welcome` owns them), his chooser, the name with the one-line
 * ghost tap, the verification door under `DOOR_WEAR.gate` verbatim, the code,
 * Log in and Create account, the "You're in" beat, her menu and the sheet to
 * change or remove a typed email, the consent line, the back chevron, the held
 * door with no close, and the album behind drawn from production components.
 * The keyboard rule (the sheet on the keyboard at the visible height minus
 * 12 px, its primary pinned at its foot) is the one production is adopting.
 *
 * The nearest open asks are `voice-guest.welcome` (the welcome's words) and
 * `guest-capture.shape` (the ask after her first upload); nothing here asks
 * either. `identity-claims.pointer`, `identity-profile.prompt` and
 * `guest-capture.tracker` were redrawn inside their own round one for this
 * flow, every option kept.
 */

/** Where in her walk each direction is drawn. */
const STAGE: Control = {
  id: "stage",
  label: "The door at",
  options: [
    { id: "arriving", label: "Arriving: welcome, chooser, name" },
    { id: "typing", label: "Typing: the email, the gate, the code" },
    { id: "accounts", label: "Accounts: Log in, Create, the beat" },
    { id: "inside", label: "Inside: her menu and its sheet" },
  ],
  default: "arriving",
};

/** The scrim behind the sheet: the direction's own, or today's to compare. */
const SCRIM: Control = {
  id: "scrim",
  label: "Behind the sheet",
  options: [
    { id: "own", label: "The direction's own scrim" },
    { id: "today", label: "Today's: 10% black, 4px blur" },
  ],
  default: "own",
};

/** Whether Maya wrote the event's description, which `host` quotes. */
const GREETING: Control = {
  id: "greeting",
  label: "Maya's description",
  options: [
    { id: "written", label: "She wrote one" },
    { id: "none", label: "She wrote none" },
  ],
  default: "written",
};

const DRAFT = defineExploration({
  id: "identity-door",
  title: "Asking for an email at the door",
  round: {
    n: 2,
    date: "2026-09-25",
    changed:
      "One ask, on his note that the door does not feel alive: four looks, each walked through his settled flow on the stage knob, a 1440 frame over three 375 frames with the keyboard up. Round one's answers are ground now, drawn as he amended them.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-24",
      changed:
        "The refresh: a sixth question (`walk`) asked whether the welcome deserves its own screen at all; the gate's copy stopped leaning on being the ruled line.",
    },
  ],
  context:
    "Priya is at Maya and Jay's wedding, off the code, the album blurred behind her. His flow is ground: the welcome alone, then his chooser and the name with its ghost tap, or on a verification event name and email under the gate's line, then the code; Log in, Create account, the \"You're in\" beat, and her menu with his card. Only the look is asked.",
  carried: [
    {
      id: "google-under-login",
      question: "Where do Google and the password link live now?",
      taken:
        "Under Log in only. The verification door asks a name and an email and sends a code, the same for new and returning guests.",
      overrule:
        "If a returning guest should see Google on the verification door too, it returns under that door's email field.",
    },
    {
      id: "hold-with-uploads",
      question: "When does the hold for an account she already had run?",
      taken:
        "Only when this device holds uploads a claim would move; with nothing to move there is nothing to protect, so no hold.",
      overrule:
        "If every create should say she signed into an account she had, the hold runs on every create.",
    },
    {
      id: "typed-email",
      question: "What can she do with an email she typed but never confirmed?",
      taken:
        "Change or remove it from her menu card. A confirmed one only changes, on the account page, confirmed at both addresses.",
      overrule:
        "If a typed address should only change too, the card's quiet link says Change it and remove goes.",
    },
    {
      id: "one-sheet",
      question: "Does the phone door stay on vaul?",
      taken:
        "No: the one responsive Sheet, keyboard-safe, sitting on the keyboard at the visible height minus 12 px.",
      overrule:
        "If vaul's drag and curve are worth keeping, the same keyboard rule is built into vaul instead.",
    },
    {
      id: "log-in",
      question: "Log in, or Sign in?",
      taken:
        "Log in on the chooser, and the menu's Sign in row becomes Log in too: one door, one word.",
      overrule: "If Sign in is the word, the chooser and the menu both say it.",
    },
    {
      id: "ghost-line",
      question: "What does the ghost tap say, now that it holds one line?",
      taken:
        'Add an email to come back anytime, at 14px with a trailing plus; on a phone narrower than about 360 (a 320) "anytime" steps aside, so it never wraps.',
      overrule:
        'If one string should hold everywhere, "Add an email to come back" is the one that fits a 320 phone.',
    },
    {
      id: "chooser-words",
      question: "What does the chooser say above his three buttons?",
      taken:
        "How would you like to join? Then Continue as guest, Create account and Log in, full width, in his order.",
      overrule:
        "If the buttons say enough alone, the heading goes and the event's name heads the step.",
    },
  ],
  asks: [
    {
      id: "look",
      label: "The door's look",
      question:
        "Which direction makes the door feel alive enough that Priya wants to keep going, from the welcome to her menu?",
      context:
        "Each is his flow, whole, on the stage knob: the same steps and words, only the look moving. Each borrows a pattern he picked, named in its label. The scrim knob sets each one's own against today's.",
      options: [
        {
          id: "lit",
          label: "Lit by the album, like the screen lamp",
          means:
            "The album's own colour lights the sheet's edge, the name runs large beside Maya's face, and the count ticks as photos land.",
        },
        {
          id: "peek",
          label: "Its newest photos peek out, like the sleeve",
          means:
            "Three of the album's newest stand in the sheet's edge like prints in the trips page's sleeve; her name lands on the front one, and the code brightens them.",
        },
        {
          id: "ticket",
          label: "A ticket, like the reel tile's card",
          means:
            "The welcome is the reel tile's living card; Continue tears it to a stub that rides every step, is stamped at You're in, and heads her menu card.",
        },
        {
          id: "host",
          label: "The host leads, like a profile's line",
          means:
            "Maya's face leads like a profile's identity line, and her own description greets Priya as a message; with none, the welcome's rows stand alone.",
        },
      ],
      recommended: "peek",
      because:
        "It sells the reward, his own test: the photographs she is about to join are in view at every step, and each step answers her (her name on a tile, the code brightening them). The others dress the sheet; this one shows what is behind it.",
      overrule:
        "If a fan reads as clutter over a party's weaker photos, the ticket carries the same album more quietly and becomes her menu's header.",
      lands:
        "How every held sheet a guest meets feels, and whether the door shows her the album or describes it.",
      configs: [STAGE, SCRIM, GREETING],
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
