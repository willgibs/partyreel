import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DOOR INTO THE HOST APP, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-19, "stack the lab"): login and signup
 * is one of the surfaces he named, and "absolutely everything is up for
 * relitigation or reconcepting from the ground up".
 *
 * So this round asks what the DOOR is and nothing about what a field looks
 * like. Seven decisions on the nine seams the Orchestrator's walk found
 * (docs/tracks/orchestrator.md, "The door into the host app"), every option
 * drawn on the shipped auth components over one host: Nadia, arriving for the
 * first time from "Start free", and back three weeks later. 1440 is the
 * default screen because /login is a page, and 375 is the knob because the
 * guest surfaces that create accounts are only ever met in a hand.
 *
 * ★ THE STAGING IS THE ARGUMENT. Four decisions are independent and can be
 * taken in any order: what the door asks for, how many doors there are, what
 * stands between a new account and the app, and how the door fails (the
 * generic refusal belongs to the password path under every lead, so it waits
 * on nothing). Three wait, because they are different questions once the first
 * is settled: what the page IS depends on what the form became, the collision
 * depends on which credential was offered, and the returning host is drawn on
 * the page he picked.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The guest gate's own shape and steps are
 * `guest-shape`'s `door` and `account` decisions, on the desk now: this board
 * DRAWS on them and never re-asks them. Supabase's providers and settings stay
 * as they are. And the security invariants are never a design variable: every
 * option authorises with `getUser()`, none writes a password before an OTP has
 * proven the address, and the generic sign-in error stays generic in all three
 * failure options, because making it specific is an account-enumeration leak
 * rather than a copy choice (auth-accounts.md). The behaviour pins
 * (`auth.test.ts`, `entry-steps.test.ts`, `welcome.test.ts`) guard function,
 * never look, and survive every shape below.
 *
 * ★ AND NOTHING HERE AUTHENTICATES. The doors are the real components; every
 * press is captured before it reaches its handler (shells.tsx, `Still`), so no
 * preview sends an email, calls Supabase or leaves the frame.
 */

/**
 * THE SCREEN, the knob every decision shares, so one real viewport is on the
 * stage at a time. 1440 by default: the subject is a page, and the host app it
 * opens is a laptop product as often as a phone one. 375 is one press away and
 * every option was captured at both.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Which of the account surfaces is on screen. Likes is Save's near copy. */
const PLACE: Control = {
  id: "place",
  label: "Which surface",
  options: [
    { id: "login", label: "The host's /login" },
    { id: "gate", label: "A guest at the door" },
    { id: "save", label: "Save, inside an album" },
  ],
  default: "login",
};

