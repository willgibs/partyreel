/**
 * THE VOICE SETS the brand-voice board compares (round two, 2026-09-14).
 *
 * ROUND TWO'S CHANGE: round one argued three voices on HEADERS. A voice is
 * judged in a paragraph and a page, so this file now carries whole surfaces:
 * the home arc's fifteen sections top to bottom (eyebrow, header, support,
 * CTA), the six feature pages' thirty identity strings, two feature pages
 * whole, the app's quiet copy, and the guest surfaces. Every slot is a TRIO
 * (today / A / B), so the board can show a candidate beside reality and mark
 * every line a candidate HOLDS verbatim.
 *
 * ★ Candidate C (the guest list) was retired as a column. Its whole argument
 * was the SUBJECT of one sentence, and over fifteen sections it read as B with
 * "everyone" substituted in seven places, which is not a third answer. Its one
 * real question, the ruled thesis, survives as its own ask (THESIS below) on
 * the real hero. Judged from the ground up per bible 22; recorded as a
 * departure on the board.
 *
 * ★ This file is the BOARD's data, never a source of truth. The one home for a
 * shipped line is src/lib/constants/marketing-voice.ts (and feature-pages.ts,
 * and the components); nothing here is imported by production and nothing
 * ships until Will rules. "today" is quoted VERBATIM from the source so the
 * comparison is against reality and not a paraphrase.
 */

import {
  GETTING_IN,
  NAMES,
  STAYS,
  TAKE_HOME,
  YOUR_CALL,
  type CopyItem,
} from "@/components/marketing/sections/features/album/album-copy";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

export type VoiceId = "today" | "house" | "room";

/** One slot, in all three columns. `today` is the shipped string, verbatim. */
export type Trio = { today: string; house: string; room: string };

export function pick(t: Trio | undefined, id: VoiceId): string {
  return t ? t[id] : "";
}

/** True when a candidate keeps the shipped line unchanged. The board marks
 *  these, because where a voice does NOT bite is as much of a ruling as where
 *  it does. */
export function held(t: Trio | undefined, id: VoiceId): boolean {
  if (!t) return false;
  return id === "today" || t[id] === t.today;
}

export type Voice = {
  id: VoiceId;
  name: string;
  /** The one-line case for this voice. */
  rationale: string;
  /** The voice in one paragraph (the board's first ask). */
  paragraph: string;
  /** What this voice costs, said plainly. A candidate with no cost is a
   *  candidate nobody has read closely. */
  cost: string;
};

export const VOICES: Voice[] = [
  {
    id: "room",
    name: "B. The room",
    rationale:
      "A rebuild from the product's one idea: the code becoming the album. Verb in front, present tense, the room as the setting, real counts as evidence. A sentence is about the moment, not the object.",
    paragraph:
      "Partyreel talks the way a good host talks while the party is still going: present tense, plain nouns, one breath per sentence. Every line is about something arriving. A code goes on a table, phones find it, an album fills with the event as everyone saw it, and the voice stays inside that moment instead of describing it from afterwards. It is warm because it is specific, not because it is friendly: it says photo, video, phone, code, album, guest, link, and it leaves memories, magic and journeys to someone else. It calls the host you and the guests everyone. It leads with what the reader gets, so the things Partyreel spares them (an app, an account, a group chat the morning after) land in the second half of a sentence and never the first. And it changes volume, not vocabulary: loud here, quiet in the product, nearly silent on a guest's screen.",
    cost: "Its sentences run longer, and the hero pays for it: the row counter under the arc measures the h1 at both canvases. It also rewrites half again as much of the site as A.",
  },
  {
    id: "house",
    name: "A. The house",
    rationale:
      "A tuning. The voice already exists in the eight ratified lines; write it down, then bring back the lines that drifted. A sentence is about what the host ends up holding.",
    paragraph:
      "Partyreel sounds like a good host: plain, warm, specific, with nothing abstract in it. A line is a noun phrase and a turn, hinged on a comma, and it is about what the host ends up holding. It says photo, video, phone, code, album, guest and link, and it leaves memories and magic to someone else. It calls the host you, it leads with what the reader gets, and it lets whatever we spare them arrive in the second half of the sentence. This is the voice the eight ratified lines already speak; the guide writes it down and tunes the lines that have not caught up.",
    cost: "It changes the least, so it lifts the least: the feature pages were already written in this register, so A moves six of their thirty strings and holds twenty-four.",
  },
  {
    id: "today",
    name: "Today",
    rationale:
      "The shipped strings, verbatim. The voice is unwritten, so the arc drifts between an absence, a state and an instruction.",
    paragraph:
      "Unwritten. The only copy rule in the repo is the em-dash ban, so the voice is whatever the eight ratified golden lines happen to have in common: warm, plain, second person, two beats on a comma. Nothing says what a line should be ABOUT, which is why three of the seven provisional home headers are built out of an absence, one is a tautology, and the eyebrows above them name a category instead of a claim.",
    cost: "Nothing to adopt, and nothing to hold the next hundred lines to.",
  },
];

export function voiceById(id: VoiceId): Voice {
  return VOICES.find((v) => v.id === id) ?? VOICES[0];
}

/**
 * THE THREE REGISTERS, shown once rather than per candidate: round one's
 * finding was that they do NOT fork with the voice. Only the marketing
 * register's default sentence shape moves, so a ruling on the voice is a
 * ruling on one row of the guide's table.
 */
export const REGISTERS = [
  {
    name: "Marketing, loud",
    rule: "The full voice. One or two beats, a turn, a real count, a verb in front. It addresses the host as you, it may describe the room, and it is the only register that sells.",
  },
  {
    name: "The app, quiet",
    rule: "The same words with the shaping taken out. One clause, no turn, no metaphor. The verb is the one written on the button the host just pressed. A marketing sentence inside the product is a bug even when the sentence is better.",
  },
  {
    name: "A guest surface, the host's",
    rule: "The event's name leads and ours stays out of the way. Second person to the guest, the host's business stated plainly, Partyreel named only where a guest needs to know whose software this is. It never markets and never treats the event page as a door to us (bible 4).",
  },
] as const;

/* ---------------------------------------------------------------------------
 * THE HOME ARC, TOP TO BOTTOM
 * ------------------------------------------------------------------------ */

export type ArcSection = {
  /** The id in HOME_SECTION_IDS, so the board's order is the shipped order. */
  id: string;
  ground: "cinema" | "paper";
  /** The heading tier and alignment the section really ships at. */
  tier?: "hero" | "lg";
  align?: "left";
  eyebrow?: Trio;
  header?: Trio;
  support?: Trio;
  /** Claim titles, where the claim row IS the section's supporting text. */
  items?: Trio[];
  cta?: Trio;
  /** Will's recorded appetite (SECTION_HEADERS' `note`), on the seven. */
  appetite?: string;
  /** One of the five headers carrying an appetite for a DIFFERENT line. */
  pick?: boolean;
  /** Where the header is already ruled, so a rewrite is a bigger ask. */
  ruled?: boolean;
};

/**
 * All fifteen, in HOME_SECTION_IDS order, on their real ground. "today" is
 * verbatim from the section components and marketing-voice.ts.
 */
