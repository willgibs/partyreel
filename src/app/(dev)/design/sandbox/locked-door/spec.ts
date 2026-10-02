import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * THE DOOR, ROUND THREE (his locked-door r2 answers, 2026-10-02).
 *
 * His words, on `family=doorway`: "This is absolutely gorgeous, big win for
 * our design assets and really sets a good new standard on experiential
 * design. Two additional notes. First, the album behind the door opening
 * doesn't feel very polished, kind of makes the door hard to see. I love the
 * door (and light leak in the other versions), just want to nail this state
 * too. Second, even the wait/shut states should have some sort of minimal,
 * calmer, looped animation to keep the page a little interesting. Maybe a
 * slight glow to the light or something?"
 *
 * ★ THE BOARD STARTS FROM PRODUCTION. door-wiring built his r2 picks (the
 * doorway, one design for every state, a wait to spend, the 404 following the
 * shut door), so every frame here is production's own door page: its header,
 * `DOOR_MAIN`, `DoorColumn`, the welcome's, the wait's and the shut door's own
 * words and chooser, and production's `Doorway` itself wherever this round
 * asks nothing of it. Its files are `lives`, all inside
 * `src/components/guest/door/` and the CSS it uses, so the next change to the
 * door raises this board's PREMISE line and a change anywhere else does not.
 *
 * ★ TWO QUESTIONS, NEITHER WAITING ON THE OTHER. `reveal` is the open door
 * (what is seen through it, so the door reads) and the walk through into the
 * album, as one moment, since the first is the start of the second; `idle` is
 * the loop that keeps the ajar and the shut door alive, graded against his own
 * slow glow so the three differ in kind rather than in strength.
 *
 * ★ THE LIGHT LEAK IS A RESOURCE, NOT A QUESTION: every option of `reveal`
 * spends it (the party's sampled light spilling out of the opening, round the
 * frame and across the floor), each its own way.
 *
 * ★ NEVER ASKED HERE: the doorway itself (his r2 pick), its words (the
 * voice's and door-wiring's), the album's head (`event-header`'s), the
 * chooser's look (door-wiring's, drawn as production has it), and the door's
 * sheet steps.
 */

/** The width a door is read at: a phone off a printed code first. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/**
 * WHICH OPEN DOOR SHE WALKS THROUGH: a Public album's welcome (the door
 * standing open while she reads, then her Continue), or the moment Maya lets
 * Lena in (the door she waited at swinging the rest of the way, "You're in").
 */
const MOMENT: Control = {
  id: "moment",
  label: "The moment",
  options: [
    { id: "welcome", label: "A Public album's welcome" },
    { id: "let-in", label: "Maya lets Lena in" },
  ],
  default: "welcome",
};

