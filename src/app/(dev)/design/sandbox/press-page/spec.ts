import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT PARTYREEL HANDS THE WORLD, ROUND ONE (the press-page track, cut 2026-09-19).
 *
 * Will's stacking steer (2026-09-19): "/press" is one of the
 * surfaces he named while deployments were capped, and "absolutely everything is up
 * for relitigation or reconcepting from the ground up." A board that keeps nothing is
 * deleted at no cost.
 *
 * Seven decisions, every option drawn on the real page pieces (PageHero, PressSection,
 * PressSheet, the copy buttons, the fact rows) rather than argued in prose: who the
 * page is for, what the asset sheet shows, how the words are handed over, how checkable
 * the facts are, whether anyone is named, how the page closes, and how it all reads top
 * to bottom. `the-close` waits on `a-human` (the close's copy names whoever that decides
 * to name); `the-arc` waits on `who-for` landing on one page (a different structure asks
 * its own arc question later). The other four are independent.
 *
 * Not in this round: any production byte; the kit's files under public/press/ and its
 * build script; the killed sitewide "media kit" (an unrelated project); brand-guidelines
 * plates (clear space, minimum size, misuse), cut from the page by the 2026-08-28 ruling
 * and not reopened here.
 *
 * ★ THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21) TOUCHES TWO OF SEVEN.
 * `the-sheet`'s `brand-in-use` gains a second addendum, the app's own
 * printed stock (`lib/qr/stock.ts`, first-event r1): real table cards, a
 * sign, a poster, at real millimetre sizes, not a hypothetical "real
 * screen" alone. `the-arc` names pricing-page's own re-cut chapter order
 * (overview, then the table, then the questions, r2) as the precedent its
 * recommendation now stands on. Neither recommendation changed; `who-for`,
 * `the-words`, `the-facts`, `a-human` and `the-close` stand: no badge named
 * them.
 */
