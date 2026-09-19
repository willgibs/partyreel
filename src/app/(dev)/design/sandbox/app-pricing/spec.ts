import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * PRICING INSIDE THE APP, ROUND ONE (2026-09-19).
 *
 * Will: "an in-app pricing modal so we don't take users out of the app to the
 * marketing site by default every pricing click, would prefer to keep them
 * within the app. The marketing site can be a more comprehensive 'Learn More'
 * second-layer resource that's a click away from the more minimal in-app
 * pricing if needed." (docs/design/rulings.md.)
 *
 * "Modal" is his word for the ASK, not for the answer, so the first decision
 * asks the object and every other decision is drawn inside whatever he picks.
 *
 * ★ THE STAGING IS THE ARGUMENT. What the surface opens on waits on what the
 * surface IS; how much it carries waits on what it opens on; where the second
 * layer sits waits on how much is already here; the words at a locked control
 * wait on whether the surface explains the lock; and what Checkout returns to
 * waits on there being something to return to. The pass, the doors and the
 * wording of a gate depend on none of the others and can be taken in any order.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The prices, the caps and the plans
 * themselves are locked (docs/PRICING.md, 2026-05-29); Checkout, the portal and
 * the webhook are not design variables and no option on this board touches one;
 * the marketing page's own design was ruled in the revamp and is worn here as
 * the second layer. Whether /account grows a plan card is `app-shape`'s You
 * question, still open, and the doors decision names it rather than re-asking.
 */

/** The window, one knob every decision shares: a real viewport at 1:1. */
const SIZE: Control = {
  id: "size",
  label: "Window",
  options: [
    { id: "laptop", label: "1440, a laptop" },
    { id: "phone", label: "375, a phone" },
  ],
  default: "laptop",
};

/**
 * WHO CLICKED, AND WHY. The second shared knob, and the one that makes this
 * board answerable: a pricing surface is judged by the worst moment it has to
 * hold, and the four here are the four the product actually produces.
 */
const FROM: Control = {
  id: "from",
  label: "Who clicked",
  options: [
    { id: "feature", label: "Free, at a locked password" },
    { id: "cap", label: "Free, out of room" },
    { id: "pro", label: "Already on Pro" },
    { id: "pass", label: "Holding an Event Pass" },
  ],
  default: "feature",
};

const BOTH = [SIZE, FROM];

