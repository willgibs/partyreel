import { MARKETING_IMAGES, MARKETING_REELS } from "@/lib/constants/marketing-media";

/**
 * THE MEDIA-KIT BOARD'S DATA (the review wave, 2026-09-14). Kept out of board.tsx
 * so the board is layout and the argument is readable on its own.
 *
 * Nothing here is a second source of truth: the twelve stand-ins and the two
 * reels are READ from src/lib/constants/marketing-media.ts (the one manifest);
 * this file only adds what the manifest has no field for yet, which is exactly
 * what the track proposes adding: a vertical, a provenance class, and the frame
 * that would replace each stand-in under each of the three routes.
 *
 * The blog rows come from content/blog/*.mdx frontmatter + blog-covers.ts. They
 * are transcribed rather than read because MDX frontmatter needs node:fs and this
 * board is a client component; blog-covers.test.ts already fails if a pinned id
 * stops resolving, so a drift here cannot ship a broken frame.
 */

/** The verticals the product actually serves (docs/ASSETS.md row 7). */
export type Vertical =
  | "weddings"
  | "birthdays"
  | "corporate"
  | "conferences"
  | "festivals"
  | "trips";

export const VERTICALS: { id: Vertical; label: string }[] = [
  { id: "weddings", label: "Weddings" },
  { id: "birthdays", label: "Birthdays" },
  { id: "corporate", label: "Corporate" },
  { id: "conferences", label: "Conferences" },
  { id: "festivals", label: "Festivals" },
  { id: "trips", label: "Trips" },
];

/** The three routes the board argues. Not three shades of one answer: one buys
 *  time, one buys the rule, one is the plan of record. */
export type Route = "licensed" | "ours" | "mix";

export type StandIn = {
  id: string;
  vertical: Vertical;
  /** The licensed candidate staged under public/design/media-kit/, if any. The
   *  fields mirror provenance.json beside the files, and provenance.test.ts pins
   *  the two together so neither can drift. */
  licensed?: {
    file: string;
    /** Described by eye at intake, never inherited from the file name. */
    subject: string;
    author: string;
    source: string;
    sourceUrl: string;
    license: string;
    retrieved: string;
    /** Where this candidate would fail the proposed rule, or where its subject
     *  drifts from the stand-in it replaces. Shown on the board, not buried. */
    caution?: string;
  };
  /** Why the batch has nothing for this frame. A hole is a finding, so it says
   *  what the corpus actually returned rather than leaving a grey box. */
  noCandidate?: string;
  /** The frame Will makes instead: the brief, one shot, specific enough to hold a camera to. */
  ours: string;
  /** Which route the mix assigns this frame to, and the reason in a few words. */
  mix: { route: Exclude<Route, "mix">; why: string };
};

/** The eleven landscape ids blog-covers.ts pins as the cover pool (wedding-petals,
 *  the lone portrait, is excluded there and stays legal only as an explicit cover). */
const BLOG_POOL = new Set([
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "reception-table",
  "concert-confetti",
  "wedding-toast",
  "party-dj",
  "wedding-arch",
  "festival-lights",
  "reception-hall",
  "wedding-rings",
]);

const REEL_CLIP_IDS = new Set(MARKETING_REELS.flatMap((r) => r.recipe.clipIds));

/** Posts whose cover comes from a vertical the pool does not have. The pool holds
 *  seven weddings, one birthday, four festivals and nothing else, so every
 *  corporate, conference, trip and family post is illustrated with someone
 *  else's wedding or a music festival. This is the gap, in production, today. */
export const MISCAST: { slug: string; cover: string; reads: string }[] = [
  {
    slug: "company-offsite-photos",
    cover: "reception-hall",
    reads: "an offsite illustrated with a banquet hall of blue and white streamers",
  },
  {
    slug: "conference-photo-sharing-no-app",
    cover: "festival-crowd",
    reads: "a conference illustrated with an outdoor music festival",
  },
  {
    slug: "corporate-event-photo-sharing-pricing",
    cover: "festival-lights",
    reads: "corporate pricing illustrated with rainbow lasers",
  },
  {
    slug: "office-holiday-party-photos-checklist",
    cover: "concert-confetti",
    reads: "the office party illustrated with a night concert crowd",
  },
  {
    slug: "group-trip-photo-sharing",
    cover: "festival-lights",
    reads: "a group trip illustrated with a festival arena",
  },
  {
    slug: "family-reunion-photo-sharing",
    cover: "reception-table",
    reads: "a family reunion illustrated with a wedding reception table",
  },
  {
    slug: "birthday-party-photo-sharing",
    cover: "reception-hall",
    reads: "a birthday illustrated with a banquet hall, not the one birthday frame we own",
  },
];

