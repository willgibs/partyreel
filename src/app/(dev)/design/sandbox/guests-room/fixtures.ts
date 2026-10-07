import type { DoorPerson } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import type { InvitedPerson } from "@/app/(app)/dashboard/[eventId]/guests/invited-section";
import type { GuestListItem } from "@/components/social/guest-list";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { BlockedPerson } from "@/lib/events/event-blocks";

/**
 * MAYA & JAY'S WEDDING, SATURDAY AT 9:40 PM (the site's own fictional album,
 * the one every board follows): the room as Maya opens it from her hub on the
 * night, its door Private with her invite list as the way in, so the list is
 * the door and anyone else asks at it.
 *
 * ★ A SEPARATE FILE, NEVER ANOTHER BOARD'S (every board's rule): a board's
 * folder is deleted the day it retires, so its people are typed here.
 *
 * ★ THE STILLS ARE THE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no new
 * asset), standing in for each guest's own photographs in the card's strip.
 *
 * ★ THE PEOPLE IN ARE WHO ADDED PHOTOS (guest-flow.md's one definition): a
 * person let in who has added nothing is on no list, so 31 here is 31 people
 * with an approved photograph, two of them typed names from the hour before
 * the list became the door (people in stay in when a gate goes on).
 */

export const EVENT = {
  id: "gr-wedding",
  name: "Maya & Jay's Wedding",
  date: "2026-10-03",
  joinUrl: "https://partyreel.com/e/maya-and-jay",
  qrStyle: "classic",
} as const;

export const HOST = {
  name: "Maya Alvarez",
  email: "maya.alvarez@example.com",
  seed: "gr-maya",
} as const;

/** The three who asked at the door and wait on her (none on the list). */
export const AT_THE_DOOR: readonly DoorPerson[] = [
  {
    guestId: "gr-door-dev",
    userId: "gr-user-dev",
    name: "Dev Kapoor",
    email: "dev.kapoor@example.com",
    asked: "2 minutes ago",
    seed: "gr-dev",
  },
  {
    guestId: "gr-door-tom",
    userId: "gr-user-tom",
    name: null,
    email: "tom.okafor@example.com",
    asked: "just now",
    seed: "gr-tom",
  },
  {
    guestId: "gr-door-ines",
    userId: "gr-user-ines",
    name: "Ines Moreau",
    email: "ines.moreau@example.com",
    asked: "18 minutes ago",
    seed: "gr-ines",
  },
];

/** How long ago each asked, in the short form a tight row says it. */
export const ASKED_SHORT: Record<string, string> = {
  "gr-door-dev": "2 min",
  "gr-door-tom": "now",
  "gr-door-ines": "18 min",
};

/**
 * One person in, with what a candidate may say of them beyond today's list:
 * their photos here and when they came in (a read the list does not carry
 * today; each option that shows one says so in its costs).
 */
export type Guest = {
  id: string;
  name: string;
  /** Their page's handle, where they set one up. */
  slug: string | null;
  /** The confirmed address only the host sees; null for a typed name. */
  email: string | null;
  /** A typed name nobody proved (the Unverified mark). */
  unverified: boolean;
  seed: string;
  /** Approved photographs of theirs in this album. */
  photos: number;
  /** When their first photograph landed, in her zone. */
  since: string;
};

const g = (
  key: string,
  name: string,
  photos: number,
  since: string,
  over: Partial<Guest> = {},
): Guest => ({
  id: `gr-${key}`,
  name,
  slug: null,
  email: `${key}@example.com`,
  unverified: false,
  seed: `gr-${key}`,
  photos,
  since,
  ...over,
});

/** The 31 people in, as production orders them: confirmed by name, then the typed names. */
export const GUESTS: readonly Guest[] = [
  g("arjun.mehta", "Arjun Mehta", 12, "7:02 PM"),
  g("ava.thompson", "Ava Thompson", 3, "8:40 PM"),
  g("ben.carter", "Ben Carter", 2, "9:21 PM"),
  g("chloe.dubois", "Chloe Dubois", 1, "9:35 PM"),
  g("diego.ramos", "Diego Ramos", 6, "7:48 PM"),
  g("eli.rosen", "Eli Rosen", 10, "6:55 PM"),
  g("emma.novak", "Emma Novak", 4, "8:12 PM"),
  g("felix.wagner", "Felix Wagner", 2, "9:03 PM"),
  g("grace.kim", "Grace Kim", 11, "6:31 PM"),
  g("hannah.berg", "Hannah Berg", 31, "5:58 PM"),
  g("isla.novak", "Isla Novak", 9, "7:15 PM"),
  g("jamal.wright", "Jamal Wright", 5, "8:27 PM"),
  g("jordan.pike", "Jordan Pike", 8, "7:39 PM"),
  g("kenji.sato", "Kenji Sato", 14, "6:44 PM"),
  g("lena.wu", "Lena Wu", 15, "6:12 PM"),
  g("lucas.silva", "Lucas Silva", 3, "8:51 PM"),
  g("marcus.lee", "Marcus Lee", 7, "7:56 PM"),
  g("mia.rossi", "Mia Rossi", 7, "8:05 PM"),
  g("noah.fischer", "Noah Fischer", 4, "8:33 PM"),
  g("olivia.chen", "Olivia Chen", 21, "6:20 PM", { slug: "livchen" }),
  g("omar.haddad", "Omar Haddad", 13, "7:07 PM"),
  g("owen.hart", "Owen Hart", 9, "6:48 PM"),
  g("priya.shah", "Priya Shah", 24, "6:03 PM", { slug: "priya" }),
  g("ruby.clarke", "Ruby Clarke", 16, "6:39 PM", { slug: "rubyc" }),
  g("sam.okafor", "Sam Okafor", 18, "6:26 PM", { slug: "samo" }),
  g("sofia.lopez", "Sofia Lopez", 8, "7:44 PM"),
  g("tess.morgan", "Tess Morgan", 1, "9:38 PM"),
  g("theo.grant", "Theo Grant", 12, "7:11 PM", { slug: "theog" }),
  g("zoe.martin", "Zoe Martin", 5, "8:19 PM"),
  g("rosa", "Aunt Rosa", 19, "5:45 PM", { email: null, unverified: true }),
  g("nina", "Nina", 6, "6:58 PM", { email: null, unverified: true }),
];

