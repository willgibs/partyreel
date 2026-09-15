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
    id: "today",
    name: "Today",
    rationale:
      "The shipped strings, verbatim. The voice is unwritten, so the arc drifts between an absence, a state and an instruction.",
    paragraph:
      "Unwritten. The only copy rule in the repo is the em-dash ban, so the voice is whatever the eight ratified golden lines happen to have in common: warm, plain, second person, two beats on a comma. Nothing says what a line should be ABOUT, which is why three of the seven provisional home headers are built out of an absence, one is a tautology, and the eyebrows above them name a category instead of a claim.",
    cost: "Nothing to adopt, and nothing to hold the next hundred lines to.",
  },
  {
    id: "house",
    name: "A. The house",
    rationale:
      "A tuning. The voice already exists in the eight ratified lines; write it down, then bring back the lines that drifted. A sentence is about what the host ends up holding.",
    paragraph:
      "Partyreel sounds like a good host: plain, warm, specific, with nothing abstract in it. A line is a noun phrase and a turn, hinged on a comma, and it is about what the host ends up holding. It says photo, video, phone, code, album, guest and link, and it leaves memories and magic to someone else. It calls the host you, it leads with what the reader gets, and it lets whatever we spare them arrive in the second half of the sentence. This is the voice the eight ratified lines already speak; the guide writes it down and tunes the lines that have not caught up.",
    cost: "It changes the least, so it lifts the least: the feature pages were already written in this register, and A holds most of their thirty strings unchanged.",
  },
  {
    id: "room",
    name: "B. The room",
    rationale:
      "A rebuild from the product's one idea: the code becoming the album. Verb in front, present tense, the room as the setting, real counts as evidence. A sentence is about the moment, not the object.",
    paragraph:
      "Partyreel talks the way a good host talks while the party is still going: present tense, plain nouns, one breath per sentence. Every line is about something arriving. A code goes on a table, phones find it, an album fills with the event as everyone saw it, and the voice stays inside that moment instead of describing it from afterwards. It is warm because it is specific, not because it is friendly: it says photo, video, phone, code, album, guest, link, and it leaves memories, magic and journeys to someone else. It calls the host you and the guests everyone. It leads with what the reader gets, so the things Partyreel spares them (an app, an account, a group chat the morning after) land in the second half of a sentence and never the first. And it changes volume, not vocabulary: loud here, quiet in the product, nearly silent on a guest's screen.",
    cost: "Its sentences run longer, so the hero h1 takes four lines at 375 against today's two, and it rewrites more of the site than any other answer.",
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
 * TWO FEATURE PAGES, WHOLE
 * ------------------------------------------------------------------------ */

export type PageSection = {
  ground: "cinema" | "paper";
  eyebrow?: Trio;
  header: Trio;
  support?: Trio;
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
        room: "Open any photo and the name is right there. A guest picks a display name once and it rides on everything they add.",
      },
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

/* ---------------------------------------------------------------------------
 * THE QUIET REGISTER, ON REAL APP COPY
 * ------------------------------------------------------------------------ */

export type Surface = {
  surface: string;
  /** Where the string lives, so the infusion round can find it. */
  where: string;
  rule: string;
  today: { title: string; body?: string; action?: string };
  proposed: { title: string; body?: string; action?: string };
  note: string;
};

/**
 * Shown ONCE, not per candidate: the quiet register does not fork with the
 * voice (round one's finding, carried). Round two widens it from four sample
 * surfaces to the real app copy the brief named: the dashboard's empty state,
 * an error, two notifications, an email subject with its first line, and the
 * account page's labels.
 */
export const QUIET_SURFACES: Surface[] = [
  {
    surface: "The dashboard's empty state",
    where: "components/app/dashboard/events-empty-teaser.tsx",
    rule: "One clause, the verb on the button beneath it, and then it stops. An absence may be the second beat, never the first, and never both.",
    today: {
      title: "Your events land here",
      body: "Create an event and your guests add photos and videos in seconds. No app, no account, just a QR code.",
      action: "Create your first event",
    },
    proposed: {
      title: "Your events land here",
      body: "Create an event, share one code, and your guests start adding photos in seconds.",
      action: "Create your first event",
    },
    note: "The heading is already an arrival and stays. The blurb led with an arrival, then spent its whole second half on three absences, which is the marketing argument repeated inside the product to a host who is already here.",
  },
  {
    surface: "An error",
    where: "components/guest/enter-event-prompt.tsx",
    rule: "Say what did not happen, in the app's own noun, then the one thing to do next. Never apologise, never blame the reader, never explain the system.",
    today: { title: "Check the form and retry." },
    proposed: { title: "Couldn't sign you in. Check the email and password." },
    note: "The shipped fallback names no failure and asks the reader to audit themselves. The rewrite states what did not happen, then the one thing to do.",
  },
  {
    surface: "A notification",
    where: "lib/notifications/build.ts",
    rule: "Name what happened to the host's own thing. The body says what follows, in the present, and commits to an outcome rather than to a mechanism.",
    today: {
      title: "3 uploads to review",
      body: "Guests are waiting for your approval.",
    },
    proposed: {
      title: "3 uploads to review",
      body: "They go into the album as soon as you approve them.",
    },
    note: "The title is already right. The body says what the guests are doing; the rewrite says what happens next to the album, which is the thing the host is deciding about.",
  },
  {
    surface: "A notification, the storage one",
    where: "lib/notifications/build.ts",
    rule: "The same, and never name the machinery: copy commits to outcomes, never to what does the work.",
    today: {
      title: "You're over your storage limit",
      body: "Upgrade or remove media before we auto-reduce it.",
    },
    proposed: {
      title: "You're over your storage limit",
      body: "Upgrade or clear some space and everything stays.",
    },
    note: "Naming the mechanism and then threatening with it is two rules at once. Same fact, stated as what the host keeps.",
  },
  {
    surface: "An email subject and its first line",
    where: "lib/email/templates.ts, inactivityWarningEmail",
    rule: "Name what happened to the reader's own thing, front-loaded for a truncating inbox. The first line leads with what keeps it, and the policy arrives second.",
    today: {
      title: "Your Partyreel event will be removed soon",
      body: "Your event Maya & Jay's Wedding hasn't been used in a while. To keep free accounts tidy, we remove events after 6 months of inactivity.",
    },
    proposed: {
      title: "Your Partyreel event will be removed soon",
      body: "Open Maya & Jay's Wedding before 14 March and it stays. Free events are removed after 6 months without a visit.",
    },
    note: "The subject already names the reader's thing first and stays. The first line opened on an absence and a housekeeping rationale; the rewrite leads with the one action that keeps the album, and the deadline sits in the sentence the reader actually reads.",
  },
  {
    surface: "The account page's labels",
    where: "app/(app)/account/page.tsx",
    rule: "A label is the noun the host would use for the thing, never a sentence and never a promise. The description is the short answer, written so someone could stop reading after it.",
    today: {
      title:
        "Profile  ·  Public profile  ·  Connections  ·  Password  ·  Email preferences",
      body: "Public profile: Your page on Partyreel: the events you host and choose to share, plus events you joined. Follower counts stay private to you.",
    },
    proposed: {
      title:
        "Profile  ·  Public profile  ·  Connections  ·  Password  ·  Email preferences",
      body: "Public profile: The events you host and share, plus the ones you joined. Follower counts stay private to you.",
    },
    note: "Five labels, five nouns, all unchanged: a label the host already reads correctly is finished. One description carried a colon clause explaining what a profile is to a host standing on their own account page.",
  },
];

/* ---------------------------------------------------------------------------
 * THE GUEST REGISTER
 * ------------------------------------------------------------------------ */

/**
 * The demo guest page's real lines, with Partyreel nearly silent (bible 4).
 * The event is "Maya & Jay's Wedding", the demo event the live-demo section
 * and the demo ticket both point at.
 */
export const GUEST_SURFACES: Surface[] = [
  {
    surface: "The door, a public event",
    where: "components/guest/entry-modal.tsx",
    rule: "The event's name leads and ours stays out of the way. The description says what this is, in the guest's words.",
    today: {
      title: "Welcome to Maya & Jay's Wedding",
      body: "A shared gallery for the whole event.",
      action: "Continue",
    },
    proposed: {
      title: "Welcome to Maya & Jay's Wedding",
      body: "One album, from everyone who came.",
      action: "Continue",
    },
    note: "The title is right and stays. The shipped line is the software describing itself; the rewrite says what the guest is looking at. It also settles the noun: the site says album everywhere and the guest surface says gallery in five places.",
  },
  {
    surface: "The door, an account-required event",
    where: "components/guest/entry-modal.tsx",
    rule: "The host's business, stated plainly. Never our ask, never a pitch for an account.",
    today: {
      title: "See all the photos",
      body: "Create a free account to see the full gallery and add your own photos.",
      action: "Continue",
    },
    proposed: {
      title: "See all the photos",
      body: "Maya and Jay ask guests for an email. Add it once and you can add photos.",
      action: "Continue",
    },
    note: "The shipped line asks the guest to create an account with US on the host's own page, which is exactly what bible 4 is about. The rewrite hands the ask back to the host, who is the one who turned it on.",
  },
  {
    surface: "The door, a private event",
    where: "components/guest/entry-modal.tsx",
    rule: "The same. A gate is the host's, so the sentence is the host's.",
    today: {
      title: "Maya & Jay's Wedding is private",
      body: "Enter the event password to view it.",
      action: "Continue",
    },
    proposed: {
      title: "Maya & Jay's Wedding is private",
      body: "Enter the password Maya and Jay gave you.",
      action: "Continue",
    },
    note: "Same length, and the guest now knows where the password came from.",
  },
  {
    surface: "The upload prompt",
    where: "components/guest/file-dropzone.tsx",
    rule: "The verb on the control, and the one way to use it. No sentence, no promise.",
    today: {
      title: "Add photos & videos",
      body: "Tap to choose, or drag them here",
    },
    proposed: {
      title: "Add photos & videos",
      body: "Tap to choose, or drag them here",
    },
    note: "Unchanged. Both lines are the register already: a verb, then how.",
  },
  {
    surface: "The empty album",
    where: "components/guest/gallery-empty-state.tsx",
    rule: "One line about what is about to arrive, then the button that starts it.",
    today: {
      title: "This is where it all lands",
      action: "Be the first to add a photo",
    },
    proposed: {
      title: "This is where it all lands",
      action: "Be the first to add a photo",
    },
    note: "Unchanged, and the strongest evidence the guest register was already written in the voice: an arrival, present tense, no brand.",
  },
  {
    surface: "The upload confirmation",
    where: "components/guest/guest-upload.tsx",
    rule: "What happened, then who it is with. A guest who is waiting should know on whom.",
    today: { title: "Sent, waiting for host approval" },
    proposed: { title: "Sent. Maya and Jay will approve it." },
    note: "Either answer is defensible, so it is flagged rather than assumed: the shipped line is quoted verbatim inside the album page's copy set, so a rewrite here is a two-file change.",
  },
];

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
