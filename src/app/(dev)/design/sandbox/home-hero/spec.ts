import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE HOME HERO BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15;
 * the asks rewritten in plain words the same night, the clarity round).
 *
 * Nothing here is new argument. Every candidate, rationale, copy proposal,
 * departure and asset is the round-four board's, moved out of three places it
 * was scattered across (`board.tsx`'s prose block, the hand-rolled `ConceptMeta`
 * table, and the metadata block each concept file declared beside its engine)
 * into the one list the template, the desk, the record and the review ledger all
 * read. What changed is where a reviewer meets it: the verdict and the four
 * calls are the first screen instead of a toggle and three stages.
 *
 * ★ AND THE ASKS ARE NOW QUESTIONS A STRANGER CAN ANSWER. Will's first review
 * through the desk stopped at asks that were labels over tokens, which is what
 * all four of these were ("The direction: source | scan | inflow"). A reviewer
 * meets an ask on the desk or on the review card, away from the board's
 * argument, so each one now says what the thing is, where it lives on the site,
 * where to look, and what choosing each option would do. The three board
 * nicknames a reader would otherwise have to dig for (the source, the corridor,
 * the lockup) are glossed inside the ask that uses them. The ids did NOT
 * change: the review ledger joins on them, so an option may be reworded for
 * ever and an answer still lands on the ask it answered.
 *
 * ★ THE CONCEPT FILES DECLARE ONLY `{ id, render }`. The metadata that used to
 * sit under each engine is HERE, because a candidate's rationale cannot live in
 * a `.tsx` module: `registry.ts` is imported by a SERVER page and by node tests,
 * so anything it reaches has to be pure data. The engines themselves are
 * untouched, which is the whole contract of the wave: it moves the argument, it
 * does not re-argue it.
 *
 * ★ AND THE COPY PROPOSALS ARE THE SINGLE SOURCE FOR THE RENDERED LOCKUPS.
 * `copyFor` in shared.tsx reads them back out of this file, so the words on the
 * card, the words in the hero and the words in the headlines section cannot
 * drift from each other the way three hand-kept copies did.
 */
