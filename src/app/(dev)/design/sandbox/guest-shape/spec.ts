import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE GUEST EXPERIENCE'S SHAPE, FROM THE SCAN, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, 2026-09-19): "Let's treat the full app
 * experience as well as guest pages as unprotected. Anything and everything is
 * open to relitigate or reconcept from the ground up... The existing version is
 * closer to a Frankenstein's monster as we were trying to integrate new
 * feature ideas 1 by 1, rather than having a complete idea of the full app from
 * the beginning."
 *
 * So this round asks the SHAPE and nothing else, on the eleven seams the
 * Orchestrator's walk found (docs/tracks/orchestrator.md, "The app round's
 * map"). Seven decisions, every option drawn on the real guest components over
 * one wedding, PHONE FIRST: 375 by 812 is the default screen on every step,
 * because a guest is at a party holding a phone, and 1440 by 900 is the knob,
 * because a host and half the people a link is forwarded to are not.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The tile's own grammar and the gallery's
 * controls are `app-vocabulary`'s round, so no option here touches what a tile
 * carries. How wide an album runs was answered on 2026-09-18 (`gallery-width`:
 * 240px tiles to the window, the words on the gallery's left line) and is drawn
 * here as settled law rather than re-asked: the album's own `GALLERY_COLUMNS` and
 * the page's COLUMN and BLEED constants are the shipped ones, and a frame is a
 * real viewport, so they resolve at the screen being judged. The anti-abuse core is not a design
 * variable and no option moves it: the capability token, the presigned URLs,
 * the limiters and the signed unlock cookie are out of frame. And the behaviour
 * pins (`entry-modal.test.tsx`, `guest-upload.test.tsx`,
 * `password-gate.test.tsx`) guard function, never look: the step order, the
 * dismiss rules, the queue's one-at-a-time and retry, the five strikes and the
 * cooldown survive every shape below.
 *
 * ★ THE STAGING. "Nothing here yet" waits on the door, because one of the
 * door's answers swallows the locked backdrop whole. The live signal waits on
 * the chrome, because where a signal can sit depends on what the header became.
 * The account voices wait on the dialogs, because one of the two moments IS a
 * dialog. Everything else is independent and can be taken in any order.
 */

/**
 * THE SCREEN, the knob every decision shares, so one real viewport is on the
 * stage at a time. 375 by default and everywhere: this is the phone-first
 * round, and a laptop answer that contradicts the phone is a finding.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** Which of the four states the scanned code resolves to. */
const EVENT: Control = {
  id: "event",
  label: "The event",
  options: [
    { id: "password", label: "Behind a password" },
    { id: "account", label: "Account required" },
    { id: "open", label: "Open to everyone" },
  ],
  default: "password",
};

/** Which screen with no photographs on it is being drawn. */
const SIDE: Control = {
  id: "side",
  label: "Which screen",
  options: [
    { id: "locked", label: "Locked, before the password" },
    { id: "empty", label: "Open, nothing added yet" },
  ],
  default: "locked",
};

/** Which of the four guest surfaces is open. */
const WHICH: Control = {
  id: "which",
  label: "Which surface",
  options: [
    { id: "invite", label: "Invite, the tallest" },
    { id: "report", label: "Report, the shortest" },
  ],
  default: "invite",
};

/** Which of the two account moments is on screen. */
const MOMENT: Control = {
  id: "moment",
  label: "Which moment",
  options: [
    { id: "gate", label: "The gate, on the way in" },
    { id: "save", label: "Save, in the album" },
  ],
  default: "gate",
};

const DRAFT = defineExploration({
  id: "guest-shape",
  title: "The guest experience",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: the door, what an album with nothing in it says, the chrome over a wide album, whether the album admits it is filling, the other four guest surfaces, what a guest can do about their own photograph, and how many voices ask for an account. Phone first, on the real components.",
  },
  context:
    "One landing resolves access on the server and wraps whatever it earns in a sheet. Round one draws every option over one wedding in the four states a scanned code can reach: open with 34 photographs, the same behind a password, the same needing an account, and the same with nothing in it yet. The album already runs to the window at a 240px tile with the words on their own left-pinned column (ruled 2026-09-18, wired 2026-09-19), so every option is drawn on the shipped page.",
  bible: [1, 4, 15, 21],
  asks: [
    {
      id: "door",
      label: "The door",
      question: "What should a guest meet in the first seconds after a scan?",
      context:
        "Today the page settles, then a sheet rises: a welcome screen, and the gate behind it. The sheet is a drawer on a phone, a centred dialog from 640 up. Drawn on the password event, the arrival most guests meet; the knob carries the rest.",
      options: [
        {
          id: "today",
          label: "The welcome, then the gate",
          means:
            "Two screens on a gated event, and the shell changes type at 640: a drawer below it, a centred float above.",
        },
        {
          id: "one",
          label: "One screen, whatever the event",
          means:
            "The gate carries the invitation's two promises, so no event is two screens deep; an open event's sheet sits at its own height with the album behind it.",
        },
        {
          id: "page",
          label: "The door is the page",
          means:
            "No sheet at any width. The arrival is the whole screen and the album begins underneath it, so nothing floats over nothing.",
        },
      ],
      recommended: "one",
      because:
        "A gated guest answers two screens to reach one album and the second repeats the first's name and count. Collapsed, the door is one screen for every event, and the drama stays where the lock is instead of in front of an open one.",
      overrule:
        "If the invitation deserves its own screen, a host's name before anything is asked, today's two steps keep it.",
      lands:
        "The arrival every scanned code opens on, at every width, and how many screens stand between a scan and the album.",
      tile: "phone",
      configs: [SCREEN, EVENT],
    },
    {
      id: "nothing",
      label: "Nothing here yet",
      question: "How should an album with no photographs in it speak?",
      context:
        "One idea is drawn twice today in two unrelated languages: a locked page gets nine empty squares, an empty album gets the river pouring down. The knob flips between the two screens; whatever wins has to hold on both.",
      options: [
        {
          id: "two",
          label: "Two pictures, made a family",
          means:
            "The locked page keeps a shape-only backdrop and the empty album keeps the river, redrawn to the same rhythm and weight.",
        },
        {
          id: "river",
          label: "One picture: the river, on both",
          means:
            "The river carries both screens at one depth. Its nine frames are local stand-ins, never the event's own, so a locked page leaks exactly what it leaks today.",
        },
        {
          id: "words",
          label: "No picture at all",
          means:
            "A locked page is the door and nothing else; an empty album is a line and a button on the page's own paper.",
        },
      ],
      recommended: "river",
      because:
        "The river is already the ruled picture for an empty album, and a locked page is saying the same thing: photographs are coming. Two unrelated languages for one idea is the seam, not the feature.",
      overrule:
        "If a locked page should look locked rather than full, the shape-only backdrop is the more honest wall.",
      lands:
        "Every guest screen with no photographs on it: the locked page, the empty album, and any later one.",
      after: { ask: "door" },
      tile: "phone",
      configs: [SCREEN, SIDE],
    },
    {
      id: "chrome",
      label: "The album's chrome",
      question: "What should sit above an album that runs to the window?",
      context:
        "The words keep a readable column and the photographs now run to the edge, which leaves the buttons stranded: a full-width Add is right at 375 and absurd across 1400. Every option is the same event, 34 photographs, at the screen on the knob.",
      options: [
        {
          id: "column",
          label: "The column, as today",
          means:
            "Name, byline, count, then a full-width Add over Save and Invite, all on the album's left line, and a floating pill once they scroll away.",
        },
        {
          id: "bar",
          label: "One line over the album",
          means:
            "At a laptop the event sits left and the three actions at the album's right edge; at a phone they are three equal buttons on one line.",
        },
        {
          id: "dock",
          label: "The event above, the actions docked",
          means:
            "The header is the event alone; Add, Save and Invite live in one bar at the foot of the screen, at every scroll position and every width.",
        },
      ],
      recommended: "dock",
      because:
        "Adding a photograph is why the page is open, and two objects carry it today: a header button, and a floating pill that replaces it once it scrolls off. One dock is one object, always in a thumb's reach, and it hands the top of the page back to the event.",
      overrule:
        "If a permanent bar reads as an app where the page should read as a host's invitation, the column keeps it.",
      lands:
        "The top of every guest album, and whether the floating Add pill survives.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "live",
      label: "The album filling",
      question: "Should a guest see the album filling while they are in it?",
      context:
        "Photographs already arrive in under a second (the doorbell), and nothing on the page says so: the live signal only chooses how often the page asks. Drawn on the chrome you picked, at the moment somebody else's phone reaches the album.",
      options: [
        {
          id: "none",
          label: "No, as today",
          means:
            "A photograph is simply there on the next look. The album is live and never says it.",
        },
        {
          id: "line",
          label: "A line that counts",
          means:
            "The count line gains a quiet dot and how recently the last one landed, and the number ticks as they arrive.",
        },
        {
          id: "land",
          label: "The photograph announces itself",
          means:
            "The new tile grows into its column under a glow that fades, the album re-flows around it, and nothing else moves.",
        },
      ],
      recommended: "land",
      because:
        "The proof that everyone's phone reaches this album is a photograph appearing in front of you, and that is also the argument for adding yours. A counter states it; an arrival shows it, and costs one animation.",
      overrule:
        "If a moving album is a distraction while a guest is reading it, the quiet line says the same thing once.",
      lands:
        "What the doorbell is allowed to show, and the album's motion when a photograph arrives.",
      after: { ask: "chrome" },
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "dialogs",
      label: "The other surfaces",
      question: "Invite, Save, Report and Download all: one object, or four?",
      context:
        "The door is a phone-native sheet; the other four are the host app's centred dialogs, floating mid-phone. Drawn on Invite, the tallest of the four; the knob carries Report, the shortest. Whatever holds both holds the other two.",
      options: [
        {
          id: "today",
          label: "Four centred dialogs",
          means:
            "As shipped: a small float in the middle of the screen, at every width, with a corner close.",
        },
        {
          id: "sheet",
          label: "One sheet for all of them",
          means:
            "Every guest surface is the door's sheet: it rises from the foot on a phone with a real handle, and centres from 640 up.",
        },
        {
          id: "inline",
          label: "No overlay at all",
          means:
            "Each opens in the page, under the button that asked for it. Nothing dims, nothing traps focus, and the album stays where it was.",
        },
      ],
      recommended: "sheet",
      because:
        "The sheet is already proven on the one surface every guest meets, and the other four were inherited from a page built for a laptop. One object is one set of dismiss rules, one entrance and one answer to the iOS keyboard.",
      overrule:
        "If a three-line Report reads better as a small float than a full-width sheet, the dialog is less furniture for the same words.",
      lands:
        "Invite, Save, Report and Download all, and whatever the guest surface adds next.",
      tile: "phone",
      configs: [SCREEN, WHICH],
    },
    {
      id: "yours",
      label: "A guest's own photograph",
      question: "What can a guest do about the photograph they just added?",
      context:
        "Nothing, today, and nothing says so: the viewer has a Remove, the guest surface never passes it, and a guest who sends the wrong shot has only the host to ask. The host's own moderation is unchanged under every option.",
      options: [
        {
          id: "never",
          label: "Nothing, and say so at the act",
          means:
            "One line under the Add button makes the album's terms plain, so nobody hunts for a control that was never there.",
        },
        {
          id: "window",
          label: "Take it back, for a few minutes",
          means:
            "Their own photograph gains a Remove in the viewer while the window lasts, and the caption says how long is left.",
        },
        {
          id: "mine",
          label: "A 'yours' strip in the album",
          means:
            "Everything this device added, in one place at the top of the album, each removable until the host closes uploads.",
        },
      ],
      recommended: "window",
      because:
        "The shot a guest wants back is the one they just sent, and they know within a minute. A short window covers the whole of that regret and never hands a stranger a delete button on a host's album hours later.",
      overrule:
        "If a host's album must be the host's alone, saying so at the upload moment is honest and costs nothing to build.",
      lands:
        "Whether the guest surface ever passes the viewer's Remove, and what the upload moment promises.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "account",
      label: "Asking for an account",
      question: "How many voices should ask a guest for an account?",
      context:
        "Two places ask for one account with one first field: the gate on the way in, and Save inside the album. One is an invitation with the real count as its promise; the other a sign-up form with a switch, a rule and Google. The knob flips them.",
      options: [
        {
          id: "two",
          label: "Two, as today",
          means:
            "The gate stays an invitation and Save stays a form. A guest who meets both meets two products in one visit.",
        },
        {
          id: "one",
          label: "One voice, one surface",
          means:
            "Both wear the gate's framing and the same first field; only the reason line changes, so the second time is already familiar.",
        },
        {
          id: "after",
          label: "One voice, and Save moves",
          means:
            "The account is asked once, at the door. Keeping the album becomes a one-tap offer after a guest's first photograph lands, not a second form.",
        },
      ],
      recommended: "one",
      because:
        "The two moments ask for one thing and a guest can meet both in a minute. One framing and one field is one thing to learn, and the reason is the only part that was ever different.",
      overrule:
        "If Save is a growth lever that earns its own pitch (the dashboard, Google, the newsletter), keeping its form keeps the pitch.",
      lands:
        "Every place the guest surface asks for an account, and which one the profile page inherits.",
      after: { ask: "dialogs" },
      tile: "phone",
      configs: [SCREEN, MOMENT],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob seven decisions share arrives seven times: the dock
 * would draw it seven times and React would warn on the duplicate key. Each
 * decision keeps it on its own strip (that is what `configs` is for); the
 * board declares it once. The same finding `gallery-width` left for the
 * constructor, which could dedupe by id itself.
 */
export const GUEST_SHAPE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