export const LOCKED_DOOR = defineExploration({
  id: "locked-door",
  title: "The door family",
  surface: "guest",
  desk: 30,
  lives: [
    "src/components/guest/door/doorway.tsx",
    "src/components/guest/door/doorway.css",
    "src/components/guest/door/door-page.tsx",
    "src/components/guest/door/stage.tsx",
    "src/components/guest/door/album-view.ts",
    "src/components/guest/door/welcome.tsx",
    "src/components/guest/door/waiting-step.tsx",
    "src/components/guest/door/wait-picks.tsx",
    "src/components/guest/door/shut-door.tsx",
    "src/components/guest/door/lit.css",
    "src/components/guest/door.css",
  ],
  round: {
    n: 3,
    date: "2026-10-02",
    changed:
      "From your round two notes, on the doorway as it now ships: the open door drawn three ways so it reads, each with its walk into the album, and three calm loops for the wait and the shut door, graded against your slow glow.",
  },
  history: [
    {
      n: 2,
      date: "2026-09-29",
      changed:
        "The whole door family drawn four ways. You picked the doorway, one design for every state, a wait to spend choosing photos, and the 404 following the shut door; all four are built.",
    },
    {
      n: 1,
      date: "2026-09-28",
      changed:
        "The one locked screen, two decisions. lock came back as host, not a direct selection: push it and today's lit column further, and try one fresh. previous came back private.",
    },
  ],
  context:
    "Round three, on production's doorway: Maya and Jay's wedding, a Public album whose light is sampled from its newest photographs, Lena waiting while Maya decides, and a newcomer at the shut door. Every frame is the real door page; only the open door's opening, the walk into the album and the loops are new.",
  opening: {
    about:
      "The door a guest meets before an album opens, as it now ships: a doorway on the page, its leaf the state, the party's light behind it.",
    settled: [
      "The doorway, built: open on a welcome, ajar while Maya decides, shut with light under it, an empty frame on a dead link.",
      "One design for every state, built: only the words and the light change from the welcome to the shut door.",
      "The wait keeps its chooser, built: she picks what she'll add, and it goes in the moment she's let in.",
      "The door shows only what it showed before: the shut door names nothing, and a gate the album's name and count.",
    ],
    earlier: [
      "'This is absolutely gorgeous ... really sets a good new standard on experiential design.'",
      "'The album behind the door opening doesn't feel very polished, kind of makes the door hard to see.'",
      "'I love the door (and light leak in the other versions), just want to nail this state too.'",
      "'Even the wait/shut states should have some sort of minimal, calmer, looped animation. Maybe a slight glow to the light?'",
    ],
  },
  terms: [
    {
      term: "leaf",
      means: "The door itself, hinged on its left: its angle is the state.",
    },
    {
      term: "opening",
      means:
        "What is seen inside the frame once the leaf swings: today, four photographs edge to edge.",
    },
    {
      term: "light leak",
      means:
        "The party's coloured light spilling out of the doorway, round its frame and across the floor.",
    },
    {
      term: "walk through",
      means:
        "The move from the door's page into the album, once the door has opened for her.",
    },
    {
      term: "reduced motion",
      means:
        "A phone setting asking for less movement: the page then stands still, drawn whole.",
    },
    {
      term: "Public album",
      means: "An album anyone with the link opens straight away.",
    },
  ],
  carried: [
    {
      id: "dot",
      question:
        "Does the wait's live dot keep its own quick ping beside the door's loop?",
      taken:
        "No: it breathes on the door's own clock in every option, so the page keeps one rhythm.",
      overrule:
        "Keep its ping: a quicker pulse says 'live' sooner, at the cost of a second rhythm.",
    },
    {
      id: "gate-light",
      question:
        "When Maya lets Lena in, what lights the opening before the album has loaded?",
      taken:
        "The house light, then the album's own as it arrives: nothing of the album shows while she is outside.",
      overrule:
        "Hold the door ajar until the album has loaded, so it opens straight onto the album's own light.",
    },
  ],
  asks: [
    {
      id: "reveal",
      label: "Through the open door",
      question:
        "When the door opens, what should she see through it, and how should she walk through into the album?",
      where: ["Guest", "The album's door", "The door opens"],
      when: "A Public album's welcome, the door open while she reads; she presses Continue. It plays again when Maya lets Lena in.",
      context:
        "Each drawn as it plays, looping, then in stills: the open door at rest (what reduced motion sees, standing still), the walk through, and the album she lands in. The Moment knob swaps the welcome for Lena being let in; the walk is the same.",
      options: [
        {
          id: "light",
          label: "The party's light, then the album",
          means:
            "Only the album's light shows through the door, pouring out across the floor; she walks into the light and the album rises out of it.",
          gains:
            "The door reads sharpest: a silhouette against light, with the light leak you liked.",
          costs:
            "Nothing of the album shows until she is through; its colour is the only preview.",
        },
        {
          id: "one",
          label: "One photograph, then the album",
          means:
            "The album's newest photograph, deep in the room's light; walking through, it comes forward and lands as the album's first photo.",
          gains:
            "A real glimpse of the party, and the photo she saw carries her into the album.",
          costs:
            "The door's look rides on whichever photo is newest; a dark one dims the doorway.",
        },
        {
          id: "through",
          label: "Walk through the doorway",
          means:
            "The album's own photographs, small and lit, through the door; walking through, the doorway grows past the screen and they settle into place.",
          gains:
            "The truest walk: the photographs behind the door are the ones she lands on, in place.",
          costs:
            "The photographs are tiny and busy in the doorway, and the move is the longest.",
        },
      ],
      recommended: "one",
      because:
        "It keeps the album's reward in view and the door crisp, and the photo she saw through the door is the one that carries her in.",
      overrule:
        "If the door should read before anything else, the party's light keeps the opening to light alone.",
      lands:
        "What the open door shows at a Public album's welcome and when someone is let in, and the move from the door into the album.",
      matters:
        "It is the moment the door pays off, for every guest of a Public album and everyone let in.",
      configs: [SCREEN, MOMENT],
    },
    {
      id: "idle",
      label: "The door at rest",
      question:
        "What should keep the waiting door and the shut door quietly alive while she stands at them?",
      where: ["Guest", "The album's door", "Waiting, or shut"],
      when: "Lena waits while Maya decides, or a newcomer meets the shut door; nothing changes for minutes.",
      context:
        "Each loops as it would on her phone: the wait, the shut door, and the shut door as reduced motion sees it, with one loop in stills beneath. The slow glow is yours, drawn so you can feel it; the other two are as calm, in another kind.",
      options: [
        {
          id: "glow",
          label: "The light breathes (your slow glow)",
          means:
            "The line of light under the door and its glow on the floor swell and settle, once every eight seconds.",
          gains: "The calmest: the door is alive without anything crossing it.",
          costs:
            "The expected answer; after a minute it is easy to stop seeing.",
        },
        {
          id: "pass",
          label: "Someone passes inside",
          means:
            "Every twelve seconds a soft shadow crosses the light under the door, as if a guest walked past inside; between, it holds still.",
          gains: "Says the party is going on, and rarely enough to stay calm.",
          costs:
            "On the shut door, life inside can read as a party she is kept from.",
        },
        {
          id: "turn",
          label: "The party's colours turn",
          means:
            "The light under the door turns through the party's colours, once round in about half a minute, its brightness steady.",
          gains:
            "Colour moves, never brightness, so it is the least distracting while she reads.",
          costs:
            "The slowest to notice, and on the house light it can read as decoration.",
        },
      ],
      recommended: "glow",
      because:
        "Your slow glow is the calmest of the three and true to both doors: the party is on, and nothing about it says she is shut out.",
      overrule:
        "If the wait should feel more alive than the shut door, someone passing inside gives it a story.",
      lands:
        "The one loop the ajar and the shut door both run, and what reduced motion keeps still.",
      matters:
        "A wait can run minutes and a shut door is all a turned-away guest sees; the loop keeps it a place.",
      configs: [SCREEN],
    },
  ],
});
