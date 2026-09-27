import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHERE A POPUP OPENS, ROUND ONE (2026-09-27).
 *
 * Will, on identity-claims r1 (`ticket=banner`, whose review opened in a side
 * sheet): "Are we using sheets everywhere now? Feels like a less common
 * pattern for users in general, especially used for everything. Many popups
 * would benefit from a different layout/UI." In chat he chose a board for it,
 * first on the desk.
 *
 * ★ ONE QUESTION PER KIND OF POPUP, NEVER PER SCREEN. The inventory (taken
 * 2026-09-27 over every production popup) sorts into kinds: confirmations,
 * short forms, lists to work through, quick choices, share, plans, settings,
 * and a quick look at a person. Each ask is one kind; each option is a RULE
 * the components would follow (the Dialog's and the Sheet's variants, named
 * in `lands`), drawn on that kind's real screens: one 1440 frame (the knob
 * picks which screen) above three 375 frames, the keyboard up wherever a
 * field is focused. So an answer is a line in one table, not twelve edits.
 *
 * ★ PICKERS AND PLANS ARE TWO ASKS where the brief grouped them (the first
 * carried call): an action sheet cannot hold a price list and a wide dialog
 * is a lot of furniture for Take a photo, so no one rule fit both without a
 * fallback, and a rule with a fallback is two rules.
 *
 * ★ MOVED HERE, EVERY OPTION KEPT. `profile-page.view-all` (its four: sheet,
 * page, centred, in place) and `host-storage.where` (a page, the album's own
 * list, a sheet) are the `lists` ask's options and screens; `event-safety`'s
 * Block question (`sheet`: a sheet, Undo on a toast, in place) is the
 * `confirm` ask's; `profile-page.quick-look` is `peek`, its three options by
 * id with one added. `contact-page.receipt` stays (it decides an email and a
 * reference, not only the surface), as do `event-safety`'s `blocked` and
 * `queue` (places in the host's app, not popups); `help-center` asks nothing
 * whose options are surfaces.
 *
 * ★ NEVER ASKED HERE: the door and its change and confirm sheets stay his lit
 * held sheets (`identity-door`); where the claims batch confirms a deletion is
 * `identity-claims` r2's (it draws its review as r1 did and leaves the surface
 * to `lists`); the upload tracker's badge and statuses are `guest-door`'s.
 *
 * ★ EVERY DIALOG HERE THAT HOLDS A FIELD IS DRAWN KEYBOARD-SAFE, which today's
 * `DialogContent` is not (it centres in the layout viewport, so on a phone its
 * lower half sits under the keyboard). The fix is at its source, the Sheet's
 * own `useKeyboardInset`; a carried call says so rather than drawing an option
 * the product could not ship as drawn.
 */

/** The screen each kind's 1440 frame draws. Declared here, pure data: a spec
 *  is what a server page reads (registry.test.ts refuses anything else). */
const LIST_AT: Control = {
  id: "list-at",
  label: "At the laptop, the list",
  options: [
    { id: "guests", label: "The guest list, at 240" },
    { id: "uploads", label: "Her uploads" },
    { id: "claims", label: "Photos waiting to be claimed" },
    { id: "storage", label: "Maya's largest files" },
  ],
  default: "guests",
};

const CONFIRM_AT: Control = {
  id: "confirm-at",
  label: "At the laptop, the question",
  options: [
    { id: "block", label: "Blocking Rick" },
    { id: "remove", label: "Removing three photos" },
    { id: "account", label: "Deleting an account" },
  ],
  default: "block",
};

const FORM_AT: Control = {
  id: "form-at",
  label: "At the laptop, the form",
  options: [
    { id: "event", label: "Reporting the wedding" },
    { id: "person", label: "Reporting a person" },
    { id: "name", label: "Changing her name" },
  ],
  default: "event",
};

const PICK_AT: Control = {
  id: "pick-at",
  label: "At the laptop, the choice",
  options: [
    { id: "add", label: "Priya adding photos" },
    { id: "download", label: "Downloading the album" },
    { id: "style", label: "The code's style" },
  ],
  default: "add",
};

const SHARE_AT: Control = {
  id: "share-at",
  label: "At the laptop, the share",
  options: [
    { id: "invite", label: "Priya's Invite" },
    { id: "dashboard", label: "Maya's Share, on the dashboard" },
    { id: "hub", label: "Maya's Share, on the event" },
  ],
  default: "invite",
};