export const ARC: ArcSection[] = [
  {
    id: "cinema-hero",
    ground: "cinema",
    tier: "hero",
    ruled: true,
    eyebrow: {
      today: "One QR. No app. No account.",
      house: "One code. Every phone. One album.",
      room: "One code. Every phone. Live.",
    },
    header: {
      today: "The whole event, in one album.",
      house: "The whole event, in one album.",
      room: "One code on the table, and the album starts filling.",
    },
    support: {
      today:
        "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
      house:
        "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
      room: "Every phone in the room finds it, uploads at full size, and you end up with the whole event in one place.",
    },
    cta: {
      today: "Start free  ·  Watch a sample reel",
      house: "Start free  ·  Watch a sample reel",
      room: "Start free  ·  Watch a reel",
    },
  },
  {
    id: "trust-strip",
    ground: "cinema",
    items: [
      {
        today: "No app, no account",
        house: "Any phone, no app",
        room: "Opens in any browser",
      },
      {
        today: "Private by default",
        house: "Private by default",
        room: "Private until you share it",
      },
      {
        today: "Yours until you delete it",
        house: "Yours until you delete it",
        room: "Yours until you delete it",
      },
      {
        today: "No photo watermarks",
        house: "Full-size photos, no watermark",
        room: "Full-size photos, no watermark",
      },
    ],
  },
  {
    id: "decomposition",
    ground: "cinema",
    support: {
      today:
        "Partyreel turns everyone's camera roll into the film of the whole event.",
      house: "Everyone's camera roll, cut into the film of the whole event.",
      room: "Everyone's camera roll becomes the film of the whole event.",
    },
    items: [
      {
        today: "Built from 214 photos.",
        house: "Built from 214 photos.",
        room: "Built from 214 photos.",
      },
      {
        today: "Shot by 23 guests.",
        house: "Shot by 23 guests.",
        room: "Shot by 23 guests.",
      },
      {
        today: "Created for you.",
        house: "Created for you.",
        room: "Created for you.",
      },
    ],
  },
  {
    id: "film-strip",
    ground: "cinema",
    ruled: true,
    eyebrow: {
      today: "How it works",
      house: "How it works",
      room: "How it works",
    },
    header: {
      today: "Scan, upload, done. No app to install.",
      house: "Scan, upload, done. No app to install.",
      room: "Scan, upload, done. No app to install.",
    },
    items: [
      { today: "Scan", house: "Scan", room: "Scan" },
      { today: "Upload", house: "Upload", room: "Upload" },
      { today: "Done", house: "Done", room: "Done" },
    ],
    cta: {
      today: "The full walkthrough, both sides",
      house: "The full walkthrough, both sides",
      room: "Walk through both sides",
    },
  },
  {
    id: "no-app",
    ground: "cinema",
    appetite: "his line, ruling pending",
    eyebrow: { today: "Guests", house: "Guests", room: "Guests" },
    header: {
      today: "Nothing to install. Nothing to sign up for.",
      house: "Your guests already have everything they need.",
      room: "Point a camera at the code. That's the whole setup.",
    },
    items: [
      {
        today: "Any phone, any camera",
        house: "Any phone, any camera",
        room: "Any phone, any camera",
      },
      {
        today: "No account, no app",
        house: "One scan, straight in",
        room: "In, in one tap",
      },
      {
        today: "Nothing to learn",
        house: "Nothing to learn",
        room: "The sheet they use every day",
      },
    ],
    cta: {
      today: "How guests join",
      house: "How guests join",
      room: "How guests join",
    },
  },
  {
    id: "full-quality",
    ground: "cinema",
    appetite: "his line, ruling pending",
    eyebrow: {
      today: "Full quality",
      house: "Full quality",
      room: "Full quality",
    },
    header: {
      today: "Everything they shoot, at the size they shot it.",
      house: "Every photo at full size, every video at full length.",
      room: "Every file lands the size it was shot.",
    },
    items: [
      {
        today: "Originals, not copies",
        house: "Originals, in and out",
        room: "Nothing gets recompressed",
      },
      {
        today: "Video too",
        house: "Video, the same way",
        room: "Video rides the same sheet",
      },
      {
        today: "Download one, or all of it",
        house: "Take one, or take all of it",
        room: "Take one, or take all of it",
      },
    ],
    cta: {
      today: "Inside the live album",
      house: "Inside the live album",
      room: "Inside the live album",
    },
  },
  {
    id: "live-demo",
    ground: "cinema",
    tier: "lg",
    appetite: "entertains other ideas",
    pick: true,
    eyebrow: { today: "Live demo", house: "Live demo", room: "Live demo" },
    header: {
      today: "Watch your album fill up.",
      house: "Watch your album fill up.",
      room: "The album fills while the party is still going.",
    },
    support: {
      today:
        "Guests scan, photos land, and the album builds itself while the party is still going.",
      house:
        "Guests scan, photos land, and the album fills while the party is still going.",
      room: "Guests scan, photos land, and twenty-three people build it without being asked.",
    },
  },
  {
    id: "album",
    ground: "paper",
    tier: "lg",
    align: "left",
    appetite: "more distinctness from the live demo and curation",
    pick: true,
    eyebrow: { today: "The album", house: "The album", room: "The album" },
    header: {
      today: "Every photo comes to you first.",
      house: "The whole event, and it's yours to keep.",
      room: "Two hundred photos you never had to ask for.",
    },
    support: {
      today:
        "Every phone in the room feeds one album, and the album is yours: look through it, tidy it up, and share it when you are ready.",
      house:
        "Every phone in the room feeds one album, and the album is yours: look through it, tidy it up, and share it when you are ready.",
      room: "Every phone in the room feeds one album. Look through it, tidy it up, and send it when you are ready.",
    },
    cta: {
      today: "Inside the live album",
      house: "Inside the live album",
      room: "Inside the live album",
    },
  },
  {
    id: "curation",
    ground: "paper",
    appetite: "guest-side benefits in the frame",
    pick: true,
    eyebrow: { today: "Curation", house: "Curation", room: "Curation" },
    header: {
      today: "Every moment, and you decide what stays.",
      house: "You shape the album, and everyone gets the good version.",
      room: "It all arrives, and you decide what the album says.",
    },
    support: {
      today:
        "Your guests just see the good part: one clean album, the best of everyone's camera roll.",
      house:
        "Your guests see one clean album: the best of everyone's camera roll.",
      room: "Your guests open one clean album, the best of everyone's camera roll and nothing else.",
    },
    cta: {
      today: "How curation works",
      house: "How curation works",
      room: "How curation works",
    },
  },
  {
    id: "privacy",
    ground: "paper",
    appetite: "cleaner",
    pick: true,
    eyebrow: { today: "Privacy", house: "Privacy", room: "Privacy" },
    header: {
      today: "Your event stays yours.",
      house: "Private until you say otherwise.",
      room: "The link opens for the people you hand it to.",
    },
    items: [
      {
        today: "Location data stays on the phone",
        house: "Location stays on the phone",
        room: "Location stays on the phone",
      },
      {
        today: "Three ways to share",
        house: "Three ways to share",
        room: "Open, password, or private",
      },
      {
        today: "A verified email to upload",
        house: "A verified email, if you want one",
        room: "A verified email, if you ask for one",
      },
      {
        today: "30 days to change your mind",
        house: "30 days to change your mind",
        room: "30 days to change your mind",
      },
      {
        today: "Backed up twice, automatically",
        house: "Copied to a second region",
        room: "Copied to a second region",
      },
    ],
    cta: {
      today: "The full privacy story",
      house: "The full privacy story",
      room: "The full privacy story",
    },
  },
  {
    id: "reel-teaser",
    ground: "cinema",
    appetite: "a share-the-highlights framing that feels more alive",
    pick: true,
    eyebrow: { today: "The reel", house: "The reel", room: "The reel" },
    header: {
      today: "The whole event, cut down to the highlights.",
      house: "The highlights, cut and ready to send.",
      room: "One tap sends the best of it to everyone who was there.",
    },
    support: {
      today:
        "Pick a style and the reel renders on your phone, free, in seconds. Every guest can take the reel home.",
      house:
        "Pick a style and the reel renders on your phone, free, in seconds. Every guest takes one home.",
      room: "Pick a style and the reel renders on your phone, free, in seconds. Every guest takes one home.",
    },
    cta: {
      today: "See all 9 styles",
      house: "See all 9 styles",
      room: "See all 9 styles",
    },
  },
  {
    id: "events-teaser",
    ground: "cinema",
    eyebrow: { today: "Events", house: "Events", room: "Events" },
    header: {
      today: "Made for every kind of get-together",
      house: "Every kind of get-together, one code.",
      room: "Wherever people show up with phones.",
    },
    support: {
      today:
        "If people show up with phones, Partyreel collects what they capture.",
      house: "If people show up with phones, you end up with the album.",
      room: "A wedding, a birthday, a conference, a send-off: one code collects all of it.",
    },
    cta: {
      today: "Browse all events",
      house: "Browse all events",
      room: "Browse all events",
    },
  },
  {
    id: "pricing-teaser",
    ground: "cinema",
    ruled: true,
    eyebrow: { today: "Pricing", house: "Pricing", room: "Pricing" },
    header: {
      today: "Start free, upgrade for more events.",
      house: "Start free, upgrade for more events.",
      room: "Start free, upgrade for more events.",
    },
    support: {
      today: "Free covers your whole first event, with no per-guest fees.",
      house: "Your whole first event is free, and nobody pays per guest.",
      room: "Your whole first event is free, and nobody pays per guest.",
    },
    cta: {
      today: "Start free  ·  See full pricing",
      house: "Start free  ·  See full pricing",
      room: "Start free  ·  See full pricing",
    },
  },
  {
    id: "faq",
    ground: "cinema",
    eyebrow: { today: "FAQ", house: "FAQ", room: "FAQ" },
    header: {
      today: "Questions, answered",
      house: "Questions, answered",
      room: "Questions, answered",
    },
  },
  {
    id: "cinema-close",
    ground: "cinema",
    header: {
      today: "Roll credits on the group chat.",
      house: "Roll credits on the group chat.",
      room: "Roll credits on the group chat.",
    },
    support: {
      today:
        "Every event ends with a reel. Free to host, and guests join with one scan.",
      house:
        "Every event ends with a reel. Free to host, and guests join with one scan.",
      room: "Every event ends with a reel. Free to host, and one scan gets your guests in.",
    },
  },
];

/** The board's headline fact: how much of the arc a candidate actually moves.
 *  A voice nobody can count is a voice nobody can rule on. */
export function arcDiff(id: VoiceId): { moved: number; total: number } {
  let moved = 0;
  let total = 0;
  for (const s of ARC) {
    const trios: (Trio | undefined)[] = [
      s.eyebrow,
      s.header,
      s.support,
      s.cta,
      ...(s.items ?? []),
    ];
    for (const t of trios) {
      if (!t) continue;
      total++;
      if (!held(t, id)) moved++;
    }
  }
  return { moved, total };
}

/** The seven provisional home headers, for the paste and the header ask. */
export const PROVISIONAL_HEADER_IDS = [
  "no-app",
  "full-quality",
  "live-demo",
  "album",
  "curation",
  "privacy",
  "reel-teaser",
] as const;

/** SECTION_HEADERS' key for a section id (the constant's keys are camelCase). */
export const HEADER_KEY_BY_ID: Record<string, string> = {
  "no-app": "noApp",
  "full-quality": "fullQuality",
  "live-demo": "liveDemo",
  album: "album",
  curation: "curation",
  privacy: "privacy",
  "reel-teaser": "reel",
};

/* ---------------------------------------------------------------------------
 * THE THIRTY FEATURE-PAGE STRINGS
 * ------------------------------------------------------------------------ */

export type FeatureStrings = {
  slug: string;
  navLabel: Trio;
  navDescription: Trio;
  h1: Trio;
  heroSub: Trio;
  directoryLine: Trio;
};

/** The six pages' shared identity layer, verbatim in the `today` column from
 *  src/lib/constants/feature-pages.ts. navDescription holds its ~45-character
 *  band and directoryLine its one length band in every column: the mega-panel
 *  and the six hub doors wrap against them. */
