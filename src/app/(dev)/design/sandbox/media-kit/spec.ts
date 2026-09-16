import { defineBoard } from "@/components/lab/board-spec";

import F from "./facts";

/**
 * THE MEDIA-KIT BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15).
 *
 * Nothing here is new argument. Every ask, candidate, departure and asset is
 * round four's, moved out of `board.tsx`, out of `decision.ts`'s ASKS and out of
 * `BoardMeta`'s prop strings so the template, the desk, the record and the
 * review ledger read ONE list. What changed is where a reviewer meets them: the
 * verdict and the four one-word calls are the first screen instead of a block
 * two thirds of the way down, and round four's `details` fold is gone, because
 * the template folds each section's argument under the evidence it belongs to
 * rather than folding seven sections behind one summary.
 *
 * ★ EVERY COUNT AND EVERY PRICE IS INTERPOLATED, NEVER TYPED, which is this
 * board's oldest landmine (decision.ts): round three shipped a ruling surface
 * whose first sentence carried the one number the round existed to take back,
 * because the number was a word in a string. A number written into a sentence
 * cannot be wrong out loud; one interpolated from the batch can only be wrong if
 * the batch is.
 *
 * ★ AND EVERY ONE OF THEM ARRIVES THROUGH ONE BRACE-FREE IMPORT (`facts.ts`),
 * which is a constraint of the review ledger rather than a taste: lab-review.mjs
 * scans this file with no build step and takes the board object to be the first
 * `{` after the first `defineBoard`, so a named import under that line is read
 * as the board and every ruling on this board is refused. facts.ts says it in
 * full; do not add a second named import here without reading it.
 *
 * Pure otherwise (registry.test.ts enforces it): no React, no CSS, no import of
 * `board.tsx`, no JSX. The board route is a SERVER page and reads the question
 * for its header, so a spec that reached for any of those would drag a client
 * tree into a server render.
 */
