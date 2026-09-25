import { Images, QrCode, Sparkles, type LucideIcon } from "lucide-react";

/**
 * THE LOOP, TOLD FROM BOTH SIDES: the ONE source for every surface that tells
 * it: the /how-it-works walkthrough, the shared "How it works" overview
 * stepper (the home's passage), and the first-time host's welcome tutorial.
 *
 * ★ SIX STEPS PER PERSPECTIVE, AND THE TWO SETS ARE THE SAME LENGTH BY
 * CONTRACT (Will, 2026-09-19, `steps=six` plus his toggle ask: "let's include a
 * toggle above the steps to switch between Host/Guest perspective, and have
 * custom steps for each to see both sides"). The spine keeps ONE <Reveal> per
 * index and swaps its contents, so equal lengths are what lets the toggle
 * change the words without replaying six entrance animations;
 * `LOOP_STEP_COUNT` is the number both sets answer to and the stepper counts
 * against.
 *
 * ★ STEP ONE TELLS THE TRUTH ABOUT WHEN AN EVENT EXISTS. The shipped copy said
 * the event "is live the moment you create it", which reads as "the moment you
 * type a name": create-event-wizard.tsx writes the row ONCE, at the end of the
 * Design step, on the "Create event" button ("nothing is persisted until the
 * host commits (no abandoned events)"). The host's first body says finishing is
 * what creates it, which is both truer and a better promise.
 *
 * ★ THE TITLES ARE VERB-FIRST AND PARALLEL ACROSS BOTH SETS (his note on the
 * same pick: "These headings could be adjusted a bit to feel more clean"). Six
 * short phrases a reader can hold in their head, the two sides ending on the
 * same object from opposite ends: the host CUTS the reel, the guest GETS it.
 *
 * Copy is open and lives here alone: a rewrite is one edit, never a
 * hunt through three surfaces.
 */

/** Which side of the loop a step set is told from. */
export type LoopPerspective = "host" | "guest";

/**
 * A step's picture id. The components live beside the page
 * (sections/how-it-works/{host,guest}-pictures.tsx); this module stays pure
 * data so a node test can read the story without pulling JSX in with it.
 */
export type LoopPictureId =
  | "create"
  | "share"
  | "fill"
  | "shape"
  | "keep"
  | "reel"
  | "scan"
  | "door"
  | "add"
  | "room"
  | "save"
  | "arrives";

export type LoopStep = {
  /** Stable across a copy rewrite; the React key and the picture's id. */
  id: LoopPictureId;
  title: string;
  body: string;
  /** The door deeper into this moment (the progressive-disclosure ladder:
   *  this page orients, the feature pages carry the depth). */
  href: string;
  linkLabel: string;
};

/** THE HOST'S SIX: what you set up, in the order a real event runs. */
const HOST_STEPS: readonly LoopStep[] = [
  {
    id: "create",
    title: "Create the event",
    body: "Name it, pick a QR style, and finish. Finishing is what creates the event: one permanent link that is live from that moment, and a code that is the link in scannable form.",
    href: "/features/qr",
    linkLabel: "Inside the QR code",
  },
  {
    id: "share",
    title: "Share one code",
    body: "Put the code where people already are: on the invite, a table card, a welcome sign, the screen at the front. One code covers the whole room, all evening.",
    href: "/features/guests",
    linkLabel: "What guests see",
  },
  {
    id: "fill",
    title: "Watch it fill",
    body: "Photos and videos land in the album as they are taken, from every phone in the room. Watch it fill from where you are sitting, or put it on a screen so everyone can.",
    href: "/features/album",
    linkLabel: "Inside the live album",
  },
  {
    id: "shape",
    title: "Shape what shows",
    body: "Turn on review and new uploads wait for your approval, or let everything appear live and tidy up afterward. Approve the lot in one tap, hide anything with another.",
    href: "/features/curation",
    linkLabel: "How curation works",
  },
  {
    id: "keep",
    title: "Take it all home",
    body: "Everything comes back out at the size it went in. Save one favorite on the spot, or download the whole album as a single zip, photos and video together.",
    href: "/features/sharing",
    linkLabel: "Sharing and downloads",
  },
  {
    id: "reel",
    title: "Cut the reel",
    body: "One tap on Create reel and the event cuts itself into a highlight video. Pick a style from the catalog and render it free, right on your phone.",
    href: "/reel",
    linkLabel: "Everything about the reel",
  },
];

