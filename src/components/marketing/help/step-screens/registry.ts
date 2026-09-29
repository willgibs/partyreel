/**
 * THE SCREENS A HOW-TO'S STEPS KEEP BESIDE THEIR SENTENCES (help-center r1 `article=screen`: "Each
 * step keeps a small illustration of the surface it describes, next to the sentence"), by id. An
 * article names one on a step (`<Step title="…" screen="door-welcome">`) or on a callout, and this
 * is the one list of what may be named, what each is called to a screen reader, and how it is drawn.
 *
 * TWO KINDS, because two kinds of surface are being pictured:
 *
 *   phone — the guest door and a phone's own camera and mail: a 375px document of its own inside the
 *           walkthrough's phone, scaled down (`phone-document.tsx`). A document, never a div,
 *           because the door's type is viewport-clamped and it reads `sm:` breakpoints: drawn in
 *           the page, a phone would wear the desk's sizes. Drawn from the door's own pieces.
 *   desk  — the host's app and the things on a host's desk (the walkthrough's pictures, the share
 *           dialog's download, a printed code, the reel on a screen): markup that reads no
 *           viewport, laid out at 400px and zoomed to the slot, rendered on the server.
 *
 * Pure data (no component imports): the MDX `Step` and the tests read it without pulling a single
 * picture into their bundle. Every id is drawn by exactly one of `door-screens.tsx` or
 * `desk-screens.tsx` (a `Record` over the kind's ids, so a missing drawing is a type error), and
 * `step-screens.test.ts` holds every `screen="…"` in the library to an id here.
 */

export const PHONE_SCREENS = {
  "door-scan": "The phone's camera over the host's printed code",
  "door-welcome": "The welcome: the event, who is hosting, and Continue",
  "door-password": "The password step",
  "door-chooser":
    "How do you want to join? Continue as guest, Create account or Log in",
  "door-name": "What should we call you?, with the optional email",
  "door-email": "Almost in: your name and email, and Email me a code",
  "door-code": "Check your email, six boxes for the code",
  "door-code-address": "The code screen, the address it went to picked out",
  "door-code-resend": "The code screen counting down to Resend code",
  "door-code-link": "The code screen: or tap the link in the same email",
  "door-code-different": "The code screen: Use a different email",
  "door-photo": "Add your photos, with Skip for now",
  "door-keep": "Sent, then Keep this event",
  "mail-search": "A mailbox searched for Partyreel, the email found in spam",
  "report-open": "The Report this event form, freshly opened",
  "report-reason": "The report form's Reason box, filled in and marked",
  "report-sent": "Thanks, your report has been sent for review",
} as const;

export const DESK_SCREENS = {
  "loop-create": "The new-event wizard at its Design step, Create event",
  "loop-share": "The printed code on a table card at the reception",
  "loop-fill": "The album filling in a browser, two photos just landed",
  "loop-shape": "Review: three uploads waiting, Approve all",
  "loop-keep": "Download album: Everything, Photos or Videos",
  "loop-reel": "The Highlight reel card, and the Look every guest starts on",
  "qr-download":
    "Download the code: SVG (best for print) or PNG (best for screens)",
  "qr-size": "A table card's small code and a sign's large one",
  "qr-margin":
    "The code on white with its margin, never inverted or on a photo",
  "reel-laptop":
    "A laptop signed in as the host, plugged into the room's screen",
  "reel-card": "The event page's Highlight reel card",
  "reel-controls": "The reel's controls at a desk, Play on a screen",
  "reel-screen": "The reel filling a screen: Press anywhere to fill the screen",
} as const;

export type PhoneScreenId = keyof typeof PHONE_SCREENS;
export type DeskScreenId = keyof typeof DESK_SCREENS;
export type StepScreenId = PhoneScreenId | DeskScreenId;

export function isPhoneScreen(id: string): id is PhoneScreenId {
  return Object.hasOwn(PHONE_SCREENS, id);
}

export function isDeskScreen(id: string): id is DeskScreenId {
  return Object.hasOwn(DESK_SCREENS, id);
}

/** What a screen reader hears for the picture (the sentence beside it carries the meaning). */
export function stepScreenLabel(id: StepScreenId): string {
  return isPhoneScreen(id) ? PHONE_SCREENS[id] : DESK_SCREENS[id];
}

/**
 * Articles whose steps may stand without screens, each with why. Kept short on purpose: every
 * other how-to's every step pictures its surface (`step-screens.test.ts`). Empty is the steady
 * state; an entry here is always a debt owed to a lane still in flight.
 */
export const STEPS_WITHOUT_SCREENS: Readonly<Record<string, string>> = {};