export const FEATURES: FeatureStrings[] = [
  {
    slug: "album",
    navLabel: {
      today: "The live album",
      house: "The live album",
      room: "The live album",
    },
    navDescription: {
      today: "Every photo and video, full quality, live.",
      house: "Every photo and video, full quality, live.",
      room: "Every phone, one album, as it happens.",
    },
    h1: {
      today: "Every photo, from every guest, in one place.",
      house: "Every photo, from every guest, in one place.",
      room: "Every phone in the room, filling one album.",
    },
    heroSub: {
      today:
        "One code in the room. Every phone uploads into the same album, live, at full quality.",
      house:
        "One code in the room, and every phone uploads into the same album at full quality.",
      room: "One code goes up. Every phone finds it, and the uploads land at the size they were shot.",
    },
    directoryLine: {
      today:
        "Every phone in the room, feeding one album while the party is on.",
      house: "Every phone in the room, feeding one album.",
      room: "Every phone in the room, feeding one album while the party is on.",
    },
  },
  {
    slug: "qr",
    navLabel: {
      today: "The QR code",
      house: "The QR code",
      room: "The QR code",
    },
    navDescription: {
      today: "One scan and everyone's in.",
      house: "One scan and everyone's in.",
      room: "One scan and everyone's in.",
    },
    h1: {
      today: "One scan and they're in.",
      house: "One scan and they're in.",
      room: "Point a camera at it, and you're in.",
    },
    heroSub: {
      today:
        "Style a code that matches the event, put it where people look, and the uploads start.",
      house:
        "Style a code that matches the event, put it where people look, and the uploads start.",
      room: "Style it to match the event, put it where people look, and the uploads start.",
    },
    directoryLine: {
      today: "Print it or put it on a screen. One scan and they are in.",
      house: "Print it or put it on a screen. One scan and they are in.",
      room: "Print it or put it on a screen. One scan and they are in.",
    },
  },
  {
    slug: "curation",
    navLabel: { today: "Curation", house: "Curation", room: "Curation" },
    navDescription: {
      today: "Approve, hide, and shape the album.",
      house: "Approve, hide, and shape the album.",
      room: "Everything arrives. You decide what stays.",
    },
    h1: {
      today: "Your guests only see the good part.",
      house: "You shape the album, and everyone gets the good version.",
      room: "It all arrives, and you decide what stays.",
    },
    heroSub: {
      today:
        "Review uploads before they appear, or clean up afterward in one pass. Either way, the album stays yours.",
      house:
        "Review uploads before they appear, or clean up afterwards in one pass. Either way the album stays yours.",
      room: "Hold new uploads for approval, or clean up in one pass afterwards. Either way the album stays yours.",
    },
    directoryLine: {
      today:
        "Approve before it appears, or tidy up after. Your album, your call.",
      house:
        "Approve before it appears, or tidy up after. Your album, your call.",
      room: "Approve before it appears, or tidy up after. Your album, your call.",
    },
  },
  {
    slug: "sharing",
    navLabel: {
      today: "Sharing & downloads",
      house: "Sharing & downloads",
      room: "Sharing & downloads",
    },
    navDescription: {
      today: "One link out, originals for everyone.",
      house: "One link out, originals for everyone.",
      room: "One link out, every original back.",
    },
    h1: {
      today: "Everyone leaves with everything.",
      house: "Everyone leaves with everything.",
      room: "Everyone leaves with everything.",
    },
    heroSub: {
      today:
        "The album is one link, and every photo and video comes back out at the quality it went in.",
      house:
        "The album is one link, and every photo and video comes back at the size it went in.",
      room: "The album is one link, and every file comes back out at the size it went in.",
    },
    directoryLine: {
      today: "One link for the whole album. Every original, at full quality.",
      house: "One link for the whole album. Every original, at full quality.",
      room: "One link for the whole album. Every original, at full quality.",
    },
  },
  {
    slug: "guests",
    navLabel: {
      today: "Guests & profiles",
      house: "Guests & profiles",
      room: "Guests & profiles",
    },
    navDescription: {
      today: "Names on every photo, profiles to follow.",
      house: "Names on every photo, profiles to follow.",
      room: "A name on every shot, from every guest.",
    },
    h1: {
      today: "Made of everyone who was there.",
      house: "Made of everyone who was there.",
      room: "Made of everyone who was there.",
    },
    heroSub: {
      today:
        "Every shot is credited, you can see who is in the room, and profiles connect one event to the next.",
      house:
        "Every shot is credited, you can see who is in the room, and profiles connect one event to the next.",
      room: "Every shot arrives credited, you can see who is in the room, and a profile carries to the next event.",
    },
    directoryLine: {
      today: "Names on every shot, and profiles that carry to the next party.",
      house: "Names on every shot, and profiles that carry to the next party.",
      room: "Names on every shot, and profiles that carry to the next party.",
    },
  },
  {
    slug: "privacy",
    navLabel: {
      today: "Privacy & trust",
      house: "Privacy & trust",
      room: "Privacy & trust",
    },
    navDescription: {
      today: "Private by default, yours to open up.",
      house: "Private by default, yours to open up.",
      room: "Private until you open it up.",
    },
    h1: {
      today: "Yours, and only as public as you make it.",
      house: "Yours, and only as public as you make it.",
      room: "The link opens for the people you hand it to.",
    },
    heroSub: {
      today:
        "Three visibility levels, location data stripped before upload, and storage built to not lose things.",
      house:
        "Three visibility levels, location data stripped before upload, and every file copied twice.",
      room: "Three ways to share, location data stripped in the browser, and every file copied to a second region.",
    },
    directoryLine: {
      today: "Public, password, or private. Location data stays on the phone.",
      house: "Public, password, or private. Location data stays on the phone.",
      room: "Public, password, or private. Location data stays on the phone.",
    },
  },
];

export function featureDiff(id: VoiceId): { moved: number; total: number } {
  let moved = 0;
  let total = 0;
  for (const f of FEATURES) {
    for (const t of [
      f.navLabel,
      f.navDescription,
      f.h1,
      f.heroSub,
      f.directoryLine,
    ]) {
      total++;
      if (!held(t, id)) moved++;
    }
  }
  return { moved, total };
}

/* ---------------------------------------------------------------------------
 * THE PAGES THE ARC DOES NOT REACH (round three)
 * ------------------------------------------------------------------------ */

/**
 * ★ WHY THIS CHAPTER EXISTS. Round three's walk was the walk Will takes, and
 * his list of pages named `/pricing`, `/help` and `/contact`. The board had
 * argued the voice on the home arc and two feature pages, which are the pages
 * that SELL; it had never shown the three a reader reaches when they are
 * deciding or when something has broken. Those three carry the site's two most
 * generic lines, and the guide's own surfaces table names a help article as a
 * surface the board never rendered. So the chapter is small, and every `today`
 * here is verbatim from the route.
 */
export type UtilityHero = {
  route: string;
  ground: "cinema" | "paper";
  eyebrow: Trio;
  header: Trio;
  support: Trio;
  /** What the shipped line does, and what the rewrite is arguing. */
  note: string;
};

export const UTILITY_HEROES: UtilityHero[] = [
  {
    route: "/help",
    ground: "cinema",
    eyebrow: {
      today: "Help center",
      house: "Help center",
      room: "Help center",
    },
    header: {
      today: "How can we help?",
      house: "Answers for hosts and guests.",
      room: "Start with the short answer.",
    },
    support: {
      today:
        "Guides for hosts and guests: setup, sharing, privacy, plans, and the highlight reel.",
      house:
        "Guides for hosts and guests: setup, sharing, privacy, plans, and the highlight reel.",
      room: "59 guides for hosts and guests: setup, sharing, privacy, plans, and the reel.",
    },
    note: "How can we help? is the line almost every help centre ships, so it fails the first judging question: a competitor could say it word for word. B answers with what the page actually does, since every article leads with its description and the description is the short answer. B's count has to be DERIVED from the catalogue rather than typed, or it is an invented number the first new article makes false.",
  },
  {
    route: "/pricing",
    ground: "cinema",
    eyebrow: { today: "Pricing", house: "Pricing", room: "Pricing" },
    header: {
      today: "Start free, upgrade when you host again.",
      house: "Start free, upgrade when you host again.",
      room: "Start free, upgrade when you host again.",
    },
    support: {
      today:
        "No per-guest fees. Plans are sized by storage, so pick the room your event actually needs.",
      house:
        "Plans are sized by storage, so pick the room your event needs. Nobody pays per guest.",
      room: "Pick the room your event needs. Plans are sized by storage, and nobody pays per guest.",
    },
    note: "The h1 holds in both, and it is one of the eight ratified golden lines, which is the guide protecting a line rather than moving one. The subhead opens on an absence, which is exactly the half of do 1 that sends an absence to the second beat. Worth the Orchestrator's eye: this page says upgrade when you host again while the home arc's ruled teaser says upgrade for more events. One promise, two wordings, and the infusion round has to pick one.",
  },
  {
    route: "/contact",
    ground: "paper",
    eyebrow: { today: "Contact", house: "Contact", room: "Contact" },
    header: {
      today: "Talk to Partyreel.",
      house: "Ask us anything about your event.",
      room: "Every note gets a reply.",
    },
    support: {
      today:
        "An event you're planning, a plan you're weighing, something that broke. Every note gets a reply, usually within a day.",
      house:
        "An event you're planning, a plan you're weighing, something that broke. Every note gets a reply, usually within a day.",
      room: "An event you're planning, a plan you're weighing, something that broke. Usually within a day.",
    },
    note: "The shipped h1 makes us the object of the reader's sentence. B promotes the line already in the subhead, which is the best sentence on the page and the model for do 2: it commits to an OUTCOME (a reply arrives) and never to who delivers it, which is what keeps it legal while a person answering or within one business day would not be.",
  },
];

/** What a voice costs the three pages, counted like every other chapter. The
 *  two article heads are outside the count and stated separately: they hold in
 *  every column, which is the finding. */
export function utilityDiff(id: VoiceId): { moved: number; total: number } {
  let moved = 0;
  let total = 0;
  for (const h of UTILITY_HEROES) {
    for (const t of [h.eyebrow, h.header, h.support]) {
      total += 1;
      if (!held(t, id)) moved += 1;
    }
  }
  return { moved, total };
}

/**
 * Two help article heads, verbatim from `content/help`. The guide's surfaces
 * table names a help article and the board had never shown one; both hold, for
 * two different reasons, which is the point of putting them here.
 */
export const HELP_HEADS = [
  {
    slug: "an-upload-wont-finish",
    category: "Troubleshooting",
    title: "An upload won't finish",
    description:
      "A stuck upload is almost always the connection: tap the dimmed tile to retry. A refused one tells you why (too large, wrong type, uploads closed). Big videos need a steady connection and time.",
    note: "Held in both. The title is the reader's own words for the trouble and the description is the short answer, which is the shape the guide already prescribes. The 59 articles cost a voice ruling nothing.",
  },
  {
    slug: "how-partyreel-works",
    category: "Getting started",
    title: "How Partyreel works",
    description:
      "You create an event and get a QR code. Guests scan it and add photos and videos from their phone browser, no app or account. It all lands in one live album you curate, share, and cut into a reel.",
    note: "Held, and it is the one place the voice YIELDS. The title puts us in the subject, which the voice avoids everywhere else, but a help title is also the search string and the tab title: a reader types how does partyreel work. The reader's words outrank the voice on this surface, and the guide says so rather than pretending the rule is universal.",
  },
] as const;

/* ---------------------------------------------------------------------------
 * TWO FEATURE PAGES, WHOLE
 * ------------------------------------------------------------------------ */

