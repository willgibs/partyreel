import { type Candidate, defineBoard } from "@/components/lab/board-spec";

import F from "./facts";

/**
 * THE MEDIA-KIT BOARD, AS DATA (round seven, the stepped review, 2026-09-16).
 *
 * ★ THE ROUND IS A RESHAPE, NOT AN EXPLORATION. No new place, no new price, no
 * new argument: the same thirteen and the same four calls. What changed is that
 * the board can be WALKED, because a review is a form now (one context and its
 * question alone on the screen) and round six answered all four questions with
 * the same 1,298-word page.
 *
 * ★ A KEPT CARD HERE IS A PURCHASE, WHICH IS WHY THIS IS NOT PICK-ONE. Twelve
 * palettes are variants of one thing and one wins; thirteen places to buy
 * photographs are thirteen separate proposals, and the board's own answer keeps
 * TWO of them (the month, and three frames out of a credit pack). So
 * `mode: "keep-any"` with `walk: "gallery"`: every card is ruled where it
 * stands, more than one may be kept, and there is no winner ask to mirror.
 *
 * ★ EVERY CARD IS DRAWN AGAINST THE FRAME IT WOULD REPLACE. A contact sheet
 * alone asks the reviewer to remember what the site looks like today; the card
 * now opens with the production still that is on the page right now and the
 * source's own frames beside it, in the same 320 by 400 card on the same
 * ground. `lands` says what keeping it BUYS, which for a purchase is the month,
 * the frames or the credit pack rather than a token.
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
 * this one, because a single answer to the crowds question moves them.
 *
 * ★ AND `lands` IS WHAT KEEPING ONE BUYS, IN MONEY. On every other board it is
 * a token or a component; here a kept card is a purchase, so it is the month,
 * the pack, the credit or the licence, with the number in it.
 */
const ITEMS: readonly Candidate<
  "catalog" | "entry" | "crowds" | "bill" | "pages"
