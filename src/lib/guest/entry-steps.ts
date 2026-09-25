/**
 * THE DOOR, AS AN ITINERARY.
 *
 * Pure step-derivation for the guest entry sheet (`entry-modal.tsx`). Kept separate + pure so it is
 * unit-testable and has no client/server imports.
 *
 * The door is ONE HELD SHEET WITH NO EXIT that a guest passes through BEFORE the album: the
 * welcome, the password when the event has one, then who they are, and the first upload asked
 * actively. The album sits blurred behind it the whole way. There is no way out because the album
 * is what justifies the name and email friction, and a "just browsing" exit would defeat that
 * purpose.
 *
 * ★ WHO THEY ARE IS ASKED TWO WAYS, BY THE HOST'S SWITCH (Will, `identity-door` r1 `nudge`: "let's
 * simply have a screen for guests to select how to proceed"):
 *   - a NAME-ONLY event offers the chooser: Continue as guest (the name, with the optional email),
 *     Create account (a name and an email, confirmed by code), or Log in;
 *   - a VERIFICATION event has one path, `identify`, a name and an email confirmed by code, the
 *     same for a new guest and a returning member, because a code creates or signs in alike.
 *
 * ★ THE MACHINE IS HALF SERVER AND HALF CLIENT, AND THAT IS THE ONE STRUCTURAL FACT HERE. The
 * server knows the password and the email (they change `gate`, and the RSC drop re-derives); it
 * cannot know whether THIS BROWSER typed a name, or which way in the guest just picked. So the
 * ordered steps are derived from BOTH: the server's decision, and the client's own facts.
 */
import type { GalleryAccess, GalleryGate } from "@/lib/events/gallery-access";

export type EntryStep =
  | "welcome"
  | "password"
  | "chooser"
  | "name"
  | "identify"
  | "signin"
  | "upload";

/**
 * The way in a guest picked at the chooser. It lives in the modal's state for this visit alone:
 * going back to the chooser clears it, and nothing ever persists it, because a phone at a party
 * belongs to whoever is holding it and the next person picks their own way in.
 */
export type DoorPath = "guest" | "create" | "login";

/** Where each way in leads: the name (with the optional email), a name and email by code, or Log in. */
export const PATH_STEP: Record<DoorPath, EntryStep> = {
  guest: "name",
  create: "identify",
  login: "signin",
};

/**
 * Derive the ordered itinerary + whether the sheet should auto-open.
 *
 * The rules, in order:
 *  1. the owner gets no sheet at all (the host previewing their own event is not a guest), and the
 *     welcome comes first, once per browser per event;
 *  2. `access === "none"` is the password, and nothing after it is knowable yet (the RSC is
 *     redacted), so the itinerary STOPS there and re-derives after the unlock's refresh;
 *  3. a verification event (`gate === "account"`, which the server only answers to a viewer with
 *     no confirmed email) is `identify`, and the itinerary STOPS there too: behind an unmet gate
 *     the server has no opinion about the gates after it;
 *  4. on a name-only event, with no name, not confirmed and not the demo, the CHOOSER, until a way
 *     in is picked: `guest` is the name, `create` is `identify`, `login` is `signin`;
 *  5. a confirmed account with no name yet is the name (the modal asks it in `profile` mode);
 *  6. the upload, when uploads are open and this guest has not contributed: unconditionally when
 *     the host requires one, and otherwise only for a guest who has neither skipped this pass nor
 *     come back to an album they already hold a session for.
 *
 * ★ `autoOpen` IS TRUE WHENEVER A STEP EXISTS, with no "browse the teaser first" exemption: the
 * whole point of the album behind the sheet is that it is the reward being teased, not a lobby.
 *
 * ★ "RETURNING" IS SNAPSHOTTED AT HYDRATION, never re-read. It means "this browser already held a
 * session for this event when the page loaded", and it is what keeps the OFF-state upload step
 * from re-asking a guest who came back to look at the album on Sunday. Re-reading it would flip
 * mid-visit the moment the guest's own join minted a session, and drop the step under their thumb.
 */
