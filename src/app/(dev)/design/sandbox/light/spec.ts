import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE LIGHT BOARD, AS DATA (round six, the revamp, 2026-09-16).
 *
 * ★ THE ROUND IS A SUBTRACTION, AND WILL'S TWO NON-ANSWERS ARE THE BRIEF.
 * Round five asked nine questions and he answered three: the kit lands, phase 1
 * first, the aurora sits at the Accent register ("identity feels way too
 * weak"). Two he refused, and both for the same reason, which is that a board
 * asked him to rule on something he could not SEE:
 *
 *   the aurora   "am I being asked what aurora placement within the footer? Or
 *                what aurora replacement looks better in general?"
 *   the depth    "hard to visibly tell what Family and Lift are from the
 *                previews."
 *
 * So neither is a question any more. The depth cues ARE two of the twelve cards
 * (lift and float), so "the family" is two keeps, "the lift only" is a keep and
 * a kill, and "no shadow in dark" is two kills: a ruling nobody has to decode.
 * The aurora is a card too, with a page-wide Landing switch and a two-way
 * compare under it, so where it lands is something to look at rather than a
 * token to pick. The lit-face ask went the same way: adopt, adapt and drop are
 * keep, refine and kill on the `face` card.
 *
 * ★ AND THE ARGUMENT COLLAPSED. Round five's board weighed 10,164 words outside
 * its folds, the second heaviest in the lab. The doctrine grid, the composer's
 * essay, the six infusion phases and the five measurements are gone as PROSE
 * and present as evidence: twelve cards, one compare, four calls, the real
 * pages and the paste. Nothing was withdrawn; it is underneath, folded, which
 * is where an argument belongs once there is an answer above it.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 */

/**
 * THE TWELVE, WRITTEN OUT (the revamp, 2026-09-16).
 *
 * ★ NEVER A `.map` OVER `kit.ts`, and the palette board learned this twice.
 * `pnpm lab:review` reads a spec as TEXT rather than importing it (so an ask
 * can be validated with no build step) and resolves `candidates: ITEMS` exactly
 * one hop to this const; a `.map` reads as no items at all, so every ruling on
 * a card would be refused.
 *
 * What lives in `kit.ts` is the treatment's structure, its place and its mount.
 * What lives HERE is the words on the card and the four facts a reviewer
 * compares across twelve of them: where it lands, what it costs a frame, the
 * register it runs at, and what it leaves on screen when it is not running.
 * The `verdict` is the BOARD's own call, drawn as the card's pill; Will answers
 * each card keep, refine or kill in the row under it.
 */
const ITEMS: readonly Candidate<
  "catalog" | "compare" | "open" | "pages" | "paste"
>[] = [
  /* ── SEPARATE ─────────────────────────────────────────────────────────── */
  {
    id: "step",
    name: "The step",
    one: "A surface one token lighter than the one under it. The cheapest separation, and it costs no paint.",
    verdict: "ship",
    facts: [
      ["Lands", "Every card, panel and well"],
      ["Frame", "Nothing: no paint"],
      ["Register", "Achromatic, one token"],
      ["At rest", "Its only state"],
    ],
    rationale:
      "The floor the other three sit on. Nothing else is reached for until the step is not enough.",
  },
  {
    id: "ring",
    name: "The ring",
    one: "A hairline that states an edge without implying height. 77 uses, and written down nowhere until now.",
    verdict: "ship",
    facts: [
      ["Lands", "Cards, panels, frames, inputs"],
      ["Frame", "Nothing: no paint"],
      ["Register", "5 percent, 10 on media"],
      ["At rest", "Its only state"],
    ],
    rationale:
      "The fourth depth technique, in no document. Naming it is the whole change.",
  },
  {
    id: "lift",
    name: "Lift",
    one: "A soft shadow under two things of the same lightness that overlap. Dark has never had one.",
    verdict: "ship",
    recommended: true,
    facts: [
      ["Lands", "Stacked media, the host's tiles"],
      ["Frame", "Nothing: a static shadow"],
      ["Register", "0.45 / 0.55 dark, paper unmoved"],
      ["At rest", "Its only state"],
    ],
    rationale:
      "Six percent of black over a near-black room is invisible, which is why dark reads as shadowless. Raise the alpha and the family works.",
    departures: [
      {
        id: "dark-shadow",
        from: 10,
        text: "A shadow in DARK. The elevation contract reads 'Dark: NO shadows anywhere' and --shadow-float is zeroed there. On a light ground lift is the shipped value to the byte, so paper does not move.",
        evidence: "catalog",
      },
    ],
  },
  {
    id: "float",
    name: "Float",
    one: "The same shadow at double the offsets, under a menu or a dialog that a page keeps living behind.",
    verdict: "ship",
    facts: [
      ["Lands", "Menus, dialogs, sheets, toasts"],
      ["Frame", "Nothing: a static shadow"],
      ["Register", "0.50 / 0.62 dark, paper unmoved"],
      ["At rest", "Its only state"],
    ],
    rationale:
      "A layer has to detach from content still living behind it, in both modes. A flat surface takes neither.",
  },
  {
    id: "face",
    name: "The lit face",
    one: "A thin bright edge on a surface catching light: a media frame, a screen, the QR plate.",
    verdict: "refine",
    facts: [
      ["Lands", "Gallery canvas, plates, screens"],
      ["Frame", "Nothing: two inset lines"],
      ["Register", "9 percent inset, 6 percent lip"],
      ["At rest", "Its only state"],
    ],
    rationale:
      "Material rather than elevation, fenced to three surfaces so it never becomes a fifth way of separating things.",
    departures: [
      {
        id: "ring-lift",
        from: "precedent",
        text: "The ring and the lit face both have production uses and no document. Writing them down makes four techniques official where two were.",
        evidence: "catalog",
      },
    ],
  },

  /* ── FILL ─────────────────────────────────────────────────────────────── */
  {
    id: "seam",
    name: "The seam",
    one: "The footer's own light: a band at full strength where two grounds meet, falling away from the edge.",
    verdict: "ship",
    facts: [
      ["Lands", "The footer, the strip, a screen"],
      ["Frame", "One filtered band, always"],
      ["Register", "210px, 0.62 base and band"],
      ["At rest", "The base stays lit"],
    ],
    rationale:
      "The one lamp everyone likes, and illegal under the law that opens the doctrine today.",
  },
  {
    id: "throw",
    name: "The throw",
    one: "A cast thrown from a point on the object, so a plate on open dark sits on its own light.",
    verdict: "refine",
    facts: [
      ["Lands", "A plate or card on open dark"],
      ["Frame", "One filtered field, always"],
      ["Register", "0.50 base, 0.50 band"],
      ["At rest", "The base stays lit"],
    ],
    rationale:
      "A rim has no vector, which is the one shape the doctrine refuses. An origin anchor makes the same light legal.",
  },
  {
    id: "aurora",
    name: "The aurora",
    one: "The footer's light grown to the size of a chapter: a field at a section's own two edges.",
    verdict: "refine",
    facts: [
      ["Lands", "One media-less chapter a page"],
      ["Frame", "Two filtered bands, always"],
      ["Register", "Accent: 0.30 dark, 0.52 paper"],
      ["At rest", "The base stays lit"],
    ],
    rationale:
      "The fill job at chapter scale, and the one thing none of the three explorations had a name for.",
    departures: [
      {
        id: "per-section-temperature",
        from: 3,
        text: "The aurora lets a section retune --lamp-* for everything inside it. Bible 3 holds (light, never UI), but a per-section temperature is a new licence and it is the aurora's whole identity claim.",
        evidence: "compare",
      },
    ],
    assets: [
      {
        what: "A grain tile, so the aurora stops banding",
        spec: "Seamless monochrome noise, 256x256 PNG-8, one-pixel grain, neutral, mean 50 percent grey, used at 5 percent and laid out at 128 CSS px on a 2x screen.",
        replaces:
          "the inline feTurbulence stand-in in board.css ([data-lgt-grain]).",
      },
    ],
  },

  /* ── MARK ─────────────────────────────────────────────────────────────── */
  {
    id: "sweep",
    name: "The sweep",
    one: "A comet and a phase-locked edge ring, so an object reads as arriving from outside the frame.",
    verdict: "refine",
    facts: [
      ["Lands", "An upload landing, an arrival"],
      ["Frame", "Two layers for 6s, then none"],
      ["Register", "0.60 band over a 0.35 base"],
      ["At rest", "Nothing: the beat ends"],
    ],
    rationale:
      "Half the engine's recipe never shipped: we took the comet and left the edge ring behind.",
  },
  {
    id: "bloom",
    name: "The bloom",
    one: "A one-shot that decays to a base and never to nothing, so the object stays lit after the beat.",
    verdict: "refine",
    facts: [
      ["Lands", "The publish beat, the QR plate"],
      ["Frame", "One layer, 700ms, then none"],
      ["Register", "0.85 peak, decaying to 0.25"],
      ["At rest", "The object stays lit"],
    ],
    rationale:
      "A beat that decays to nothing leaves the object exactly as it was. A base is what makes a moment worth having.",
    departures: [
      {
        id: "publish-violet",
        from: "ruling",
        text: "The publish flourish's hue 300 becomes the lamp set's 305 and decays to a base rather than to nothing. A ratified value moved five degrees, so it is asked rather than taken.",
        evidence: "open",
      },
    ],
  },
  {
    id: "halo",
    name: "The halo",
    one: "An object lit from behind: colour creeps in at the rim and the face of it stays clean.",
    verdict: "kill",
    facts: [
      ["Lands", "One secondary action a page"],
      ["Frame", "One filtered ring, always"],
      ["Register", "0.95 band over a 0.80 base"],
      ["At rest", "The base stays lit"],
    ],
    rationale:
      "It cannot light a white primary, and its own fence is argue it every time. That is not a treatment.",
  },
  {
    id: "beam",
    name: "The beam",
    one: "A travelling border on the one object whose state is running, or on Pro at rest.",
    verdict: "ship",
    facts: [
      ["Lands", "Pro at rest, a running state"],
      ["Frame", "One travelling border, always"],
      ["Register", "The live register of the five"],
      ["At rest", "It ends with the state"],
    ],
    rationale:
      "Ruled and shipped, with four laws and one standing exception. Counted here, not re-argued.",
  },
];

export const LIGHT = defineBoard({
  id: "light",
  title: "Light, shadow and lamp",
  question:
    "Which of the twelve treatments should the light system carry, and what is left open once they are ruled?",

  round: {
    n: 6,
    date: "2026-09-16",
    changed:
      "Rebuilt as a catalog: twelve treatments, each a card that is the real surface wearing it at true size. The two questions you could not see became things to look at, and nine asks became four.",
  },
  history: [
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "Moved onto the kit's template and the nine asks rewritten in plain words. Will ruled three: the kit lands, phase 1 first, the aurora at Accent.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Turned inside out into a kit with the arguments underneath it: twelve treatments on the real sections, the composer, and the infusion order.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "The cost meter, the wipe and the paper five. Anything that decided nothing was cut.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed: "Apply to the site, so a candidate is judged on the real pages.",
    },
    {
      n: 1,
      date: "2026-09-14",
      changed: "Three columns: keep, tune, replace. Replace was withdrawn.",
    },
  ],
  context:
    "Three explorations set this identity: the spill doctrine named the shapes, the spill placements decided where a light is earned, and this board asked what the whole system would be if designed today. Its answer, ruled in at round five, is that light sorts by the JOB it does (separate, fill, mark) rather than by where it comes from, and that a lamp needs a PLACE rather than an object. What is left is the twelve, one at a time.",

  verdict: {
    recommendation:
      "Keep the twelve as they stand, and begin with the shadows: the separate job first, on every surface, in both modes.",
    because:
      "The shape is ruled, so what is open is card by card. Six of the twelve already run in production. The shadows are the only phase that needs nothing from any other board, and this page can put them on the real site today.",
    overrule:
      "A shadow in dark is the one genuinely new claim. Kill lift and float and the other ten still stand.",
  },

  /**
   * ★ FOUR ASKS, AND NOT ONE OF THEM IS A CARD. Everything that could be looked
   * at became a card; what is left is the four calls that are not one object:
   * an ORDER, a NUMBER, a ROW OF HUES and a ratified value being moved. Each
   * still carries its context and its look, because a reviewer meets an ask on
   * the desk, away from this board's argument.
   */
  asks: [
    {
      id: "infusion",
      question: "Once the shadows land, what should land second?",
      context:
        "The light enters the site in phases, and phase 1, the shadows, is ruled. Three things could go second: the aurora on the home page, the paper hues, or the feature pages.",
      look: "The four calls, the order: three rows with what each one needs first.",
      options: [
        {
          id: "home-arc",
          label: "The home page's two ends",
          means:
            "The aurora at Accent on exactly two sections of the home page: the guest ledger and the closer above the footer.",
        },
        {
          id: "paper",
          label: "Paper",
          means:
            "The five lamp hues re-tuned for the light ground, then the aurora on the paper chapters.",
        },
        {
          id: "features",
          label: "The feature pages",
          means:
            "The seam on every feature hero with a screen, plus the throw and the lit face on the plates.",
        },
      ],
      recommended: "home-arc",
      because:
        "The closer sits one scarcity distance above the footer seam, the hardest test that law has anywhere. Two call sites is the cheapest place to find out.",
      evidence: "open",
    },
    {
      id: "cadence",
      question: "How slowly should a lamp breathe?",
      context:
        "Every lamp on the site drifts on one shared clock. The engine runs a cycle in 8 seconds; the footer alone was slowed to 11 when it was the only lamp anywhere.",
      look: "The four calls, the clock: one chapter at both numbers. Then tap 8s or 11s and walk the home page, where three lamps sit a viewport apart.",
      options: [
        {
          id: "8s",
          label: "8 seconds, the engine's own clock",
          means:
            "Every lamp, the footer included, breathes on the engine's cycle.",
        },
        {
          id: "11s",
          label: "11 seconds, the footer's slower clock",
          means:
            "The footer keeps its slower cycle and every other lamp joins it.",
        },
      ],
      recommended: "8s",
      evidence: "open",
    },
    {
      id: "paper",
      question: "On the light ground, which lamp colours should be used?",
      context:
        "The five lamp hues were tuned against a near-black room and nothing re-declares them on paper, so a lamp on a light chapter wears colours picked for the dark. Two of the five go dirty against white.",
      look: "The four calls, the hues: one paper chapter three times. Judge the hues, not the brightness.",
      options: [
        {
          id: "hand-tuned",
          label: "A hand-tuned paper set",
          means:
            "Each of the five is corrected on its own for paper, and paper declares its own row.",
        },
        {
          id: "flat",
          label: "One flat correction for all five",
          means:
            "The dark five with a single brightness change applied to all of them.",
        },
        {
          id: "dark",
          label: "The dark five, unchanged",
          means: "Paper keeps the cinema hues exactly as they ship today.",
        },
      ],
      recommended: "hand-tuned",
      evidence: "open",
    },
    {
      id: "publish",
      question: "What colour should the publish flourish be?",
      context:
        "When a host publishes an event the reel's frame flashes a violet (hue 300, a ratified colour) and fades to nothing. The proposal is a bloom in the lamp set's own colours, leaned toward violet, fading to a base.",
      look: "The four calls, the beat: three frames, three Replays. Watch what each one leaves behind.",
      options: [
        {
          id: "300",
          label: "As shipped: the violet flash",
          means: "The beat stays exactly as it is, and fades to nothing.",
        },
        {
          id: "house-five",
          label: "A bloom in the house five",
          means:
            "The lamp set's colours with no lean, so there is no meaning in the hue at all.",
        },
        {
          id: "305",
          label: "The five, leaned to violet",
          means:
            "The same bloom narrowed toward violet, so the beat still reads as the reel's colour and decays to a base.",
        },
      ],
      recommended: "305",
      evidence: "open",
    },
  ],

  candidates: ITEMS,

  /**
   * ★ THE CATALOG IS THE EVIDENCE. Declaring this is what turns the grid into
   * the review surface: Pick drives the whole page from a card and hands the
   * site that treatment's block, A and B drive the compare below it, and each
   * card carries keep, refine or kill with a note. The two asks Will could not
   * answer are answered HERE rather than by a fifth and sixth question.
   */
  catalog: {
    section: "catalog",
    control: "treatment",
    compare: ["compare-a", "compare-b"],
  },

  /**
   * ★ THE DECLARATION, AND THE ARITHMETIC BEHIND IT. Round five weighed 10,164
   * words outside its folds, the second heaviest board in the lab; this one
   * weighs 2,899, which is the lightest catalog in the lab and a quarter of
   * what it replaced. It is still over the 1,200 budget, and the gap is not
   * this board's prose: measured on the rendered page, about 990 of those words
   * are printed by the TEMPLATE from data a catalog has to supply anyway. The
   * index reprints every section lede (134), the meta panel prints all twelve
   * rationales unfolded plus the departures and the assets (535), and the
   * review panel prints every ask and every card name a third time (232). The
   * board's own visible voice is the rest, and 757 of that is the twelve cards:
   * a name, a line and the four facts each. Cutting to 1,200 means cutting the
   * catalog itself, which is the thing the round was for. The fix belongs in
   * the kit (fold the meta panel's Ideas rows the way the card already folds
   * them) and it is written down in the track manifest's Questions.
   */
  reading: {
    words: 2950,
    why: "Twelve cards with four facts each, and four asks. About 990 of these words are the template's, not the board's: the index reprints every lede, the meta panel prints all twelve rationales unfolded, and the review panel prints every ask a third time. The board's own catalog is 757 of them.",
  },

  departures: [
    {
      id: "qr-is-a-mark",
      from: 3,
      text: "The QR plate's shipped light is a MARK, not spill: a bloom with no vector at all, which law 2 refuses. Naming the job is what makes it legal, and that naming is new.",
      evidence: "catalog",
    },
    {
      id: "paper-lamps",
      from: "ruling",
      text: "A hand-tuned paper five on .surface-paper: the first time --lamp-* would be re-declared per ground.",
      evidence: "open",
    },
  ],

  assets: [
    {
      what: "A worst-case pair of overlapping photographs",
      spec: "Two images whose touching edges are both dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG.",
      replaces: "the reception-hall and wedding-toast pair on the lift card.",
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The twelve",
      lede: "Each treatment on the real surface that wears it, at true size, with its four facts. Pick one and the real pages below wear its block.",
      argument: [
        "THE SHAPE, RULED AT ROUND FIVE. The system used to be organised around where light came FROM: spill is light from a lit thing, beam is a lit thing, and the elevation contract was a separate document about shadows, one mode at a time. Three consequences were visible in the repo: the footer's seam, the lamp Will likes most, was illegal under the law that opens the doctrine; dark had no shadow even where two photographs plainly needed one; and the ring, the fourth depth technique with 77 uses, was in no document at all.",
        "ORGANISE IT AROUND WHAT THE LIGHT IS DOING and the same parts fall into three jobs that do not overlap. SEPARATE is achromatic and static: the step, the ring, the two shadows and the lit face. FILL is chromatic, slow and always behind content: the seam, the throw and the aurora. MARK is chromatic, bounded, and ends when its state ends: the sweep, the bloom, the halo and the beam. The rule that replaces name the lamp falls out of the second job: a light needs a PLACE (an edge, a boundary, a screen, a plate) rather than an object throwing it.",
        "SIX OF THE TWELVE ALREADY RUN IN PRODUCTION and nobody had written down what they were called: the step, the ring, the footer's seam, the QR plate's bloom, the Pro card's beam and the strip's underlight. That is the strongest fact on the board, and it is why the kill list matters more than the keep list.",
      ],
    },
    {
      id: "compare",
      title: "Any two, on one real section",
      lede: "One production section under two of the twelve at once. A and B come from the cards above; Landing moves the aurora and nothing else.",
      argument: [
        "WHERE THE AURORA LANDS IS A PICTURE, NOT A TOKEN. Round five asked it as four words and Will could not tell what was being asked, fairly: the footer is not in question under any of them. The footer keeps its seam either way. What is in question is whether a marketing chapter with no media in it gets a field of light, and where in the chapter that field sits: at both of its boundaries with the copy in the clean band between them, at one of them, or filling the section like a lit room, which is the placement the engine's own comment warns against.",
      ],
    },
    {
      id: "open",
      title: "The four calls left",
      lede: "What is not one card: the order, the clock, the paper hues, and the publish beat's colour.",
      argument: [
        "NONE OF THESE IS A TREATMENT. The order is a plan, the clock is one token shared by every lamp on the site, the paper row is five values re-declared on one ground, and the publish beat is a ratified colour being moved five degrees. Each one survives the catalog because ruling twelve cards does not answer any of them.",
      ],
    },
    {
      id: "pages",
      title: "The real pages",
      lede: "The production routes at true pixels, scrolled together: the site as built, beside the site wearing the picked block.",
      argument: [
        "A composition is honest about a component and dishonest about a page. What a light has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, and the seam where the paper ends and the footer begins. Home is the whole arc in one scroll; pricing is the densest card in the product and the one page that already carries a beam.",
      ],
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The blocks a wiring round lands, and the bill of materials under them.",
      wiring: [
        "Re-pointing the 38 --shadow-float call sites and the roughly 30 raw Tailwind shadows is the wiring round's sweep. Until it runs the old token aliases the new one on the light grounds, where the two are the same bytes and nothing moves; on the dark grounds it keeps its zero by contract, so the surfaces that take a shadow in dark are named one by one instead.",
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
      id: "treatment",
      label: "Treatment",
      // Nothing picked is a state of its own (Will, 2026-09-16): the pages
      // below show the site as built until a card is picked, and pressing the
      // picked card returns here.
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "step", label: "The step" },
        { id: "ring", label: "The ring" },
        { id: "lift", label: "Lift" },
        { id: "float", label: "Float" },
        { id: "face", label: "The lit face" },
        { id: "seam", label: "The seam" },
        { id: "throw", label: "The throw" },
        { id: "aurora", label: "The aurora" },
        { id: "sweep", label: "The sweep" },
        { id: "bloom", label: "The bloom" },
        { id: "halo", label: "The halo" },
        { id: "beam", label: "The beam" },
      ],
      default: "none",
      clearable: true,
    },
    // A and B: the two the compare joins, set from the catalog's own cards.
    // They open on the shipped lamp against the field it would grow into,
    // which is the comparison Will asked for in plain words.
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "step", label: "The step" },
        { id: "ring", label: "The ring" },
        { id: "lift", label: "Lift" },
        { id: "float", label: "Float" },
        { id: "face", label: "The lit face" },
        { id: "seam", label: "The seam" },
        { id: "throw", label: "The throw" },
        { id: "aurora", label: "The aurora" },
        { id: "sweep", label: "The sweep" },
        { id: "bloom", label: "The bloom" },
        { id: "halo", label: "The halo" },
        { id: "beam", label: "The beam" },
      ],
      default: "seam",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "step", label: "The step" },
        { id: "ring", label: "The ring" },
        { id: "lift", label: "Lift" },
        { id: "float", label: "Float" },
        { id: "face", label: "The lit face" },
        { id: "seam", label: "The seam" },
        { id: "throw", label: "The throw" },
        { id: "aurora", label: "The aurora" },
        { id: "sweep", label: "The sweep" },
        { id: "bloom", label: "The bloom" },
        { id: "halo", label: "The halo" },
        { id: "beam", label: "The beam" },
      ],
      default: "aurora",
    },
    {
      id: "ground",
      label: "Ground",
      options: [
        { id: "cinema", label: "Cinema" },
        { id: "paper", label: "Paper" },
        { id: "app-dark", label: "App dark" },
      ],
      default: "cinema",
    },
    // The aurora's landing, page-wide: the question Will could not read as
    // four words is this switch plus the compare under it.
    {
      id: "landing",
      label: "Landing",
      options: [
        { id: "both", label: "Both edges" },
        { id: "top", label: "The top edge" },
        { id: "bottom", label: "The bottom edge" },
        { id: "room", label: "The whole section" },
      ],
      default: "both",
    },
    {
      id: "register",
      label: "Register",
      options: [
        { id: "accent", label: "Accent" },
        { id: "identity", label: "Identity" },
      ],
      // Will's round-five ruling: "identity feels way too weak" at accent, so
      // accent is the global register. Identity stays reachable for a turn-up.
      default: "accent",
    },
    {
      id: "motion",
      label: "Motion",
      options: [
        { id: "live", label: "Live" },
        { id: "rest", label: "Rest" },
      ],
      default: "live",
    },
  ],

  lookFirst: [
    {
      section: "catalog",
      note: "Read the twelve. Each card is the real surface wearing the treatment, so nothing has to be switched to compare them.",
    },
    {
      section: "catalog",
      state: { ground: "app-dark" },
      note: "Lift and Float on the app's own dark, which is the question you could not see last round. Two keeps is the family; one keep is the lift only; two kills is dark stays shadowless.",
    },
    {
      section: "compare",
      state: { landing: "both" },
      note: "The seam against the aurora on one real chapter. Flip Landing: this is where the aurora goes, and the footer keeps its own seam either way.",
    },
    {
      section: "compare",
      state: { landing: "room" },
      note: "The placement error, shown rather than asserted: the copy now sits IN the light instead of in the clean band between two of them.",
    },
    {
      section: "open",
      note: "The four that are not cards. The clock is best judged by tapping 8s and walking the home page.",
    },
    {
      section: "pages",
      note: "The real routes. The seam where the paper ends and the footer begins is the reading.",
    },
  ],

  notes: [
    {
      section: "catalog",
      state: { ground: "paper" },
      text: "Nothing in the separate job moves on paper under any ruling here: lift on a light ground is the shipped value to the byte.",
    },
    {
      section: "compare",
      state: { register: "identity" },
      text: "Identity is the register you called way too weak. It stays reachable so that if Accent ever reads as too strong, this is the number to come back to.",
    },
  ],

  links: {
    bible: [3, 10, 11],
    spec: "docs/specs/light.md",
    pages: [
      { label: "Home", path: "/", note: "the footer seam and the film strip" },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the float, on the plan band",
      },
      {
        label: "The dashboard",
        path: "/dashboard",
        note: "the lift, on real event cards",
      },
    ],
  },
});