export const HOME_HERO = defineBoard({
  id: "home-hero",
  title: "The home hero",

  question:
    "The home page's first screen has to say that a QR code turns into a shared album. Which picture says it: the album coming out of the code, a guest scanning it, or the photos flying in?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template, then the four asks were rewritten in plain words with labelled options, and every card, lockup and dock switch relabelled to carry those same words. No concept, number or recommendation changed.",
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
    "Round one measured the defect the board exists to fix: the shipped hero carries three darkening layers over a wall of 24 tiles at desktop and a fourth on a phone, because white type has to survive over whichever tile the 55 second drift parks under it, so bible 1 is inverted and not one photograph reads as a photograph. Its four grids fixed that and were still bland, because none of them was about the one thing Partyreel is. Round two asked the sharper question instead, and the answer has been iterating on one composition ever since.",

  verdict: {
    recommendation:
      "The album coming out of the code, with a guest scanning as the live second. The third answered the question it was built for and the answer is no, so it belongs on a page where the reader already scrolls.",
    because:
      "It is the only one of the three whose shape IS the sentence: the real demo code holds the exact centre at the size a phone can scan, and the album branches out of it and never stops. Its photographs also grow as they travel, so the album gets easier to read the longer you look, where the third one's shrink to nothing at the object you most want looked at.",
    overrule:
      "If the cause matters more than the result, the guest scanning is already built and its phone is ruled in. Nothing on the board argues for the photos flying in as the home hero.",
  },

  asks: [
    {
      id: "direction",
      question:
        "Which of the three pictures should the home page's first screen be?",
      context:
        "The hero is the first screen of partyreel.com: a headline, a sentence, two buttons, and a picture behind them. All three candidates put the real demo QR code in the middle at the size a phone can scan, and differ in what the photographs around it do. Two board nicknames, in case you meet them: the first picture is the source, and the moving lane of photographs is the corridor.",
      look: "The three heroes section at 1440. Set Which picture in the dock to one at a time, then back to All three; each card is titled with its option's own words. Watch each one run, then look at it as a still.",
      options: [
        {
          id: "source",
          label: "The album comes out of the code",
          means:
            "The code holds the centre, still and scannable, and photographs branch out of it and never stop.",
        },
        {
          id: "scan",
          label: "A guest scans, then it comes out",
          means:
            "The same picture with the cause in it: a hand lifts a phone, the camera finds the code across the room, then the album leaves.",
        },
        {
          id: "inflow",
          label: "The photos fly into the code",
          means:
            "The mirror image: photographs come out of the dark and slide under the code's white plate, so the album closes into it.",
        },
      ],
      recommended: "source",
      because:
        "You have already said you like the first two. The third was built to test whether the truer sentence, photos going IN, also makes the better picture; it reads while it moves and not as a still, where it looks like the first one and only the words tell them apart.",
      overrule:
        "If the hero should show a guest rather than a finished album, the second says the same thing with the cause in the frame.",
      evidence: "concepts",
      // No `control`: the Which picture switch carries a fourth option (All
      // three) that no ask can offer, and dropping it would cost the board the
      // side-by-side scroll that is its whole case.
      state: { candidate: "all", canvas: "desktop" },
    },
    {
      id: "headline",
      question:
        "Should the hero carry the site's one line, or a headline written for the winning picture?",
      context:
        "The headline is the big line of type in the hero. The site thesis is one ruled line used across the whole marketing site, and it is what all three render today. Each picture also proposes a headline written for its own mechanism, so the one where a guest scans offers a line about every camera in the room being one album.",
      look: "The headlines section: the site's line first, then the three proposals, each in the face and at the size the hero ships. Or flip Headline in the dock and watch every picture's own line swap in.",
      options: [
        {
          id: "ruled",
          label: "The site's one line",
          means:
            "The hero keeps the thesis that already runs across the whole marketing site, and all three pictures read with it.",
        },
        {
          id: "proposed",
          label: "The picture's own line",
          means:
            "The hero carries the headline written for whichever picture is ruled in, so the words and the picture are one idea.",
        },
      ],
      recommended: "ruled",
      because:
        "The thesis is one line for the whole site and every picture reads with it. Each proposal is sharper about its own mechanism, which is exactly what makes it a line for that picture rather than for the home page.",
      overrule:
        "Copy is open (bible 21). If the winning picture's own line reads better inside its own frame, it rides in with the picture.",
      evidence: "words",
      // The Headline switch IS this ask: its option ids are these ids, so
      // picking an option on the review card previews it on every hero.
      control: "copy",
      state: { canvas: "desktop" },
    },
    {
      id: "lockup",
      question:
        "Should the headline and buttons sit centred above and below the code, or left like the rest of the site?",
      context:
        "The lockup is the block of type and buttons in a hero: the headline, the sentence under it, and the two actions. Every other marketing page on the site puts that block on the left, and so does the hero that ships today. All three candidates centre it instead, because the code holds the middle of the frame and the photographs are symmetrical about it.",
      look: "The three heroes section at 1440 and at 375: the type sits above and below the code in all three. Compare with Today, for reference at the foot of the board, whose type runs left.",
      options: [
        {
          id: "centred",
          label: "Centred, above and below the code",
          means:
            "The type stays where all three pictures put it, and the code keeps the exact middle of the frame.",
        },
        {
          id: "left",
          label: "Left, like every other page",
          means:
            "The type moves beside the picture, so all three compositions have to be rebuilt around it.",
        },
      ],
      recommended: "centred",
      because:
        "The code owns the middle of the frame and the photographs are symmetrical about it, so the type lives above and below rather than beside it. Going left is what every other marketing hero does, which is precedent and not law.",
      overrule:
        "If the home page has to match the rest of the site, the type moves beside the picture and all three compositions change shape.",
      evidence: "concepts",
      state: { candidate: "all", canvas: "desktop" },
    },
    {
      id: "count",
      question:
        "Should the hero carry a live count of photos and guests under the code?",
      context:
        "Under the code, two of the three pictures show a small line counting the photos and the guests in the album, which ticks upward while you watch. The number is a stand-in and nothing real is behind it yet. If it stays, the wiring round reads the demo event's own total and every tick is one real upload; it must never ship as invented data.",
      look: "The three heroes section with Which picture on A guest scans: the small line under the white code plate, which starts at 282 photos from 48 guests and climbs. The photos flying in counts too; the first has a caption there instead.",
      options: [
        {
          id: "keep",
          label: "Keep it, wired to the real event",
          means:
            "The line stays, and at wiring it reads the demo event's own total, so every tick is one real upload.",
        },
        {
          id: "cut",
          label: "Cut the number from the hero",
          means:
            "No live number anywhere in the hero. The first two hold without it; the third loses its clearest sign that photos are arriving.",
        },
      ],
      recommended: "keep",
      because:
        "A number climbing while you watch is the one thing in the frame that says this is happening right now. It is only worth having if it is real, so keeping it means wiring it to the demo event's own total.",
      overrule:
        "If a hero may not carry a live number at all, the line goes; the first two pictures hold without it.",
      evidence: "concepts",
      state: { candidate: "scan", canvas: "desktop" },
    },
  ],

  candidates: [
    {
      // ★ THE CARD'S TITLE IS THE OPTION'S LABEL. A reviewer answering the
      // direction ask has to find the words he was offered ON the thing he is
      // judging; "1. The source" was a nickname he had to go into the board to
      // decode. The nickname survives in the rationale, glossed.
      id: "source",
      name: "1. The album comes out of the code",
      recommended: true,
      rationale:
        "The scan is where everything starts, so the hero makes that literal: the real demo QR holds the exact centre, still and scannable, and the album branches out of it and never stops. The board calls this one the source. Round four made its lane of photographs a volume rather than a plane.",
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
          text: "The centred type is its only departure, and it is the board's rather than this picture's. Everything else is inside the bible: photographs at 100 percent with no darkening layer anywhere, the headline in the markup at full opacity, every animation inside the reduced-motion block with the settled lane as the rest state, cinema and unlit with no lamp.",
          evidence: "concepts",
        },
      ],
    },
    {
      id: "scan",
      name: "2. A guest scans, then it comes out",
      rationale:
        "The first picture's lane of photographs, with the cause in frame, and since the phone is ruled in it is the phone that does it: a hand rises, the camera finds the code across the room, the capture fires, the code blooms in answer, and only then does the album branch out. One beat, in causal order.",
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
          text: "Two things give off light on a hero that is cinema and unlit by standing ruling: the phone's screen, which lights itself and its own bezel and nothing else, and one white capture bloom behind the code's plate, spent in 400 ms once per turn of the album. Both brighten and neither darkens, so every photograph is still at 100 percent and there is no scrim.",
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
      name: "3. The photos fly into the code",
      rationale:
        "The mirror, built to answer one question honestly: is the truer sentence, photographs going INTO the code, also the better picture? Frames come out of the dark and slide UNDER the white plate, because an object hidden behind something opaque has gone somewhere and one that dissolves is erased.",
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
          text: "The verdict this picture was built to give, on its own card rather than in a footnote: in MOTION it reads and it is the truer sentence; in a STILL it does not, because its geometry is the first picture's and the only cue left is the words. A directional soft edge was tried as the fix and abandoned: at a strength you can see, it eats the photograph.",
          evidence: "concepts",
        },
        {
          id: "inflow-ring",
          from: 1,
          text: "The splash ring carries an 18 px outer glow, this picture's one departure from cinema and unlit, and it is measured rather than decorative: the plate is surrounded by photographs by construction, so a hairline ring is legible only over the dark. There is no inner glow, which would whiten the plate and the frames under it, and bible 1 does not allow that.",
          evidence: "concepts",
        },
      ],
    },
  ],

  departures: [
    {
      id: "centred-lockup",
      from: "precedent",
      text: "All three put their type CENTRED and every other marketing hero goes left. Precedent rather than law: the code owns the middle of the frame and the photographs are symmetrical about it, so the type lives above and below it. Overrule it and the composition changes shape, because the type would then have to live beside the picture rather than around it.",
      evidence: "concepts",
    },
    {
      id: "live-count",
      from: "precedent",
      text: "The count under the code is the one fabricated thing in the frame, and it is load-bearing on the picture where the photos fly in, where it is what separates arriving from vanishing. It is a stand-in: at wiring it reads the demo event's real total and each tick is one real upload, or the line goes.",
      evidence: "concepts",
    },
    {
      id: "stand-in-frames",
      from: 18,
      text: "All three cycle the twelve landscape marketing stills, which are stock with unverified provenance (ASSETS row 6) and wrong in shape: half the lane is portrait now and a frame is read between 117 and 370 px. The board is honest about it rather than cropping around it, and the fix is ASSETS row 2.",
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
      spec: "512x512, one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals; framed tight enough to read at 120 px (a face, two hands, a glass, a sparkler, a first dance), never a wide room shot, and each surviving a centre crop to 4:5 and to 4:3, because half the lane is portrait. 34 rather than a round 24 because the count is the composition's: the lane holds 17 frames a side in the air at 1440, the two arms are offset by half the set, and the two windows only come apart at twice the pool, which is what buys the one thing the pictures buy, that no photograph is ever on screen twice.",
      replaces:
        "the 12 landscape stand-ins all three pictures cycle (FRAMES in sandbox/home-hero/shared.tsx).",
      row: 2,
    },
  ],

  sections: [
    {
      id: "concepts",
      title: "The three heroes",
      lede: "Each of the three at full size on the real cinema ground, carrying the headline it proposes and the rules it breaks. Which picture in the dock puts one on screen alone, and clicking a card's title does the same.",
      argument: [
        "One question, three mechanisms. The first puts the real demo code at the exact centre at scanning size and branches the album out of it in a lane that is a cone with the object at its apex. The second is that lane with the cause in the frame: a guest's hand rises, the camera finds the code across the room, the capture fires and the code blooms in answer. The third is the mirror, the room closing on the code, with nothing ever fading at the plate.",
        "What all three hold fixed, and what makes them answers to round one rather than four more grids: photographs at 100 percent with no darkening layer anywhere, the headline in the markup at full opacity and never gated, the type ladder resolved per canvas, every animation inside the reduced-motion block with a designed rest state, and cinema and unlit by the standing ruling. Every departure from that is on the picture's own card rather than in a footnote.",
        "The two canvases are two compositions rather than one squeezed. At 1440 the reader is being shown a room; at 375 the reader is holding the object the picture draws, which is why the second stands its hand almost centred out of the bottom edge and puts the two codes on one vertical axis.",
        "None of the three carries an eyebrow LINE, and all three settled it the same way: the code is the eyebrow, and the caption under it names the thing the picture cannot say for itself. A word above the headline would be a fifth block of type in a composition that already holds a headline, a caption, a count, a sentence and two actions.",
      ],
      wiring: [
        "The wiring lands in cinema-hero.tsx and nowhere else. Each picture's sheet carries its own keyframe prefix (hhs-, hhc-, hhi-) and its loops pause on a hidden tab through the stage's data-paused; production swaps that for useAmbientPause, which also pauses off screen. The QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN.",
      ],
    },
    {
      id: "words",
      title: "The headlines",
      lede: "The site's one line, then the headline each of the three pictures proposes, set in the face and at the size the hero ships them at.",
      argument: [
        "A headline read at 13px in a data table is a different headline, which is why the copy proposals are on the board as copy. The thesis is the site's one line and predates every picture here; each proposal was written for its own mechanism, which is what makes it sharper and also what makes it a line for one picture rather than for the home page.",
      ],
    },
    {
      id: "stand-ins",
      title: "The photographs, at the size they are read",
      lede: "The twelve placeholder stills at 120 px, the size the moving lane actually reads them at. It is the asset request made visible rather than described.",
      argument: [
        "Eleven of the twelve are landscape, none is wider than 900px, and the lane reads a frame between 117 and 370 px while cropping half of them to 4:5 and 4:3. At this size a wide room shot is grey mush and a subject near an edge loses its head to the crop, which is the whole content of ASSETS row 2's framing clause.",
      ],
    },
    {
      id: "today",
      title: "Today, for reference",
      lede: "The hero the site ships today, mounted from production code on the same canvas. Round one measured three darkening layers over its twenty-four tiles, and a fourth on a phone.",
      argument: [
        "The reference is the argument. White type had to survive over whichever tile the 55 second drift parked under it, so the wall is dimmed by a flat black, a three stop ramp and a radial vignette, and not one photograph reads as a photograph. Every candidate above carries zero darkening layers over its photographs, measured, and shows fewer and bigger pictures.",
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
      // The switch says the same words the direction ask offers, shortened to
      // fit a knob. It carries All three, which no ask can offer, so the ask
      // does not mirror it.
      id: "candidate",
      label: "Which picture",
      options: [
        { id: "all", label: "All three" },
        { id: "source", label: "1. Out of the code" },
        { id: "scan", label: "2. A guest scans" },
        { id: "inflow", label: "3. Into the code" },
      ],
      default: "all",
    },
    {
      // Mirrored by the headline ask, so these labels ARE that ask's labels.
      id: "copy",
      label: "Headline",
      options: [
        { id: "ruled", label: "The site's one line" },
        { id: "proposed", label: "The picture's own line" },
      ],
      default: "ruled",
    },
  ],

  lookFirst: [
    {
      section: "concepts",
      state: { candidate: "source", canvas: "desktop", copy: "ruled" },
      note: "The album coming out of the code, alone at 1440. The code holds the centre at scanning size and the album branches out of it and never stops.",
    },
    {
      section: "concepts",
      state: { candidate: "scan" },
      note: "The same picture with the cause in it: the hand rises, the camera finds the code, the capture fires, the code blooms, the album leaves.",
    },
    {
      section: "concepts",
      state: { candidate: "inflow" },
      note: "The mirror, where the photos fly in. Watch it run, then look at it as a still: that gap is the whole verdict on this one.",
    },
    {
      section: "concepts",
      state: { candidate: "all", canvas: "phone" },
      note: "All three at 375, where the reader is holding the object the picture draws. The phone canvas is a composition, not a squeeze.",
    },
    {
      section: "words",
      state: { canvas: "desktop" },
      note: "The four headlines at the size they ship. The site's one line first, then the one each picture proposes.",
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
      text: "At 375 the first and the third keep their centred type and the second rebuilds itself around the hand. If the phone canvas reads as a cropped desktop, something is wrong: they are three separate layouts.",
    },
    {
      section: "concepts",
      text: "Replay remounts the pictures, because every arrival here is a CSS animation that has already finished by the time you scroll to it. Loops pause on a hidden tab, so a reading taken in a background tab reports them stopped.",
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
