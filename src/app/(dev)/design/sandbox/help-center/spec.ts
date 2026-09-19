import { defineExploration } from "@/components/lab/exploration";

/**
 * WHERE A HOST OR A GUEST WITH A PROBLEM LANDS, ROUND ONE (2026-09-19).
 *
 * Will (docs/design/rulings.md, "the overnight round"): every surface is
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
    date: "2026-09-19",
    changed:
      "The first round: who the hub greets first, whether the index sheet survives, whether a how-to leans on prose, a checklist or the real screen, how a guest reaches help from the product, whether feedback goes anywhere, troubleshooting's dead end, and how far search reaches.",
  },
  context:
    "Will (2026-09-19, the overnight round): the help center is unprotected like the rest, reconceived from the ground up, \"at worst, net neutral and fully deleted\". Seven decisions on the real hub, article and search pieces, drawn on three real articles.",
  bible: [1, 4, 7, 21, 22],
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
      question: "Should the full index sheet survive below the hero?",
      context:
        "Below the hero sits every one of 59 articles, two columns of ten category panes. Most visits are answered by the trio or the search, yet the whole index is still the second thing on the page.",
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
        "The index is real inventory search engines and llms.txt both read, which costs nothing to keep, but it need not be the second thing every visitor meets; doors first serve the two-second scanner without deleting the one browsing everything.",
      overrule:
        "If the sheet is shown to earn real engagement right where it sits today, leave it exactly there; there is no traffic data yet to say either way.",
      lands: "Whether the index sheet survives at all, and how far down the page it sits.",
      after: { ask: "who-first" },
    },
    {
      id: "article",
      label: "The article",
      question: "Should a how-to lean on prose, a checklist, or the real screen it names?",
      context:
        "Today's steps are numbered prose with quoted controls (a UiLabel chip). The reader is holding the screen those controls live on and has to translate a sentence onto it every time.",
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
        "A how-to's whole job is bridging the sentence to the screen, and today's articles quote a control without ever showing where it lives; a small illustration beside each step removes that last translation.",
      overrule:
        "Troubleshooting spans too many surfaces for one settled screen; prose stays the cheaper, general answer there even if setup and sharing gain one.",
      lands: "Whether help articles gain a per-step illustration slot, and how much heavier that makes fifty-nine articles to keep current.",
    },
    {
      id: "from-product",
      label: "From the product",
      question: "How should a guest reach help from inside the product?",
      context:
        "No guest surface links to help today: not the header, not the album, not the entry gate. A stuck guest's one exit is Report, which queues a review and answers nothing.",
      options: [
        {
          id: "none",
          label: "Nothing, as today",
          means: "Report stays the only control; a guest who wants an answer has to leave and guess a URL.",
        },
        {
          id: "menu",
          label: "A Help entry in the guest's menu",
          means: "A standing row beside Report, reachable any time, on every guest page.",
        },
        {
          id: "contextual",
          label: "A link at the moment of trouble",
          means: "No standing entry; a failed tile or a wrong password carries its own link to the matching fix.",
        },
      ],
      recommended: "contextual",
      because:
        "A stuck guest is already looking at a specific error, not browsing a menu they do not have; a link on the failed tile lands them on the one article that answers their exact problem instead of a generic hub.",
      overrule:
        "If guests hit the account menu far more than any single error, a standing entry is the simpler net and needs no failure state to carry its own link.",
      lands: "Whether error surfaces across the guest app each carry a help deep link, or one static menu entry does the job.",
    },
    {
      id: "feedback",
      label: "Feedback",
      question: 'Should "Did this answer your question?" go anywhere?',
      context:
        "Yes flips local state; No deep-links to contact. Nothing is ever recorded, so nothing has ever told anyone which of fifty-nine articles fail.",
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
        "Fifty-nine articles have never once said which of them fail; a beacon is one small table and one insert, cheap enough to ship without also turning every miss into a support ticket.",
      overrule:
        "If every No should already be a signal a person triages, route it through contact_submissions directly instead of a count nobody reads day to day.",
      lands: "Whether a beacon table ships at all, and whether admin gains a per-article miss rate.",
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
      question: "How far should the help search palette reach?",
      context:
        "The ranked ⌘K palette mounts only on /help and /contact today, with no visible door: a reader has to already know the shortcut exists.",
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
        "⌘K with no affordance is a shortcut nobody finds by accident, and today's index only ranks help content; a button where people already look costs far less than mounting a whole provider on every route to search a fraction of the site.",
      overrule:
        "If the site's search intent is really pricing, features and the blog together, sitewide is worth the provider cost and the index should grow to match it.",
      lands: "Whether HelpPaletteProvider mounts once at the root, and whether the footer and header gain a visible search entry.",
    },
  ],
});
