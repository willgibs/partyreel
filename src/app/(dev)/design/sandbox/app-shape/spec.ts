import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HOST APP'S SHAPE, ROUND ONE (2026-09-19).
 *
 * Will: "Let's treat the full app experience as well as guest pages as
 * unprotected. Anything and everything is open to relitigate or reconcept from
 * the ground up to begin establishing a better system from its foundation. The
 * existing version is closer to a Frankenstein's monster as we were trying to
 * integrate new features ideas 1 by 1, rather than having a complete idea of
 * the full app from the beginning." (docs/design/rulings.md.)
 *
 * So this round asks what the app IS, and nothing about what anything in it
 * looks like. Eight decisions on one host's Saturday night, every option drawn
 * on the shipped components at 1440 and again at 375, because a host is in a
 * hand as often as on a laptop and the app has never been designed for one.
 *
 * ★ THE STAGING IS THE ARGUMENT. Four decisions wait on the event page, because
 * where sharing lives, where settings live and how you move around are all
 * different questions once the event page has a shape; the density waits on the
 * home for the same reason; the phone waits on the navigation, because a rail
 * cannot be a rail in a hand. The home, the event and the account depend on
 * none of each other and can be taken in any order.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The vocabulary under the shape is
 * `app-vocabulary`'s round (the five "nothing here yet" components, the two
 * bulk toolbars, the two tile-action models, the skeletons, the gallery's
 * controls), and the guest pages are `guest-shape`'s. Gallery width and tile
 * size were ruled on 2026-09-19 and are worn here, never re-asked. The security
 * seams (RLS, `getUser()`, the capability tokens) are never a design variable
 * and no option touches one.
 */

