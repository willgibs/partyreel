/**
 * THE SIX VOICES, AND THE TWO DOZEN PLACES THEY WRITE (round six, the catalog
 * rebuild, 2026-09-16).
 *
 * ★ WILL'S BRIEF IS THE WHOLE SHAPE. He asked for "a couple dozen spot examples
 * across the marketing site and app" where he can "compare 2 brand voices in
 * usage side by side", with "a config to choose which 2, then select my
 * winner". So this file is exactly two lists and nothing else: the VOICES, and
 * the SPOTS. Every other structure rounds two through five grew here (the home
 * arc as fifteen ledger rows, the thirty feature-page identity strings, two
 * feature pages card by card, a diff counter per chapter) was an argument
 * ABOUT a voice rather than a voice in use, and it left with round five.
 *
 * ★ SIX RATHER THAN THREE, which is the round's other change. Three cards is
 * not a catalog and a two-way config over three items is not a config: with
 * Today plus two, one of the three pairs is always Today against itself. So the
 * two candidates the board carried are joined by three more, each a coherent
 * answer somebody could prefer for a reason they could say out loud: a flat
 * utility register, the room's own point of view rather than the host's, and a
 * dry one that leads with what the product spares you. The two that were here
 * are unchanged in character and mostly unchanged in wording; they are named
 * for what they DO now rather than by a letter.
 *
 * ★ `today` IS QUOTED VERBATIM from the shipped source and is the control.
 * Where a candidate deliberately KEEPS a shipped line it repeats it, and
 * `heldBy` counts that as a held line rather than as an omission: where a voice
 * does not bite is as much of a ruling as where it does.
 *
 * ★ NOTHING HERE IS A SOURCE OF TRUTH. The one home for a shipped line is
 * `src/lib/constants/marketing-voice.ts` (plus `feature-pages.ts` and the
 * components); nothing in this file is imported by production and nothing ships
 * until Will rules.
 */

/* ---------------------------------------------------------------------------
 * THE VOICES
 * ------------------------------------------------------------------------ */

/**
 * ★ THE ORDER IS THE CARD ORDER AND THE COLUMN ORDER. Today first, because a
 * comparison reads from the control.
 */
export const VOICE_IDS = [
  "today",
  "keepsake",
  "live",
  "plain",
  "everyone",
  "aside",
] as const;

export type VoiceId = (typeof VOICE_IDS)[number];

/** One slot, in all six columns. */
export type Say = Record<VoiceId, string>;

/**
 * A slot's six lines, positionally. Deliberately terse: the file is seventy-odd
 * slots long, and six named keys per slot would put four hundred lines of
 * punctuation between a reader and the copy, which is the thing being judged.
 *
 * ★ POSITION IS `VOICE_IDS` ORDER, and the board's own test pins the arity, so
 * a dropped argument is a failing test rather than an empty column on a board.
 */
function s(
  today: string,
  keepsake: string,
  live: string,
  plain: string,
  everyone: string,
  aside: string,
): Say {
  return { today, keepsake, live, plain, everyone, aside };
}

export type Voice = {
  id: VoiceId;
  /** The card's name: one word a stranger can repeat. */
  name: string;
  /** The card's one line: what this voice is, in words a stranger knows. */
  one: string;
  /** The builder's own call on the card. */
  verdict: "ship" | "refine" | "kill";
  /** The board's own pick, marked with a dot. */
  recommended?: boolean;
  /** The sentence shape, for the card's facts strip. */
  shape: string;
  /** What a sentence in this voice is ABOUT. */
  about: string;
  /** The cost, in a clause short enough for the card's facts strip. */
  risk: string;
  /** Why it might win; folded under the card. */
  rationale: string;
};

export const VOICES: readonly Voice[] = [
  {
    id: "today",
    name: "Today",
    one: "The lines the site ships, word for word. Nothing is written down, so nothing holds the next hundred lines.",
    verdict: "kill",
    shape: "Unwritten",
    about: "Whatever the line was about",
    risk: "Nothing holds the next hundred lines",
    rationale:
      "The one to come back to. Every other card is judged against it, and a ruling of Today changes no line.",
  },
  {
    id: "keepsake",
    name: "Keepsake",
    one: "Warm and plain, about what the host ends up holding. The register the eight approved lines already speak.",
    verdict: "refine",
    shape: "A noun phrase, then a turn on a comma",
    about: "The thing you keep",
    risk: "Changes least, so lifts least",
    rationale:
      "The cheap answer and a real one. The voice already lives in the ratified lines; this writes it down and brings back the ones that drifted, so a ruling costs a sweep rather than a rewrite.",
  },
  {
    id: "live",
    name: "Live",
    one: "Present tense, verb in front: the album filling while the party is still going.",
    verdict: "ship",
    recommended: true,
    shape: "Verb first, one breath",
    about: "The moment it is happening",
    risk: "Runs long; a row on the h1 at 375",
    rationale:
      "The only voice a shared folder could not say back, because it stays inside the moment the album fills. It is also the only one that makes the live demo, the album and the reel sound like one product.",
  },
  {
    id: "plain",
    name: "Plain",
    one: "Short declaratives. Nothing in a line that is not a fact, and no scene at all.",
    verdict: "refine",
    shape: "Subject, verb, object. Full stop.",
    about: "The mechanism",
    risk: "Never sells; reads as documentation",
    rationale:
      "The register a reader trusts fastest, and the only one that never has to be turned down for the app: the quiet volume IS the voice. If the product is obvious enough, plain is the strongest thing here.",
  },
  {
    id: "everyone",
    name: "Everyone",
    one: "The room's point of view: what the people there do, not what the host walks away with.",
    verdict: "refine",
    shape: "Everyone is the subject",
    about: "The people who were there",
    risk: "Rarely says you, and the host is the buyer",
    rationale:
      "The product's real asset is forty phones, not one, and this is the only voice that says so. It is also the closest thing here to a reason to pass the link on.",
  },
  {
    id: "aside",
    name: "Aside",
    one: "Confident and dry: a claim, then the thing it spares you, said as an aside.",
    verdict: "refine",
    shape: "A claim, then a wink",
    about: "What you will not have to do",
    risk: "Wit ages badly and does not travel",
    rationale:
      "The only one anybody would quote. It names no competitor, but every line is shaped by a chore the reader recognises, which is the edge of bible 20 on purpose.",
  },
];

