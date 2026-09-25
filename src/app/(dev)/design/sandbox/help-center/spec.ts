import { defineExploration } from "@/components/lab/exploration";

/**
 * WHERE A HOST OR A GUEST WITH A PROBLEM LANDS, ROUND ONE (2026-09-19).
 *
 * Will ("the overnight round"): every surface is
 * unprotected, "at worst, net neutral and fully deleted". Seven decisions on
 * the real help pieces (`PageHero`, the category emblems, `HelpFactsBand`,
 * the index sheet, the article stage, the "In short" card, `ChipToc` and
 * `ArticleToc`, `Checklist`, `ArticleFeedback`) with hand-authored fixture
 * bodies in the same vocabulary, at 1440 and 375. Not in this round: any
 * production byte; `/contact` and its `?about=` handoff (`contact-page`);
 * the FAQ accordion (`loose-ends`); the body ladder (`body-type`); the voice
 * (`voice`); `/how-it-works` (`how-it-works`, a sibling lane).
 *
 * ★ WHY ONE DECISION STAGES ANOTHER. `hub` only makes sense once the hero it
 * sits beneath has an answer — a set of doors reads differently under a
 * guest-voiced hero than a host-voiced one — so it waits on `who-first`. The
 * other five ask about a different part of the surface each (the article
 * body, the product's own links in, feedback, troubleshooting's dead end,
 * search's reach) and carry no order between them.
 */