/** Whose card the board opens: a confirmed guest with a page, and a typed name. */
export const PRIYA = GUESTS.find((x) => x.slug === "priya")!;
export const ROSA = GUESTS.find((x) => x.name === "Aunt Rosa")!;

/** A guest as production's list carries them: a profile card, or a typed name. */
export function listItem(guest: Guest): GuestListItem {
  if (guest.unverified)
    return {
      kind: "unverified",
      id: guest.id,
      displayName: guest.name,
      seed: guest.seed,
    };
  return {
    id: guest.id,
    displayName: guest.name,
    slug: guest.slug,
    avatarMarker: null,
    avatarUrl: null,
    seed: guest.seed,
  };
}

export const GUEST_ITEMS: GuestListItem[] = GUESTS.map(listItem);

/** The confirmed addresses, by card id, as the room hands them to the list. */
export const EMAILS: ReadonlyMap<string, string> = new Map(
  GUESTS.flatMap((x) => (x.email ? [[x.id, x.email] as const] : [])),
);

/** Her invite list, the door: 40 addresses as she pasted them, 28 joined. */
const INVITED_JOINED = GUESTS.filter((x) => x.email)
  .slice(0, 28)
  .map((x) => x.email!);
const INVITED_WAITING = [
  "abuela.carmen@example.com",
  "the.chens@example.com",
  "jules.p@example.com",
  "kai.nakamura@example.com",
  "leo.and.mara@example.com",
  "nadia.f@example.com",
  "pat.obrien@example.com",
  "quinn.r@example.com",
  "sasha.ivanova@example.com",
  "uncle.ted@example.com",
  "vera.lindqvist@example.com",
  "will.and.kate@example.com",
];
export const INVITED: InvitedPerson[] = [
  ...INVITED_JOINED.map((email) => ({ email, joined: true })),
  ...INVITED_WAITING.map((email) => ({ email, joined: false })),
].sort((a, b) => a.email.localeCompare(b.email));

/** Declined at the door at 9:12: his ask still stands, so Let in is one press. */
export const CHRIS: BlockedPerson = {
  id: "gr-block-chris",
  name: "Chris Doyle",
  verified: true,
  email: "chris.doyle@example.com",
  avatarUrl: null,
  seed: "gr-chris",
  since: "Blocked Oct 3",
  restorable: 0,
  restorableUntil: null,
  lands: "let_in",
};

/** In since six, blocked at 8:15 for what he posted: Let back in asks first. */
export const RAY: BlockedPerson = {
  id: "gr-block-ray",
  name: "Ray Moss",
  verified: true,
  email: "ray.moss@example.com",
  avatarUrl: null,
  seed: "gr-ray",
  since: "Blocked Oct 3",
  restorable: 4,
  restorableUntil: "November 2",
  lands: "in",
};

export const BLOCKED: BlockedPerson[] = [CHRIS, RAY];

/** When each block landed, in the short form a candidate's line says it. */
export const BLOCKED_AT: Record<string, string> = {
  [CHRIS.id]: "9:12 PM",
  [RAY.id]: "8:15 PM",
};

/** The stills a guest's own photographs stand in as (the card's strip). */
const STILL_IDS = [
  "wedding-toast",
  "reception-table",
  "wedding-rings",
  "wedding-arch",
  "reception-hall",
  "wedding-petals",
  "wedding-golden",
  "party-dj",
] as const;

export type Still = { id: string; src: string };

/** Four photographs of a guest's, chosen by their name so each guest's four differ. */
export function stillsOf(guest: Guest): Still[] {
  const start = [...guest.name].reduce((n, c) => n + c.charCodeAt(0), 0);
  return [0, 1, 2, 3].map((i) => {
    const id = STILL_IDS[(start + i * 3) % STILL_IDS.length]!;
    return { id: `${guest.id}-${i}`, src: marketingImage(id).src };
  });
}

/** The hub's own photographs behind the panel at a desk. */
export const HUB_STILLS: readonly Still[] = STILL_IDS.slice(0, 5).map((id) => ({
  id,
  src: marketingImage(id).src,
}));

/** Every still the album draws, for the hub's grid behind the panel. */
export const ALBUM_STILLS: readonly Still[] = STILL_IDS.map((id) => ({
  id,
  src: marketingImage(id).src,
}));
