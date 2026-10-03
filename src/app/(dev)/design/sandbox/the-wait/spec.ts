import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE WAIT, ROUND TWO: THE ARRIVAL (his round one answer, 2026-10-03).
 *
 * His words, on the arrival, none picked: "Option 2 feels like the potential
 * best, but ideally more of a 'develop' first load animation that transitions
 * into the album view somehow. If we can't nail that, I'm split between the
 * option 3 premiere first to open with the reel idea clearly (nice call on easy
 * skip button), or option 1 into place where anytime after it has developed,
 * it just opens as an album with a cool animation, likely similar/same as a
 * regular open live album would."
 *
 * ★ ONE DECISION, HIS FIRST CHOICE DRAWN BEFORE THE FALLBACKS. Three develops,
 * each the contact sheet as wired turning into the album in one continuous
 * move on the album's first open after the develop: in place (the squares come
 * up as photographs and the newest grow into the rows), the darkroom (the whole
 * roll full screen first) and out of the light (the album rises out of the
 * sheet's light, the host's Look). Then the premiere first and the regular
 * open, refined.
 *
 * ★ ROUND ONE'S OTHER FIVE ARE WIRED (`wait-wiring`) AND SETTLED: the model,
 * her wait, the host's cover, the name and approval with a develop stand in
 * the opening's settled lines, never asked again here.
 *
 * ★ EVERY FRAME IS PRODUCTION'S PAGE AS WIRED: the real `AlbumCover` and its
 * `coverEyebrow`, the contact sheet's own classes and layout
 * (`layoutSheet`, `columnsFor`, `sheetCapFor`) and the rows engine
 * (`layoutRows`), so a square and the tile it grows into are measured where
 * production draws them.
 */