const PLAN_AT: Control = {
  id: "plan-at",
  label: "At the laptop, the plan",
  options: [
    { id: "room", label: "Out of room" },
    { id: "lock", label: "A Pro lock in Settings" },
    { id: "pro", label: "A Pro host changing size" },
  ],
  default: "room",
};

/** `peek`'s own knob, profile-page's `tapped` carried over with the ask. */
const TAPPED: Control = {
  id: "tapped",
  label: "At the laptop, tapped",
  options: [
    { id: "nina", label: "Nina, a typed name (Unverified)" },
    { id: "jay", label: "Jay, confirmed, no handle" },
    { id: "priya", label: "Priya, a page with two events" },
  ],
  default: "nina",
};

export const POPUPS = defineExploration({
  id: "popups",
  title: "Where a popup opens",
  round: {
    n: 1,
    date: "2026-09-27",
    changed:
      "New, on his identity-claims note that the sheet has become every popup's answer: one question per kind of popup, each option a rule the Dialog and the Sheet would follow, drawn on that kind's real screens.",
  },
  context:
    'Will, on identity-claims r1: "Are we using sheets everywhere now? Feels like a less common pattern for users in general... Many popups would benefit from a different layout/UI." Production opens twelve responsive sheets and about twenty centred dialogs, with no rule between them. Each question is one kind of popup; each option is a rule, drawn on the kind\'s real screens, a 1440 frame over three 375s with the keyboard up wherever a field is focused.',
  carried: [
    {
      id: "one-table",
      question: "How does an answer here reach every popup of its kind?",
      taken:
        "Each popup names its kind, and one table beside floating-layer.ts gives Dialog and Sheet the surface, so a kind moves in one line.",
      overrule:
        "If a table is more machinery than eight answers need, each popup takes its kind's answer by hand.",
    },
    {
      id: "two-kinds",
      question: "Are pickers and plans one kind, as the brief grouped them?",
      taken:
        "Two: a plan is a decision with money and a long body, a choice is a few taps, and no one surface held both without a fallback.",
      overrule:
        "If one rule should cover both, the plans answer applies to the choices too.",
    },
    {
      id: "keyboard-dialog",
      question: "Can a centred dialog hold a field on a phone?",
      taken:
        "Once it learns the Sheet's keyboard rule, so every dialog with a field is drawn standing in what the keyboard leaves. Today's is not keyboard-safe.",
      overrule:
        "If that fix should not be built, a dialog with a field becomes the Sheet under 640.",
    },
    {
      id: "stacked",
      question: "What opens when a popup is asked for from inside another?",
      taken:
        "A confirmation or a form sits over it as a centred dialog; a plan or another place replaces it in a hand, and Back returns.",
      overrule:
        "If one layer at a time should hold at a desk too, every second popup replaces the first.",
    },
    {
      id: "kit",
      question:
        "Where does the host's whole share kit go, if Share opens something smaller?",
      taken:
        "One tap behind it, as Everything is today, in whatever settings gets: it holds a field, the readable link, so it is a place.",
      overrule:
        "If the kit is sharing first, it grows inside whatever Share opens.",
    },
    {
      id: "failure-sheet",
      question: "Does the upload failure sheet follow the lists answer?",
      taken:
        "No: it opens by itself when a run ends, so it stays the sheet; a list she opens herself is a different act.",
      overrule:
        "If failures should read like any other list, they follow lists.",
    },
    {
      id: "left-alone",
      question: "Which popups does this board leave as they are?",
      taken:
        "The door's held sheets, the viewer, the reel and clip maker, menus, search, the photo cropper and Welcome to Pro: each fits its job.",
      overrule: "Name one and it joins the next round.",
    },
  ],
  asks: [
    /* ── 1. Lists ─────────────────────────────────────────────────────────── */
    {
      id: "lists",
      label: "Lists",
      question:
        "When a tap opens a list to read or work through (the guest list, her uploads, photos waiting to be claimed), what should it open in?",
      context:
        "The guest list and the claims card open in place today; guest-door is building her uploads in a sheet, and claims r1 drew its review as a side panel. profile-page.view-all and host-storage.where move here, every option kept.",
      options: [
        {
          id: "sheet",
          label: "The one Sheet over the screen",
          means:
            "A side panel at a desk, a bottom sheet in a hand capped at 85 percent with its own scroll; the screen it came from stays under it.",
        },
        {
          id: "panel",
          label: "A side panel, its own screen in a hand",
          means:
            "Beside the screen it came from at a desk; in a hand it takes the whole screen under a back arrow, and the phone's own Back closes it.",
        },
        {
          id: "page",
          label: "A page of its own",
          means:
            "A real address at every width (…/guests, /account/storage): a heading, a count and ordinary scroll, the one shape a long list is allowed.",
        },
        {
          id: "centred",
          label: "A capped centred list",
          means:
            "A centred dialog that scrolls inside itself, like the one Pro is celebrated in: closer to a decision than a browse.",
        },
        {
          id: "inline",
          label: "In place, where it was tapped",
          means:
            "The row, the banner or the button grows into the list where it stands, 24 at a time with Show more, as the guest list does today.",
        },
      ],
      recommended: "panel",
      today: "inline",
      because:
        "A list is a place she moves through, not a question: at a desk it rides beside the screen it came from, and in a hand it gets the whole screen and a back arrow, the way a phone shows a list, with no 85 percent cap and no album peeking over it.",
      overrule:
        "If the storage list or 240 names need the whole width at a desk too, page gives every list its own address.",
      lands:
        "The Sheet gains a panel posture, full screen under 640; the guest list, her uploads, the claims review and storage all open in it.",
      configs: [LIST_AT],
    },

    /* ── 2. Confirmations ─────────────────────────────────────────────────── */
    {
      id: "confirm",
      label: "Confirmations",
      question:
        "When the app asks before it acts (a block, a removal, deleting an account), what should the question open in?",
      context:
        "Thirteen of fourteen confirmations are a small centred dialog; the admin's acts are a sheet. His claims r1 words: \"Popping up a modal is a very clear way to ensure confirmation.\" event-safety's Block question moves here, every option kept.",
      options: [
        {
          id: "dialog",
          label: "A centred dialog, sized to what it says",
          means:
            "The alert both phones and the web already use: centred at every width, wider when it lists what leaves, above the keyboard when it holds a field.",
        },
        {
          id: "sheet",
          label: "The one Sheet, as the admin's acts are",
          means:
            "A side panel at a desk and a bottom sheet in a hand, as event-safety drew Block: room for what leaves, the verb at its foot.",
        },
        {
          id: "undo",
          label: "Undo, wherever it can be undone",
          means:
            "A removal or a block happens at once with Undo on its toast; only what cannot come back, like an account, still asks in a centred dialog.",
        },
        {
          id: "inline",
          label: "The button asks a second time, in place",
          means:
            "The control that was pressed grows into what leaves and one more tap, where it stands: no layer over the page, nothing to dismiss.",
        },
      ],
      recommended: "dialog",
      today: "dialog",
      because:
        "It is what thirteen of fourteen already are, and his own claims answer: a layer over the page says nothing has happened yet. Sized to its words, it holds Block's one-browser note and its switch as well as the sheet did.",
      overrule:
        "If a host removing photos mid-party should never be stopped, undo answers every act that can come back and keeps the dialog for the rest.",
      lands:
        "Dialog gains sizes and the Sheet's keyboard rule; the admin's destructive sheet and Block become dialogs, or reversible acts move to Undo.",
      configs: [CONFIRM_AT],
    },

    /* ── 3. Short forms ───────────────────────────────────────────────────── */
    {
      id: "forms",
      label: "Short forms",
      question:
        "When the app asks for a few words (a report, a new name), what should the form open in?",
      context:
        "Reporting an event opens a sheet and reporting a person a centred dialog; guest-door is building Change beside her told name. Every form is typed into, so every phone has its field focused and the keyboard up.",
      options: [
        {
          id: "sheet",
          label: "The one Sheet, standing on the keyboard",
          means:
            "Today's guest forms: in a hand a bottom sheet whose foot rides the keyboard with Send pinned there; at a desk a side panel.",
        },
        {
          id: "dialog",
          label: "A small centred dialog, above the keyboard",
          means:
            "Today's report a person, taught the Sheet's keyboard rule: centred in what the keyboard leaves in a hand, in the middle of the screen at a desk.",
        },
        {
          id: "screen",
          label: "Its own screen in a hand, a dialog at a desk",
          means:
            "The phone's compose shape: the form fills the screen with Cancel and Send in its bar, out of the keyboard's way; a small centred dialog at a desk.",
        },
        {
          id: "inline",
          label: "In place, where it was tapped",
          means:
            "The link that asked grows into the field where it stands: her told line becomes the name field, the footer's Report becomes the form.",
        },
      ],
      recommended: "dialog",
      today: "sheet",
      because:
        "A form here is one question with a field in it, the same kind of thing as a confirmation, so it reads best as the same object: one card at a desk and in a hand, the keyboard rule it needs already written for the Sheet.",
      overrule:
        "If a phone's form should own the whole screen, screen gives the field and Send all of it, as a phone's own compose does.",
      lands:
        "Dialog takes the Sheet's keyboard rule and centres in the visible band; Report, Report a person and Change move onto it.",
      configs: [FORM_AT],
    },

    /* ── 4. Quick choices ─────────────────────────────────────────────────── */
    {
      id: "choices",
      label: "Quick choices",
      question:
        "When a tap asks her to pick one of a few (how to add photos, what to download, the code's style), what should the choice open in?",
      context:
        "Add photos opens a sheet of two doors, Download a centred dialog of three chips, and Customize a centred dialog of four styles. Nothing is typed, so no keyboard rises; a plan is its own question.",
      options: [
        {
          id: "sheet",
          label: "The one Sheet, as Add photos has it",
          means:
            "A side panel at a desk and a bottom sheet in a hand, a title and a scrim, for two doors or four styles alike.",
        },
        {
          id: "dialog",
          label: "A small centred dialog, as Download has it",
          means:
            "Centred at every width, a title over the choices and the act that follows them, the page dimmed around it.",
        },
        {
          id: "menu",
          label: "A menu at the button, rows at the foot",
          means:
            "At a desk the choices open under the button that asked, like any menu; in a hand they rise to the thumb as the phone's own chooser does, Cancel beneath.",
        },
        {
          id: "inline",
          label: "In place: the choices where the button was",
          means:
            "No popup: Add photos splits into its two doors on the page, Download opens its chips under itself, and the styles lie open in the kit.",
        },
      ],
      recommended: "menu",
      because:
        "A choice belongs next to the button that asked: at a desk under it like every other menu, in a hand at the thumb the way the phone's own chooser is, and none of the three needs a title bar, a scrim or a close.",
      overrule:
        "If a choice should read as a decision rather than a menu, the dialog gives all three Download's shape.",
      lands:
        "One responsive menu (a popover at a desk, an action sheet under 640) for Add photos, Download and the code's style.",
      configs: [PICK_AT],
    },

    /* ── 5. Share ─────────────────────────────────────────────────────────── */
    {
      id: "share",
      label: "Share",
      question: "When someone taps Invite or Share, what should open first?",
      context:
        "Priya's Invite opens a sheet with the code; Maya's Share on the dashboard opens her whole kit in a sheet; the event's own Share opens his code card. What opens first is asked; the kit is a carried call.",
      options: [
        {
          id: "sheet",
          label: "The one Sheet, as today",
          means:
            "Invite and the dashboard's Share open the side panel at a desk and the bottom sheet in a hand; the event's Share keeps his code card.",
        },
        {
          id: "card",
          label: "His code card, for every share",
          means:
            "The card the event's code opens becomes every share's first surface: the code filling a phone in white, a 384 card at a desk, Copy and Share under it.",
        },
        {
          id: "native",
          label: "The phone's own share sheet in a hand",
          means:
            "A tap hands the link straight to the phone's share sheet (Messages, AirDrop, Copy); at a desk, which has none, his code card opens instead.",
        },
      ],
      recommended: "card",
      today: "sheet",
      because:
        "At a party, sharing is mostly holding the code up to someone: his own card gives it the whole screen at a scanner's contrast, and one object for every share means a guest's Invite and a host's Share are the same thing.",
      overrule:
        "If sending the link matters more than showing the code, native hands a phone's share straight to Messages and AirDrop.",
      lands:
        "The code card becomes the one share surface: Invite and the dashboard's Share open it, and the kit waits behind Everything.",
      configs: [SHARE_AT],
    },

    /* ── 6. Plans ─────────────────────────────────────────────────────────── */
    {
      id: "plans",
      label: "Plans",
      question:
        "When a host meets a limit and the app offers a plan, what should the plans open in?",
      context:
        "The pricing sheet opens from nine places, among them running out of room, a Pro lock in Settings (a second sheet over the settings sheet), the clip maker and the account's Plan card.",
      options: [
        {
          id: "sheet",
          label: "The one Sheet, as today",
          means:
            "A side panel at a desk, a bottom sheet in a hand, opened over whatever held the limit: a second sheet over Settings.",
        },
        {
          id: "wide",
          label: "A wide dialog, its own screen in a hand",
          means:
            "At a desk a centred dialog wide enough for the plans side by side; in a hand the whole screen under a close, over whatever held the limit.",
        },
        {
          id: "page",
          label: "A plan page of its own",
          means:
            "An address in the app (/account/plan): every trigger goes there, the plans with room; Back returns to where the limit was met.",
        },
      ],
      recommended: "wide",
      today: "sheet",
      because:
        "A plan is a decision with money in it, met in the middle of something else (a lock in Settings, the clip maker): a dialog keeps that screen under it where a page would leave it, and a phone gives the plans the whole screen.",
      overrule:
        "If plans deserve an address a host can come back to, page gives them one and every trigger links there.",
      lands:
        "PricingSheet becomes a wide Dialog with a full-screen phone posture; its nine triggers and their headlines stay as they are.",
      configs: [PLAN_AT],
    },

    /* ── 7. Settings ──────────────────────────────────────────────────────── */
    {
      id: "settings",
      label: "Settings",
      question:
        "When a host opens an event's settings, what should they open in?",
      context:
        'The longest popup in the app: six cards, about seventeen controls. He moved it into the Sheet on 2026-09-20 ("we likely want to apply this sheet concept everywhere"), which his note now questions.',
      options: [
        {
          id: "sheet",
          label: "The one Sheet, as he picked it",
          means:
            "A side panel beside the album at a desk; in a hand a bottom sheet capped at 85 percent over a strip of album, standing on the keyboard.",
        },
        {
          id: "panel",
          label: "A side panel, its own screen in a hand",
          means:
            "His panel at a desk, unchanged; in a hand the whole screen under a back arrow, the long form with nothing above it.",
        },
        {
          id: "page",
          label: "A settings page of its own",
          means:
            "The address it had before the sheet (/dashboard/…/settings): full width, its cards in a column, the event a Back away.",
        },
        {
          id: "dialog",
          label: "A large dialog, its sections beside",
          means:
            "At a desk a wide centred dialog with the six cards as sections down its left; in a hand the sections are a list, each its own screen.",
        },
      ],
      recommended: "panel",
      today: "sheet",
      because:
        "It keeps his pick where it earned its place, the panel beside the album at a desk, and gives a phone's longest form the whole screen: seventeen controls and a keyboard read better without a strip of album over them.",
      overrule:
        "If settings should be somewhere a host can link to and come back, page restores the address it had.",
      lands:
        "The Sheet's panel posture, shared with lists; the discard question stays a centred dialog over it.",
    },

    /* ── 8. A quick look ──────────────────────────────────────────────────── */
    {
      id: "peek",
      label: "A quick look",
      question:
        "What should tapping a name in the guest list open first, when most names have no page behind them?",
      context:
        "Most names at a names-mode party are Unverified, and a confirmed account without a handle has no page either. Today a name without a page opens nothing. Moved from profile-page; a card at the name joins.",
      options: [
        {
          id: "sheet",
          label: "A look in the one Sheet, for every name",
          means:
            "Any name opens the face, the mark where it is Unverified and what they added to this album; a page adds its events and Open full profile.",
        },
        {
          id: "card",
          label: "A card at the name, a sheet in a hand",
          means:
            "At a desk the same look opens beside the name, as the Unverified mark's own card does, and the next tap moves it; in a hand it is the Sheet.",
        },
        {
          id: "mini-modal",
          label: "The same look, in the mini-modal",
          means:
            "The same look in the small centred dialog the app already opens the QR in: capped, anchored to nothing, closer to a peek than a page.",
        },
        {
          id: "none",
          label: "Straight to the page, as shipped",
          means:
            "A name with a page links straight to it (ten taps, ten page loads); every other name opens nothing, which at a names-mode party is most of the list.",
        },
      ],
      recommended: "card",
      today: "none",
      because:
        "His own words asked for it: ten names clicked, a little more about each. At a desk a card at the name moves with every click and never covers the list; in a hand the Sheet is how a phone peeks.",
      overrule:
        "If a look should cover the list the same way everywhere, the Sheet alone is one component at both widths.",
      lands:
        "Whether every name opens something, and whether a look is one component or a card at a desk and a sheet in a hand.",
      configs: [TAPPED],
    },
  ],
});