export function voiceById(id: VoiceId): Voice {
  return VOICES.find((v) => v.id === id) ?? VOICES[0];
}

/** The card name, short enough for a column head or a caption. */
export const VOICE_NAME: Record<VoiceId, string> = {
  today: "Today",
  keepsake: "Keepsake",
  live: "Live",
  plain: "Plain",
  everyone: "Everyone",
  aside: "Aside",
};

/* ---------------------------------------------------------------------------
 * THE THREE VOLUMES
 * ------------------------------------------------------------------------ */

/**
 * One voice at three volumes. Round one found it on four surfaces and round
 * four wrote all sixteen: the volumes do NOT fork with the voice, so a ruling
 * on a card is a ruling on the vocabulary and the sentence shape, never on how
 * loud the app is allowed to be.
 */
export const VOLUMES = [
  {
    name: "Marketing, loud",
    rule: "The full voice. It asserts, it addresses the host as you, and it is the only volume that sells.",
  },
  {
    name: "The app, quiet",
    rule: "The same words with the shaping taken out. One clause, and the verb is the one on the button just pressed.",
  },
  {
    name: "A guest's phone, nearly silent",
    rule: "The host's event leads and ours stays out of the way (bible 4). We are named only where a guest needs to know whose software this is.",
  },
] as const;

/* ---------------------------------------------------------------------------
 * THE SPOTS
 * ------------------------------------------------------------------------ */

/** The five production grounds a spot can sit on (the kit's own map). */
export type SpotGround = "cinema" | "paper" | "ink" | "app-light" | "app-dark";

export type SpotLine = {
  /** The slot's name on the real surface, in the words a walker would use. */
  slot: string;
  say: Say;
  /**
   * Set ONLY where every voice writes the same string: WHY the line is the
   * same in all of them. Never "unchanged": a reader learns nothing from that.
   */
  same?: string;
  /** A rule already decides this line whatever the voice (bible 4 on a guest
   *  surface). Named, so a compliance fix never reads as an ask. */
  compelled?: string;
};

export type SpotDef = {
  /** One token; the jump menu and the URL hash use it. */
  id: string;
  /** What the place is, in words a stranger knows. */
  name: string;
  area: "marketing" | "app" | "guest";
  /** Where the strings live, so the sweep that follows a ruling can find them. */
  where: string;
  ground: SpotGround;
  /** The width this place is honest at. "phone" pins a guest surface to 375. */
  canvas: "follow" | "phone";
  /** What to read HERE rather than anywhere else, in one line. */
  note: string;
  lines: SpotLine[];
};

/**
 * TWENTY-FOUR REAL PLACES, in the order a person meets them: twelve on the
 * marketing site, eight inside the host's app, four on a guest's phone and in
 * the inbox. Each one renders as the component that ships it, never as a
 * picture of one.
 */