export const HELP_CENTER = defineExploration({
  id: "help-center",
  title: "Where a problem lands",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "The desk re-cut: the reel category's blurb now says \"the second photo\", matching his dropped minimum of two; no ask changed.",
  },
  context:
    "Will (2026-09-19, the overnight round): the help center is unprotected like the rest, reconceived from the ground up, \"at worst, net neutral and fully deleted\". Seven decisions on the real hub, article and search pieces, drawn on three real articles.",
  asks: [
    {
      id: "who-first",
      label: "Who first",
      question: "Who should the hub's hero greet first?",
      context:
        "Today: a host-voiced heading with one small guest line beneath a host trio. No guest surface links here, so a phone landing on /help almost always just scanned a code; a laptop almost always came from the host's own menu.",
      options: [
        {
          id: "host",
          label: "The host, as today",
          means:
            "The heading and search speak to hosts; guests get one quiet line underneath.",
        },
        {
          id: "split",
          label: "Two doors, side by side",
          means:
            "\"I'm hosting\" and \"I just scanned a code,\" equal weight, before any search field.",
        },
        {
          id: "context",
          label: "The device implies it",
          means:
            "A phone opens guest-voiced; a laptop opens host-voiced. No toggle, no extra chrome.",
        },
      ],
      recommended: "context",
      because:
        "A phone landing here almost always just scanned a code, and a laptop almost always came from the host's own menu; matching the greeting to the device costs no new control and guesses right far more often than one fixed voice can.",
      overrule:
        "If search brings in as much traffic as the product itself, a device-based greeting guesses wrong often enough that the two-doors split is the honester default.",
      lands: "Whether the hero's copy branches on viewport, and which line leads for a guest.",
    },
    {
      id: "hub",
      label: "The hub",
      question:
        "Should the full index still lead, or does help's own two-visitor mix want a quicker front door first?",
      context:
        "Who-first's own split is the real traffic: a phone almost always just scanned a code, a laptop came from the host's own menu. The sheet is also the one page search engines and llms.txt read end to end: real inventory, not just navigation.",
      options: [
        {
          id: "sheet",
          label: "The sheet, as today",
          means: "Every category's pane, right under the hero, before anything else.",
        },
        {
          id: "doors",
          label: "A few doors, sheet gone",
          means: "Four bigger category doors and a chip row for the rest; no index at all.",
        },
        {
          id: "hybrid",
          label: "Doors, then the sheet",
          means: "The same few doors first; the full index sheet still lives further down.",
        },
      ],
      recommended: "hybrid",
      because:
        "That inventory is real reach: search engines and llms.txt read it, so deleting it costs both. But the phone visitor who just scanned a code for one broken thing should not have to scroll a full index first; doors serve that scanner, the sheet underneath still feeds everyone else.",
      overrule:
        "If search already lands most visitors on the one article they need, nobody scrolls to the sheet anyway, and the plain sheet earns being first again.",
      lands: "Whether the index sheet survives at all, and how far down the page it sits.",
      after: { ask: "who-first" },
    },
    {
      id: "article",
      label: "The article",
      question:
        "Should a how-to lean on prose, a checklist, or the real screen, now the welcome tour chose pictures over screens?",
      context:
        "App-door r2 sent the tour toward bespoke pictures, reading against a screen here too. A tour earns a mood; a how-to bridges a sentence to the surface the reader holds, which a picture cannot. First-event r1 moved teaching inside the act.",
      options: [
        {
          id: "prose",
          label: "Prose with steps, as today",
          means: "Numbered paragraphs; the controls are named but never shown.",
        },
        {
          id: "checklist",
          label: "A checklist first",
          means: "The same steps as tickable items, remembered per device; the prose folds under each one.",
        },
        {
          id: "screen",
          label: "The real screen beside each step",
          means: "Each step keeps a small illustration of the surface it describes, next to the sentence.",
        },
      ],
      recommended: "screen",
      because:
        "The tour's own choice does not transfer: a first look earns a mood, a how-to earns accuracy, and today's articles quote a control without ever showing where it lives; a small illustration beside each step removes that last translation.",
      overrule:
        "Troubleshooting spans too many surfaces for one settled screen; prose stays the cheaper, general answer there even if setup and sharing gain one.",
      lands: "Whether help articles gain a per-step illustration slot, and how much heavier that makes fifty-nine articles to keep current.",
    },
    {
      id: "from-product",
      label: "From the product",
      question:
        "How should a guest reach help, now the action block and a failure both have a settled home?",
      context:
        "The guest's action block is ruled now, a row on landing then a dock (guest-shape r2), its menu identity-door.menu's own shape. Guest-upload r1 gives a failed run its own surface, so a contextual link has a home: that sheet.",
      options: [
        {
          id: "none",
          label: "Nothing, as today",
          means: "Report stays the only control; a guest who wants an answer has to leave and guess a URL.",
        },
        {
          id: "menu",
          label: "A Help entry in the guest's menu",
          means: "A standing row in the now-ruled action block, reachable any time, on every guest page.",
        },
        {
          id: "contextual",
          label: "A link at the moment of trouble",
          means: "No standing entry; the end-of-run failure sheet carries its own link to the matching fix.",
        },
      ],
      recommended: "contextual",
      because:
        "The failure sheet guest-upload r1 already draws is exactly the moment a guest wants an answer, and it is a surface that exists now, not a hope for one; a link inside it costs one row and lands on the matching article.",
      overrule:
        "If guests hit the account menu far more than any single error, the now-ruled action block is cheap real estate for a standing entry instead.",
      lands: "Whether the failure sheet and other error surfaces carry a help deep link, or one static menu entry does the job.",
    },
    {
      id: "feedback",
      label: "Feedback",
      question:
        'Should "Did this answer your question?" leave a mark anywhere, now that keeping fifty-nine articles honest means knowing which ones fail?',
      context:
        "The click flips local state today and is thrown away: fifty-nine articles have shipped and nobody knows which ones lose their reader. A content problem first, true whether or not anything downstream ever charts it.",
      options: [
        {
          id: "ephemeral",
          label: "Ephemeral, as today",
          means: "The click still means something to the reader; the count is thrown away.",
        },
        {
          id: "beacon",
          label: "A counted beacon",
          means: "One insert per click, visible only in admin; the reader sees the same thank-you or sorry.",
        },
        {
          id: "routed",
          label: "Routed and logged",
          means: "A No opens a note that lands in the same queue a contact submission does.",
        },
      ],
      recommended: "beacon",
      because:
        "A team keeping fifty-nine articles accurate cannot fix what it never sees failing; a beacon is one small table and one insert, cheap enough that the count exists whether or not anyone ever builds a screen for it.",
      overrule:
        "If every No deserves a person's eyes and not just a tally, route it into the same queue a contact note lands in instead of a count that risks going unread.",
      lands: "Whether a beacon table ships at all, and whether admin, or anything else, ever surfaces it.",
    },
    {
      id: "dead-end",
      label: "The dead end",
      question: "What should a troubleshooting article do with no bigger picture to point to?",
      context:
        'Every other category ends on a "want the bigger picture" link to its marketing rung. Troubleshooting has none, so its eight articles simply stop after Related articles.',
      options: [
        {
          id: "blank",
          label: "Nothing, as today",
          means: "The article ends; only the standing Contact band follows, unlabeled as an ending.",
        },
        {
          id: "band",
          label: "The Contact band, made explicit",
          means: "The same band, with one sentence acknowledging it is the whole list of fixes.",
        },
        {
          id: "rung",
          label: "A rung of its own",
          means: "A link back to the calm, working version of the same act, in the de-silo line's own voice.",
        },
      ],
      recommended: "rung",
      because:
        "Every other category's article ends on a pointer that troubleshooting alone lacks, not because it has nothing to point to: the calm version of the same act is always one article away.",
      overrule:
        "If a fix is the end of the reader's errand by definition, leaving it blank and trusting the always-present Contact band is the honest minimal answer.",
      lands:
        "Whether troubleshooting's eight articles gain their own end-matter rung, distinct from the `feature` pointer every other category uses.",
    },
    {
      id: "search",
      label: "Search",
      question:
        "How far should the help search palette reach, now the admin portal builds on it too?",
      context:
        "Admin r1 mounts the portal's command palette on this same help palette if it can: a thing two separate apps rely on now, the marketing site and a wholly separate admin deployment. Proof it travels without every route wiring it in.",
      options: [
        {
          id: "local",
          label: "Local, as today",
          means: "Mounted on /help and /contact only; ⌘K with no visible hint elsewhere.",
        },
        {
          id: "sitewide",
          label: "Sitewide",
          means: "The same provider mounts from the root layout; ⌘K works from any marketing page.",
        },
        {
          id: "visible",
          label: "A visible trigger, kept local",
          means: "The mount stays local; the footer's Resources column and header panel each gain a plain Search row.",
        },
      ],
      recommended: "visible",
      because:
        "The palette proving portable enough for a second, unrelated app argues for keeping it self-contained rather than rooting it sitewide; a visible trigger in the footer and header costs one row apiece and needs no second provider mounted everywhere.",
      overrule:
        "If the site's search intent is really pricing, features and the blog together, sitewide is worth the provider cost and the index should grow to match it.",
      lands: "Whether HelpPaletteProvider mounts once at the root, and whether the footer and header gain a visible search entry.",
    },
  ],
});
