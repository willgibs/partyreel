import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * A HOST'S FIRST EVENT, ROUND ONE (2026-09-19): from "Create my first event"
 * to a code on a table at the venue.
 *
 * Will: "Let's treat the full app experience as well as guest pages as
 * unprotected. Anything and everything is open to relitigate or reconcept from
 * the ground up." (docs/design/rulings.md, 2026-09-19.) So this round asks what
 * the activation moment IS, from the door to the first photograph, and nothing
 * about what any of it looks like.
 *
 * ★ THE STAGING IS THE ARGUMENT, AND IT IS THREE BEATS, NOT ONE LADDER. MAKING
 * IT (what creating asks, where the code's style is chosen, what a Free host at
 * their one event meets), GETTING IT OUT (how the code reaches paper, where a
 * new host lands, what she holds out at the door), and WATCHING IT FILL (what
 * the page says before the first photograph, and what marks it when it comes).
 * The three openers depend on nothing and can be taken in any order; five
 * questions wait on them, because where a host lands is a different question
 * once you know whether the app prints anything, and what marks the first
 * photograph is a different question once you know what the page was showing
 * before it.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The event page's own shape, where sharing
 * lives and where settings live are `app-shape`'s, on the desk: this board
 * WEARS its recommendations (`event=album`, `share=front`, so the code is
 * already in the event's header) and never re-asks them. The plan's door is
 * `app-pricing`, building; the refusal's PLACE is asked here, the pricing
 * surface behind it is not. The QR presets' scanner-safety rules are law, not a
 * variable: every code on this board is dark modules on white stock, and no
 * option changes that.
 *
 * ★ AND THE ONE NUMBER EVERY CAPTION CARRIES IS THE MODULE. A code's module
 * edge in px is what decides whether it scans; the river's plate enforces a
 * floor of 3 px for a phone camera reading a screen and every plate in the
 * product is a fixed pixel number that meets it by luck. The frames measure it,
 * per option, per window.
 */

/**
 * THE WINDOW, one knob every decision shares, so one frame is on screen at a
 * time and each is a real viewport at 1:1. The hand decision ignores it and
 * draws at 375 whatever it says.
 */
const SIZE: Control = {
  id: "size",
  label: "Window",
  options: [
    { id: "laptop", label: "1440, a laptop" },
    { id: "phone", label: "375, a phone" },
  ],
  default: "laptop",
};

/** Which of the four presets is showing, so a style step is judged on one. */
const PRESET: Control = {
  id: "preset",
  label: "Preset",
  options: [
    { id: "classic", label: "Classic" },
    { id: "bold", label: "Bold" },
    { id: "rounded", label: "Rounded" },
    { id: "dots", label: "Dots" },
  ],
  default: "classic",
};

const DRAFT = defineExploration({
  id: "first-event",
  title: "A host's first event",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what creating asks for, where the code's style is chosen, what a Free host at their one event meets, how the code reaches a table, where a new host lands, what the page says before the first photograph, and what marks it when it comes.",
  },
  context:
    "Rosa finished the welcome ninety seconds ago and has never made an event. The wedding is in eleven days and the venue puts cards on nine tables. Between here and a hundred guests' photographs: a 576 px card with three steps, four code styles previewed against a link that 404s, two files, and a page reading No uploads yet until she reloads it. There is no table card, sign or poster anywhere in the product, though the marketing site draws all three.",
  bible: [4, 19, 21, 22],
  asks: [
    {
      id: "asks",
      label: "What creating asks",
      question: "What should creating an event ask for?",
      context:
        "Today: a 576 px card in the middle of the shell, three fields, one of them required, and two more steps before the event exists. The description and the date are both optional and both on screen.",
      options: [
        {
          id: "form",
          label: "Three fields, one required, as today",
          means:
            "A name, a note for guests and a date. Two are optional and both are shown, so three labels are read to give one answer.",
        },
        {
          id: "one",
          label: "One field: the name",
          means:
            "Name it and it exists. The date and the note are asked on the event, under the header that shows them.",
        },
        {
          id: "none",
          label: "No field: a name from the day",
          means:
            "The press is the creation. It opens named Saturday, 11 October, with the name under a cursor and the code already live.",
        },
      ],
      recommended: "one",
      because:
        "The name is the only thing a host arrives with. A date nobody has seen yet and a note for guests who are not invited yet are both about an event that already exists, and both are easier to write on the page that shows them.",
      overrule:
        "If a host sets the date once and never opens settings again, three fields is one pass rather than two.",
      lands:
        "The create route, and where an event's date and description are set.",
      configs: [SIZE],
    },
    {
      id: "style",
      label: "The code's style",
      question: "Where should the code's style be chosen?",
      context:
        "A whole wizard step, between the name and the event existing. The four swatches encode /e/ and 32 zeroes: the right density on purpose, and a link no event has. Scan one and you get a 404.",
      options: [
        {
          id: "step",
          label: "A step of the wizard, as today",
          means:
            "Four 96 px swatches of a code for an event that is not there yet, then the real one on the next screen.",
        },
        {
          id: "after",
          label: "On the real code, once it exists",
          means:
            "Creating is one press. The style is picked on the code guests will scan, changing under your hand, forever.",
        },
        {
          id: "later",
          label: "Out of the flow: Classic until asked",
          means:
            "The code stands on its own and a quiet line beside it offers the other three.",
        },
      ],
      recommended: "after",
      because:
        "A style chosen against a dead link is chosen blind, and it costs a whole step of a host's first minute. On the real code the choice is reversible and lives where the code lives.",
      overrule:
        "If choosing the look is part of the making, the step is where a host is already deciding things.",
      lands: "The create flow's length, and where the QR designer lives.",
      after: { ask: "asks" },
      configs: [SIZE, PRESET],
    },
    {
      id: "limit",
      label: "The Free host's second",
      question: "What should a Free host at their one event meet?",
      context:
        "Free holds one event and Rosa has Theo's 30th. Today she fills the card in, picks a style, presses Create: the row goes in, a toast refuses it, and the app bounces her to the dashboard. The style goes with the screen.",
      options: [
        {
          id: "after",
          label: "Created, then refused, as today",
          means:
            "A toast on the dashboard she was bounced to, and its only door leaves the app for the pricing page.",
        },
        {
          id: "door",
          label: "Refused before the form opens",
          means:
            "The route says Free holds one event, names the one she has, and offers both ways forward.",
        },
        {
          id: "inplace",
          label: "The form opens and says so, both exits in it",
          means:
            "She types where she came to type, and the choice, delete or upgrade, sits above the field.",
        },
      ],
      recommended: "inplace",
      because:
        "The app knows before she types a letter and today it waits until after. Saying it where she is costs one band, keeps her work, and never inserts a row it is about to refuse.",
      overrule:
        "If a limit should feel like a wall rather than a nudge, the closed door is the one that reads as one.",
      lands:
        "Every tier refusal in the app, and whether a refused create writes a row.",
      after: { ask: "asks" },
      configs: [SIZE],
    },
    {
      id: "venue",
      label: "Out of the screen",
      question: "How should the code get from the screen to the venue?",
      context:
        "Today: an SVG, a PNG and a link. There is no table card, sign or poster anywhere in the app, though /features/qr draws a card and a sign as if there were, and the ROADMAP calls the generator the share studio.",
      options: [
        {
          id: "files",
          label: "Two files and a link, as today",
          means:
            "SVG for print, PNG for screens. Whatever a guest reads off a table was made in somebody else's tool.",
        },
        {
          id: "sheet",
          label: "Stock the app prints: cards, a sign, a poster",
          means:
            "The code already set in paper, nine table cards to a sheet, one press to the printer or to a PDF.",
        },
        {
          id: "send",
          label: "Send it to yourself",
          means:
            "The phone's share sheet, or an email carrying the files and the sheet, because the printer is on the other machine.",
        },
      ],
      recommended: "sheet",
      because:
        "The host's real next act is putting paper on nine tables, and a PNG in a downloads folder is three more steps in an app we do not make. The marketing site already promises this and the product has never had it.",
      overrule:
        "If most hosts hold a phone out rather than print, the stock is paper nobody asked for and sending is what crosses machines.",
      lands:
        "The share studio, what /features/qr promises, and what Download means.",
      configs: [SIZE],
    },
    {
      id: "landing",
      label: "Where she lands",
      question: "Where should a host land the moment the event exists?",
      context:
        "Today: Go to your event, and the ongoing event page with an empty album under it. Drawn in app-shape's recommended shape, so the code is already in the event's own header and the album is the page.",
      options: [
        {
          id: "page",
          label: "Straight into the event",
          means:
            "One page to learn, the code in its header, and an album built for the other ninety-nine visits.",
        },
        {
          id: "beat",
          label: "A beat of its own, then the event",
          means:
            "One screen for the one job that is next, with an end, shown exactly once in an event's life.",
        },
        {
          id: "home",
          label: "The dashboard, the new event lit",
          means:
            "Back where she started with one more card, so a host setting up three in a row keeps going.",
        },
      ],
      recommended: "beat",
      because:
        "There is one thing to do between making an event and the party, it has a beginning and an end, and the ongoing page has no room to walk a first-time host through it.",
      overrule:
        "If the code in the header is enough of a next move, going straight in is one page rather than two.",
      lands:
        "What Create ends on, and whether the app has a one-time screen at all.",
      after: { ask: "venue" },
      configs: [SIZE],
    },
    {
      id: "hand",
      label: "In a hand",
      question: "What should a host hold out to a guest at the door?",
      tile: "phone",
      context:
        "A phone, a guest, a dark room. Today: open the event, press Share, and read a 200 px code out of a dialog with a title, a description, a download menu and a manage link around it.",
      options: [
        {
          id: "same",
          label: "The share dialog at 375, as today",
          means:
            "Two hundred pixels of code, and the rest of the screen spent on words the guest is not reading.",
        },
        {
          id: "show",
          label: "The code alone, full screen, full brightness",
          means:
            "White to the edges, the code as big as 375 carries, one line under it. Tap anywhere to go back.",
        },
        {
          id: "card",
          label: "The phone becomes the table card",
          means:
            "The same piece the sheet prints, on screen, so paper and phone say one thing. A smaller code for it.",
        },
      ],
      recommended: "show",
      because:
        "What decides whether a code reads across a room is the size of a module and the screen's brightness, and a dialog spends both on chrome. The host is standing there to say what it is.",
      overrule:
        "If the phone is propped against a glass with nobody beside it, only the card speaks for itself.",
      lands:
        "The host's share surface on a phone, and whether the app ever takes the whole screen.",
      after: { ask: "venue" },
    },
    {
      id: "empty",
      label: "The empty event",
      question: "What should an event's page say before any photograph?",
      context:
        "The cards are on the tables and nobody has scanned one. Today: No uploads yet, and Add photos with the button above, in a muted circle, for the hours or days this state lasts.",
      options: [
        {
          id: "none",
          label: "No uploads yet, as today",
          means:
            "An icon, two lines, and the whole ongoing page around them. It states a fact the host already knew.",
        },
        {
          id: "list",
          label: "A launch list of what is left",
          means:
            "Three things the app already knows, as three things she can finish. The album takes the room back.",
        },
        {
          id: "code",
          label: "The code, full size, in the album's room",
          means:
            "The space belongs to the album, and until there is one it belongs to the thing that makes one.",
        },
      ],
      recommended: "list",
      because:
        "This is the one screen where a host still has work and the app knows exactly what it is. The code alone is handsome and says nothing about what is missing; today's line states a fact she already knew.",
      overrule:
        "If the only unfinished job is showing the code, the code does that and needs no list.",
      lands:
        "The event page's zero state, and whether the app ever tells a host what to do next.",
      configs: [SIZE],
    },
    {
      id: "first",
      label: "The first photograph",
      question: "What should mark a guest's first photograph?",
      context:
        "Marta scanned the card at table four. The guest album has a doorbell that polls; the host's page has none, so the photograph is on the server and not on this screen until Rosa reloads it.",
      options: [
        {
          id: "reload",
          label: "Nothing until she reloads, as today",
          means:
            "The page is the same page. The only thing that changed is a row she cannot see.",
        },
        {
          id: "live",
          label: "It lands while she is looking",
          means:
            "The empty room gives way to the tile, the count moves, a Live pip. The guest's doorbell, pointed here.",
        },
        {
          id: "tell",
          label: "The app goes and finds her",
          means:
            "A push on a lock screen and an email, drawn as the sentences themselves. A new capability, not a look.",
        },
      ],
      recommended: "live",
      because:
        "The doorbell is built and pointing it at the host's page costs a poll. The first photograph arriving while a host watches is the promise made visible, and it asks nobody for permission.",
      overrule:
        "If a host is at the top table rather than at a screen, only a message reaches her, and that is a capability question.",
      lands:
        "Whether the host app is ever live, and whether Partyreel sends unrequested messages.",
      after: { ask: "empty" },
      configs: [SIZE],
    },
  ],
});

