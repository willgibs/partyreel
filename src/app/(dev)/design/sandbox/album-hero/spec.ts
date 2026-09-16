import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE ALBUM PAGE'S HERO, AS DATA (the migration wave, 2026-09-15; the asks
 * rewritten in plain words the same night, the clarity round).
 *
 * Nothing here is new argument. Every ask, candidate, departure and asset is
 * round one's, moved out of `board.tsx`'s `BoardMeta` prop strings so that the
 * template, the desk's queue, the record and the review ledger read ONE list.
 * What changed is where a reviewer meets them: the verdict and the five calls
 * are now the first screen instead of the last.
 *
 * ★ AN ASK CARRIES ITS OWN CONTEXT, and that is what the clarity round bought.
 * Will's first review through the desk stopped at asks that were labels with
 * token options ("The headline step: lg | xl"): "when you use very technical
 * terms or nicknames from spots in these reports, it makes me have to go deep
 * into the track to gain the relevant context and even begin understanding the
 * question being asked". So every ask here is a real question, says what the
 * thing is and where it lives on the site, says where to look, and labels each
 * option in words with what choosing it would do. The five ask ids and their
 * ten option ids are UNCHANGED, because the ledger joins on them: `lg`, `xl`,
 * `both`, `ship`, `pulse`, `arrival`, `lockup`, `settled`, `page`, `voice`.
 * The nicknames this board used to ask in are glossed or gone: the vent is
 * "the point in the middle", the lockup is "the page's own words", the
 * cinema-to-paper cut is "the switch from the dark chapters to the light ones".
 *
 * TWO THINGS ARE SAID HERE THAT ROUND ONE SAID IN TWO PLACES, and both are
 * reconciliations rather than changes. The no-script frame was a question
 * buried inside a departure ("rule on whether the no-script frame should be the
 * settled album anyway") while the Record counted it among the board's asks; it
 * is an ask now, and the departure keeps the trade without the question. And
 * the width call's three paragraphs of arithmetic did not fit `askBecause`, so
 * the number that DECIDES it stays in the ask and the working moved to the
 * album section's argument, where a reader who disagrees will look for it.
 *
 * ★ THE DOCK'S TWO SWITCHES ARE THE ASKS' OWN OPTIONS. `step` mirrors the
 * headline ask and `columns` mirrors the width ask, so picking an option on the
 * review card previews it on the board. That needs the two id sets to be EQUAL
 * (registry.test.ts checks it), which is why the album switch's second position
 * is `both` and no longer `wide`: a control's ids bend to the ask's, never the
 * other way round, because the ask's are the ledger's.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads this for its header, so a spec that imported React or
 * the board's sheet would drag a client tree into a server render.
 */
export const ALBUM_HERO = defineBoard({
  id: "album-hero",
  title: "The album page's hero",

  question:
    "Should the album feature page open with a field of photographs flying out from the middle for ever, and the real live album wide and calm below it?",

  round: {
    n: 2,
    date: "2026-09-15",
    changed:
      "The five asks rewritten in plain words: a real question, what the thing is, where to look, and each option labelled with what choosing it would do. The evidence carries the same words, and the dock's two switches are now the asks' own options. No candidate, number or recommendation changed.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-15",
      changed:
        "The field arrived from the home hero and lost its centre: a birth at a point, a vent where the QR plate was, the page's own shipped lockup over it, and the real guest album composed and calm below.",
    },
  ],
  context:
    "Three rounds of the hero-burst track built this field for the HOME page, where it was one of four candidates and lost. Will killed it there and sent it here in the same breath: the background of images emanating would be beautiful for the album page's hero, looped, with the album itself wide and calmer below it and no QR code. So the field arrived whole and lost its centre, and what it has to survive is no longer a home page's promise but a feature page's, with a chapter and a half of shipped route under it.",

  verdict: {
    recommendation:
      "Yes: the field of photographs as the hero, looping for ever with the page's own words held clear of every frame, and the real guest album wide and calm below it.",
    because:
      "An album that is alive is one that things are arriving into, from every direction, never finishing, and that is the one thing a still picture of a grid cannot say. Splitting the page in two is what keeps both halves readable: the hero is the feeling and carries all of the movement, the album is the product and carries almost none.",
    overrule:
      "If a field that never stops disturbs the page's switch from dark chapters to light ones, a chapter below, the hero is too loud, and the answer is a slower field rather than a smaller one.",
  },

  asks: [
    {
      id: "headline",
      question: "How big should the headline over the field be?",
      context:
        "The page opens with a small eyebrow, a headline, one sentence and two buttons, over the field of photographs. The site's type ladder offers this page two sizes for that headline: the one the live page ships today, and one step up. The field is drawn around whatever the words occupy, so this choice changes the picture and not only the type.",
      look: "The Hero section with the Headline switch in the dock set each way. Watch the clear space around the words, and how many photographs still have room to fly past them.",
      options: [
        {
          id: "lg",
          label: "Today's headline",
          means:
            "The page keeps the size it ships; the field keeps the most room to fly in, and the album below stays the loudest thing on the page.",
        },
        {
          id: "xl",
          label: "One step louder",
          means:
            "The headline grows one step, claims about 80 px more clear space in every direction, and the field launches from fewer directions.",
        },
      ],
      recommended: "lg",
      because:
        "This is the one choice that changes the composition rather than the styling, because the field is redrawn around the words. The louder headline takes about 80 px of clear space in every direction, and on a phone that stops frames flying from more of the directions around the middle.",
      overrule:
        "If this page should promise as loudly as the home page does, the louder headline is the better sentence, and the field pays for it in frames you can watch.",
      evidence: "hero",
      state: { canvas: "desktop" },
      control: "step",
    },
    {
      id: "width",
      question: "How wide should the live album be on a laptop?",
      context:
        "The live album is the page a guest and the host actually open: one grid of every photo and video. It ships as two columns inside a 632 px column, at every screen size, because it was designed on a phone, so a laptop shows a phone's album down the middle. Widening it is two changes together: more columns, and a wider column for the whole guest page.",
      look: "The Album section at 1440, with the Album switch in the dock set each way. Count the photographs on screen at once, and see how large a face reads in one tile.",
      options: [
        {
          id: "ship",
          label: "As it ships",
          means:
            "Two columns in a 632 px column at every screen size, about 314 px a tile, which is what a guest opens today.",
        },
        {
          id: "both",
          label: "Wider: four columns",
          means:
            "Four columns on a laptop inside a wider guest page, about 276 px a tile, and roughly twice the photographs in a screenful.",
        },
      ],
      recommended: "both",
      because:
        "What decides the size of a tile is the column the album sits in, before the number of columns does: the guest page caps that column at 632 px at every screen size. So the candidate is both declarations, the column rule and a wider cap for the laptop.",
      overrule:
        "More columns without the wider page is worse than what ships: the same 632 px becomes four tiles of about 156 px. Both changes, or neither.",
      evidence: "album",
      state: { canvas: "desktop" },
      control: "columns",
    },
    {
      id: "life",
      question: "What should show that the album is filling live?",
      context:
        "The album fills while the party is still going, and the page has to say so. Today it says it with one small green dot beside the words Live now, pulsing every two seconds, and nothing else on this half of the page moves at all. The product's real behaviour is a new photograph landing at the top of the grid every few seconds as a guest uploads it.",
      look: "The Album section, at the top right of the album beside the words Live now. The landing photograph is a proposal and is not built on this board, so judge whether the dot says enough on its own.",
      options: [
        {
          id: "pulse",
          label: "The green dot, as it ships",
          means:
            "The album's only live signal stays the small pulsing dot, and the hero above keeps all of the movement on the page.",
        },
        {
          id: "arrival",
          label: "A photograph landing at the top",
          means:
            "A new tile arrives at the head of the grid every few seconds, which is truer to the product and the thing most likely to fight the hero.",
        },
      ],
      recommended: "pulse",
      because:
        "Splitting the page in two is what keeps both halves readable: the hero carries the movement and the album carries almost none. A landing photograph is the truer demonstration, and it is also the one thing likely to compete with the field above it.",
      evidence: "album",
    },
    {
      id: "no-script",
      question: "What should the hero show when the animation cannot run?",
      context:
        "Search crawlers, and readers with JavaScript turned off, never get the moving field. They get the headline, the sentence and the buttons on the dark ground and no photographs at all, because every frame starts collapsed at the middle and only the animation opens it out. The alternative paints the album already spread out and still.",
      look: "Turn Reduce Motion on in your system settings and reload the Hero section: the album standing still around the middle is exactly what the second option would paint for everyone.",
      options: [
        {
          id: "lockup",
          label: "Words alone, as it is today",
          means:
            "A reader with no JavaScript gets the headline, the sentence and the buttons on the dark ground, and no photographs.",
        },
        {
          id: "settled",
          label: "The album, spread out and still",
          means:
            "Everyone's first paint is the album already spread around the middle, which then snaps back to the middle and blooms on every load.",
        },
      ],
      recommended: "lockup",
      because:
        "Nothing that carries meaning is hidden: the words and the buttons are ordinary markup that never moves, and the photographs are decoration. Painting the album settled for everyone costs a visible snap back to the middle on every load, which is worse to look at rather than better.",
      overrule:
        "If a page about photographs showing a crawler none at all is not acceptable, the settled album is the answer.",
      evidence: "hero",
    },
    {
      id: "copy",
      question: "Whose words should the hero say?",
      context:
        "The words over the field are the live album page's own, printed exactly as the site says them today: Every photo, from every guest, in one place. A separate exploration, the brand voice board, is rewriting the site's sentences and proposes a new line for this page. This board proposes none of its own, because the field is what it argues.",
      look: "The Hero section: the eyebrow, the headline and the sentence over the field are the live page's, unchanged. Read them as a visitor arriving from the nav would.",
      options: [
        {
          id: "page",
          label: "The live page's own words",
          means:
            "The hero keeps the page's shipped eyebrow, headline and sentence, and whatever the voice board lands later reaches this hero for free.",
        },
        {
          id: "voice",
          label: "Hold for the brand voice line",
          means:
            "This hero waits for the voice exploration to land a new sentence for the album page, and is judged on that line instead.",
        },
      ],
      recommended: "page",
      because:
        "The field is this board's argument and the sentence is the page's. Every line on the site is open to a later round, so the voice board's ruling reaches this hero on its own without this board proposing a second version of the same sentence.",
      evidence: "hero",
    },
  ],

  candidates: [
    {
      id: "hero",
      name: "The hero",
      recommended: true,
      rationale:
        "One field, born at a point and radiating around the whole compass and forward out of the screen, looping with no end, because a live album has no end. Fifty-two frames at 1440 and forty-four at 375, nineteen to twenty-seven on screen at once, every one a photograph.",
    },
    {
      id: "album",
      name: "The album, under it",
      recommended: true,
      rationale:
        "The shipped guest album composed rather than drawn: GuestMasonry, MediaTile, the lightbox trigger, the host's own event chrome (bible 4), and the product's own entrance as its only motion. It argues one production change and shows it as a switch rather than asserting it.",
    },
  ],

  departures: [
    {
      id: "hero-shadow",
      from: 10,
      text: "The frames carry a drop shadow, the light spec's LIFT family at four times the offsets, because LIFT separates two cards a pixel apart and these are separated by a depth axis measured in hundreds of units. It is a shadow and never a lamp: no light source is added, no photograph is darkened, and there is no scrim anywhere on the hero.",
      evidence: "hero",
    },
    {
      id: "no-script-frame",
      from: 13,
      text: "Decorative layer only. The field's first frame, every card collapsed on the vent at no size, lives inside prefers-reduced-motion: no-preference, the default match, so with JavaScript off the hero paints as the lockup alone on cinema until the loop takes over. Nothing that carries meaning is gated: the type is plain markup at full opacity and the field is aria-hidden.",
      evidence: "hero",
    },
    {
      id: "outside-in",
      from: "precedent",
      text: "The production component is changed from the OUTSIDE: album.css drives GuestMasonry's column count through a variable rather than forking the component, so the candidate is composed and nothing under src/components/guest was edited. The diff it argues for is two declarations, and the album section carries the arithmetic for both.",
      evidence: "album",
    },
  ],

  assets: [
    {
      what: "24 event photographs as 512 x 512 squares",
      spec: "One grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals, framed tight enough to read at 90 px (a face, two hands, a glass, a sparkler, a first dance), never a wide room shot.",
      replaces:
        "the 12 landscape stand-ins the field cycles (FRAMES in the home hero's shared.tsx). The same 24 serve the field and the wide album grid.",
      row: 2,
    },
    {
      what: "11 more of the same as 4:5 portraits",
      spec: "512 x 640, the same grade; recrops of the 24 are fine.",
      replaces:
        "one landscape stand-in per 4:5 slot the field lays out. Guests shoot vertical and eleven of the twelve stand-ins are landscape, which is why the wide grid reads flatter than a real album does.",
      row: 9,
    },
    {
      what: "2 short clips as album tiles",
      spec: "6 to 10 s, 4:5 or 9:16, muted, under 2 MB each, poster frame included.",
      replaces:
        "two photographs in the grid, so it can show a real video tile with the corner play badge the guest album ships. Every tile is a photograph today because MediaTile renders a real video element and pointing one at a jpg shows an empty box.",
    },
  ],

  sections: [
    {
      id: "hero",
      title: "The hero",
      lede: "The field alone at a real screen size, looping for ever: photographs are born at a point in the middle and fly out past you, and the page's own words sit in a space no photograph ever enters.",
      argument: [
        "Every frame is born at a point at the centre and radiates around the whole compass AND forward, out of the screen: a near frame grows until it wipes past the edge while a far one stays small and slides out, so the field reads as depth rather than as a scatter. Nothing announces itself and nothing resolves, because a live album does not resolve either.",
        "The quiet zone is the condition the field is DRAWN FROM rather than a hope about the layout: one keep-out box per block of the lockup, measured to its ink, and each card is given, once, the progress after which its own box is permanently clear of every block. That is what lets the media stay at 100 percent with no scrim anywhere on the hero (bible 1). It was re-proved on the running field at all four canvas-and-step combinations: 2965 card instants against the ink, zero overlaps.",
        "The lockup is /features/album's SHIPPED lockup, measured off the real page rather than restyled: PageHero's max-w-3xl measure, the lg ramp's text-7xl at leading-[1.0], the text-lg subhead at max-w-xl, the two shipped buttons untinted, and the real eyebrow.",
      ],
    },
    {
      id: "album",
      title: "The live album, wide",
      lede: "The real guest album, the shipped component itself rather than a picture of one: the same grid, the same tiles, the host's own name above it, and almost no movement, so it never competes with the hero.",
      argument: [
        "The width arithmetic, measured in the live DOM. GuestMasonry is rendered in exactly ONE place in the product, live-gallery.tsx inside event-experience.tsx, whose container is mx-auto w-full max-w-2xl flex-1 px-5 py-8: 42rem less two 20 px pads is 632 px of content at every viewport, 1440 included. With columns-2 at a 3 px gap that is a tile of about 314 px; three columns would be about 209 px; and the responsive rule on its own would give about 156 px at xl. A laptop cap of max-w-6xl gives 1112 px of content and about 276 px at four columns, which is the figure the ask quotes.",
        "This board's own frame is a different width again, and the stage says so: 1440 less px-16 is 1312, capped at 1180, less the browser frame's padding and its hairline each side, which is 1154 px. Its two-column tile is about 576 px and its four-column tile about 286 px. The stage is therefore a picture of the END STATE, both declarations together, and not of the column rule alone.",
        "Bible 4: a guest surface is the HOST'S. The chrome above the grid is the event's own identity in the shape the shipped guest page uses (the event name in the heading face, the byline, then the stats line), with no Partyreel mark anywhere inside the frame. The one thing that is ours is the browser frame around it, which is the marketing page's furniture and not the album's.",
      ],
      wiring: [
        "If the width ask lands it is two declarations, in two files, and either alone is worse than shipping: columns-2 becomes columns-2 md:columns-3 xl:columns-4 in src/components/guest/guest-masonry.tsx, AND the whole guest column gets a wider laptop cap than max-w-2xl in src/components/guest/event-experience.tsx. The cap carries the event header, the reel card and the action row with the grid, so it is one visual change to the guest page rather than one to the album.",
      ],
    },
    {
      id: "page",
      title: "The page, whole",
      lede: "The hero, the album, then every section the live page ships, in its order: the only place both animations run at once, and the only place to judge the switch to the light chapters under a moving hero.",
      argument: [
        "The cut is the thing to look at. QualitySection winds the dark chapter down, PaperChapter flips the token subtree light on a hard hairline, and six desk sections run on paper before the close returns to cinema. If the field is too loud, the symptom shows up HERE, a chapter and a half below the hero, and not in the hero alone.",
        "The stage mirrors the route BY HAND and deliberately: a route module is not something to import from a board, because it carries its own metadata and Next owns its module graph. Two things are left out, both of them chrome the layout owns rather than the page: the BreadcrumbJsonLd, which is invisible, and the overlay MarketingHeader, whose sticky position would resolve against the lab page and ride down the board instead of sitting over the hero.",
        "The phone reading of the tail is approximate, and the reason is the shell. A Tailwind breakpoint prefix inside a Stage reads the REAL browser viewport and not the canvas, so inside the 375 canvas on a wide window the shipped sections resolve their md and lg rules as DESKTOP and only their widths are truly 375. The cut, the order and the type sizes read correctly; the tail's per-section vertical rhythm does not, which is why the phone judgement here is the hero and the cut rather than the spacing below them.",
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
    /* ★ THE TWO SWITCHES BELOW WEAR THE ASKS' OWN WORDS, ids included (the
       clarity round): a reviewer who has just read "Wider: four columns" on the
       review card has to find that same phrase on the dock, or the pick and the
       preview are two vocabularies. `columns`' second position used to be
       `wide`; it is `both` because the width ask's option is `both`, and a
       control's ids bend to an ask's rather than the other way round. Both
       labels are kept short on purpose: a two-option Toggle does not wrap, so a
       long pair would push the dock into a sideways scroll at 375. */
    {
      id: "step",
      label: "Headline",
      options: [
        { id: "lg", label: "Today's headline" },
        { id: "xl", label: "One step louder" },
      ],
      default: "lg",
    },
    {
      id: "columns",
      label: "Album",
      options: [
        { id: "ship", label: "As it ships" },
        { id: "both", label: "Wider: four columns" },
      ],
      default: "both",
    },
  ],

  lookFirst: [
    {
      section: "hero",
      state: { canvas: "desktop", step: "lg" },
      note: "Thirty seconds with nothing else on screen, which is the one check no tool can run. The album should never stop arriving, and no word should ever sit on a photograph.",
    },
    {
      section: "hero",
      state: { step: "xl" },
      note: "The same field against the louder headline. This is the ask that changes the picture rather than the styling: the field is redrawn, and the clear lane beside the middle narrows.",
    },
    {
      section: "album",
      state: { step: "lg", columns: "ship" },
      note: "The album as the component ships it, at two columns. A 632 px strip down the middle of a laptop is what the product gives today.",
    },
    {
      section: "album",
      state: { columns: "both" },
      note: "The candidate: the same component at four columns, in a frame about as wide as the widened page would give. Roughly twice the photographs in a screenful.",
    },
    {
      section: "page",
      note: "The only stage where both animations run at once. Scroll to the switch from the dark chapters to the light ones with the field still flying a chapter and a half above it.",
    },
    {
      section: "page",
      state: { canvas: "phone" },
      note: "The hero and the switch to the light chapters at 375. The tail's vertical rhythm is approximate here and the hero and the switch are not; the argument under this section says why.",
    },
  ],

  notes: [
    {
      section: "album",
      state: { canvas: "phone" },
      text: "The Album switch is a no-op at 375, and that is correct rather than broken: the candidate's rule is two columns on a phone and four on a laptop, so both positions draw the shipped two here.",
    },
    {
      section: "hero",
      text: "An occluded or background tab suspends rAF outright, so the field reads as an empty canvas until the tab is fronted. If the photographs are missing, front the tab before concluding anything about the field.",
    },
  ],

  links: {
    bible: [1, 4, 10, 13, 17, 21, 22],
  },
});
