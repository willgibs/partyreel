// Single source for the careers hub + role pages. `location`/`offer` are OPTIONAL so
// only a role that opts in shows a remote-policy / perks framing — the hub and the
// General Application stay mission-focused (no perk/comp/remote claims). The Reels
// Engineer is the one fully-specified, realistic listing (a placeholder to refine
// pre-launch). `responsibilities`/`requirements` are rendered only when non-empty, so
// the open-ended General Application doesn't show empty sections.

export type JobOpening = {
  slug: string;
  title: string;
  team: string;
  type: string;
  /** A stated location/remote policy — set ONLY for roles that have one. */
  location?: string;
  /** One-liner for the roles list. */
  hook: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  /** "What we offer" — set ONLY for roles that opt into a perks/comp framing. */
  offer?: string[];
};

const reelsEngineer: JobOpening = {
  slug: "reels-engineer",
  title: "Reels Engineer",
  team: "Engineering",
  type: "Full-time",
  location: "Remote",
  hook: "Own the highlight reel: the moment every event has been building toward.",
  summary:
    "The highlight reel is Partyreel's namesake and its emotional payoff: when an event winds down, the album becomes one short, shareable video. The engine behind it is live today: 14 canvas-drawn styles, one draw function powering both the in-browser player and the on-device mp4 export, every render free on the host's own device. We're looking for the person to own this engine end to end and push it further.",
  responsibilities: [
    "Own the canvas reel engine: 14 styles (8 media-first moods and 6 designed treatments), all Canvas2D compositions driven by one shared draw function.",
    "Guard the WYSIWYG invariant: that same draw function powers the live player and the WebCodecs mp4 export, so the pixels a host previews are exactly the pixels they download.",
    "Design and ship new styles: layout systems, easing, grading, and typography in motion that flatter whatever mix of media a real event produces.",
    "Keep compositions deterministic: seeded layouts that reproduce exactly, so the same reel renders the same on any device.",
    "Push the on-device export: encoding budgets, codec and browser quirks, frame-accurate progress, and renders that stay fast and free on a mid-range phone.",
    "Shape the reel experience end to end, from the host's studio (moments, style, cover, length) to the guest reveal on the album page, where every guest can watch and download it.",
  ],
  requirements: [
    "Real experience with graphics in the browser: Canvas2D or WebGL compositing, animation timing, color, and type in motion.",
    "Comfort on the encoding side: WebCodecs, muxing, H.264 realities, bitrate budgets, and cross-browser capability differences.",
    "A motion designer's taste with an engineer's discipline: you can make 30 seconds feel cinematic and prove it stays smooth off the main thread's budget.",
    "A bias for owning a surface end to end, from the draw call to the download button.",
    "Bonus: color grading, easing systems, or performance profiling on mobile devices.",
  ],
  offer: [
    "Remote-friendly",
    "Meaningful early-stage equity",
    "Competitive compensation",
    "Lead a core part of the product",
  ],
};

const generalApplication: JobOpening = {
  slug: "general",
  title: "General Application",
  team: "Any team",
  type: "Open",
  hook: "Don't see your role? Tell us what you'd love to build.",
  summary:
    "We're always glad to meet people who care about this kind of work. If nothing above fits but you think you'd be a great addition, tell us what you'd want to own, and why Partyreel.",
  responsibilities: [],
  requirements: [
    "A track record of building things you're proud of.",
    "Comfort owning ambiguity in a small, early-stage team.",
    "You care about the details people feel but never consciously notice.",
  ],
};

// Reels Engineer first (featured); General Application last (catch-all).
export const JOB_OPENINGS: JobOpening[] = [reelsEngineer, generalApplication];

export const JOB_SLUGS = JOB_OPENINGS.map((job) => job.slug);

export function getJob(slug: string): JobOpening | undefined {
  return JOB_OPENINGS.find((job) => job.slug === slug);
}

// ── Company copy for the hub (mission-focused; culture, not perks) ──────────────

export const CAREERS_INTRO = {
  eyebrow: "Careers",
  headline: "Help people keep the moments that matter",
  subhead:
    "Every event overflows with photos and videos that never make it off everyone's phones. We're fixing that: one QR code, one shared album, one highlight reel. Come build it with us.",
};

export const CAREERS_MISSION = {
  heading: "A small team, an outsized problem",
  paragraphs: [
    "The best photos from any event are the candid ones your friends take, and they're exactly the ones that scatter across a dozen camera rolls and disappear. Partyreel gathers all of it in one place, lets the host curate, and turns the best moments into a reel worth keeping.",
    "No app, no account, no friction. We're early, we move fast, and we care more about craft than almost anything. If that sounds like your kind of work, we'd love to hear from you.",
  ],
};

export type WorkPrinciple = { title: string; body: string };

export const HOW_WE_WORK: WorkPrinciple[] = [
  {
    title: "Craft is the product",
    body: "In a world where everything is good enough, taste is the moat. We sweat the details no one will consciously notice, because in aggregate they're what people feel.",
  },
  {
    title: "Media is the hero",
    body: "The interface gets out of the way so the photos and videos shine. Restraint is a feature; the work is making the product disappear.",
  },
  {
    title: "Ship, then sharpen",
    body: "Small team, fast loops. We get something real in front of people, learn, and make it great, rather than polishing in the dark.",
  },
  {
    title: "Low ego, high trust",
    body: "You own your area. We give context, not instructions, and assume the best of each other.",
  },
];
