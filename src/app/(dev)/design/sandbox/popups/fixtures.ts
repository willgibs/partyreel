import type { GridMedia } from "@/components/app/media-grid";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * ONE WEDDING, EVERY POPUP (round one).
 *
 * Maya and Jay's wedding, hosted by Maya, 14 June: the world `identity-door`,
 * `identity-claims`, `guest-capture` and `profile-page` all draw, so a reader
 * who has walked those boards recognises it on sight. Priya is the guest; Maya
 * is the host; Nina, Jay and Priya are `profile-page.quick-look`'s three kinds
 * of name, carried here with the ask; Rick is `event-safety`'s typed name.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (`guest-capture/fixtures.ts`'s
 * own rule): a board's directory is deleted the moment its picks are built,
 * so importing another board's fixtures would tie this board's life to a
 * folder it does not own. The facts are small and repeated deliberately.
 *
 * ★ THE STILLS ARE THE SAME TWELVE MARKETING IMAGES EVERY BOARD REUSES (bible
 * 9: no new asset, nothing to track the rights of).
 *
 * ★ EVERY STRING A POPUP SAYS IS PRODUCTION'S, VERBATIM, where production has
 * the popup (the inventory's file named beside each). Where it does not yet
 * (her uploads, Change beside her told name, Block), the words are the board
 * that is building it.
 */

const S = (id: string) => marketingImage(id).src;

export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June",
  token: "maya-and-jay",
  url: "partyreel.com/e/maya-and-jay",
  photos: 640,
  guests: 240,
} as const;

export const HOST = {
  name: "Maya",
  full: "Maya Reyes",
  email: "maya.reyes@gmail.com",
  seed: "pop-maya",
  avatar: S("wedding-golden"),
} as const;

export const PRIYA = { name: "Priya", seed: "pop-priya" } as const;

/** The album, newest first, the order production draws it in. */
const ORDER = [
  "wedding-toast",
  "wedding-petals",
  "party-dj",
  "reception-table",
  "wedding-rings",
  "wedding-arch",
  "reception-hall",
  "wedding-golden",
  "festival-crowd",
  "party-balloons",
  "festival-lights",
  "concert-confetti",
] as const;

export const ALBUM: readonly GridMedia[] = ORDER.map((id, i) => ({
  id: `album-${i}`,
  type: "photo",
  url: S(id),
  downloadUrl: S(id),
  status: "approved",
  width: 4,
  height: i % 3 === 1 ? 5 : i % 3 === 2 ? 4 : 3,
}));

export const still = (i: number) => ALBUM[i % ALBUM.length].url;

/* ── the guest list, at 240 ─────────────────────────────────────────────── */

export type Chip = {
  id: string;
  name: string;
  /** A confirmed account wears its seeded colour; a typed name does not. */
  confirmed: boolean;
  seed?: string;
  avatar?: string;
  /** Only an account with a handle has a page. */
  slug?: string;
};

const FIRST = [
  "Ava",
  "Ben",
  "Chloe",
  "Dev",
  "Ella",
  "Finn",
  "Grace",
  "Hugo",
  "Isla",
  "Jonah",
  "Kira",
  "Leo",
  "Mila",
  "Noah",
  "Olive",
  "Pablo",
  "Quinn",
  "Rosa",
  "Sami",
  "Tess",
  "Uma",
  "Vik",
  "Wren",
  "Xavi",
  "Yara",
  "Zane",
  "Amir",
  "Bea",
  "Cal",
  "Dina",
  "Eli",
  "Fern",
  "Gus",
  "Hana",
  "Ivo",
  "Jade",
] as const;
const LAST = "ABCDEFGHIJKLMNOPRSTW";

/**
 * 240 names, the way the album lists them: the confirmed first in their own
 * colour (a few with a page), then every typed name on the plain disc wearing
 * the mark. A names-mode wedding, so most are typed, as `profile-page` drew.
 * Nina, Jay and Priya are named on purpose: they are `peek`'s three taps.
 */
