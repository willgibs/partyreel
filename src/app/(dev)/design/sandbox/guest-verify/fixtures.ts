import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ROUND TWO: THE IDENTITY SHAPE, WHOLE. ONE PARTY, AND EVERY FACT THE FIVE
 * DECISIONS ARE PRICED AGAINST.
 *
 * Round one asked whether a guest must confirm an email before uploading and
 * he ruled four of six: `gate=after`, `badge=mark`, `host-lens=badge`,
 * `expiry=host`, HELD on his own "May have to relitigate". `collision` and
 * `outage` came back `?` with three cases and a summing-up that opened
 * everything: "we still need to find the best shape across login,
 * verification, upload credits, anonymous accounts, etc. Everything is
 * unprotected and open to relitigate ... Looking for best shape overall."
 *
 * ★ THE FACTS LIVE HERE RATHER THAN IN PROSE, for the reason round one found:
 * they are drawn INSIDE the frames. A reviewer judging "is a typed address
 * worth a column" is judging a cost, and a cost in a paragraph above the
 * picture is a cost nobody reads twice. Every number below is read out of the
 * shipped code, the migrations, or Supabase's current rate-limit table, and the
 * ones that are estimates say so in the sentence that draws them.
 */

/* -- the event ------------------------------------------------------------ */

export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  /** Rendered through the product's own `formatEventDate`. */
  date: "2026-06-14",
  /** Invited. The scale that makes a room at the door a burst. */
  invited: 120,
  /** People who have added something so far. */
  guests: 23,
} as const;

/* -- the principle, and the three jobs one gate conflated ----------------- */

/**
 * ★ THE SENTENCE THE WHOLE BOARD STANDS ON, drawn on the first decision's
 * frames so it is the first thing read and never an assumption held in the
 * head. Both halves are his: "a magic link failure could be catastrophic at an
 * event" and "now it's as easy as typing an email to upload under that
 * identity".
 */
export const PRINCIPLE =
  "Nothing at the party may depend on a mail arriving, and nothing unproven may be shown as proven.";

/**
 * IDENTITY HAS THREE JOBS, AND ONE EMAIL GATE WAS DOING ALL OF THEM. Naming
 * them apart is what makes the five decisions separable at all: credit needs no
 * proof, ownership needs proof only when ownership matters, and safety was
 * served by the gate and must be served by something else once the gate opens.
 */
export const JOBS = [
  {
    id: "credit",
    name: "Credit",
    line: "Who added this.",
    proof: "None. A name is a name.",
  },
  {
    id: "ownership",
    name: "Ownership",
    line: "Mine across events. I can delete them. My profile.",
    proof: "Only when ownership matters: another device, a profile, a claim.",
  },
  {
    id: "safety",
    name: "Safety",
    line: "The host's: no stranger's dump, a way to trace, a meter that is theirs.",
    proof: "The gate was this. Something else has to be, now.",
  },
] as const;

/* -- the four rulings this round is drawn on top of ----------------------- */

/**
 * HELD, NOT WIRED. The Orchestrator held all four on his own "May have to
 * relitigate", so they are the baseline every frame here stands on, and an
 * option that would change one says so on its own frame rather than quietly.
 */
export const HELD = [
  {
    id: "gate",
    ask: "gate=after",
    said: "The photograph goes live straight away, wearing an unconfirmed mark.",
  },
  {
    id: "badge",
    ask: "badge=mark",
    said: "The mark rides the avatar where guests read it, subtle, with a tooltip.",
  },
  {
    id: "host-lens",
    ask: "host-lens=badge",
    said: "One queue, every card saying who sent it and whether they proved it.",
  },
  {
    id: "expiry",
    ask: "expiry=host",
    said: "Nothing is removed on a deadline; the host's own setting decides.",
  },
] as const;

/* -- the wall, RE-MEASURED before anything was drawn on it ---------------- */

