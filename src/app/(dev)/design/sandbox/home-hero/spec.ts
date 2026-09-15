import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE HOME HERO BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15).
 *
 * Nothing here is new argument. Every candidate, rationale, copy proposal,
 * departure and asset is the round-four board's, moved out of three places it
 * was scattered across (`board.tsx`'s prose block, the hand-rolled `ConceptMeta`
 * table, and the metadata block each concept file declared beside its engine)
 * into the one list the template, the desk, the record and the review ledger all
 * read. What changed is where a reviewer meets it: the verdict and the four
 * one-word calls are the first screen instead of a toggle and three stages.
 *
 * ★ THE CONCEPT FILES NOW DECLARE ONLY `{ id, render }`. The metadata that used
 * to sit under each engine is HERE, because a candidate's rationale cannot live
 * in a `.tsx` module: `registry.ts` is imported by a SERVER page and by node
 * tests, so anything it reaches has to be pure data. The engines themselves are
 * untouched, which is the whole contract of the wave: it moves the argument, it
 * does not re-argue it.
 *
 * ★ AND THE COPY PROPOSALS ARE THE SINGLE SOURCE FOR THE RENDERED LOCKUPS.
 * `copyFor` in shared.tsx reads them back out of this file, so the words on the
 * card, the words in the hero and the words in the Words section cannot drift
 * from each other the way three hand-kept copies did.
 */