const DRAFT = defineExploration({
  id: "app-door",
  title: "The door into the host app",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what the door asks for first, how many account surfaces the product has, what stands between a new account and the app, what /login is as a page, what happens when a new account's email already has one, how the door fails, and what a returning host meets.",
  },
  context:
    "Four surfaces create accounts and no two agree. /login is a 384px card on empty paper, password first, with the code and Google under it; the guest gate asks with a code and a password and no Google; Save asks with a code and Google and no password; Likes is its near copy. Only two of the four carry the Terms line. Creating an account is a link inside the password form: one email, a code typed in page, then Pick a password, then a three-step tour that repeats the marketing site.",
  bible: [2, 4, 15, 21, 22],
  asks: [
    {
      id: "lead",
      label: "What the door asks for",
      question: "What should the door ask a new host for first?",
      context:
        "Today /login leads with email and password; the code is a link under it, Create account is another, and Google sits below a divider. The other three account surfaces all lead with the code. Drawn on the shipped card.",
      options: [
        {
          id: "password",
          label: "Email and password, as today",
          means:
            "Two fields lead. The code, account creation and Google are three smaller doors arranged underneath them.",
        },
        {
          id: "code",
          label: "One email, and the code",
          means:
            "One field. The same address signs in or creates the account, Google sits beside it, and a password drops to a quiet link.",
        },
        {
          id: "google",
          label: "Google first, the email under it",
          means:
            "One press carries most arrivals; the email door is a second button under it, and the password is the quiet link at the foot.",
        },
      ],
      recommended: "code",
      because:
        "The other three surfaces already lead with the code, it is the one method that signs in and creates in the same step, and it asks a host to remember nothing. A password on a page opened twice a year is a thing to forget.",
      overrule:
        "If hosts sign in from a laptop where a password manager fills both fields, the password lead is the fastest door they have.",
      lands:
        "What every account surface leads with, and whether a password is asked for anywhere before the account page.",
      configs: [SCREEN],
    },
    {
      id: "surfaces",
      label: "How many doors",
      question: "How many account surfaces should the product have?",
      context:
        "Four ask for an account today: /login, the guest gate, Save inside an album, and the near copy behind Likes. Four feature sets, three tones, and only two of them carry the Terms line. The knob picks which one is on screen.",
      options: [
        {
          id: "four",
          label: "Four surfaces, as today",
          means:
            "Each place keeps its own form, its own methods and its own voice. Two of the four still create accounts with no Terms line.",
        },
        {
          id: "one",
          label: "One object, worn four ways",
          means:
            "One component with the methods as props and one consent line; each place passes the reason it is asking, and nothing else moves.",
        },
        {
          id: "door",
          label: "One door, reached from everywhere",
          means:
            "Anything that needs an account opens the same full door, with the reason above the form and the way back under it.",
        },
      ],
      recommended: "one",
      because:
        "The four differ only in why they ask, and everything under that is one job done four times; the two that forgot the Terms line are what that costs. One object keeps each place's reason and gives the product one door to improve.",
      overrule:
        "If a guest surface must never read as the host app, four separate surfaces are the wall that keeps it.",
      lands:
        "Every place the product asks for an account, and where the Terms line appears.",
      configs: [SCREEN, PLACE],
    },
    {
      id: "welcome",
      label: "The first screen",
      question: "What should stand between a new account and the app?",
      context:
        "A host with no display name lands on /welcome: a required name step, then a three-step tour that repeats the marketing site's own words, skippable, ending on Create my first event. Each option draws its whole flow.",
      options: [
        {
          id: "tour",
          label: "The name, then the three-step tour",
          means:
            "As today. Four screens, three of them the how-it-works copy the marketing site already said once.",
        },
        {
          id: "name",
          label: "The name, and straight in",
          means:
            "One screen. How it works moves under the dashboard's own empty state, where a host with no events is looking anyway.",
        },
        {
          id: "first",
          label: "The name, then their first event",
          means:
            "Three screens ending on a live QR they can scan from their own screen, so the first minute is the product working.",
        },
      ],
      recommended: "first",
      because:
        "Nothing here is real until a host has an event with a code on it, and the tour's three screens are the marketing site read twice. Ending on a scannable code makes the first minute the product rather than a description of it.",
      overrule:
        "If an event made before a host understands the product is an empty event nobody scans, the name alone is the honest minimum.",
      lands:
        "What /welcome is, and whether the how-it-works copy lives inside the app at all.",
      configs: [SCREEN],
    },
    {
      id: "page",
      label: "The page",
      question: "What should the /login page be?",
      context:
        "A 384px card in the middle of an empty page: the wordmark, a title, one line, the form, the Terms line. No header, no footer, nothing of the product on screen. Drawn wearing the lead you picked.",
      options: [
        {
          id: "card",
          label: "The card on empty paper, as today",
          means:
            "A 384px column, centred, the wordmark above it. Two thirds of a laptop is background.",
        },
        {
          id: "beside",
          label: "The door, with the product beside it",
          means:
            "Real photographs take the right half of a laptop and the door keeps the left; in a hand they become a band above it.",
        },
        {
          id: "sheet",
          label: "The door in the guest gate's language",
          means:
            "The album is the page and the door stands over it: a sheet at the foot of a phone, centred from 640 up.",
        },
      ],
      recommended: "beside",
      because:
        "This is the one screen where a host decides whether the product is worth an account, and today it argues with a sentence over empty paper. The photographs are the argument, and they cost one column.",
      overrule:
        "If a sign-in page should be a sign-in page and nothing more, the bare card is the fastest thing on the site to read.",
      lands:
        "The /login page at every width, and what a signed-out host sees of the product before signing in.",
      after: { ask: "lead" },
      configs: [SCREEN],
    },
    {
      id: "existing",
      label: "An email that already has one",
      question: "What should happen when a new account's email already has one?",
      context:
        "Typing an address that already has an account into Create account sends a code and silently signs that account in. Nothing says so, and a host who meant to make a second one is suddenly inside their first.",
      options: [
        {
          id: "silent",
          label: "Open the account, say nothing",
          means:
            "As today. The app opens and no line on the screen explains whose events these are.",
        },
        {
          id: "tell",
          label: "Open it, and name it",
          means:
            "The same single step, with one line naming the address and saying we signed you into the account it already had.",
        },
        {
          id: "ask",
          label: "Ask which they meant",
          means:
            "After the code proves the address, a step names the account and offers to open it or use a different email.",
        },
      ],
      recommended: "tell",
      because:
        "The code proves the address either way, so the outcome is already right and the only missing thing is the sentence. Asking spends a screen reaching the same place, and refusing before the code would have to tell a stranger the address exists.",
      overrule:
        "If a host must never land in an account they did not ask to open, the extra step is the only option that asks.",
      lands:
        "Every account-creating surface, and what the product says about an address it already knows.",
      after: { ask: "lead" },
      configs: [SCREEN],
    },
    {
      id: "failure",
      label: "How the door fails",
      question: "How should the door fail?",
      context:
        "One line answers a wrong password, a Google-only account and an unknown email alike: telling them apart would let anyone test whether an address has an account here. Drawn on the password door, which every lead keeps somewhere.",
      options: [
        {
          id: "one",
          label: "One line, as today",
          means:
            "A red banner above the form, naming all three ways out in prose: a code, Google, or reset the password.",
        },
        {
          id: "paths",
          label: "The line, and the ways out as buttons",
          means:
            "The same sentence, shorter, with the three recoveries as real controls under it instead of prose pointing elsewhere.",
        },
        {
          id: "step",
          label: "The failure is its own screen",
          means:
            "The form is replaced by a step that says what cannot be said, and offers the three ways in, one under the other.",
        },
      ],
      recommended: "paths",
      because:
        "The sentence has to stay vague, so the work it cannot do falls to what sits under it, and today that is prose describing three affordances a host then has to go and find. Buttons are the same sentence with the hunting removed.",
      overrule:
        "If a failed sign-in should stay quiet and leave the form where it was, today's line is the least alarming thing on the page.",
      lands:
        "Every failed sign-in, the expired link included, and how the generic message is allowed to recover.",
      configs: [SCREEN],
    },
    {
      id: "return",
      label: "The returning host",
      question: "What should a host the browser already knows meet?",
      context:
        "A host who has signed in before meets exactly what a stranger meets: the same card, the same title, the same line about collecting photos. Drawn on the page you picked, wearing the lead you picked.",
      options: [
        {
          id: "same",
          label: "The same door for everyone, as today",
          means:
            "One screen, and nothing on it knows a host has ever been here before.",
        },
        {
          id: "back",
          label: "Welcome back, and one field",
          means:
            "The name and the address this device last used, the event it last opened, and one thing left to fill.",
        },
        {
          id: "tap",
          label: "One press, where the device remembers",
          means:
            "A passkey saved on this device, or the Google account already chosen, signs them in on one press. Neither exists yet.",
        },
      ],
      recommended: "back",
      because:
        "A returning host is most of the traffic this page will ever get, and all it has to do is prove this is their Partyreel and take one field. The remembered event does that in a picture rather than a sentence.",
      overrule:
        "If a name and an event on a shared laptop is more than a signed-out page should say out loud, one door for everyone is the safe one.",
      lands:
        "What /login shows a host it recognises, and whether the product remembers anyone at this door.",
      after: { ask: "page" },
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob seven decisions share arrives seven times: the dock
 * would draw it seven times and React would warn on the duplicate key. Each
 * decision keeps it on its own strip (that is what `configs` is for); the
 * board declares it once. The same finding `gallery-width` and `guest-shape`
 * both left for the constructor, which could dedupe by id itself.
 */
export const APP_DOOR: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