/**
 * The twelve, in manifest order, each with its vertical, its live exposure, the
 * frame Will would make, and the route the mix assigns it. The `licensed` field
 * is filled by stage-batch.ts from the staged files, so a frame with no staged
 * candidate simply shows the ask instead of a hole.
 */
export const STAND_INS: StandIn[] = [
  {
    id: "wedding-golden",
    vertical: "weddings",
    licensed: {
      file: "wedding-golden.jpg",
      subject:
        "A couple walking away down a rural road, backlit, seen from behind",
      author: "Andrew Itaga",
      source: "Wikimedia Commons, Unsplash @and73w",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Bride_and_groom_on_rural_road_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
    },
    ours: "The couple walking out through a corridor of guests, backlit, faces soft and the flare real. Golden hour, no fill. It has to survive a 22 percent left crop and a 78 percent right crop with something in both halves.",
    mix: { route: "ours", why: "three posts and the corridor; the most-seen frame we own" },
  },
  {
    id: "reception-table",
    vertical: "weddings",
    noCandidate:
      "Nothing. The CC0 corpus has restaurant tables and styled flat-lays, and no dinner with people at it.",
    ours: "A long table from the end, low and level with the glasses, candles down the middle and hands reaching in. Shot after people have sat down, not before, so it is a dinner and not a styled setup.",
    mix: { route: "ours", why: "the styled-setup look is what reads as stock" },
  },
  {
    id: "party-balloons",
    vertical: "birthdays",
    noCandidate:
      "Nothing usable. Every search for party balloons in the CC0 corpus returns hot air balloons, six results out of six.",
    ours: "Candles going out, faces lit from below by the cake, the room dark behind. The one birthday frame we own is decor with no people in it, which is the whole problem with it.",
    mix: { route: "ours", why: "our only birthday frame has no people in it" },
  },
  {
    id: "concert-confetti",
    vertical: "festivals",
    licensed: {
      file: "concert-confetti.jpg",
      subject:
        "A small venue crowd in silhouette against a lit stage",
      author: "Jorge Gordo",
      source: "Wikimedia Commons, Unsplash @jorgegordo",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Concert_TUYA_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
    },
    ours: "Confetti over a night crowd from inside the crowd, phone screens visible in the dark. Shot at the height of a person, never from the balcony.",
    mix: { route: "ours", why: "a reel clip; the grade has to match the film" },
  },
  {
    id: "wedding-rings",
    vertical: "weddings",
    licensed: {
      file: "wedding-rings.jpg",
      subject:
        "Two hands, a ring, nothing else in frame",
      author: "Rachael Crowe",
      source: "Wikimedia Commons, Unsplash @_rachaelcrowe",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Groom_holds_bride%27s_hand_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
    },
    ours: "Two hands on a table edge, rings on, one still holding a glass. Close enough that it reads at 120 px, loose enough that it is a moment and not a catalog shot.",
    mix: { route: "licensed", why: "a detail shot: furniture on a post, not an argument" },
  },
  {
    id: "reception-hall",
    vertical: "weddings",
    noCandidate:
      "Nothing. Searches for a dance floor returned a woman in a desert, a couple embracing, an elderly couple and a rope on a stage. Not one dance floor.",
    ours: "The dance floor from above, hands up, the room warm and the edges dark. Replaces the empty hall, which is the frame four posts currently lean on and the emptiest thing in the manifest.",
    mix: { route: "ours", why: "four posts ride this one frame" },
  },
  {
    id: "party-dj",
    vertical: "festivals",
    licensed: {
      file: "party-dj.jpg",
      subject:
        "A DJ at the decks under stage light and smoke",
      author: "Thomas Habr",
      source: "Wikimedia Commons, Unsplash @thomashabr",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Party_Night_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
      caution:
        "One identifiable performer. Under the proposed rule 1.4 this frame needs a release we do not hold, so it could not ship as it stands.",
    },
    ours: "The booth from behind the decks, over a shoulder, the floor beyond it out of focus. The face is not the subject and does not need to be in focus.",
    mix: { route: "ours", why: "a reel clip in both recipes" },
  },
  {
    id: "wedding-toast",
    vertical: "weddings",
    licensed: {
      file: "wedding-toast.jpg",
      subject:
        "Hands clinking beer glasses over a restaurant table",
      author: "Yutacar",
      source: "Wikimedia Commons, Unsplash @yutacar",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Restaurant_Swan_Lake_Beer,_Agano-shi,_Niigata-pref,_Japan_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
      caution:
        "Honest subject drift: this is a restaurant, not a wedding. The stand-in it replaces is a reception toast under string lights.",
    },
    ours: "A toast mid-sentence: glass up, the speaker soft, the table sharp and laughing. String lights behind, kept in the top third so the crop ladder never loses them.",
    mix: { route: "ours", why: "three posts and a reel clip" },
  },
  {
    id: "festival-lights",
    vertical: "festivals",
    licensed: {
      file: "festival-lights.jpg",
      subject:
        "Stage light beams through smoke over a crowd, one hand raised",
      author: "Daniel Robert",
      source: "Wikimedia Commons, Unsplash @danielrobertdinu",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Smoke_and_light_beams_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
    },
    ours: "A light rig from underneath at dusk, the sky still blue behind it. Warm and dark rather than rainbow, so it can sit under type.",
    mix: { route: "ours", why: "a reel clip; the rainbow grade fights every chapter it lands in" },
  },
  {
    id: "festival-crowd",
    vertical: "festivals",
    licensed: {
      file: "festival-crowd.jpg",
      subject:
        "Festival ground in daylight, people sitting on the grass, seen from behind",
      author: "Aranxa Esteve",
      source: "Wikimedia Commons, Unsplash @aranxa_esteve",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Young_women_at_a_music_festival_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
      caution:
        "Honest subject drift: daylight and cool, where the stand-in is a warm stage glow at dusk.",
    },
    ours: "Two friends on shoulders over a crowd at sunset, one of them filming on a phone. The phone is the product argument and it costs nothing to include.",
    mix: { route: "ours", why: "a reel clip, and the phone-in-frame ask" },
  },
  {
    id: "wedding-arch",
    vertical: "weddings",
    licensed: {
      file: "wedding-arch.jpg",
      subject:
        "An empty ceremony aisle, tall floral arrangements either side",
      author: "Shardayyy Photography",
      source: "Wikimedia Commons, Unsplash @shardayyy",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Aisle_for_a_Wedding_(Unsplash).jpg",
      license: "CC0 1.0",
      retrieved: "2026-09-14",
    },
    ours: "The arch after the ceremony with people under it, not the empty arrangement against the sky. Every frame we own of a venue is a frame with nobody in it.",
    mix: { route: "licensed", why: "one post; a scene setter that can wait" },
  },
  {
    id: "wedding-petals",
    vertical: "weddings",
    noCandidate:
      "Nothing. The corpus has no portrait event frame at all, which is the same hole the manifest has: one portrait in twelve.",
    ours: "The exit under petals, shot portrait from low, the couple small in the frame and guests filling the edges. Our only portrait frame, and every vertical slot in the product is currently fed by it.",
    mix: { route: "ours", why: "the only portrait source in the manifest" },
  },
];