export const HOME_HERO = defineBoard({
  id: "home-hero",
  title: "The home hero",

  question:
    "The hero is the QR becoming the album. Which composition says that: the album branching out of the code, the guest whose scan causes it, or the album closing into it?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. The three concepts are candidates carrying their own copy proposals, the concept switch is a declared control so a link opens one, and the shipped hero is back at the bottom as the reference. No concept, number or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The two Will loves continued (the source's emanating direction, the scan with its phone ruled in), the inflow added as the honest test of the reverse reading, the burst and the river killed as heroes and moved to their own boards.",
    },
    {
      n: 3,
      date: "2026-09-15",
      changed:
        "Three variations off the ruled source, one file each, built by three tracks in parallel against one contract.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "The question sharpened to the QR becoming the album, answered three ways. Will ruled the source: definitely my favorite direction.",
    },
    {
      n: 1,
      date: "2026-09-12",
      changed:
        "Four grids answering where the type lives so no photograph is dimmed. Will's read: bland, generic, and none of them captured the QR.",
    },
  ],
  context:
    "Round one measured the defect the board exists to fix: the shipped hero carries three darkening layers over a wall of 24 tiles at desktop and a fourth below sm, because white type has to survive over whichever tile the 55 second drift parks under it, so bible 1 is inverted and not one photograph reads as a photograph. Its four grids fixed that and were still bland, because none of them was about the one thing Partyreel is. Round two asked the sharper question instead, and the answer has been iterating on one composition ever since.",

  verdict: {
    recommendation:
      "The source, with the scan as the live second. The inflow answered the question it was built for and the answer is no, so it goes to a surface where the reader is already moving.",
    because:
      "The source is the only composition whose shape is the sentence: the real demo code holds the exact centre at scanning size and the album branches out of it and never stops. Its frames also grow as they travel, so the album gets more legible the longer you look, where the inflow's shrink to nothing at the object you most want looked at.",
    overrule:
      "If the cause matters more than the result, the scan is already built and Will has ruled its phone in. Nothing on the board argues for the inflow as the home hero.",
  },

  asks: [
    {
      id: "direction",
      // Not "The home hero": the desk queues an ask under its board's name, and
      // an ask named after its board reads as the same words twice in a row.
      question: "The direction",
      options: ["source", "scan", "inflow"],
      recommended: "source",
      because:
        "Will loves the source and the scan. The inflow was built to test whether the truer reading presents as well, and its own verdict is that it reads in motion and not in a still, where the geometry is the source's picture and only the words tell them apart.",
      overrule:
        "If the hero should show a guest rather than a result, the scan says the same thing with the cause in the frame.",
      evidence: "concepts",
    },
    {
      id: "headline",
      question: "The headline",
      options: ["ruled", "proposed"],
      recommended: "ruled",
      because:
        "The site thesis is one line for the whole site and every concept reads with it. Each proposal is sharper about its own mechanism, which is exactly what makes it a per-concept headline rather than the home page's.",
      overrule:
        "Copy is open (bible 21). If the winning concept's own line reads better in its own picture, it rides in with the concept.",
      evidence: "words",
    },
    {
      id: "lockup",
      question: "The lockup's axis",
      options: ["centred", "left"],
      recommended: "centred",
      because:
        "The code owns the axis and the corridor is symmetrical about it, so the type lives above and below rather than beside. Every other marketing hero goes left, which is precedent and not law.",
      overrule:
        "If the home hero has to match the rest of the site, the type moves beside the corridor and all three compositions change shape.",
      evidence: "concepts",
    },
    {
      id: "count",
      question: "The live count under the code",
      options: ["keep", "cut"],
      recommended: "keep",
      because:
        "282 photos from 48 guests climbing to 312 is a stand-in and must not ship as invented data. At wiring it reads the demo event's real total and each tick is one real upload.",
      overrule:
        "If a hero may not carry a live number at all, the line goes; the source and the scan hold without it and the inflow loses its clearest signal.",
      evidence: "concepts",
    },
  ],

  candidates: [
    {
      id: "source",
      name: "1. The source",
      recommended: true,
      rationale:
        "The scan is where everything starts, so the hero makes that literal: the real demo QR holds the exact centre, still and scannable, and the album branches out of it and never stops. Round four made the corridor a volume rather than a plane, and put the type in a lane measured off it.",
      proposed: {
        h1: "The whole event comes back to you.",
        subhead:
          "Guests scan the code. Every photo and video they take lands in your album, with no app and no account.",
        secondary: "See a real album",
      },
      departures: [
        {
          id: "source-clean",
          from: "precedent",
          text: "The centred lockup is its only departure, and it is the board's rather than this concept's. Everything else is inside the bible: media at 100 percent with no scrim anywhere, the h1 in the markup at full opacity, every animation inside the reduced-motion block with the deployed corridor as the rest state, cinema and unlit with no lamp.",
          evidence: "concepts",
        },
      ],
    },
    {
      id: "scan",
      name: "2. The scan",
      rationale:
        "The source's corridor with the cause in the frame, and since Will ruled the phone in it is the phone that does it: a hand rises, the camera finds the code across the room, the capture fires, the code blooms in answer, and only then does the album branch out. One beat, in causal order.",
      proposed: {
        h1: "Every camera in the room, one album.",
        subhead:
          "Guests point a camera at the code, and their photos and videos land in your album, with no app and no account.",
        secondary: "See what it made",
      },
      departures: [
        {
          id: "scan-phone",
          from: "precedent",
          text: "The phone is ruled in rather than asked, and three things hold it to a camera rather than to software, because a phone that reads as an app would break the pitch: no screen chrome but the notch, the device cropped by two frame edges so it is a held object and not a mockup, and what it looks at is visibly the same code standing across the room.",
          evidence: "concepts",
        },
        {
          id: "scan-light",
          from: 1,
          text: "Two emissive things on a hero that is cinema and unlit by standing ruling: the phone's screen, which lights itself and its own bezel and nothing else, and one white capture bloom behind the plate, spent in 400 ms once per turn of the album. Both brighten and neither darkens, so every photograph is still at 100 percent and there is no scrim.",
          evidence: "concepts",
        },
      ],
      assets: [
        {
          what: "A hand-and-phone cutout",
          spec: "PNG with alpha, 1200 px on the long edge, the SCREEN AREA fully transparent so the viewfinder composes underneath and stays live; shot from just behind the holder's shoulder, the phone held up and angled away to the right, in low warm event light so the body is nearly a silhouette with one highlight along the edge; two variants, a one-handed grip and a two-handed one. The device is built in three flat layers for exactly this swap, so the cutout replaces the body and the rim and nothing else moves.",
          replaces:
            "the drawn device (.hhc-phone in sandbox/home-hero/scan.tsx).",
          row: 8,
        },
      ],
    },
    {
      id: "inflow",
      name: "3. The inflow",
      rationale:
        "The mirror, built to answer one question honestly: is the truer sentence, guest photographs going INTO the code, also the better picture? Frames come out of the dark and slide UNDER the white plate, because an object hidden behind something opaque has gone somewhere and one that dissolves is erased.",
      proposed: {
        h1: "Everything they shoot lands here.",
        subhead:
          "Guests scan the code, and every photo and video they take goes straight into your album. Nothing to install.",
        secondary: "See a real album",
      },
      departures: [
        {
          id: "inflow-still",
          from: "precedent",
          text: "The verdict this variation was built to give, on its own card rather than in a footnote: in MOTION it reads and it is the truer sentence; in a STILL it does not, because the corridor is geometrically the source's picture and the only cue left is the words. A directional soft edge was tried as the fix and abandoned: at a strength you can see, it eats the photograph.",
          evidence: "concepts",
        },
        {
          id: "inflow-ring",
          from: 1,
          text: "The splash ring carries an 18 px outer glow, the concept's one departure from cinema and unlit, and it is measured rather than decorative: the plate is surrounded by photographs by construction, so a hairline ring is legible only over the dark. There is no inner glow, which would whiten the plate and the frames under it, and bible 1 does not allow that.",
          evidence: "concepts",
        },
      ],
    },
  ],

  departures: [
    {
      id: "centred-lockup",
      from: "precedent",
      text: "All three lockups are CENTRED and every other marketing hero goes left. Precedent rather than law: the code owns the axis and the corridor is symmetrical about it, so the type lives above and below it. Overrule it and the composition changes shape, because the type would then have to live beside the corridor rather than around it.",
      evidence: "concepts",
    },
    {
      id: "live-count",
      from: "precedent",
      text: "The count under the code is the one fabricated thing in the frame and it is load-bearing on the inflow, where it is what separates arriving from vanishing. It is a stand-in: at wiring it reads the demo event's real total and each tick is one real upload, or the line goes.",
      evidence: "concepts",
    },
    {
      id: "stand-in-frames",
      from: 18,
      text: "All three corridors cycle the twelve landscape marketing stills, which are stock with unverified provenance (ASSETS row 6) and wrong in shape: half the corridor is portrait now and a frame is read between 117 and 370 px. The board is honest about it rather than cropping around it, and the fix is ASSETS row 2.",
      evidence: "stand-ins",
    },
    {
      id: "unshipped-reference",
      from: "precedent",
      text: "The bottom section mounts the SHIPPED hero from production code beside the candidates. It is the only production component on the board and it is there because the case is the scroll: three heroes whose photographs you can see, then the one with three darkening layers over twenty-four tiles.",
      evidence: "today",
    },
  ],

  assets: [
    {
      what: "34 event photographs, squares",
      spec: "512x512, one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals; framed tight enough to read at 120 px (a face, two hands, a glass, a sparkler, a first dance), never a wide room shot, and each surviving a centre crop to 4:5 and to 4:3, because half the corridor is portrait. 34 rather than a round 24 because the count is the composition's: the corridor holds 17 frames a side in the air at 1440, the two arms are offset by half the set, and the two windows only come apart at twice the pool, which is what buys the one thing the pictures buy, that no photograph is ever on screen twice.",
      replaces:
        "the 12 landscape stand-ins all three corridors cycle (FRAMES in sandbox/home-hero/shared.tsx).",
      row: 2,
    },
  ],

  sections: [
    {
      id: "concepts",
      title: "The three heroes",
      lede: "Each concept on the cinema canvas at 1:1, carrying the copy it proposes and the departures it causes. The dock's Concept knob puts one on screen alone.",
      argument: [
        "One question, three mechanisms. The source puts the real demo code at the exact centre at scanning size and branches the album out of it in a corridor that is a cone with the object at its apex. The scan is that corridor with the cause in the frame: a guest's hand rises, the camera finds the code across the room, the capture fires and the code blooms in answer. The inflow is the mirror, the room closing on the code, with nothing ever fading at the plate.",
        "What all three hold fixed, and what makes them answers to round one rather than four more grids: media at 100 percent with no darkening layer anywhere, the h1 in the markup at full opacity and never gated, the ladder resolved per canvas, every animation inside the reduced-motion block with a designed rest state, and cinema and unlit by the standing ruling. Every departure from that is on the candidate's own card rather than in a footnote.",
        "The two canvases are two compositions rather than one squeezed. At 1440 the reader is being shown a room; at 375 the reader is holding the object the picture draws, which is why the scan puts its hand almost centred out of the bottom edge and stands the two codes on one vertical axis.",
        "None of the three carries an eyebrow LINE, and all three settled it the same way: the code is the eyebrow, and the caption under it names the thing the picture cannot say for itself. A word above the headline would be a fifth block of type in a composition that already holds a headline, a caption, a count, a sentence and two actions.",
      ],
      wiring: [
        "The wiring lands in cinema-hero.tsx and nowhere else. Each concept's sheet carries its own keyframe prefix (hhs-, hhc-, hhi-) and its loops pause on a hidden tab through the stage's data-paused; production swaps that for useAmbientPause, which also pauses off screen. The QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN.",
      ],
    },
    {
      id: "words",
      title: "The words",
      lede: "The four lockups at the size they ship: the site thesis, then each concept's own proposal, on the cinema ground at this canvas's top rung.",
      argument: [
        "A headline read at 13px in a data table is a different headline, which is why the copy proposals are on the board as copy. The thesis is the site's one line and predates every picture here; each proposal was written for its own mechanism, which is what makes it sharper and also what makes it a per-concept line rather than the home page's.",
      ],
    },
    {
      id: "stand-ins",
      title: "What the corridor is cycling",
      lede: "The twelve stand-in stills at 120 px, the size the corridor actually reads them at. It is the asset ask made visible rather than described.",
      argument: [
        "Eleven of the twelve are landscape, none is wider than 900px, and the corridor reads a frame between 117 and 370 px while cropping half of them to 4:5 and 4:3. At this size a wide room shot is grey mush and a subject near an edge loses its head to the crop, which is the whole content of ASSETS row 2's framing clause.",
      ],
    },
    {
      id: "today",
      title: "Today, for reference",
      lede: "The shipped hero, mounted from production code on the same canvas. Round one measured three darkening layers over its twenty-four tiles, and a fourth below sm.",
      argument: [
        "The reference is the argument. White type had to survive over whichever tile the 55 second drift parked under it, so the wall is dimmed by a flat black, a three stop ramp and a radial vignette, and not one photograph reads as a photograph. Every candidate above carries zero darkening layers over media, measured, and shows fewer and bigger pictures.",
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
      id: "candidate",
      label: "Concept",
      options: [
        { id: "all", label: "All three" },
        { id: "source", label: "1. Source" },
        { id: "scan", label: "2. Scan" },
        { id: "inflow", label: "3. Inflow" },
      ],
      default: "all",
    },
    {
      id: "copy",
      label: "Copy",
      options: [
        { id: "ruled", label: "The thesis" },
        { id: "proposed", label: "The concept's" },
      ],
      default: "ruled",
    },
  ],

  lookFirst: [
    {
      section: "concepts",
      state: { candidate: "source", canvas: "desktop", copy: "ruled" },
      note: "The source alone at 1440. The code holds the centre at scanning size and the album branches out of it and never stops.",
    },
    {
      section: "concepts",
      state: { candidate: "scan" },
      note: "The same corridor with the cause in it: the hand rises, the camera finds the code, the capture fires, the code blooms, the album leaves.",
    },
    {
      section: "concepts",
      state: { candidate: "inflow" },
      note: "The mirror. Watch it run, then look at it as a still: that gap is the whole verdict on this one.",
    },
    {
      section: "concepts",
      state: { candidate: "all", canvas: "phone" },
      note: "All three at 375, where the reader is holding the object the picture draws. The phone canvas is a composition, not a squeeze.",
    },
    {
      section: "words",
      state: { canvas: "desktop" },
      note: "The four headlines at the size they ship. The thesis first, then the three proposals.",
    },
    {
      section: "today",
      state: { candidate: "all", canvas: "desktop" },
      note: "The shipped hero last. Three darkening layers over twenty-four tiles is what the three above refuse.",
    },
  ],

  notes: [
    {
      section: "concepts",
      state: { canvas: "phone" },
      text: "At 375 the source and the inflow keep the centred lockup and the scan rebuilds itself around the hand. If the phone canvas reads as a cropped desktop, something is wrong: they are three separate layouts.",
    },
    {
      section: "concepts",
      text: "Replay remounts the stages, because every arrival here is a CSS animation that has already finished by the time you scroll to it. Loops pause on a hidden tab, so a reading taken in a background tab reports them stopped.",
    },
    {
      section: "stand-ins",
      text: "These twelve are also the blog's cover pool and carry unverified provenance (ASSETS row 6). They are on the board as the honest stand-in, never as a proposal.",
    },
  ],

  links: {
    bible: [1, 5, 13, 14, 18, 21],
    pages: [
      {
        label: "Home",
        path: "/",
        note: "the shipped hero, in the page it has to open",
      },
    ],
  },
});
