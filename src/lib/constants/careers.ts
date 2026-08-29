// Single source for the careers hub + role pages.
//
// THE 2026-08-28 CAREERS ROUND. Will's verdict on the first rebuild attempt is
// the shape of this file: a careers page is NOT the place to explain how the
// product works internally ("why in the world am I reading about Reel CSS
// rendering on the careers page... this will all be handled during
// interviews"), it is not centred on one role (the General Application is
// permanent and more listings are coming), and it does not dwell on being
// pre-launch ("we're building this for launch"). So: general company copy on
// the hub, the description on the role page, and every listing rendered by one
// scalable section.
//
// `location`/`offer` are OPTIONAL so only a role that opts in shows a
// remote-policy / perks framing, and the General Application stays claim-free.
// `responsibilities`/`requirements` render only when non-empty, so the
// open-ended catch-all does not show empty sections.

export type JobOpening = {
  slug: string;
  title: string;
  /** The hiring team - set ONLY for a real vacancy (a catch-all has none). */
  team?: string;
  type: string;
  /** A stated location/remote policy - set ONLY for roles that have one. */
  location?: string;
  /** One-liner for the roles list. */
  hook: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  /** "What we offer" - set ONLY for roles that opt into a perks/comp framing. */
  offer?: string[];
  /**
   * The open-ended "tell us what you'd build" entry, which is NOT a vacancy.
   * Flagged rather than inferred from the slug so the hiring signal below stays
   * honest if the catch-all is ever renamed. It is PERMANENT and rendered as a
   * first-class, visually distinct entry (Will, 2026-08-28: "we plan on having
   * an ongoing General Application"), never as a peer vacancy card and never as
   * an afterthought.
   */
  catchAll?: true;
};

// The slug stays `reels-engineer` (no dead URLs) while the TITLE is searchable:
// "Reels Engineer" was invented nomenclature that named no discipline and no
// seniority, so nobody looking for this work would ever type it (renamed by
// Will's ruling, 2026-08-28).
const reelEngineer: JobOpening = {
  slug: "reels-engineer",
  title: "Graphics Engineer, Reel",
  team: "Engineering",
  type: "Full-time",
  location: "Remote",
  hook: "Own the highlight reel, the moment every event has been building toward.",
  summary:
    "Every Partyreel album can end as a short film: the best moments of an event, cut together and ready to share. The engine that makes them runs entirely in the browser, renders on the host's own phone, and ships fourteen distinct looks today. We are looking for the person to own it and take it much further.",
  responsibilities: [
    "Own the reel end to end, from the styles a host picks from to the video they download.",
    "Design and ship new looks: layout, timing, colour, and typography in motion that flatter whatever mix of photos and videos a real event produces.",
    "Keep the reel fast and dependable on the phones people actually own, not just the ones we test on.",
    "Shape the experience around it, from the host's studio to the moment guests see the finished film.",
  ],
  requirements: [
    "Real experience with graphics on the web: canvas or WebGL, animation timing, colour, and type in motion.",
    "A motion designer's taste with an engineer's discipline. You can make thirty seconds feel cinematic and keep it smooth.",
    "A bias for owning a surface end to end rather than a slice of one.",
    "Bonus: video encoding, colour grading, easing systems, or performance work on mobile devices.",
  ],
  // KEPT DELIBERATELY, do not "fix" this back (Will, 2026-08-28): "this posting
  // is really meant to spark a conversation... competitive compensation is
  // totally fine and fairly commonplace on job listings. If we get more serious
  // and really want to recruit, we'll start getting more specific later."
  // The one change he ruled: "Remote-friendly" became "Remote", because it
  // contradicted the Remote location badge rendered on the same screen.
  offer: [
    "Remote",
    "Meaningful early-stage equity",
    "Competitive compensation",
    "Lead a core part of the product",
  ],
};

const generalApplication: JobOpening = {
  slug: "general",
  catchAll: true,
  title: "General Application",
  // No `team`: "Any team" was vacancy-shaped metadata on a non-vacancy. The row
  // states only that it is always open, which is the one true fact about it.
  type: "Always open",
  hook: "Nothing above fits? Tell us what you'd want to own.",
  summary:
    "We are always glad to meet people who care about this kind of work. If nothing above fits but you think you would be a great addition, tell us what you would want to own, and why Partyreel.",
  responsibilities: [],
  requirements: [
    "A track record of building things you are proud of.",
    "Comfort owning ambiguity in a small, early-stage team.",
    "You care about the details people feel but never consciously notice.",
  ],
};

