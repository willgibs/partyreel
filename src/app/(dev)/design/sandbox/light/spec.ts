import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE LIGHT BOARD, AS DATA (round eight, 2026-09-17).
 *
 * ★ NOT A NEW EXPLORATION. The same proposals, asked so they can be answered.
 * This board has stopped Will's sitting twice. Round five: "Some I can't even
 * tell what the 'treatment' is from the comparison." Round seven, after the walk
 * was rebuilt one card at a time, he kept the three lamps ("our Aurora", never
 * on paper) and sent six cards back, and every note says the card did not show
 * him what it was asking about:
 *
 *   the step   "I can't tell what's being asked because I can't tell what the
 *              step is here visually."
 *   the ring   "Would like to see more examples of this in use to judge"
 *   lift       "since the top card in the stack is moved to a lower Y coordinate
 *              than the card below it, the shadows don't actually stack at all."
 *   float      "our step, ring, lift, and float: a set of four options to choose
 *              from, or are we trying to use everything, and if so, how?"
 *   the face   "Genuinely cannot see it in action here."
 *   the sweep  "I see the static gray edge ring, but can't get the animation to
 *              play, even by clicking replay. Stopping here."
 *
 * ★ SO THE WALK IS SIX STEPS HE CAN SEE, AND NOTHING ELSE. Three of the twelve
 * were never decisions (the step, the ring and the beam ship everywhere today,
 * and keeping them "lands nothing"); four were ONE decision drawn as four rival
 * cards on a pair whose geometry defeated the shadow; one was painted under the
 * photograph it was meant to edge; and the marks were hidden behind the object
 * they lit. Each step is a question in plain words, its options as tiles on ONE
 * specimen at true pixels, and a live stage under them.
 *
 * ★ EVERY STEP IS AN ASK, THE THREE MARKS INCLUDED, AND THE ORDER IS WHY. The
 * kit walks a board's catalog BEFORE its asks (`toSteps` in the desk's
 * session-step.ts), so three marks as cards would open the walk with the very
 * card that ended his last sitting and push `landing`, the one answer the home
 * page's wiring is waiting on, to fourth. As asks the walk is the brief's one to
 * six. Each mark is still its own decision (keep any, skip any); what leaves is
 * the keep, refine, kill row, and a refine is the note field every step has.
 *
 * ★ `candidates: ITEMS` KEEPS ITS SHAPE AND DECLARES NO CATALOG. The transcriber
 * (`scripts/lab-review.mjs`) reads this file as TEXT and resolves that reference
 * one hop to the const below. With no `catalog` the six are the board's list of
 * ideas still open (the meta panel prints them) and none of them queues as a
 * card; the three Will kept are gone from it, because a kept card in a new
 * round would read as unruled.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 */

/** The ideas still open, each asked by the step named in its `lands`. */
const ITEMS: readonly Candidate<
  "landing" | "depth" | "face" | "sweep" | "bloom" | "halo" | "paste"
