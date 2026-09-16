import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE LIGHT BOARD, AS DATA (the kit round, 2026-09-15; the asks rewritten in
 * plain words the same night, the clarity round).
 *
 * Nothing here is new argument: every ask, candidate, departure and asset is the
 * round-four board's, moved out of `board.tsx` and out of `BoardMeta`'s prop
 * strings so that the template, the desk, the record and the review ledger read
 * ONE list. What changed is where a reviewer meets them: the verdict and the
 * nine calls are now the first screen instead of the last.
 *
 * ★ THIS IS THE EXEMPLAR OF AN ASK IN PLAIN WORDS. Will's first review answered
 * three of these and stopped at two ("The aurora's placement: no | seam | both
 * | room": "am I being asked what aurora placement within the footer? Or what
 * aurora replacement looks better in general?"). So every ask is a question a
 * stranger can answer: what the thing is (`context`), where to look (`look`),
 * each option in words with what choosing it does, and the dock state that
 * shows it. The ids never changed: the ledger joins on them.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 */
export const LIGHT = defineBoard({
  id: "light",
  title: "Light, shadow and lamp",
  question:
    "How should light work across the site: which shadows, glows and flourishes exist, where each may appear, what is never done, and in what order they land?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "Moved onto the kit's template (the verdict and the nine calls first, the arguments folded under the evidence), then the nine asks rewritten in plain words with labelled options after Will's first review stopped at two of them. No candidate, number or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Turned inside out into a KIT with the arguments underneath it as evidence, after the round-three review: twelve treatments on the real sections, the composer, and the infusion order.",
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
    "Three explorations set this identity: the spill doctrine named the shapes, the spill placements decided where a light is earned, and this board asked what the whole system would be if it were designed today. The doctrine as it stands is organised around where light comes FROM, which is why the footer seam, the one lamp named as the model, is illegal under the law that opens it, why dark has no shadow where two photographs need separating, and why the ring lift, with 77 uses, is written down nowhere.",

  verdict: {
    recommendation:
      "Sort every light by the job it does (separate, fill, mark) rather than by where it comes from. Land the kit as written and begin with phase 1, the shadows.",
    because:
      "The same parts fall into three jobs that do not overlap, and the rule that replaces 'name the lamp' falls out of the second one: a light needs a PLACE (an edge, a boundary, a screen, a plate) rather than an object throwing it. The footer's glow has a place and a button's rim does not, so the lamp everyone likes becomes legal without loosening anything.",
    overrule:
      "A shadow in dark mode is the one genuinely new claim. If dark must stay shadowless, that family drops and the rest of the kit still stands.",
  },

  asks: [
    {
      id: "kit",
      question: "Should the light kit land as written?",
      context:
        "The kit is the board's whole proposal for light on the site: twelve named treatments (a soft shadow under a card, the glow under the footer, a bright edge on a media frame, a bloom when an event is published) sorted into three jobs: separating things that overlap, filling a section with colour, and marking a moment. Each names where it may appear and where it never does.",
      look: "The Kit section: three job columns with the twelve treatment cards under them, each naming its place, its sections and how often it may fire.",
      options: [
        {
          id: "land",
          label: "Land it as written",
          means:
            "The wiring round types the twelve treatments and their fences into the design system as they stand.",
        },
        {
          id: "amend",
          label: "Amend one part first",
          means:
            "Name the treatment or fence to change in your note; the rest lands as written.",
        },
      ],
      recommended: "land",
      because:
        "Each of the twelve has a place, a list of sections, a frequency and a mount, so the wiring round has nothing left to invent. Amending means naming the one part to change rather than reopening the shape.",
      evidence: "kit",
    },
    {
      id: "infusion",
      question:
        "Should the light enter the site in the order the board proposes, starting with phase 1?",
      context:
        "The board lands the light in phases rather than all at once. Phase 1 is the floor: the soft shadows that separate overlapping things (cards on the dashboard, menus over a page), on every surface, in both modes. The colour fills behind marketing sections and the marked moments come in later phases.",
      look: "The Infusion section: the phases in order, each naming what it lands, where, and what it needs first.",
      options: [
        {
          id: "phase-1",
          label: "Yes, start with phase 1",
          means:
            "The next wiring round lands the shadows first; every later phase is judged on a site that already separates properly.",
        },
        {
          id: "reorder",
          label: "Reorder the phases",
          means:
            "Say in your note which phase should go first, or which should not come at all.",
        },
      ],
      recommended: "phase-1",
      because:
        "Phase 1 needs nothing from any other board, it can be worn on the real site from this board's Apply button today, and without it every later phase is judged on surfaces that still separate badly in dark.",
      evidence: "infusion",
    },
    {
      id: "aurora",
      question: "Where should the aurora land first?",
      context:
        "The aurora is a slow, soft field of colour behind a marketing section: the glow already under the site's footer, grown to the scale of a whole chapter. It can sit at one edge of a section (the footer's seam sits at the bottom edge), at both the top and bottom edges, or fill the whole section like a lit room. This asks where it lands first, not whether it is any good.",
      look: "In the Composer, set Treatment to The aurora and flip Placement between Both boundaries and The room; then Treatment The seam at the bottom edge is the footer's light as it ships. Register is Accent, your ruling.",
      options: [
        {
          id: "no",
          label: "Nowhere yet",
          means:
            "No aurora lands in the next wiring round; the footer keeps its seam as it ships today.",
        },
        {
          id: "seam",
          label: "The footer seam only",
          means:
            "The one chapter-scale light stays the one under the footer; nothing new lands, and the composer waits for a later round.",
        },
        {
          id: "both",
          label: "Both edges of a section",
          means:
            "A band of light at a section's top and bottom edges, the copy in the clear band between them, on the home page's closing chapter first.",
        },
        {
          id: "room",
          label: "A whole section as a lit room",
          means:
            "The field fills a section behind its copy; the board shows why that reads as a wash over the words.",
        },
      ],
      recommended: "seam",
      because:
        "The footer seam is the one light with a real place, and it is the lamp everyone already likes, so it is the cheapest honest first landing. Both edges and the room are the same grammar turned up, and can follow once the seam is ruled.",
      overrule:
        "If a chapter-scale field reads as a screensaver at any speed, the answer is nowhere rather than a slower one.",
      evidence: "composer",
      state: { register: "accent", ground: "cinema" },
    },
    {
      id: "register",
      question: "How strong should the aurora be?",
      context:
        "The register is the aurora's strength. At Accent, one section on a page carries a visible glow and the rest of the page is unlit. At Identity, the whole page reads as a room with a colour temperature.",
      look: "In the Composer, flip Register in the dock between Accent and Identity and watch the same section change.",
      options: [
        {
          id: "accent",
          label: "Accent: a glow on one section",
          means:
            "One section on a page carries the light; the page around it stays as it is.",
        },
        {
          id: "identity",
          label: "Identity: the page reads as a lit room",
          means:
            "The field is strong enough to tint the page around the section, which is the aurora's whole identity claim.",
        },
      ],
      recommended: "identity",
      because:
        "At Accent the field is a glow on a section; at Identity the page reads as a room with a temperature, which is the only version that makes an identity claim.",
      evidence: "composer",
      control: "register",
    },
    {
      id: "depth",
      question:
        "In dark mode, how should two overlapping things be told apart?",
      context:
        "In dark mode the site has no shadows today: a photograph lying over another, or a menu over a page, shows no edge. The board proposes a family of soft shadows for dark mode: a lift under overlapping things and a float under menus and dialogs, each tuned per ground. Light mode already has these and does not change under any option here.",
      look: "The Separate section on the App dark ground: two overlapping photographs and a menu over a page, in four columns each. Compare the column labelled Family (a soft shadow) with the one labelled Neither (today's steps and borders).",
      options: [
        {
          id: "family",
          label: "The shadow family",
          means:
            "Two soft shadows in dark mode: a lift under overlapping things, a float under menus and dialogs; the wiring round adds both.",
        },
        {
          id: "lift",
          label: "The lift only",
          means:
            "One shadow, under overlapping things; menus and dialogs keep today's steps and borders.",
        },
        {
          id: "neither",
          label: "No shadow in dark",
          means:
            "Dark mode stays shadowless, as the contract says today; the two overlapping photographs stay uncut.",
        },
      ],
      recommended: "family",
      because:
        "A lift separates two things of the same darkness that overlap; a float detaches a layer from the page still living behind it. Nothing moves in light mode, where the lift is already today's value to the byte.",
      overrule:
        "The elevation contract still reads 'Dark: NO shadows anywhere'. Holding that line is a legitimate ruling; it costs the two overlapping photographs.",
      evidence: "separate",
      state: { ground: "app-dark" },
    },
    {
      id: "lit-face",
      question: "Should the lit face join the kit?",
      context:
        "The lit face is a thin bright edge along the top of a surface that is catching light: a media frame, a phone screen, the QR plate. It is a material effect rather than a shadow, and the kit keeps it off cards, panels and controls so it never becomes a fifth way of separating things.",
      look: "The Separate section, the three faces (a media frame, a screen, a plate): the column labelled The lit face against the others.",
      options: [
        {
          id: "adopt",
          label: "Adopt it, on frames, screens and plates only",
          means:
            "The lit face lands with the kit, fenced to surfaces that catch light.",
        },
        {
          id: "adapt",
          label: "Adapt it: keep the effect, change the fence",
          means: "Say in your note where it may and may not go.",
        },
        {
          id: "drop",
          label: "Drop it from the kit",
          means:
            "No bright edge anywhere; frames, screens and plates keep today's look.",
        },
      ],
      recommended: "adopt",
      because:
        "It belongs to a face catching light, and the fence (never a card, a panel or a control) is what stops it becoming a fifth technique.",
      evidence: "separate",
    },
    {
      id: "cadence",
      question: "How slowly should a lamp breathe?",
      context:
        "Every lamp on the site (the seam under the footer, the underlight of a hero) drifts on one shared clock. The site's engine runs one cycle in 8 seconds; the footer alone was slowed to 11 seconds back when it was the only lamp on the page.",
      look: "The Evidence section's clock row, with Motion set to Live: the same section at the lamp's clock and at the aurora's slower one. The 8-versus-11 call is best made on the home page with the kit applied.",
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
      because:
        "11 seconds was tuned for the footer alone with nothing else moving. On a page with three lamps the slower clock reads as three things drifting rather than one room breathing.",
      evidence: "evidence",
      state: { motion: "live" },
    },
    {
      id: "paper",
      question:
        "On paper, the light marketing ground, which lamp colours should be used?",
      context:
        "The five lamp hues (the house five) were tuned for the dark cinema ground. Against white paper two of them go dirty long before the others do. The board hand-tunes a paper set of the same five hues.",
      look: "The Evidence section on the Paper ground: the three rows labelled As they ship: the dark five, The flat paper row, and The hand-tuned five. Judge the hues, not the brightness.",
      options: [
        {
          id: "hand-tuned",
          label: "A hand-tuned paper set",
          means:
            "Each of the five hues is corrected on its own for paper; paper declares its own set.",
        },
        {
          id: "flat",
          label: "One flat correction for all five",
          means:
            "The dark five with one brightness change applied to all of them.",
        },
        {
          id: "dark",
          label: "The dark five, unchanged, on paper",
          means: "Paper keeps the cinema hues exactly as they ship today.",
        },
      ],
      recommended: "hand-tuned",
      because:
        "The failure is per hue: two of the five go dirty against white long before the other three, so one flat correction cannot fix all five at once.",
      evidence: "evidence",
      state: { ground: "paper" },
    },
    {
      id: "publish",
      question: "What colour should the publish flourish be?",
      context:
        "The publish beat is the one-shot flourish on the reel's frame when a host publishes an event. Today it flashes a violet (hue 300, a ratified colour) and fades to nothing. The board proposes a bloom in the lamp set's colours instead, leaned toward violet, that fades to a soft base rather than to nothing.",
      look: "The Treatments section, the bloom: press Replay in the dock and watch what each of the three labelled beats leaves behind, not what it does.",
      options: [
        {
          id: "300",
          label: "As shipped: the violet flash at 300",
          means: "The beat stays exactly as it is, and fades to nothing.",
        },
        {
          id: "house-five",
          label: "A bloom in the house five",
          means:
            "The lamp set's five colours with no lean; no meaning in the hue at all.",
        },
        {
          id: "305",
          label: "The house five leaned to violet (305)",
          means:
            "The same bloom narrowed toward violet, so the beat still reads as the reel's colour, and it fades to a base.",
        },
      ],
      recommended: "305",
      because:
        "It moves a ratified beat by five degrees to join the lamp set and lets it decay to a base instead of to nothing. Small, but it is a ratified value, so it is asked rather than taken.",
      evidence: "treatments",
      state: { motion: "live" },
    },
  ],

  candidates: [
    {
      id: "kit",
      name: "The kit",
      recommended: true,
      rationale:
        "One doctrine in three jobs with twelve named treatments under it, each carrying a place, a section list, a frequency and a mount. The elevation contract moves inside the light doctrine and stops being per mode; the aurora is named as the fill register at chapter scale and gets a component.",
    },
    {
      id: "tune",
      name: "Tune",
      rationale:
        "Keep SPILL and BEAM and their eight laws; amend law 1 so a boundary counts as a source, and let a shadow into dark for overlapping media. The smallest change that makes the footer legal. It leaves the ring undocumented, the five shapes unnamed, and nothing said about which section gets which.",
    },
    {
      id: "replace",
      name: "Replace (withdrawn in round three)",
      rationale:
        "The aurora becomes the primary layer and spill becomes an aurora anchored to an object. Two rounds of specimens took it apart: an anchored aurora is a spill with a different name. The half that survived is on the board as options rather than as a doctrine.",
    },
  ],

  departures: [
    {
      id: "dark-shadow",
      from: 10,
      text: "The kit proposes a shadow family in DARK. The elevation contract still reads 'Dark: NO shadows anywhere' and --shadow-float is zeroed in .dark. On a light ground lift is today's shipped value to the byte, so paper does not move.",
      evidence: "separate",
    },
    {
      id: "ring-lift",
      from: "precedent",
      text: "The ring lift has 77 uses across the app and appears in no document. Moving it into the contract makes a fourth technique official.",
      evidence: "separate",
    },
    {
      id: "per-section-temperature",
      from: 3,
      text: "The aurora lets a section retune --lamp-* for everything inside it. The engine documents the hook and bible 3 still holds (light, never UI), but a per-section temperature is a new licence and it is the aurora's whole identity claim.",
      evidence: "composer",
    },
    {
      id: "paper-lamps",
      from: "ruling",
      text: "A hand-tuned paper five declared on .surface-paper. design-system.md calls that an open design task; this is the first time --lamp-* would be re-declared per ground.",
      evidence: "evidence",
    },
    {
      id: "section-light",
      from: "precedent",
      text: "A new production component, SectionLight, beside screen-lamp.tsx: the first marketing-system component whose whole job is light. The composer exports its exact call for every configuration.",
      evidence: "composer",
    },
    {
      id: "engine-line",
      from: "precedent",
      text: "One line of the ENGINE, and it is a law 4 fix rather than a feature: glw-drift-x's from-keyframe must be declared outside the reduced-motion block, or a reduced-motion visitor gets the comet parked dead centre at full strength.",
      evidence: "evidence",
    },
    {
      id: "publish-violet",
      from: "ruling",
      text: "The publish flourish's oklch(0.62 0.2 300) becomes the lamp set's 305, and the beat decays to a base instead of returning to nothing. It is a ratified beat being moved.",
      evidence: "treatments",
    },
    {
      id: "qr-is-a-mark",
      from: 3,
      text: "The QR plate's shipped light is a MARK and not spill: a bloom centred at 50 by 50, with no vector at all. Under law 2 a vectorless field is the even rim the doctrine refuses; naming which job a light is doing is what makes it legal, and that naming is new.",
      evidence: "kit",
    },
  ],

  assets: [
    {
      what: "A grain tile, so the aurora stops banding",
      spec: "Seamless monochrome noise, 256x256 PNG-8, fine grain (one tile pixel), neutral, mean 50 percent grey, used at about 5 percent over the light AND laid out at 128 CSS px on a 2x screen (one tile pixel per device pixel; laid out at 256 it doubles and the band returns).",
      replaces:
        "the inline feTurbulence stand-in in board.css ([data-lgt-grain]).",
    },
    {
      what: "A worst-case pair of overlapping photographs for the separate job",
      spec: "Two images whose touching edges are both dark and low contrast (a night reception, a dim dance floor), 1200px long edge, JPG, so the depth cue is judged against the case it exists for rather than a lucky one.",
      replaces: "the reception-hall and wedding-toast pair in depth.tsx.",
    },
  ],

  sections: [
    {
      id: "kit",
      title: "The kit",
      lede: "Twelve named treatments in three jobs (separate, fill, mark), each with where it goes, which sections wear it, how often it may fire and how it is mounted; then the fences, and the seven things a wiring round types into files.",
      argument: [
        "The system today is organised around WHERE LIGHT COMES FROM. SPILL is light from a lit thing; BEAM is a lit thing; the elevation contract is a separate section about shadows and lives one mode at a time. Three consequences, all visible in the repo: the footer's seam, the lamp Will likes most, is illegal under the law that opens the doctrine; dark has no shadow even where two photographs plainly need one; and the ring lift, the fourth depth technique with 77 uses, is in no document at all.",
        "Organise it around what the light is DOING and the same parts fall into three jobs that do not overlap: SEPARATE (achromatic, static), FILL (chromatic, slow, behind everything) and MARK (chromatic, bounded, ends with its state). The rule that replaces 'name the lamp or there is no spill' falls out of the FILL job: a lamp needs a PLACE, not an object.",
      ],
    },
    {
      id: "treatments",
      title: "The treatments",
      lede: "Six treatments on the real production sections that wear them, at true size, each with the card that admits it and the code that mounts it beside it. Three already ship.",
      wiring: [
        "Each treatment's mount is beside it as a paste. The publish beat is the only one that changes a shipped value, and it is asked rather than taken.",
      ],
    },
    {
      id: "composer",
      title: "The composer",
      lede: "Light for any marketing section: pick a real section, a treatment, a placement, the strength, the temperature and the clock; the code for what you see is exported beside it.",
      argument: [
        "The aurora needs a COMPONENT, not a recipe. Two bands, a flipped axis, four custom properties and a grain layer is too much for a chapter to assemble correctly twice, and the placement grammar is exactly the kind of rule that survives in a component and dies in a comment.",
      ],
      wiring: [
        "SectionLight, beside screen-lamp.tsx, which already proves the shape: a wrapper that owns one light, takes children, and keeps the engine's invariants where a call site cannot break them.",
      ],
    },
    {
      id: "separate",
      title: "Separate",
      lede: "How overlapping things are told apart: today's steps and borders, a hairline ring, a soft shadow and a lit edge, on real overlapping photographs, a menu over a page and a flat card, in both modes.",
      argument: [
        "One shadow family, two sizes, one alpha ramp per ground. Lift separates objects of the same lightness that overlap; float detaches a layer from content that keeps living behind it; a flat surface takes neither, in either mode. The finding was only ever that DARK has no ramp, because 6 percent of black over a near black room is arithmetically invisible.",
      ],
    },
    {
      id: "evidence",
      title: "The evidence",
      lede: "The measurements behind the numbers (the clock, the paper colours, the grain), each ending in the line it produced. Anything that decided nothing was cut.",
      argument: [
        "One register for a lamp, and it should be the engine's own 8 seconds: 11 was the footer alone with nothing else moving. The aurora is not a lamp and takes a multiple, so --spill-cadence stays one token and gains a sibling rather than a second opinion.",
      ],
    },
    {
      id: "infusion",
      title: "The infusion",
      lede: "The order the light lands on the site, phase by phase, and why that order.",
      argument: [
        "Begin with the floor. Phase 1 is the only phase that needs nothing from any other board, it is already wearable on the real site from this board's Apply button, and it is the one phase whose absence makes every other phase harder to judge. Phase 2 is two call sites on one page, a deliberately small second step: the closer above the footer is the hardest test the scarcity distance has anywhere on the site, and it should be taken while the cost of being wrong is two lines.",
      ],
    },
    {
      id: "paste",
      title: "The ruling",
      lede: "The whole proposal written in the design system doc's own shape, ready to paste once ruled.",
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
      id: "ground",
      label: "Ground",
      options: [
        { id: "cinema", label: "Cinema" },
        { id: "paper", label: "Paper" },
        { id: "app-dark", label: "App dark" },
      ],
      default: "cinema",
    },
    {
      id: "register",
      label: "Register",
      options: [
        { id: "accent", label: "Accent" },
        { id: "identity", label: "Identity" },
      ],
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
      section: "kit",
      note: "Three jobs and twelve treatments. If the shape is wrong, the rest of the walk is the wrong argument.",
    },
    {
      section: "composer",
      state: { register: "accent" },
      note: "The composer at Accent, the strength Will ruled (2026-09-15): one section carries the light. Flip Placement to judge where the aurora lands first.",
    },
    {
      section: "composer",
      state: { register: "identity" },
      note: "The same field one register up, the board's own pick, kept for a later turn-up if Accent feels too weak.",
    },
    {
      section: "separate",
      state: { ground: "app-dark" },
      note: "The two photographs on the app's own dark, which is where a missing ramp shows first.",
    },
    {
      section: "evidence",
      state: { ground: "paper" },
      note: "The paper five against the house set. Judge the hues, not the brightness.",
    },
    {
      section: "infusion",
      note: "The order it lands in. Phase 1 is the only ask under this one.",
    },
  ],

  notes: [
    {
      section: "composer",
      state: { register: "identity", ground: "cinema" },
      text: "At identity on cinema the band is at the edge of perception on a bright screen and obvious on a dim one. That spread is the honest reason the register is an ask rather than a recommendation with a number.",
    },
    {
      section: "separate",
      state: { ground: "paper" },
      text: "Nothing moves on paper under any option here: lift on a light ground is the shipped value to the byte. If paper looks different, something else is applied.",
    },
  ],

  links: {
    bible: [3, 10, 11],
    spec: "docs/specs/light.md",
    pages: [
      {
        label: "The dashboard",
        path: "/dashboard",
        note: "the lift, on real event cards",
      },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the float, on the plan band",
      },
      { label: "Home", path: "/", note: "the footer seam and the film strip" },
    ],
  },
});