>[] = [
  {
    id: "unsplash-plus",
    name: "Unsplash+",
    one: "The paid tier of the site that started this: everyone in it signed permission, $20 a month.",
    verdict: "ship",
    recommended: true,
    lands: `One $${F.unsplashMonth} month, licensed for ever: every still except the conference rooms.`,
    facts: [
      ["Price", "$20 a month, and what you pull stays yours for ever"],
      ["Licence", 'Unsplash+: "perpetual, nonexclusive, worldwide"'],
      ["Faces", "Released, warranted to $10,000 a photo"],
    ],
    rationale:
      "One month buys every frame the kit needs, released, with nothing to register.",
  },
  {
    id: "istock",
    name: "iStock",
    one: "Twelve dollars a photograph, and the only paid catalogue here you can look at first.",
    verdict: "ship",
    lands: `${F.hardFrames} frames at $${F.istockFrame} from a credit pack: the conference rooms nothing else covers.`,
    facts: [
      ["Price", "$12 a photo on the single-credit pack"],
      ["Licence", 'iStock Standard: "worldwide, in perpetuity"'],
      ["Faces", "Getty warrants the release, editorial files excluded"],
    ],
    rationale:
      "For the two or three rooms a subscription cannot fill; wrong for buying thirty six.",
  },
  {
    id: "stocksy",
    name: "Stocksy",
    one: "A photographers' co-operative: the best pictures here, $35 a frame.",
    verdict: "refine",
    lands: `$35 a frame for the one or two that carry a page. The ${F.masters} would be $1,260.`,
    facts: [
      ["Price", "$35 a frame, $85 large"],
      ["Licence", 'Stocksy Standard: "all images ... are model-released"'],
      ["Faces", "Released across the collection, by policy"],
    ],
    rationale:
      "For the one or two frames that carry a page; the thirty six would be $1,260.",
  },
  {
    id: "adobe-stock",
    name: "Adobe Stock",
    one: "Ten dollars a photograph out of a credit pack, from much the deepest catalogue here.",
    verdict: "refine",
    lands:
      "A $49.99 pack of five credits, expiring after a year, against the deepest catalogue here.",
    facts: [
      ["Price", "$49.99 for five credits, expiring after a year"],
      [
        "Licence",
        'Adobe Standard: "perpetual, worldwide ... up to 500,000 times"',
      ],
      ["Faces", "A signed release required of the contributor, held by Adobe"],
    ],
    rationale:
      "Right for a handful of hard frames; thirty six would be $360 and a night costs less.",
  },
  {
    id: "artgrid",
    name: "Artgrid",
    one: "The only moving-picture licence here that survives cancellation, and the costliest line.",
    verdict: "refine",
    lands: `$${F.clipsYear} a year for the film: the 8 vertical clips, kept after cancellation.`,
    facts: [
      ["Price", "$299 a year, with no single month"],
      [
        "Licence",
        'Artgrid: "licensed to use forever, even if your subscription expires"',
      ],
      ["Faces", "Commissioned shoots, releases behind the production"],
    ],
    rationale:
      "The line the shoot deletes: a film of strangers cannot carry a claim that you were there.",
  },
  {
    id: "websummit-flickr",
    name: "Web Summit",
    one: "Eighty seven thousand conference photographs, free, and nobody in them signed anything.",
    verdict: "refine",
    lands: `${F.webSummit} free conference frames, for a credit line under each. The crowds call decides it.`,
    facts: [
      ["Price", "Free, for a credit line under every frame"],
      ["Licence", 'CC BY 2.0: "You must give appropriate credit"'],
      ["Faces", "A copyright licence says nothing about the people"],
    ],
    rationale:
      "The deepest free corpus for the events nothing else fills, and a wall of other brands.",
  },
  {
    id: "flickr-cc",
    name: "Flickr CC",
    one: "Not a gallery, a filter over everyone's: the deepest free record of real events there is.",
    verdict: "refine",
    lands:
      "The four kinds Web Summit cannot fill, free, on the same credit line and the same call.",
    facts: [
      ["Price", "Free, same credit line"],
      ["Licence", 'CC BY 2.0: "Adapt ... for any purpose, even commercially"'],
      ["Faces", "The photographer signed; nobody else did"],
    ],
    rationale:
      "The only free place that fills the four kinds Web Summit cannot. It lives or dies on the crowds call.",
  },
  {
    id: "envato-elements",
    name: "Envato",
    one: "Unlimited downloads for $16.50 a month, and every file dies with the subscription.",
    verdict: "kill",
    lands:
      "A $198 lease: every file comes off the site the day the subscription stops.",
    facts: [
      ["Price", "$198 a year, $33 monthly"],
      [
        "Licence",
        'Envato: "cannot use downloaded items in new projects after your subscription ends"',
      ],
      ["Faces", "Per item, the contributor's affair, warranted nowhere"],
    ],
    rationale:
      "A lease priced as a purchase, and worse at the only thing being bought.",
  },
  {
    id: "nappy",
    name: "Nappy",
    one: "A real library of Black and Brown people celebrating, which the free corpus has not got.",
    verdict: "kill",
    lands:
      "The one thing the free corpus is worst at, free, and still no signed face on any of it.",
    facts: [
      ["Price", "Free, a donation invited"],
      [
        "Licence",
        'CC0 1.0: "you may still need the permission ... from third parties"',
      ],
      ["Faces", "Says the quiet part itself: no release travels with the file"],
    ],
    rationale:
      "The best free library at what the corpus is worst at, and still no released face.",
  },
  {
    id: "mixkit",
    name: "Mixkit",
    one: "Free clips under a grant the library can withdraw from under a published page.",
    verdict: "kill",
    lands:
      "Free clips the library may withdraw from under a published page. A stand-in, never a hero.",
    facts: [
      ["Price", "Free per item"],
      [
        "Licence",
        'Mixkit Free: "can be used in your commercial ... projects, for free"',
      ],
      ["Faces", "No releases, revocable, liability capped at $10"],
    ],
    rationale:
      "Fine as a lab stand-in, never as a shipped hero. Revocable is the answer.",
  },
  {
    id: "coverr",
    name: "Coverr",
    one: "An irrevocable licence over what turned out to be two catalogues in one grid.",
    verdict: "kill",
    lands:
      "An irrevocable grant over a grid that is two catalogues, so every frame is audited alone.",
    facts: [
      ["Price", "Free"],
      ["Licence", 'Coverr: "irrevocable, non-exclusive, worldwide"'],
      ["Faces", "Obtains releases and passes none on; none for brands"],
    ],
    rationale:
      "A source audited per item is not a source. The catalogue moved, not the licence.",
  },
  {
    id: "death-to-stock",
    name: "Death to Stock",
    one: "The nicest pictures here, rented: cancel the membership and they come off the site.",
    verdict: "kill",
    lands:
      "$199 a year, rented: the pictures come off our own site the month we stop paying.",
    facts: [
      ["Price", "$199 a year, or $179 a visual outright"],
      [
        "Licence",
        'Membership: "renting the rights ... if you cancel, that rental period ends"',
      ],
      ["Faces", "Commissioned creators, nothing warranted to us"],
    ],
    rationale:
      "A subscription that can never be cancelled is a standing charge on our own site.",
  },
  {
    id: "creative-market",
    name: "Creative Market",
    one: "Forty dollars for a wedding photographer's album, and the cheap tier forbids an advert.",
    verdict: "kill",
    lands:
      "$40 for an album of 45 to 70 wedding frames, on the one tier that forbids an advert.",
    facts: [
      ["Price", "$40 to $100 for 45 to 70 frames, once"],
      ["Licence", 'Personal: "paid advertisements are not permitted"'],
      ["Faces", "The shop's affair, and rarely stated at all"],
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
    n: 7,
    date: "2026-09-16",
    changed: `Reshaped to be walked: ${F.sources} cards in one gallery, each drawn against the frame it would replace and saying what keeping it buys, then the four calls as steps with a specimen each. No new place.`,
  },
  history: [
    {
      n: 6,
      date: "2026-09-16",
      changed: `Rebuilt as a catalog: ${F.sources} places as cards carrying their own frames at the real card size. Eleven sections became three and ${F.frames} frames became the argument.`,
    },
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
  ],

  context: `All ${F.ids} photographs on the marketing pages carry the same line, "unsplash (per lab-pack comment; provenance unverified)", with no photographer, no link and no date, and the folder they were copied from is empty. Unsplash's free terms exclude recognisable people and all ${F.ids} are full of them: a sourcing problem, not a filing one. Rounds one to three then argued about ${F.ids} positions on a page; round four's note said the thing actually blocking Will was not knowing where to go.`,

  verdict: {
    recommendation: `Buy the bridge and shoot the kit: $${F.total} of released photographs to run on now, and ${F.masters} of our own from one night we host.`,
    because: `What this track refused was a price tier, not a company. Unsplash's free licence excludes recognisable people; Unsplash+ is a different agreement on the same site, released and warranted, perpetual for anything pulled inside a month, $${F.unsplashMonth}.`,
    overrule: `Answer "every recognisable face" to the crowds question and every free place here is decoration, including ${F.webSummit} conference photographs nothing paid can match.`,
  },

  /**
   * ★ FOUR STEPS AFTER THE CARDS, EACH WITH ITS OWN CONTEXT AND ITS OWN
   * SPECIMEN. One of them is a LOOK and three are calls: the crowds question is
   * settled by putting the free archive's conference card beside the released
   * one, so both of its answers are drawn as tiles on that one card; the rule,
   * the spend and the shoot are decisions about policy and money with nothing
   * to see that the option's own sentence does not say, so they are means-only
   * tiles with the thing they are about on the stage below.
   *
   * ★ NOTHING IS STAGED, AND THAT IS DELIBERATE. `after` hides a question until
   * another is answered, which is right when the second is meaningless on its
   * own. None of these four is: the crowds call is a risk judgement that stands
   * whatever the filing rule says, and the shoot stands whether or not the
   * bridge is bought. A staged question nobody unstages is a question lost.
   */
  asks: [
    {
      id: "rule",
      question:
        "Should every photograph on the site have to say where it came from?",
      context: `The ${F.ids} stills on the site carry one unverified line each. The rule would require six facts on every entry (photographer, link, the clause quoted, the date fetched, whether the people signed) and bar a face that has none.`,
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
      look: "One still below, carrying the line it has today beside the six the rule would want.",
      evidence: "entry",
      lands:
        "Six fields on every entry in marketing-media.ts, and a bar on any recognisable face with no signed permission behind it.",
      strip: ["canvas"],
    },
    {
      id: "crowds",
      question:
        "In a crowd, does every face need signed permission, or only the subject?",
      context:
        "A conference floor has one subject and dozens of faces behind them, and no free library holds permission for any of them. It decides whether the free half of this catalog is a source or a footnote.",
      options: [
        {
          id: "subjects",
          label: "Only the frame's subject",
          means:
            "A background face needs no signed permission, so the free conference and festival archives are real sources.",
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
      evidence: "crowds",
      control: "faces",
      state: { vertical: "corporate" },
      lands: `Whether ${F.webSummit} free conference photographs are a source or a footnote, and with them six of the ${F.sources} cards.`,
      strip: ["canvas"],
    },
    {
      id: "spend",
      question: `Should we spend $${F.total} on licensed photographs until we shoot our own?`,
      context: `One month of Unsplash+ at $${F.unsplashMonth}, where everyone photographed has signed permission, plus ${F.hardFrames} iStock frames at $${F.istockFrame} for the conference rooms nothing else covers. What is pulled inside the month stays licensed for ever.`,
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
      look: "The two halves of the bill below, each in the card it would land in.",
      evidence: "bill",
      // ★ THE STEP LANDS ON WEDDINGS WHATEVER THE CROWDS STEP LEFT BEHIND. The
      // bill's left half follows the strip and its right half is pinned to the
      // conference rooms, so arriving on `corporate` (which the crowds step
      // sets) would draw the same kind of event twice and make "every kind but
      // one" read as a claim about nothing.
      state: { vertical: "weddings" },
      lands: `Whether $${F.total} of released photographs goes on all ${F.marketingPages} marketing pages this week, or nothing does until the shoot.`,
      strip: ["canvas", "vertical"],
    },
    {
      id: "shoot",
      question: `Should we shoot the ${F.masters} photographs ourselves at a real event?`,
      context: `Six frames each for weddings, birthdays, corporate, conferences, festivals and trips, shot in one night at an event we host and run on Partyreel, with permission signed at the door. The call sheet is docs/specs/media-kit.md.`,
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
      look: "The real pages below. Whatever they are wearing, the shoot is what replaces it.",
      evidence: "pages",
      lands: `Whether one night we host produces the ${F.masters} masters and closes nine rows of docs/ASSETS.md.`,
      strip: ["canvas"],
    },
  ],

  /**
   * ★ THE CANDIDATES ARE THE THIRTEEN PLACES, which is round six's whole point.
   * Rounds one to five made the candidates three ROUTES (Mix, Ours, Licensed),
   * which asked Will to rule on a strategy rather than to look at photographs.
   */
  candidates: ITEMS,

  /**
   * ★ KEEP-ANY, WALKED AS A GALLERY. A kept card is a PURCHASE and the board's
   * own answer keeps two of them, so there is no winner to mirror and no "None
   * of these" exit: each card takes its own keep, refine or kill where it
   * stands. A gallery rather than one at a time because what a reviewer does
   * here is compare prices and release positions ACROSS places, which a
   * card-by-card walk hides; each card carries its own before and after, so it
   * is still judged as a difference rather than as a picture.
   */
  catalog: {
    section: "catalog",
    control: "source",
    mode: "keep-any",
    walk: "gallery",
  },

  /**
   * ★ NO `reading` DECLARATION, AND THAT IS THE ROUND'S OWN RESULT. Round five
   * weighed 15,004 words and round six 1,298 against a declared 2,750; this one
   * comes in under the 1,200 every board is held to, so the escape hatch is
   * deleted rather than re-tuned. What did it: the side-by-side section and its
   * twenty-six compare pills left (the one comparison they existed for is the
   * crowds step now), the fourth fact on every card left with them, and the two
   * captions telling a reviewer which switch to press left because a step
   * carries the switches its own question needs. If a later round adds words
   * back, earn the budget again rather than declaring past it.
   */

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

  /**
   * ★ BOTH STANDING ASKS CARRY THEIR ROW, so nothing is asked for twice. The
   * bridge is row 13 of docs/ASSETS.md and the kit is row 7; they are restated
   * here so the board reads on its own, and the `row` is what tells the
   * Orchestrator this is the ask Will already has rather than a new one.
   */
  assets: [
    {
      what: "A purchase rather than a shoot, the one line Will can close tonight",
      spec: `One month of Unsplash+ ($${F.unsplashMonth}) and ${F.hardFrames} iStock frames for the conference rooms ($${F.hardFrames * F.istockFrame}). A card, not a camera.`,
      replaces: "nothing; it is the bridge the shoot then replaces.",
      row: 13,
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
      title: "The places",
      lede: `${KEPT} the board would use and ${KILLED} it would not, each beside the frame it would replace, in the card the blog really renders.`,
      argument: [
        "WHAT RANKS THEM, AND WHY IT IS NOT PRICE. Round three's sheet ranked by money and that inverts this list. Every kind of event this product sells into is a room full of recognisable people, so a free library that holds nobody's signed permission is not the cheap option, it is the one that cannot supply the frames we came for. The Faces line is the ranking, and the two places it moves furthest are the two best free catalogues on the board.",
        "WHAT THE MONEY BUYS, ROW BY ROW. One month of Unsplash+ covers all five kinds of event at $20; the conference rooms are the only frames paid for one at a time, three iStock Essentials at $12; every other row is included. The asymmetry is the argument: licensing the photographs is $56 and licensing the films is $299 a year, so the clips line costs more than every photograph here put together, and it is the one line a shoot deletes outright.",
        "WHY THE FRAMES ARE HOTLINKED AND NOTHING IS COPIED. Every tile is the source's OWN thumbnail, fetched from the source's own CDN by a plain img rather than through next/image, because next/image would leave a cached copy of another company's watermarked comp on our infrastructure, which is the one thing a sourcing board must never do. A frame that stops answering degrades to a labelled slate: the sheet cannot drift from the catalogue it claims to show without going blank.",
        "AND SIX PLACES DRAW NOTHING, FOR FOUR DIFFERENT REASONS. Adobe Stock, Stocksy and Creative Market answer a plain client with a 403; Artgrid answers 200 with an empty application shell and fetches its clips client side; Death to Stock answers 200 at the door and 404 on every browse path under it; Coverr reads completely, and what the reading found is its verdict rather than a sheet. Each card carries its own reason, because an earlier draft printed one categorical sentence under all of them that was false for four.",
      ],
    },
    {
      id: "entry",
      title: "What an entry would have to say",
      lede: "One still on the site today, with the line it carries now beside the six facts the rule would require of it.",
      argument: [
        "THE SIX FIELDS ARE THE PROPOSAL, AND THEY ALREADY RUN. provenance.test.ts holds the staged batch to author, link, licence, the clause quoted, the date fetched and whether the people signed, field for field against the JSON that sits beside the files. The clause is quoted rather than named because a source can vanish and a platform name proves nothing about what was agreed, and `people` is the field that decides whether a frame may sit on a page making a claim: no free tier supplies a model release, so identifiable means not without one.",
      ],
    },
    {
      id: "crowds",
      title: "A crowd, or a room that signed",
      lede: "The same conference card, from the free archive and from the released catalogue. The distance between them is the question.",
      argument: [
        "A grid of thumbnails flatters everything, because a small square asks nothing of a photograph. This is the size the site actually cuts: the blog card at 320 by 400 on paper, where a frame that cannot take a tall crop stops flattering. The comps are 360 to 640 pixels wide and they are shown at 320, so read composition, colour and what survives the crop, never sharpness; iStock serves its search thumbnails unwatermarked at 612, so a plate can read as a finished card when it is a preview of one we do not own.",
      ],
    },
    {
      id: "bill",
      title: "What the bridge buys",
      lede: "The month on one side and the three conference rooms on the other, each in the card it would land in.",
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

  /**
   * ★ FOUR CONTROLS, AND ONE OF THEM IS A STEP'S OWN TILES. `faces` serves
   * exactly one decision, so it IS the crowds step's two option states and a
   * reviewer never meets the switch: declared (that is what an option state is
   * written against, and the whole board is still browsable) and on no strip.
   * A and B left entirely with the side-by-side section, because the one
   * comparison they were built for is that step now.
   */
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
    {
      id: "faces",
      label: "A crowd",
      options: [
        { id: "subjects", label: "Only the subject" },
        { id: "all-faces", label: "Every face" },
      ],
      default: "subjects",
    },
  ],

  lookFirst: [
    {
      section: "catalog",
      note: "Read the thirteen. Each card opens with the frame on the site today, then what the place would put there instead.",
    },
    {
      section: "crowds",
      state: { vertical: "corporate", faces: "subjects" },
      note: "The free archive's conference card. Press the switch and the same card arrives from the released catalogue.",
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