>[] = [
  {
    id: "lift",
    name: "The small shadow (lift)",
    one: "A soft shadow where one card sits on another of the same lightness. Dark mode has never had one.",
    verdict: "ship",
    lands:
      "A shadow value in globals.css that dark mode gains. Light mode keeps today's bytes. Asked by the depth step.",
    rationale:
      "Six percent of black over a near-black room is invisible, which is why dark reads as shadowless. Raise the alpha and the same geometry works.",
    departures: [
      {
        id: "dark-shadow",
        from: "precedent",
        text: "A shadow in dark, where globals.css zeroes the float shadow by contract. Bible 10 already allows these two cases; on a light ground the small shadow is the shipped value to the byte, so paper does not move.",
        evidence: "depth",
      },
    ],
  },
  {
    id: "float",
    name: "The larger shadow (float)",
    one: "The same shadow at double the offsets, under a layer the page keeps living behind.",
    verdict: "ship",
    lands:
      "A second value beside it, worn by menus, dialogs, sheets and toasts in both modes. Asked by the depth step.",
    rationale:
      "A layer has to detach from content still living behind it. The scene puts it on the same photograph as the small one so the two sizes can be told apart.",
  },
  {
    id: "face",
    name: "The thin bright edge",
    one: "A one pixel highlight on a surface catching light: a photo, a player, the QR card.",
    verdict: "kill",
    lands:
      "One attribute in globals.css on three kinds of surface, drawn above the image. Asked by the face step.",
    rationale:
      "At true size it is a faint line on a dark photo and nothing on a bright one, and two of its three surfaces already carry an outline. Only the player's black canvas clearly gains an edge.",
  },
  {
    id: "sweep",
    name: "The streak of light (the sweep)",
    one: "One pass of light over a photo as it lands, with the border lighting where it passes. It ends.",
    verdict: "refine",
    lands:
      "The glow's comet and edge ring, played once. The engine only loops today. Asked by the sweep step.",
    rationale:
      "Half the engine's recipe never shipped. It is drawn over the object now, where it can be seen, and once, because an arrival is not a loop.",
  },
  {
    id: "bloom",
    name: "The glow that stays (the bloom)",
    one: "A one-time glow that settles to a soft resting light, so the object stays lit afterwards.",
    verdict: "ship",
    lands:
      "A resting light under the publish moment. The QR card already ships one. Asked by the bloom step.",
    rationale:
      "A beat that decays to nothing leaves the object exactly as it was. A resting light is what makes a moment worth having.",
  },
  {
    id: "halo",
    name: "The glow behind a button (the halo)",
    one: "Colour circles a button's rim from behind and its face stays clean.",
    verdict: "kill",
    lands:
      "A wrapper on one dark button a page, argued every time. Skipping it drops a standing exception.",
    rationale:
      "On a white primary it can only tint, never light, and its own fence is argue it every time. That is not a rule anybody can follow.",
  },
];

