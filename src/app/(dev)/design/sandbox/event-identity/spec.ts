import { defineExploration } from "@/components/lab/exploration";

/**
 * ROUND ONE OF THE EVENT PAGES' VISUAL IDENTITY, FROM THE GROUND UP
 * (2026-09-19, the morning sitting).
 *
 * Will, after ruling `event-type-pages` whole (docs/design/rulings.md, batch
 * three, verbatim): the event pages "were thrown up in a very fast V1 under one
 * agent with distilled context, so they should in no way be seen as a complete
 * effort that only needs elevation. Honestly, they could use a total visual
 * identity redesign now that other areas like the homepage are progressing
 * beyond them under Rising Tides." They "should feel very polished, beautiful,
 * and constantly incentivize further exploration." Each hero should be "media
 * and motion forward, but feel custom and themed for its own page" while "our
 * heroes and headers should share similar design patterns (H1 size, H1 and
 * subhead spacing, button groups etc)". Three sections he named by hand: the
 * paragraph under the hero is "doing horribly", the proof "needs a total
 * redesign", and the event cards "could use a total redesign".
 *
 * ★ WHY THREE DECISIONS STAGE AND FOUR DO NOT. The hero's theme decides what
 * kind of page this is, so THE SECOND SECTION is drawn under the last band of
 * whichever hero the board is carrying (a photograph running into paper is not
 * the same page as dark air running into paper) and THE PHONE moves whichever
 * media that theme owns. THE ARC waits one further step, because moving the
 * second section is what moves the page's rhythm. THE CARDS, THE PROOF and THE
 * LADDER each ask about a different part and carry no order at all.
 *
 * Not in this round: any production byte; the direct picks already ruled (one
 * template, four types, the host alone greeted, the 2x2 grid kept, every type
 * page on `PageHero`, the phone's FAQ to close gap halved), which wire AFTER
 * this round wearing its winners; a fifth type; a planner line; the hub's own
 * identity against the type pages, which is in the manifest's Questions.
 */
