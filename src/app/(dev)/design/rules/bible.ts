/**
 * THE BIBLE (Will's ruling, "less is more", 2026-09-12; second edition after
 * his rule-by-rule review, 2026-09-14). The whole of Partyreel's design law:
 * ten rules, hand-authored, ratified by Will, rendered on
 * /design/rules. A component's functional contract lives on the component (a
 * test tagged `@contract-for`); everything else on the site is precedent an
 * agent may break in a better exploration.
 *
 * The criterion for a line here: true on a page that does not exist yet, and
 * breaking it would make Partyreel look like a different product. Anything
 * about one page, one component's internals, a CSS gotcha or an engineering
 * invariant fails that test and is not a design rule.
 *
 * `enforcedBy` is honest: the tests that check some of the rule, or "review"
 * when the rule is doctrine held at review. `status` is where a rule stands
 * after a review: absent means ruled; "under exploration: <board>" means a lab
 * board is writing what the rule inherits (its values, its doctrine) and the
 * statement is the interim law; "retiring: <track>" means the rule leaves the
 * bible when that track lands. A change to this file is a ruling of Will's,
 * never an agent's; bible.test.ts keeps it well-formed.
 */

export type BibleGroup = "rising tides" | "experience" | "identity" | "copy";

export const BIBLE_GROUPS: BibleGroup[] = ["rising tides", "experience", "identity", "copy"];

/** Where a rule stands after a review. Absent reads as "ruled". */
export type BibleStatus =
  | "ruled"
  | "retired"
  | `under exploration: ${string}`
  | `retiring: ${string}`;

export type BibleRule = {
  /** A stable slug; the row's anchor on /design/rules. */
  id: string;
  n: number;
  group: BibleGroup;
  /** The rule, one or two sentences, the way it is said aloud. */
  statement: string;
  /** Why it is law, one sentence, with the original ruling where there was one. */
  why: string;
  /** Repo-relative test paths that check some of it, or "review". */
  enforcedBy: string[] | "review";
  ruledBy: "Will";
  /** ISO date: ratified at the reset, or the original ruling where it was later. */
  ruledOn: string;
  /** After a review: which board or track the rule inherits from, or that it is leaving. */
  status?: BibleStatus;
};

const RATIFIED = "2026-09-12";
const REVIEWED = "2026-09-14";