/**
 * THE WINDOW, one knob every decision shares, so one frame is on screen at a
 * time and each is a real viewport at 1:1. The phone decision ignores it and
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

const DRAFT = defineExploration({
  id: "app-shape",
  title: "The host app",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: what the home is, how an event draws on it, what an event's page is, how you move between seven routes, where sharing and settings live, where the money and your own photographs live, and what shape the whole thing takes in a hand.",
  },
  context:
    "Seven routes behind one bar with a wordmark and a menu and no navigation. The home is one feed switched by six chips that mixes your events with your uploads, your likes, the hosts you follow and a bin; the event page is that shape again under five pills; settings is a column of cards ending in a second, unrelated Deleted; the reel is a full-bleed room; billing has no home at all. Three ways back, four names for which tab. Every option here is one host's Saturday night: three events, twelve photos waiting, a reel half made, 96 percent of her storage gone.",
  bible: [2, 15, 21, 22],
  asks: [
    {
      id: "home",
      label: "The host's home",
      question: "What should the app open on?",
      context:
        "Today /dashboard is one feed switched by six chips (All, Events, Following, Uploads, Likes, Deleted): your three events, a friend's saved event, your own uploads, the photos you liked anywhere and a bin, in one scroll.",
      options: [
        {
          id: "inbox",
          label: "The inbox of everything, as today",
          means:
            "One page for your events and everything you have touched. Six chips, and the events are one section of five.",
        },
        {
          id: "events",
          label: "Your events, and nothing else",
          means:
            "The home holds what you host. Uploads, likes, follows, saves and the bin move under You, where your account already is.",
        },
        {
          id: "pulse",
          label: "What needs you, then what just arrived",
          means:
            "A front page: the waiting queues and the storage line first, then the photographs of the last hour, then your events.",
        },
      ],
      recommended: "pulse",
      because:
        "A host opens this between checks while a party is running. Only the front page answers the two questions they came with, and the inbox is the Frankenstein at its clearest: your own likes are not a hosting job.",
      overrule:
        "If the app is opened mostly between parties, the plain events home is the honest one and needs no ranking.",
      lands:
        "What /dashboard is, and whether the personal feeds stay on it at all.",
      configs: [SIZE],
    },
    {
      id: "density",
      label: "How an event draws",
      question: "How much room should one event take on the home?",
      context:
        "Three events, the same three under every option, drawn on the home you picked. Today each is a 16:10 cover card with its name, date, count and review chip laid over the photograph, three across.",
      options: [
        {
          id: "cover",
          label: "The cover card, as today",
          means:
            "One photograph per event, the chrome over it in white. Three fill a laptop's width and nothing says what is waiting until you read the chip.",
        },
        {
          id: "row",
          label: "A row: the cover behind it, counts in columns",
          means:
            "The photograph is the row's own ground at 12 percent, the four newest sit beside the name, and what needs you ends the row. Eight fit where three cards did.",
        },
        {
          id: "wall",
          label: "A wall of its newest photographs",
          means:
            "Each event is a line of type over six recent tiles, so the home reads as the albums it holds rather than as a filing cabinet.",
        },
      ],
      recommended: "row",
      because:
        "The row is the only one that says what needs doing per event without opening it, and it keeps the party visible in the strip. The front page above it already carries the photographs at full size.",
      overrule:
        "If the home should feel like the albums rather than like work, the wall is the one that does, at three events to a screen.",
      lands:
        "The events list, the bin, the saved events and the hosts you follow: every list of events in the app.",
      after: { ask: "home" },
      configs: [SIZE],
    },
    {
      id: "event",
      label: "The event as a place",
      question: "What is an event's page?",
      context:
        "Today: a back link, the name, five glyphs, two chips, a Share / Add / Settings strip, five pills, then Review, Gallery, Reel and Guests stacked. Each option is drawn in the chrome it needs, which the next question asks about.",
      options: [
        {
          id: "feed",
          label: "One urgency-ordered scroll, as today",
          means:
            "Everything on one page, the waiting queue floated to the top, five pills to narrow it. One page to build, and one page never about one thing.",
        },
        {
          id: "hub",
          label: "A front page with a door into each room",
          means:
            "The cover, the name and four doors carrying their counts, with the newest photographs beneath. Every job is one click away and none of them is here.",
        },
        {
          id: "album",
          label: "The album is the page",
          means:
            "One line of identity, the queue as a banner while there is one, then the photographs to the window. Review, Reel, Guests and Settings become rooms.",
        },
      ],
      recommended: "album",
      because:
        "The page exists because photographs are arriving, and today 404 px of chrome sit above the first one. The studio already proves the model: one room, one job, no pills.",
      overrule:
        "If a host does four different jobs in a sitting, the hub names all four and the album hides three of them behind the chrome.",
      lands:
        "The event page, and whether Review, Reel, Guests and Settings become routes of their own.",
      configs: [SIZE],
    },
    {
      id: "nav",
      label: "Moving around",
      question: "How should seven routes be reached, and what is the way back?",
      context:
        "One 56 px bar holds a wordmark and a menu. Nothing says which route you are on, and the way back is whatever each page drew: a text link, a dirty-checked one, the studio's X, and nothing on /account.",
      options: [
        {
          id: "header",
          label: "The bar and a menu, as today",
          means:
            "No pixels spent and no navigation. Seven routes invisible, three idioms for going back, and the page heading is the only thing saying where you are.",
        },
        {
          id: "crumbs",
          label: "A trail in the bar, the rooms under it",
          means:
            "Partyreel / the event / the room, each step walkable, with the event's rooms on a second row inside one. One way back, no width spent.",
        },
        {
          id: "rail",
          label: "A rail of your events and their rooms",
          means:
            "232 px of permanent structure: every event, its queue count and the open one's rooms, always readable. Every event is one click from every other.",
        },
      ],
      recommended: "crumbs",
      because:
        "It kills the three back idioms and names where you are for no horizontal cost, which matters now that galleries run to the window: the rail is paid for in columns of photographs, and the captions measure it.",
      overrule:
        "If a host runs several events at once, only the rail crosses between them without going home first.",
      lands:
        "The shell on all seven routes, the way back everywhere, and whether the app keeps its 1280 column.",
      after: { ask: "event" },
      configs: [SIZE],
    },
    {
      id: "share",
      label: "Where sharing lives",
      question: "Where should the QR code and the link live?",
      context:
        "Sharing is the host's first job and every scan is how a future host meets Partyreel. Today it is a dialog behind a Share button on the command strip, so the code exists only while a modal is open. Drawn on the event page you picked.",
      options: [
        {
          id: "modal",
          label: "A dialog behind a Share button, as today",
          means:
            "The code, the link, the poster and the invite in one modal. Nothing on the page until you ask, and nothing behind it while you look.",
        },
        {
          id: "room",
          label: "A room of its own",
          means:
            "A page for getting the link out: the code at 320 px, the link, three posters to print and an invite. Reached like any other room.",
        },
        {
          id: "front",
          label: "On the event itself, always there",
          means:
            "The code and the link sit in the event's own header, on the page a host is already on. Nothing to open, and the poster is one button away.",
        },
      ],
      recommended: "front",
      because:
        "A host shares at the door, at the table and again at the speeches. A code that lives on the page is at hand every time; a modal asks them to remember it is there.",
      overrule:
        "If printing and inviting matter as much as the code, the room holds all four jobs where the header can only hold two.",
      lands:
        "The QR designer, the poster, the invite, and what a host sees first on an event.",
      after: { ask: "event" },
      configs: [SIZE],
    },
    {
      id: "settings",
      label: "Where settings live",
      question: "Where should an event's settings live?",
      context:
        "A route of its own holding one long column of cards, ending in a Deleted card that holds removed PHOTOS while the home's Deleted chip holds removed EVENTS. One word, two bins, two different sets of buttons.",
      options: [
        {
          id: "column",
          label: "A page of cards, as today",
          means:
            "Seven cards down one column, on a route you leave the album for. Both bins keep the name Deleted and neither mentions the other.",
        },
        {
          id: "sheet",
          label: "A sheet beside the album",
          means:
            "Settings slide over the event, which stays behind them: change who can see this and watch the album it governs. The photo bin joins the album as a filter.",
        },
        {
          id: "rooms",
          label: "Each setting beside what it governs",
          means:
            "Access on Share, moderation on Review, the guest list on Guests, the bin on the Album, and one Danger page. Nothing called Settings survives.",
        },
      ],
      recommended: "sheet",
      because:
        "Every setting here changes what a guest sees, and the sheet is the only one that keeps the album on screen while you change it. It also gives the photo bin a home that is not the word Deleted twice.",
      overrule:
        "If a host sets an event up once and never returns, the page of cards is the easiest thing to read top to bottom.",
      lands:
        "The settings route, the two bins, and whether Deleted names one thing.",
      after: { ask: "event" },
      configs: [SIZE],
    },
    {
      id: "you",
      label: "The account and the money",
      question: "Where should the plan, the profile and your own photos live?",
      context:
        "Billing has no home: the only path to a plan is a popover on the storage strip on the dashboard. The social settings are spread over four places, one of which names Account settings without linking to it.",
      options: [
        {
          id: "today",
          label: "A popover, and four places, as today",
          means:
            "The plan is reachable only from a strip on one page, the profile settings are wherever the feature landed, and your own media sits among your events.",
        },
        {
          id: "you",
          label: "One You: plan, profile, connections, your media",
          means:
            "Everything about the person rather than the party, behind the avatar: the plan and storage, the public profile, who you follow, your uploads and likes.",
        },
        {
          id: "account",
          label: "The Account page, plus a plan card",
          means:
            "The smallest honest fix: /account grows a Plan card with billing on it, and nothing else moves. Your media and the social switches stay where they are.",
        },
      ],
      recommended: "you",
      because:
        "Every one of these is about the person, not the party, and putting them together is what lets the home be about events at all. It is also the only option that gives money a door.",
      overrule:
        "If the personal feeds belong beside the events after all, the plan card is the whole fix and costs one card.",
      lands:
        "Billing's front door, the profile settings, the personal feeds and what the avatar opens.",
      configs: [SIZE],
    },
    {
      id: "phone",
      label: "In a hand",
      question: "What shape should the app take on a phone?",
      context:
        "A host is on their phone at the party and on a laptop the morning after, and the app has one layout for both: the same bar, the same page, narrower. Drawn at 375 on the event page and navigation you picked, whatever the window knob says.",
      tile: "phone",
      options: [
        {
          id: "narrow",
          label: "The same shape, narrowed, as today",
          means:
            "One 56 px bar, the page in a 343 px column, and every control at the top of the screen where a thumb is not.",
        },
        {
          id: "thumb",
          label: "A bar at the bottom, in reach",
          means:
            "Where you are at the top, where you can go at the bottom: the event's rooms become the bar, with the queue's count on it, and the album runs edge to edge.",
        },
        {
          id: "same",
          label: "One shape at both sizes",
          means:
            "The breadcrumb header narrowed and nothing else: the trail cuts to where you are, the rooms scroll sideways, and there is one layout to build.",
        },
      ],
      recommended: "thumb",
      because:
        "The phone is where the host works during the party, and a control at the top of a 812 px screen is the one place a thumb cannot reach. The bar also puts the waiting count permanently in view.",
      overrule:
        "If keeping one layout matters more than reach, the narrowed header is one shape to build and one to learn.",
      lands:
        "Every route at a phone, and whether the app has one layout or two.",
      after: { ask: "nav" },
    },
  ],
});

/**
 * ★ EVERY OTHER AXIS STARTS AT TODAY, NOT AT THE RECOMMENDATION.
 *
 * `defineExploration` defaults each control to the decision's recommendation,
 * which is right for the decision being asked and wrong for the seven around
 * it: reading the first captures against their own words caught "one
 * urgency-ordered scroll, AS TODAY" drawn with the candidate share block in it,
 * and "the inbox of everything, as today" drawn in rows. An option that says
 * "as today" has to BE today, so every control here starts on today's answer
 * and the step still opens on the recommendation for its own question
 * (`step.tsx` picks `step.recommended`, never the control's default). The
 * result: until he answers anything, every picture is today with exactly one
 * thing changed; afterwards it is HIS app with one thing changed.
 */
const TODAY: Record<string, string> = {
  home: "inbox",
  density: "cover",
  event: "feed",
  nav: "header",
  share: "modal",
  settings: "column",
  you: "today",
  phone: "narrow",
};

/**
 * ★ ONE WINDOW KNOB, NOT SEVEN. `defineExploration` flattens every decision's
 * `configs` into the board's controls, so a knob the decisions share arrives
 * once per decision: the dock would draw it seven times and React would warn
 * about the duplicate key. Each decision keeps it on its own strip (that is
 * what `configs` is for); the board declares it once. gallery-width found this
 * first and filed the same finding: the constructor could dedupe by id itself.
 */
export const APP_SHAPE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls
    ?.filter((c, i, all) => all.findIndex((d) => d.id === c.id) === i)
    .map((c) => (TODAY[c.id] ? { ...c, default: TODAY[c.id] } : c)),
};