export const LIGHT = defineBoard({
  id: "light",
  title: "Light, shadow and lamp",
  question:
    "Six things are still open: where the Aurora sits on a section, whether dark mode gets shadows, one thin edge on photos, and three short moments of light.",

  round: {
    n: 8,
    date: "2026-09-17",
    changed:
      "Six steps you can see, in the order the wiring needs them. The Aurora forms you kept have left the walk, the four depth cards are one question on one scene with a legend, the thin edge is enlarged, and the three moments of light now play.",
  },
  history: [
    {
      n: 7,
      date: "2026-09-16",
      changed:
        "Reshaped to be walked one card at a time. Will kept the seam, the throw and the aurora as one Aurora, answered three calls, ruled the Aurora off light grounds, and sent six cards back.",
    },
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
    "Three explorations set this identity, and round five ruled its shape: light sorts by what it is doing, and a lamp needs a place rather than an object. Round seven kept the Aurora in three forms (the seam, the throw, the field), never on a light ground, and answered the clock (8 seconds), the publish colour (the house five) and what lands second (the home page's two ends). Three things left the walk because they were never decisions: the lighter panel and the thin outline ship on every surface, and the beam ships on the Pro card and is ruled.",

  verdict: {
    recommendation:
      "Put the Aurora at both edges, give dark mode both shadows, let a publish settle to a soft glow, and skip the thin edge, the streak and the lit button.",
    because:
      "The first two are what the wiring is waiting on, and both are drawn where they can be judged. The resting glow already ships on the QR card. The other three are honest nos: the edge is a faint line on dark photos and nothing on bright ones, the streak repeats two things you turned down last month, and the lit button can only tint the button that matters.",
    overrule:
      "Any of the three nos is cheap to reverse: each is one step, and a yes lands as its own small piece of wiring.",
  },

  /**
   * ★ SIX STEPS, IN THE ORDER THE WIRING NEEDS THEM. `landing` first: the home
   * page's two call sites wait on it and nothing else. Every step mirrors a
   * declared control, so a press on a tile SHOWS it on the stage before
   * anything is recorded, and every control DEFAULTS TO THE PROPOSAL, so the
   * stage opens on the thing being asked about (for the three moments, that is
   * what makes them run on arrival).
   */
  asks: [
    {
      id: "landing",
      question:
        "Where should the Aurora sit on a section that has no photos in it?",
      context:
        "The Aurora is the coloured glow you kept. This is the last section of the home page, which has no photos, so the glow is its only colour. The small drawing on each picture marks where the light is, because the real glow is quiet at this size. The footer under it keeps its own glow whichever you choose.",
      options: [
        {
          id: "both",
          label: "At the top and the bottom",
          means:
            "A band of glow where the section starts and another where it ends. The words sit in the clear space between.",
        },
        {
          id: "top",
          label: "At the top only",
          means:
            "One band where the section starts, fading down into the words.",
        },
        {
          id: "bottom",
          label: "At the bottom only",
          means:
            "One band where the section ends, leading into whatever comes next.",
        },
        {
          id: "room",
          label: "Across the whole section",
          means:
            "The glow fills the section, so the words sit inside the light.",
        },
      ],
      recommended: "both",
      because:
        "Two edges give the section a shape of its own and keep the middle clear, which is where the words are. Filling it puts colour behind the text.",
      evidence: "landing",
      control: "landing",
      lands:
        "Where the Aurora goes on the home page's two sections without photos, and the default for any section that takes it later.",
      strip: ["canvas"],
    },
    {
      id: "depth",
      question: "Should dark mode get shadows?",
      context:
        "Dark mode has no shadows today. A panel stands out because it is a shade lighter than the page and has a thin outline. Both of those ship everywhere and neither is in question. That leaves two cases: one photo sitting on another, and a menu floating over a busy page. Look at the lower photo in each picture: the front card's shadow lands on its left, the menu's on its right.",
      options: [
        {
          id: "none",
          label: "No shadows, as today",
          means:
            "Nothing changes. Overlapping photos and open menus rely on their outlines alone.",
        },
        {
          id: "both",
          label: "Under cards and under menus",
          means:
            "A small shadow where one card sits on another, and a larger one under menus, dialogs and toasts.",
        },
        {
          id: "float-only",
          label: "Under menus only",
          means:
            "Menus, dialogs and toasts get a shadow. Overlapping cards stay as today.",
        },
      ],
      recommended: "both",
      because:
        "These are the two places where one thing really sits on another, which is exactly what the design rules already allow. A flat panel gets neither: a shadow on flat black is a smudge.",
      overrule:
        "If the small one reads as dirt rather than depth on your screen, menus only is the safe half.",
      evidence: "depth",
      control: "depth",
      lands:
        "Two shadow values for dark mode: a small one for overlapping cards, a larger one for anything that floats. Light mode keeps today's values.",
      strip: ["outline", "surface"],
    },
    {
      id: "face",
      question:
        "Should photos and screens get a thin bright edge, as if catching light?",
      context:
        "The idea is a one pixel bright line along the top of a photo, a video player or the QR card, so it reads as a lit object rather than a flat rectangle. It is very fine, so each picture has its top left corner enlarged four times beside it. Judge the large photo first, then the corner.",
      options: [
        {
          id: "skip",
          label: "As today",
          means: "No extra line. Photos and players keep the edges they have.",
        },
        {
          id: "keep",
          label: "With the bright edge",
          means:
            "A one pixel highlight along the top and a faint line around, on photos, players and the QR card only.",
        },
      ],
      recommended: "skip",
      because:
        "On the large photo it is a faint line you have to hunt for, and on a bright photo it is not there at all. The QR card and framed screens already have an outline. Only the player's black canvas clearly gains an edge, and the thin outline that ships everywhere can do that alone.",
      overrule:
        "If the faint line around the large photo reads as polish to you rather than as nothing, keep it.",
      evidence: "face",
      control: "face",
      lands:
        "One edge style on three kinds of surface: photos and video, framed screens, and the QR card. Nothing else would get it.",
    },
    {
      id: "sweep",
      question:
        "When a new photo lands, should a streak of light pass over it once?",
      context:
        "This marks one moment: a guest's photo arriving in the album, or a frame joining a strip. A band of the Aurora's colours crosses the photo once, the border lights where it passes, and then it is gone. It never loops. The small pictures repeat so you can catch it; press Replay on the large one.",
      options: [
        {
          id: "skip",
          label: "As today",
          means: "The photo fades in, as every new photo does now.",
        },
        {
          id: "keep",
          label: "With the streak of light",
          means:
            "The same fade, then one pass of light across the photo, a little over a second, then nothing.",
        },
      ],
      recommended: "skip",
      because:
        "You turned down its two halves last month: light on an upload felt very forced, and a ring appearing around a photo read as a border rather than as light. Drawn properly, it is still both.",
      overrule:
        "If it reads as a celebration rather than as decoration now that you can see it run, keep it.",
      evidence: "sweep",
      control: "sweep",
      lands:
        "One effect for an arriving photo or frame. It needs a play-once mode the glow does not have yet.",
    },
    {
      id: "bloom",
      question:
        "After a host publishes, should the reel's frame stay softly lit?",
      context:
        "Publishing makes the frame around the reel glow for a moment, in the Aurora's colours, which you ruled last round. Today that glow fades to nothing. The proposal lets it settle to a soft light that stays, the way the QR card's glow already does on the features page. Watch what each one leaves behind.",
      options: [
        {
          id: "skip",
          label: "It fades to nothing, as today",
          means:
            "The glow swells and disappears. A second later the frame looks exactly as it did before.",
        },
        {
          id: "keep",
          label: "It settles to a soft glow",
          means:
            "The same swell, resting at a low light, so a published reel looks different from a draft.",
        },
      ],
      recommended: "keep",
      because:
        "A moment that leaves nothing behind changes nothing. The resting light is what tells a host at a glance that this reel is live, and the QR card already does it.",
      evidence: "bloom",
      control: "bloom",
      lands:
        "How the publish moment ends, and the rule for every one-time glow after it: rest lit, or return to nothing.",
    },
    {
      id: "halo",
      question: "Should one button a page get a glow circling it from behind?",
      context:
        "Colour travels around the rim of a button from behind, and its face stays clean. On a dark button it reads as light. On the white main button, which is where a page's most important action usually is, white cannot get any brighter, so the same glow only tints it pastel. The large picture shows both.",
      options: [
        {
          id: "skip",
          label: "No, buttons stay as they are",
          means: "No button glows. One less exception to remember.",
        },
        {
          id: "keep",
          label: "Yes, on one dark button a page",
          means:
            "One secondary button a page may carry it, and each use has to be argued for.",
        },
      ],
      recommended: "skip",
      because:
        "On the button that matters most it can only tint, never light. And a rule that has to be argued every time is not a rule anybody can follow.",
      overrule:
        "If the lit dark button is worth having on its own, keep it and the white button simply never wears it.",
      evidence: "halo",
      control: "halo",
      lands:
        "Whether a lit button exists at all. Skipping it removes a standing exception from the light rules.",
    },
  ],

  candidates: ITEMS,

  /**
   * ★ NO `catalog`, AND NO `reading` DECLARATION. The first is the header's
   * third star. The second is round seven's own result, kept: this board weighs
   * well under the 1,200 words every board is held to, so the escape hatch
   * stays deleted. If a later round adds words back, earn the budget again
   * rather than declaring past it.
   */

  departures: [
    {
      id: "qr-is-a-mark",
      from: 3,
      text: "The QR card's shipped light is a moment, not spill: a glow with no direction, which the second law refuses. Naming what it is doing is what makes it legal.",
      evidence: "bloom",
    },
  ],

  assets: [
    {
      what: "A grain tile, so the Aurora stops banding",
      spec: "Seamless monochrome noise, 256x256 PNG-8, one-pixel grain, mean 50 percent grey, laid out at 128 CSS px on a 2x screen.",
      replaces:
        "the inline feTurbulence stand-in in board.css ([data-lgt-grain]).",
      row: 15,
    },
    {
      what: "A worst-case pair of overlapping photographs",
      spec: "Two images whose touching edges are dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG.",
      replaces: "the mid-key pair the depth scene's two shadows fall on.",
      row: 16,
    },
  ],

  sections: [
    {
      id: "landing",
      title: "Where the Aurora sits",
      lede: "One real section of the home page at the placement picked in the dock. The footer keeps its own glow under all four.",
    },
    {
      id: "depth",
      title: "Shadows in dark mode",
      lede: "One dark screen with a panel, two overlapping cards and an open menu, and the legend of how the four work together.",
      argument: [
        "One geometry, two sizes, one strength per ground. The small shadow is today's light-mode float shadow to the byte (a 2 and 4 pixel offset, blur twice the offset, one source above) and the larger one is that at double the offsets. What changes in dark is only the strength, because a shadow has to be darker than what it falls on: six percent of black over a near-black room is arithmetically invisible, which is the real reason dark reads as shadowless today.",
      ],
    },
    {
      id: "face",
      title: "The thin bright edge",
      lede: "The three kinds of surface it would land on, each with its top left corner enlarged four times.",
    },
    {
      id: "sweep",
      title: "The streak of light",
      lede: "One photo landing, with a Replay. The light crosses it once and is gone.",
    },
    {
      id: "bloom",
      title: "The glow that stays",
      lede: "The reel's frame at the moment of publishing, with a Replay. Watch what it leaves behind.",
    },
    {
      id: "halo",
      title: "The glow behind a button",
      lede: "The end of a flow with its two buttons, and the white button wearing the same glow underneath.",
    },
    {
      id: "paste",
      title: "What a wiring round lands",
      lede: "The two blocks that are still proposals, as the exact CSS, each with a switch that hands it to the real site.",
      wiring: [
        "Re-pointing the 38 float-shadow call sites and the roughly 30 raw Tailwind shadows is the wiring round's sweep. Until it runs the old token aliases the new one on the light grounds, where the two are the same bytes and nothing moves; on the dark grounds it keeps its zero by contract, so the surfaces that take a shadow in dark are named one by one instead.",
        "The thin edge has to ride a pseudo-element above the image. An inset box-shadow on a media tile paints under the photograph that covers it, which is why round seven's card showed nothing.",
      ],
    },
  ],

  /**
   * ★ EVERY STEP'S TILES ARE A DECLARED CONTROL, and each defaults to the
   * proposal so the stage opens on the thing being asked about. `outline` and
   * `surface` are the depth step's two switches: they ask nothing, they let a
   * reviewer take away the two things that already ship and see what each was
   * doing (Will on the ring: "more examples of this in use to judge").
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
      id: "landing",
      label: "The Aurora sits",
      options: [
        { id: "both", label: "Top and bottom" },
        { id: "top", label: "Top" },
        { id: "bottom", label: "Bottom" },
        { id: "room", label: "Everywhere" },
      ],
      default: "both",
    },
    {
      id: "depth",
      label: "Shadows",
      options: [
        { id: "none", label: "None" },
        { id: "both", label: "Cards and menus" },
        { id: "float-only", label: "Menus only" },
      ],
      default: "both",
    },
    {
      id: "outline",
      label: "Thin outlines",
      options: [
        { id: "on", label: "On" },
        { id: "off", label: "Off" },
      ],
      default: "on",
    },
    {
      id: "surface",
      label: "Lighter panels",
      options: [
        { id: "on", label: "On" },
        { id: "off", label: "Off" },
      ],
      default: "on",
    },
    {
      id: "face",
      label: "Bright edge",
      options: [
        { id: "skip", label: "As today" },
        { id: "keep", label: "With it" },
      ],
      default: "keep",
    },
    {
      id: "sweep",
      label: "Streak of light",
      options: [
        { id: "skip", label: "As today" },
        { id: "keep", label: "With it" },
      ],
      default: "keep",
    },
    {
      id: "bloom",
      label: "After a publish",
      options: [
        { id: "skip", label: "Fades out" },
        { id: "keep", label: "Stays lit" },
      ],
      default: "keep",
    },
    {
      id: "halo",
      label: "Lit button",
      options: [
        { id: "skip", label: "As today" },
        { id: "keep", label: "With it" },
      ],
      default: "keep",
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
      section: "landing",
      note: "Where the Aurora goes on a section without photos. It is the one answer the home page is waiting on.",
    },
    {
      section: "depth",
      state: { depth: "both" },
      note: "Both shadows fall on the same photograph: the small one under the front card, the larger one under the menu. Switch the outlines and the lighter panels off to see what each was doing.",
    },
    {
      section: "bloom",
      state: { bloom: "keep" },
      note: "Press Replay and look at the frame a second after the glow ends.",
    },
  ],

  links: {
    bible: [3, 10, 11],
    spec: "docs/specs/light.md",
    pages: [
      { label: "Home", path: "/", note: "the film strip's photo tiles" },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the larger shadow, on the plan band's menus",
      },
      {
        label: "The dashboard",
        path: "/dashboard",
        note: "the small shadow, on real event cards",
      },
    ],
  },
});