/**
 * ★ ROUND ONE DREW THESE NUMBERS WRONG, AND THE CORRECTION MATTERS MORE THAN
 * THE ERROR. The strip said typing a code rides "a bucket of 30, not
 * configurable" and that sending was capped at 30 an hour project-wide, which
 * together read as "most guests cannot confirm that night". Read again from
 * Supabase's current Auth rate-limit table (2026-09-20, the production
 * checklist's own table):
 *
 *  - `/auth/v1/verify` is limited BY IP at 360 requests an hour with bursts up
 *    to 30. A venue is one IP, so a full room at the door drains the burst and
 *    then clears at roughly six a minute. It is a QUEUE, not a wall.
 *  - `/auth/v1/otp` is limited project-wide at 360 OTPs an hour, customizable.
 *  - The "30 an hour" figure is the custom-SMTP EMAILS cap (30 new users an
 *    hour), and it is raisable with our own SMTP, which is what we run.
 *  - The per-address resend window is 60 seconds, already wired as
 *    `RESEND_COOLDOWN_S` in `email-sign-in.tsx`.
 *
 * So his fear is real but not in the shape round one drew: what is true is that
 * a mail can still fail (spam, a delay, a mistyped address) and that a room at
 * the door drains the burst. NOTHING ON THIS BOARD RULES ON AN UNREAD NUMBER:
 * these are the DOCUMENTED defaults, labelled as documented, and the project's
 * CONFIGURED values are three numbers from the dashboard that the carried call
 * `numbers` asks him for.
 */
export const WALL = [
  {
    id: "verify",
    what: "Typing the code",
    path: "/auth/v1/verify",
    by: "per IP address",
    limit: "360 an hour, bursts up to 30",
    bite: "A room at the door drains the burst, then clears at about six a minute.",
    severe: true,
  },
  {
    id: "otp",
    what: "Sending the code",
    path: "/auth/v1/otp",
    by: "project-wide",
    limit: "360 an hour, customizable",
    bite: "Raisable, and shared with every host signing in.",
    severe: false,
  },
  {
    id: "smtp",
    what: "The mails themselves",
    path: "custom SMTP",
    by: "project-wide",
    limit: "30 new users an hour by default",
    bite: "Ours to raise. This was the number round one read as the wall.",
    severe: false,
  },
  {
    id: "resend",
    what: "Asking again",
    path: "the same address",
    by: "per person",
    limit: "60 seconds",
    bite: "Already wired, as the Resend cooldown.",
    severe: false,
  },
] as const;

/** What no table can tell us, and the one thing the board needs from Will. */
export const WALL_UNREAD =
  "Supabase's documented defaults. This project's configured numbers are three reads in the dashboard, under Authentication, Rate Limits.";

/**
 * AND THE FAILURE NO LIMIT DESCRIBES. A mail that lands in spam, arrives in
 * twenty minutes, or goes to an address typed with a missing letter is a guest
 * standing at a door with nothing to type, and no rate limit says so.
 */
export const MAIL_STILL_FAILS =
  "A mail can still land in spam, arrive late, or go to an address typed a letter wrong. No limit on the table covers that, and it is the failure the party actually meets.";

/* -- the facts drawn, not asked ------------------------------------------- */

/**
 * ★ EACH ONE WITH THE COST THAT MADE IT A FACT. These are not options: three
 * are recorded refusals with the reason written down, so the same idea is not
 * re-proposed every round, and two are the shape everything else is built on.
 * They are drawn on the first decision's frames.
 */
export type Fact = {
  id: string;
  kind: "is" | "refused";
  what: string;
  why: string;
};

export const FACTS: readonly Fact[] = [
  {
    id: "session",
    kind: "is",
    what: "The key is the session.",
    why: "A guest is a row per event per device, holding its own capability token in this browser. Uploads bind to that row. It needs no mail, no account and no address, and it already ships.",
  },
  {
    id: "proof",
    kind: "is",
    what: "Proof is the code, later, from anywhere.",
    why: "The same code that signs anyone in. It can be typed at home on Tuesday, and a passkey makes the next return one press on this device, behind its flag.",
  },
  {
    id: "anon-user",
    kind: "refused",
    what: "A Supabase anonymous user per device.",
    why: "It mints a host-table profile row on every scan, it puts anonymous tokens inside every authenticated grant unless every policy learns to check, and its own limit is 30 sign-ins an hour per IP, which a venue is. It needs a CAPTCHA at the door to be safe at all.",
  },
  {
    id: "address-key",
    kind: "refused",
    what: "The typed address is the key.",
    why: "Round one's stage drew the takeover: photographs hang off the row for an address a stranger typed, and the person who really owns it inherits them by confirming. Supabase's own identity linking refuses unverified emails for this reason.",
  },
  {
    id: "claim-link",
    kind: "refused",
    what: "A claim link from our own mailer.",
    why: "It only sidesteps the one cap we can raise, and it mails a bearer credential to whatever address a stranger typed, from our domain, once per event.",
  },
];

/* -- the host's meter, which never refunds -------------------------------- */