/** Live exposure, derived rather than typed twice: the blog pool and the reels
 *  are the two things that put a stand-in in front of a stranger today. */
export const BLOG_COVER_COUNTS: Record<string, number> = {
  "reception-hall": 4,
  "wedding-toast": 3,
  "wedding-golden": 3,
  "reception-table": 2,
  "party-dj": 2,
  "party-balloons": 2,
  "festival-lights": 2,
  "concert-confetti": 2,
  "wedding-rings": 1,
  "wedding-arch": 1,
  "festival-crowd": 1,
};

/** Where a frame is publicly visible TODAY: the exposure, not the plan. Derived
 *  rather than typed, so it cannot drift from the counts above. */
export function liveExposure(id: string): string[] {
  const out: string[] = [];
  const covers = BLOG_COVER_COUNTS[id] ?? 0;
  if (covers > 0) {
    out.push(
      `${covers} blog ${covers === 1 ? "cover" : "covers"}, their OG cards and the RSS enclosures`,
    );
  } else if (BLOG_POOL.has(id)) {
    out.push("in the blog fallback pool");
  }
  if (REEL_CLIP_IDS.has(id)) out.push("a clip in a recorded reel recipe");
  return out.length ? out : ["the lab only"];
}

/** The manifest's own entries, so the board shows the real line under each frame
 *  rather than a copy of it. */