const DRAFT = defineExploration({
  id: "app-pricing",
  title: "Pricing in the app",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what a pricing click opens, what it opens on, how much it carries, how the marketing page stays one click away, how much of the Event Pass belongs inside, where the app opens it from, how a locked control asks, and what Checkout comes back to.",
  },
  context:
    "Eleven pricing clicks in the host app today, and every one of them leaves it for /pricing: four locked-feature links worded four ways, three refusal toasts, two dashboard banners and the storage meter's popover. /pricing is static, so it cannot tell a signed-in Pro that she already subscribes, cannot know which feature was refused, and cannot know how many bytes short a host is. Billing has no home in the app at all: not in the user menu, not on the account page. Every option here is drawn on the shipped chrome with four real hosts, and every number comes from tiers.ts.",
  bible: [2, 15, 21, 22],
  asks: [
    {
      id: "object",
      label: "The object",
      question: "What should a pricing click open?",
      tile: "phone",
      context:
        "Nothing in the app sells anything today: a click leaves for the marketing site. Drawn at 375, which is where the three separate and where a host buys: at a laptop the sheet IS the dialog, and saying so is the middle option's whole claim.",
      options: [
        {
          id: "dialog",
          label: "A centred dialog, the same at both sizes",
          means:
            "One surface over the app, 560 px on a laptop and inset on a phone. One shell to build, and at 375 the buy button sits wherever the content ends.",
        },
        {
          id: "sheet",
          label: "A sheet in a hand, a dialog at a laptop",
          means:
            "The same body in the shape each size wants: it rises off the bottom edge within a thumb's reach, and centres on a laptop. Two shells, one body.",
        },
        {
          id: "panel",
          label: "The door's own surface opens in place",
          means:
            "No overlay at all. The storage popover grows, the locked settings card unfolds under itself, and the page a host was reading stays where it was.",
        },
      ],
      recommended: "sheet",
      because:
        "A host does this at the party, on a phone, one-handed. The centred dialog puts the decision where a thumb is not, and the panel pushes the page around under the reader at the exact moment they are being asked for money.",
      overrule:
        "If one shell matters more than reach, the dialog is one thing to build and one thing to learn.",
      lands:
        "What every pricing click in the app opens, on all seven routes, and on the guest surfaces later.",
      configs: [FROM],
    },
    {
      id: "first",
      label: "The first view",
      question: "What should it open on?",
      context:
        "The trigger knows three things /pricing never can: who is clicking, what they already pay for, and what just refused them. Read each option against all four hosts with the knob.",
      options: [
        {
          id: "plans",
          label: "The plans, the same every time",
          means:
            "What /pricing opens on, in a smaller box: Free beside Pro, monthly. The host works out for themselves which line was the one that stopped them.",
        },
        {
          id: "trigger",
          label: "The reason they clicked, then the plans",
          means:
            "A locked feature names the feature; running out of room opens on the smallest plan that clears it; a Pro host is told she subscribes already.",
        },
        {
          id: "yours",
          label: "Your plan today, and what changes",
          means:
            "It opens on what the host holds and what each step up adds, whatever brought them. The catalogue is the screen after that.",
        },
      ],
      recommended: "trigger",
      because:
        "Knowing the trigger is the only thing keeping this in the app buys us, and it is exactly what the static page cannot do: a host asked one question and this is the option that answers that one.",
      overrule:
        "If one predictable surface is worth more than a fitted answer, the plans are one thing to build and one thing to read.",
      lands:
        "What opens under every door in the app, and whether the surface is told who and why.",
      after: { ask: "object" },
      configs: BOTH,
    },
    {
      id: "carry",
      label: "How much it carries",
      question: "How much should the surface hold?",
      context:
        "/pricing carries the plan pair with a size selector and a cadence toggle, the pass card, the unlock grid, a calculator, a five-group table, a shared band and an FAQ. The cost of carrying more is height, and the caption measures it.",
      options: [
        {
          id: "cards",
          label: "The plans and a price, nothing else",
          means:
            "Free beside one Pro size, at one cadence, with a button each. Every question about the choice is answered on the marketing page.",
        },
        {
          id: "fitted",
          label: "The plans, the toggles, the relevant lines",
          means:
            "The three storage sizes, monthly or yearly, and the two or three rows the reason for clicking made relevant. Nothing general.",
        },
        {
          id: "parity",
          label: "Everything the marketing page says",
          means:
            "The grid, the calculator, the table and the FAQ inside the surface. Drawn honestly, so the height it reaches is the whole of the argument against it.",
        },
      ],
      recommended: "fitted",
      because:
        "The storage size IS the choice, so the selector has to be here, and the cadence is the second-biggest lever and hides in the portal today. Everything past those two is the second layer's job.",
      overrule:
        "If a host should never commit to money inside an overlay, the plain cards make the marketing page the place where deciding happens.",
      lands:
        "The surface's height at a phone, and what the marketing page keeps for itself.",
      after: { ask: "first" },
      configs: BOTH,
    },
    {
      id: "learn",
      label: "The second layer",
      question: "How should the marketing page stay one click away?",
      context:
        "Will's ask puts /pricing second: comprehensive, a click away, not the default destination. Today it is the only destination. Each option is drawn at the foot of the surface you picked.",
      options: [
        {
          id: "foot",
          label: "A quiet line under the buttons",
          means:
            "See every plan, opening partyreel.com in a new tab so the host keeps their place. The door exists and does not compete with buying.",
        },
        {
          id: "door",
          label: "A second button that leaves on purpose",
          means:
            "Continue beside Compare all plans, equal weight. The surface says outright there is more, and half the clicks leave the app after all.",
        },
        {
          id: "inside",
          label: "The comparison opens inside the surface",
          means:
            "A second screen of the same object holds the table and the FAQ. Nothing leaves the app, and the marketing page stops being the answer to anything.",
        },
      ],
      recommended: "foot",
      because:
        "Leaving by default is the thing he asked us to stop doing, and a quiet line serves the host who wants the full picture without making leaving look like the next step.",
      overrule:
        "If most hosts need the table before they can choose at all, only the second screen gives it to them without sending them away.",
      lands:
        "Where /pricing sits in the app's flow, and whether an in-app link ever opens in this tab.",
      after: { ask: "carry" },
      configs: BOTH,
    },
    {
      id: "pass",
      label: "The Event Pass",
      question: "How much of the Event Pass belongs in the surface?",
      context:
        "The pass is a one-time purchase covering one event for about a year, it stacks, it renews cheaper, and going Pro converts what is left of it to credit. In the app today it appears only as a Renew button for someone who already has one.",
      options: [
        {
          id: "full",
          label: "Its own card, everything the page says",
          means:
            "Price, room, what it unlocks, that passes stack and that unused time becomes credit. Two billing models side by side, at equal weight.",
        },
        {
          id: "line",
          label: "One line and a button",
          means:
            "One event, paid once, the price and the room, with Buy beside it. The detail stays on the marketing page one click away.",
        },
        {
          id: "none",
          label: "Not in the surface at all",
          means:
            "The app sells Pro. The pass stays a marketing-page purchase and a Renew button for the host who already holds one.",
        },
      ],
      recommended: "line",
      because:
        "A host who hit a gate wants the gate opened, and the pass opens it for less, so leaving it out is dishonest. But two pricing models at equal weight is the fork that makes people close the surface and decide later.",
      overrule:
        "If the one-off wedding host is the real customer, the pass deserves Pro's weight and the full card is the honest draw.",
      lands:
        "Where the Event Pass is sold inside the app, and what a stacking second purchase looks like.",
      configs: BOTH,
    },
    {
      id: "doors",
      label: "The doors",
      question: "Where should the app open it from?",
      context:
        "Eleven doors exist and every one of them is a refusal: a lock, a toast or a banner. There is no way to look at what you pay unless something has just said no to you. Drawn with the menu held open.",
      options: [
        {
          id: "same",
          label: "The eleven doors, retargeted",
          means:
            "Every link, toast and banner opens the surface instead of leaving. Nothing new is added, so billing is still reachable only by being refused.",
        },
        {
          id: "menu",
          label: "And a plan row in the user menu",
          means:
            "The avatar gains Plan and storage above Account, carrying the plan's name. One row, and money has a door that is not a refusal.",
        },
        {
          id: "page",
          label: "And a plan card on the account page",
          means:
            "The menu row plus a real card on /account: the plan, the storage line, the buttons. The surface becomes the quick answer and the page the slow one.",
        },
      ],
      recommended: "menu",
      because:
        "Billing having no home is the seam this round exists to close, and one menu row closes it for one row. Whether /account is where money belongs is app-shape's You question, still open on the desk.",
      overrule:
        "If the account page is where a plan belongs, the card is the real fix and the menu row is just a pointer to it.",
      lands:
        "Every entry point to billing in the app, and whether the avatar opens one.",
      configs: BOTH,
    },
    {
      id: "words",
      label: "The words at a gate",
      question: "How should a locked control ask?",
      context:
        "Four gated sites word one rule four ways: password-protected albums are a paid feature, a custom link is a paid feature, password protection is a paid feature, upgrade to allow video. Pinned to the Free host, whatever the knob says.",
      options: [
        {
          id: "each",
          label: "Each site keeps its own sentence",
          means:
            "Four wordings for one rule, as today, each free to describe its own feature exactly and each one more string to keep true.",
        },
        {
          id: "one",
          label: "One sentence, one source",
          means:
            "A single component takes the feature's name and renders the same shape everywhere. Four strings become one pattern and one place to edit.",
        },
        {
          id: "chip",
          label: "A lock chip, and the surface explains",
          means:
            "The inline copy shrinks to a lock and the control's own name. The reason, the price and the plan all live in the surface the chip opens.",
        },
      ],
      recommended: "chip",
      because:
        "The surface now names the feature and the price, so saying both inline is the same sentence twice. A chip also reads as a control rather than as an apology, which is what a settings row wants to be.",
      overrule:
        "If a host should know the cost before opening anything, one shared sentence says it in place and costs one component.",
      lands:
        "Every locked control in the app: the password, the custom link, video, and whatever is gated next.",
      after: { ask: "first" },
      configs: BOTH,
    },
    {
      id: "back",
      label: "Coming back",
      question: "What should Checkout come back to?",
      context:
        "Stripe lands every buyer on the dashboard with a receipt, wherever they started. The host in these frames left from a locked password field on an event, and after paying she is on the dashboard with that field two clicks away.",
      options: [
        {
          id: "toast",
          label: "A receipt on the dashboard, as today",
          means:
            "You are on Pro, and the plan's name. Whatever the host was in the middle of doing is theirs to go back and find.",
        },
        {
          id: "reopen",
          label: "The surface returns, holding the receipt",
          means:
            "It reopens where they left it, says what they now hold, and its button becomes the thing they were trying to do when they were stopped.",
        },
        {
          id: "finish",
          label: "It finishes the job",
          means:
            "Checkout returns to the exact control that was locked, now open and waiting, with the receipt above it. Nothing to find.",
        },
      ],
      recommended: "finish",
      because:
        "Nobody sets out to buy a plan; she set out to put a password on her album. Returning to the control she was refused at is the only option that ends where the host started.",
      overrule:
        "If the return has to be predictable above all else, the dashboard is the one place every purchase can always land.",
      lands:
        "Stripe's success_url, and the first second a host sees after paying us.",
      after: { ask: "object" },
      configs: BOTH,
    },
  ],
});

