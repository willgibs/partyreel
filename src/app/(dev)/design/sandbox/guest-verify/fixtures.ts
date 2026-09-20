import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE PARTY, AND THE FACTS EVERY OPTION ON THIS BOARD IS PRICED AGAINST.
 *
 * The board asks six questions about the same evening: a 120-person wedding on
 * a venue's single Wi-Fi, where the host left "Require accounts to upload" ON
 * (the default since migration `20260621170000`). Nothing below is a mood —
 * every number is read out of the shipped code or out of Supabase's current
 * rate-limit table, and the ones that are estimates say so.
 *
 * ★ WHY THE FACTS LIVE IN A FIXTURE RATHER THAN IN PROSE. They are drawn INSIDE
 * the frames (the cost strip under every `gate` option, the wall under every
 * `outage` one), because a reviewer judging "is blocking the upload worth it"
 * is judging a number, and a number in a paragraph above the picture is a
 * number nobody reads twice.
 */

/* ── the event ───────────────────────────────────────────────────────────── */

export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
  /** Rendered through the product's own `formatEventDate`. */
  date: "2026-06-14",
  /** Invited. The scale that makes a project-wide send limit a wall. */
  invited: 120,
  /** Signed-in uploaders so far. */
  guests: 23,
} as const;

/* ── what is true today, in the shipped code ─────────────────────────────── */

/**
 * THE GATE AS BUILT, read out of the tree rather than remembered.
 *
 * `create_guest` (the LIVE definition, confirmed against `pg_get_functiondef`)
 * is the hard gate, and it is Postgres, not the app:
 *
 *   if not v_event.allow_anonymous_uploads and (v_uid is null or v_confirmed is null)
 *     then raise exception 'This event requires an account to upload.'
 *
 * `v_confirmed` is `auth.users.email_confirmed_at`, read under definer
 * privilege for the route's `getUser()`-verified id. That is the
 * verified-at-join invariant: the address on `guests.email` was proven on the
 * auth server, never sent by the client.
 */
export const TODAY = {
  setting: "allow_anonymous_uploads",
  settingDefault: "false, so accounts are required",
  step: "One Supabase Auth email: a 6-digit code and a magic link",
  proof: "verifyOtp — typing the code IS the confirmation",
  knows: "guests.user_id is set, or it is null. Nothing else.",
} as const;

/**
 * ★ THE MECHANISM EVERY OPTION BUT `before` ASSUMES, and why it is safe.
 *
 * There is no such thing today as a signed-in guest with an unconfirmed
 * address: the only path to a session is the code, and the code IS the
 * confirmation. So "unverified" cannot mean a logged-in-but-unproven auth
 * session — that would need Supabase's Confirm-email turned OFF, which makes
 * every HOST account unprovable too and breaks auth-js's own refusal to link an
 * unverified identity (the anti-takeover rule, auth-accounts.md).
 *
 * It means the other thing, and it costs one nullable column: the guest keeps
 * TODAY's anonymous guest row (`guests.user_id` null, a session token), the
 * address they typed is written beside it as a CLAIM that authorises nothing,
 * and verifying the code later signs them in and runs the claim that already
 * exists (`claimAnonymousUploads`). `guests.email` keeps its verified-at-join
 * meaning untouched. The proposed migration is in the lane's Handoff.
 */
export const LANES = {
  session: {
    title: "Bound to the session",
    line: "The address is a label on this browser's guest row. It authorises nothing.",
  },
  email: {
    title: "Bound to the address",
    line: "The upload attaches to the account for that address the moment it is typed.",
  },
} as const;

/* ── the wall, from Supabase's current rate-limit table ──────────────────── */

/**
 * WHAT ACTUALLY BREAKS AT A VENUE, and it is worse than the half he named.
 *
 * Checked against Supabase's live Auth rate-limit reference (2026-09-20):
 *
 *  - `/auth/v1/verify` — typing the code — is limited BY IP ADDRESS, is the one
 *    row in that table marked NOT customizable, and rides a token bucket whose
 *    capacity is 30. A venue's guest Wi-Fi is one IP, so 120 phones share one
 *    bucket. This is his fear, and it is real.
 *  - `/auth/v1/otp` — sending the code — is limited PROJECT-WIDE (the sum of
 *    combined requests), not per IP. It is customizable, and the documented
 *    default on a custom SMTP setup is 30 new users an hour. We are on Resend
 *    SMTP. Two weddings on one Saturday share that number, and so does every
 *    host signing in.
 *  - The per-address resend window is 60s, which is the cooldown already wired
 *    into `email-sign-in.tsx` (`RESEND_COOLDOWN_S`).
 *
 * The figures are Supabase's documented defaults; this project's configured
 * values live in the dashboard (Authentication → Rate Limits). The send limit
 * is the one we can raise. The verify limit is not.
 */
