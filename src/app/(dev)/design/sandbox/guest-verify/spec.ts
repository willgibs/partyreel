import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * VERIFY, OR BADGE (2026-09-20): the guest door's confirmation, re-asked.
 *
 * ★ HIS ASK, BY NAME (Will, 2026-09-19, `voice` r1 `gate=ask`, verbatim): "this
 * is a big one, I've been wondering about whether we should skip requiring
 * email confirmation to upload in favor of a verified/unverified email
 * ownership badge on avatars or something. A huge fear of mine is that at one
 * event on a shared network, either users can't get the email confirm email or
 * we have a problem that stops sending them, blocking everyone from creating an
 * account to upload. This continues to provide safety, without ever blocking
 * the core upload feature. However, we'd need extra safety considerations here,
 * such as what happens if a user goes to create an account under an email that
 * already exists but is unverified. Worth 1+ exploratory tracks."
 *
 * His own gate SENTENCE was ruled and is wired ("For safety, the host has
 * requested you confirm your email. One tap and you're in.", `DOOR_WEAR.gate`).
 * This board does not touch it. It asks the question underneath it.
 *
 * ★ WHAT IS TRUE TODAY, read out of the tree rather than remembered:
 *  - `events.allow_anonymous_uploads` defaults FALSE, so accounts are required
 *    (migration 20260621170000).
 *  - The account step is Supabase Auth OTP: one email carrying a 6-digit code
 *    AND a magic link, verified in-page by `verifyOtp` (`email-sign-in.tsx`).
 *    Typing the code IS the confirmation; there is no other way to a session.
 *  - The hard gate is POSTGRES, not the app: `create_guest` raises "This event
 *    requires an account to upload." when the event requires an account and the
 *    caller has no `email_confirmed_at`. The address on `guests.email` is read
 *    from `auth.users` under definer privilege — verified at join, never the
 *    client's word.
 *  - A failed send is one `FailurePaths` block and a Resend button on a 60s
 *    cooldown.
 *  - Nothing in the product distinguishes a verified guest from an unverified
 *    one, because today there is no such thing as an unverified one.
 *
 * ★ SIX DECISIONS, AND THE FIRST ONE MOVES THE OTHER FIVE. `gate` decides
 * whether an unproven upload can exist at all; `badge` asks who is told;
 * `collision` asks what an unproven address IS (a key or a label), which is the
 * security core; `outage` is the remedy for the failure he actually named;
 * `host-lens` is what the host holds; `expiry` is the only one with a
 * data-loss cost. Each is drawn on the shipped door, the shipped album, the
 * shipped guest list and the shipped review queue. Never `/admin`.
 *
 * ★ NO PRODUCTION BYTE. The proposed migration (one nullable column on
 * `guests`, and nothing on `media` or on Supabase Auth) is written out in this
 * lane's Handoff as SQL and applied by nobody.
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
 * ★ `gate` ON `badge`'s OWN STRIP, and this is not decoration. The badge's
 * AUDIENCE depends on the gate: under `held` nothing unproven ever reaches a
 * guest's screen, so a guest-facing mark labels people whose photographs nobody
 * has seen; under `after` the mark is standing next to the photograph it is
 * about. Same mark, two different jobs. The constructor dedupes controls by id
 * and the DERIVED `gate` control is declared first, so this mirror never
 * displaces it — it only puts the knob on the step where the answer depends on
 * it (`exploration.ts`, `byId`).
 */
const GATE_MIRROR: Control = {
  id: "gate",
  label: "The gate",
  options: [
    { id: "before", label: "Confirm first, as today" },
    { id: "after", label: "Upload now, the photo marked" },
    { id: "held", label: "Upload now, held until confirmed" },
  ],
  default: "before",
};

const DRAFT = defineExploration({
  id: "guest-verify",
  title: "Verify, or badge",
  round: {
    n: 1,
    date: "2026-09-20",
    changed:
      "The first round of the question his gate ruling left open: whether a guest must confirm an email before uploading at all, and what the product has to grow if the answer is no. Six decisions on the shipped door, album, guest list and review queue, phone first.",
  },
  context:
    "Today Postgres refuses: `create_guest` raises when the event requires an account and the caller's address is not confirmed, so a code that never arrives is a guest who never contributes. The address on a guest row is read from `auth.users`, never from the client, and nothing anywhere says a guest is unverified, because today one cannot be. Every option below changes exactly one thing about that.",
  bible: [1, 4, 15, 21],
  carried: [
    {
      id: "mechanism",
      question:
        "What is an unverified account, when the only way to a session today is the code that confirms it?",
      taken:
        "This browser's anonymous guest row, plus one nullable claimed-address column. No change to Supabase Auth at all.",
      overrule:
        "A real unconfirmed auth session means turning Confirm-email off platform-wide, which un-proves every host too.",
    },
    {
      id: "badge-audience",
      question:
        'His note put the badge "on avatars". Does the board recommend putting it there?',
      taken:
        "No. Both guest-visible forms are drawn with their cost on the frame, and the recommendation is host-only.",
      overrule:
        "Answer `mark` or `ring` and the state rides every guest's screen, five faces in twenty-three.",
    },
    {
      id: "numbers",
      question:
        "Are the rate limits on the wall this project's configured numbers or Supabase's defaults?",
      taken:
        "Supabase's current documented defaults, labelled as such. The shapes (per IP, project-wide) are exact.",
      overrule:
        "The dashboard's real figures are one read away, and only the send cap can be raised; the verify cap cannot.",
    },
  ],
  asks: [
    {
      id: "gate",
      label: "The gate",
      question:
        "When does a guest's email get confirmed: before their photograph is uploaded, or after it is already in?",
      context:
        "Drawn as the guest's own screen one second after they pressed Add, on the shipped door and the real album. All three use the same door and the same code; what moves is what has happened to the photograph by then.",
      options: [
        {
          id: "before",
          label: "Confirm first, as today",
          means:
            "The shipped gate. Nothing is uploaded until a code is typed, so a code that never arrives is a guest who never contributes.",
        },
        {
          id: "after",
          label: "Upload now, the photo marked",
          means:
            "The photograph goes live in the album straight away, wearing an unconfirmed mark until the code is typed.",
        },
        {
          id: "held",
          label: "Upload now, held until confirmed",
          means:
            "It is in and safe, and nobody sees it until the code is typed. It rides the `pending` status the review queue already has.",
        },
      ],
      recommended: "held",
      today: "before",
      because:
        "It is the only answer that keeps both halves of his own sentence at once: the upload is never blocked, and nothing unproven ever reaches the party. The host's setting goes on meaning what it said, and no new media status is invented.",
      overrule:
        "If a photograph vanishing into a review a guest never asked for is worse than an unproven one on show, `after` puts it live with the mark.",
      lands:
        "Whether a failed email can stop an upload at all, and what a pending row can be waiting on.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "badge",
      label: "The badge",
      question:
        "What does an account whose address is not confirmed show, and who is shown it?",
      context:
        "His own idea, drawn literally, with its cost beside it: the album's guest list is twenty-three people a guest knows, five of them marked. Flip the gate on this strip; under `held` nothing unproven is here at all.",
      options: [
        {
          id: "mark",
          label: "A mark on the avatar, everywhere",
          means:
            "A small amber mark rides the five unconfirmed faces in the album's guest list, where every guest reads it.",
        },
        {
          id: "ring",
          label: "A dimmed, dashed rim, everywhere",
          means:
            "The same fact at its quietest: no glyph, a dashed rim only someone already looking for it will read.",
        },
        {
          id: "host",
          label: "The host sees it, guests never do",
          means:
            "A guest's album says nothing. The host's own guest list names the state in words, with a count beside it.",
        },
        {
          id: "none",
          label: "Nothing, anywhere",
          means:
            "Confirmation stays a gate and never becomes a label. No surface says an address went unproven.",
        },
      ],
      recommended: "host",
      today: "none",
      because:
        "Under the recommended gate nothing unproven reaches a guest's screen, so a guest-facing mark labels people whose photographs nobody has seen and hands nobody an action. The safety is the host's, and so is the fact.",
      overrule:
        "His own words put it on avatars. If a guest should judge whose photographs to trust, `ring` is the quietest form that still says so.",
      lands:
        "Whether an avatar ever carries a trust state, and which surfaces are allowed to draw it.",
      tile: "phone",
      configs: [SCREEN, GATE_MIRROR],
    },
    {
      id: "collision",
      label: "The collision",
      question:
        "Someone enters an address that already has an unconfirmed account waiting. Where do the photographs end up?",
      context:
        "The one he flagged, and not a screen: all three look like an ordinary door to the person standing at it. What differs is where five photographs land, so it is the flow, with the second person's screen beside it.",
      options: [
        {
          id: "session",
          label: "The photos stay with the browser",
          means:
            "The address is a label on this browser's guest row. Confirming from the same browser claims them; from another, they stay anonymous.",
        },
        {
          id: "email",
          label: "The photos follow the address",
          means:
            "They attach to the account for that address the moment it is typed, so whoever confirms it inherits them.",
        },
        {
          id: "refuse",
          label: "The second person is turned away",
          means:
            "An address with an unconfirmed account waiting is refused at the door, and that guest has to use another one.",
        },
      ],
      recommended: "session",
      because:
        "It is the only answer where a stranger's photographs can never become Bob's, and it is the path we already ship: an anonymous guest row plus the claim that runs on sign-in. It adds a label, not a mechanism.",
      overrule:
        "If two people typing one address must be told so, `refuse` says it, at the cost of a dead end and a door that confirms the address exists.",
      lands:
        "What an unproven address IS: a key, or a label. Every other answer on this board rests on it.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "outage",
      label: "The outage",
      question:
        "The codes stop arriving in the middle of a party. What gets everyone back in?",
      context:
        "Measured, not imagined, and drawn under all three: typing a code is capped PER IP and is the one row Supabase will not raise, while sending one is capped PROJECT-WIDE. A venue's Wi-Fi is one IP.",
      options: [
        {
          id: "bypass",
          label: "A switch the host sets beforehand",
          means:
            "The shipped “Require accounts” switch, turned off. It costs nothing to build and everything to remember.",
        },
        {
          id: "window",
          label: "A door the host opens for a few hours",
          means:
            "A live, time-boxed control on the settings sheet: let everyone in for three hours, and it closes itself.",
        },
        {
          id: "channel",
          label: "A code by text instead",
          means:
            "A second delivery path for when email fails. It costs money per message and a phone number we have never held.",
        },
      ],
      recommended: "window",
      today: "bypass",
      because:
        "The failure is discovered at the party, never before it. A switch already flipped is not a remedy and a permanent one never gets flipped back, so a door that shuts itself is the only one that is both reachable and temporary.",
      overrule:
        "If the host is holding a microphone rather than a phone, `bypass` is the only remedy that needs nobody at the moment it fails.",
      lands:
        "Whether an event can ever have a time-boxed open door, and where a host reaches for it.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "host-lens",
      label: "The host's lens",
      question:
        "What does the host's review queue say about who sent each photograph?",
      context:
        "Under the recommended gate the queue holds two things: uploads waiting for the host, and uploads waiting for a code no tap of theirs can hurry. Drawn on nine real items, four of them unproven.",
      options: [
        {
          id: "today",
          label: "One queue, as today",
          means:
            "Nine items in one grid. Nothing on the screen says which four are waiting on a code rather than on the host.",
        },
        {
          id: "badge",
          label: "Every card says who, and whether",
          means:
            "The queue stays one list, and each tile carries the uploader's name and their confirmed state.",
        },
        {
          id: "split",
          label: "Two piles, each with its own count",
          means:
            "“Waiting for you” and “waiting for an email”. The second empties itself and asks the host for nothing.",
        },
      ],
      recommended: "split",
      today: "today",
      because:
        "It is the only one that tells a host what their workload actually is. A mark on each card answers “who” one card at a time; the split answers “how much of this is mine”, which is the question a host opens the queue with.",
      overrule:
        "If the queue should only ever be one list in time order, `badge` keeps it whole and still says who sent what.",
      lands:
        "Whether the review queue ever splits, and what a host's pending count is counting.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "expiry",
      label: "The expiry",
      question:
        "A guest uploads and never confirms. What happens to the photograph?",
      context:
        "The one question here with a data-loss cost, drawn as the pair that decides it: the sentence a guest is told at the upload, and what day seven does to a Free host's two gigabytes.",
      options: [
        {
          id: "seven",
          label: "Held seven days, then removed",
          means:
            "A deadline the guest is told at the upload and reminded of on day six. A guest who confirms on day eight finds nothing.",
        },
        {
          id: "keep",
          label: "Kept, pending, for ever",
          means:
            "Nothing is ever destroyed. Nobody ever sees it either, and the bytes count against the host's cap the whole time.",
        },
        {
          id: "host",
          label: "The address drops, the host's setting decides",
          means:
            "On day seven it becomes an ordinary anonymous upload: an open event keeps it, an account-required event removes it.",
        },
      ],
      recommended: "host",
      because:
        "It invents no policy. The host already answered “does an upload with no email behind it belong in my album” when they set the event up, and this applies that answer at the deadline instead of asking it a second time.",
      overrule:
        "If “we deleted your photograph” is a sentence Partyreel should never have to say, `keep` destroys nothing, at the cost of a cap full of invisible bytes.",
      lands:
        "Whether the purge cron ever removes a guest's photograph, and on whose authority it does.",
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
 * six times in the dock.
 */
export const GUEST_VERIFY: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
