import { type Candidate, defineBoard } from "@/components/lab/board-spec";

import F from "./facts";

/**
 * THE MEDIA-KIT BOARD, AS DATA (round six, the catalog, 2026-09-16).
 *
 * ★ THE ROUND IS A SUBTRACTION AND WILL'S TWO NOTES ARE THE WHOLE BRIEF. Round
 * four's note asked for "discovery/sourcing... a few different potential
 * sources as opposed to a few exact image picks", and round five's said every
 * board "feels like a small research paper" where "designing a few variations
 * will always beat a mountain of research text". Round five answered the first
 * and not the second: it found thirteen real places and then wrote 15,004 words
 * about them, the heaviest board in the lab. So the places are now CARDS, each
 * with its own photographs at the size a blog card actually is, and everything
 * that was an argument about them is folded, quoted in four facts, or gone to
 * docs/specs/media-kit.md.
 *
 * ★ WHAT LEFT, AND WHY NONE OF IT IS LOST. Eleven sections became three. The
 * blog bridge (23 posts against 22 staged frames), the exposure table, the gap
 * survey, the free-licence clause-by-clause, the four applied routes, the six
 * facts suite and the reel runbook all left the board; every finding they
 * rendered is a folded `argument` paragraph, a card fact, or a section of the
 * spec doc. The bridge and the staged batch went furthest, because they were
 * exact picks, which is the one thing round four's note asked this track to
 * stop doing. `provenance.test.ts` still runs on the staged batch, so the rule
 * in ask 1 is still a suite that passes rather than a proposal.
 *
 * ★ EVERY COUNT AND EVERY PRICE IS INTERPOLATED, NEVER TYPED, which is this
 * board's oldest landmine: round three shipped a ruling surface whose first
 * sentence carried the one number the round existed to take back, because the
 * number was a word in a string. `facts.ts` says it in full.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React, the board or its preview would drag a client tree into a server
 * render.
 */

/**
 * THE THIRTEEN, WRITTEN OUT (round six, 2026-09-16).
 *
 * ★ NEVER A `.map` OVER `sources.ts`, AND THE PALETTE BOARD LEARNED IT TWICE.
 * `pnpm lab:review` resolves `candidates: ITEMS` exactly one hop to a const in
 * THIS file; a `.map` over another module reads as no items at all, and every
 * ruling on every card would then be refused. So the STRUCTURE of a source
 * lives in `sources.ts` (the price, the clause verbatim, the release position,
 * the catalogue, whether it is barred) and the WORDS a reviewer compares across
 * thirteen cards live here. `catalog.test.ts` pins the two lists id for id, and
 * pins every quoted fragment in a Licence fact to be a real substring of that
 * source's verbatim clause, so a card cannot quietly misquote a licence.
 *
 * ★ THE ORDER IS THE LINE. Above it the board would use the place; below it the
 * board would not, and `verdict` says which. That line is NOT the same line as
 * `barred` in sources.ts: barred is the RULE's line (can this place put a
 * recognisable face on a page), and two of the places below that line are above
 * this one, because a single answer to ask 3 moves them. Two ship, five refine,
 * six kill, which is a board with an opinion.
 */