export const THE_WAIT = defineExploration({
  id: "the-wait",
  title: "The wait",
  surface: "shared",
  desk: 35,
  lives: [
    "src/components/guest/event-experience.tsx",
    "src/components/guest/gallery-empty-state-wait.tsx",
    "src/components/guest/gallery-empty-state-sheet.tsx",
    "src/components/guest/gallery-empty-state.css",
    "src/components/guest/live-gallery.tsx",
    "src/components/guest/event-experience-head.tsx",
    "src/components/guest/reel/live-reel-view.tsx",
    "src/components/app/event-feed/event-hub-head-cover.tsx",
    "src/lib/disposable/",
    "docs/systems/disposable-mode.md",
    "docs/systems/guest-flow.md",
  ],
  round: {
    n: 2,
    date: "2026-10-03",
    changed:
      "From your round one note on the arrival: your develop drawn as the album's first open in three takes, with the premiere first and into place refined beside them; your other five picks are wired and settled.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "A new board from your live walk, where an upload landed and then vanished back to an empty album: the model for every album that holds photos back, then her wait, the arrival, the host's cover and the words.",
    },
  ],
  context:
    "Maya & Jay's wedding, Saturday 10 October, on the album's camera (Disposable), developing at 9 am on Sunday: 214 shots from 14 guests, nine of them Priya's. Every frame is production's page as wired, the morning after: the cover on the house light it stood on all night, the contact sheet as the album drew it, the album's rows as the rows engine lays them. The Screen knob draws 1440. Each caption is read off its frame.",
  opening: {
    about:
      "The arrival, round two: what a guest meets the first time she opens an album after its roll develops, drawn as three develops and the two fallbacks.",
    settled: [
      "One wait, one word: whatever is held back reads Developing, and only its clock says when (your model=time; Settings asks it as album styles).",
      "The wait is the contact sheet over the album: a square a photo in the night's order, everyone's dark, hers lit, the count over it (wait=sheet).",
      "Maya's hub draws the very sheet her guests meet, with Look to lift it (cover=guests); the preset is called Disposable (name=disposable).",
      "Approval never stands with a develop: Maya's cover is her check, and the develop time moves when she needs longer (both=never).",
      "From disposable-mode: the album's camera keeps a roll, the room's screen plays the slideshow, and the reel plays the developed roll.",
    ],
    earlier: [
      "Round one: 'Option 2 feels like the potential best, but ideally more of a develop first load animation that transitions into the album view somehow.'",
      "'If we can't nail that, I'm split between the option 3 premiere first to open with the reel idea clearly (nice call on easy skip button)...'",
      "'...or option 1 into place where anytime after it has developed, it just opens as an album with a cool animation.'",
      "Your other five round one picks are wired (wait-wiring) and stand above as settled; this round asks only the arrival.",
    ],
  },
  terms: [
    {
      term: "develop",
      means:
        "The moment an album's held-back photos open to everyone at once: here, 9 am on Sunday.",
    },
    {
      term: "contact sheet",
      means:
        "A photographer's sheet of every frame on a roll, small and side by side: the album's wait.",
    },
    {
      term: "first open",
      means:
        "Her first visit to the album after it develops, on that device, however late it is.",
    },
    {
      term: "darkroom",
      means:
        "Where a roll is developed: here, the whole sheet full screen in the dark, before the album.",
    },
    {
      term: "reel",
      means:
        "The album's highlight reel: its photographs played full screen, one after another.",
    },
    {
      term: "premiere",
      means:
        "The reel playing the developed roll full screen as the first thing she sees.",
    },
    {
      term: "Look",
      means:
        "Maya's press that lifts her cover for a look at her album, which rises out of a wash of light.",
    },
    {
      term: "reduced motion",
      means:
        "A reader's setting asking for less motion: each option's own pass, nothing moving, opacity alone.",
    },
  ],
  carried: [
    {
      id: "when",
      question: "When does the develop play, and when does it stop playing?",
      taken:
        "On each guest's first open after the develop, on that device, however late; live in place if she is on the page at 9 am; every later open is plain.",
      overrule:
        "Once per guest across her devices (a mark on her ticket), or only within a day of the develop.",
    },
    {
      id: "stop",
      question: "Can she stop it?",
      taken:
        "Any press, scroll or key ends it on its last frame at once; the full-screen takes also carry a Skip, The album.",
      overrule: "It plays through: a few seconds at most.",
    },
    {
      id: "load",
      question: "What may the develop load before she scrolls?",
      taken:
        "Its squares' small previews, at most the sheet's cap (93 at a phone): the album's newest, which she scrolls to anyway; the light loads none early.",
      overrule:
        "Only the first screen's squares fill with photographs; the rest turn to light.",
    },
    {
      id: "hub",
      question: "Does Maya's hub develop too?",
      taken:
        "Yes, the same way: her cover is the guests' sheet, so her first open after 9 am develops it; drawn with the wiring.",
      overrule: "Her hub simply shows the album at the develop.",
    },
    {
      id: "batch",
      question: "Does a batch Maya lets into a Reviewed album develop?",
      taken:
        "No: approvals arrive as production's arrivals, pushed in with the album's glow as she lets each in; the develop is a roll's.",
      overrule: "A batch she lets in develops on the sheet the same way.",
    },
  ],
  asks: [
    {
      id: "arrival",
      label: "The arrival",
      question:
        "What should a guest meet the first time she opens the album after its roll develops?",
      where: ["Guest", "The album", "First open after the develop"],
      when: "The roll developed at 9 am on Sunday; Priya opens the album over breakfast, her first visit since the party.",
      matters:
        "It is the payoff the wait promised all night: the sheet she watched should become the album, not vanish under it.",
      lands:
        "What a developed album's first open draws on each guest's page (and Maya's hub), and that every later open is the album's own.",
      context:
        "Four frames each: her first open after 9 am, playing; the same held where the contact sheet turns into the album; reduced motion, its own pass; Monday's second open, plain.",
      options: [
        {
          id: "in-place",
          label: "It develops where it stood",
          means:
            "In the album as she left it: each square flashes and its photograph comes up, in the night's order, then the newest grow into the album's first rows.",
          gains:
            "The sheet she watched becomes the album in place, and the cover develops with it.",
          costs:
            "At a phone half the sheet is under the cover's fold, and its squares load their photos early.",
        },
        {
          id: "darkroom",
          label: "The darkroom first",
          means:
            "Her first open starts in the dark: the whole roll's sheet fills the screen and develops, then closes onto the cover as the page comes up.",
          gains:
            "The whole roll at a glance on any screen: the most ceremony of the three develops.",
          costs:
            "It takes the screen for three seconds before the album, so it carries a Skip.",
        },
        {
          id: "light",
          label: "Out of the light",
          means:
            "The squares turn to light in the night's order, the light fills the sheet, and the album rises out of it, as Maya's Look lifts her cover.",
          gains:
            "Loads no photograph early, and a guest's develop is the host's Look.",
          costs:
            "She never sees the night as a sheet of photographs; the light stands in for them.",
        },
        {
          id: "premiere",
          label: "The premiere first",
          means:
            "Her first open plays the reel full screen over the roll's opening, The album in reach, then drops its last photo into its tile in the album.",
          gains:
            "The morning opens on the reel: the clearest event of the five.",
          costs:
            "A guest who came for one photo watches or presses past a reel first.",
        },
        {
          id: "place",
          label: "Into place, every open",
          means:
            "Every open after the develop is the album's own: the cover's photographs settle in, its words rise, the tiles rise into their rows.",
          gains:
            "Nothing new to learn or build: the cover's word says it developed.",
          costs:
            "The develop is a word, not a moment: the morning opens like any other day.",
        },
      ],
      recommended: "in-place",
      because:
        "The sheet she watched all night fills with the night's photographs where she watched it and opens into the album: nothing to press, nothing to skip.",
      overrule:
        "If the morning should be a ceremony, the darkroom first; if the develop should load nothing early, out of the light.",
      configs: [SCREEN],
    },
  ],
});