/**
 * ★ EVERY OTHER AXIS STARTS AT TODAY, NOT AT THE RECOMMENDATION (app-shape's
 * finding, and it bit this board too: "the eleven doors, retargeted" drew with
 * a plan row already in the menu until the controls were pinned). An option
 * that says "as today" has to BE today, so every control starts on today's
 * answer while each step still opens on the recommendation for its own question
 * (`step.tsx` reads `step.recommended`, never the control's default).
 *
 * The rows with no "today" are the ones the app has no answer to at all: there
 * is no in-app surface, so `object`, `first`, `carry`, `learn` and `pass` start
 * at the recommendation, which is the honest baseline for a thing that does not
 * exist yet.
 */
const TODAY: Record<string, string> = {
  doors: "same",
  words: "each",
  back: "toast",
};

/**
 * ★ ONE WINDOW KNOB AND ONE WHO KNOB, NOT SIXTEEN. `defineExploration` flattens
 * every decision's `configs` into the board's controls, so a shared knob
 * arrives once per decision and the dock would draw it eight times (React warns
 * on the duplicate key). Each decision keeps both on its own strip, which is
 * what `configs` is for; the board declares each once. app-shape and
 * gallery-width both filed the same finding: the constructor could dedupe by id.
 */
export const APP_PRICING: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls
    ?.filter((c, i, all) => all.findIndex((d) => d.id === c.id) === i)
    .map((c) => (TODAY[c.id] ? { ...c, default: TODAY[c.id] } : c)),
};