const ITEMS: readonly Candidate<"catalog" | "compare" | "pages">[] = [
  {
    id: "unsplash-plus",
    name: "Unsplash+",
    one: "The paid tier of the site that started this: everyone in it signed permission, $20 a month.",
    verdict: "ship",
    recommended: true,
    facts: [
      ["Price", "$20 a month, and what you pull stays yours for ever"],
      ["Licence", 'Unsplash+: "perpetual, nonexclusive, worldwide"'],
      ["Faces", "Released, warranted to $10,000 a photo"],
      ["Catalogue", "Curated, small, 20 released frames per kind of event"],
    ],
    rationale:
      "One month buys every frame the kit needs, released, with nothing to register.",
  },
  {
    id: "istock",
    name: "iStock",
    one: "Twelve dollars a photograph, and the only paid catalogue here you can look at first.",
    verdict: "ship",
    facts: [
      ["Price", "$12 a photo on the single-credit pack"],
      ["Licence", 'iStock Standard: "worldwide, in perpetuity"'],
      ["Faces", "Getty warrants the release, editorial files excluded"],
      ["Catalogue", "Millions; these are its own watermarked comps"],
    ],
    rationale:
      "For the two or three rooms a subscription cannot fill; wrong for buying thirty six.",
  },
  {
    id: "stocksy",
    name: "Stocksy",
    one: "A photographers' co-operative: the best pictures here, $35 a frame.",
    verdict: "refine",
    facts: [
      ["Price", "$35 a frame, $85 large"],
      ["Licence", 'Stocksy Standard: "all images ... are model-released"'],
      ["Faces", "Released across the collection, by policy"],
      ["Catalogue", "Small, curated, thin on offices. Refuses a plain client"],
    ],
    rationale:
      "For the one or two frames that carry a page; the thirty six would be $1,260.",
  },
  {
    id: "adobe-stock",
    name: "Adobe Stock",
    one: "Ten dollars a photograph out of a credit pack, from much the deepest catalogue here.",
    verdict: "refine",
    facts: [
      ["Price", "$49.99 for five credits, expiring after a year"],
      [
        "Licence",
        'Adobe Standard: "perpetual, worldwide ... up to 500,000 times"',
      ],
      ["Faces", "A signed release required of the contributor, held by Adobe"],
      ["Catalogue", "Hundreds of millions, and unseen: a 403"],
    ],
    rationale:
      "Right for a handful of hard frames; thirty six would be $360 and a night costs less.",
  },
  {
    id: "artgrid",
    name: "Artgrid",
    one: "The only moving-picture licence here that survives cancellation, and the costliest line.",
    verdict: "refine",
    facts: [
      ["Price", "$299 a year, with no single month"],
      [
        "Licence",
        'Artgrid: "licensed to use forever, even if your subscription expires"',
      ],
      ["Faces", "Commissioned shoots, releases behind the production"],
      ["Catalogue", "Whole shoots, not clips. Serves an empty shell"],
    ],
    rationale:
      "The line the shoot deletes: a film of strangers cannot carry a claim that you were there.",
  },
  {
    id: "websummit-flickr",
    name: "Web Summit",
    one: "Eighty seven thousand conference photographs, free, and nobody in them signed anything.",
    verdict: "refine",
    facts: [
      ["Price", "Free, for a credit line under every frame"],
      ["Licence", 'CC BY 2.0: "You must give appropriate credit"'],
      ["Faces", "A copyright licence says nothing about the people"],
      ["Catalogue", "87,066 of 120,692, counted on the day"],
    ],
    rationale:
      "The deepest free corpus for the events nothing else fills, and a wall of other brands.",
  },
  {
    id: "flickr-cc",
    name: "Flickr CC",
    one: "Not a gallery, a filter over everyone's: the deepest free record of real events there is.",
    verdict: "refine",
    facts: [
      ["Price", "Free, same credit line"],
      ["Licence", 'CC BY 2.0: "Adapt ... for any purpose, even commercially"'],
      ["Faces", "The photographer signed; nobody else did"],
      ["Catalogue", "All of Flickr under one licence filter"],
    ],
    rationale:
      "The only free place that fills the four kinds Web Summit cannot. It lives or dies on question 3.",
  },
  {
    id: "envato-elements",
    name: "Envato",
    one: "Unlimited downloads for $16.50 a month, and every file dies with the subscription.",
    verdict: "kill",
    facts: [
      ["Price", "$198 a year, $33 monthly"],
      [
        "Licence",
        'Envato: "cannot use downloaded items in new projects after your subscription ends"',
      ],
      ["Faces", "Per item, the contributor's affair, warranted nowhere"],
      ["Catalogue", "Very large; these are its own previews"],
    ],
    rationale:
      "A lease priced as a purchase, and worse at the only thing being bought.",
  },
  {
    id: "nappy",
    name: "Nappy",
    one: "A real library of Black and Brown people celebrating, which the free corpus has not got.",
    verdict: "kill",
    facts: [
      ["Price", "Free, a donation invited"],
      [
        "Licence",
        'CC0 1.0: "you may still need the permission ... from third parties"',
      ],
      ["Faces", "Says the quiet part itself: no release travels with the file"],
      ["Catalogue", "Small, warm, readable per kind of event"],
    ],
    rationale:
      "The best free library at what the corpus is worst at, and still no released face.",
  },
  {
    id: "mixkit",
    name: "Mixkit",
    one: "Free clips under a grant the library can withdraw from under a published page.",
    verdict: "kill",
    facts: [
      ["Price", "Free per item"],
      [
        "Licence",
        'Mixkit Free: "can be used in your commercial ... projects, for free"',
      ],
      ["Faces", "No releases, revocable, liability capped at $10"],
      ["Catalogue", "Real, with a look-alike personal-use licence beside it"],
    ],
    rationale:
      "Fine as a lab stand-in, never as a shipped hero. Revocable is the answer.",
  },
  {
    id: "coverr",
    name: "Coverr",
    one: "An irrevocable licence over what turned out to be two catalogues in one grid.",
    verdict: "kill",
    facts: [
      ["Price", "Free"],
      ["Licence", 'Coverr: "irrevocable, non-exclusive, worldwide"'],
      ["Faces", "Obtains releases and passes none on; none for brands"],
      ["Catalogue", "70 clips for party, 23 AI, beside 34 iStock results"],
    ],
    rationale:
      "A source audited per item is not a source. The catalogue moved, not the licence.",
  },
  {
    id: "death-to-stock",
    name: "Death to Stock",
    one: "The nicest pictures here, rented: cancel the membership and they come off the site.",
    verdict: "kill",
    facts: [
      ["Price", "$199 a year, or $179 a visual outright"],
      [
        "Licence",
        'Membership: "renting the rights ... if you cancel, that rental period ends"',
      ],
      ["Faces", "Commissioned creators, nothing warranted to us"],
      ["Catalogue", "15,000 visuals, all behind the membership"],
    ],
    rationale:
      "A subscription that can never be cancelled is a standing charge on our own site.",
  },
  {
    id: "creative-market",
    name: "Creative Market",
    one: "Forty dollars for a wedding photographer's album, and the cheap tier forbids an advert.",
    verdict: "kill",
    facts: [
      ["Price", "$40 to $100 for 45 to 70 frames, once"],
      ["Licence", 'Personal: "paid advertisements are not permitted"'],
      ["Faces", "The shop's affair, and rarely stated at all"],
      ["Catalogue", "Real wedding bundles, and unseen: a 403"],
    ],
    rationale:
      "The cheap wedding album from Will's note, at a real price; it buys rings and cake.",
  },
];

