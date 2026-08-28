import { FAILURE_MODE_LINE } from "@/lib/constants/marketing-voice";

/**
 * THE /about COPY SINGLE-SOURCE.
 *
 * Why a constants file for a one-consumer page: content-policy.test.ts runs its
 * CLAIM fence (no borrowed credibility, no enforcement-agency language, no
 * backstop capacity numbers) over MDX plus a CLAIM_FILES list, and the About
 * PAGE file was in neither. Only the weaker neutralization fence reached it. So
 * the copy lives here and here is on the list.
 *
 * ── THE PAGE'S JOB (R5 ruling 2026-08-26, re-affirmed and extended 2026-08-28) ──
 *
 * We-voice throughout. ZERO team / headcount / founder framing ("nothing that
 * hints at less than a stellar product"). Every conviction verifiable in the
 * shipped product, and since this pass, LINKED to where you verify it: the old
 * page promised "you can verify each one on your first event" and then gave the
 * reader nothing to click.
 *
 * ★ AFFIRMATIVE ONLY (Will, 2026-08-28). A "where Partyreel is the wrong call"
 * section was planned and cut: "Those are incredibly limiting, considering the
 * fact that a photographer could also deliver their photos via this platform.
 * It could also act as somewhat of a slideshow app with the reels... We don't
 * need to box ourselves in if people find more use cases beyond what's directly
 * listed. I genuinely hope people do find ways to use this beyond what we've
 * thought of. THIS IS ABOUT WHO WE ARE, NOT WHO WE ARE NOT." So: never enumerate
 * what the product is not for, and never fence a use case. The close carries the
 * openness itself.
 *
 * Copy is PROVISIONAL (the SECTION_HEADERS convention; Will rules later), but it
 * answers to every mechanical fence: no em-dashes, no "night" as identity
 * language, no counts and nothing borrowed (pre-launch, Stripe TEST), outcomes
 * never actors. Row 5's first clause is phrased outcome-first PRECISELY to clear
 * the neutralization fence: do not "improve" it into naming a reviewer.
 */

export const ABOUT_META = {
  title: "About",
  description:
    "The photos from your event already exist, on everyone else's phones. Why Partyreel gathers them, and the commitments the product holds to.",
} as const;

export const ABOUT_HERO = {
  eyebrow: "About",
  // Four words that reframe the category: Partyreel is not a camera, it is the
  // thing that gathers what was already shot. Affirmative in grammar, and it
  // makes the reader ask "so where are they", which the subhead answers.
  heading: "The photos already exist.",
  subhead:
    "Every phone in the room made a record of the same event. Partyreel exists so that record comes back whole, at full size, to everyone who was there.",
} as const;

/**
 * The argument. Ink, not muted (the footer round's lesson: muted body copy reads
 * as small print, and the fix was to spend the scale and the ink).
 *
 * Deliberately NOT careers' problem story, which is candid-vs-posed and photos
 * scattering across camera rolls. This one is about POSSESSION and the social
 * cost of collecting. "Camera roll" is avoided on purpose so the two do not
 * rhyme, and none of PRESS_BOILERPLATE's nouns appear.
 */
export const ABOUT_ARGUMENT = [
  "By the end of any event, your guests have a better record of it than you do. They were closer to the moment, they were not the ones running the thing, and there were a lot more of them. The photos you would most want from your own event are, almost by definition, on a phone that is not yours.",
  "Getting them is where it falls apart. A few land in the group chat and slide out of reach by the next morning. Most never leave the phone they were taken on. The rest depend on you asking, and then asking again, and nobody wants to be the person who asks again.",
  `So Partyreel is built around the collecting, which is the only part that was ever hard. One code, and everything anyone shot goes to the same place at the size it was taken. Nobody gets asked twice. The alternative is the group chat, where ${FAILURE_MODE_LINE}. This is the failure mode Partyreel was built against.`,
] as const;

/**
 * The one dark beat. Written from THE ROOM (the table, the phone already in
 * someone's hand, the party still going), which is what keeps it distinct from
 * PRESS_BOILERPLATE, written from the product. No hosts, no guests, no "no app
 * and no account", no "full quality", no reel.
 */