export const PRESS_PAGE = defineExploration({
  id: "press-page",
  title: "What Partyreel hands the world",
  round: {
    n: 1,
    date: "2026-09-21",
    changed:
      "The overtaken audit's reshape touches two of seven: the-sheet's brand-in-use now holds the app's own printed stock too (first-event r1, real objects at real mm); the-arc names pricing-page's own re-cut order (r2) as this one's precedent. The other five stand unbadged.",
  },
  context:
    "Will's stacking steer (2026-09-19): /press is unprotected, open to relitigate from the ground up. Seven decisions on PageHero, PressSection, PressSheet and the copy buttons. Not in this round: any production byte, the kit's build script, or the killed sitewide media kit.",
  asks: [
    /* ── 1. Who the page is for ─────────────────────────────────────────── */
    {
      id: "who-for",
      label: "Who the page is for",
      question: "Who should /press be built for?",
      context:
        "One page serves a reporter, a partner and a curious guest alike today: one masthead, one kit, one line. The ROADMAP notes /press \"grows into the partnerships kit\"; /contact already has a Press topic but no Partnerships one.",
      options: [
        {
          id: "one-page",
          label: "One page, as today",
          means:
            "A reporter and a partner share one kit, one set of facts, and one contact line; nothing forks.",
        },
        {
          id: "two-doors",
          label: "Press and partners, two doors",
          means:
            "The masthead splits in two, each its own promise, its own contact, and eventually its own kit.",
        },
        {
          id: "folded-into-about",
          label: "Folded into About",
          means:
            "Press becomes a short kit at the foot of /about; the standalone page and its nav row retire.",
        },
      ],
      recommended: "one-page",
      because:
        "A partnerships promise does not exist yet to put behind its own door, and About's mission story is a different reader's page; one sharp page beats forking one thin page in two.",
      overrule:
        "If partnerships is close enough to commit real copy and its own contact this round, the two doors.",
      lands: "The /press route itself: one page, a new /partners door, or a retired route.",
    },

    /* ── 2. What the asset sheet shows ──────────────────────────────────── */
    {
      id: "the-sheet",
      label: "What the sheet shows",
      question: "What should the asset sheet show?",
      context:
        "PressSheet draws eight plates: two marks, the icon, the share card, a QR, ink, type. Every mark is the retired Aperture glyph, a stand-in for the v1 icon. The app prints its own stock now (first-event r1): table cards, a sign, a poster.",
      options: [
        {
          id: "eight-plates",
          label: "Eight plates, as today",
          means: "Marks, icon, share card, QR, ink, and type, unchanged.",
        },
        {
          id: "marks-only",
          label: "The marks alone",
          means:
            "Just the mark and the icon plate ship now; the rest waits for the v1 icon.",
        },
        {
          id: "brand-in-use",
          label: "The brand in use",
          means:
            "The same eight plates, plus the mark over a real guest album and on the app's own printed stock (table cards, a sign, a poster): two addenda now.",
        },
      ],
      recommended: "eight-plates",
      because:
        "The placeholder marks are a delivery gap, not a design one; pulling plates now fixes the wrong problem and leaves the sheet thinner until the icon lands anyway.",
      overrule:
        "If a half-finished sheet undersells the kit more than a full one, marks-only; brand-in-use is fullest now, holding real print objects too.",
      lands: "press-sheet.tsx's Frame list; PRESS_KIT's shape stays whatever wins.",
    },

    /* ── 3. How the words are handed over ───────────────────────────────── */
    {
      id: "the-words",
      label: "How the words hand over",
      question: "How should the words be handed over?",
      context:
        "Words holds one paragraph and one one-liner today, each behind a copy button, plus two quick hits on quoting and naming. PRESS_BOILERPLATE also feeds /llms.txt, so whatever wins here is the one account of what Partyreel is.",
      options: [
        {
          id: "paragraph-and-line",
          label: "A paragraph and a line, as today",
          means: "One blockquote, one one-liner, both copyable, unchanged.",
        },
        {
          id: "three-lengths",
          label: "Three lengths",
          means:
            "A sentence for a caption, the paragraph for a story, a longer account for a feature, each its own copy button.",
        },
        {
          id: "founder-voice",
          label: "A written voice, attributed",
          means: "The same two lengths, plus one first-person line signed with a name.",
        },
      ],
      recommended: "paragraph-and-line",
      because:
        "A sentence and a paragraph already cover a caption and a story; a third length is real writing nobody has asked for, and a signed line reopens the zero-team rule for a page that reads fine without a face.",
      overrule:
        "If a longer written account would save a partner or a feature real work, the three lengths.",
      lands: "constants/press.ts's boilerplate family and the Words section's copy blocks.",
    },

    /* ── 4. How checkable the facts are ─────────────────────────────────── */
    {
      id: "the-facts",
      label: "How checkable the facts are",
      question: "How checkable should the fact sheet be?",
      context:
        "PRESS_FACTS renders twelve rows, prices from tiers.ts. It already feeds /llms.txt and /llms-full.txt with no link from the page. The reel round retells two rows in place, \"Hosts get\" and \"Not this\" (press.ts:61, :80).",
      options: [
        {
          id: "rendered-rows",
          label: "Rendered rows only, as today",
          means: "Twelve rows, human-read, unchanged.",
        },
        {
          id: "rows-plus-url",
          label: "Rows, plus a linked copy for a script",
          means: "The same rows, with a small link to the llms-full.txt table beside them.",
        },
        {
          id: "stat-strip",
          label: "A stat strip in the masthead",
          means: "Three or four headline facts move into the hero; the full sheet stays below.",
        },
      ],
      recommended: "rows-plus-url",
      because:
        "The machine-readable file already exists and is fed by this exact array, so pointing at it costs one link and hands a copy desk's tooling the same table a person reads.",
      overrule: "If the hero should argue in facts before anything else, the stat strip.",
      lands: "The fact-sheet PressSection's aside, beside How it works.",
    },

    /* ── 5. Whether anyone is named ──────────────────────────────────────── */
    {
      id: "a-human",
      label: "Whether anyone is named",
      question: "Should anyone be named on the page?",
      context:
        "The fact sheet reads help@partyreel.com today, the sitewide zero-team rule's default. No spokesperson appears anywhere on /press; the retired press-identity round's reasoning survives only as a code comment pointing at a deleted doc.",
      options: [
        {
          id: "role-only",
          label: "A role address only, as today",
          means: "help@partyreel.com on the fact sheet; no name anywhere.",
        },
        {
          id: "named-contact",
          label: "One named press contact",
          means:
            "A real name sits beside the role, no biography, the way a masthead lists an editor.",
        },
        {
          id: "founder-card",
          label: "A founder card",
          means:
            "A small card names someone with a title and a line, reopening the rule /about already relaxes once.",
        },
      ],
      recommended: "role-only",
      because:
        "The zero-team rule holds sitewide with one relaxation already spent on /about's origin story; a role address is also the one contact a small team can always answer, whoever is on call.",
      overrule: "If reporters keep asking who to actually write to, the named contact, short of a full card.",
      lands: "PRESS_FACTS's Press contact row, and whether a name joins it.",
    },

    /* ── 6. How the page closes (waits on a-human: the close names whoever that names) ── */
    {
      id: "the-close",
      label: "How the page closes",
      question: "How should the page close?",
      context:
        "The close today is a centred block, a heading, a line, and a button to /contact with no topic picked; the masthead's own subhead also carries a plain mailto. /contact's topic list already has a Press chip, unused by either.",
      options: [
        {
          id: "as-today",
          label: "A plain link to /contact, as today",
          means: "One button, no topic carried, unchanged.",
        },
        {
          id: "contact-door",
          label: "The same door, Press pre-picked",
          means:
            "The button hands /contact its own Press chip already chosen, the way a help article's link already does for its topic.",
        },
        {
          id: "inline-form",
          label: "A short form, inline",
          means: "A note and a way to reply sit right here; the page never hands the reader off.",
        },
      ],
      recommended: "contact-door",
      because:
        "The chip already exists and the handoff pattern already exists for help articles; pre-picking Press is a small, honest extension of both rather than a new mechanism.",
      overrule:
        "If a page hop costs more than this button is pressed to be worth routing at all, the plain link stays right.",
      lands: "The close section's href in page.tsx, and a query param /contact would need to read it.",
      after: { ask: "a-human" },
    },

    /* ── 7. How it all reads, top to bottom (waits on who-for landing on one page) ── */
    {
      id: "the-arc",
      label: "How the page reads",
      question: "How should the page read, top to bottom?",
      context:
        "Today: masthead, then Assets, Words, the Fact sheet, then the close. pricing-page has since proven the same arc: overview first, the detail table next, the questions last (pricing-page r2).",
      options: [
        {
          id: "today-order",
          label: "Masthead, assets, words, facts, close, as today",
          means: "The sheet opens the body; the checkable version comes right before the close.",
        },
        {
          id: "facts-words-first",
          label: "Facts and words first, assets last",
          means:
            "The claims and the quotes come first; the kit becomes the download at the foot, not the opener.",
        },
        {
          id: "one-screen",
          label: "One sheet, no scroll, at 1440",
          means: "All three sections compress into one dense screen at 1440; a phone still stacks.",
        },
      ],
      recommended: "today-order",
      because:
        "The sheet is the one thing every reader meets in five seconds, and a reporter on a deadline still reaches the facts inside one scroll; pricing-page just re-cut its own chapters the same way (r2), this order's own precedent now.",
      overrule:
        "If a deadline reporter's first need is the checkable claims rather than the art, facts-words-first.",
      lands: "page.tsx's PressSection order.",
      after: { ask: "who-for", option: "one-page" },
    },
  ],
});