// Named vacancies first; the General Application is always last (catch-all).
export const JOB_OPENINGS: JobOpening[] = [reelEngineer, generalApplication];

export const JOB_SLUGS = JOB_OPENINGS.map((job) => job.slug);

/** Real, named vacancies (the catch-all is not one). */
export const OPEN_ROLES = JOB_OPENINGS.filter((job) => !job.catchAll);

/** The permanent catch-all entry, rendered in its own register on the hub. */
export const GENERAL_APPLICATION = JOB_OPENINGS.find((job) => job.catchAll);

/**
 * Whether to advertise hiring in chrome (the footer's Careers badge). DERIVED,
 * never hardcoded: the badge disappears on its own the day the last real role
 * closes, so nobody has to remember to take it down.
 */
export const IS_HIRING = OPEN_ROLES.length > 0;

export function getJob(slug: string): JobOpening | undefined {
  return JOB_OPENINGS.find((job) => job.slug === slug);
}

// ── Company copy for the hub ─────────────────────────────────────────────────
// Short on purpose. The page argues in PHOTOGRAPHS now, not prose: the three
// story beats below are captions for real media, not paragraphs that happen to
// sit beside it. If a line here grows past two sentences, the page is drifting
// back toward the generic version Will rejected twice.

// ! WATCH THE WORD "BUILD". An earlier pass ran it through three of four
// headings plus the catch-all. Vary the verb before adding a heading.
export const CAREERS_INTRO = {
  eyebrow: "Careers",
  // Ruled plain and confident: the photography carries the hero, so the words
  // do not have to. It only works while the contact sheet is genuinely good.
  headline: "Join our team",
  subhead:
    "Partyreel gathers every photo and video from an event with one QR code. We are a small team that cares a great deal about how that feels.",
  cta: "See open roles",
};

export type StoryBeat = { eyebrow: string; title: string; body: string };

/**
 * THE ARGUMENT: the roll, the selects, the reel. This replaces the old
 * "why it matters" prose, which was the product pitch restated for the third
 * time on a page whose reader had already seen it twice. Each beat is a
 * caption for a real media composition; the media makes the point.
 *
 * ! THE HEADINGS MUST TELL THE STORY ON THEIR OWN, because people skim
 *   headings and read nothing else. Read alone they now run: join our team ->
 *   most of these photos are never seen again -> so we gather all of it in one
 *   place -> and turn the best of them into a film -> our core philosophy ->
 *   we're hiring. Problem, solution, payoff, values, ask.
 *
 * ! Two traps this fixes, both live-caught by Will. A bare "Most of it is never
 *   seen again." directly under a hiring headline read as though our new hires
 *   vanish, so the heading is now first-person and unmistakably about PHOTOS. And the beats open with "So" and "And" on purpose: the connective
 *   tissue is what turns three captions into one story instead of three
 *   unrelated statements with no context building between them.
 */
export const CAREERS_STORY: StoryBeat[] = [
  {
    eyebrow: "The problem",
    title: "We hated missing out on photos.",
    body: "A single event fills dozens of camera rolls. A handful of shots get shared around, and the rest quietly disappear. Fixing that is the whole job.",
  },
  {
    eyebrow: "The solution",
    title: "So we gather all of them in one place.",
    body: "One QR code, no app and no account. Every guest's photos land in the same album, and the host decides what stays.",
  },
  {
    eyebrow: "The highlights",
    title: "And turn the best of them into a film.",
    body: "The whole event, cut down to something worth sending. That is the surface we are hiring for.",
  },
];

export type WorkPrinciple = { title: string; body: string };

/**
 * Three, not four. "Media is the hero" was retired because this page now
 * DEMONSTRATES it rather than claiming it, which was the whole problem with
 * the values-list version. One sentence each; these are not paragraphs.
 */
export const HOW_WE_WORK: WorkPrinciple[] = [
  {
    title: "Craft is the product",
    body: "The distance between fine and delightful is a hundred small decisions, and we make them deliberately.",
  },
  {
    title: "It has to work at the party",
    body: "Borrowed phones, patchy venue wifi, guests who will never install anything. Real conditions are the spec.",
  },
  {
    title: "You own your surface",
    body: "One person carries an area from the first sketch to the thing people use. Context rather than instructions.",
  },
];
