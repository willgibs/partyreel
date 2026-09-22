/**
 * THE BIBLE (Will's ruling, "less is more", 2026-09-12; second edition after
 * his rule-by-rule review, 2026-09-14). The whole of Partyreel's design law:
 * twenty-two rules, hand-authored, ratified by Will, rendered on
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

export type BibleGroup =
  | "identity"
  | "type"
  | "shape"
  | "light"
  | "motion"
  | "surfaces"
  | "copy"
  | "rising tides";

export const BIBLE_GROUPS: BibleGroup[] = [
  "identity",
  "type",
  "shape",
  "light",
  "motion",
  "surfaces",
  "copy",
  "rising tides",
];

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
    id: "media-is-the-color",
    n: 1,
    group: "identity",
    statement:
      "Achromatic UI with one accent; the media is the color. Where there is no media, the accent carries state and UI color and marketing may carry color of its own (aurora, non-sampled spill): a section without a picture is still beautiful, never bare.",
    why: "The interface stays quiet so the pictures can carry the room, but quiet is not empty: a page is never forced to choose between having media and being boring. The ramp is Graphite with the accent off, and the Aurora carries the light where there is no picture.",
    enforcedBy: ["src/app/(marketing)/marketing-css-policy.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "one-token-set",
    n: 2,
    group: "identity",
    statement:
      "Marketing and app share one token set. Marketing may be louder in most things (type, motion, color, scale, density); only the tokens are shared by law.",
    why: "A visitor who becomes a host should feel no seam between the site and the product, but a marketing site that reads like the app reads bland.",
    enforcedBy: [
      "src/app/css-source-policy.test.ts",
      "src/app/globals-theme-contract.test.ts",
    ],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "lamps-are-light",
    n: 3,
    group: "identity",
    statement:
      "The five lamp hues are light, never UI: never a text, border, background, state or brand color.",
    why: "The identity stays achromatic and media-forward; the hues exist so the light in a room can carry color while the room does not.",
    enforcedBy: ["src/app/globals-theme-contract.test.ts"],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "guest-surface-is-the-host",
    n: 4,
    group: "identity",
    statement:
      "A guest surface belongs to the host's event: minimal Partyreel branding, the host's name first.",
    why: "Guests came for the event, not for us; the QR is the growth loop, and it works because the page feels like the host's. The capture is staged email for the guests who sign up (upload reminders, new-photo notifications), never the event page as a billboard.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "one-site-ladder",
    n: 5,
    group: "type",
    statement:
      "One heading face on one site ladder. Every heading sits on a step, and the steps keep their order at every width.",
    why: "One ladder makes the pages read as one site; a page that needs its own scale has not been designed yet. The law is the ladder's order, never a one-off size: ten steps in theme.css, each with its own leading and tracking, and a phone end on each step that keeps every heading above the one it heads.",
    enforcedBy: [
      "src/app/(marketing)/marketing-h1-policy.test.ts",
      "src/components/marketing/system/page-hero-contract.test.ts",
      "src/lib/type-ladder-policy.test.ts",
    ],
    ruledBy: "Will",
    ruledOn: "2026-08-29",
  },
  {
    id: "masthead-is-the-nav-label",
    n: 6,
    group: "type",
    statement:
      "A masthead is one or two words, and at the display step the h1 is the nav label the reader just clicked.",
    why: "A masthead is the loudest promise on the page, so it must be the word the reader chose; anything more specific goes in the eyebrow.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: "2026-08-29",
  },
  {
    id: "two-faces",
    n: 7,
    group: "type",
    statement:
      "Two faces, and only two: Inter for everything a person reads, Urbanist for what the page says loudly. There is no mono face in the product; data sits on the body face with tabular figures, and every label, hint and descriptor is the Caption atom.",
    why: "Mono is gone from the product: where it did semantic work, a number that is the subject takes the display face and a value that must look like a value takes a muted plate.",
    enforcedBy: ["src/app/two-faces-policy.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "tokens-never-literals",
    n: 8,
    group: "shape",
    statement:
      "Sharp surfaces, round actions. Tokens, never literals: surfaces take --radius, floating layers --radius-float, media tiles --radius-tile, every lamp --spill-cadence.",
    why: "One token each is what lets a round retune the whole product from one place; a literal is a value nobody can find later. The corners are family C in quarters (an 8px surface, a 12px floating layer with its rows at 8, a 4px photograph with the gallery gap pinned to it, a cta size for the 44px action), which keeps the pixel arithmetic clean.",
    enforcedBy: [
      "src/components/marketing/chrome/footer-contract.test.ts",
      "src/lib/type-ladder-policy.test.ts",
    ],
    ruledBy: "Will",
    ruledOn: RATIFIED,
    status: "ruled",
  },
  {
    id: "radius-plus-offset",
    n: 9,
    group: "shape",
    statement:
      "Anything drawn around an object takes the object's radius plus its offset.",
    why: "Nested corners that share a center read as one shape; a ring with a radius of its own reads as a mistake.",
    enforcedBy: ["src/components/dev/border-beam-vendor.test.ts"],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "depth-in-dark",
    n: 10,
    group: "light",
    statement:
      "In dark, depth is light first, and BOTH shadows are available: the layer under anything the page keeps living behind, the lift where one object really sits on another. A flat surface takes neither, in either mode.",
    why: "A shadow on a flat dark ground is a smudge, but two photographs on top of each other need an edge; step, ring, lift and float work together, which gives dark and the ink slab a ramp of their own.",
    enforcedBy: ["src/lib/elevation-policy.test.ts"],
    ruledBy: "Will",
    ruledOn: "2026-09-17",
    status: "ruled",
  },
  {
    id: "lamps-without-media",
    n: 11,
    group: "light",
    statement:
      "A lamp may light a section without media: the footer's seam is the model. The Aurora is the doctrine: one family, never on a light ground, composed for its place rather than repeated.",
    why: "A light with a source and a direction keeps a monochrome identity from growing a second palette, yet the lamp that emits from nothing (the footer's seam) is the one Will likes most, so the Aurora allows it and composes each light for its place.",
    enforcedBy: ["src/components/shared/glow-placement.test.ts"],
    ruledBy: "Will",
    ruledOn: "2026-09-17",
    status: "ruled",
  },
  {
    id: "animate-by-frequency",
    n: 12,
    group: "motion",
    statement:
      "Animate by frequency: high-frequency instant, occasional standard and under 300 ms, rare delightful. Custom easing and press feedback on every control; no default or linear ease on anything a person touches.",
    why: "Theater on a switch a host flips fifty times a night is friction; a first-time moment with no beat is a missed differentiator (the emil craft bar).",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: "2026-06-21",
  },
  {
    id: "visible-is-the-default",
    n: 13,
    group: "motion",
    statement:
      "The visible state is the default; the hidden state belongs to the trigger, never to the element at rest. Nothing gates an h1.",
    why: "An element that arrives hidden is invisible to anything that never fires its trigger: a throttled tab, a crawler, the LCP measurement, a reader who asked for less motion.",
    enforcedBy: [
      "src/app/(marketing)/marketing-h1-policy.test.ts",
      "src/components/marketing/system/page-hero-contract.test.ts",
    ],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "reduced-motion",
    n: 14,
    group: "motion",
    statement:
      "Every animation lives inside the reduced-motion preference block.",
    why: "A visitor who asked for less motion gets none, and the design still stands at rest because of rule 13.",
    enforcedBy: ["src/components/shared/glow-contract.test.ts"],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "floating-layer-contract",
    n: 15,
    group: "motion",
    statement:
      "Every floating surface rides the floating-layer contract: one corner derived from one token, an entrance chosen by how often the surface opens, and the layer shadow. No surface spells its own.",
    why: "Menus, dialogs, sheets and popovers are one family, and a stray one reads as a bug. The family is Card's anatomy, submenus at two levels and no more, the corner nested (the panel on the floating token, its rows 4px inside it), and entrances by frequency.",
    enforcedBy: ["src/components/ui/floating-layer.test.ts"],
    ruledBy: "Will",
    ruledOn: "2026-09-17",
    status: "ruled",
  },
  {
    id: "four-grounds",
    n: 16,
    group: "surfaces",
    statement:
      "Four grounds: cinema, the dark room every dark chapter sits on; paper, the light body; ink, the footer's darker leaf, never a page's chrome; and the muted panel, the set-apart block inside a paper body. A dark hero decides the route group, because the header's skin is chosen by the group's layout and no page can flip it from inside; a utility page runs cinema hero, paper body, ink footer.",
    why: "The rhythm every marketing page shares is what makes the site one site; the panel is the one thing allowed to break the strict light-dark alternation, and a page cannot fake dark chrome from the paper side.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "chapters-open-strong",
    n: 17,
    group: "surfaces",
    statement:
      "A marketing page is chapters: each opens strong and bespoke, then ramps down through supporting sections until the next opener.",
    why: "Visual attention is spent at the opener and earned back at the next; a page of equal-weight sections has no rhythm.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "every-frame-is-ours",
    n: 18,
    group: "surfaces",
    statement:
      "Every frame is ours: no stock photography on a marketing surface, and a page argues in photographs wherever it can.",
    why: "Saying \"here is a real event\" over someone else's photograph reads false. No stock and no shoot: every frame is generated for the slot it fills, in one look, inside one Higgsfield month; an image we use is one we hold the rights to, so nothing tracks them.",
    enforcedBy: ["src/lib/constants/marketing-media.test.ts"],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "no-em-dashes",
    n: 19,
    group: "copy",
    statement: "No em-dashes anywhere a person reads.",
    why: "It reads as an AI tell; recast with a comma, a colon, parentheses or two sentences.",
    enforcedBy: [
      "src/lib/no-em-dash-policy.test.ts",
      "src/lib/content-policy.test.ts",
    ],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "affirmative-only",
    n: 20,
    group: "copy",
    statement:
      "Say what we are, and name what a guest is spared: an absence a guest is wary of may be named (\"No app required.\"); a sentence shaped as a denial of someone else (\"we're not cloud storage\") may not. Never promise \"no account\": a host may require one. The two fences that are product truth stand (no human-response or human-moderation promise, no automation absolutes).",
    why: "This is about who we are, not who we are not: a fenced use case is a host we told to leave, and a rule of don'ts with no do's is messy. A real benefit may be named (\"No app required.\"); defining the product by what it is not (\"we're not cloud storage\") may not, and since many events require an account, \"no account\" is never promised.",
    enforcedBy: ["src/lib/content-policy.test.ts"],
    ruledBy: "Will",
    ruledOn: REVIEWED,
    status: "ruled",
  },
  {
    id: "copy-is-open",
    n: 21,
    group: "copy",
    statement:
      "Copy is open. Every heading, thesis and line may be rewritten by the round that touches its section; the voice is built one won line at a time, in its real place, and no copy is pinned by a test.",
    why: "All copy is unprotected: the voice is won one line at a time, judged in its real place. marketing-voice.ts is the one home for the lines that ship, and no copy is pinned by a test.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
  {
    id: "rising-tides",
    n: 22,
    group: "rising tides",
    statement:
      "Rising tides. Nothing is protected: judge every section, component, flow and line from the ground up, asking what the perfect version would be if it did not exist yet, then build that: elevate what already points there, rework what does not, and raise the global system as you go.",
    why: "No round can know the finished bar in advance, so the program is an iterative flow that keeps raising it. A page with a weak layout is torn down and rebuilt rather than pushed a little further, and big swings that can be reverted beat small cautious steps; but always reworking loses what we like and always polishing makes no progress, so the call is the agent's, each time, from the ground up, and it may push past today's systems, components and rules to set a new peak.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: REVIEWED,
  },
];

export const BIBLE_GROUP_LABEL: Record<BibleGroup, string> = {
  identity: "Identity",
  type: "Type",
  shape: "Shape and tokens",
  light: "Light and depth",
  motion: "Motion",
  surfaces: "Surfaces",
  copy: "Copy",
  "rising tides": "Rising tides",
};
