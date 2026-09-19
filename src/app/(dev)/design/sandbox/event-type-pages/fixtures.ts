import {
  Film,
  GraduationCap,
  ListChecks,
  Lock,
  type LucideIcon,
  QrCode,
} from "lucide-react";

import type { EventTypeHelp } from "@/lib/constants/events";

/**
 * INVENTED FIXTURES ONLY: nothing here lands in `events.ts` (out of this
 * lane's `owns`). `EVENT_TYPES` "admits invented types" per the manifest, so
 * HOW MANY's five-card option needs a fifth umbrella that reads as real
 * without ever touching the single source. Schools over "communities": a
 * concrete institution (proms, banquets, reunions) draws a clearer card than
 * an abstract one, and it is the manifest's own first-named option.
 */
export type DirectoryCard = {
  slug: string;
  navLabel: string;
  teaser: string;
  themes: string[];
  icon: LucideIcon;
};

export const SCHOOLS_CARD: DirectoryCard = {
  slug: "schools",
  navLabel: "Schools",
  teaser: "Every prom, banquet, and reunion, gathered under one code.",
  themes: ["proms", "class reunions", "sports banquets", "school trips"],
  icon: GraduationCap,
};

/** The three existing directory cards, trimmed to what a fixture grid needs
 *  (never imported from `events.ts` beyond these plain fields, so a card list
 *  can hold three, four or five without EVENT_TYPES in the loop). */
export const REAL_CARDS: DirectoryCard[] = [
  {
    slug: "weddings",
    navLabel: "Weddings",
    teaser: "Every guest's angle of the day, not just the photographer's.",
    themes: ["receptions", "ceremonies", "rehearsal dinners"],
    icon: QrCode,
  },
  {
    slug: "parties",
    navLabel: "Parties",
    teaser: "The candids from every corner of the room, before anyone leaves.",
    themes: ["birthdays", "anniversaries", "graduations"],
    icon: QrCode,
  },
  {
    slug: "conferences",
    navLabel: "Conferences",
    teaser: "Talks, booths, and hallway moments, gathered in one feed.",
    themes: ["summits", "trade shows", "offsites"],
    icon: QrCode,
  },
  {
    slug: "trips",
    navLabel: "Trips",
    teaser: "Everyone's photos from the whole trip, without the chasing.",
    themes: ["group vacations", "reunions", "road trips"],
    icon: QrCode,
  },
];

/** THE HERO'S PICTURE, option "artifacts for all four": one product artifact
 *  (a QR badge), reskinned per type through props the real `AttendeeBadge`
 *  already exposes (name/role/seed) — never a new visual. */
export const BADGE_BY_TYPE: Record<string, { name: string; role: string }> = {
  weddings: { name: "Maya & Jay", role: "Table 12" },
  parties: { name: "Jordan's 30th", role: "Guest" },
  conferences: { name: "Priya Shah", role: "Speaker" },
  trips: { name: "Desert weekend", role: "Traveler" },
};

/** THE HERO'S PICTURE, option "a photograph for all four": the two verticals
 *  the bootstrap manifest has no honest still for borrow the closest read
 *  (never a new download), captioned as a stand-in so the ask reads as a
 *  request, not a finished choice. */
export const PHOTO_STAND_IN: Record<string, string> = {
  conferences: "reception-hall",
  trips: "festival-crowd",
};

/** THE PROOF, option "a story": the same Maya & Jay fixture the wedding hero
 *  already names (`partyreel.com/a/maya-and-jay`), never a real testimonial
 *  (there are zero real hosts yet) — three real stills, one caption each, no
 *  still repeated within the option. */
export const STORY_FRAMES: { id: string; time: string; caption: string }[] = [
  { id: "wedding-arch", time: "4:12 PM", caption: "The processional, from three rows back" },
  { id: "wedding-toast", time: "7:48 PM", caption: "The best man's toast, a guest's phone" },
  { id: "reception-hall", time: "11:20 PM", caption: "The last dance, from the balcony" },
];

/** THE PROOF, option "a stat band": facts only, the same register
 *  `quality-section.tsx` ratified (a real constant, never a usage count —
 *  there are zero real hosts yet to count). */
export const PROOF_STATS: { value: number; label: string; suffix?: string }[] = [
  { value: 4, label: "kinds of events, one shared album" },
  { value: 0, label: "per-guest fees, on any plan" },
  { value: 0, label: "watermark on a full-res photo" },
];

/** WHO IS GREETED: the two lines a hero could add beneath the host's, never
 *  replacing it (the host is still who signs up). */
export const GREETING_LINES = {
  guest:
    "Just scanned a code at a wedding? You don't need an account, just your camera roll.",
  planner:
    "Planning it for someone else? Set it up once and hand the client a link, not a login.",
};

/** Reused across a couple of decisions' HelpPane-style cells so a fixture
 *  reads like the real `EventTypeHelp` shape without duplicating events.ts. */
export const GENERIC_BENEFITS: EventTypeHelp[] = [
  {
    icon: QrCode,
    title: "One code, any size of room",
    body: "Print it, project it, or drop it in the group chat. No per-guest fees either way.",
  },
  {
    icon: ListChecks,
    title: "The album shows what you choose",
    body: "Hold uploads for approval, hide anything off-key, hand out a link you're happy to send.",
  },
  {
    icon: Film,
    title: "Full quality, never watermarked",
    body: "Photos land at full resolution on every plan, ready to keep. Video comes with Pro.",
  },
  {
    icon: Lock,
    title: "Private, and yours to keep",
    body: "Your album opens only to the link you share and stays up until you delete it.",
  },
];
