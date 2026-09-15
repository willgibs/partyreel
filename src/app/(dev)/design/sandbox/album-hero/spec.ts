import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE ALBUM PAGE'S HERO, AS DATA (the migration wave, 2026-09-15).
 *
 * Nothing here is new argument. Every ask, candidate, departure and asset is
 * round one's, moved out of `board.tsx`'s `BoardMeta` prop strings so that the
 * template, the desk's queue, the record and the review ledger read ONE list.
 * What changed is where a reviewer meets them: the verdict and the five
 * one-word calls are now the first screen instead of the last.
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
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads this for its header, so a spec that imported React or
 * the board's sheet would drag a client tree into a server render.
 */
export const ALBUM_HERO = defineBoard({
  id: "album-hero",
  title: "The album page's hero",

  question:
    "The burst's field, killed as the home hero, becomes the live album's hero: emanating for ever, no code, and the product itself wide and calm below it. Is this the top of /features/album?",

  round: {
    n: 2,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. The verdict and the five calls are the first screen, the three readings became declared sections with anchors and an executable walk, and the stages are the kit's. No candidate, number or recommendation changed.",
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
      "Yes: the field as the album page's hero, looped for ever with the page's own lockup in a quiet zone no frame enters, and the real guest album composed and calm below it.",
    because:
      "An album that is alive is an album things are arriving into, from every direction, with no resolution, and that is the one thing a still picture of a grid cannot say. Splitting the page in two is what keeps both halves readable: the hero is the feeling and carries all of the movement, the album is the product and carries almost none.",
    overrule:
      "If a field that never resolves disturbs the cinema-to-paper cut a chapter and a half below it, the hero is too loud, and the answer is a slower clock rather than a smaller field.",
  },

  asks: [
    {
      id: "headline",
      question: "The headline step",
      options: ["lg", "xl"],
      recommended: "lg",
      because:
        "The one choice that changes the composition rather than the styling, because the field is re-solved against the lockup the step draws. lg leaves the album the canvas; xl takes about 80 px of quiet zone in every direction, and at 375 that drops a further slice of the compass out of the pool.",
      overrule:
        "If this page's promise should be as loud as the home page's, xl is the louder sentence and the field pays for it in watchable directions.",
      evidence: "hero",
    },
    {
      id: "width",
      question: "The album's width",
      options: ["both", "ship"],
      recommended: "both",
      because:
        "The CONTAINER decides the tile before the column count does: the guest page caps its whole column at max-w-2xl with px-5, so the album is 632 px wide at every viewport and columns-2 makes two tiles of about 314 px. The candidate is the column rule AND a wider laptop cap.",
      overrule:
        "The column rule on its own is worse than what ships: it cuts the same 632 px into four tiles of about 156 px. Both declarations, or neither.",
      evidence: "album",
    },
    {
      id: "life",
      question: "The album's life",
      options: ["pulse", "arrival"],
      recommended: "pulse",
      because:
        "It ships with one live signal, a 6 px green dot pulsing every 2 s, and nothing else. The product's real behaviour is a new tile landing at the head of the album every few seconds with its green check, which is the truer demonstration and the thing most likely to fight the hero.",
      evidence: "album",
    },
    {
      id: "no-script",
      question: "The no-script hero",
      options: ["lockup", "settled"],
      recommended: "lockup",
      because:
        "The collapsed first frame sits inside prefers-reduced-motion: no-preference, which is the DEFAULT match, so a crawler and a reader with JavaScript off get the lockup alone on the cinema ground and no photographs. The reduced-motion reader is the one who gets the album settled and whole.",
      overrule:
        "Painting the album settled for everyone costs a snap back to the vent on every load, which is worse to look at rather than better.",
      evidence: "hero",
    },
    {
      id: "copy",
      question: "The hero's copy",
      options: ["page", "voice"],
      recommended: "page",
      because:
        "The hero renders /features/album's shipped eyebrow, h1 and subhead verbatim from feature-pages.ts. Bible 21 leaves every line open and the brand-voice board proposes a new subhead; this board proposes nothing of its own, because the field is the argument and the sentence is the page's.",
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
      lede: "The field alone at a real viewport, looped for ever, with nothing at the centre but the vent the album comes out of and the page's own lockup in a quiet zone no frame ever enters.",
      argument: [
        "Every frame is born at a point at the centre and radiates around the whole compass AND forward, out of the screen: a near frame grows until it wipes past the edge while a far one stays small and slides out, so the field reads as depth rather than as a scatter. Nothing announces itself and nothing resolves, because a live album does not resolve either.",
        "The quiet zone is the condition the field is DRAWN FROM rather than a hope about the layout: one keep-out box per block of the lockup, measured to its ink, and each card is given, once, the progress after which its own box is permanently clear of every block. That is what lets the media stay at 100 percent with no scrim anywhere on the hero (bible 1). It was re-proved on the running field at all four canvas-and-step combinations: 2965 card instants against the ink, zero overlaps.",
        "The lockup is /features/album's SHIPPED lockup, measured off the real page rather than restyled: PageHero's max-w-3xl measure, the lg ramp's text-7xl at leading-[1.0], the text-lg subhead at max-w-xl, the two shipped buttons untinted, and the real eyebrow.",
      ],
    },
    {
      id: "album",
      title: "The live album, wide",
      lede: "The shipped guest album composed, not drawn: the same masonry, the same tiles, the same lightbox, with the host's own chrome and almost no motion, so it never competes with the hero.",
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
      lede: "The hero, the album, then every section /features/album ships in its shipped order: the one stage where both animations run at once, and the only place the cinema-to-paper cut is judged under a running field.",
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
    {
      id: "step",
      label: "Headline",
      options: [
        { id: "lg", label: "lg" },
        { id: "xl", label: "xl" },
      ],
      default: "lg",
    },
    {
      id: "columns",
      label: "Album",
      options: [
        { id: "ship", label: "2 columns" },
        { id: "wide", label: "Responsive" },
      ],
      default: "wide",
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
      note: "The same field against the louder lockup. This is the ask that changes the composition rather than the styling: the field is re-solved and the corridor beside the vent narrows.",
    },
    {
      section: "album",
      state: { step: "lg", columns: "ship" },
      note: "The album as the component ships it, at two columns. A 632 px strip down the middle of a laptop is what the product gives today.",
    },
    {
      section: "album",
      state: { columns: "wide" },
      note: "The candidate: the same component at four columns, in a frame about as wide as the widened cap would give. Roughly twice the photographs in a screenful.",
    },
    {
      section: "page",
      note: "The only stage where both animations run at once. Scroll to the cinema-to-paper cut with the field still flying a chapter and a half above it.",
    },
    {
      section: "page",
      state: { canvas: "phone" },
      note: "The hero and the cut at 375. The tail's vertical rhythm is approximate here and the hero and the cut are not; the argument under this section says why.",
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
