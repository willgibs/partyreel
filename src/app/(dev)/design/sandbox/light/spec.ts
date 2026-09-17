import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE LIGHT BOARD, AS DATA (round seven, the stepped review, 2026-09-16).
 *
 * ★ THE ROUND IS A RESHAPE, NOT AN EXPLORATION. Nothing new is proposed here:
 * the same twelve treatments, the same four calls. What changed is that the
 * board can be WALKED. Will stopped his sitting on this board and said why:
 * "are each of these individually proposed treatments? How will each be applied
 * platform wide? Some I can't even tell what the 'treatment' is from the
 * comparison", and then the shape he wanted: "handled 1 at a time for more
 * details (where it'll be used, a couple demo usages, etc)... Once those 12
 * light placements are handled, move that context out and bring in new context
 * to frame the shadow specific questions. Then new context again for the lamp
 * breathe speed question."
 *
 * So: `mode: "keep-any"` and `walk: "one-at-a-time"`. Every card is one screen
 * with the same specimen drawn twice (as today, then with it), what keeping it
 * LANDS as platform-wide, and up to two real surfaces already wearing it. The
 * cards run in his order: the light placements, then the shadow-specific ones,
 * then the marks. Each of the four calls is its own step, with every option
 * drawn on the step's one specimen.
 *
 * ★ THREE SPECIMENS, ONE PER JOB, AND NOTHING ELSE MOVES. Across the cards of
 * one job the object, the crop, the ground and the canvas are identical, so the
 * treatment is the only variable there is: the lamps on one real chapter (the
 * closer), the depth cues on one pair of overlapping event cards on the app's
 * dark, the marks on one reel frame. That is the direct answer to "some I can't
 * even tell what the treatment is".
 *
 * ★ WHAT WAS ALREADY RULED IS NOT ASKED AGAIN (docs/reviews/light.json, round
 * five): the kit lands, the shadows go first, Accent is the global register.
 * The two he could not answer are a card (lift and float) and a staged question
 * (where the aurora lands, asked only once the aurora is kept).
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 */

/**
 * THE TWELVE, IN WILL'S ORDER: the light placements, the shadow-specific ones,
 * the marks. `lands` is the platform-wide consequence of keeping the card, read
 * off `kit.ts`'s own `where` and `ships`; the `verdict` is the BOARD's call,
 * drawn as the card's pill; Will answers each card keep, refine or kill.
 */
const ITEMS: readonly Candidate<
  "catalog" | "aurora" | "clock" | "hues" | "beat" | "order" | "pages" | "paste"
>[] = [
  /* ── THE LIGHT PLACEMENTS ─────────────────────────────────────────────── */
  {
    id: "seam",
    name: "The seam",
    one: "A band at full strength where two grounds meet, falling away from the edge. The footer's own lamp.",
    verdict: "ship",
    lands:
      "A band at any boundary between two grounds. It already lights the footer, the film strip and the feature screens.",
    rationale:
      "The one lamp you named as the model, and the one that was illegal under the law that used to open the doctrine. Keeping it makes the law follow the lamp.",
  },
  {
    id: "throw",
    name: "The throw",
    one: "Light cast from a point on the object, so a plate on open dark sits on its own glow.",
    verdict: "refine",
    lands:
      "A wrapper at the call site: the QR plate, and a card overhanging open dark. One per page at most.",
    rationale:
      "A rim has no direction, which is the one shape the doctrine refuses. Anchoring the light to a point on the object makes the same glow legal.",
  },
  {
    id: "aurora",
    name: "The aurora",
    one: "The footer's light at chapter scale: a field at a section's own edges, behind the copy.",
    verdict: "refine",
    recommended: true,
    lands:
      "A new SectionLight component, so a chapter with no media in it can ask for light. One chapter a page.",
    rationale:
      "The fill job at chapter scale, and the one thing none of the three explorations had a name for. Where it lands is the next question, and only if you keep this.",
    departures: [
      {
        id: "per-section-temperature",
        from: 3,
        text: "A section may retune the five lamp hues for everything inside it. Bible 3 holds (light, never UI), but a per-section temperature is a new licence.",
        evidence: "aurora",
      },
    ],
    assets: [
      {
        what: "A grain tile, so the aurora stops banding",
        spec: "Seamless monochrome noise, 256x256 PNG-8, one-pixel grain, mean 50 percent grey, laid out at 128 CSS px on a 2x screen.",
        replaces:
          "the inline feTurbulence stand-in in board.css ([data-lgt-grain]).",
        row: 15,
      },
    ],
  },

  /* ── THE SHADOW-SPECIFIC ONES ─────────────────────────────────────────── */
  {
    id: "step",
    name: "The step",
    one: "A surface one token lighter than the one under it. The cheapest separation, and it costs no paint.",
    verdict: "ship",
    lands:
      "Nothing moves: this is every card, panel and well on the site today. Keeping it writes the technique down.",
    rationale:
      "The floor the other four stand on. Nothing else is reached for until the step is not enough.",
  },
  {
    id: "ring",
    name: "The ring",
    one: "A hairline that states an edge without implying height. 77 uses, written down nowhere.",
    verdict: "ship",
    lands:
      "Nothing moves either: the same hairline on cards, panels, frames and inputs, named as the fourth technique.",
    rationale:
      "The fourth depth technique, in no document. Naming it is the whole change.",
  },
  {
    id: "lift",
    name: "Lift",
    one: "A soft shadow under two things of the same lightness that overlap. Dark has never had one.",
    verdict: "ship",
    lands:
      "A shadow token in globals.css, dark gaining the alpha it never had. Paper keeps today's bytes exactly.",
    rationale:
      "Six percent of black over a near-black room is invisible, which is why dark reads as shadowless. Raise the alpha and the family works.",
    departures: [
      {
        id: "dark-shadow",
        from: 10,
        text: "A shadow in DARK, where the elevation contract reads 'no shadows anywhere'. On a light ground lift is the shipped value to the byte, so paper does not move.",
        evidence: "catalog",
      },
    ],
  },
  {
    id: "float",
    name: "Float",
    one: "The same shadow at double the offsets, under a layer the page keeps living behind.",
    verdict: "ship",
    lands:
      "A second shadow token beside it, worn by every floating primitive, in both modes. A flat surface takes neither.",
    rationale:
      "A layer has to detach from content still living behind it. The card draws it on the same overlap as lift so the two sizes can be told apart.",
  },
  {
    id: "face",
    name: "The lit face",
    one: "A thin bright edge on a surface catching light: a media frame, a screen, the QR plate.",
    verdict: "refine",
    lands:
      "An attribute in globals.css, on the gallery canvas, the QR plate and a screen frame. Nowhere else.",
    rationale:
      "Material rather than elevation, fenced to three surfaces so it never becomes a fifth way of separating things.",
    departures: [
      {
        id: "ring-lift",
        from: "precedent",
        text: "The ring and the lit face both ship and neither is documented. Writing them down makes four techniques official where two were.",
        evidence: "catalog",
      },
    ],
  },

  /* ── THE MARKS ────────────────────────────────────────────────────────── */
  {
    id: "sweep",
    name: "The sweep",
    one: "A comet and a matching edge ring: an object arriving from outside the frame. It ends.",
    verdict: "refine",
    lands:
      "The engine's edge ring turned on beside the comet, at an upload landing or a frame joining a strip.",
    rationale:
      "Half the engine's recipe never shipped: we took the comet and left the edge ring behind.",
  },
  {
    id: "bloom",
    name: "The bloom",
    one: "A one-shot that decays to a base, never to nothing, so the object stays lit afterwards.",
    verdict: "refine",
    lands:
      "A resting base under the one-shot, on the publish beat and the QR plate. The plate already carries it.",
    rationale:
      "A beat that decays to nothing leaves the object exactly as it was. A base is what makes a moment worth having.",
    departures: [
      {
        id: "publish-violet",
        from: "ruling",
        text: "A ratified violet moves five degrees into the lamp set and decays to a base rather than to nothing, so it is asked rather than taken.",
        evidence: "beat",
      },
    ],
  },
  {
    id: "halo",
    name: "The halo",
    one: "An object lit from behind: colour creeps in at the rim, the face of it stays clean.",
    verdict: "kill",
    lands:
      "A wrapper on one secondary action a page, argued every time. Killing it drops a standing exception.",
    rationale:
      "It cannot light a white primary, and its own fence is argue it every time. That is not a treatment.",
  },
  {
    id: "beam",
    name: "The beam",
    one: "A travelling border on the object whose state is running, or on Pro at rest.",
    verdict: "ship",
    lands:
      "Nothing moves: one wrapper, one subject per view. Counted here rather than re-argued.",
    rationale:
      "Ruled and shipped, with four laws and one standing exception. It is on the board so the twelve are the whole set.",
  },
];

/**
 * ★ NO `facts` ROW ON ANY CARD, AND `lands` IS WHY. The four facts were round
 * six's grammar and the first of them was always "Lands", which is now a field
 * of its own that the walk prints under the card's one line. A second copy of
 * the same sentence in `facts` would be a line that drifts; the other three
 * facts were a register and a rest state, which are the wiring round's numbers
 * rather than a reviewer's reading.
 */

export const LIGHT = defineBoard({
  id: "light",
  title: "Light, shadow and lamp",
  question:
    "Which of the twelve treatments should the light system carry, and what is left open once they are ruled?",

  round: {
    n: 7,
    date: "2026-09-16",
    changed:
      "Reshaped to be walked: one card at a time, each drawn twice on the one specimen its job is judged on, with what keeping it lands as. No new treatment.",
  },
  history: [
    {
      n: 6,
      date: "2026-09-16",
      changed:
        "Rebuilt as a catalog: twelve treatments as cards, nine asks cut to four, the argument folded underneath.",
    },
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "The nine asks rewritten in plain words. Will ruled three: the kit lands, the shadows go first, Accent is the register.",
    },
  ],
  context:
    "Three explorations set this identity: one named the shapes light can take, one decided where a light is earned, and this board asked what the system would be if designed today. Its answer, ruled at round five: light sorts by the JOB it does, and a lamp needs a PLACE rather than an object.",

  verdict: {
    recommendation:
      "Keep the twelve as they stand, and begin with the shadows: the separate job first, on every surface, in both modes.",
    because:
      "The shape is ruled, so what is open is card by card. Six of the twelve already run in production, and the shadows are the only phase that needs nothing from any other board.",
    overrule:
      "A shadow in dark is the one genuinely new claim. Kill lift and float and the other ten still stand.",
  },

  /**
   * ★ FIVE STEPS AFTER THE CARDS, EACH WITH ITS OWN CONTEXT AND ITS OWN
   * SPECIMEN (Will: "move that context out and bring in new context"). Four of
   * them draw every option on one picture; the fifth is an ORDER, which is a
   * plan rather than a thing to look at, so it stays words. The aurora's
   * landing is STAGED: it is asked only once the aurora card is kept, which is
   * the question he could not read last round as four bare words.
   */
  asks: [
    {
      id: "landing",
      question: "Where on a chapter should the aurora's light sit?",
      context:
        "The aurora is a field of house light at a chapter's own edges, on a section with no media in it. The footer is not in question under any of these: it keeps its own seam either way.",
      options: [
        {
          id: "both",
          label: "At both edges",
          means:
            "A band where the chapter starts and another where it ends, with the copy in the clean band between them.",
          state: { landing: "both" },
        },
        {
          id: "top",
          label: "At the top edge only",
          means:
            "One band where the chapter starts, falling away into the copy below it.",
          state: { landing: "top" },
        },
        {
          id: "bottom",
          label: "At the bottom edge only",
          means:
            "One band where the chapter ends, so the light hands off to whatever comes next.",
          state: { landing: "bottom" },
        },
        {
          id: "room",
          label: "Filling the whole section",
          means:
            "A lit room. The copy then sits in the light instead of between two bands of it.",
          state: { landing: "room" },
        },
      ],
      recommended: "both",
      because:
        "Two edges give the chapter a shape of its own and leave the middle clean, which is where the copy is. The room is here to be looked at rather than argued with.",
      evidence: "aurora",
      control: "landing",
      lands:
        "The placement grammar SectionLight ships with, on every chapter that takes a field.",
      after: { item: "aurora", verdict: "keep" },
      strip: ["canvas"],
    },
    {
      id: "cadence",
      question: "How slowly should a lamp breathe?",
      context:
        "Every lamp on the site drifts on one shared clock. The engine runs a cycle in 8 seconds; the footer alone was slowed to 11 back when it was the only lamp anywhere.",
      options: [
        {
          id: "8s",
          label: "8 seconds, the engine's own clock",
          means:
            "Every lamp, the footer included, breathes on the cycle the engine ships.",
          state: { cadence: "8s" },
        },
        {
          id: "11s",
          label: "11 seconds, the footer's slower clock",
          means:
            "The footer keeps its slower cycle and every other lamp joins it.",
          state: { cadence: "11s" },
        },
      ],
      recommended: "8s",
      look: "Two tiles cannot settle this. The knob writes the clock on the real site, for a walk down the home page.",
      evidence: "clock",
      control: "cadence",
      lands:
        "One token in globals.css: every lamp on the site, and the field's own slower clock, multiply from it.",
      strip: ["canvas"],
    },
    // ★ THE `paper` ASK WAS WITHDRAWN (Will, 2026-09-17, on the board): "After
    // experimenting with these, we may not be able to use the Aurora on
    // white/paper surfaces... No light ground usage is a decision for now."
    // The question assumed a lamp on the light ground; the decision is that
    // there is none, which no option said, so the ask leaves rather than sit
    // on the desk unanswered. The hues section stays as the evidence he judged
    // it on; docs/design/rulings.md carries the words and the ROADMAP the flag
    // on the app's light mode.
    {
      id: "publish",
      question: "What colour should the publish flourish be?",
      context:
        "When a host publishes an event the reel's frame flashes violet, a ratified colour, and fades to nothing. The proposal is a bloom in the lamp set's own colours, leaned toward violet, fading to a resting base.",
      options: [
        {
          id: "300",
          label: "As shipped: the violet flash",
          means: "The beat stays exactly as it is, and fades to nothing.",
          state: { beat: "300" },
        },
        {
          id: "house-five",
          label: "A bloom in the house five",
          means:
            "The lamp set's colours with no lean, so there is no meaning in the hue at all.",
          state: { beat: "house-five" },
        },
        {
          id: "305",
          label: "The five, leaned to violet",
          means:
            "The same bloom narrowed toward violet, so it still reads as the reel's colour and leaves the frame lit.",
          state: { beat: "305" },
        },
      ],
      recommended: "305",
      look: "Watch what each one leaves behind, not what it does while it runs.",
      evidence: "beat",
      control: "beat",
      lands:
        "The publish beat's own keyframe, and a ratified violet moved five degrees into the lamp set.",
    },
    {
      id: "second",
      question: "Once the shadows land, what should land second?",
      context:
        "The light enters the site in phases, and you ruled the shadows first. Three things could go second, and each one waits on something different before it can start.",
      look: "The three rows under the tiles say what each one is waiting on before it can start.",
      options: [
        {
          id: "home-arc",
          label: "The home page's two ends",
          means:
            "The aurora on exactly two sections of the home page: the guest ledger, and the closer above the footer.",
        },
        {
          id: "paper",
          label: "Paper",
          means:
            "The five hues re-declared on the light ground, then the aurora on the paper chapters.",
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
      evidence: "order",
      lands:
        "Which surfaces the wiring round touches after the shadows, and which other board it has to wait for.",
    },
  ],

  candidates: ITEMS,

  /**
   * ★ KEEP-ANY, ONE AT A TIME. Each card is its own proposal rather than a
   * variant of one thing, so each takes a verdict; the walk shows one at a
   * time because Will asked for it in those words ("1 at a time may be more
   * helpful here"). No compare controls: the comparison a card needs is its own
   * before and after, which is the only comparison that holds every other
   * variable still.
   */
  catalog: {
    section: "catalog",
    control: "treatment",
    mode: "keep-any",
    walk: "one-at-a-time",
  },

  /**
   * ★ NO `reading` DECLARATION, AND THAT IS THE ROUND'S OWN RESULT. Round five
   * weighed 10,164 words outside its folds, round six 2,889 against a declared
   * 2,950; this one weighs 920 against the 1,200 every board is held to, so the
   * escape hatch is deleted rather than re-tuned. Two things did it: the board
   * says a third less (twelve one-lines and five questions, no four-fact strip,
   * no argument above a fold), and the stepped review stopped printing every
   * ask in a panel, every lede again in an index and the meta panel's twelve
   * cards unfolded. If a later round adds words back, earn the budget again
   * rather than declaring past it.
   */

  departures: [
    {
      id: "qr-is-a-mark",
      from: 3,
      text: "The QR plate's shipped light is a MARK, not spill: a bloom with no direction, which the second law refuses. Naming the job is what makes it legal.",
      evidence: "catalog",
    },
    {
      id: "paper-lamps",
      from: "ruling",
      text: "A hand-tuned five on the paper surface: the first time the lamp hues are re-declared per ground.",
      evidence: "hues",
    },
  ],

  assets: [
    {
      what: "A worst-case pair of overlapping photographs",
      spec: "Two images whose touching edges are dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG.",
      replaces: "the mid-key overlap pair the shadow cards are drawn on.",
      row: 16,
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The twelve",
      lede: "Each treatment twice on the one specimen its job is judged on: as today, then with it. Under it, the real surfaces wearing it.",
      argument: [
        "ORGANISED BY WHAT THE LIGHT IS DOING, ruled at round five. Three jobs that do not overlap: SEPARATE is achromatic and static (the step, the ring, the two shadows, the lit face); FILL is chromatic, slow and always behind content (the seam, the throw, the aurora); MARK is chromatic, bounded, and ends when its state ends (the sweep, the bloom, the halo, the beam). Six of the twelve already run in production and nobody had written down what they were called, which is why the kill list matters more than the keep list.",
      ],
    },
    {
      id: "aurora",
      title: "Where the aurora lands",
      lede: "One real chapter at each of the four placements. The footer keeps its own seam under all of them.",
    },
    {
      id: "clock",
      title: "How slowly a lamp breathes",
      lede: "One real chapter at each number, and a knob that writes the clock on the site for a walk.",
    },
    {
      id: "hues",
      title: "The five hues, on paper",
      lede: "One real paper chapter under each row, with the row's own swatches beneath it.",
    },
    {
      id: "beat",
      title: "The publish flourish",
      lede: "The reel's frame under each beat, with a Replay. Watch what it leaves behind.",
    },
    {
      id: "order",
      title: "What lands second",
      lede: "The shadows are ruled. What each candidate for second is waiting on.",
    },
    {
      id: "pages",
      title: "The real pages",
      lede: "The production routes at true pixels, as built and wearing the picked card's block.",
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The blocks a wiring round lands, and the bill of materials under them.",
      wiring: [
        "Re-pointing the 38 float-shadow call sites and the roughly 30 raw Tailwind shadows is the wiring round's sweep. Until it runs the old token aliases the new one on the light grounds, where the two are the same bytes and nothing moves; on the dark grounds it keeps its zero by contract, so the surfaces that take a shadow in dark are named one by one instead.",
      ],
    },
  ],

  /**
   * ★ SEVEN CONTROLS, AND FOUR OF THEM ARE A STEP'S OWN TILES. A control that
   * serves exactly one decision is that decision's option states now (Landing,
   * Cadence, Hues, Beat): the walk draws every option on the step's specimen
   * and a reviewer never meets the switch. They stay DECLARED because that is
   * what an option state is written against, and because the whole board is
   * still browsable. Ground and Register left entirely: each job's specimen
   * fixes its own ground, and Accent is ruled.
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
      id: "treatment",
      label: "Treatment",
      // Nothing picked is a state of its own (Will, 2026-09-16): the real pages
      // show the site as built until a card is picked, and pressing the picked
      // card returns here.
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "seam", label: "The seam" },
        { id: "throw", label: "The throw" },
        { id: "aurora", label: "The aurora" },
        { id: "step", label: "The step" },
        { id: "ring", label: "The ring" },
        { id: "lift", label: "Lift" },
        { id: "float", label: "Float" },
        { id: "face", label: "The lit face" },
        { id: "sweep", label: "The sweep" },
        { id: "bloom", label: "The bloom" },
        { id: "halo", label: "The halo" },
        { id: "beam", label: "The beam" },
      ],
      default: "none",
      clearable: true,
    },
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
      id: "cadence",
      label: "Cadence",
      options: [
        { id: "8s", label: "8 seconds" },
        { id: "11s", label: "11 seconds" },
      ],
      default: "8s",
    },
    {
      id: "hues",
      label: "Hues",
      options: [
        { id: "hand-tuned", label: "Hand-tuned" },
        { id: "flat", label: "One flat correction" },
        { id: "dark", label: "The dark five" },
      ],
      default: "hand-tuned",
    },
    {
      id: "beat",
      label: "Beat",
      options: [
        { id: "300", label: "As shipped" },
        { id: "house-five", label: "The house five" },
        { id: "305", label: "Leaned to violet" },
      ],
      default: "305",
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
      note: "Read the twelve in order: the three lamps, the five depth cues, the four marks. Each is the same picture twice, so the only difference is the treatment.",
    },
    {
      section: "aurora",
      note: "Where the aurora goes, once you have kept it. The footer keeps its own seam under all four.",
    },
    {
      section: "order",
      note: "The one call that is a plan rather than a picture: what the wiring round touches after the shadows.",
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