export const ABOUT_GATHER = {
  eyebrow: "In the room",
  heading: "Nobody has to leave the table.",
  subhead:
    "Somebody has a phone in their hand already, the code is on the table, and one scan opens the album right there in the browser. The party carries on, and the album fills the whole time it does.",
  // ★ Sits under an album made entirely of photos the reader did not take, and
  // it is the emotional close of the argument the h1 opened. It is about
  // ARRIVING, never about completeness, which is what makes it compatible with
  // the thirteenth photo landing after it. Do not revise toward "everything".
  payoff: "This is what everyone else saw.",
} as const;

/**
 * The convictions ledger. Each row links to the page that shows it working,
 * which is what turns "checkable" from a sentence into the page's architecture.
 *
 * ★ Mechanism copy has a HARD ~120-character budget: at the ledger's ~61ch right
 * column it must fit two lines, and a third line breaks the row rhythm. Four of
 * the six bodies this replaced ran 122-143 and could not be kept. Current
 * lengths: 114 / 112 / 95 / 95 / 113 / 111.
 *
 * The help slugs below are plain literals, pinned by help-slug-pins.test.ts so a
 * rename cannot silently strand them.
 */
export const ABOUT_CONVICTIONS: readonly {
  title: string;
  body: string;
  linkLabel: string;
  href: string;
}[] = [
  {
    title: "Nothing to install.",
    body: "A camera and a browser are all it takes. Anyone who can scan a code is in, uploading from the phone in their hand.",
    linkLabel: "How the code works",
    href: "/features/qr",
  },
  {
    title: "Originals in, originals out.",
    body: "Full resolution up, full resolution down, no re-compression in between. Nothing loses quality on the way to you.",
    linkLabel: "Inside the album",
    href: "/features/album",
  },
  {
    title: "Private by default.",
    body: "An album opens exactly as wide as its host chooses, and share links stay out of search engines.",
    linkLabel: "The full privacy story",
    href: "/features/privacy",
  },
  {
    title: "Built to keep.",
    body: "Albums do not expire, deletes stay reversible for 30 days, and every file lives in two regions.",
    linkLabel: "How long media is kept",
    href: "/help/how-long-media-is-kept",
  },
  {
    // ★ The first clause is verbatim from the shipped page and stays that way:
    // it is phrased outcome-first to clear the neutralization fence, which bans
    // naming WHO does the reviewing. Keep the passive voice.
    title: "Review comes before removal.",
    body: "Every report gets reviewed before anything comes down, and a host can remove anything from their album instantly.",
    linkLabel: "Reporting and safety",
    href: "/help/reporting-and-safety",
  },
  {
    title: "Your photos leave with you.",
    body: "Download one photo or the whole album, whenever you like, at the quality it arrived. No lock-in, no export fee.",
    linkLabel: "How downloads work",
    href: "/help/download-photos-videos-and-albums",
  },
];

export const ABOUT_LEDGER = {
  eyebrow: "Convictions",
  heading: "Every one of these is checkable.",
  lead: "Each row links to the page that shows it working.",
} as const;

/**
 * The close. Reading order is link, then the masthead, then this: a page that
 * ends on a link ends on an errand, a page that ends on its own name ends on a
 * conviction.
 *
 * "The name:" is dropped from the shipped version because the wordmark sits
 * directly above and has just settled; announcing it would explain the joke.
 * The last two sentences are Will's 2026-08-28 openness ruling in the page's own
 * voice, and they are the one moment of first-person warmth on a page that by
 * ruling has no team, no headcount and no founder to spend it on.
 */
export const ABOUT_CLOSE = {
  linkLabel: "From the first scan to the final cut",
  linkHref: "/how-it-works",
  wordmark: "Partyreel",
  caption:
    "A party, plus a reel. Every album can end as a film. Everything past that we left open on purpose: whatever you gather here is yours, and what you make of it is yours too. We genuinely hope people find uses for it that we never thought of.",
} as const;
