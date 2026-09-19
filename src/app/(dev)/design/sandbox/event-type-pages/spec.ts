import { defineExploration } from "@/components/lab/exploration";

/**
 * ROUND ONE OF THE EVENT-TYPE LANDING PAGES (2026-09-19, the overnight round).
 *
 * Will (docs/design/rulings.md, "the overnight round"): every surface is
 * unprotected, "at worst, net neutral and fully deleted". Eight decisions on
 * the real hub and type-page pieces (`PageHero`, `EventHeroMedia` for all
 * four slugs, `TypeDirectory`, `BuiltFor`/`HelpPane`, `ReelAngleBand`,
 * `FaqAccordion`, `CtaBand`) with fixture `EventType`-shaped data where the
 * question needs an invented type or copy the single source cannot hold, at
 * 1440 and 375. Not in this round: any production byte; the mega panel's and
 * the footer's Events entries (`site-chrome`); the FAQ's own look and source
 * (`loose-ends`); what the demo door promises (`demo-event`, read here only
 * for its own recommendation); `/pricing` (`pricing-page`); the copy register
 * (`body-type`, `voice`); the home's event-type cards beyond one drawn
 * reference.
 *
 * ★ WHY TWO DECISIONS STAGE BEHIND THE HERO'S PICTURE. `one-hero` draws the
 * type page's hero WEARING whatever picture answer the board carries (a
 * stage that is a photograph reads differently from one that is a phone
 * mock), and `directory` draws its cards the same way, so density is never
 * judged against a picture that decision invented on its own. The other five
 * ask about a different part of the page each (the page count, who is
 * greeted, the mid-page proof, the family's size, the phone) and carry no
 * order between them.
 */
