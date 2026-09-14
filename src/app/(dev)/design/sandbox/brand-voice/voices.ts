/**
 * THE FOUR VOICE SETS the brand-voice board compares (the review wave,
 * 2026-09-14). "Today" is the shipped strings, quoted verbatim from
 * marketing-voice.ts, feature-pages.ts, the help catalogue, the app and the
 * email templates, so the comparison is against reality and not a paraphrase.
 * The three candidates span tune-to-replace (bible 22).
 *
 * ★ This file is the BOARD's data, never a source of truth. The one home for a
 * shipped line is src/lib/constants/marketing-voice.ts; nothing here is
 * imported by production and nothing here ships until Will rules. The
 * `voice-infusion` round carries the ruled set across; this track changes no
 * production byte.
 *
 * The header keys and their order mirror SECTION_HEADERS' home arc. The seven
 * here are the PROVISIONAL ones (howItWorks and pricing are ruled and stay).
 */

export type VoiceId = "today" | "house" | "room" | "guests";

/** The seven provisional home-arc headers, in arc order. */
export type HeaderKey =
  | "noApp"
  | "fullQuality"
  | "liveDemo"
  | "album"
  | "curation"
  | "privacy"
  | "reel";

export const HEADER_ORDER: HeaderKey[] = [
  "noApp",
  "fullQuality",
  "liveDemo",
  "album",
  "curation",
  "privacy",
  "reel",
];

/** Will's recorded appetite per header, from SECTION_HEADERS' `note`. */
export const HEADER_APPETITE: Record<HeaderKey, string> = {
  noApp: "his line, ruling pending",
  fullQuality: "his line, ruling pending",
  liveDemo: "entertains other ideas",
  album: "more distinctness from the live demo and curation",
  curation: "guest-side benefits in the frame",
  privacy: "cleaner",
  reel: "a share-the-highlights framing that feels more alive",
};

/** Which of the seven are the five picks: the ones with an appetite for a
 *  DIFFERENT line, as against the two of his own awaiting a ruling. */
export const FIVE_PICKS: HeaderKey[] = [
  "liveDemo",
  "album",
  "curation",
  "privacy",
  "reel",
];

export type Voice = {
  id: VoiceId;
  name: string;
  /** The one-line case for this voice, on the board's row. */
  rationale: string;
  /** The voice in one paragraph (the board's first ask). */
  paragraph: string;
  /** The hero lockup. */
  hero: { h1: string; sub: string };
  /** The seven provisional home headers. */
  headers: Record<HeaderKey, string>;
  /** A feature card's directory line (the /features hub door, album). */
  card: string;
  /** Departures this voice makes from a ruled line, flagged not buried. */
  departure?: string;
};

export const VOICES: Voice[] = [
  {
    id: "today",
    name: "Today",
    rationale:
      "The shipped strings, verbatim. Three of the seven headers are built out of an absence and one is a tautology.",
    paragraph:
      "Unwritten. The only copy rule in the repo is the em-dash ban, so the voice is whatever the eight ratified golden lines happen to have in common: warm, plain, second person, two beats on a comma. Nothing says what a line should be about, which is why the seven provisional headers drift between an absence, a state and an instruction.",
    hero: {
      h1: "The whole event, in one album.",
      sub: "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
    },
    headers: {
      noApp: "Nothing to install. Nothing to sign up for.",
      fullQuality: "Everything they shoot, at the size they shot it.",
      liveDemo: "Watch your album fill up.",
      album: "Every photo comes to you first.",
      curation: "Every moment, and you decide what stays.",
      privacy: "Your event stays yours.",
      reel: "The whole event, cut down to the highlights.",
    },
    card: "Every phone in the room, feeding one album while the party is on.",
  },
  {
    id: "house",
    name: "A. The house",
    rationale:
      "A tuning. The voice already exists in the eight ratified lines; write it down, then bring the seven that drifted back to it. The sentence is about the thing the host ends up with.",
    paragraph:
      "Partyreel sounds like a good host: plain, warm, specific, with nothing abstract in it. A line is a noun phrase and a turn, hinged on a comma, and it is about what the host ends up holding. It says photo, video, phone, code, album, guest and link, and it leaves memories and magic to someone else. It calls the host you, it leads with what the reader gets, and it lets whatever we spare them arrive in the second half of the sentence. This is the voice the eight ratified lines already speak. The guide writes it down and tunes the seven that have not caught up.",
    hero: {
      h1: "The whole event, in one album.",
      sub: "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
    },
    headers: {
      noApp: "Your guests already have everything they need.",
      fullQuality: "Every photo at full size, every video at full length.",
      liveDemo: "Watch your album fill up.",
      album: "The whole event, and it's yours to keep.",
      curation: "You shape the album, and everyone gets the good version.",
      privacy: "Private until you say otherwise.",
      reel: "The highlights, cut and ready to send.",
    },
    card: "Every phone in the room, feeding one album.",
  },
  {
    id: "room",
    name: "B. The room",
    rationale:
      "A rebuild from the product's one idea: the code becoming the album. Verb in front, present tense, the room as the setting, real counts as evidence. The sentence is about the moment, not the object.",
    paragraph:
      "Partyreel talks the way a good host talks while the party is still going: present tense, plain nouns, one breath per sentence. Every line is about something arriving. A code goes on a table, phones find it, an album fills with the event as everyone saw it, and the voice stays inside that moment instead of describing it from afterwards. It is warm because it is specific, not because it is friendly: it says photo, video, phone, code, album, guest, link, and it leaves memories, magic and journeys to someone else. It calls the host you and the guests everyone. It leads with what the reader gets, so the things Partyreel spares them (an app, an account, a group chat the morning after) land in the second half of a sentence and never the first. And it changes volume, not vocabulary: loud here, quiet in the product, nearly silent on a guest's screen.",
    hero: {
      h1: "One code on the table, and the album starts filling.",
      sub: "Every phone in the room finds it, uploads at full size, and you end up with the whole event in one place.",
    },
    headers: {
      noApp: "Point a camera at the code. That's the whole setup.",
      fullQuality: "Every file lands the size it was shot.",
      liveDemo: "The album fills while the party is still going.",
      album: "Two hundred photos you never had to ask for.",
      curation: "It all arrives, and you decide what the album says.",
      privacy: "The link opens for the people you hand it to.",
      reel: "One tap sends the best of it to everyone who was there.",
    },
    card: "Every phone in the room, filling one album as it happens.",
  },
  {
    id: "guests",
    name: "C. The guest list",
    rationale:
      "A replacement, and the board's one departure. An album is a container anyone can offer; the same event from every camera in the room is only ours. The sentence is about the people, and the ruled thesis is questioned.",
    paragraph:
      "Partyreel's sentences are about people. An album is a container anyone can offer, so the voice never leads with one: it leads with everyone who was in the room and with the one thing only this product makes, which is the same event from every camera in it. It says guest, everyone, camera, angle, phone and album, present tense and plain, and it never lets the software be the subject. It calls the host you and the guests everyone. It leads with what the reader gets and lets whatever we spare them arrive second. Warm because it is specific, never because it is friendly.",
    hero: {
      h1: "The whole event, as everyone saw it.",
      sub: "One code, every camera in the room, and one album made of all of it, at the size they shot it.",
    },
    headers: {
      noApp: "Everyone's camera is already the right one.",
      fullQuality: "You get what they saw, at the size they saw it.",
      liveDemo: "Twenty-three people are filling this album right now.",
      album: "A hundred angles on the same event.",
      curation: "Your guests see the album you'd want them to see.",
      privacy: "It stays with the people who were there.",
      reel: "Send everyone the version they'll actually rewatch.",
    },
    card: "Every guest's camera, feeding one album.",
    departure:
      "Rewrites SITE_THESIS, ruled 2026-08-25: \"The whole event, in one album.\" becomes \"The whole event, as everyone saw it.\" Will's cadence is kept; the container is swapped for the perspective.",
  },
];

