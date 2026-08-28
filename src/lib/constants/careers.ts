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
  team: string;
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
  team: "Any team",
  type: "Always open",
  hook: "Don't see your role? Tell us what you'd love to build.",
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
// General and short, on purpose. The hub's job is context plus the listings;
// the description lives on the role page.

export const CAREERS_INTRO = {
  eyebrow: "Careers",
  headline: "Come build the album every event deserves.",
  subhead:
    "Partyreel gathers every photo and video from an event with one QR code, then hands it back as something worth keeping. We are a small team that cares a great deal about how that feels.",
  cta: "See open roles",
};

export const CAREERS_MISSION = {
  heading: "A small team, an outsized problem",
  paragraphs: [
    "The best photos from any event are the candid ones your friends take, and they are exactly the ones that scatter across a dozen camera rolls and disappear. Partyreel gathers all of it in one place, lets the host decide what stays, and turns the best of it into a reel worth keeping.",
    "No app, no account, no friction. We move fast, we keep the surface small, and we care more about craft than almost anything. If that sounds like your kind of work, we would love to hear from you.",
  ],
};

export type WorkPrinciple = { title: string; body: string };

export const HOW_WE_WORK: WorkPrinciple[] = [
  {
    title: "Craft is the product",
    body: "The distance between fine and delightful is a hundred small decisions. We make them deliberately, and we make them again when we get them wrong.",
  },
  {
    title: "Media is the hero",
    body: "The interface gets out of the way so the photos and videos shine. Restraint is a feature, and the work is making the product disappear.",
  },
  {
    title: "It has to work at the party",
    body: "Borrowed phones, patchy venue wifi, guests who will never install anything. Real conditions are the spec, not the edge case.",
  },
  {
    title: "You own your surface",
    body: "One person carries an area from the first sketch to the thing people use. We give context rather than instructions, and we assume the best of each other.",
  },
];