export const GUESTS: readonly Chip[] = Array.from({ length: 240 }, (_, i) => {
  if (i === 0)
    return {
      id: "g-priya",
      name: "Priya",
      confirmed: true,
      seed: PRIYA.seed,
      avatar: S("wedding-petals"),
      slug: "priya",
    };
  if (i === 1)
    return { id: "g-jay", name: "Jay", confirmed: true, seed: "pop-jay" };
  if (i === 26) return { id: "g-nina", name: "Nina", confirmed: false };
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}.`;
  const confirmed = i < 24;
  return {
    id: `g-${i}`,
    name,
    confirmed,
    seed: confirmed ? `pop-g${i}` : undefined,
    avatar: confirmed && i % 4 === 0 ? S(ORDER[i % ORDER.length]) : undefined,
    slug: confirmed && i % 6 === 0 ? `guest-${i}` : undefined,
  };
});

/* ── a quick look: profile-page's three kinds of name ───────────────────── */

export type Tapped = {
  id: "nina" | "jay" | "priya";
  name: string;
  kind: "unverified" | "confirmed" | "page";
  seed?: string;
  avatar?: string;
  /** What they added to this album: public on it already, by name. */
  added: number;
  /** A page's own line, and the events its owner chose to show. */
  handle?: string;
  line?: string;
  events?: readonly { name: string; date: string; cover: string }[];
};

export const TAPPED: Record<Tapped["id"], Tapped> = {
  nina: { id: "nina", name: "Nina", kind: "unverified", added: 6 },
  jay: {
    id: "jay",
    name: "Jay",
    kind: "confirmed",
    seed: "pop-jay",
    added: 11,
  },
  priya: {
    id: "priya",
    name: "Priya",
    kind: "page",
    seed: PRIYA.seed,
    avatar: S("wedding-petals"),
    added: 9,
    handle: "@priya",
    line: "Joined May 2026",
    events: [
      { name: "Maya & Jay", date: "14 Jun", cover: S("wedding-arch") },
      { name: "Tom's Leaving Do", date: "3 May", cover: S("party-dj") },
    ],
  },
};

export const tappedOf = (v: string | undefined): Tapped["id"] =>
  v === "jay" || v === "priya" ? v : "nina";

/* ── her uploads (guest-door is building the tracker; guest-capture's words) ─ */

export type UploadStatus = "sending" | "held" | "approved" | "refused";

export const UPLOAD_WORDS: Record<UploadStatus, string> = {
  sending: "Sending…",
  held: "The host sees it first",
  approved: "In the album",
  refused: "Not in the album",
};

export const UPLOADS: readonly {
  id: string;
  url: string;
  status: UploadStatus;
}[] = [
  { id: "u1", url: S("wedding-toast"), status: "sending" },
  { id: "u2", url: S("reception-table"), status: "held" },
  { id: "u3", url: S("wedding-rings"), status: "held" },
  { id: "u4", url: S("party-dj"), status: "held" },
  { id: "u5", url: S("wedding-arch"), status: "approved" },
  { id: "u6", url: S("festival-lights"), status: "approved" },
  { id: "u7", url: S("party-balloons"), status: "refused" },
];

/** How many of hers wait for the host: the count guest-door's badge shows. */
export const UPLOADS_WAITING = UPLOADS.filter(
  (u) => u.status === "held",
).length;

/* ── photos waiting to be claimed (claims-card.tsx's words) ──────────────── */

export const CLAIMS_TITLE = "Photos waiting for you";
export const CLAIMS_DESCRIPTION =
  "Added at events with the email on this account, before it was confirmed.";

export const CLAIMS: readonly {
  id: string;
  name: string;
  meta: string;
  photos: readonly string[];
}[] = [
  {
    id: "c1",
    name: "Tom's Leaving Do",
    meta: "3 May 2026 · Added as Priya · 4 photos",
    photos: [S("party-dj"), S("festival-lights"), S("party-balloons")],
  },
  {
    id: "c2",
    name: "Beach Bonfire",
    meta: "19 Jul 2026 · Added as Priya · 2 photos",
    photos: [S("festival-crowd"), S("concert-confetti")],
  },
  {
    id: "c3",
    name: "Ana's 30th",
    meta: "9 Aug 2026 · Added as Priya · 7 photos",
    photos: [S("reception-hall"), S("wedding-toast"), S("party-dj")],
  },
  {
    id: "c4",
    name: "Work Summer Party",
    meta: "22 Aug 2026 · Added as P. · 3 photos",
    photos: [S("festival-lights"), S("reception-table")],
  },
];

/* ── Maya's largest files (host-storage's own question, carried here) ────── */

export const STORAGE = {
  used: "94.2 GB",
  cap: "100 GB",
  rows: [
    {
      id: "s1",
      name: "Ceremony, full length",
      kind: "video",
      size: "9.4 GB",
      length: "34:20",
      event: "Maya & Jay",
      by: "Maya",
      when: "14 Jun",
      still: S("wedding-arch"),
    },
    {
      id: "s2",
      name: "Reception, from the drone",
      kind: "video",
      size: "8.1 GB",
      length: "22:10",
      event: "Maya & Jay",
      by: "Maya",
      when: "14 Jun",
      still: S("reception-hall"),
    },
    {
      id: "s3",
      name: "First dance",
      kind: "video",
      size: "4.6 GB",
      length: "7:40",
      event: "Maya & Jay",
      by: "Jay",
      when: "14 Jun",
      still: S("wedding-golden"),
    },
    {
      id: "s4",
      name: "Speeches",
      kind: "video",
      size: "3.4 GB",
      length: "12:05",
      event: "Maya & Jay",
      by: "Maya",
      when: "14 Jun",
      still: S("wedding-toast"),
    },
    {
      id: "s5",
      name: "Engagement party, the toast",
      kind: "video",
      size: "2.9 GB",
      length: "5:20",
      event: "Engagement party",
      by: "Ben A.",
      when: "2 Mar",
      still: S("party-balloons"),
    },
    {
      id: "s6",
      name: "Dance floor",
      kind: "video",
      size: "2.6 GB",
      length: "4:05",
      event: "Maya & Jay",
      by: "Nina",
      when: "14 Jun",
      still: S("party-dj"),
    },
    {
      id: "s7",
      name: "Rehearsal dinner",
      kind: "video",
      size: "1.9 GB",
      length: "6:15",
      event: "Rehearsal dinner",
      by: "Maya",
      when: "13 Jun",
      still: S("reception-table"),
    },
    {
      id: "s8",
      name: "Sparklers",
      kind: "video",
      size: "1.2 GB",
      length: "2:50",
      event: "Maya & Jay",
      by: "Dev C.",
      when: "14 Jun",
      still: S("festival-lights"),
    },
    {
      id: "s9",
      name: "Confetti exit",
      kind: "video",
      size: "0.9 GB",
      length: "1:40",
      event: "Maya & Jay",
      by: "Priya",
      when: "14 Jun",
      still: S("concert-confetti"),
    },
  ],
} as const;

/* ── the people a confirmation or a report names ─────────────────────────── */

/** `event-safety`'s typed name: a block holds on the one browser he used. */
export const RICK = { name: "Rick", uploads: 7 } as const;

/** Whose page `forms` reports: a guest with a page, never the protagonist. */
export const THEO = {
  name: "Theo",
  handle: "@theo",
  seed: "pop-theo",
  line: "Joined June 2026",
} as const;

/* ── the plans (pricing-sheet.tsx and pro-price-list.tsx, verbatim) ──────── */

export const PRO_ROWS = [
  { id: "p100m", name: "Pro 100 GB", price: "$9/mo", state: "current" },
  { id: "p100y", name: "Pro 100 GB", price: "$90/yr", state: "switch" },
  { id: "p500m", name: "Pro 500 GB", price: "$19/mo", state: "switch" },
  { id: "p500y", name: "Pro 500 GB", price: "$190/yr", state: "switch" },
  { id: "p2m", name: "Pro 2 TB", price: "$39/mo", state: "switch" },
  { id: "p2y", name: "Pro 2 TB", price: "$390/yr", state: "switch" },
] as const;

export const PRO_BENEFITS = [
  "Video from you and every guest",
  "Unlimited events, not just the one",
  "Password locks, custom links, 60-second reels",
] as const;

/* ── the code's four styles (qr-designer-dialog.tsx) ─────────────────────── */

export const QR_STYLES = [
  { id: "classic", name: "Classic", line: "Clean black & white" },
  { id: "bold", name: "Bold", line: "Brand-accent corners" },
  { id: "rounded", name: "Rounded", line: "Soft & celebratory" },
  { id: "dots", name: "Dots", line: "Playful dots" },
] as const;