export const WALL = [
  {
    id: "verify",
    what: "Typing the code",
    path: "/auth/v1/verify",
    by: "per IP address",
    limit: "a bucket of 30, not configurable",
    bite: "A venue's Wi-Fi is one IP. 120 phones, one bucket.",
    severe: true,
  },
  {
    id: "send",
    what: "Sending the code",
    path: "/auth/v1/otp",
    by: "project-wide",
    limit: "30 new users an hour on custom SMTP",
    bite: "Every host and every other party share it.",
    severe: true,
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

/* ── what an unproven guest may not do (a cost line, never a decision) ───── */

/**
 * ★ NOT A QUESTION ON THIS BOARD (the goal's own words: "the cost line on every
 * option, not a decision"). It is drawn identically under all three `gate`
 * options, so what is compared is the GATE and not the allowance, and it is
 * written once here so the three frames cannot drift.
 */
export const UNPROVEN_MAY_NOT = [
  "Download the album",
  "Save the event",
  "Show in the guest list",
  "Add more than a handful",
] as const;

/* ── the photographs ─────────────────────────────────────────────────────── */

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

/** The album a guest lands on: 25 approved photographs from the evening. */
export const ALBUM: GridMedia[] = [...ROLL].map((l, i) => tileAt(i, l, "gv"));

/** The one a guest has just added, drawn on its own under the door. */
export const JUST_ADDED: GridMedia = tileAt(7, "P", "gv-mine");

/**
 * THE HOST'S QUEUE, and the split that is `host-lens`'s whole question: nine
 * items, four of them waiting on a code rather than on the host. The flags ride
 * beside the grid rather than on `GridMedia`, which has no field for them and
 * is not this board's to change.
 */
export type QueueItem = {
  media: GridMedia;
  /** The display name the uploader gave, or null for one with none yet. */
  who: string | null;
  /** The orb seed that person wears everywhere (a stand-in for seedFor(id)). */
  seed: string;
  /** Whether the address behind this upload has been proven. */
  proven: boolean;
  /** How long it has waited, for the deadline `expiry` draws. */
  waitedHours: number;
};

const QUEUE_PEOPLE: readonly (readonly [string | null, boolean, number])[] = [
  ["Priya", true, 1],
  [null, false, 2],
  ["Tomas", true, 3],
  ["Aoife", false, 5],
  ["Dan", true, 6],
  [null, false, 19],
  ["Noor", true, 20],
  ["Sam", false, 140],
  ["Elena", true, 22],
];

export const QUEUE: QueueItem[] = QUEUE_PEOPLE.map(
  ([who, proven, waitedHours], i) => ({
    media: { ...tileAt(i + 3, ROLL[i] ?? "P", "gv-q"), status: "pending" },
    who,
    seed: `${i}7f4a9c2e${i}b3`,
    proven,
    waitedHours,
  }),
);

/* ── the people ──────────────────────────────────────────────────────────── */

/**
 * The guest list, as the album renders it: 23 names, five of whom have not
 * proven their address. The seeds are stand-ins for `seedFor(profiles.id)` —
 * that helper is `server-only` (node:crypto), so a client board hands `Avatar`
 * a fixed hex string of its own and gets the same generator's colours.
 */
export type Person = {
  id: string;
  name: string;
  seed: string;
  proven: boolean;
};

const NAMES = [
  "Priya",
  "Tomas",
  "Aoife",
  "Dan",
  "Noor",
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

export const PEOPLE: Person[] = NAMES.map((name, i) => ({
  id: `gv-p-${i}`,
  name,
  // A hand-written stand-in seed: `orbFor` reads the whole string.
  seed: `${i.toString(16)}c4e19a7${i}b2f`,
  proven: !UNPROVEN.has(i),
}));

export const UNPROVEN_COUNT = PEOPLE.filter((p) => !p.proven).length;

/* ── the collision's two people ──────────────────────────────────────────── */

/** The address both of them type, and what each has already added. */
export const COLLISION = {
  address: "bob@example.com",
  /** Whoever typed it first, at the party, and never confirmed. */
  first: { label: "Someone at the party", uploads: 5, seed: "a91c4e19a7b2f3" },
  /** The person the address actually belongs to. */
  real: { label: "Bob, the owner", uploads: 0, seed: "5d1a8f36e27b40" },
} as const;
