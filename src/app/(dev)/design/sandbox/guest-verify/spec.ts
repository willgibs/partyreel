import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE IDENTITY SHAPE, WHOLE (round two, 2026-09-20).
 *
 * ★ HIS SUMMING-UP IS THE BRIEF, verbatim (Will, 2026-09-20, `guest-verify` r1
 * `collision`): "We either need a good login/verification system, or maybe we
 * just need to fall back to the magic link or a similar idea. Passwords don't
 * prove ownership either. Consider all of our ideas and systems up until now
 * unprotected and open to relitigation for best overall idea to streamline
 * account identity." And on `expiry`: "Sorry if any of these selections are
 * starting to cross wires. May have to relitigate."
 *
 * So all four of round one's rulings (`gate=after`, `badge=mark`,
 * `host-lens=badge`, `expiry=host`) are HELD rather than wired, and this round
 * draws the shape they imply, whole, with each of them named on the frames that
 * rest on it. An option that would change one says so on its own frame.
 *
 * ★ WHAT ROUND ONE GOT WRONG, CORRECTED BEFORE ANYTHING WAS DRAWN. Its wall
 * strip said typing a code rides "a bucket of 30, not configurable" and that
 * sending was capped at 30 an hour project-wide, which together read as "most
 * guests cannot confirm that night". Supabase's current Auth rate-limit table
 * says otherwise: `/auth/v1/verify` is 360 an hour PER IP with bursts up to 30
 * (a room drains the burst, then clears at about six a minute), `/auth/v1/otp`
 * is 360 an hour project-wide and customizable, and the "30 an hour" figure is
 * the custom-SMTP emails cap, which is ours to raise. The true risk is smaller
 * and differently shaped: a mail can still fail, and a room at the door queues.
 * Every number on this board is the DOCUMENTED default, labelled as documented;
 * the project's CONFIGURED numbers are the one thing the board needs from him
 * and ride the carried call `numbers`.
 *
 * ★ THE THREE JOBS ONE EMAIL GATE WAS DOING. Credit (who added this) needs no
 * proof. Ownership (mine across events, my profile, my deletions) needs proof
 * only when ownership matters. Safety (the host's) was served by the gate and
 * has to be served by something else once the gate opens. Every decision below
 * is one of those three, separated.
 *
 * ★ FIVE DECISIONS, AND THE FIRST MOVES THE OTHERS. `address` decides whether
 * an unproven string exists at all; `allowance` decides who pays once the gate
 * is gone; `unproven` decides what a guest sees; `collision` is his case 2 with
 * his other two drawn beside it as settled fact; `gate-switch` decides what is
 * left of the host's control. Each is drawn on the shipped door, album, guest
 * list, queue and settings sheet at 375 with 1440 on the knob.
 *
 * ★ EVERY CONTROL DEFAULTS TO ITS OWN RECOMMENDATION HERE, WHICH IS DELIBERATE
 * and the one place this board departs from `Decision.today`. Only `allowance`
 * has an option that IS the surface as built (`open` is what an anonymous
 * upload gets today on an open event); nothing else here exists in the product
 * at all, because an unproven session cannot exist today. The recommendations
 * are therefore ONE coherent proposed shape, and each frame is drawn standing
 * inside it: `collision` reads the board's `address` answer and says out loud
 * when an option is not reachable under it.
 *
 * ★ NO PRODUCTION BYTE. The migrations either shape needs are WRITTEN ONLY, in
 * this lane's Handoff, and applied by nobody.
 */

/** The screen every decision shares. Phone first: a guest is at a party. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/**
 * ★ `address` ON `collision`'s OWN STRIP, and it is not decoration. Decision
 * one decides whether an unproven address exists, and two of `collision`'s
 * three answers cannot be built without one. The constructor dedupes controls
 * by id and the DERIVED `address` control is declared first, so this mirror
 * never displaces it: it only puts the knob on the step where the answer
 * depends on it (`exploration.ts`, `byId`).
 */
const ADDRESS_MIRROR: Control = {
  id: "address",
  label: "A typed address",
  options: [
    { id: "none", label: "Never typed at the door" },
    { id: "private", label: "Typed, kept private" },
    { id: "public", label: "Typed, public credit" },
  ],
  default: "none",
};

const DRAFT = defineExploration({
  id: "guest-verify",
  title: "Verify, or badge",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round one ruled four and held all four on his own May have to relitigate. This round drops the six and draws the shape they imply, whole: what a typed address does, who pays once the gate is gone, what a guest sees, his case 2, and what the host's switch becomes. The wall is re-measured.",
  },
  context:
    "Identity has three jobs one email gate was doing at once: credit needs no proof, ownership needs proof only when ownership matters, and safety was the gate's and now needs something else. The key is the session, the device's own guest row, and it already ships. Proof is the code, later, from anywhere. Three ideas are refused on the frames with the cost that refused them, so they are not proposed again.",
  bible: [1, 4, 20, 22],
  carried: [
    {
      id: "numbers",
      question:
        "Are the rate limits drawn here this project's configured numbers, or Supabase's documented defaults?",
      taken:
        "The documented defaults, labelled as documented, re-read this round. Round one drew them wrong and read as a wall.",
      overrule:
        "Three reads in the dashboard (Authentication, Rate Limits) replace them, and the board swaps them in without redrawing anything.",
    },
    {
      id: "handful",
      question:
        "How many photographs is a handful, on the allowance the gate leaves behind?",
      taken:
        "Ten a session, no video. A room of 120 who all stay unproven spends 4.8 GB of a Free host's 20 GB month.",
      overrule:
        "It is one constant and any number fits the same shape; only open has no number at all.",
    },
    {
      id: "vouch",
      question:
        "May a host clear an unconfirmed mark themselves, for a guest they know?",
      taken:
        "Yes, once, inside that one event. It grants no verified state, no profile, no claim and no extra reach.",
      overrule:
        "Drop it and a guest whose mail never arrives wears the mark all night with nobody able to help.",
    },
  ],
  asks: [
    {
      id: "address",
      label: "A typed address",
      question:
        "What does a typed address do on a session that has proved nothing?",
      context:
        "Drawn as the door a guest meets and the three surfaces the string reaches: the guest list, the host's lightbox, their own photos. On all three the address authorises nothing, because the address as a key is a refusal drawn beside them.",
      options: [
        {
          id: "none",
          label: "The door asks a name",
          means:
            "No unproven address exists anywhere. The only field that takes one is the sign-in door, where the code proves it by construction.",
        },
        {
          id: "private",
          label: "Typed, kept private, never mailed",
          means:
            "Kept beside the session as a claim. The host sees it in a slot that says typed and unconfirmed; other guests never see it at all.",
        },
        {
          id: "public",
          label: "Typed, public credit, marked",
          means:
            "Whatever a guest types is their credit in the album, wearing the mark. Proof of that address anywhere then scrubs every unproven copy.",
        },
      ],
      recommended: "none",
      because:
        "It answers his cases 1 and 3 by construction rather than by rule: there is no unproven address to reassign, and none for two people to share. It is also his own account=after ruling carried the rest of the way, and it is the only answer with no string a stranger can put in somebody else's name.",
      overrule:
        "If a host must be able to guess who an unconfirmed guest was, private keeps the hint, in a slot that can never be the verified one.",
      lands:
        "Whether guests.claimed_email is ever written, and what the host's lightbox is allowed to show beside a verified address.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "allowance",
      label: "The allowance",
      question:
        "What may a session that has proved nothing add, now that a mail can no longer stop it?",
      context:
        "The host's month is the measurement on every frame, because it is invisible in the product: the meter counts bytes uploaded and never decrements, so a delete frees the storage cap and never the month.",
      options: [
        {
          id: "handful",
          label: "Ten photographs, then one tap",
          means:
            "A fixed count per session, no video, until an address is proved. Everything already added stays, and the ask arrives after ten rather than before one.",
        },
        {
          id: "budget",
          label: "A budget the host can raise",
          means:
            "A per-event pool of unconfirmed photographs on the settings sheet. The fiftieth guest can be stopped by the first, and the host is the only remedy.",
        },
        {
          id: "open",
          label: "No cap at all",
          means:
            "A session that proved nothing has the reach of one that proved everything. One script with a public link spends a Free host's whole month.",
        },
      ],
      recommended: "handful",
      today: "open",
      because:
        "It is the only bound that scales with the guest list rather than with the internet, needs no host to find a control mid-party, and asks the guest at the moment they are most willing: after ten photographs are safely in, not before the first.",
      overrule:
        "If any number at all is a guest stopped mid-party, open removes it, and the host pays for every stranger who ever scans the code.",
      lands:
        "Whether an unproven session has a bound at all, and whether the host's month has any per-person cost once the gate opens.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "unproven",
      label: "What a guest sees",
      question:
        "Where does an unproven photograph go, and what does a guest see about the person who added it?",
      context:
        "Two of his held rulings meet here, so two answers change one and say so. Drawn on the album, the faces row, the tapped pop-up and the profile, the three surfaces his badge note named, with the host's queue beside them.",
      options: [
        {
          id: "shown-marked",
          label: "Live, with the subtle mark",
          means:
            "His two rulings drawn: it goes straight into the album, and a small dot with a tooltip rides the tile, the avatar, the pop-up and the profile.",
        },
        {
          id: "shown-plain",
          label: "Live, and nothing is said",
          means:
            "It goes into the album and no guest-facing surface says an address went unproven. The host's queue still names it.",
        },
        {
          id: "held",
          label: "Held until a code lands",
          means:
            "The host sees it at once; guests see it once proved, under a line saying how many are waiting. This changes gate=after for guests.",
        },
      ],
      recommended: "shown-marked",
      because:
        "His own reason for the mark is the strongest argument here and it is not about safety: he expects a guest to see themselves marked and want to fix it. The mark is a prompt aimed at the one person who can clear it, and its tap is the door rather than an explanation.",
      overrule:
        "If marking five of twenty-three reads as an accusation to the twenty-two who can do nothing, shown-plain keeps the fact with the host alone.",
      lands:
        "Whether an avatar ever carries a trust state, which surfaces may draw it, and whether anything is ever pending on an email.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "collision",
      label: "The returning guest",
      question:
        "A guest who has an account, not signed in, adds photos at a second event. Are they uploading as themselves?",
      context:
        "His case 2. Cases 1 and 3 are settled by the session key and drawn beside it as fact, with the passed phone and the unproven string in the host's lightbox. The answer depends on decision one, and the frame says so.",
      options: [
        {
          id: "offer",
          label: "Offered to everyone, after the first photo",
          means:
            "Sign in to keep your photos together, shown to every guest whether or not an account exists, so the door reveals nothing by offering it.",
        },
        {
          id: "label",
          label: "A labelled session, merged later",
          means:
            "Nothing is offered and nothing is said. The code merges tonight's photographs the day she signs in from this same phone, and never from another.",
        },
        {
          id: "require",
          label: "An existing account must prove it first",
          means:
            "The door says the address has an account and asks for the code. It is the enumeration oracle, drawn so its cost can be read.",
        },
      ],
      recommended: "offer",
      because:
        "It is the only one that answers his question without the door learning anything about who exists: the same sentence is shown to everybody, so it cannot be used to test an address. Her photographs are in the album on all three answers; this is about whether they ever become part of hers.",
      overrule:
        "If a guest should never be asked twice, label is silent, at the cost of a merge that only ever happens on one phone and is never mentioned.",
      lands:
        "Whether a guest's photographs follow them across events, and whether any door in the product ever confirms an address exists.",
      tile: "phone",
      configs: [SCREEN, ADDRESS_MIRROR],
    },
    {
      id: "gate-switch",
      label: "The host's switch",
      question:
        "What becomes of Require accounts to upload, once uploading no longer requires an account?",
      context:
        "The switch has always done two jobs under one name: it gates the VIEW as well as the upload, so a signed-out visitor gets the teaser. His gate=after ruling retires the upload half by itself.",
      options: [
        {
          id: "two",
          label: "Two rows: to view, and to add",
          means:
            "Both jobs, named apart. The second row lets a host block an upload on a mail arriving again, which is what his ruling was for.",
        },
        {
          id: "one",
          label: "One row, gating the view",
          means:
            "The job it was really doing. Adding is always open under the allowance, which no host has to know exists.",
        },
        {
          id: "none",
          label: "The switch retires",
          means:
            "Private, password and open govern the view; the allowance and the queue are the protection. Every event already gated this way opens.",
        },
      ],
      recommended: "one",
      because:
        "The upload half is dead the moment his ruling lands, and the view half is a real and separate promise a host made: none of the three visibility states is an identity gate, so retiring it leaves a host a shared secret or nothing, and opens every album already set this way.",
      overrule:
        "If a host should still be able to insist on an account before a photo, two keeps that, and with it the blocked guest his gate ruling was meant to end.",
      lands:
        "Whether an event can ask a visitor who they are before showing the album, and what the settings sheet's uploads section holds.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID (the standing precedent, and now the constructor's own
 * job). `defineExploration` already dedupes by id, so this filter is belt and
 * braces the other boards carry and this one keeps: deduping twice is deduping
 * once, and the day the constructor changes, the screen knob does not arrive
 * five times in the dock.
 */
export const GUEST_VERIFY: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