/**
 * ★ EVERY OTHER AXIS STARTS AT TODAY, NOT AT THE RECOMMENDATION (app-shape's
 * finding, 2026-09-19, and it is the one that saves a board from lying).
 * `defineExploration` defaults each control to its decision's recommendation,
 * which is right for the decision being asked and wrong for the seven around
 * it: an option that says "as today" has to BE today, so a limit refusal drawn
 * inside the one-field form while the form question is still open would show a
 * screen that does not exist. Every control here starts on today's answer, and
 * the step still opens on the recommendation for its own question (`step.tsx`
 * picks `step.recommended`, never the control's default). So until he answers
 * anything, every picture is today with exactly one thing changed; afterwards
 * it is HIS first event with one thing changed.
 */
const TODAY: Record<string, string> = {
  asks: "form",
  style: "step",
  limit: "after",
  venue: "files",
  landing: "page",
  hand: "same",
  empty: "none",
  first: "reload",
};

/**
 * ★ ONE WINDOW KNOB, NOT EIGHT. `defineExploration` flattens every decision's
 * `configs` into the board's controls, so a knob the decisions share arrives
 * once per decision and the dock would draw it eight times, with React warning
 * about the duplicate key. Each decision keeps it on its own strip (that is
 * what `configs` is for); the board declares it once. gallery-width found this
 * first and app-shape filed the same finding: the constructor could dedupe by
 * id itself.
 */
export const FIRST_EVENT: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls
    ?.filter((c, i, all) => all.findIndex((d) => d.id === c.id) === i)
    .map((c) => (TODAY[c.id] ? { ...c, default: TODAY[c.id] } : c)),
};