export const SPOTS: readonly SpotDef[] = [
  /* ── Marketing, loud ───────────────────────────────────────────────── */
  {
    id: "home-hero",
    name: "The home page's first screen",
    area: "marketing",
    where: "app/(marketing)/(cinema)/page.tsx, SITE_THESIS and SITE_SUBHEAD",
    ground: "cinema",
    canvas: "follow",
    note: "The loudest line on the site, at the size it really renders.",
    lines: [
      {
        slot: "Small label",
        say: s(
          "One QR. No app. No account.",
          "One code, one album",
          "A code on the table",
          "One QR code",
          "Everyone was shooting",
          "No app. Obviously.",
        ),
      },
      {
        slot: "Headline",
        say: s(
          "The whole event, in one album.",
          "The whole event, in one album.",
          "Watch the album fill while the party is on.",
          "Every guest's photos, in one album.",
          "Everyone's photos, in one place.",
          "The best photos of your event are on someone else's phone.",
        ),
      },
      {
        slot: "Sentence under it",
        say: s(
          "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
          "One QR code collects every photo and video your guests take, at full quality, in an album that stays yours.",
          "Guests point a phone at the code and the photos start arriving, full size, while the party is still going.",
          "Guests scan a code and upload from their phone. Photos and video arrive at full size. You keep the album.",
          "The party happened on forty phones. One code brings all of it into one album, at full size, while everyone is still there.",
          "One QR code gets them all into one album, at full size. Nobody downloads anything, and nobody has to be asked twice.",
        ),
      },
      {
        slot: "Buttons",
        say: s(
          "Start free  ·  Watch a sample reel",
          "Start free  ·  Watch a sample reel",
          "Start free  ·  Watch a sample reel",
          "Start free  ·  See a sample reel",
          "Start free  ·  Watch a sample reel",
          "Start free  ·  Watch a sample reel",
        ),
      },
    ],
  },
  {
    id: "how-it-works",
    name: "The three-step section",
    area: "marketing",
    where: "components/marketing/sections/home/film-strip-section.tsx",
    ground: "cinema",
    canvas: "follow",
    note: "A ruled header: read what a voice does when it cannot move one.",
    lines: [
      {
        slot: "Small label",
        say: s(
          "How it works",
          "How it works",
          "How it works",
          "How it works",
          "How it works",
          "How it works",
        ),
        same: "A chapter mark, not a sentence. Renaming it names a different section.",
      },
      {
        slot: "Header",
        say: s(
          "Scan, upload, done. No app to install.",
          "Scan, upload, done. No app to install.",
          "A code goes up, and the photos start arriving.",
          "Three steps, and none of them is an app.",
          "Everyone scans. Everyone uploads. That is the whole thing.",
          "Three steps, and one of them is holding up a phone.",
        ),
      },
      {
        slot: "The three steps",
        say: s(
          "Scan  ·  Upload  ·  Done",
          "Scan  ·  Upload  ·  Done",
          "Scan  ·  Upload  ·  Watch",
          "Scan  ·  Upload  ·  Done",
          "Scan  ·  Upload  ·  Done",
          "Scan  ·  Upload  ·  Done",
        ),
      },
      {
        slot: "Link under it",
        say: s(
          "The full walkthrough, both sides",
          "The full walkthrough, both sides",
          "The full walkthrough, both sides",
          "The full walkthrough",
          "What guests see",
          "The full walkthrough, both sides",
        ),
      },
    ],
  },
  {
    id: "album-chapter",
    name: "The album chapter, on paper",
    area: "marketing",
    where: "components/marketing/sections/home/album-section.tsx",
    ground: "paper",
    canvas: "follow",
    note: "The page's one left masthead. The voices are furthest apart here.",
    lines: [
      {
        slot: "Small label",
        say: s(
          "The album",
          "The album",
          "The album",
          "The album",
          "The album",
          "The album",
        ),
        same: "The chapter is the album. A voice that renames it is naming a different chapter.",
      },
      {
        slot: "Header",
        say: s(
          "Every photo comes to you first.",
          "Every photo comes to you first.",
          "214 photos, and you chased none of them.",
          "One album. Every guest's uploads.",
          "Everyone who was there, in one album.",
          "You will never have to ask anyone to send them over.",
        ),
      },
      {
        slot: "Sentence under it",
        say: s(
          "Every phone in the room feeds one album, and the album is yours: look through it, tidy it up, and share it when you are ready.",
          "Every phone in the room feeds one album, and it is yours to look through, tidy up, and share when you are ready.",
          "They arrive while the party is on, from every phone in the room, at the size they were shot. You open the album the next morning and it is already there.",
          "Everything arrives in one place at full size. You review it, hide what you want, and share the album with one link.",
          "Forty phones were out. All of it lands in the same album, credited to whoever shot it, and you decide what the room gets to see.",
          "Every phone in the room feeds the same album, so the photos are yours before the party is over. Tidy it up, then share it.",
        ),
      },
      {
        slot: "Link under it",
        say: s(
          "Inside the live album",
          "Inside the live album",
          "Inside the live album",
          "Inside the live album",
          "Inside the live album",
          "Inside the live album",
        ),
        same: "A chevron link names the place it goes, and the place is called the live album.",
      },
    ],
  },
  {
    id: "feature-cards",
    name: "A set of three feature cards",
    area: "marketing",
    where: "components/marketing/sections/features/album/album-copy.ts",
    ground: "paper",
    canvas: "follow",
    note: "Six strings in a row of cards. The densest reading on the board.",
    lines: [
      {
        slot: "Card 1, title",
        say: s(
          "No app, ever",
          "The browser they already have",
          "It opens in a browser",
          "No app",
          "Everyone already has it",
          "Nobody is installing an app",
        ),
      },
      {
        slot: "Card 1, body",
        say: s(
          "The code opens the album in the browser they already have. Point, tap, add. Nothing to install.",
          "The code opens the album in the browser on their phone, and they are adding a tap later. Nothing to install.",
          "A camera finds the code and the album opens in the browser already on the phone. Point, tap, add.",
          "The code opens the album in the phone's browser. Nothing to install, nothing to sign up for.",
          "The browser on everyone's phone is the app. Point a camera at the code and start adding.",
          "The code opens in the browser they already have, which is the only app anyone downloads for a party.",
        ),
      },
      {
        slot: "Card 2, title",
        say: s(
          "Names, if you want them",
          "A name on every photo, if you want one",
          "Names, if you ask for them",
          "Names, optional",
          "Everyone gets a name",
          "Names, if you care who shot what",
        ),
      },
      {
        slot: "Card 2, body",
        say: s(
          "Require accounts and guests confirm an email once. Switch it off and anyone with the link can add.",
          "Ask for an email and each guest confirms one once, so every photo arrives with a name on it. Switch it off and anyone with the link can add.",
          "Ask for an email and a guest confirms one once, on the phone they are already holding. Switch it off and anyone with the link adds.",
          "Turn on email verification and every upload carries a name. Turn it off and anyone with the link can add.",
          "Ask for an email once and every photo says who took it. Switch it off and anyone with the link can add.",
          "Ask for an email once and every photo is credited. Switch it off and anyone with the link can add.",
        ),
      },
      {
        slot: "Card 3, title",
        say: s(
          "One link, forever",
          "One link, and it keeps working",
          "The code is the album",
          "One permanent link",
          "Everyone keeps the link",
          "One link, and it outlives the party",
        ),
      },
      {
        slot: "Card 3, body",
        say: s(
          "The code is the album link. Scan it, tap it in a chat, open it later. Pro and Event Pass can name it.",
          "The code is the album link. Scan it, tap it in a chat, open it a year later. Pro and Event Pass can name it.",
          "Scan it on the table, tap it in a chat, open it next year. It is the same link the whole way through.",
          "The code and the album are the same link. Pro and Event Pass can rename it.",
          "The code is the album, so everyone who scanned it can come back to it later, from anywhere.",
          "The code is the album. Scan it on the table, find it in a chat next year, it still opens.",
        ),
      },
    ],
  },
  {
    id: "live-demo",
    name: "The live demo anchor",
    area: "marketing",
    where: "components/marketing/sections/home/live-demo-section.tsx",
    ground: "cinema",
    canvas: "follow",
    note: "Will has asked for alternatives. The page's only invitation to act.",
    lines: [
      {
        slot: "Small label",
        say: s(
          "Live demo",
          "Live demo",
          "Live demo",
          "Live demo",
          "Live demo",
          "Live demo",
        ),
        same: "The label is what the thing is. Every voice writes it.",
      },
      {
        slot: "Header",
        say: s(
          "Watch your album fill up.",
          "Watch your album fill up.",
          "This is one filling, right now.",
          "See it work, with no signup.",
          "Add one, and watch everyone else's arrive.",
          "Try it now, on your own phone.",
        ),
      },
      {
        slot: "Sentence under it",
        say: s(
          "Guests scan, photos land, and the album builds itself while the party is still going.",
          "Guests scan, photos land, and by the end of the night the album is already yours.",
          "Scan the code on your phone and your photo lands in this album, on this page, in about a second.",
          "Scan the code and your upload appears in the album below. Nothing to install and nothing to enter.",
          "Scan the code with your phone. Your photo joins the album on this page, beside everyone who tried it before you.",
          "Scan the code and your photo shows up on this page. That is the whole product, and it took eight seconds.",
        ),
      },
    ],
  },
  {
    id: "curation",
    name: "The curation chapter",
    area: "marketing",
    where: "components/marketing/sections/home/curation-section.tsx",
    ground: "paper",
    canvas: "follow",
    note: "Will wants guest-side benefit here, not only host moderation.",
    lines: [
      {
        slot: "Small label",
        say: s(
          "Curation",
          "Curation",
          "Curation",
          "Curation",
          "Curation",
          "Curation",
        ),
        same: "A chapter mark. The chapter is curation.",
      },
      {
        slot: "Header",
        say: s(
          "Every moment, and you decide what stays.",
          "Every moment, and you decide what stays.",
          "Hold it back, or let it land live.",
          "Approve before, or tidy up after.",
          "Everyone shoots. You choose.",
          "Nobody needs to see all four hundred.",
        ),
      },
      {
        slot: "Sentence under it",
        say: s(
          "Your guests just see the good part: one clean album, the best of everyone's camera roll.",
          "Your guests see one clean album, and every call you make is reversible.",
          "Uploads can wait for your approval or appear the second they arrive, and you can change your mind afterwards.",
          "Every upload can wait for review or go live on arrival. Hiding a photo is reversible; only a confirmed delete is not.",
          "Everything everyone took lands in one place, and what the room sees is your call, before or after it arrives.",
          "Hide the blurry ones, feature the good ones, and change your mind as many times as you like.",
        ),
      },
      {
        slot: "Link under it",
        say: s(
          "How curation works",
          "How curation works",
          "How curation works",
          "How curation works",
          "How curation works",
          "How curation works",
        ),
        same: "The chevron names its destination, and the destination is the curation page.",
      },
    ],
  },
  {
    id: "privacy",
    name: "The privacy chapter",
    area: "marketing",
    where: "components/marketing/sections/home/privacy-section.tsx",
    ground: "cinema",
    canvas: "follow",
    note: "Will wants it cleaner. Three lines are the whole section.",
    lines: [
      {
        slot: "Header",
        say: s(
          "Your event stays yours.",
          "Your event stays yours.",
          "Nothing leaves the room unless you send it.",
          "Private by default.",
          "Everyone's photos, and nobody else's business.",
          "Your event is not a public square.",
        ),
      },
      {
        slot: "Claim 1",
        say: s(
          "Location data stays on the phone",
          "Location data stays on the phone",
          "The location comes off before the photo goes up",
          "Location data is stripped before upload",
          "Location data never leaves anyone's phone",
          "The location comes off the photo before it goes anywhere",
        ),
      },
      {
        slot: "Claim 2",
        say: s(
          "Three ways to share",
          "Public, password, or private",
          "Open it, lock it, or keep it to yourself",
          "Public, password, or private",
          "As open as the room, or not at all",
          "Public, password locked, or private",
        ),
      },
      {
        slot: "Link under it",
        say: s(
          "The full privacy story",
          "The full privacy story",
          "The full privacy story",
          "The full privacy story",
          "The full privacy story",
          "The full privacy story",
        ),
        same: "The chevron names its destination.",
      },
    ],
  },
  {
    id: "reel",
    name: "The reel chapter",
    area: "marketing",
    where: "components/marketing/sections/home/reel-section.tsx",
    ground: "cinema",
    canvas: "follow",
    note: "Will asked for a framing that feels more alive.",
    lines: [
      {
        slot: "Small label",
        say: s(
          "The reel",
          "The reel",
          "The reel",
          "The reel",
          "The reel",
          "The reel",
        ),
        same: "A chapter mark, and the reel is a product noun.",
      },
      {
        slot: "Header",
        say: s(
          "The whole event, cut down to the highlights.",
          "The whole event, cut down to the highlights.",
          "The night, cut while it is still warm.",
          "A highlight video, from the same album.",
          "One cut everyone gets to keep.",
          "Nobody is editing four hundred photos into a video.",
        ),
      },
      {
        slot: "Sentence under it",
        say: s(
          "Pick a style and the reel renders on your phone, free, in seconds. Every guest can take the reel home.",
          "Pick a style and the reel renders on your phone in seconds, free, and every guest can take it home.",
          "Pick a style and the reel renders on your phone in seconds. Send it round before anyone has gone to bed.",
          "Pick one of nine styles. It renders on your phone in seconds, free, and every guest can download it.",
          "Pick a style and the reel renders in seconds from what everyone shot. Every guest takes a copy home.",
          "Pick a style and the reel renders on your phone in seconds, free. Guests take it home too.",
        ),
      },
      {
        slot: "Link under it",
        say: s(
          "See all 9 styles",
          "See all 9 styles",
          "See all 9 styles",
          "See all 9 styles",
          "See all 9 styles",
          "See all 9 styles",
        ),
        same: "A count the page can prove. No voice moves a number that renders from data.",
      },
    ],
  },
  {
    id: "pricing-pair",
    name: "The pricing cards",
    area: "marketing",
    where: "app/(marketing)/pricing/page.tsx and lib/constants/tiers.ts",
    ground: "paper",
    canvas: "follow",
    note: "Every figure comes from tiers.ts. Only the taglines and notes move.",
    lines: [
      {
        slot: "Free, tagline",
        say: s(
          "Your first event, covered.",
          "Your first event, covered.",
          "Your first event, on us.",
          "One event, free.",
          "Your first event, and everyone in it.",
          "Your first event is free, no catch.",
        ),
      },
      {
        slot: "Free, one feature line",
        say: s(
          "No watermark on photos or the album",
          "No watermark on photos or the album",
          "No watermark, anywhere",
          "No watermark on photos or the album",
          "Every guest, with no per-guest fee",
          "No watermark, because it is your album",
        ),
      },
      {
        slot: "Free, note under the button",
        say: s(
          "No card. Upgrade only when you host again.",
          "No card. Upgrade when you host again.",
          "No card now. Upgrade the next time you host.",
          "No card required.",
          "No card. Upgrade only when you host again.",
          "No card. We will be here when you host again.",
        ),
      },
      {
        slot: "Pro, tagline",
        say: s(
          "For hosts who host again.",
          "For hosts who host again.",
          "For the ones who keep hosting.",
          "More events, more storage.",
          "For hosts who keep filling rooms.",
          "For people who host more than once.",
        ),
      },
      {
        slot: "Pro, one feature line",
        say: s(
          "Password-locked albums and custom links",
          "Password-locked albums and a link you can name",
          "Password-locked albums and a link you can name",
          "Password-locked albums and custom links",
          "Password-locked albums and custom links",
          "Password-locked albums and a link you can name",
        ),
      },
      {
        slot: "Pro, note under the button",
        say: s(
          "Change size or cancel any time in the billing portal.",
          "Change size or cancel any time in the billing portal.",
          "Change size or cancel any time in the billing portal.",
          "Change size or cancel any time in the billing portal.",
          "Change size or cancel any time in the billing portal.",
          "Change size or cancel any time in the billing portal.",
        ),
        same: "A billing sentence is a contract sentence. It says exactly what the portal does, and a voice that shapes it is shaping a promise about money.",
      },
    ],
  },
  {
    id: "cta-band",
    name: "The last call, above the footer",
    area: "marketing",
    where: "components/marketing/sections/shared/cta-band.tsx",
    ground: "cinema",
    canvas: "follow",
    note: "Read it straight after the hero, in the same voice.",
    lines: [
      {
        slot: "Header",
        say: s(
          "Roll credits on the group chat.",
          "Roll credits on the group chat.",
          "Put a code on the table and see.",
          "Start your first event.",
          "Give everyone one place to put it.",
          "The group chat has done enough.",
        ),
      },
      {
        slot: "Sentence under it",
        say: s(
          "Every event ends with a reel. Free to host, and guests join with one scan.",
          "Every event ends with a reel. Free to host, and guests join with one scan.",
          "Free to host. Guests join with one scan, and the album starts filling in the first ten minutes.",
          "Free for one event, every guest included. Guests join with one scan.",
          "Free to host, every guest included, and one scan is the whole invitation.",
          "Free to host, one scan for guests, and nobody has to say send me those later.",
        ),
      },
      {
        slot: "Button",
        say: s(
          "Start free",
          "Start free",
          "Start free",
          "Start free",
          "Start free",
          "Start free",
        ),
        same: "The site's one conversion verb, and it is ruled.",
      },
    ],
  },
  {
    id: "footer",
    name: "The footer's sign-off",
    area: "marketing",
    where: "components/marketing/chrome/marketing-footer.tsx",
    ground: "ink",
    canvas: "follow",
    note: "Under every marketing page. The line below the wordmark is the thesis.",
    lines: [
      {
        slot: "Sign-off header",
        say: s(
          "Explore a demo event.",
          "Explore a demo event.",
          "Scan this and watch one fill.",
          "See a real event album.",
          "Walk into somebody else's party.",
          "Point your phone at this.",
        ),
      },
      {
        slot: "Sentence under it",
        say: s(
          "Scan the code for a real event album on your phone, exactly the way a guest arrives. No app, no account.",
          "Scan the code for a real event album on your phone, exactly the way a guest arrives. No app, no account.",
          "Scan it and a real album opens on your phone, the way it opens for a guest standing in the room. No app, no account.",
          "Scan the code to open a real event album on your phone, the way a guest does. No app, no account.",
          "Scan it and you arrive the way every guest arrives: a real album, on your own phone. No app, no account.",
          "Scan it and you are a guest at somebody's wedding in about four seconds. No app, no account.",
        ),
      },
      {
        slot: "Line under the wordmark",
        say: s(
          "The whole event, in one album.",
          "The whole event, in one album.",
          "Watch the album fill while the party is on.",
          "Every guest's photos, in one album.",
          "Everyone's photos, in one place.",
          "The best photos of your event are on someone else's phone.",
        ),
      },
    ],
  },
  {
    id: "help-open",
    name: "A help article's opening",
    area: "marketing",
    where: "content/help/getting-started/how-partyreel-works.mdx",
    ground: "paper",
    canvas: "follow",
    note: "The one place a voice yields: a title is also a search string.",
    lines: [
      {
        slot: "Title",
        say: s(
          "How Partyreel works",
          "How Partyreel works",
          "How Partyreel works",
          "How Partyreel works",
          "How Partyreel works",
          "How Partyreel works",
        ),
        compelled:
          "A help title is the search string and the tab title: a reader types how does partyreel work. The reader's words outrank the voice on this surface, so no voice touches it.",
      },
      {
        slot: "First paragraph",
        say: s(
          "You create an event and get a QR code. Guests scan it and add photos and videos from their phone browser, no app or account. It all lands in one live album you curate, share, and cut into a reel.",
          "You create an event and get a QR code. Guests scan it and add photos and videos from their phone browser, with no app and no account. It lands in one album you curate, share, and cut into a reel.",
          "You create an event and get a QR code. Guests scan it, and photos and videos start arriving from their phone browser, no app and no account. They land in one live album you curate, share, and cut into a reel.",
          "You create an event and get a QR code. Guests scan it and upload from their phone browser. No app, no account. Everything lands in one album you can curate, share, and cut into a reel.",
          "You create an event and get a QR code. Everyone at the event scans it and adds from their phone browser, no app and no account. Everything everyone shot lands in one album you curate, share, and cut into a reel.",
          "You create an event and get a QR code. Guests scan it and add from their phone browser, so nobody installs anything. It all lands in one album you curate, share, and cut into a reel.",
        ),
      },
    ],
  },

  /* ── The host's app, quiet ─────────────────────────────────────────── */
  {
    id: "signin-door",
    name: "The sign-in page",
    area: "app",
    where: "app/(auth)/signin/page.tsx",
    ground: "app-light",
    canvas: "follow",
    note: "The seam between loud and quiet. A marketing sentence here is a bug.",
    lines: [
      {
        slot: "Heading",
        say: s(
          "Sign in",
          "Sign in",
          "Sign in",
          "Sign in",
          "Sign in",
          "Sign in",
        ),
        same: "The verb the reader came here to do. Every voice writes it.",
      },
      {
        slot: "Sentence under it",
        say: s(
          "Sign in to create events and manage your albums.",
          "Sign in to create events and look after your albums.",
          "Sign in to start an event and watch it fill.",
          "Sign in to create and manage your events.",
          "Sign in to start an event everyone can add to.",
          "Sign in. Your albums are where you left them.",
        ),
      },
      {
        slot: "The email hint",
        say: s(
          "We will email you a link. No password to remember.",
          "We will email you a link, so there is no password to remember.",
          "We send a link. Tap it and you are in.",
          "We email a sign-in link. No password.",
          "We will email you a link. No password to remember.",
          "We will email you a link, because nobody remembers another password.",
        ),
      },
    ],
  },
  {
    id: "dashboard-header",
    name: "The dashboard's header and storage line",
    area: "app",
    where: "app/(app)/dashboard/page.tsx",
    ground: "app-light",
    canvas: "follow",
    note: "Judge these on the fiftieth read, not the first.",
    lines: [
      {
        slot: "Heading",
        say: s(
          "Your events",
          "Your events",
          "Your events",
          "Your events",
          "Your events",
          "Your events",
        ),
        same: "A section heading in the app names the objects under it. There is nothing to add.",
      },
      {
        slot: "Storage line",
        say: s(
          "4.2 GB of 25 GB used",
          "4.2 GB of 25 GB used",
          "4.2 GB of 25 GB filled",
          "4.2 GB of 25 GB used",
          "4.2 GB of 25 GB used",
          "4.2 GB of 25 GB used",
        ),
      },
      {
        slot: "The nudge beside it",
        say: s(
          "Need more room? See plans",
          "Need more room? See plans",
          "Filling up? See plans",
          "More storage on Pro. See plans",
          "Need more room? See plans",
          "Running out? See plans",
        ),
      },
    ],
  },
  {
    id: "dashboard-empty",
    name: "The dashboard with no events yet",
    area: "app",
    where: "components/app/dashboard/empty-events.tsx",
    ground: "app-light",
    canvas: "follow",
    note: "The one app screen allowed to sell. How far does each go?",
    lines: [
      {
        slot: "Heading",
        say: s(
          "Your events land here",
          "Your first album starts here",
          "Nothing here yet. Make a code.",
          "No events yet",
          "This fills up with everyone's photos",
          "An empty shelf, for now",
        ),
      },
      {
        slot: "Body",
        say: s(
          "Create an event and your guests add photos and videos in seconds. No app, no account, just a QR code.",
          "Create an event and you get a QR code. Your guests add photos and videos in seconds, with no app and no account.",
          "Create an event, put the code where people look, and the photos start arriving. No app, no account.",
          "Create an event to get a QR code. Guests scan it and upload from their phone. No app, no account.",
          "Create an event and everyone there can add to it in seconds, from the phone in their hand. No app, no account.",
          "Create an event and you get a QR code. That is the whole setup, and nobody has to install anything.",
        ),
      },
      {
        slot: "Button",
        say: s(
          "Create your first event",
          "Create your first event",
          "Create your first event",
          "Create your first event",
          "Create your first event",
          "Create your first event",
        ),
        same: "A verb the host is about to press outranks a voice. This is the finding, not an omission.",
      },
    ],
  },
  {
    id: "create-wizard",
    name: "The create-event wizard, step one",
    area: "app",
    where: "components/app/create-event/*",
    ground: "app-light",
    canvas: "follow",
    note: "One line here says something the product does not do.",
    lines: [
      {
        slot: "Title",
        say: s(
          "Create an event",
          "Create an event",
          "Create an event",
          "Create an event",
          "Create an event",
          "Create an event",
        ),
        same: "The wizard is named for what it makes.",
      },
      {
        slot: "Sentence under it",
        say: s(
          "Name it, pick a QR style, and you're ready to collect photos.",
          "Name it, pick a QR style, and the album is ready for your guests.",
          "Name it, pick a QR style, and the code is ready to go on a table.",
          "Name it and pick a QR style. Three steps.",
          "Name it, pick a QR style, and everyone can start adding.",
          "Name it, pick a QR style, done. This takes about a minute.",
        ),
      },
      {
        slot: "The date helper",
        say: s(
          "Just for your reference: events never expire.",
          "For your reference. The event stays until you delete it.",
          "For your reference. The album stays up until you delete it.",
          "Reference only. An event stays until you delete it.",
          "For your reference. Everyone can come back to it until you delete it.",
          "For your reference. Nothing expires here, so the date is just a label.",
        ),
      },
      {
        slot: "The QR step's heading",
        say: s(
          "Guest join QR",
          "The code your guests scan",
          "The code that opens the album",
          "Guest QR code",
          "The code everyone scans",
          "The only thing your guests need",
        ),
      },
    ],
  },
  {
    id: "toasts",
    name: "Two toasts",
    area: "app",
    where: "sonner, via the event and curation actions",
    ground: "app-light",
    canvas: "follow",
    note: "Read in two seconds, with the eye somewhere else.",
    lines: [
      {
        slot: "After copying the link",
        say: s(
          "Link copied",
          "Link copied",
          "Link copied",
          "Link copied",
          "Link copied",
          "Link copied",
        ),
        same: "Two words, past tense, naming exactly what just happened. There is no second way to write it.",
      },
      {
        slot: "After turning review on",
        say: s(
          "Review is on. New uploads wait here for approval.",
          "Review is on. New uploads wait for your approval.",
          "Review is on. New uploads wait here until you approve them.",
          "Review is on. New uploads wait for approval.",
          "Review is on. Everyone's uploads wait for your approval.",
          "Review is on. Nothing appears until you say so.",
        ),
      },
    ],
  },
  {
    id: "notifications",
    name: "The notification panel",
    area: "app",
    where: "components/app/notifications/*",
    ground: "app-dark",
    canvas: "follow",
    note: "On the app's dark theme. The second row is a warning.",
    lines: [
      {
        slot: "Uploads waiting, title",
        say: s(
          "3 uploads to review",
          "3 uploads to review",
          "3 uploads waiting",
          "3 uploads to review",
          "3 uploads from your guests",
          "3 uploads to review",
        ),
      },
      {
        slot: "Uploads waiting, body",
        say: s(
          "Guests are waiting for your approval.",
          "Your guests are waiting on you.",
          "They landed while you were away.",
          "They are held until you approve them.",
          "Everyone who added is waiting on you.",
          "They are not going anywhere, but they are waiting.",
        ),
      },
      {
        slot: "Over storage, title",
        say: s(
          "You're over your storage limit",
          "You're over your storage limit",
          "Your storage is full",
          "You're over your storage limit",
          "You're over your storage limit",
          "You're over your storage limit",
        ),
        compelled:
          "A limit warning states the fact. Softening it is how a host misses the thing that is about to reduce their media.",
      },
      {
        slot: "Over storage, body",
        say: s(
          "Upgrade or remove media before we auto-reduce it.",
          "Upgrade or remove media before we reduce it for you.",
          "Upgrade or remove media before we reduce it for you.",
          "Upgrade or remove media. Otherwise we reduce it automatically.",
          "Upgrade or remove media before we reduce it for you.",
          "Upgrade or remove media before we reduce it for you.",
        ),
      },
    ],
  },
  {
    id: "account-storage",
    name: "The account page's profile note",
    area: "app",
    where: "app/(app)/account/page.tsx",
    ground: "app-light",
    canvas: "follow",
    note: "The longest sentence in the app, on its quietest surface.",
    lines: [
      {
        slot: "Panel heading",
        say: s(
          "Public profile",
          "Public profile",
          "Public profile",
          "Public profile",
          "Public profile",
          "Public profile",
        ),
        same: "The name of the setting. It matches the label on the toggle.",
      },
      {
        slot: "The help text",
        say: s(
          "Your page on Partyreel: the events you host and choose to share, plus events you joined. Follower counts stay private to you.",
          "Your page on Partyreel: the events you host and choose to share, plus events you joined. Follower counts stay private to you.",
          "Your page here: the events you host and choose to share, plus the ones you joined. Follower counts stay private to you.",
          "Your public page shows events you host and choose to share, plus events you joined. Follower counts are private to you.",
          "Your page shows the events you host and choose to share, plus the ones you turned up to. Follower counts stay private to you.",
          "Your page shows what you host and choose to share, plus what you joined. Follower counts are nobody's business but yours.",
        ),
      },
    ],
  },
  {
    id: "errors",
    name: "Two errors",
    area: "app",
    where: "app/(auth)/signin and the upload toast",
    ground: "app-light",
    canvas: "follow",
    note: "Where wit stops being free.",
    lines: [
      {
        slot: "Wrong email or password",
        say: s(
          "That email and password didn't match. Try the email link instead.",
          "That email and password didn't match. Try the email link instead.",
          "That email and password didn't match. Try the email link instead.",
          "That email and password didn't match. Try the email link instead.",
          "That email and password didn't match. Try the email link instead.",
          "That email and password didn't match. Try the email link instead.",
        ),
        compelled:
          "An error names the fact and the next step. Every voice lands on the same sentence, which is the finding: the quiet volume has a floor, and this is it.",
      },
      {
        slot: "A refused upload, title",
        say: s(
          "Couldn't add that photo",
          "Couldn't add that photo",
          "That one didn't land",
          "Upload refused",
          "Couldn't add that photo",
          "Couldn't add that photo",
        ),
      },
      {
        slot: "A refused upload, body",
        say: s(
          "That file type isn't supported.",
          "That file type isn't supported.",
          "That file type isn't supported.",
          "That file type isn't supported.",
          "That file type isn't supported.",
          "That file type isn't supported.",
        ),
        same: "The reason, in one clause. There is one fact and it has one name.",
      },
    ],
  },

  /* ── A guest's phone, and the inbox ────────────────────────────────── */
  {
    id: "guest-door",
    name: "The guest's door, when an email is required",
    area: "guest",
    where: "components/guest/entry/*",
    ground: "app-light",
    canvas: "phone",
    note: "Bible 4 decides more than the voice: the page is the host's.",
    lines: [
      {
        slot: "Small label",
        say: s(
          "One step",
          "One step",
          "One step",
          "One step",
          "One step",
          "One step",
        ),
        same: "A gate label on the host's page. Anything longer is Partyreel talking on somebody else's surface.",
      },
      {
        slot: "Heading",
        say: s(
          "See all the photos",
          "See all the photos",
          "See everything as it arrives",
          "See all the photos",
          "See what everyone added",
          "See all the photos",
        ),
      },
      {
        slot: "Body",
        say: s(
          "Create a free account to see the full gallery and add your own photos.",
          "Confirm your email to open the full album and add your own photos.",
          "Confirm your email to open the album and start adding your own.",
          "Confirm your email to see the full album and upload your own photos.",
          "Confirm your email to see everything everyone added, and to add your own.",
          "Confirm your email to see the whole album and add your own.",
        ),
        compelled:
          "The shipped line asks a guest to create an account with US on the host's own page. The sweep rewrites it whichever voice wins, and its only choosable part is the noun, which is its own ask.",
      },
      {
        slot: "Button",
        say: s(
          "Continue",
          "Continue",
          "Continue",
          "Continue",
          "Continue",
          "Continue",
        ),
        same: "One word on a gate. A voice that writes it is selling on the host's page.",
      },
    ],
  },
  {
    id: "upload-sheet",
    name: "The guest's upload sheet",
    area: "guest",
    where: "components/guest/upload/*",
    ground: "app-light",
    canvas: "phone",
    note: "At 375 always, read with one thumb at a party.",
    lines: [
      {
        slot: "Dropzone title",
        say: s(
          "Add photos & videos",
          "Add photos & videos",
          "Add photos & videos",
          "Add photos & videos",
          "Add photos & videos",
          "Add photos & videos",
        ),
        same: "The action, named for the two things it takes. Every voice writes it.",
      },
      {
        slot: "Dropzone hint",
        say: s(
          "Tap to choose, or drag them here",
          "Tap to choose, or drag them here",
          "Tap to choose, or drag them here",
          "Tap to choose, or drag them here",
          "Tap to choose, or drag them here",
          "Tap to choose, or drag them here",
        ),
        same: "Two gestures, named. This is the floor of the nearly silent volume.",
      },
      {
        slot: "The host's review note",
        say: s(
          "The host reviews uploads before they appear in the gallery.",
          "The host reviews uploads before they appear in the album.",
          "The host sees them first. They appear in the album once approved.",
          "The host reviews uploads before they appear in the album.",
          "The host reviews everyone's uploads before they appear in the album.",
          "The host sees them first, so give it a minute.",
        ),
      },
      {
        slot: "The save card",
        say: s(
          "Create a free account to save this event and come back to the gallery whenever you want.",
          "Save this event to your phone and come back to the album whenever you like.",
          "Save this event and the album is one tap away for the rest of the night.",
          "Save this event to come back to the album later.",
          "Save this event and come back for what everyone else added.",
          "Save this event, so you are not hunting through a chat for the link later.",
        ),
      },
    ],
  },
  {
    id: "guest-empty",
    name: "The album, before anyone has added",
    area: "guest",
    where: "components/guest/album/empty-album.tsx",
    ground: "app-light",
    canvas: "phone",
    note: "The first thing a guest sees at a party just starting.",
    lines: [
      {
        slot: "Heading",
        say: s(
          "This is where it all lands",
          "This is where it all lands",
          "Nothing yet. Yours can be first.",
          "No photos yet",
          "Nobody has added anything yet",
          "Empty, for about another minute",
        ),
      },
      {
        slot: "Button",
        say: s(
          "Be the first to add a photo",
          "Be the first to add a photo",
          "Add the first one",
          "Add a photo",
          "Add the first one",
          "Be the first to add a photo",
        ),
      },
    ],
  },
  {
    id: "email",
    name: "The inactivity email",
    area: "guest",
    where: "the mail templates, behind the lifecycle cron",
    ground: "app-light",
    canvas: "phone",
    note: "It arrives uninvited, in an inbox next to bills.",
    lines: [
      {
        slot: "Subject",
        say: s(
          "Your Partyreel event will be removed soon",
          "Your Partyreel event will be removed soon",
          "Your album is about to come down",
          "Your Partyreel event is scheduled for removal",
          "Your event and everyone's photos will be removed soon",
          "Your Partyreel event will be removed soon",
        ),
        compelled:
          "A deletion warning names the consequence in the subject line, because it may be the only part anyone reads.",
      },
      {
        slot: "Headline",
        say: s(
          "Keep your event active",
          "Keep your event, and its album",
          "Open it once and it stays",
          "Keep your event active",
          "Keep everyone's photos where they are",
          "One tap and it stays",
        ),
      },
      {
        slot: "First line",
        say: s(
          "Your event Maya & Jay's Wedding hasn't been used in a while. To keep free accounts tidy, we remove events after 6 months of inactivity.",
          "Your event Maya & Jay's Wedding has been quiet for a while. We remove events after 6 months of inactivity to keep free accounts tidy.",
          "Maya & Jay's Wedding has sat untouched for six months, and that is when we take an event down.",
          "Maya & Jay's Wedding has been inactive for 6 months. We remove events after 6 months of inactivity.",
          "Nobody has opened Maya & Jay's Wedding in six months, and the photos everyone added come down with it.",
          "Maya & Jay's Wedding has not been opened in six months, which is our cue to clear the shelf.",
        ),
      },
      {
        slot: "Button",
        say: s(
          "Keep my event",
          "Keep my event",
          "Keep my event",
          "Keep my event",
          "Keep my event",
          "Keep my event",
        ),
        same: "The one action the mail exists to get. It says what pressing it does.",
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * READING THE SPOTS
 * ------------------------------------------------------------------------ */

export function spotById(id: string): SpotDef | undefined {
  return SPOTS.find((spot) => spot.id === id);
}

/** One spot's slot, in one voice. Returns "" rather than throwing: a board
 *  renders a missing line as nothing, never as a blank screen. */
export function line(
  spot: SpotDef | undefined,
  slot: string,
  voice: VoiceId,
): string {
  return spot?.lines.find((l) => l.slot === slot)?.say[voice] ?? "";
}

/** True when a candidate writes the shipped string back. Where a voice does
 *  NOT bite is as much of a ruling as where it does. */
export function heldBy(l: SpotLine, voice: VoiceId): boolean {
  return voice === "today" || l.say[voice] === l.say.today;
}

/** True when every voice lands on the same string. */
export function sameInAll(l: SpotLine): boolean {
  return VOICE_IDS.every((v) => l.say[v] === l.say.today);
}

/** How many of the site's lines a voice rewrites, out of how many. The card's
 *  fourth fact, measured rather than asserted. */
export function moved(voice: VoiceId): { moved: number; total: number } {
  const all = SPOTS.flatMap((spot) => spot.lines);
  return {
    moved: all.filter((l) => !heldBy(l, voice)).length,
    total: all.length,
  };
}

/**
 * A line that is the same in every voice WITHOUT a stated reason is a defect,
 * so the board counts it separately and says so out loud rather than letting a
 * row print the same string six times under the word unchanged.
 */
export function tally(): {
  spots: number;
  rows: number;
  differ: number;
  same: number;
  unexplained: number;
} {
  const all = SPOTS.flatMap((spot) => spot.lines);
  const same = all.filter(sameInAll);
  return {
    spots: SPOTS.length,
    rows: all.length,
    differ: all.length - same.length,
    same: same.length,
    unexplained: same.filter((l) => !l.same && !l.compelled).length,
  };
}

/* ---------------------------------------------------------------------------
 * THE THREE CALLS A VOICE DOES NOT DECIDE
 * ------------------------------------------------------------------------ */

/**
 * The link preview a group chat draws when a host pastes the event link. Not a
 * voice question: whichever voice wins this is one string, and it is on the
 * board because it has been parked since before this track existed.
 */
export const UNFURL = {
  title: "Maya & Jay's Wedding",
  open: "Photos and videos from the day. Add yours.",
} as const;

/** What a guest's surface calls the thing they are looking at. */
export const NOUN = { app: "album", guest: "gallery" } as const;

/** The two counts the home page is about to carry at once. */
export const COUNTS = {
  demo: "Built from 214 photos. Shot by 23 guests.",
  hero: "312 photos from 48 guests",
} as const;