/** One card in a section's set: a title and a body, each in all three
 *  columns. The feature pages carry more WORDS in their cards than in their
 *  headings, so a voice that is only argued on headings is not argued. */
export type PageCard = { title: Trio; body: Trio };

/**
 * A card whose `today` is the SHIPPED object, imported rather than retyped, so
 * the board cannot drift from the page it quotes. Pass `null` for a voice that
 * keeps the card verbatim, or only the half that moves: the board marks and
 * counts every hold, which on these sets is most of them (see CARD_NOTE).
 */
function card(
  src: CopyItem,
  house: Partial<CopyItem> | null,
  room: Partial<CopyItem> | null,
): PageCard {
  return {
    title: {
      today: src.title,
      house: house?.title ?? src.title,
      room: room?.title ?? src.title,
    },
    body: {
      today: src.body,
      house: house?.body ?? src.body,
      room: room?.body ?? src.body,
    },
  };
}

/** The same, for a card whose shipped copy lives inline in a component rather
 *  than in a copy module (the curation page's two sets). The `today` strings
 *  below are quoted from those components, with the constants resolved. */
function inlineCard(
  today: CopyItem,
  house: Partial<CopyItem> | null,
  room: Partial<CopyItem> | null,
): PageCard {
  return card(today, house, room);
}

export type PageSection = {
  ground: "cinema" | "paper";
  eyebrow?: Trio;
  header: Trio;
  support?: Trio;
  /** The section's card set, titles and bodies, where it ships one. Round two
   *  of this track added these: the goal asked for the feature pages WHOLE,
   *  and a page's cards are most of its words. */
  cards?: PageCard[];
  /** Why a set holds where it does, shown under the page on the board. */
  cardNote?: string;
  /** The set's real column count, so a band is judged against its own wrap
   *  (the stays section ships four steps and then three notes on one grid). */
  cardColumns?: 3 | 4;
  cta?: Trio;
};

export type WholePage = {
  slug: string;
  title: string;
  /** The order the page actually renders, verbatim in `today`. */
  sections: PageSection[];
};

/** /features/album, in page order: the hero (from FEATURES above), three
 *  cinema sections, six on the paper chapter, and the closing band. Every
 *  `today` is quoted from the page's own modules. */
export const ALBUM_PAGE: WholePage = {
  slug: "album",
  title: "/features/album",
  sections: [
    {
      ground: "cinema",
      eyebrow: { today: "Getting in", house: "Getting in", room: "Getting in" },
      header: {
        today: "Scan, and they're in.",
        house: "Scan, and they're in.",
        room: "Point a camera, and they're in.",
      },
      support: {
        today:
          "Guests point a camera at the code, land on a welcome screen, and start adding. New events ask for an email first.",
        house:
          "Guests point a camera at the code, land on a welcome screen, and start adding. New events ask for an email first.",
        room: "A camera finds the code, a welcome screen opens, and the adding starts. New events ask for an email first.",
      },
      cards: [
        card(
          GETTING_IN.facts[0],
          { title: "The browser they already have" },
          {
            title: "It opens in a browser",
            body: "A camera finds the code and the album opens in the browser already on the phone. Nothing to install.",
          },
        ),
        card(GETTING_IN.facts[1], null, {
          body: "Ask for accounts and everyone confirms an email once. Switch it off and anyone with the link can add.",
        }),
        card(GETTING_IN.facts[2], null, null),
      ],
      cardNote:
        "Both candidates move the first title, because No app, ever puts the absence in the first beat, which is the thing ask 5 replaces. The other two hold.",
    },
    {
      ground: "cinema",
      eyebrow: { today: "Live", house: "Live", room: "Live" },
      header: {
        today: "Land once, show up everywhere.",
        house: "Land once, show up everywhere.",
        room: "Land once, show up everywhere.",
      },
      support: {
        today:
          "One upload, every open album at once: the phones in the room, the laptop by the door, the TV above the bar. No refresh.",
        house:
          "One upload, every open album at once: the phones in the room, the laptop by the door, the TV above the bar. No refresh.",
        room: "One upload reaches every open album at once: the phones in the room, the laptop by the door, the TV above the bar.",
      },
      cta: {
        today: "Shape it while it fills",
        house: "Shape it while it fills",
        room: "Shape it while it fills",
      },
    },
    {
      ground: "cinema",
      eyebrow: {
        today: "Full quality",
        house: "Full quality",
        room: "Full quality",
      },
      header: {
        today: "Nothing gets squeezed.",
        house: "Originals in, originals out.",
        room: "Every file lands the size it was shot.",
      },
      support: {
        today:
          "Originals in, originals out. Photos on every plan, video on Pro and Event Pass.",
        house:
          "Full size on the way in, full size on the way out. Photos on every plan, video on Pro and Event Pass.",
        room: "Nothing is recompressed on the way in. Photos on every plan, video on Pro and Event Pass.",
      },
    },
    {
      ground: "paper",
      eyebrow: { today: "Your call", house: "Your call", room: "Your call" },
      header: {
        today: "Live as it happens, or held for you.",
        house: "Live as it happens, or held for you.",
        room: "Live as it happens, or held for you.",
      },
      support: {
        today:
          "Guests only ever see approved photos. Whether that means the moment they land, or after you say so, is one switch.",
        house:
          "Guests only ever see approved photos. Whether that means the moment they land, or after you say so, is one switch.",
        room: "Guests only ever see approved photos. Whether that happens as they land, or after you say so, is one switch.",
      },
      cards: [
        card(YOUR_CALL.settings[0], null, null),
        card(YOUR_CALL.settings[1], null, null),
        card(YOUR_CALL.settings[2], null, null),
      ],
      cardNote:
        "The whole set holds in both voices, and the first line could not move alone anyway: Accepting uploads quotes the app's own settings helper and a mock-parity test pins the pair, so a rewrite there is a two-file change owned by the quiet register, not by this ask.",
    },
    {
      ground: "paper",
      eyebrow: { today: "Names", house: "Names", room: "Names" },
      header: {
        today: "Every shot says who took it.",
        house: "Every shot says who took it.",
        room: "Every shot says who took it.",
      },
      support: {
        today:
          "Open any photo and the name is right there. Guests pick a display name once, with a free account.",
        house:
          "Open any photo and the name is right there. Guests pick a display name once, with a free account.",
        room: "Open any photo and the name is right there. A guest picks a display name once, with a free account.",
      },
      cards: [
        card(NAMES.states[0], null, null),
        card(NAMES.states[1], null, null),
        card(NAMES.states[2], null, null),
      ],
      cardNote:
        "Held in both. Rendering the cards caught a collision: B's first draft of the supporting line above ended on it rides on everything they add, which is the first card, word for word. The line gave the clause back.",
    },
    {
      ground: "paper",
      eyebrow: {
        today: "Who can open it",
        house: "Who can open it",
        room: "Who can open it",
      },
      header: {
        today: "As public as you make it.",
        house: "As public as you make it.",
        room: "It opens for the people you hand it to.",
      },
      support: {
        today:
          "One setting decides who sees the album. A new event asks guests for an email first.",
        house:
          "One setting decides who sees the album. A new event asks guests for an email first.",
        room: "One setting decides who opens the album. A new event asks guests for an email first.",
      },
    },
    {
      ground: "paper",
      eyebrow: {
        today: "Taking it home",
        house: "Taking it home",
        room: "Taking it home",
      },
      header: {
        today: "Everyone leaves with everything.",
        house: "Everyone leaves with everything.",
        room: "Everyone leaves with everything.",
      },
      support: {
        today:
          "The album is the share. Save one shot, take the whole thing, and watch the reel.",
        house:
          "The album is the share. Save one shot, take the whole thing, and watch the reel.",
        room: "The album is the share. Save one shot, take the whole thing, and watch the reel.",
      },
      cards: [
        card(TAKE_HOME.plates[0], null, null),
        card(TAKE_HOME.plates[1], null, null),
        card(TAKE_HOME.plates[2], null, null),
      ],
      cardNote:
        "Held in both voices. Three verbs, three plates, one length band; there is nothing here for a voice to take.",
    },
    {
      ground: "paper",
      eyebrow: {
        today: "How much fits",
        house: "How much fits",
        room: "How much fits",
      },
      header: {
        today: "Room for the whole event.",
        house: "Room for the whole event.",
        room: "Room for the whole event.",
      },
      support: {
        today:
          "A plan is an amount of album, not a count of photos. Every file draws from one pool.",
        house:
          "A plan is an amount of album, not a count of photos. Every file draws from one pool.",
        room: "A plan is an amount of album, not a count of photos. Every file draws from one pool.",
      },
    },
    {
      ground: "paper",
      eyebrow: { today: "Keeping it", house: "Keeping it", room: "Keeping it" },
      header: { today: "It stays.", house: "It stays.", room: "It stays." },
      support: {
        today:
          "An album is for after, not just the day. Here is how long it stays.",
        house:
          "An album is for after, not just the day. Here is how long it stays.",
        room: "An album is for after, not just the day. Here is how long it stays.",
      },
      cards: [
        card(STAYS.steps[0], null, null),
        card(
          STAYS.steps[1],
          { body: "Yours until you say otherwise. No end date." },
          { body: "It stays until you say otherwise. No end date." },
        ),
        card(STAYS.steps[2], null, null),
        card(STAYS.steps[3], null, null),
        card(STAYS.notes[0], null, null),
        card(STAYS.notes[1], null, null),
        card(STAYS.notes[2], null, null),
      ],
      cardColumns: 4,
      cardNote:
        "Seven cards, one move, and both voices make it: No end date. leads on an absence, which ask 5 pushes to the second beat. The four steps and the three notes are constants in a sentence, so the voice reaches the order of the clauses and nothing else.",
    },
    {
      ground: "cinema",
      header: {
        today: "Give the next one an album.",
        house: "Give the next one an album.",
        room: "Put a code on the next table.",
      },
      support: {
        today: "Start free. Share one code and the album fills itself.",
        house: "Start free. Share one code and the album fills itself.",
        room: "Start free. Share one code and the album starts filling.",
      },
      cta: { today: "Start free", house: "Start free", room: "Start free" },
    },
  ],
};

/** /features/curation: the hero (from FEATURES above), the paper working
 *  chapter's four sections, and the band. */