export const EVENT_TYPE_PAGES = defineExploration({
  id: "event-type-pages",
  title: "The event-type landing pages",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: one page or four, the hero's picture, one hero, who is greeted, the mid-page proof, how many types, the hub's directory, and the phone.",
  },
  context:
    "Will (2026-09-19, the overnight round): the event-type pages are unprotected like the rest, reconceived from the ground up, \"at worst, net neutral and fully deleted\". Eight decisions on the real hub and the four /events/[slug] pieces, drawn on fixture types where the single source cannot hold what a question asks.",
  bible: [1, 4, 7, 21, 22],
  asks: [
    {
      id: "one-page-or-four",
      label: "One page or four",
      question:
        "Should the four event types keep separate landing pages, or fold into fewer?",
      context:
        "Today: one [slug] template renders all four (weddings, parties, conferences, trips), bespoke only in the hero and the copy; the hub links to each. Drawn on weddings, the page's own \"1-2-3\" shape: the event, the plan, the close.",
      options: [
        {
          id: "template",
          label: "Four pages, one template, as today",
          means:
            "One template, the noun swapped; every type owns its 300-370 words and its own hero, everything else the same shape.",
        },
        {
          id: "bespoke",
          label: "A bespoke page per type",
          means:
            "Each type free to diverge in shape as well as words: its own extra section where the story calls for one.",
        },
        {
          id: "shell",
          label: "One shell, only the hero swaps",
          means:
            "The benefits, the reel line and the FAQ collapse to shared, generic wording; only the hero differs by type.",
        },
      ],
      recommended: "template",
      because:
        "Four distinct URLs is real SEO surface (a search for \"wedding photos\" should land on a page saying wedding), and today's template keeps upkeep low; a bespoke page per type is four times the work for a want with no evidence yet, and the shared shell trades away the per-type words search rewards.",
      overrule:
        "If four near-identical pages start reading as filler, the shared shell is the honest next step; measure it against real search traffic first.",
      lands:
        "Whether /events/[slug] stays one template, splits into four bespoke builds, or thins its copy to one swappable slot.",
    },
    {
      id: "hero-picture",
      label: "The hero's picture",
      question:
        "Should every type's hero lead with a photograph, a product artifact, or the same object every time?",
      context:
        "Today's split: real photographs for weddings and parties, a product artifact for conferences and trips, since the bootstrap set has no honest still for either. Drawn on all four heroes, since the question is whether they should match.",
      options: [
        {
          id: "split",
          label: "The split, as today",
          means:
            "Photographs where the manifest has an honest one, an artifact where it doesn't.",
        },
        {
          id: "artifacts",
          label: "An artifact for all four",
          means:
            "Every hero wears the same product object, reskinned per type, so the four read as one family with no future-photo dependency.",
        },
        {
          id: "photos",
          label: "A photograph for all four",
          means:
            "Every hero is a photograph; the two missing sets are named as an ask and stand in with a labelled placeholder until they land.",
        },
        {
          id: "phone",
          label: "The product in a phone",
          means:
            "Every hero is the same upload screen in a phone bezel; nothing about it differs by event type.",
        },
      ],
      recommended: "split",
      because:
        "The code's own manifest note already rules this: once real conference and trip photography lands, the artifact stays the hero and the photos become supporting texture, never the other way. A considered call already on the books beats reversing it without new evidence.",
      overrule:
        "If visual consistency across the four heroes matters more than honesty per hero, artifacts-for-all-four costs nothing today and needs no future shoot.",
      lands:
        "Whether EventHeroMedia's per-slug switch stays a genuine split or becomes one composition wearing four labels.",
    },
    {
      id: "one-hero",
      label: "One hero",
      question:
        "Should the type page's hero keep its own hand-rolled markup, or share PageHero with the hub?",
      context:
        "The hub's hero is PageHero; a type page hand-rolls the same lockup (its own breadcrumb Link, its own gap-5 against PageHero's gap-6), duplicating it. Drawn on weddings, wearing whichever hero-picture answer this board carries.",
      options: [
        {
          id: "today",
          label: "Two implementations, as today",
          means:
            "The hub on PageHero, every type page on its own copy of the same idea, one pixel off (gap-5 against PageHero's gap-6).",
        },
        {
          id: "page-hero",
          label: "Every page on PageHero",
          means:
            "The type page's breadcrumb becomes PageHero's eyebrow slot; one component, one gap, the same look.",
        },
        {
          id: "hub-on-type",
          label: "The hub adopts the type page's shape",
          means:
            "The hub gains a Home breadcrumb in place of its plain eyebrow; the type page's anatomy becomes the standard instead.",
        },
      ],
      recommended: "page-hero",
      because:
        "The hand-rolled hero and PageHero already render the same lockup; the only real difference is duplicated code and a spacing token that quietly drifted. PageHero's own `children` slot already holds a page's stage, which is exactly what EventHeroMedia is.",
      overrule:
        "If the breadcrumb-first anatomy reads better side by side, promote it and rebuild the hub on it instead; either way, one implementation should remain.",
      lands:
        "Whether every /events hero shares one component, and which anatomy that component keeps.",
      after: { ask: "hero-picture" },
    },
    {
      id: "who-greeted",
      label: "Who is greeted",
      question: "Should a type page's hero acknowledge anyone besides the host?",
      context:
        "Today: the heading, the subhead and both buttons speak only to a host deciding whether to sign up; no guest or planner ever gets a line. Drawn on weddings, the real PageHero, its actions row.",
      options: [
        {
          id: "host",
          label: "The host alone, as today",
          means: "The heading, the subhead and the doors stay entirely host-voiced.",
        },
        {
          id: "guest-line",
          label: "One quiet line for the guest",
          means:
            "A small line beneath the doors, for a reader who scanned a code rather than one planning to host.",
        },
        {
          id: "planner-line",
          label: "One quiet line for the planner",
          means:
            "A small line for whoever is planning it for someone else, distinct from the host who signs up.",
        },
      ],
      recommended: "guest-line",
      because:
        "A guest searching what a QR code at a wedding means is plausible traffic this page currently gives nothing to; one quiet line costs nothing and never competes with the host's own doors. A planner audience is a bigger product question nobody has researched yet.",
      overrule:
        "If wedding and event planners become a real channel, that audience deserves its own research pass before a permanent line here, not a guess now.",
      lands:
        "Whether a second line ever sits beneath a type hero's actions, and which audience it speaks to.",
    },
    {
      id: "the-proof",
      label: "The proof",
      question: "What should the mid-page proof beat play alongside the reel?",
      context:
        "Today: ReelAngleBand alone, the site's one real render, poster-first. Drawn on weddings, the real ReelAngleBand, singular \"wedding\".",
      options: [
        {
          id: "reel",
          label: "The reel alone, as today",
          means: "Nothing added; the real render is the whole beat.",
        },
        {
          id: "stats",
          label: "A stat band before it",
          means:
            "A row of real, fact-only numbers (kinds of events, per-guest fees, watermark) ahead of the reel, the same register the storage-limits section already uses.",
        },
        {
          id: "story",
          label: "One real wedding, three frames",
          means:
            "The reel band is replaced by three captioned stills from one wedding (the Maya & Jay fixture this page already names), a narrative rather than a render.",
        },
        {
          id: "demo-door",
          label: "A door to the demo, in the arc",
          means:
            "The reel stays; beneath it, a card promises what opening the demo shows (demo-event's own recommended answer), not a bare text link.",
        },
      ],
      recommended: "demo-door",
      because:
        "Every number here is either a feature fact told elsewhere or a usage count that would be invented (there are zero real hosts yet); the one honest addition is a second real, working proof, and demo-event's own answer keeps the two boards from inventing two voices for one door.",
      overrule:
        "A fact-only stat band costs nothing dishonest and can still sit ahead of the reel; the story option waits on a real host willing to be named.",
      lands:
        "Whether a demo door earns a place inside the reel arc itself, and whether that promise matches demo-event's own wording everywhere it appears.",
    },
    {
      id: "how-many",
      label: "How many",
      question: "Should the event-type family stay four, grow to five, or shrink to three?",
      context:
        "Today: weddings, parties, conferences, trips. Drawn as a card grid, icon-forward: a photograph is THE HERO'S PICTURE's question, not this one's.",
      options: [
        {
          id: "four",
          label: "Four, as today",
          means: "No new umbrella, no fold; every existing URL keeps its SEO equity.",
        },
        {
          id: "five",
          label: "Five, with Schools",
          means:
            "One invented umbrella (proms, class reunions, sports banquets) added alongside the four, drawn to show what a fifth card costs the grid.",
        },
        {
          id: "three",
          label: "Three, trips folded into parties",
          means:
            "Trips' own page retires; its themes (reunions, road trips) become nested themes on parties instead.",
        },
      ],
      recommended: "four",
      because:
        "Trips' nested themes barely overlap parties' (only \"bachelorette\" brushes both), so folding it away trades a whole page's SEO surface for a savings nobody has asked for; a fifth umbrella like Schools has no research behind it yet, and product-defining moves like this are Will's to research first.",
      overrule:
        "If a fifth vertical is worth testing, Schools is the safer of the two; if trips is truly underperforming, fold it only after checking its own numbers.",
      lands:
        "Whether EVENT_TYPES gains, loses, or holds its four entries, and every nav, sitemap and footer line that enumerates them.",
    },
    {
      id: "directory",
      label: "The directory",
      question: "Should the hub's directory stay two-up, tighten to four across, or become a list?",
      context:
        "Today: two tilt cards per row, a wide preview, the teaser line, three theme chips. Drawn on the real four types, wearing whichever hero-picture answer this board carries, since a denser card has to hold the same picture.",
      options: [
        {
          id: "tilt-two-up",
          label: "Two-up tilt cards, as today",
          means:
            "The current size: room for the teaser and three theme chips beside a wide preview.",
        },
        {
          id: "four-across",
          label: "Four across, thinner",
          means: "Every card in one row at 1440; the teaser and the chips drop to fit.",
        },
        {
          id: "list",
          label: "A list, one line each",
          means: "No card grid at all: a name, a teaser and a small thumbnail, one per row.",
        },
      ],
      recommended: "tilt-two-up",
      because:
        "The directory's own job is being richer than the home page's teaser row; four-across and the list both trade that legibility away for density the hub, at four or five entries, does not need yet.",
      overrule:
        "If HOW MANY grows the family past five, a denser layout stops being optional; revisit this the same round that answer changes.",
      lands:
        "TypeDirectory's own grid, and how much of the SEO-facing theme-chip text survives at a glance.",
      after: { ask: "hero-picture" },
    },
    {
      id: "the-phone",
      label: "The phone",
      question: "Does the type page's mobile read need a fix, and where?",
      context:
        "Measured live against the real page (/events/weddings at 375): 5,755px total, and 183px of nothing between the FAQ list's last row and the CTA heading (both sections run py-20 below sm, stacked back to back).",
      options: [
        {
          id: "measured",
          label: "The arc as today, measured",
          means: "No change; the real route, so the numbers above are exactly what a reader scrolls.",
        },
        {
          id: "tightened",
          label: "The FAQ-to-close gap halved",
          means:
            "One stylesheet change, the real route wearing it: both paddings halved, closing roughly 80px of the 183px gap.",
        },
        {
          id: "one-screen",
          label: "One type, one screen",
          means:
            "Everything a wedding's page says, cut to a single early screen: a headline, one line, one photo, one button. No intro, no benefits, no reel, no FAQ.",
        },
      ],
      recommended: "tightened",
      because:
        "183px is close to a quarter of a phone screen of nothing between two things a reader is actively reading; halving both paddings is a one-line fix with no content lost. Cutting to one screen loses the FAQ, the benefits and the reel, all of which do real SEO and trust work these pages exist for.",
      overrule:
        "If the FAQ's own accordion already reads as a natural stopping point, leave the gap alone; the measurement says it is long, not that it reads wrong.",
      lands:
        "Whether /events/[slug]'s FAQ and CTA sections keep py-20 on both sides of that seam, or one of them gives some of it back.",
      tile: "phone",
    },
  ],
});