export const BIBLE: BibleRule[] = [
  {
    id: "rising-tides",
    n: 1,
    group: "rising tides",
    statement:
      "Rising tides: the goal is always the whole platform, never only the task at hand, and nothing is protected or finished. Judge every section, component, flow and line from the ground up, ask what the perfect version would be, build that, and send the improvements you see in the systems around your task to the Lab, the risk-free road to better ideas.",
    why: "Will (2026-09-24): \"A rising tide lifts all boats ... Not a single aspect of Partyreel is perfect; consider the current state of everything as progress, not end goals.\" No round can know the finished bar in advance, so the program is an iterative flow that keeps raising it, and relitigating a settled decision for a better answer is welcome. A page with a weak layout is torn down and rebuilt rather than pushed a little further, and big swings that can be reverted beat small cautious steps; but always reworking loses what we like and always polishing makes no progress, so the call is the agent's, each time, from the ground up, and it may push past today's systems, components and rules to set a new peak.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "elegant-simplicity",
    n: 2,
    group: "rising tides",
    statement:
      "Elegance wins: between otherwise equal options, the simpler one with less risk surface wins, and every addition, a rule included, must earn its place.",
    why: "Will (2026-09-24): \"For otherwise equal systems, elegant simplicity with less risk surface area tends to win over complexity that adds no value.\" Asked whether twenty-five rules beat a good ten, he ruled ten: every added part is one more thing to maintain, secure and explain, and every added line dilutes the rest.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: "2026-09-24",
  },
  {
    id: "dont-make-me-think",
    n: 3,
    group: "experience",
    statement:
      "Don't make me think: every flow streamlines its friction away, a problem arrives with an actionable fix or help, anything unclear carries a tooltip or points to help, and nothing is a dead end.",
    why: "Will (2026-09-24): flows are roads; features that point to each other are intersections; the end of a flow returns smoothly, like a cul-de-sac, rather than stopping at \"done\"; smaller features ride on-ramps nested under bigger ones, so the product feels feature-rich without crowding and every flow stays clean and focused. \"We win with intuitive flows designed to be beautiful and engaging.\"",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: "2026-09-24",
  },
  {
    id: "premium-is-the-floor",
    n: 4,
    group: "experience",
    statement:
      "Premium is the floor: the app should feel like magic, the way Apple's platforms do, with every feature beautiful in itself, motion that shows state or earns attention, transitions that connect one flow to the next, and interactions that answer instantly, can be interrupted and never err.",
    why: "Will (2026-09-24): \"Features feel beautiful within themselves, inspiring more usage. Motion visualizes state or gets user attention, occasionally surprising with delights that sell the whole experience. Fluid transitions help connect flows and make the user experience feel seamless. Interruptibility offers instant feedback for fast-paced usage while remaining error-free.\" How often each motion runs (instant, standard, delightful) is rule 5's.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: "2026-09-24",
  },
  {
    id: "animate-by-frequency",
    n: 5,
    group: "experience",
    statement:
      "Motion by frequency: what happens constantly is instant, what happens occasionally is quick and under 300 ms, and what happens rarely may delight; the visible state is the default at rest, and every animation honors reduced motion.",
    why: "Theater on a switch a host flips fifty times a night is friction, and a first-time moment with no beat is a missed differentiator. An element that arrives hidden is invisible to anything that never fires its trigger (a throttled tab, a crawler, a reader who asked for less motion), so the design stands at rest.",
    enforcedBy: ["src/app/(marketing)/marketing-h1-policy.test.ts", "src/components/marketing/system/page-hero-contract.test.ts", "src/components/shared/glow-contract.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "media-is-the-color",
    n: 6,
    group: "identity",
    statement:
      "The media is the color: an achromatic interface with one accent, where color comes from the photographs and from light (the lamps and the Aurora), never from UI paint.",
    why: "The interface stays quiet so the pictures can carry the room, but quiet is not empty: where there is no photograph, light carries color with a source and a direction, and in dark, depth is light first. The lamp hues are light, never a text, border, background or brand color.",
    enforcedBy: ["src/app/(marketing)/marketing-css-policy.test.ts", "src/app/globals-theme-contract.test.ts", "src/lib/elevation-policy.test.ts", "src/components/shared/glow-placement.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "guest-surface-is-the-host",
    n: 7,
    group: "identity",
    statement:
      "A guest surface belongs to the host's event: minimal Partyreel branding, the host's name first.",
    why: "Guests came for the event, not for us; the QR is the growth loop, and it works because the page feels like the host's. The capture is staged email for the guests who sign up (upload reminders, new-photo notifications), never the event page as a billboard.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "one-token-set",
    n: 8,
    group: "identity",
    statement:
      "One system: marketing and the app share one token set, one type ladder and two faces (Inter to read, Urbanist to be loud); tokens, never literals, and marketing may be louder, never different.",
    why: "A visitor who becomes a host should feel no seam between the site and the product. One token each lets a round retune the whole product from one place, and one ladder makes the pages read as one site; the details (radii, elevation, the floating-layer family, the masthead) live in the Library's tokens and components, where they can be seen.",
    enforcedBy: ["src/app/css-source-policy.test.ts", "src/app/globals-theme-contract.test.ts", "src/app/(marketing)/marketing-h1-policy.test.ts", "src/components/marketing/system/page-hero-contract.test.ts", "src/lib/type-ladder-policy.test.ts", "src/app/two-faces-policy.test.ts", "src/components/marketing/chrome/footer-contract.test.ts", "src/components/dev/border-beam-vendor.test.ts", "src/components/ui/floating-layer.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "every-frame-is-ours",
    n: 9,
    group: "identity",
    statement:
      "Every frame is ours: a page argues in real photographs made for the slot they fill, never stock, and each marketing chapter opens strong before it ramps down.",
    why: "Saying \"here is a real event\" over someone else's photograph reads false, and a page of equal-weight sections has no rhythm. The grounds each chapter sits on are the Library's.",
    enforcedBy: ["src/lib/constants/marketing-media.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "affirmative-only",
    n: 10,
    group: "copy",
    statement:
      "Say what we are: name what a guest is spared, never define us by denying someone else, never promise \"no account\", write no em-dashes, and treat every line as open to a better one.",
    why: "This is about who we are, not who we are not: a real benefit may be named (\"No app required.\"), and since many events require an account, \"no account\" is never promised. An em-dash reads as an AI tell. The voice is won one line at a time in its real place; marketing-voice.ts is the one home for the lines that ship, and no copy is pinned by a test.",
    enforcedBy: ["src/lib/no-em-dash-policy.test.ts", "src/lib/content-policy.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
];

export const BIBLE_GROUP_LABEL: Record<BibleGroup, string> = {
  "rising tides": "Rising tides",
  experience: "Experience",
  identity: "Identity",
  copy: "Copy",
};