export const CURATION_PAGE: WholePage = {
  slug: "curation",
  title: "/features/curation",
  sections: [
    {
      ground: "paper",
      eyebrow: {
        today: "The review queue",
        house: "The review queue",
        room: "The review queue",
      },
      header: {
        today: "Approve a whole event in one scroll.",
        house: "Approve a whole event in one scroll.",
        room: "Approve a whole event in one scroll.",
      },
    },
    {
      ground: "paper",
      eyebrow: {
        today: "Two ways to run it",
        house: "Two ways to run it",
        room: "Two ways to run it",
      },
      header: {
        today: "Live as it happens, or held for review.",
        house: "Live as it happens, or held for review.",
        room: "Live as it happens, or held for review.",
      },
      support: {
        today:
          "Casual events usually run live, so the room can watch the album grow. For weddings and conferences, flip on review and nothing unexpected reaches the big screen.",
        house:
          "Casual events usually run live, so the room can watch the album grow. For weddings and conferences, flip on review and every upload waits for you.",
        room: "Casual events run live, so the room watches the album grow. For a wedding or a conference, flip on review and every upload waits for you.",
      },
      cards: [
        inlineCard(
          {
            title: "Live",
            body: "Uploads appear the moment guests take them. The album fills in real time while the party is still going.",
          },
          null,
          {
            body: "Uploads land the moment guests take them. The album fills while the party is still going.",
          },
        ),
        inlineCard(
          {
            title: "Review",
            body: "Every upload waits for your approval before anyone else sees it. Skim the queue and clear it in one scroll.",
          },
          null,
          null,
        ),
      ],
      cardNote:
        "B drops in real time, which is an abstraction laid over a thing the reader is watching happen. Review holds: it is already written in B.",
    },
    {
      ground: "paper",
      eyebrow: {
        today: "Change your mind",
        house: "Change your mind",
        room: "Change your mind",
      },
      header: {
        today: "Nothing here has to be final.",
        house: "Every call here is reversible.",
        room: "Every call here comes back.",
      },
      support: {
        today:
          "Curation is a series of small, reversible calls. The only permanent delete is the one you confirm on purpose.",
        house:
          "Curation is a series of small, reversible calls. The only permanent delete is the one you confirm on purpose.",
        room: "Hide it, show it again, hide it again. The only permanent delete is the one you confirm on purpose.",
      },
      cards: [
        inlineCard(
          {
            title: "Hide",
            body: "One tap takes it off the guest album. It stays dimmed in your own view, so bringing it back is one more tap.",
          },
          null,
          null,
        ),
        inlineCard(
          {
            title: "Remove",
            body: `Deletes it from the album and into the Trash, where it waits ${RECENTLY_DELETED_WINDOW_DAYS} days before it\u2019s gone for good.`,
          },
          {
            body: `Moves it to the Trash, where it waits ${RECENTLY_DELETED_WINDOW_DAYS} days before it\u2019s gone for good.`,
          },
          {
            body: `It moves to the Trash and waits there ${RECENTLY_DELETED_WINDOW_DAYS} days before it\u2019s gone for good.`,
          },
        ),
        inlineCard(
          {
            title: "Restore",
            body: "Back exactly as it was, in the same spot, like nothing happened. An accidental swipe is never a disaster.",
          },
          null,
          null,
        ),
      ],
      cardNote:
        "Remove moves in both, because Deletes it from the album and into the Trash runs two prepositions off one verb. Hide and Restore hold.",
    },
    {
      ground: "paper",
      eyebrow: { today: "Bulk tools", house: "Bulk tools", room: "Bulk tools" },
      header: {
        today: "Sweep dozens in one pass.",
        house: "Sweep dozens in one pass.",
        room: "Sweep dozens in one pass.",
      },
      support: {
        today:
          "Big events fill fast, so the tools scale with them. Long-press any photo to start a selection, then feature, hide, or download the whole batch together. Curation takes minutes, not the morning after.",
        house:
          "Big events fill fast, so the tools scale with them. Long-press any photo to start a selection, then feature, hide, or download the whole batch together. Curation takes minutes, not the morning after.",
        room: "Long-press any photo to start a selection, then feature, hide, or download the whole batch together. A big event takes minutes, not the morning after.",
      },
    },
    {
      ground: "cinema",
      header: {
        today: "Your album, your call.",
        house: "Your album, your call.",
        room: "Your album, your call.",
      },
      support: {
        today:
          "Start your first event free. Let it fill live, or hold every upload for your approval.",
        house:
          "Start your first event free. Let it fill live, or hold every upload for your approval.",
        room: "Start your first event free. Let it fill live, or hold every upload for your approval.",
      },
      cta: { today: "Start free", house: "Start free", room: "Start free" },
    },
  ],
};

/**
 * How many of a page's CARD strings a candidate moves. Counted separately from
 * the thirty identity strings because it is the answer to a different
 * question: the cards carry more words than every heading on the page put
 * together, so this is the honest measure of what a voice costs on a feature
 * page. Both candidates come out low, and that is the finding, not an
 * omission: Will's 2026-09-02 finish pass wrote these sets in one length band
 * with the numbers derived from the constants the product enforces, and three
 * of the six sets quote the app's own helpers back to the reader.
 */
export function pageCardDiff(
  page: WholePage,
  id: VoiceId,
): { moved: number; total: number; cards: number } {
  let moved = 0;
  let total = 0;
  let cards = 0;
  for (const section of page.sections) {
    for (const c of section.cards ?? []) {
      cards += 1;
      for (const t of [c.title, c.body]) {
        total += 1;
        if (!held(t, id)) moved += 1;
      }
    }
  }
  return { moved, total, cards };
}

/* ---------------------------------------------------------------------------
 * THE UNFURL (the parked ruling)
 * ------------------------------------------------------------------------ */

/**
 * The account-required unfurl, both ways (the parked ruling). The string lives
 * at src/app/(guest)/e/[token]/page.tsx and is what a host's group chat renders
 * when the event asks guests to verify an email before uploading. The public
 * variant beside it is verbatim, so the pair reads as one set.
 */
export const UNFURL = {
  title: "Add photos to Maya & Jay's Wedding",
  publicLine:
    "Add your photos and videos to Maya & Jay's Wedding. No app, no account, just your phone.",
  options: [
    {
      id: "email",
      label: "Asks for an email",
      line: "Add your photos and videos. This event asks guests for an email.",
      note: "The host's word for it, and the guest register's rule: the reader's word, not the system's. Reads lighter in a group chat, which is the friction the product sells against.",
    },
    {
      id: "signin",
      label: "Asks to sign in",
      line: "Add your photos and videos. This event asks guests to sign in with an email.",
      note: "The app's word for it. Sets the true expectation of the door the guest meets, at the cost of sounding like the account step the page then spends a section promising is not there.",
    },
  ],
} as const;

/** The ruled thesis, and the one question candidate C leaves behind. */
export const THESIS = {
  ruled: "The whole event, in one album.",
  alternative: "The whole event, as everyone saw it.",
  note: "An album is a container anyone can offer; the same event from every camera in the room is only ours. Will's cadence is kept, so the ruling is one clause. This is all that survives of candidate C, which did not earn a column of its own across fifteen sections.",
};

/* ---------------------------------------------------------------------------
 * THE PASTES (a candidate is only ruled on if it can ship)
 * ------------------------------------------------------------------------ */

const NOTE_BY_ID: Record<VoiceId, string> = {
  today: "today's shipped lines",
  house: "candidate A, the house",
  room: "candidate B, the room",
};

/** The seven provisional home headers as the SECTION_HEADERS edit, ready to
 *  paste into src/lib/constants/marketing-voice.ts. */
export function sectionHeadersPaste(id: VoiceId): string {
  const lines = PROVISIONAL_HEADER_IDS.map((sectionId) => {
    const s = ARC.find((a) => a.id === sectionId);
    const key = HEADER_KEY_BY_ID[sectionId];
    return `  ${key}: {\n    line: ${JSON.stringify(pick(s?.header, id))},\n    status: "ruled",\n  },`;
  });
  return [
    `// The seven provisional home headers in ${NOTE_BY_ID[id]}`,
    "// (the brand-voice board, round two). Paste into SECTION_HEADERS.",
    ...lines,
  ].join("\n");
}

/** The thirty feature-page strings as the FEATURE_PAGES array, ready to paste
 *  into src/lib/constants/feature-pages.ts. */
export function featurePagesPaste(id: VoiceId): string {
  const entries = FEATURES.map(
    (f) =>
      `  {\n    slug: ${JSON.stringify(f.slug)},\n    navLabel: ${JSON.stringify(pick(f.navLabel, id))},\n    navDescription: ${JSON.stringify(pick(f.navDescription, id))},\n    h1: ${JSON.stringify(pick(f.h1, id))},\n    heroSub:\n      ${JSON.stringify(pick(f.heroSub, id))},\n    directoryLine:\n      ${JSON.stringify(pick(f.directoryLine, id))},\n  },`,
  );
  return [
    `// The six feature pages' thirty identity strings in ${NOTE_BY_ID[id]}`,
    "// (the brand-voice board, round two). Paste into FEATURE_PAGES.",
    "export const FEATURE_PAGES: FeaturePage[] = [",
    ...entries,
    "];",
  ].join("\n");
}

/* ---------------------------------------------------------------------------
 * THE VOICES IN USE (round four, 2026-09-15)
 * ------------------------------------------------------------------------ */

/**
 * ★ WHY THIS SECTION EXISTS, AND THE ONE RULE IT OBEYS.
 *
 * Will, after walking round three: "there's a handful of notes about the
 * voices, but not a lot of actual usage examples that I can get a feel for
 * each voice through... I would love to see the brand voices previewed on a
 * few different production UI areas across marketing and app." And: "a lot
 * just have the exact same versions with a note that says unchanged... it's
 * absolutely useless for a brand voice comparison here. Any examples should
 * actually show the distinction (can include similarities as well)."
 *
 * So the board now opens on the voices WRITING, not on notes about them: the
 * same real surface, written three ways, on the component that ships it.
 *
 * THE RULE THAT FIXES THE UNCHANGED ROWS, and the one thing to understand
 * about this data: here every voice WRITES every line, even where a sweep
 * would keep today's. That is a different question from the ledger chapters,
 * which count what a rewrite would actually MOVE (A moves 23 of 65 arc lines,
 * B 33) and mark a hold. A comparison exists to show a difference; a ledger
 * exists to price one. Keeping the two questions in one table was what
 * produced the useless rows.
 *
 * Where all three columns land on the SAME string anyway, the row carries
 * `same`: the reason the voice does not touch it, never the word unchanged. A
 * button that says Create your first event is not an omission, it is the
 * finding that a verb the host is about to press outranks a voice. The board
 * counts both (useTally below), so the claim is measured rather than asserted.
 */