/**
 * ★ THE COST NOBODY SEES, AND THE REASON `allowance` IS A DECISION AT ALL.
 * `storage_ledger.cumulative_bytes` counts bytes UPLOADED per month and NEVER
 * decrements (`tiers.ts`): deleting a photograph frees the storage cap and not
 * the meter. So an upload burns the host's month for good, and the account
 * requirement was the only per-person cost standing at a public QR code.
 *
 * `abuse_rate_limit.sql` does not cover this and was never meant to: its signal
 * is cross-event BREADTH (one address touching many distinct events is a
 * scraper), with a deliberately high per-event backstop, because a venue is
 * exactly one event and a real party is heavy traffic.
 */
export const METER = {
  /** Free's flat monthly ingress, from `MONTHLY_INGRESS_BYTES`. */
  freeMonthlyGb: 20,
  /** A phone photograph, as an estimate, and labelled one on the frame. */
  photoMb: 4,
  /** 20 GB at 4 MB a photograph. The arithmetic is drawn, not asserted. */
  photosToBurnFreeMonth: 5000,
  line: "The monthly meter counts bytes uploaded and never decrements. Deleting a photograph frees the storage cap; it never gives the month back.",
  abuse:
    "The abuse limiter watches one address touching many events, not one event taking many photographs. A venue is one event, on purpose.",
} as const;

/** The allowance's own numbers, drawn with their arithmetic on the frame. */
export const ALLOWANCE = {
  /** The board's stand-in for "a handful", his to move. */
  handful: 10,
  /** A per-event budget a host can see and raise. */
  budget: 500,
  /** 120 guests who all stay unproven, at the handful, at 4 MB each. */
  roomAtHandfulGb: 4.8,
  /** What one script with a public QR token costs at `open`. */
  openLine:
    "One script holding a public link spends a Free host's whole month in an afternoon, and no delete gives it back.",
} as const;

/* -- the photographs ------------------------------------------------------ */

/** The shapes a phone's camera roll actually holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;

/** Two thirds of the roll stands up, as a phone shoots it. */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLP";

const tileAt = (i: number, letter: string, prefix: string): GridMedia => {
  const img = MARKETING_IMAGES[(i * 5 + 2) % MARKETING_IMAGES.length];
  const [w, h] = SHAPES[letter as keyof typeof SHAPES];
  return {
    id: `${prefix}-${i}`,
    type: "photo",
    url: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: w * 400,
    height: h * 400,
  } satisfies GridMedia;
};

/** The album a guest lands on. */
export const ALBUM: GridMedia[] = [...ROLL].map((l, i) => tileAt(i, l, "gv"));

/** The one a guest has just added, drawn on its own. */
export const JUST_ADDED: GridMedia = tileAt(7, "P", "gv-mine");

/** The five a passed phone is holding when the next person signs in. */
export const PASSED: GridMedia[] = [...ROLL]
  .slice(0, 5)
  .map((l, i) => tileAt(i + 11, l, "gv-passed"));

/**
 * THE HOST'S QUEUE, on his ruled `host-lens=badge`: one list, every card saying
 * who and whether. Nine items, four from sessions that have not proven an
 * address. The flags ride beside the grid rather than on `GridMedia`, which has
 * no field for them and is not this board's to change.
 */
export type QueueItem = {
  media: GridMedia;
  /** The display name the session gave, or null for one that gave none. */
  who: string | null;
  /** The orb seed that person wears everywhere (a stand-in for seedFor(id)). */
  seed: string;
  /** Whether an address behind this upload has been proven. */
  proven: boolean;
  /** What the session typed, on the answers where a typed address exists. */
  claimed?: string;
};

const QUEUE_PEOPLE: readonly (readonly [
  string | null,
  boolean,
  string | undefined,
])[] = [
  ["Priya", true, undefined],
  ["Sam", false, "sam.here@example.com"],
  ["Tomas", true, undefined],
  ["Aoife", false, undefined],
  ["Dan", true, undefined],
  [null, false, "bob@example.com"],
  ["Noor", true, undefined],
  ["Jo", false, "jo@example.com"],
  ["Elena", true, undefined],
];

export const QUEUE: QueueItem[] = QUEUE_PEOPLE.map(
  ([who, proven, claimed], i) => ({
    media: { ...tileAt(i + 3, ROLL[i] ?? "P", "gv-q"), status: "pending" },
    who,
    seed: `${i}7f4a9c2e${i}b3`,
    proven,
    claimed,
  }),
);

/* -- the people ----------------------------------------------------------- */

