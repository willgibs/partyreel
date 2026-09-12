/**
 * THE BIBLE (Will's ruling, "less is more", 2026-09-12). The whole of
 * Partyreel's design law: twenty-two rules, hand-authored, ratified by Will,
 * rendered on /design/rules. A component's functional contract lives on the
 * component (a test tagged `@contract-for`); everything else on the site is
 * precedent an agent may break in a better exploration.
 *
 * The criterion for a line here: true on a page that does not exist yet, and
 * breaking it would make Partyreel look like a different product. Anything
 * about one page, one component's internals, a CSS gotcha or an engineering
 * invariant fails that test and is not a design rule.
 *
 * `enforcedBy` is honest: the tests that check some of the rule, or "review"
 * when the rule is doctrine held at review. A change to this file is a ruling
 * of Will's, never an agent's; bible.test.ts keeps it well-formed.
 */

export type BibleGroup =
  | "identity"
  | "type"
  | "shape"
  | "light"
  | "motion"
  | "surfaces"
  | "copy"
  | "the bar";

export const BIBLE_GROUPS: BibleGroup[] = [
  "identity",
  "type",
  "shape",
  "light",
  "motion",
  "surfaces",
  "copy",
  "the bar",
];

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
};

const RATIFIED = "2026-09-12";

export const BIBLE: BibleRule[] = [
  {
    id: "media-is-the-color",
    n: 1,
    group: "identity",
    statement:
      "Grayscale UI with one accent; the media is the color. The guest's photographs are the loudest thing on every surface.",
    why: "The interface stays quiet so the pictures can carry the room; a colored control competes with the thing people came to see.",
    enforcedBy: ["src/app/(marketing)/marketing-css-policy.test.ts"],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "one-token-set",
    n: 2,
    group: "identity",
    statement:
      "Marketing and app share one token set. Marketing may be louder only in type and motion.",
    why: "A visitor who becomes a host should feel no seam between the site and the product.",
    enforcedBy: [
      "src/app/css-source-policy.test.ts",
      "src/app/globals-theme-contract.test.ts",
    ],
    ruledBy: "Will",
    ruledOn: RATIFIED,
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
    why: "Guests came for the event, not for us; the QR is the growth loop, and it works because the page feels like the host's.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "one-site-ladder",
    n: 5,
    group: "type",
    statement:
      "One heading face on one site ladder. Every h1 sits on the ladder, never on a ramp of its own.",
    why: "Will, 2026-08-29: normalize the site ladder so the pages read as one site; a page that needs its own scale has not been designed yet.",
    enforcedBy: [
      "src/app/(marketing)/marketing-h1-policy.test.ts",
      "src/components/marketing/system/page-hero-contract.test.ts",
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
    id: "mono-holds-data",
    n: 7,
    group: "type",
    statement:
      "Mono holds data: numerals, codes, keys. Every label, hint and descriptor is the Caption atom.",
    why: "Mono reads as machine output; when a label wears it the whole surface starts to look like a terminal (the R6 ruling; the MonoCaption sweep, 2026-09-11).",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "tokens-never-literals",
    n: 8,
    group: "shape",
    statement:
      "Sharp surfaces, round actions. Tokens, never literals: surfaces take --radius, floating layers --radius-float, media tiles --radius-tile, every lamp --spill-cadence.",
    why: "One token each is what lets a round retune the whole product from one place; a literal is a value nobody can find later. The rounding round retunes the values, never the law.",
    enforcedBy: ["src/components/marketing/chrome/footer-contract.test.ts"],
    ruledBy: "Will",
    ruledOn: RATIFIED,
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
    id: "dark-has-no-shadows",
    n: 10,
    group: "light",
    statement:
      "Dark has no shadows. Light is the depth cue, and it comes from under or behind the object.",
    why: "A shadow on a dark ground is a smudge; a lit edge is depth. The one underlight mechanic keeps every lamp honest about where it hangs.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "light-has-a-source",
    n: 11,
    group: "light",
    statement:
      "Light has a source and a direction: a lamp that cannot name what emits it is decoration and does not ship.",
    why: "The spill doctrine's first two laws and its anti-sprawl mechanism: decorative glow on edges, cards and borders is how a monochrome identity quietly grows a second palette.",
    enforcedBy: ["src/components/shared/glow-placement.test.ts"],
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "animate-by-frequency",
    n: 12,
    group: "motion",
    statement:
      "Animate by frequency: high-frequency instant, occasional standard and under 300 ms, rare delightful. Custom easing and press feedback on every control; no default or linear ease on anything a person touches.",
    why: "Theater on a switch a host flips fifty times a night is friction; a first-time moment with no beat is a missed differentiator (the emil craft bar; Will, 2026-06-21).",
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
      "Every floating surface rides the floating-layer contract: one radius, one entrance, one light.",
    why: "Menus, dialogs, sheets and popovers are one family, and a stray one reads as a bug (named 2026-08-28, when the nav turned out to be the one menu outside it).",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "three-grounds",
    n: 16,
    group: "surfaces",
    statement:
      "Three grounds: cinema, paper and ink. A dark hero decides the route group; a utility page runs cinema hero, paper body, ink footer.",
    why: "Will, 2026-08-28: the rhythm every marketing page shares is what makes the site one site; a dark chapter dropped into a paper body breaks it.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: "2026-08-28",
  },
  {
    id: "chapters-open-strong",
    n: 17,
    group: "surfaces",
    statement:
      "A marketing page is chapters: each opens strong and bespoke, then ramps down through supporting sections until the next opener.",
    why: "Will's pacing principle: visual attention is spent at the opener and earned back at the next; a page of equal-weight sections has no rhythm.",
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
    why: "Will pulled the two stock event photos from the first press cut: it feels weird to say here is a real event and show someone else's.",
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
      "Affirmative only: never say what the product is not for; promise no human response, no human moderation, no automation absolutes; night is not identity language.",
    why: "Will, 2026-08-28: this is about who we are, not who we are not; a fenced use case is a host we told to leave.",
    enforcedBy: ["src/lib/content-policy.test.ts"],
    ruledBy: "Will",
    ruledOn: "2026-08-28",
  },
  {
    id: "ruled-copy",
    n: 21,
    group: "copy",
    statement:
      "The thesis line and the primary CTA are ruled copy: a change is a ruling, never drift.",
    why: "Since 2026-09-12 no copy is pinned by a test; marketing-voice.ts is the one home, and its notes say which lines are provisional.",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: RATIFIED,
  },
  {
    id: "feels-like-magic",
    n: 22,
    group: "the bar",
    statement:
      "Feels like magic: every UI round proposes one delight, and every marketing page closes at the would-this-hold-up-next-to-the-homepage screenshot gate.",
    why: "Beauty is leverage and the unseen details compound; the gate is what keeps polish spread across surfaces rather than piled on two pages (rising tides; Will, 2026-08-27).",
    enforcedBy: "review",
    ruledBy: "Will",
    ruledOn: RATIFIED,
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
  "the bar": "The bar",
};