export type UseLine = {
  /** The slot's name on the real surface (eyebrow, heading, body, action). */
  slot: string;
  trio: Trio;
  /**
   * Set ONLY where all three voices write the same string: why the line is
   * the same in every voice. Never "unchanged": a reader learns nothing from
   * that, which was the whole complaint.
   */
  same?: string;
  /** A rule already decides this line whatever the voice (bible 4 on a guest
   *  surface). Named, so a compliance fix never reads as an ask. */
  compelled?: string;
};

export type UseCase = {
  id: string;
  /** The surface, named the way a walker would name it. */
  surface: string;
  /** Where the strings live, so the infusion round can find them. */
  where: string;
  /** The guide's rule for this surface, in one line. */
  rule: string;
  lines: UseLine[];
  /** What separates the three voices HERE, in one or two sentences. */
  distinction: string;
};

/** A surface's slot, as a trio. Returns an empty trio rather than throwing:
 *  a board should render a missing line as nothing, not as a blank screen. */
export function slot(u: UseCase, name: string): Trio {
  return (
    u.lines.find((l) => l.slot === name)?.trio ?? {
      today: "",
      house: "",
      room: "",
    }
  );
}

/** One slot, in one voice. */
export function say(u: UseCase, name: string, id: VoiceId): string {
  return pick(slot(u, name), id);
}

/** True when all three voices write the same string on a slot. */
export function sameInAll(t: Trio): boolean {
  return t.today === t.house && t.house === t.room;
}

/**
 * The measured answer to Will's second note, printed on the board: how many
 * rows show a difference, and how many are the same in all three with the
 * reason stated. A row that is the same in all three WITHOUT a reason is a
 * defect, so it is counted separately and the board says so out loud.
 */
export function useTally(groups: UseCase[][]): {
  rows: number;
  differ: number;
  same: number;
  unexplained: number;
} {
  const all = groups.flat().flatMap((u) => u.lines);
  const same = all.filter((l) => sameInAll(l.trio));
  return {
    rows: all.length,
    differ: all.length - same.length,
    same: same.length,
    unexplained: same.filter((l) => !l.same).length,
  };
}

/**
 * An ARC section's slot, by id rather than by index: the usage chapter and the
 * ledger chapters have to show the SAME line for the same section, and an
 * index silently points at a different section the moment the arc is reordered
 * (it already did once in this file's life).
 */
function arcSlot(
  id: string,
  key: "eyebrow" | "header" | "support" | "cta",
): Trio {
  return (
    ARC.find((s) => s.id === id)?.[key] ?? { today: "", house: "", room: "" }
  );
}

/* --- Marketing, loud ---------------------------------------------------- */

/**
 * The five marketing surfaces, in the order a reader meets them. The hero and
 * the paper chapter quote the ARC trios above verbatim so the board tells ONE
 * story: what chapter 1 shows in use is the same line chapter 5's ledger
 * prices. The card set, the pricing pair and the help opening are written
 * here, since round three's chapters carried them only as counts.
 */
export const MARKETING_USE: UseCase[] = [
  {
    id: "home-hero",
    surface: "The home hero",
    where: "app/(marketing)/(cinema)/page.tsx, SITE_THESIS and SITE_SUBHEAD",
    rule: "The h1 is the whole product in one line and the subhead is the mechanism in one sentence. The h1 never explains; the subhead never sells a second time.",
    lines: [
      { slot: "eyebrow", trio: arcSlot("cinema-hero", "eyebrow") },
      { slot: "heading", trio: arcSlot("cinema-hero", "header") },
      { slot: "subhead", trio: arcSlot("cinema-hero", "support") },
      { slot: "cta", trio: arcSlot("cinema-hero", "cta") },
    ],
    distinction:
      "The sharpest pair on the board. A writes today's two ruled lines back, because keeping them IS A's argument: the thesis and the subhead were ratified on 2026-08-25 and A says the voice already lives in them. B writes a different sentence about the same product, and the eyebrow underneath shows the two philosophies in five words each: today names three absences, A names a sequence, B names a state. Read the h1 rows under the stage for what B costs.",
  },
  {
    id: "album-chapter",
    surface: "A chapter header and its body",
    where: "components/marketing/sections/home/album-section.tsx",
    rule: "A claim the section then proves, never the category it belongs to. The body is one sentence that earns the header, and the chevron is the reader's next step.",
    lines: [
      {
        slot: "eyebrow",
        trio: arcSlot("album", "eyebrow"),
        same: "An eyebrow on this page is a chapter mark, and the chapter is the album. A voice that renames it is naming a different section, which is a structure question rather than a copy one.",
      },
      { slot: "heading", trio: arcSlot("album", "header") },
      { slot: "subhead", trio: arcSlot("album", "support") },
      {
        slot: "cta",
        trio: arcSlot("album", "cta"),
        same: "A chevron link is the reader's next step, not a sentence: it names the place it goes. All three voices write the destination.",
      },
    ],
    distinction:
      "The paper masthead, the one left-aligned header on the home page, and the place the three voices are furthest apart. Today states a mechanism (every photo comes to you first). A states what the host ends up holding. B states a count nobody had to chase, which is the only one of the three a shared folder could not say back.",
  },
  {
    id: "feature-cards",
    surface: "A feature card set",
    where: "components/marketing/sections/features/album/album-copy.ts, GETTING_IN",
    rule: "A card is read in a row of cards, so it is scannable and different from its neighbours in substance. One line, no verb in front: the title carries the name.",
    lines: [
      {
        slot: "subhead",
        trio: {
          today:
            "Guests point a camera at the code, land on a welcome screen, and start adding. New events ask for an email first.",
          house:
            "A camera, a code, a welcome screen, and your guests are adding. New events ask for an email first.",
          room: "A phone finds the code, a welcome screen opens, and photos start arriving. New events ask for an email first.",
        },
      },
      {
        slot: "card1-title",
        trio: {
          today: "No app, ever",
          house: "The browser they already have",
          room: "It opens in a browser",
        },
      },
      {
        slot: "card1-body",
        trio: {
          today:
            "The code opens the album in the browser they already have. Point, tap, add. Nothing to install.",
          house:
            "The code opens the album in the browser on their phone, and they are adding a tap later. Nothing to install.",
          room: "A camera finds the code and the album opens in the browser already on the phone. Point, tap, add.",
        },
      },
      {
        slot: "card2-title",
        trio: {
          today: "Names, if you want them",
          house: "A name on every photo, if you want one",
          room: "Names, if you ask for them",
        },
      },
      {
        slot: "card2-body",
        trio: {
          today:
            "Require accounts and guests confirm an email once. Switch it off and anyone with the link can add.",
          house:
            "Ask for an email and each guest confirms one once, so every photo arrives with a name on it. Switch it off and anyone with the link can add.",
          room: "Ask for an email and a guest confirms one once, on the phone they are already holding. Switch it off and anyone with the link adds.",
        },
      },
      {
        slot: "card3-title",
        trio: {
          today: "One link, forever",
          house: "One link, and it keeps working",
          room: "The code is the album",
        },
      },
      {
        slot: "card3-body",
        trio: {
          today:
            "The code is the album link. Scan it, tap it in a chat, open it later. Pro and Event Pass can name it.",
          house:
            "The code is the album link: scan it at the door, tap it in a chat, open it next year. Pro and Event Pass can name it.",
          room: "Scan it at the door, tap it in the group chat, open it next March. It is the same link the whole time, and Pro can name it.",
        },
      },
    ],
    distinction:
      "Three cards read across, not down: the test is whether the row still scans when the eye takes a second each. Today names what is absent, what is optional and what is permanent. A turns each into the thing the host holds. B puts the phone in the sentence, which is the most concrete of the three and also the longest, and on a three-up grid length is the cost: the band album-copy.ts was written to is about forty characters a row.",
  },
  {
    id: "pricing-card",
    surface: "The pricing pair",
    where: "components/marketing/sections/pricing/plan-cards.tsx, numbers from tiers.ts",
    rule: "A plan is a fact and a price. The tagline says who the plan is for, the list says what arrives, and the footnote answers the one thing a reader is afraid of.",
    lines: [
      {
        slot: "free-tagline",
        trio: {
          today: "Your first event, covered.",
          house: "Your first event, and everyone in it.",
          room: "One event, and every photo that lands in it.",
        },
      },
      {
        slot: "free-item",
        trio: {
          today: "No watermark on photos or the album",
          house: "Full-size photos, no watermark",
          room: "Photos come out the size they went in",
        },
      },
      {
        slot: "free-cta",
        trio: {
          today: "Start free",
          house: "Start free",
          room: "Start free",
        },
        same: "Two words, a verb and the price. Every voice writes it, and a voice that improves on it has started selling on a button.",
      },
      {
        slot: "free-note",
        trio: {
          today: "No card. Upgrade only when you host again.",
          house: "No card, and you upgrade only when you host again.",
          room: "No card. Upgrade when you host the next one.",
        },
      },
      {
        slot: "pro-tagline",
        trio: {
          today: "For hosts who host again.",
          house: "For the next one, and the one after.",
          room: "For hosts already planning the next one.",
        },
      },
      {
        slot: "pro-item",
        trio: {
          today: "Password-locked albums and custom links",
          house: "Password-locked albums, and links you name",
          room: "Lock an album, name its link",
        },
      },
      {
        slot: "pro-note",
        trio: {
          today: "Change size or cancel any time in the billing portal.",
          house: "Change the size, or stop, any time in the billing portal.",
          room: "Move up a size or stop any time, from the billing portal.",
        },
      },
    ],
    distinction:
      "The one surface where the voice has to stay out of the way of a number: every figure on these cards renders from tiers.ts and no voice touches it. What a voice can move is the tagline and the footnote, which is where a reader decides whether we are going to charge them by surprise. Today's Free tagline is a passive (covered by whom?); A names who is covered; B names what lands. The footnote is the one line on the page a nervous reader rereads, and all three keep No card first.",
  },
  {
    id: "help-open",
    surface: "A help article's opening",
    where: "content/help/an-upload-wont-finish.mdx, its front matter and first paragraph",
    rule: "The title is the reader's question in the reader's words. The description is the short answer, written so someone could stop reading after it.",
    lines: [
      {
        slot: "title",
        trio: {
          today: "An upload won't finish",
          house: "An upload won't finish",
          room: "An upload won't finish",
        },
        same: "A help title is also the search string and the tab title, so the reader's words outrank the voice. This is the one surface where the guide says so outright, and all three voices yield the same way.",
      },
      {
        slot: "description",
        trio: {
          today:
            "A stuck upload is almost always the connection: tap the dimmed tile to retry. A refused one tells you why (too large, wrong type, uploads closed). Big videos need a steady connection and time.",
          house:
            "A stuck upload is almost always the connection, and a tap on the dimmed tile finishes it. A refused one tells you why: too large, wrong type, uploads closed.",
          room: "Tap the dimmed tile and a stuck upload usually finishes: it is almost always the connection. A refused one says why, and a big video needs a steady signal and time.",
        },
      },
      {
        slot: "first",
        trio: {
          today:
            "Uploads go one file at a time, and each one either lands with a green check or turns dim with Tap to retry. The message on the toast tells you which of these it is.",
          house:
            "Uploads go one file at a time, and each one either lands with a green check or turns dim with Tap to retry. The toast tells you which.",
          room: "Files go up one at a time. Each one lands with a green check or turns dim with Tap to retry, and the toast says which it was.",
        },
      },
    ],
    distinction:
      "The surface that costs a ruling the least and shows the register the clearest. The title holds in every voice by the guide's own rule; underneath it, A tightens the shipped sentence and B leads with the tap, because a reader on this page is holding a phone with a stuck upload on it. All 59 articles are written to this shape, which is why a voice ruling costs the help catalogue nothing.",
  },
];