export const MANIFEST_BY_ID = new Map(MARKETING_IMAGES.map((m) => [m.id, m]));

export const REELS = MARKETING_REELS;

/**
 * THE KIT. Round two's three hero concepts each asked for their own batch (24
 * squares at 512, 36 photographs at 1600 with 8 vertical clips, a 15 to 20 s
 * film) and the round-two ruling parked or withdrew two of the three the same
 * day, because each was cut to one concept's layout. shared.tsx already states
 * the conclusion in the tree: "Will's 36-frame set (a third portrait, 24 also as
 * 512-square) replaces them by id". So: 36 masters, six per vertical, is the
 * whole ask, the 512 squares are crops of 24 of them, and a clip or a film is
 * cut from the same shoot. A kit cut to the PRODUCT's verticals survives a hero
 * ruling; a batch cut to one composition does not.
 */
export const SHOT_LIST: Record<Vertical, string[]> = {
  weddings: [
    "A toast mid-sentence, glass up, the table sharp and laughing",
    "Two hands on a table edge, rings on, one still holding a glass",
    "The dance floor from above, hands up, edges dark",
    "The exit under petals or confetti, shot portrait from low",
    "A guest holding a phone up, filming the first dance",
    "The cake table at dusk under string lights, people reaching in",
  ],
  birthdays: [
    "Candles going out, faces lit from below",
    "A sparkler number held up in a dark room",
    "The sofa squeeze, too many people in one frame",
    "Hands and cake, close enough to read at 120 px",
    "Balloons against a ceiling, shot straight up, someone underneath",
    "The table after: plates, confetti, one glass still going",
  ],
  corporate: [
    "The offsite long table, warm, phones down",
    "A rooftop drinks circle at golden hour",
    "The award handshake, caught mid-clap from the room",
    "Karaoke, two people sharing a mic, the room out of focus",
    "The van or bus at the end of the night, doors open",
    "A team photo going wrong, half of them laughing",
  ],
  conferences: [
    "The hallway between sessions, lanyards, nobody posing",
    "The stage from the back of the room, silhouettes and screen glow",
    "A phone held up over the crowd, photographing a slide",
    "The coffee-break huddle, cups and gesturing hands",
    "A booth handshake, badges legible, faces soft",
    "The badge wall at the end of day one, half of them gone",
  ],
  festivals: [
    "The crowd from inside it, hands up against stage light",
    "Confetti over a night crowd, phone screens in the dark",
    "Two friends on shoulders at sunset, one of them filming",
    "A light rig from underneath at dusk, sky still blue",
    "The field at golden hour, flags, small figures",
    "The camp at dawn, one person awake",
  ],
  trips: [
    "The car loaded, doors open, someone still deciding",
    "A terrace table at night, the town below",
    "The group on a beach at dusk, backlit, no faces needed",
    "Someone photographing someone photographing",
    "A ridge line with the group small in it",
    "The last fire, faces lit orange",
  ],
};

/** What a frame must survive before it enters the manifest. Derived from the
 *  surfaces the twelve already feed, so the spec is a test and not a mood. */
export const KIT_CONSTRAINTS = [
  "1600 px long edge, a third portrait. Eleven of the twelve stand-ins are landscape and none is wider than 900 px, so every tall slot in the product is currently fed by one photograph.",
  "Readable at 120 px. The hero corridor reads a frame between 70 and 290 px, where a wide room shot is grey mush. Tight framing is the single biggest lift available to the whole set.",
  "Survives the crop ladder: a blog cover is cropped to six positions from 22 percent left to 78 percent right, so a frame with its whole subject in the middle loses it four times out of six.",
  "Dark and warm with the left 55 percent in the lower third of the range: that is what buys a hero with no scrim over the media, which is rule 1 held rather than argued.",
  "Three frames show a guest holding a phone up at the event. Every round-three hero variation wants them, and the many-hands argument lands harder when one frame says it literally.",
  "No frame needs a face in focus to work. That is a composition note on the hero and, under the proposed rule, the thing that keeps most of the kit clear of the release question.",
];