/**
 * The guest list as the album renders it: 23 names, five of whom have not
 * proven an address. The seeds are stand-ins for `seedFor(profiles.id)` (that
 * helper is `server-only`), so a client board hands `Avatar` a fixed hex string
 * of its own and gets the same generator's colours.
 */
export type Person = {
  id: string;
  name: string;
  seed: string;
  proven: boolean;
  /** Only ever set under `address=private` or `address=public`. */
  claimed?: string;
};

const NAMES = [
  "Priya",
  "Sam",
  "Aoife",
  "Dan",
  "Jo",
  "Elena",
  "Marcus",
  "Ines",
  "Yusuf",
  "Klara",
  "Beatrix",
  "Leo",
  "Sanne",
  "Omar",
  "Rina",
  "Jonas",
  "Malia",
  "Theo",
  "Ada",
  "Ravi",
  "Greta",
  "Milo",
  "Zora",
] as const;

/** Five unproven, spread through the row rather than bunched at its end. */
const UNPROVEN = new Set([1, 4, 9, 14, 20]);

/** The addresses those five typed, on the answers where any was typed. */
const CLAIMED: Record<number, string> = {
  1: "sam.here@example.com",
  4: "jo@example.com",
  9: "k.novak@example.com",
  14: "rina@example.com",
  20: "greta.w@example.com",
};

export const PEOPLE: Person[] = NAMES.map((name, i) => ({
  id: `gv-p-${i}`,
  name,
  // A hand-written stand-in seed: the generator reads the whole string.
  seed: `${i.toString(16)}c4e19a7${i}b2f`,
  proven: !UNPROVEN.has(i),
  claimed: CLAIMED[i],
}));

export const UNPROVEN_COUNT = PEOPLE.filter((p) => !p.proven).length;

/* -- the stage: the cases, drawn as fact ---------------------------------- */

/**
 * ★ HIS THREE CASES, AND TWO THE RED TEAM ADDED. Cases 1 and 3 are FACTS under
 * the session key rather than questions (round one's verdict lines), so they
 * are drawn beside decision four rather than asked again. The passed phone and
 * the unproven string in the host's lightbox are the two the brief's red team
 * put on the board, because both are real and neither had a picture.
 */
export type StageCase = {
  id: string;
  title: string;
  /** His words, where the case is his. */
  his?: string;
  /** What happens, under the session key. */
  answer: string;
  /** What the board draws, or must be careful about. */
  note: string;
  settled: boolean;
};

export const CASES: readonly StageCase[] = [
  {
    id: "case-1",
    title: "The fake address, claimed later",
    his: "I upload under a fake email and someone with that email goes to upload at a different event later. How does the original uploader get back to their account if we reassign the email?",
    answer:
      "Nothing is reassigned, because nothing was assigned. The photographs are on the first device's session, which no address ever moved. The real owner proves the address and gets an account with none of them.",
    note: "Settled by the key, at round one. It needs no option here.",
    settled: true,
  },
  {
    id: "case-3",
    title: "Two people, one fake address",
    his: "Two different people upload under the same fake, unconfirmed email. Attached?",
    answer:
      "Never attached. Two devices are two sessions, and a string they both typed joins nothing. Proving the address from either device claims only that device's rows.",
    note: "Settled by the key. Under an answer where no address is typed at all, the case cannot be posed.",
    settled: true,
  },
  {
    id: "passed-phone",
    title: "The passed phone",
    answer:
      "A venue's iPad, or a phone handed round, still holds the previous guest's tokens. The next sign-in would claim their rows, and a capture would label them.",
    note: "So the claim is never silent: it is a confirmation with the thumbnails in it, and declining leaves every row where it was.",
    settled: false,
  },
  {
    id: "host-lightbox",
    title: "The unproven string in the host's lightbox",
    answer:
      "The host's lightbox has always shown a verified address. A typed one is a different kind of thing and may never take that slot.",
    note: "It is drawn in a slot of its own, worded as typed and unconfirmed. Under the answer where nothing is typed, the slot does not exist.",
    settled: false,
  },
];

/* -- his case 2: the returning guest -------------------------------------- */

/** The returning guest of his case 2, and what each side already holds. */
export const RETURNING = {
  address: "jo@example.com",
  /** What she is doing tonight, not signed in. */
  tonight: { label: "Jo, at the wedding", uploads: 6, seed: "a91c4e19a7b2f3" },
  /** What her account already holds, from two other events. */
  account: { label: "Jo's account", uploads: 41, events: 2, seed: "a91c4e19a7b2f3" },
} as const;