/* --- The app, quiet ----------------------------------------------------- */

/**
 * The host's app, on the components that ship it. Will's fourth global note
 * opened the app's UI to a lab track, so these render on the real app ground
 * (light or dark, from the dock) rather than as text in a card, which is what
 * round three did and what made the register hard to judge.
 */
export const APP_USE: UseCase[] = [
  {
    id: "dashboard-empty",
    surface: "The dashboard's empty state",
    where: "components/app/dashboard/events-empty-teaser.tsx",
    rule: "One clause, the verb on the button beneath it, and then it stops. An absence may be the second beat, never the first, and never both.",
    lines: [
      {
        slot: "heading",
        trio: {
          today: "Your events land here",
          house: "Your events land here",
          room: "Your events land here",
        },
        same: "An arrival, in the present, with the host's own noun in it. Every voice writes this line, and finding it already shipped is the strongest evidence the app register was half-written before anyone wrote it down.",
      },
      {
        slot: "body",
        trio: {
          today:
            "Create an event and your guests add photos and videos in seconds. No app, no account, just a QR code.",
          house:
            "Create an event, share the code, and your guests add photos and videos in seconds.",
          room: "Create an event and share one code. Photos start arriving in seconds, from any phone in the room.",
        },
      },
      {
        slot: "action",
        trio: {
          today: "Create your first event",
          house: "Create your first event",
          room: "Create your first event",
        },
        same: "The verb the host is about to press. A button is the one place a voice never gets to be interesting, and both candidates handed this one straight back.",
      },
    ],
    distinction:
      "The clearest case of the marketing argument leaking into the product: the shipped blurb leads with an arrival and then spends its whole second half on three absences, to a host who is already signed in and reading their own dashboard. A cuts the second half. B replaces it with what happens next. Nothing else on the surface moves, and that is the register: a quiet surface fails by saying too much, not by saying it wrong.",
  },
  {
    id: "event-card",
    surface: "The event card's pills",
    where: "components/app/event-card.tsx, labels from dashboard/events-section.tsx",
    rule: "A pill is a fact about the host's own event in the fewest words that stay true. Never a sentence, never a promise.",
    lines: [
      {
        slot: "items",
        trio: {
          today: "128 items",
          house: "128 in the album",
          room: "128 in the album",
        },
      },
      {
        slot: "status",
        trio: { today: "Open", house: "Open", room: "Open" },
        same: "A state pill is a state. The only question a voice could raise here is whether the other state says Closed or something softer, and that is a product question rather than a copy one.",
      },
      {
        slot: "review",
        trio: {
          today: "3 to review",
          house: "3 to review",
          room: "3 waiting on you",
        },
      },
    ],
    distinction:
      "Both candidates land on the same items pill from opposite directions: A because item is a database word and the host's word is album, B because a pill should say where a thing is rather than what it is. The amber chip is where they part. A keeps the instruction, since the chip is a to-do and the host taps it to act. B makes it a state, which reads warmer and, on a card the host sees ten times a day, slightly less useful. This is a row where the recommendation loses.",
  },
  {
    id: "wizard",
    surface: "The create-event wizard, its three steps",
    where: "components/app/create-event-wizard.tsx",
    rule: "A step is a label, a field is a noun, and the helper is the one fact the host needs in order to answer. The product never sells inside itself.",
    lines: [
      {
        slot: "title",
        trio: {
          today: "Create an event",
          house: "Create an event",
          room: "Create an event",
        },
        same: "Three words, a verb and the host's noun. It is the page's job title, and every voice writes it the same way.",
      },
      {
        slot: "description",
        trio: {
          today:
            "Name it, pick a QR style, and you're ready to collect photos.",
          house: "Name it, pick a QR style, and it's ready for your guests.",
          room: "Name it, style the code, and it's ready for your guests to scan.",
        },
      },
      {
        slot: "steps",
        trio: {
          today: "Details · Design · Share",
          house: "Details · Design · Share",
          room: "Name · Code · Share",
        },
      },
      {
        slot: "date-helper",
        trio: {
          today: "Just for your reference: events never expire.",
          house: "For your reference only. Events never expire.",
          room: "For your own reference. An event stays until you delete it.",
        },
      },
      {
        slot: "qr-title",
        trio: {
          today: "Guest join QR",
          house: "The QR your guests scan",
          room: "The code your guests scan",
        },
      },
      {
        slot: "qr-body",
        trio: {
          today:
            "Pick a style for the QR your guests scan. You can change it anytime.",
          house: "Pick a style. You can change it any time.",
          room: "Pick a style now, change it any time.",
        },
      },
      {
        slot: "share-body",
        trio: {
          today:
            "Print or display the QR, or share the link. Guests just open it. No app, no account.",
          house:
            "Print the QR, put it on a table, or send the link. Guests just open it.",
          room: "Put the code on a table or send the link. A guest opens it and starts adding.",
        },
      },
    ],
    distinction:
      "Three steps is where a voice either helps a host finish or slows them down. The step labels are the argument: today names an activity (Details, Design), B names the thing being made (Name, Code), and a host halfway through a form reads the nouns rather than the verbs. The date helper carries a real finding rather than a preference: events never expire is not quite what the product does, and an event stays until you delete it is, which is the anti-abuse rule the whole lifecycle rests on.",
  },
  {
    id: "toast",
    surface: "A toast",
    where: "components/app/event-feed/event-feed.tsx and app/host-media-grid.tsx",
    rule: "A toast says what just happened, in the app's own noun, and it is gone in four seconds. Never a thank-you, never a sentence about us.",
    lines: [
      {
        slot: "review-on",
        trio: {
          today: "Review is on. New uploads wait here for approval.",
          house: "Review is on. New uploads wait for your approval.",
          room: "Review is on. New uploads wait here for you.",
        },
      },
      {
        slot: "hidden",
        trio: {
          today: "Hidden from everyone",
          house: "Hidden from your guests",
          room: "Hidden. Only you can see it.",
        },
      },
    ],
    distinction:
      "Hidden from everyone is the kind of line that is true and still wrong: the host can still see the photo, so everyone means everyone but you, and a warning toast is the worst place to make a host stop and work that out. Both candidates fix it and they disagree about how much to say in a four-second window. This is the register at its smallest scale, and the shipped review toast is already the shape both candidates write back.",
  },
  {
    id: "error",
    surface: "An error",
    where: "components/guest/enter-event-prompt.tsx and components/guest/guest-upload.tsx",
    rule: "Say what did not happen, in the app's own noun, then the one thing to do next. Never apologise, never blame the reader, never explain the system.",
    lines: [
      {
        slot: "signin",
        trio: {
          today:
            "That email and password didn't match. Try the email link instead.",
          house:
            "That email and password didn't match. Try the email link instead.",
          room: "That email and password didn't match. Try the email link instead.",
        },
        same: "The error a guest actually meets on the password path, and it already writes the shape: what did not happen, then the one move left. Its pointer to the email link is load-bearing rather than stylistic, because a line that named which half was wrong would confirm whether an account exists, so no voice touches it. The validation fallback two branches above it sits behind a per-field message and is effectively unreachable, which is why the reachable line is the one on the board.",
      },
      {
        slot: "upload-title",
        trio: {
          today: "Couldn't add that photo",
          house: "Couldn't add that photo",
          room: "Couldn't add that photo",
        },
        same: "Four words, the app's own verb, and the reason arrives underneath from the server. Both candidates wrote it straight back, which is the guide's error shape already shipped.",
      },
      {
        slot: "upload-body",
        trio: {
          today: "That file type isn't supported.",
          house: "Photos need to be JPEG, PNG, WebP, HEIC, HEIF or AVIF.",
          room: "Photos go up as JPEG, PNG, WebP, HEIC, HEIF or AVIF.",
        },
      },
    ],
    distinction:
      "The sign-in error is settled before the voices arrive: it names what did not happen and then the one move left, and its pointer to the email link is an account-enumeration decision rather than a preference, so all three write it back. The upload pair is where the voices work, and the title holds there too, because four words in the app's own verb is already the shape. So the whole difference falls on the description underneath, which is the other half of an error: a type that is not supported is useless without the list of the ones that are. A writes that list as a requirement (photos need to be), B as a fact about what the product does (photos go up as), and the second spends no words instructing a guest whose only move is to pick another file.",
  },
  {
    id: "notification",
    surface: "A notification",
    where: "lib/notifications/build.ts",
    rule: "Name what happened to the host's own thing. The body says what follows, in the present, and commits to an outcome rather than to a mechanism.",
    lines: [
      {
        slot: "pending-title",
        trio: {
          today: "3 uploads to review",
          house: "3 uploads to review",
          room: "3 uploads to review",
        },
        same: "A count and the host's own noun, front-loaded for a notification list that truncates. Every voice writes it.",
      },
      {
        slot: "pending-body",
        trio: {
          today: "Guests are waiting for your approval.",
          house: "They go into the album as soon as you approve them.",
          room: "Approve them and they are in the album.",
        },
      },
      {
        slot: "storage-title",
        trio: {
          today: "You're over your storage limit",
          house: "You're over your storage limit",
          room: "You're over your storage limit",
        },
        same: "The fact about the host's own account, in the fewest words. A softer opening here would be a kindness that costs the host their photos.",
      },
      {
        slot: "storage-body",
        trio: {
          today: "Upgrade or remove media before we auto-reduce it.",
          house: "Upgrade or clear some space and everything stays.",
          room: "Upgrade or clear some space, and nothing has to go.",
        },
      },
    ],
    distinction:
      "The storage line breaks two rules in nine words: it names the machinery (auto-reduce) and then threatens the host with it. Both candidates state the same fact as what the host keeps, which is the fence do 2 was written for: copy commits to outcomes, never to what does the work. On the review line, today tells the host what the guests are doing and both candidates tell them what happens to the album, which is the thing they are actually deciding about.",
  },
  {
    id: "account",
    surface: "The account page",
    where: "app/(app)/account/page.tsx",
    rule: "A label is the noun the host would use for the thing, never a sentence and never a promise. The description is the short answer, written so someone could stop reading after it.",
    lines: [
      {
        slot: "labels",
        trio: {
          today:
            "Profile · Public profile · Connections · Password · Email preferences",
          house:
            "Profile · Public profile · Connections · Password · Email preferences",
          room: "Profile · Public profile · Connections · Password · Email preferences",
        },
        same: "Five labels, five nouns, and a label the host already reads correctly is finished. Both candidates handed all five back, which is what a settings page should cost a voice ruling.",
      },
      {
        slot: "profile-help",
        trio: {
          today:
            "Your page on Partyreel: the events you host and choose to share, plus events you joined. Follower counts stay private to you.",
          house:
            "The events you host and share, plus the ones you joined. Follower counts stay private to you.",
          room: "The events you host and share, and the ones you joined. Follower counts stay private to you.",
        },
      },
    ],
    distinction:
      "The one row on the page that moves, and it moves for a structural reason rather than a stylistic one: the description opened by explaining what a profile IS to a host standing on their own account page. Both candidates cut the clause and keep the sentence that carries the fact a host actually wonders about, which is who can see the follower count.",
  },
];