/** The board's own line, counted rather than typed (the oldest rule here). */
const KEPT = ITEMS.filter((i) => i.verdict !== "kill").length;
const KILLED = ITEMS.length - KEPT;

export const MEDIA_KIT = defineBoard({
  id: "media-kit",
  title: "The media kit",

  question: `Which of ${F.sources} real places should our photographs come from, and what runs until we shoot our own?`,

  round: {
    n: 6,
    date: "2026-09-16",
    changed: `Rebuilt as a catalog: ${F.sources} places, each a card carrying its own frames at the real card size on the real ground, four facts and the board's call. Eleven sections became three and ${F.frames} frames became the argument.`,
  },
  history: [
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "The four questions rewritten in plain words: each says what the thing is, where it lives and where to look. No candidate, number or recommendation changed.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed: `Became a sourcing sheet on Will's note (places, not picks): ${F.sources} real catalogues ranked by whether they hold a release, a plan that totals $${F.total}, and the finding that the refusal was of a TIER, not of a company.`,
    },
    {
      n: 3,
      date: "2026-09-15",
      changed:
        "The walk taken before Will takes it. Five asks became four, the rule took back part of the Licensed route, and the stage was corrected to the real card at the real size on the real ground.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed: `The exposure measured on the real site (${F.productionFiles} files, ${F.routes} routes), all the posts mapped at the real geometry, and four blocks the site can wear.`,
    },
    {
      n: 1,
      date: "2026-09-14",
      changed:
        "The survey. Unsplash's free licence excludes recognisable people, so the twelve stand-ins were never covered by the licence they claim.",
    },
  ],

  context: `All ${F.ids} photographs on the marketing pages carry the same line, "unsplash (per lab-pack comment; provenance unverified)", with no photographer, no link and no date, and the folder they were copied from is empty. Unsplash's free terms exclude recognisable people and all ${F.ids} are full of them: a sourcing problem, not a filing one. Rounds one to three then argued about ${F.ids} positions on a page; round four's note said the thing actually blocking Will was not knowing where to go.`,

  verdict: {
    recommendation: `Buy the bridge and shoot the kit: $${F.total} of released photographs to run on now, and ${F.masters} of our own from one night we host.`,
    because: `What this track refused was a price tier, not a company. Unsplash's free licence excludes recognisable people; Unsplash+ is a different agreement on the same site, released and warranted, perpetual for anything pulled inside a month, $${F.unsplashMonth}.`,
    overrule: `Answer "every recognisable face" to question 3 and every free place here is decoration, including ${F.webSummit} conference photographs nothing paid can match.`,
  },

  asks: [
    {
      id: "rule",
      question:
        "Should every photograph on the site have to say where it came from?",
      context: `The ${F.ids} stills on the site carry one unverified line each. The rule would require six facts on every entry (photographer, link, the clause quoted, the date fetched, whether the people signed) and bar a face that has none.`,
      look: "The Faces line on every card. It is this rule, applied.",
      options: [
        {
          id: "yes",
          label: "Yes, require the six facts",
          means:
            "An entry has to name its photographer, link, clause, date and people, and a face with no signed permission cannot ship.",
        },
        {
          id: "no",
          label: "No, leave the entries as they are",
          means: `The ${F.ids} keep their one unverified line and the next batch is judged case by case.`,
        },
      ],
      recommended: "yes",
      because:
        "It already runs as a passing suite, so there is nothing left to design, and it costs something real: it is what ranks this catalog.",
      evidence: "catalog",
    },
    {
      id: "spend",
      question: `Should we spend $${F.total} on licensed photographs until we shoot our own?`,
      context: `One month of Unsplash+ at $${F.unsplashMonth}, where everyone photographed has signed permission, plus ${F.hardFrames} iStock frames at $${F.istockFrame} for the conference rooms nothing else covers. What is pulled inside the month stays licensed for ever.`,
      look: "The first two cards: their Price lines are the whole bill, their frames are what it buys.",
      options: [
        {
          id: "buy",
          label: `Buy the $${F.total} set now`,
          means:
            "Downloaded inside the month, licensed for ever, on the site until the shoot replaces it.",
        },
        {
          id: "hold",
          label: "Wait for the shoot, spend nothing",
          means: `Nothing is bought and the ${F.ids} unverified stills stay on all ${F.marketingPages} marketing pages until the night happens.`,
        },
      ],
      recommended: "buy",
      because:
        "Less than a dinner, thrown away the day the shoot happens, and the only line here that can be closed tonight.",
      overrule:
        "A bought frame is still a room we were not in, and the claim is that the photographs are from your party.",
      evidence: "catalog",
    },
    {
      id: "crowds",
      question:
        "In a crowd, does every face need signed permission, or only the subject?",
      context:
        "A conference floor has one subject and dozens of faces behind them, and no free library holds permission for any of them. It decides whether the free half of this catalog is a source or a footnote.",
      look: "Set the kind of event to conferences and read the two Flickr cards.",
      options: [
        {
          id: "subjects",
          label: "Only the frame's subject",
          means:
            "A face in the background needs no signed permission, which makes the free conference and festival archives real sources.",
        },
        {
          id: "all-faces",
          label: "Every recognisable face",
          means:
            "A crowd needs permission from everyone in it, which no free library can give, so the free half is decoration.",
        },
      ],
      recommended: "subjects",
      because: `A risk call rather than a legal opinion, worth ruling for what turns on it: ${F.webSummit} conference photographs, for the events nothing paid is deep in.`,
      evidence: "catalog",
      state: { vertical: "corporate" },
    },
    {
      id: "shoot",
      question: `Should we shoot the ${F.masters} photographs ourselves at a real event?`,
      context: `Six frames each for weddings, birthdays, corporate, conferences, festivals and trips, shot in one night at an event we host and run on Partyreel, with permission signed at the door. The call sheet is docs/specs/media-kit.md.`,
      look: "The real pages below, wearing a bought catalogue. The shoot replaces what you are looking at.",
      options: [
        {
          id: "shoot",
          label: `Shoot the ${F.masters} in one night`,
          means:
            "One event, permission signed at the door, and nine of the twelve rows in the asset log close from the same night.",
        },
        {
          id: "park",
          label: "Park the shoot for now",
          means:
            "No shoot is booked, and the site runs on bought photographs, or on the stand-ins, until one is.",
        },
      ],
      recommended: "shoot",
      because: `One night closes nine of the twelve rows in the asset log, and the money was never in the stills: $${F.total} of photographs against $${F.clipsYear} a year of film.`,
      evidence: "pages",
    },
  ],

  /**
   * ★ THE CANDIDATES ARE THE THIRTEEN PLACES, which is the round's whole point.
   * Rounds one to five made the candidates three ROUTES (Mix, Ours, Licensed),
   * which asked Will to rule on a strategy rather than to look at photographs.
   */
  candidates: ITEMS,

  catalog: {
    section: "catalog",
    control: "source",
    compare: ["compare-a", "compare-b"],
  },

  /**
   * ★ THE CATALOG'S OWN FLOOR, DECLARED RATHER THAN GAMED. Round five weighed
   * 15,004 words; this is 2,701, and every one of the remaining words is a
   * label rather than a paragraph. Thirteen cards cost their name, their line,
   * four facts and the reviewer's row before the board speaks (about 950), the
   * meta panel prints all thirteen ideas again (the kit's, not this board's),
   * the dock carries thirty nine pills because a pick and two compares over
   * thirteen places is thirty nine, and four questions carry the context Will
   * ruled they must. The argument is folded and the frames are the evidence.
   * The cheap way under 1,200 would be to drop the facts, which is the one
   * thing a reviewer compares thirteen places on.
   */
  reading: {
    words: 2750,
    why: "Thirteen places is thirteen names, lines, fact strips and verdict rows, printed again in the meta panel and three times in the dock. The argument is folded; what is left is labels and four quoted licences.",
  },

  departures: [
    {
      id: "bible-18",
      from: 18,
      text: `Bible 18 says no stock on a marketing surface and it is already broken at a scale round one under-reported: the ${F.ids} stills are in ${F.productionFiles} files and ${F.routes} routes, six in the chrome of all ${F.marketingPages} marketing pages before a scroll. That is the only reason a bought bridge is here.`,
      evidence: "pages",
    },
    {
      id: "rank-by-release",
      from: "precedent",
      text: `Round three ranked sources by price. Free is not cheap here, it is unusable: every kind of event this product sells into is a room of recognisable faces, so a library with nobody's signature cannot supply the frames at any price.`,
      evidence: "catalog",
    },
    {
      id: "tier-not-company",
      from: "precedent",
      text: `Round one killed Unsplash on the sentence excluding recognisable people and three rounds read that as a refusal of the company. Unsplash+ is a different agreement on the same site, $${F.unsplashMonth}. Three rounds of "no stock we can name" had a $${F.total} answer the whole time.`,
      evidence: "catalog",
    },
  ],

  assets: [
    {
      what: "A purchase rather than a shoot, the one line Will can close tonight",
      spec: `One month of Unsplash+ ($${F.unsplashMonth}) and ${F.hardFrames} iStock frames for the conference rooms ($${F.hardFrames * F.istockFrame}). A card, not a camera.`,
      replaces: "nothing; it is the bridge the shoot then replaces.",
    },
    {
      what: `${F.masters} event photographs, six per kind of event`,
      spec: "1600 px long edge, a third portrait, one dark warm grade; the call sheet is docs/specs/media-kit.md, W1 to T6. Four are the palette board's hard cases.",
      replaces: `all ${F.ids} stand-ins by id.`,
      row: 7,
    },
    {
      what: "8 vertical clips with posters",
      spec: `3 to 5 s, 1080 x 1920, silent, each with a poster, filmed at the same events. Licensed instead they are $${F.clipsYear} a year.`,
      replaces: "the currentTime ranges cut out of hero-candidate-01.",
      row: 4,
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The places, ranked",
      lede: `${KEPT} places the board would use and ${KILLED} it would not, each with its own photographs at the size and on the ground a blog card really has.`,
      argument: [
        "WHAT RANKS THEM, AND WHY IT IS NOT PRICE. Round three's sheet ranked by money and that inverts this list. Every kind of event this product sells into is a room full of recognisable people, so a free library that holds nobody's signed permission is not the cheap option, it is the one that cannot supply the frames we came for. The Faces line is the ranking, and the two places it moves furthest are the two best free catalogues on the board.",
        "WHAT THE MONEY BUYS, ROW BY ROW. One month of Unsplash+ covers all five kinds of event at $20; the conference rooms are the only frames paid for one at a time, three iStock Essentials at $12; every other row is included. The asymmetry is the argument: licensing the photographs is $56 and licensing the films is $299 a year, so the clips line costs more than every photograph here put together, and it is the one line a shoot deletes outright.",
        "WHY THE FRAMES ARE HOTLINKED AND NOTHING IS COPIED. Every tile is the source's OWN thumbnail, fetched from the source's own CDN by a plain img rather than through next/image, because next/image would leave a cached copy of another company's watermarked comp on our infrastructure, which is the one thing a sourcing board must never do. A frame that stops answering degrades to a labelled slate: the sheet cannot drift from the catalogue it claims to show without going blank.",
        "AND SIX PLACES DRAW NOTHING, FOR FOUR DIFFERENT REASONS. Adobe Stock, Stocksy and Creative Market answer a plain client with a 403; Artgrid answers 200 with an empty application shell and fetches its clips client side; Death to Stock answers 200 at the door and 404 on every browse path under it; Coverr reads completely, and what the reading found is its verdict rather than a sheet. Each card carries its own reason, because an earlier draft printed one categorical sentence under all of them that was false for four.",
      ],
    },
    {
      id: "compare",
      title: "Two catalogues, side by side",
      lede: "Press A on one card and B on another: the same frames from each, at the two sizes the site cuts.",
      argument: [
        "A grid of thumbnails flatters everything, because a small square asks nothing of a photograph. These are the two sizes the site actually cuts: the blog card at 320 by 400 on the dark page, where a frame that cannot take a tall crop stops flattering, and the share card at 1200 by 630, which centre-crops and ignores the crop ladder entirely and is the surface a stranger sees first.",
        "The comps are 360 to 640 pixels wide and they are shown at 320, so read composition, colour and what survives the crop, never sharpness. iStock serves its search thumbnails unwatermarked at 612, so a plate here can read as a finished card when it is a preview of one we do not own.",
      ],
    },
    {
      id: "pages",
      title: "The real pages, wearing the pick",
      lede: "The real routes at true pixels, as built on the left and wearing the picked place on the right.",
      argument: [
        "The swap is a stylesheet rather than an edit, and the selectors are the production file names: next/image keeps the file name inside its optimizer query, so one substring rule catches a frame on the blog card, the footer strip, the nav panel and a feature mock at once. Replacing the content of an image through CSS is Chrome and Safari behaviour; Firefox simply shows today's frame, which is a harmless failure worth knowing before a walk.",
        "Nothing here ships. A wiring round changes files and manifest entries, not CSS: the twelve manifest entries, 23 frontmatter lines on the blog, and the two recorded reel recipes, which are already in the parity page's own picker (runbook.test.ts keeps that true).",
      ],
      wiring: [
        "The swap never moves a crop: `content` replaces the image and leaves `object-position` alone, and the blog derives that position from the slug, so a frontmatter edit will not move it either. A candidate lands at the post's own rung of the crop ladder on the walk and after the wiring.",
      ],
    },
  ],

  controls: [
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    {
      id: "source",
      label: "Pick",
      // Nothing picked is a state of its own (Will, 2026-09-16): the pages
      // below show the site as built until a card is picked, and pressing the
      // picked card returns here.
      options: [
        { id: "none", label: "Nothing picked" },
        ...ITEMS.map((i) => ({ id: i.id, label: i.name })),
      ],
      default: "none",
      clearable: true,
    },
    // A and B open on the two the crowds question is actually between: the
    // cheapest released catalogue and the deepest free one.
    {
      id: "compare-a",
      label: "A",
      options: ITEMS.map((i) => ({ id: i.id, label: i.name })),
      default: "unsplash-plus",
    },
    {
      id: "compare-b",
      label: "B",
      options: ITEMS.map((i) => ({ id: i.id, label: i.name })),
      default: "websummit-flickr",
    },
    {
      id: "vertical",
      label: "Kind of event",
      options: [
        { id: "weddings", label: F.vertical.weddings },
        { id: "birthdays", label: F.vertical.birthdays },
        { id: "corporate", label: F.vertical.corporate },
        { id: "festivals", label: F.vertical.festivals },
        { id: "trips", label: F.vertical.trips },
      ],
      default: "weddings",
    },
  ],

  lookFirst: [
    {
      section: "catalog",
      note: "Read the thirteen. The line says what each place is, the four facts are what they are compared on, and the frames are what the place holds.",
    },
    {
      section: "catalog",
      state: { vertical: "corporate" },
      note: "The same thirteen, filtered to conferences, the kind of event nothing paid is deep in. A card with nothing for it says so in the same glance.",
    },
    {
      section: "compare",
      state: { "compare-a": "unsplash-plus", "compare-b": "websummit-flickr" },
      note: "The $20 released catalogue against the free one with 87,066 conference photographs in it. Question 3 is the distance between them.",
    },
    {
      section: "pages",
      state: { source: "unsplash-plus" },
      note: "The real blog, as built beside the same page wearing Unsplash+. Then press Apply and walk the running site with it on.",
    },
  ],

  notes: [
    {
      section: "catalog",
      text: "None of these frames is licensed to us. Every tile is a preview served from the source's own search page, and some sources serve theirs without a watermark, so a card can look finished when it is not.",
    },
    {
      section: "pages",
      text: "Six of the thirteen draw no frames at all, so picking one of those leaves the right-hand page as built. The absence is the fact: a catalogue that refuses to be read is a catalogue nobody can check a verdict against.",
    },
  ],

  links: {
    bible: [1, 18],
    spec: "docs/specs/media-kit.md",
    pages: [
      { label: "The blog", path: "/blog", note: "eleven cards, one grid" },
      { label: "Home", path: "/", note: "the footer strip, on every page" },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the chrome, before a scroll",
      },
      {
        label: "The album feature",
        path: "/features/album",
        note: "a mock reading the ids",
      },
    ],
  },
});