export function computeDoor(input: {
  /** The server's decision for this render (and re-derived from every poll). */
  gate: GalleryGate | null;
  access: GalleryAccess;
  /** The server's answer to "has this viewer contributed" for this event. */
  hasContributed: boolean;
  /** The host is accepting uploads (a closed event never asks for one). */
  uploadsOpen: boolean;
  /** The host's switch: ON, the upload step has no skip. */
  requireUpload: boolean;
  /** This browser has seen the welcome for this event. */
  welcomeSeen: boolean;
  /** This browser has a name for this event (typed here, or a confirmed account's profile name). */
  hasName: boolean;
  /** The viewer holds a CONFIRMED account (a confirmed email is its own way in: no chooser). */
  isVerified: boolean;
  /** The way in picked at the chooser this visit, or null before a pick (or after going back). */
  path: DoorPath | null;
  /** This browser's own upload has completed this visit (the client half of `hasContributed`). */
  contributed: boolean;
  /** The guest took the soft skip on the upload step this pass (OFF only; ON offers none). */
  skipped: boolean;
  /** This browser already held a session when the page loaded (snapshotted at hydration). */
  returning: boolean;
  isOwner: boolean;
  /** The demo: it asks no name, and offers the upload. */
  isDemo: boolean;
}): { steps: EntryStep[]; autoOpen: boolean } {
  const {
    gate,
    access,
    hasContributed,
    uploadsOpen,
    requireUpload,
    welcomeSeen,
    hasName,
    isVerified,
    path,
    contributed,
    skipped,
    returning,
    isOwner,
    isDemo,
  } = input;

  if (isOwner) return { steps: [], autoOpen: false };

  const steps: EntryStep[] = [];
  if (!welcomeSeen) steps.push("welcome");

  // The password reveals nothing behind it, so nothing behind it is derivable yet.
  if (access === "none") {
    steps.push("password");
    return { steps, autoOpen: true };
  }

  // ★ A SERVER GATE IS TERMINAL FOR THE STEPS BEHIND IT, for the same reason the password is: the
  // resolver answers the FIRST unmet gate and never evaluates the ones after it, so behind an
  // unconfirmed email the server has no opinion at all about whether this guest has contributed.
  // The itinerary stops here and re-derives on the confirmation's refresh. There is no chooser on
  // this event: a code signs a member in and creates a newcomer alike, so one path serves both.
  if (gate === "account") {
    steps.push("identify");
    return { steps, autoOpen: true };
  }

  // ★ THE DEMO ASKS NO NAME. Nothing it adds is persisted, so there is no row to name and a form
  // between the tap and the picture would be the one lie the demo tells. Its welcome is the role
  // step, and its upload step wears "Look around" as the skip.
  if (!hasName && !isDemo) {
    if (isVerified) {
      // A confirmed account is already somebody; only its name is missing.
      steps.push("name");
    } else {
      steps.push(path === null ? "chooser" : PATH_STEP[path]);
    }
  }

  if (
    uploadsOpen &&
    !hasContributed &&
    !contributed &&
    // ★ THE SKIP AND "RETURNING" BOTH BELONG TO THE OFF STATE ALONE. ON, there is no skip to
    // press and coming back tomorrow is not a contribution, so neither flag can reach the step:
    // the guard is here rather than in the UI, so a stale flag from an earlier pass (or a host
    // flipping the switch on mid-visit) can never hand a guest an album they did not pay for.
    (requireUpload || (!skipped && !returning))
  ) {
    steps.push("upload");
  }

  return { steps, autoOpen: steps.length > 0 };
}

/** Where the back chevron goes: a view over the machine (welcome, name) or the chooser itself. */
export type DoorBack = "welcome" | "chooser" | "name";

/**
 * THE BACK CHEVRON, DECIDED IN ONE PLACE.
 *
 * - The welcome has nothing behind it; the password and the chooser go back to it (the guest can
 *   always re-read what this is).
 * - A step reached by a way in picked at the chooser goes back to the CHOOSER, which clears the
 *   pick (a real change of the machine's input, so a second pick starts clean).
 * - The same step reached any other way (a verification event's `identify`, a confirmed account's
 *   name) goes back to the welcome.
 * - The upload goes back to the name, the step it followed; the demo asks no name and a confirmed
 *   account's name is not this album's to revisit, so theirs goes back to the welcome.
 *
 * The welcome and the name are transient VIEWS over the machine (the modal shows them without
 * touching `markSeen` or the steps); only the chooser changes an input.
 */
export function doorBack(input: {
  current: EntryStep | null;
  path: DoorPath | null;
  gate: GalleryGate | null;
  isVerified: boolean;
  isDemo: boolean;
}): DoorBack | null {
  const { current, path, gate, isVerified, isDemo } = input;
  switch (current) {
    case null:
    case "welcome":
      return null;
    case "password":
    case "chooser":
      return "welcome";
    case "name":
    case "identify":
    case "signin": {
      const viaChooser =
        path !== null &&
        gate !== "account" &&
        !isVerified &&
        PATH_STEP[path] === current;
      return viaChooser ? "chooser" : "welcome";
    }
    case "upload":
      return isDemo || isVerified ? "welcome" : "name";
  }
}

/**
 * WHEN THE CLIENT'S HALF OF "HAS CONTRIBUTED" RETIRES.
 *
 * `computeDoor` closes the upload step on EITHER half: the server's `hasContributed`, or the
 * browser's own `contributed` (an upload completed this visit, before any refresh landed), because
 * right after a first upload the page still carries the server's stale `upload` gate and the step
 * must drop at once. But on a Require-an-upload-to-view event the server can TAKE a contribution
 * back (a guest's own delete stops counting), and the browser's flag, true all visit, would then
 * hold the step shut against a server that says "upload": a guest who removed their only upload
 * would be stranded at the teaser with no door at all.
 *
 * So the client's flag stands only until the server has ANSWERED since it: once the gate is seen
 * off `upload` while this visit's contribution stands, the server has counted it, and from then on
 * its gate alone decides. Returns the sticky "answered" bit; the caller keeps it across renders and
 * passes `contributed && !answered` to `computeDoor`. With the switch OFF the resolver never
 * evaluates the gate, so the client's flag is the only half and never retires (the OFF state's soft
 * step must not reappear after an upload).
 */
export function contributionAnswered(input: {
  /** Whatever this returned last render (false on the first). */
  answered: boolean;
  /** The browser's own half: an upload of this visit completed. */
  contributed: boolean;
  gate: GalleryGate | null;
  requireUpload: boolean;
}): boolean {
  return (
    input.answered ||
    (input.requireUpload && input.contributed && input.gate !== "upload")
  );
}
