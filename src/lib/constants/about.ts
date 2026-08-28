/**
 * THE /about COPY SINGLE-SOURCE.
 *
 * Why a constants file for a one-consumer page: content-policy.test.ts runs its
 * CLAIM fence (no borrowed credibility, no enforcement-agency language, no
 * backstop capacity numbers) over MDX plus a CLAIM_FILES list, and the About
 * PAGE file was in neither. Only the weaker neutralization fence reached it. So
 * the copy lives here and here is on the list.
 *
 * ── THE PAGE'S JOB (rebuilt 2026-08-28 on Will's second pass) ──
 *
 * The page was on probation: "If we can't figure it out, I plan on killing the
 * page entirely since it doesn't seem to be adding much value." What justifies
 * it is the MISSION, told as a story: everyone is already a photographer, and
 * there has never been a way to get everyone's pictures into one place. The
 * convictions then read as the answer to that story rather than as a list, and
 * the page closes by pointing at careers.
 *
 * ★ THE R5 ZERO-TEAM RULING IS RELAXED FOR THIS PAGE (Will, 2026-08-28). It
 * banned all team/founder framing; this pass asks for both a first-person
 * origin ("We had this problem and wanted to solve it for everyone for any
 * event") and a "join our team" close. The ruling's intent (nothing that hints
 * at less than a stellar product) still holds: no headcount, no scrappiness, no
 * founder biography. Careers is where "small team" is allowed to live.
 *
 * ★ CATEGORY-LEVEL, NEVER BRAND NAMES. Will's raw notes named specific photo
 * and drive products; the 2026-08-28 AI-posture ruling keeps comparison content
 * brand-nameless, and category-level reads better anyway (naming products dates
 * the copy and sounds defensive). Every texture from his notes survives: the
 * cross-platform album, the drip-fed thread, the account wall, the per-person
 * rental.
 *
 * Copy is PROVISIONAL (the SECTION_HEADERS convention; Will rules later), but it
 * answers to every mechanical fence: no em-dashes, no "night" as identity
 * language, no counts and nothing borrowed (pre-launch, Stripe TEST), outcomes
 * never actors. Row 5's first clause is phrased outcome-first PRECISELY to clear
 * the neutralization fence, which bans naming WHO does the reviewing. Keep the
 * passive voice.
 */

export const ABOUT_META = {
  title: "About",
  description:
    "Everyone at an event is already a photographer, and none of it ends up in one place. Why Partyreel exists, and the six things it will not trade away.",
} as const;

/**
 * The masthead. Will ruled the wordmark itself as the page title (plain text at
 * display scale, NOT the Logo lockup): an About page is a title page, so the
 * header carries no argument and the story below does all the explaining.
 */
export const ABOUT_HERO = {
  eyebrow: "About",
  wordmark: "Partyreel",
  // One line under the masthead, because a wordmark alone reads as a cover
  // rather than a page. It states the premise the story then earns.
  subhead:
    "Every guest is already a photographer. We are building the one place all of it can land.",
  secondaryLabel: "How it works",
  secondaryHref: "/how-it-works",
} as const;

/**
 * THE MISSION, as a story. The shape is Will's: the shift already happened
 * (everyone is a photographer), the collecting never got solved, and every
 * workaround fails a different part of the room. Paragraph 3 is the origin and
 * the mission in the same breath.
 */
export const ABOUT_STORY = {
  eyebrow: "Our mission",
  heading: "Everyone is a photographer. Nothing collects it.",
  paragraphs: [
    "Every person at your event is carrying a camera good enough to shoot it. That part solved itself years ago. The same few hours get photographed from every angle in the room, and between all those phones there is a better record of the event than anyone walked away with.",
    "Getting it into one place is where it breaks, and it breaks somewhere different every time. The shared album opens for half the room. The group chat drips photos out one at a time. The cloud folder wants an account, so the guests whose photos you want most are the first to quit. Rented cameras charge by the table. Somewhere in there everyone gives up, and the rest of the photos are never seen.",
    "We kept running into this at our own events, and there was never a version that worked for everyone who was there. So we built one: a single code, any phone, nothing to install and no account to make, with every photo and video landing in the same album at the size it was taken.",
  ],
} as const;

/**
 * The convictions, framed as the answer to the story above rather than as a
 * list of features. Each links to the page that proves it, which is what turns
 * "checkable" from a sentence into the page's architecture.
 *
 * ★ Mechanism copy has a HARD ~120-character budget: at the ledger's ~61ch right
 * column it must fit two lines, and a third breaks the row rhythm.
 *
 * The help slugs are plain literals, pinned by help-slug-pins.test.ts so a
 * rename cannot silently strand them.
 */
export const ABOUT_LEDGER = {
  eyebrow: "Our philosophy",
  heading: "Six things we will not trade away.",
  lead: "This is what the product does about it, and each line links to where you can check it.",
} as const;

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

/**
 * The close. Points at careers rather than at signup: the footer already owns
 * the paper lane's one conversion action (its own doctrine), so a second Start
 * free directly above it would be the same solicitation twice.
 *
 * Two variants because `IS_HIRING` is derived from the open roles: a hiring
 * claim that outlives the roles is exactly the kind of stale copy the page's own
 * ledger promises not to ship.
 */
export const ABOUT_CAREERS = {
  heading: "Want to join our team?",
  hiring:
    "The list above is the easy part to write and the hard part to keep. If that is the kind of problem you want to spend your time on, we are hiring.",
  notHiring:
    "The list above is the easy part to write and the hard part to keep. There is no open role today, but we always want to know who we should be talking to.",
  linkLabelHiring: "See open roles",
  linkLabelNotHiring: "About working here",
  href: "/careers",
} as const;