/**
 * THE GUEST'S SIX: the same evening from the other side of the code. Written
 * new for the toggle (the board only ever had the host's), in the guest's own
 * register: a guest is a person at a party, not a user of a product.
 */
const GUEST_STEPS: readonly LoopStep[] = [
  {
    id: "scan",
    title: "Scan the code",
    body: "Point a camera at the code on the table and the event opens in the browser that is already on the phone. Nothing to install, nothing to set up.",
    href: "/features/qr",
    linkLabel: "Inside the QR code",
  },
  {
    id: "door",
    title: "Step inside",
    body: "A welcome screen names the event and asks what to call you, then for a first photo, and the album opens. When the host asks guests to verify, a one-time code by email is the whole sign-in.",
    href: "/features/guests",
    linkLabel: "What guests see",
  },
  {
    id: "add",
    title: "Add your photos",
    body: "The door asked for the first one. After that, Add photos is on every screen: pick from the camera roll and they upload at the size they were shot. Video too, wherever the host's plan carries it.",
    href: "/features/album",
    linkLabel: "Inside the live album",
  },
  {
    id: "room",
    title: "See the room fill",
    body: "Everyone is adding at once, and the album grows while it happens. The best shot of the evening is usually taken by somebody else.",
    href: "/features/privacy",
    linkLabel: "Who can see the album",
  },
  {
    id: "save",
    title: "Save what you love",
    body: "The album is one link, and it stays open afterward. Open any photo and save it at full size, or take the whole album as a zip.",
    href: "/features/sharing",
    linkLabel: "Sharing and downloads",
  },
  {
    id: "arrives",
    title: "Get the reel",
    body: "When the host cuts the highlight reel, it lands in the same album you have been adding to. Watch it, save it, send it to whoever missed it.",
    href: "/reel",
    linkLabel: "Everything about the reel",
  },
];

/** The two step sets, read by the walkthrough and the overview stepper. */
export const LOOP_STEPS: Record<LoopPerspective, readonly LoopStep[]> = {
  host: HOST_STEPS,
  guest: GUEST_STEPS,
};

/**
 * ★ BOTH SETS ARE THIS LONG. The spine's Reveal reuse and the stepper's
 * "N of 6" both read it, and `loopSteps` asserts it, so a seventh host step
 * added without a seventh guest step fails the page rather than the eye.
 */
export const LOOP_STEP_COUNT = 6;

/** The toggle's two buttons, in order; `label` is what the pill reads. */
export const LOOP_PERSPECTIVES: readonly {
  id: LoopPerspective;
  label: string;
  /** One line under the pill, so the toggle says what it just switched to. */
  legend: string;
}[] = [
  { id: "host", label: "Host", legend: "What you set up, start to finish." },
  {
    id: "guest",
    label: "Guest",
    legend: "What the people at your event see and do.",
  },
];

/** One perspective's steps, with the equal-length contract enforced. */
export function loopSteps(perspective: LoopPerspective): readonly LoopStep[] {
  const steps = LOOP_STEPS[perspective];
  if (steps.length !== LOOP_STEP_COUNT) {
    throw new Error(
      `The ${perspective} loop tells ${steps.length} steps; both sets tell ${LOOP_STEP_COUNT}.`,
    );
  }
  return steps;
}

/** A string is one of the two perspectives (the toggle's state). */
export function isLoopPerspective(v: string | undefined): v is LoopPerspective {
  return v === "host" || v === "guest";
}

export type HowItWorksStep = { icon: LucideIcon; title: string; body: string };

/**
 * THE FIRST-TIME HOST'S THREE-STEP TUTORIAL, DERIVED from the host's six
 * (welcome-flow.tsx, Phase 6) rather than written a second time: the three the
 * tutorial has always told ARE the host's first three, so the story a host
 * reads inside the app and the story they read on the site cannot drift. The
 * icons are the tutorial's own, because there it is a three-row list rather
 * than a picture.
 */
const WELCOME_STEP_IDS = ["create", "share", "fill"] as const;
const WELCOME_ICONS: Record<(typeof WELCOME_STEP_IDS)[number], LucideIcon> = {
  create: Sparkles,
  share: QrCode,
  fill: Images,
};

export const HOW_IT_WORKS: HowItWorksStep[] = WELCOME_STEP_IDS.map((id) => {
  const step = HOST_STEPS.find((s) => s.id === id);
  if (!step)
    throw new Error(`The welcome tutorial quotes a missing step: ${id}`);
  return { icon: WELCOME_ICONS[id], title: step.title, body: step.body };
});