export const MEDIA_KIT = defineBoard({
  id: "media-kit",
  title: "The media kit",
  question:
    "Where do the photographs on our pages come from: which catalogues can sell or give us a wedding, a party, a conference and a festival, at what price, and who signed permission to be in them?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The four questions rewritten in plain words: each says what the thing is, where it lives on the site and where to look, and every option is labelled in words with what picking it does. The evidence carries the same words. No candidate, number or recommendation changed.",
  },
  history: [
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
      changed: `The exposure measured on the real site (${F.productionFiles} files, ${F.routes} routes), all ${F.posts} posts mapped at the real geometry, the kit written as a call sheet, and four blocks the site can wear.`,
    },
    {
      n: 1,
      date: "2026-09-14",
      changed:
        "The survey. Unsplash's licence excludes recognisable people, so the twelve stand-ins were never covered by the licence they claim.",
    },
  ],

  context: `All ${F.ids} photographs on the marketing pages are listed in one file, and every one carries the same line, "unsplash (per lab-pack comment; provenance unverified)", with no photographer, no link and no date. The folder they were copied from is empty, so the trail is gone. Reading the licence settles it faster than hunting the trail would: Unsplash's free terms exclude recognisable people, and all ${F.ids} are full of them. Not a filing problem, a sourcing one. Three rounds then argued about ${F.ids} positions on a page; Will's round-four note said the thing actually blocking him was not knowing where to go.`,

  verdict: {
    recommendation: `Require the six facts on every entry, spend $${F.total} on licensed photographs to run on meanwhile, decide whether a crowd needs everyone's permission, and shoot our own ${F.masters} at a real event we host.`,
    because: `What this track refused was a price tier, not a company. Unsplash's free licence excludes recognisable people; Unsplash+ is a different agreement on the same site, where everyone photographed has signed permission and anything downloaded inside the month stays licensed for ever, for $${F.unsplashMonth}. So the stopgap costs $${F.total} rather than being unbuyable at any price.`,
    overrule: `Answer "every recognisable face" to question 3 and the free half of the sheet is decoration, including the ${F.webSummit} conference photographs nothing paid can match.`,
  },

  asks: [
    {
      id: "rule",
      question:
        "Should every photograph on the site have to say where it came from?",
      context: `Every marketing photograph is listed in one file with a line saying where it came from, and all ${F.ids} carry the same unverified line: no photographer, no link, no date. The rule would require six facts on every entry (who shot it, the link, the licence clause quoted, the date it was fetched, and whether the people in it signed permission) and would bar a recognisable face that has none.`,
      look: `The section "The six facts on every entry": the left card is one photograph with all six filled in, the right card is what the test already refuses. Both run on the ${F.candidates} staged frames.`,
      options: [
        {
          id: "yes",
          label: "Yes, require the six facts",
          means:
            "Every entry has to name its photographer, link, clause, date and people, and a recognisable face with no signed permission cannot ship.",
        },
        {
          id: "no",
          label: "No, leave the entries as they are",
          means:
            "The twelve keep their one unverified line, and the next batch is judged case by case rather than against a written rule.",
        },
      ],
      recommended: "yes",
      because: `It already runs on ${F.candidates} staged records, with a test suite that refuses one missing a field, so there is nothing left to design. Saying yes costs something real: it bars four of the staged frames, and two of those are the dance floor and the DJ.`,
      evidence: "record",
    },
    {
      id: "spend",
      question: `Should we spend $${F.total} on licensed photographs to run on until we shoot our own?`,
      context: `A stopgap set of photographs to replace the ${F.ids} unverified ones until the shoot happens. It is one month of Unsplash+ at $${F.unsplashMonth}, where everyone photographed has signed permission, plus ${F.hardFrames} single frames at $${F.istockFrame} each from iStock for the conference rooms nothing else covers. Anything downloaded inside that month stays licensed for ever.`,
      look: `The section "What to buy, and what it comes to": the table is what the money buys, row by row, with the total at the bottom; the numbered list under it is what $${F.total} does not buy, which is the case for waiting.`,
      options: [
        {
          id: "buy",
          label: `Buy the $${F.total} set now`,
          means: `One month of Unsplash+ and ${F.hardFrames} iStock frames, downloaded inside the month and licensed for ever, on the site until the shoot replaces them.`,
        },
        {
          id: "hold",
          label: "Wait for the shoot, spend nothing",
          means: `Nothing is bought, and the ${F.ids} unverified stills stay on all ${F.marketingPages} marketing pages until the night happens.`,
        },
      ],
      recommended: "buy",
      because: `Everyone photographed in that month has signed permission, which is the exact thing the ${F.ids} stand-ins never had, and a frame pulled inside the month stays licensed for ever. It costs less than a dinner and is thrown away the day the shoot happens.`,
      overrule:
        "A bought frame is still a room we were not in, and the claim this product makes is that the photographs came from the party you were at.",
      evidence: "plan",
    },
    {
      id: "crowds",
      question:
        "In a crowd shot, does every face need signed permission, or only the subject?",
      context:
        "A model release is the signed permission a photographed person gives for commercial use. The rule in question 1 bars a recognisable face without one. A crowd shot, a conference room or a dance floor, has one subject and dozens of faces behind them, and no free library holds permission for any of them. This decides whether those catalogues can supply a frame at all.",
      look: `The section "Where to get them, ranked", with Kind of event set to Corporate and conferences: below the red line sit the free catalogues this ruling moves or leaves, including Web Summit's ${F.webSummit}.`,
      options: [
        {
          id: "subjects",
          label: "Only the frame's subject",
          means:
            "A face in the background of a crowd needs no signed permission, which makes the free conference and festival archives usable sources.",
        },
        {
          id: "all-faces",
          label: "Every recognisable face",
          means:
            "A crowd shot needs permission from everyone in it, which no free library can give, so the free half of the sheet is decoration.",
        },
      ],
      recommended: "subjects",
      because: `A risk call rather than a legal opinion, and worth ruling for what turns on it: Web Summit's ${F.webSummit} conference photographs and the whole Flickr corpus are crowds, and conferences are the one kind of event no subscription on this sheet is deep in.`,
      evidence: "sheet",
      state: { vertical: "corporate" },
    },
    {
      id: "kit",
      question: `Should we shoot the ${F.masters} photographs ourselves at a real event?`,
      context: `The kit is ${F.masters} photographs, six each for weddings, birthdays, corporate, conferences, festivals and trips, shot in one night at an event we host and run on Partyreel, with permission signed at the door. The board writes every frame out: what happens in it, where the camera is, what the light is doing, and the crops it has to survive.`,
      look: `The section "The shoot, frame by frame": the ${F.masters} frame cards grouped by kind of event, then the nine rows of the asset log the same night closes, then what every frame has to survive.`,
      options: [
        {
          id: "shoot",
          label: `Shoot the ${F.masters} in one night`,
          means:
            "One event, permission signed at the door, and nine of the twelve rows in the asset log close from the same night's footage.",
        },
        {
          id: "park",
          label: "Park the shoot for now",
          means:
            "No shoot is booked, and the site runs on the bought photographs, or on the twelve stand-ins, until one is.",
        },
      ],
      recommended: "shoot",
      because: `One night at a real event running Partyreel closes nine of the twelve rows in the asset log, and the sheet sharpened the case: licensing the photographs is $${F.total} and licensing the films is $${F.clipsYear} a year, so the money was never in the stills.`,
      evidence: "callsheet",
    },
  ],

  candidates: [
    {
      id: "buy-then-shoot",
      name: `Buy the bridge, then shoot the kit ($${F.total} now)`,
      recommended: true,
      rationale: `A month of Unsplash+ plus ${F.hardFrames} iStock frames buys a bridge that is genuinely released, which the staged batch never was, and it can be downloaded tonight. Then the shoot replaces all of it. Round three's Mix with a legal second half: the ${F.allowed} sources above the line all hold or warrant a release.`,
    },
    {
      id: "shoot-only",
      name: "Shoot only, and leave the twelve until it happens",
      rationale: `The rule taken literally. One night at an event we host, with releases at the door, closes nine of the twelve rows in the asset log and is the only sourcing that makes the product's own claim true. The cost is that the ${F.ids} unlicensed stills stay on ${F.marketingPages} marketing pages until the night happens.`,
    },
    {
      id: "free-only",
      name: "Free only, which the sheet now prices honestly",
      rationale: `Everything below the line: ${F.barredSources} real catalogues, including the ${F.webSummit} CC BY conference photographs that are the deepest free corpus for the one vertical we cannot fill. It costs nothing and it cannot ship a face, so the crowds ask is what turns it from decoration into the answer.`,
    },
  ],

  departures: [
    {
      id: "tier-not-company",
      from: "precedent",
      text: `Round one killed Unsplash on the sentence excluding recognisable people, and three rounds treated that as a refusal of the company. Unsplash+ is a different agreement on the same site: released, warranted, perpetual for anything pulled inside a month, $${F.unsplashMonth}. Three rounds of "no stock we can name" had a $${F.total} answer the whole time.`,
      evidence: "plan",
    },
    {
      id: "bible-18",
      from: 18,
      text: `Bible 18 says no stock on a marketing surface, and it is already broken in production on a larger scale than round one reported: the ${F.ids} are in ${F.productionFiles} production files and ${F.routes} routes, and six of them sit in the chrome of all ${F.marketingPages} marketing pages before a reader scrolls. That is the only reason a Licensed route exists at all.`,
      evidence: "exposure",
    },
    {
      id: "rank-by-release",
      from: "precedent",
      text: `Round three ranked sources by price. The free half is not cheap, it is unusable: every vertical this product sells into is a room full of recognisable faces, so a library with no release cannot supply the frames at any price. ${F.barredSources} of the ${F.sources} places sit below a line for that one reason, including the two best free catalogues on it.`,
      evidence: "sheet",
    },
    {
      id: "licence-is-not-a-source",
      from: "precedent",
      text: "Round three's survey ran licences and sources together, and its first row was CC0 1.0, a legal instrument rather than a place with photographs in it. That is why it could not answer the question Will actually had. The two lists are separate now, and the sheet ranks places.",
      evidence: "licences",
    },
    {
      id: "licensed-withdrawn",
      from: "precedent",
      text: `Licensed no longer survives its own column, and the board says so rather than leaving it an equal third. Under the rule it fills ${F.idsUnderRule} of the ${F.ids} ids and ${F.postsUnderRule} of the ${F.posts} posts, the two it cannot fill are the dance floor and the DJ, and it has nothing for the corporate half of the business. It stays to be walked, because walking it is what kills it.`,
      evidence: "bridge",
    },
    {
      id: "coverr-audited",
      from: "ruling",
      text: "Coverr was marked allowed in round one on its licence text and was measured this round instead: a search for party returns 70 Coverr-hosted clips, 23 of them user AI generations, on the same page as 34 iStock results under no Coverr licence at all. The licence was never the problem; the catalogue behind it moved.",
      evidence: "sheet",
    },
    {
      id: "one-night",
      from: "precedent",
      text: "The perfect version of this system is neither licensed nor generated: one real event, hosted and shot with releases signed at the door, which is the only sourcing that makes the product's claim literally true. It is also the cheapest, and one of its rows is the demo event's own seed, so the event that produces the kit can BE the event the live QR already points at.",
      evidence: "callsheet",
    },
  ],

  assets: [
    {
      what: "A purchase rather than a shoot, and the only line Will can close tonight",
      spec: `One month of Unsplash+ ($${F.unsplashMonth}) and ${F.hardFrames} iStock Essentials frames for the conference rooms ($${F.istockSpend}), $${F.total} in total. A card, not a camera. It is what makes the bridge legal while the shoot is booked.`,
      replaces: "nothing; everything below is the shoot.",
    },
    {
      what: `${F.masters} event photographs, six per vertical`,
      spec: "Weddings, birthdays, corporate, conferences, festivals, trips. 1600 px long edge, a third portrait, one dark warm grade; the call sheet is on this board, codes W1 to T6. Four are the palette board's hard cases and three show a guest holding a phone up.",
      replaces: `all ${F.ids} stand-ins by id.`,
      row: 7,
    },
    {
      what: "24 squares at 512 x 512",
      spec: "6 to 35 KB webp, cropped from the 24 masters marked 512 square rather than shot a second time.",
      replaces: "FRAMES in sandbox/home-hero/shared.tsx.",
      row: 2,
    },
    {
      what: "10 portrait crops at 512 x 640 and 12 portraits at 720 x 900",
      spec: "Recrops of the same masters, for the burst's tall third and the river's stream. Ten rather than the log's eight: hero-burst raised the count in its round two. Rows 9 and 12.",
      replaces: "the portrait stand-ins in the burst and the river.",
      row: 9,
    },
    {
      what: "A hand-and-phone cutout",
      spec: "PNG with alpha, 1200 px long edge, the screen area transparent, two grips. The one item that is a separate setup: shoot it at the same event, against the darkest wall, in the same low warm light as K3.",
      replaces: "the drawn device in sandbox/home-hero/scan.tsx.",
      row: 8,
    },
    {
      what: "8 vertical clips with posters",
      spec: `3 to 5 s, 1080 x 1920, silent, each with its own poster, filmed at the same events, and the film cut from that footage (rows 4 and 1). The only clip licence on the sheet that survives cancellation is $${F.clipsYear} a year, more than every photograph in the plan put together.`,
      replaces: "the currentTime ranges cut out of hero-candidate-01.",
      row: 4,
    },
    {
      what: "Two frames shot knowing they will be laid over each other",
      spec: "Both dark and low contrast at the touching edge, for the light board's depth cue. W3 and C1 on the call sheet already are that pair; they need no second setup, only the intent.",
      replaces: "the reception-hall and wedding-toast pair on the light board.",
      row: 11,
    },
    {
      what: "The demo event's curated folder",
      spec: "If the shoot is run AS a Partyreel event, the guests' own uploads are the seed and the live QR on every hero board points at a real album instead of fixtures.",
      replaces: "the seeded fixtures behind the demo event.",
      row: 5,
    },
  ],

  sections: [
    {
      id: "plan",
      title: "What to buy, and what it comes to",
      lede: "One subscription month covers all five kinds of event. The only money paid per photograph is for the conference rooms, and the films are shot rather than licensed, because licensing them costs more than every photograph here put together.",
      argument: [
        `Every figure is read off the source's own card rather than typed into a sentence: a row names a source and a quantity, the money comes from that source's firstSpend, and plan.test.ts refuses a row whose source does not exist, a spend that does not match the card, and a total that is not the sum of the rows.`,
        `The asymmetry is the argument. Licensing the photographs is $${F.total} and licensing the films is $${F.clipsYear} a year, so the clips line costs more than every photograph here put together, and it is the one line a shoot deletes outright: a film of strangers cannot carry a product whose claim is that the frames came from the party you were at.`,
      ],
    },
    {
      id: "sheet",
      title: "Where to get them, ranked",
      lede: `${F.sources} real places to get photographs, ranked by whether the people in them have signed permission, each with its price, its licence clause quoted word for word, and a grid of its own thumbnails.`,
      argument: [
        "Ranked by release rather than by price, and that inverts the list round three built. Every vertical this product sells into is a room full of recognisable people, so a free library with no release is not the cheap option, it is the one that cannot supply the frames. Every paid source with a release outranks every free one, and the sheet says so with a line across it.",
        `The contact sheets are hotlinked, never copied: ${F.sheetPulls} pulls from the sources' own public search pages, ${F.frames} frames in all, each recorded as the source's own thumbnail URL, so a watermarked comp stays a watermarked comp and nothing paid is ever in our tree. A source that draws no sheet prints its own measured reason rather than sharing an excuse.`,
      ],
    },
    {
      id: "surface",
      title: "At the real size, on the real page",
      lede: "A grid of thumbnails flatters everything, because a small square asks nothing of a photograph. The real sizes on the real background: the blog card at 320 by 400 on a dark page, and the link preview at 1200 by 630.",
      argument: [
        "The stage is 1:1, so a frame that cannot survive a 4:5 crop fails here where it fails on the site. The card is cut at the three rungs of the crop ladder a slug actually produces; the share card centre-crops and ignores the ladder entirely, which is the surface a stranger sees first.",
      ],
    },
    {
      id: "licences",
      title: "What each licence actually says",
      lede: "The licences themselves, quoted clause by clause from the licence page on the date it was read. A licence is what you agree to and a catalogue is where you go; running the two together is what made round three's survey unanswerable.",
      argument: [
        "The refusals stay, because knowing why a licence fails is worth more than a shorter list, and one of them moved this round: CC BY was struck cheaply when nothing good was under it, and the best free catalogue on the sheet turned out to be under it.",
      ],
    },
    {
      id: "apply",
      title: "Try it on the real site",
      lede: "Four swaps the running site can wear, one at a time, so the call is made in front of the real pages rather than on a stage. Chrome and Safari only: replacing an image through a stylesheet is their behaviour, not every browser's.",
      argument: [
        "A palette board hands the site a token block; this board's candidates are photographs, so what it hands the site is the swap itself. The selectors are the production file names, which next/image keeps inside its optimizer query, so one substring rule catches a frame on the blog card, the footer strip, the nav panel and a feature mock at once.",
        `The blog is swapped per POST as well as per id, because the sheet is per post: a file name can only carry an id, and fourteen of the ${F.postsFilled} filled posts take a different photograph from the one their cover's id is bridged with. Both namespaces ride every block, and apply.test.ts pins each post's rule to the route it belongs to.`,
      ],
      wiring: [
        "Nothing here ships. A wiring round changes files and manifest entries, not CSS: 23 frontmatter lines on the blog, the twelve manifest entries, and the two recorded reel recipes.",
      ],
    },
    {
      id: "exposure",
      title: "Where the twelve actually are",
      lede: `How many production files use each photograph, counted from the code by a test so a number here cannot go stale, plus the header and footer that put six of them on all ${F.marketingPages} marketing pages before a reader scrolls.`,
      argument: [
        `Round one measured the blast radius as the blog. It is the site: ${F.productionFiles} production files across ${F.routes} routes, with four ids in the footer strip and two in the nav panel, both of which live in the group layouts. Reach, rather than count, belongs to reception-table: it is the only id in both, so it is on every marketing page twice.`,
      ],
    },
    {
      id: "gap",
      title: "What the free libraries do not have",
      lede: "Six frames per kind of event is the kit. Three of the six kinds this product sells to have nothing at all, which is what a person picking blog covers out of eleven frames has to work with.",
      argument: [
        "Scene searches for an office party, a conference audience and a dinner party return government photo-ops, UN panels and Wikimedia meetups. The free corpus is an archive of RECORD, not of celebration, and its coverage maps onto what photographers give away: trips completely, festivals mostly, weddings as details and the backs of heads, conferences not at all.",
      ],
    },
    {
      id: "bridge",
      title: "Every blog post, with what would replace its photo",
      lede: `All ${F.posts} posts, today's cover beside the one that would replace it, at the real size of the card it lands on, both rows cut the same way the real page cuts them.`,
      argument: [
        `Nobody hashed the covers. All ${F.posts} posts set cover: in frontmatter and 22 of them differ from what the fallback hash would give, so a person chose every miscast one out of eleven wedding and festival frames, which is why the conference post is a music festival. That changes what the fix is: ${F.posts} frontmatter lines, not ${F.ids} files.`,
        `The second, harder search closed all four of round one's holes and staged ${F.candidates} frames in all, which moved the argument rather than winning it: 18 of the ${F.candidates} work only because nobody in them is recognisable, and the four with a face are the four that need a release nobody here holds. The frames worth anything to this product are the ones with faces in them.`,
        `The route is not two questions. It decides how many frames change and when, so the consequence is the table rather than a second word from Will: Mix swaps ${F.mixIds} id and ${F.mixPosts} covers now, Ours changes all ${F.posts} on one day, and Licensed fills ${F.postsUnderRule} of ${F.posts} under the rule rather than the ${F.postsFilled} it fills on paper.`,
      ],
    },
    {
      id: "callsheet",
      title: "The shoot, frame by frame",
      lede: `${F.masters} photographs, six per kind of event, each naming what happens in the frame, where the camera is, what the light is doing and the crops it has to survive, so it can be shot from rather than argued with.`,
      argument: [
        "The asset log holds twelve rows. Three are not photography; the other nine are crops, recrops, cuts or setups of the same night, so the kit is not the most expensive ask on the list, it is the one that closes the list. Row 5 is the one that changes the shape of the answer: it is the media the live demo event is seeded from.",
      ],
    },
    {
      id: "record",
      title: "The six facts on every entry",
      lede: `What question 1 would add to a photograph's entry, running on ${F.candidates} staged frames with a test that refuses one missing a field. The rule is not a proposal here; it is a suite you can watch pass.`,
      argument: [
        "people is the field that does the work. No free tier supplies a model release, so an entry reading identifiable cannot sit on a page that makes a claim, and the suite refuses one without a caution on it.",
      ],
    },
    {
      id: "runbook",
      title: "Re-making the two recorded reels",
      lede: "Swapping the photographs breaks both recorded loops, and the engine renders in the host's own browser, so re-making them is a person at a machine with Chrome. It is not, however, a code edit.",
      argument: [
        "Round one said re-rendering a recorded reel needs an edit to the parity page's hardcoded fixtures. It does not: both recipes are already in that page's clip-set picker, in order, and runbook.test.ts keeps it true.",
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
      id: "vertical",
      // The id stays `vertical` (the URL, the walk steps and every note join on
      // it); only the word a reviewer reads changed, to the one the board's
      // ledes now use (the clarity round, 2026-09-15).
      label: "Kind of event",
      options: [
        { id: "all", label: "All" },
        { id: "weddings", label: F.vertical.weddings },
        { id: "birthdays", label: F.vertical.birthdays },
        { id: "corporate", label: F.vertical.corporate },
        { id: "festivals", label: F.vertical.festivals },
        { id: "trips", label: F.vertical.trips },
      ],
      default: "all",
    },
    {
      id: "route",
      label: "Route",
      options: [
        { id: "mix", label: "Mix" },
        { id: "ours", label: "Ours" },
        { id: "licensed", label: "Licensed" },
      ],
      default: "mix",
    },
    {
      id: "geometry",
      label: "Geometry",
      options: [
        { id: "card", label: "Card 4:5" },
        { id: "share", label: "Share 1200x630" },
      ],
      default: "card",
    },
  ],

  lookFirst: [
    {
      section: "plan",
      note: "What to buy, which is the only part of the board you have to agree with. One month covers five kinds of event, and the conference rooms are the only money paid per photograph.",
    },
    {
      section: "sheet",
      state: { vertical: "corporate" },
      note: "The places, filtered to corporate and conferences, the one kind of event nothing free can fill. Watch the cards that flag nothing for it: that flag is the gap the money exists to close.",
    },
    {
      section: "surface",
      note: "The same frames at the real card size on the real background, at true pixels. A grid of thumbnails flatters everything; this is where a frame that cannot take a tall crop stops flattering.",
    },
    {
      section: "apply",
      note: "Press The exposure, then open the blog in a new tab. That is the site with every photograph we cannot name taken out of it, which is the argument in one glance.",
    },
    {
      section: "bridge",
      state: { route: "licensed", geometry: "card" },
      note: `The staged batch on all ${F.posts} posts. Read the two red rows at the bottom: the conference post and the office party are the two the free corpus cannot fill at all.`,
    },
    {
      section: "bridge",
      state: { route: "mix" },
      note: `The recommendation, on the same posts. ${F.mixIds} id and ${F.mixPosts} covers change the week it is chosen; everything else is marked as owed rather than quietly left as it is.`,
    },
    {
      section: "callsheet",
      note: "What the shoot actually is, frame by frame, and the nine rows of the asset log one night closes. The last question is under this one.",
    },
  ],

  notes: [
    {
      section: "sheet",
      state: { vertical: "corporate" },
      text: "A card with no thumbnails for the chosen kind of event falls back to one it does have and says so in the same glance. The flag is the finding, not a rendering failure: corporate is what every catalogue has least of, paid or free.",
    },
    {
      section: "bridge",
      state: { route: "licensed" },
      text: `Licensed fills ${F.postsFilled} of the ${F.posts} posts on the board, and ${F.postsUnderRule} once question 1's rule applies, because ${F.barredIds} carry a readable face with no signed permission.`,
    },
    {
      section: "surface",
      text: "None of these frames is licensed to us. iStock serves its search thumbnails without a watermark at 612 px, so a frame here can read as a finished card when it is only a preview.",
    },
  ],

  links: {
    bible: [1, 18],
    spec: "docs/specs/media-kit.md",
    pages: [
      {
        label: "Home",
        path: "/",
        note: "the footer strip carries a frame on every page",
      },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the chrome, before a scroll",
      },
      { label: "Help", path: "/help", note: "the nav panel's two frames" },
      {
        label: "Contact",
        path: "/contact",
        note: "the footer again, on a short page",
      },
      {
        label: "The blog",
        path: "/blog",
        note: "the library, where the bridge is per post",
      },
      {
        label: "A post",
        path: "/blog/qr-code-for-wedding-photos",
        note: "the article hero, swapped through the canonical link",
      },
      {
        label: "The album feature",
        path: "/features/album",
        note: "a feature mock reading the ids",
      },
    ],
  },
});