/* --- A guest's phone, and the inbox ------------------------------------- */

/**
 * The guest register and the one email surface, at 375 because that is where
 * they render. Bible 4 is the whole rule on the first four: the event belongs
 * to the host and Partyreel stays nearly silent.
 */
export const GUEST_USE: UseCase[] = [
  {
    id: "guest-door",
    surface: "The door a guest meets",
    where: "components/guest/entry-modal.tsx",
    rule: "The event's name leads and ours stays out of the way. The host's business, stated plainly, in the guest's words.",
    lines: [
      {
        slot: "title",
        trio: {
          today: "Welcome to Maya & Jay's Wedding",
          house: "Welcome to Maya & Jay's Wedding",
          room: "Welcome to Maya & Jay's Wedding",
        },
        same: "The host's event name, first and largest. Bible 4 decides this line before a voice gets to it, and all three voices agree the door is the host's.",
      },
      {
        slot: "public-body",
        trio: {
          today: "A shared gallery for the whole event.",
          house: "One album, from everyone who came.",
          room: "One album, filling up all night.",
        },
      },
      {
        slot: "gated-body",
        trio: {
          today:
            "Create a free account to see the full gallery and add your own photos.",
          house:
            "Maya and Jay ask guests for an email. Add it once and you can add photos.",
          room: "Maya and Jay ask for an email first. Add it once and you're in.",
        },
        compelled: "bible 4 refuses the shipped line",
      },
      {
        slot: "private-body",
        trio: {
          today: "Enter the event password to view it.",
          house: "Enter the password Maya and Jay gave you.",
          room: "Enter the password Maya and Jay sent you.",
        },
      },
      {
        slot: "action",
        trio: { today: "Continue", house: "Continue", room: "Continue" },
        same: "One word, and the guest has already decided. Every voice leaves it alone.",
      },
    ],
    distinction:
      "The public line is the software describing itself (a shared gallery) against what the guest is actually looking at, and it is also where the album and gallery split is visible in one screen: the site says album in every heading and the guest surface says gallery five times. The gated line is marked because bible 4 already refuses it: it asks a guest to make an account with US, on the host's own page. Both candidates hand the ask back to the host, who is the one who turned it on.",
  },
  {
    id: "upload-sheet",
    surface: "The upload sheet a guest sees",
    where: "components/guest/file-dropzone.tsx, guest-upload.tsx, save-account-prompt.tsx",
    rule: "The verb on the control, and the one way to use it. No sentence, no promise, and the host's name wherever the host is the one deciding.",
    lines: [
      {
        slot: "dropzone-title",
        trio: {
          today: "Add photos & videos",
          house: "Add photos & videos",
          room: "Add photos & videos",
        },
        same: "The verb and the two nouns it takes. Both candidates wrote it back, and the ampersand stays because the control is 180 pixels wide on a phone.",
      },
      {
        slot: "dropzone-hint",
        trio: {
          today: "Tap to choose, or drag them here",
          house: "Tap to choose, or drag them here",
          room: "Tap to choose, or drag them here",
        },
        same: "A verb, then how. This is the guest register's own shape, shipped, and neither candidate could improve it without making it longer.",
      },
      {
        slot: "moderation",
        trio: {
          today:
            "The host reviews uploads before they appear in the gallery.",
          house:
            "Maya and Jay review photos before they appear in the album.",
          room: "Maya and Jay see everything first. Approved photos appear in the album.",
        },
      },
      {
        slot: "save-title",
        trio: {
          today: "Keep these photos",
          house: "Keep these photos",
          room: "Keep these photos",
        },
        same: "The guest's own reason for tapping, in three words. Every voice writes it.",
      },
      {
        slot: "save-body",
        trio: {
          today:
            "Create a free account to save this event and come back to the gallery whenever you want.",
          house:
            "Save this event and come back to the album whenever you want. A free account keeps it.",
          room: "Save the album and open it again whenever you want. A free account keeps it on your list.",
        },
      },
      {
        slot: "confirmation",
        trio: {
          today: "Sent, waiting for host approval",
          house: "Sent. Maya and Jay will approve it.",
          room: "Sent. Maya and Jay see it next.",
        },
      },
    ],
    distinction:
      "Two of these five are the same in every voice, and that is the chapter's finding rather than a gap: the guest surface was the closest thing to a written voice this product had. What moves is where a host is the one deciding. The host becomes Maya and Jay, and the gallery becomes the album, which is ask 6 answered in the one place a guest can see both nouns at once. The save card is the ONE place Partyreel legitimately speaks on a guest surface, because the guest has already added a photo and is being offered our thing rather than met at the door with it.",
  },
  {
    id: "guest-empty",
    surface: "The empty album",
    where: "components/guest/gallery-empty-state.tsx",
    rule: "One line about what is about to arrive, then the button that starts it.",
    lines: [
      {
        slot: "heading",
        trio: {
          today: "This is where it all lands",
          house: "This is where it all lands",
          room: "This is where it all lands",
        },
        same: "An arrival, present tense, no brand anywhere in it. It is the single best line in the product and all three voices write it, which is how the guide knew what it was describing.",
      },
      {
        slot: "action",
        trio: {
          today: "Be the first to add a photo",
          house: "Be the first to add a photo",
          room: "Add the first photo",
        },
      },
    ],
    distinction:
      "One word of distance between the two candidates, and it is the whole difference between them. Be the first is a small flattery that A keeps, because a guest standing in front of an empty album needs a nudge more than they need economy. B trims it to the verb, which is what the register says and slightly colder on the one screen where warmth is the product.",
  },
  {
    id: "email",
    surface: "An email subject and its opening",
    where: "lib/email/templates.ts, inactivityWarningEmail",
    rule: "Name what happened to the reader's own thing, front-loaded for a truncating inbox. The first line leads with what keeps it; the policy arrives second.",
    lines: [
      {
        slot: "subject",
        trio: {
          today: "Your Partyreel event will be removed soon",
          house: "Your Partyreel event will be removed soon",
          room: "Maya & Jay's Wedding will be removed soon",
        },
      },
      {
        slot: "headline",
        trio: {
          today: "Keep your event active",
          house: "Keep your event",
          room: "Open it and it stays",
        },
      },
      {
        slot: "first",
        trio: {
          today:
            "Your event Maya & Jay's Wedding hasn't been used in a while. To keep free accounts tidy, we remove events after 6 months of inactivity. Yours is set for removal on 14 March. Just sign in or open it before then to keep it.",
          house:
            "Open Maya & Jay's Wedding before 14 March and it stays. Free events are removed after 6 months without a visit.",
          room: "Open Maya & Jay's Wedding before 14 March and it stays, photos and all. Free events are removed after six months without a visit.",
        },
      },
      {
        slot: "button",
        trio: {
          today: "Keep my event",
          house: "Keep my event",
          room: "Open the album",
        },
      },
    ],
    distinction:
      "The subject is a real trade rather than a preference. A keeps Partyreel in it, because an inbox sorts and searches by our name and this mail arrives months after the party. B puts the reader's own event first, which is the guide's rule everywhere else and costs the sorting. The opening is not a trade: today spends its first sentence on an absence and its second on our housekeeping, and the one action that saves the album arrives fourth. Both candidates lead with it.",
  },
];

export const USE_GROUPS: { title: string; cases: UseCase[] }[] = [
  { title: "Marketing, loud", cases: MARKETING_USE },
  { title: "The app, quiet", cases: APP_USE },
  { title: "A guest's phone, and the inbox", cases: GUEST_USE },
];