export const EVENT_IDENTITY = defineExploration({
  id: "event-identity",
  title: "The event pages' visual identity",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first identity round: the hero's theme, the section under it, the page's arc, the cards, the proof, the ladder, and the phone.",
  },
  context:
    "The hub and the four type pages, rebuilt from the ground up rather than elevated. Every option is drawn on the real pieces at 1440 and 375, on weddings as the worked type and on conferences as the type the photo manifest has nothing honest for.",
  bible: [1, 5, 17, 18, 22],
  asks: [
    {
      id: "hero-theme",
      label: "The hero's theme",
      question:
        "What should make an event page's hero its own, now that all four keep the same lockup?",
      context:
        "A type page hand rolls its lockup today and drops a static composition under it, one per slug. Every option keeps the real PageHero unchanged and varies only what stands behind and below the words. Drawn on weddings and on conferences.",
      options: [
        {
          id: "room",
          label: "The room, behind the words",
          means:
            "The words stand inside a photograph of that kind of event, and it changes as the reader moves. A type with no honest photograph stands in the product instead.",
        },
        {
          id: "arrival",
          label: "The photographs arriving",
          means:
            "The album page's fall, on four pages: frames drift past the words and slide behind the object below. Only what catches them is the type's; the fall is one set.",
        },
        {
          id: "object",
          label: "One bespoke object, lit",
          means:
            "Everything custom is one still life per type in a single pool of light: the album open with the table card in front, or the badge every attendee wears.",
        },
        {
          id: "today",
          label: "Today's compositions",
          means:
            "The four shipped stages unchanged, so every number is a comparison.",
        },
      ],
      recommended: "object",
      because:
        "It is the only theme that is genuinely the type's own on all four pages: the fall is one shared photograph set, and two of the four have no room to stand in and will not get a faked one. It answers his own diagnosis, that the frames were never considered individually, and needs no new photography.",
      overrule:
        "If the pages need atmosphere more than craft, the room is the bigger jump and its engine is ruled; it needs a room of its own for conferences and trips first.",
      lands:
        "What every /events/[slug] hero is made of, and whether the shared lockup is enough consistency once the stage under it is bespoke.",
    },
    {
      id: "second-section",
      label: "The second section",
      question:
        "What should a reader meet straight under the hero, in place of the paragraph and its tag list?",
      context:
        "Today: the page's opening paragraph on paper, centred and muted, with the long tail terms as a row of chips beneath it. Each option is drawn under the last band of whichever hero theme the board is carrying.",
      options: [
        {
          id: "today",
          label: "The paragraph and the chips",
          means: "The shipped section, measured.",
        },
        {
          id: "statement",
          label: "One claim, one picture",
          means:
            "The paragraph's own first line, large and on a step, beside one photograph, with the long tail terms kept as a single running line instead of a chip row.",
        },
        {
          id: "beats",
          label: "Three beats, a picture each",
          means:
            "The paragraph broken into the three things that actually happen, alternating down the page with one photograph each.",
        },
        {
          id: "live",
          label: "The party itself, still dark",
          means:
            "One line, then the album for this event filling in front of the reader. The page stays on cinema through its second beat instead of turning to paper.",
        },
      ],
      recommended: "statement",
      because:
        "It fixes the exact failure, a wall of small grey type where a page should open its second chapter, and it keeps every long tail term search rewards. Three beats is the body of a page rather than its opening, and a live album under the hero repeats what the hero just did.",
      overrule:
        "If the hero ends up being the quiet one, the live album beneath it is the moment the page is missing and this is where it belongs.",
      lands:
        "The second section on all four type pages, and whether the page still turns to paper at that cut.",
      after: { ask: "hero-theme" },
    },
    {
      id: "the-arc",
      label: "The arc",
      question:
        "How many beats should a type page run, and where should it turn to paper?",
      context:
        "Six beats today, with everything light in one chapter directly under the hero. The whole page is drawn small so the rhythm can be seen at once, wearing whichever second section the board is carrying.",
      options: [
        {
          id: "today",
          label: "Six beats, one paper block",
          means:
            "Unchanged: everything light happens in one chapter directly under the hero.",
        },
        {
          id: "chapter",
          label: "The turn is a photograph",
          means:
            "Two dark beats, then paper across one full width photograph, the light chapter spent on the planning document alone, and a dark close.",
        },
        {
          id: "dark",
          label: "One dark page, like the hub",
          means:
            "Hero to close on cinema, the benefits and the FAQ on the dark ground, the photographs carrying all the light. The hub is already all dark.",
        },
      ],
      recommended: "chapter",
      because:
        "It is the only one that gives the page two openers instead of one, which is what bible 17 is asking for, and the crossing is the device he ruled for exactly this job. The planning content is the one thing here a reader studies rather than skims, which is what earns it a light ground.",
      overrule:
        "The hub is already all dark, so a dark family is the more consistent one and would make the light chapter the odd beat rather than the rhythm.",
      lands:
        "The section list of every /events/[slug] page and where its one paper chapter starts.",
      after: { ask: "second-section" },
    },
    {
      id: "the-cards",
      label: "The cards",
      question: "What should an event card be, keeping the 2x2 grid?",
      context:
        "His ruling kept the 2x2 grid and condemned the card. Today each is a 16:10 window, a title, a teaser and three chips. All four options carry all four types, and two of those have no photograph.",
      options: [
        {
          id: "today",
          label: "The window and the chips",
          means: "The shipped tilt card, measured.",
        },
        {
          id: "frame",
          label: "The photograph is the card",
          means:
            "The ruled media forward anatomy at directory size: a tall picture, the name and teaser on the scrim, the long tail as one line. Artifact types show theirs.",
        },
        {
          id: "stack",
          label: "A pile of that event",
          means:
            "The card is a small stack of that type's photographs, fanned at rest and squaring up under the cursor, with the words beneath it.",
        },
        {
          id: "plate",
          label: "An editorial plate",
          means:
            "A picture window, a hairline, the name at the section step, the long tail as a running line, and a row saying where the card goes. Nothing hides on hover.",
        },
      ],
      recommended: "frame",
      because:
        "Bible 1: the media is the colour, and at directory size these are four large photographs rather than the home page's small row, which is the richness he wants the hub to keep. The long tail survives as a line, and the anatomy is already ruled on the home rather than invented here.",
      overrule:
        "Two of the four have no photograph, so a plate sits in a grid of pictures. If that corner reads badly, the editorial card keeps the window and gains the craft.",
      lands:
        "The hub's directory, and whether the home's card and the hub's card become one anatomy at two sizes.",
    },
    {
      id: "the-proof",
      label: "The proof",
      question:
        "What should the page's proof beat be, now the reel alone is not it?",
      context:
        "He picked the demo door as the right content and condemned the drawing in the same line. Twice more the same day: a centred portrait leaves blank space either side, and every page ending on the reel will feel repetitive.",
      options: [
        {
          id: "today",
          label: "The reel band",
          means:
            "The shipped band, measured: one 300 px portrait in a 1,280 px room.",
        },
        {
          id: "flanked",
          label: "The reel, and its own frames",
          means:
            "The portrait keeps its shape; either side holds the six stills the cut was made from. Honest and awkward: three of the six are a DJ, a crowd and confetti.",
        },
        {
          id: "landscape",
          label: "The landscape render",
          means:
            "The manifest's landscape reel fills the row on its own. The cost is named: a guest watches a reel in portrait.",
        },
        {
          id: "door",
          label: "The demo is the section",
          means:
            "A real door with photographs pouring through it and the promise beside it, and the reel demoted to one small poster with its own label.",
        },
      ],
      recommended: "door",
      because:
        "It answers all three of his sentences at once: the section is redesigned rather than rearranged, the page stops ending on the reel, and the portrait keeps the size it deserves here. It puts the strongest thing the site owns, a real album anyone can open, in the middle of the page.",
      overrule:
        "If the reel should stay the hero of this beat, the flanked version fixes the blank space with a fact, once a per type render exists to cut it from.",
      lands:
        "The proof section on the hub and all four type pages, and where the demo door lives on each.",
    },
    {
      id: "the-ladder",
      label: "The ladder",
      question:
        "Should the reading copy on these pages grow with the page, the way its headings already do?",
      context:
        "Every heading here sits on a step already, each a clamp that grows. The copy between them does not: the hero subhead and the opening are text-lg, the teaser text-sm, the chips text-xs, the same pixels at 375 and at 1440.",
      options: [
        {
          id: "today",
          label: "Headings only, as today",
          means: "The headings grow, the reading copy holds at fixed sizes.",
        },
        {
          id: "reading",
          label: "The two reading slots join it",
          means:
            "The hero subhead and the page's opening move onto the subhead step so they grow with the h1 above them. Labels and card copy stay where they are.",
        },
        {
          id: "every",
          label: "Every size on a step",
          means:
            "The teaser and the chips move onto steps too, which is the maximal reading of the note and also where it starts to cost.",
        },
      ],
      recommended: "reading",
      because:
        "The visible gap is the hero: the h1 is 1.9 times the subhead at a phone and 4.4 times at 1440, so the lockup's proportion comes apart as the window grows. Moving the two slots a reader reads closes that without pre-empting body-type, which owns the body ladder.",
      overrule:
        "If the answer should be one rule rather than two tiers, every size on a step is the consistent one; a 16 px chip is what it costs.",
      lands:
        "Every marketing page's reading copy, not only these, since the subhead slot is PageHero's own.",
    },
    {
      id: "the-phone",
      label: "The phone",
      question: "At 375, what should a reader meet before scrolling?",
      context:
        "The shipped page spends its whole first screen on words, with the first photograph below all of it. Each option is the same theme and the same lockup with the media somewhere else. The dashed line is a real 812 px screen.",
      options: [
        {
          id: "words",
          label: "The words, then the media",
          means: "Today's order at 375, measured.",
        },
        {
          id: "media",
          label: "The media takes the screen",
          means:
            "The theme's picture fills the first screen and the words stand on it on the ruled plate, which goes edge to edge at this width.",
        },
        {
          id: "split",
          label: "Half and half",
          means:
            "The words in the top of the screen, the media locked to the bottom of it, so a reader meets both before scrolling and neither is small.",
        },
      ],
      recommended: "split",
      because:
        "A media forward identity that puts its first photograph below the fold is not one, and a phone reader who has to scroll past the whole lockup to see an event has been told rather than shown. Half and half is the only option that keeps the primary button on the first screen as well.",
      overrule:
        "If the picture is strong enough to be the whole screen, media first is the more confident page and the buttons are one thumb away.",
      lands:
        "What every type page and the hub look like on the device most of this traffic arrives on.",
      after: { ask: "hero-theme" },
      tile: "phone",
    },
  ],
});