export function voiceById(id: VoiceId): Voice {
  return VOICES.find((v) => v.id === id) ?? VOICES[0];
}

/**
 * THE THREE REGISTERS, shown once rather than per candidate. That is the
 * guide's claim and the board's second finding: the registers do not fork with
 * the voice. Only the marketing register's default sentence shape moves, so a
 * ruling on the voice is a ruling on one row of this table.
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

/**
 * The quiet surfaces, shown ONCE because they do not fork with the voice.
 * "Today" is verbatim; "Proposed" is what the guide's rule changes, which on
 * three of the four is nothing.
 */
export const QUIET_SURFACES = [
  {
    surface: "Help article",
    rule: "The title is the reader's question in the reader's words. The description is the short answer, written so someone could stop reading after it.",
    today: {
      title: "What guests can and can't see",
      body: "Guests see approved photos, the names of signed-in uploaders, and the reel once shared. They never see emails, hidden or unapproved photos, like counts, or a locked event beyond its name and count.",
    },
    proposed: {
      title: "What guests can and can't see",
      body: "Guests see approved photos, the names of signed-in uploaders, and the reel once you share it. Emails, hidden photos and like counts stay with you.",
    },
    note: "Shorter, and the second sentence turns a list of nevers into what the host keeps. Same facts.",
  },
  {
    surface: "App label",
    rule: "The noun or the verb the host would use for the thing. Never a sentence, never a promise. It is also the source string the help catalogue quotes.",
    today: { title: "Approve all", body: "" },
    proposed: { title: "Approve all", body: "" },
    note: "Unchanged. A label the host already reads correctly is finished.",
  },
  {
    surface: "Email subject",
    rule: "Name what happened to the reader's own thing, front-loaded for a truncating inbox. Carry the brand only where the inbox needs it to sort.",
    today: { title: "Your Partyreel event will be removed soon", body: "" },
    proposed: { title: "Your Partyreel event will be removed soon", body: "" },
    note: "Unchanged. It already names the reader's thing first and commits to no mechanism.",
  },
  {
    surface: "Error",
    rule: "Say what did not happen, in the app's own noun, then the one thing to do next. Never apologise, never blame the reader, never explain the system.",
    today: { title: "Couldn't restore that item.", body: "" },
    proposed: { title: "Couldn't restore that item. Try again.", body: "" },
    note: "An error reports a status, so the affirmative rule does not reach it. It gains the next step and nothing else.",
  },
] as const;

/**
 * The account-required unfurl, both ways (the parked ruling). The string lives
 * at src/app/(guest)/e/[token]/page.tsx and is what a host's group chat renders
 * when the event asks guests to verify an email before uploading.
 */
export const UNFURL = {
  title: "Add photos to Mia and Sam's wedding",
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
