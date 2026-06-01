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
    "The highlight reel is Partyreel's namesake and its emotional payoff: when the night winds down, we stitch the best moments into a short, shareable, downloadable video, automatically. We're building v1 now, and we're looking for the person to own this area end to end and make it sing.",
  responsibilities: [
    "Design and build the pipeline that turns an event's clips into a finished reel: transcode, trim, compose, render, and generate a poster frame.",
    "Own the rendering architecture on an external worker (not Vercel), and help make the call between a managed video API and self-hosted ffmpeg on Cloudflare Containers.",
    "Develop the clip-selection logic that picks the moments worth keeping: heuristics now, smarter later.",
    "Keep reels fast, reliable, and beautiful at event scale, with an eye on unit economics.",
    "Shape the host experience around the reel: choosing clips, previewing, sharing, and downloading.",
  ],
  requirements: [
    "Real media/video engineering experience: ffmpeg, transcoding, encoding formats, A/V sync.",
    "Comfort owning a system end to end: queues and workers, object storage (S3/R2), and the tradeoffs of managed vs. self-hosted rendering.",
    "A bias for shipping a great v1 and iterating, pragmatic about scope and cost.",
    "Bonus: ML or heuristics for highlight detection; experience with Cloudflare Containers or serverless video.",
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
