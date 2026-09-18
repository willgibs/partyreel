import { defineExploration } from "@/components/lab/exploration";

/**
 * THE RIVER IN THE QR DOOR (round one, 2026-09-18): Will's `placement=card`
 * from river-visual's second round, run through its own exploration as he
 * asked ("let's run the card implementation through its own exploration to
 * nail it"), with `code=in` and no label under the code ("think of this more
 * as an Easter egg in our design").
 *
 * Four decisions and no page. Each is drawn in the real `FeatureDoor`, in both
 * of its shapes (the hub's tall 4:5 door and the short 3:2 door a feature page
 * ends on) at 1440 and at 375, wearing every other answer (board.tsx).
 *
 * ★ THE FOURTH QUESTION IS NEW, AND THE DRAWING ASKED IT. The track's brief had
 * three (the height, the link, the short door). Drawn in the real door, the
 * height turned out to hinge on where the photographs END: the door's copy
 * sits over the bottom third of its picture, so a code centred in the picture
 * leaves the stream under a hundred pixels before the title unless the stream
 * runs on behind it. That is a look, so it is a question with two pictures, not
 * a line in the Handoff.
 *
 * ★ AND THE SHORT DOOR ANSWERED ITSELF IN NUMBERS. A code that scans is 99 px
 * (119 on its plate) and the short door is 220 tall at 1440 with its title 145
 * down, so the plate has 26 px to spare above the title and sits 13 or 14 px
 * from the top whatever height the first question picks (18 to 24 at 375). Its
 * question keeps the brief's three options, drawn as they come out, and the
 * recommendation is the one that gives the code room.
 */
export const RIVER_CARD = defineExploration({
  id: "river-card",
  title: "The river in the QR door",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The river from river-visual, in the real QR feature door: both of its shapes at 1440 and 375, the code unlabelled and scannable, four decisions drawn.",
  },
  context:
    'You put the river in the card on river-visual\'s second round ("our first truly beautiful card visual"). This is that card: the QR door on /features and at the foot of the album and guests pages, the album pouring out of a code that scans, with no label under it.',
  bible: [1, 8, 10, 13, 14],
  asks: [
    {
      id: "place",
      label: "Where the code sits",
      question: "Where should the code sit in the door's picture?",
      context:
        'Your note: "a bit more of a gap from the top, so it feels a bit more centered with the images still streaming down." The card you saw held it 13 px from the top.',
      lands:
        "The code's height in the QR door on /features, and in the short door if it grows.",
      options: [
        {
          id: "tenth",
          label: "A tenth of the way down",
          means:
            "41 px from the top of the tall door at 1440, three times the air you saw, and the most door left for the photographs to fall through.",
        },
        {
          id: "centre",
          label: "Centred in the picture",
          means:
            "As much air above the code as between it and the title: 98 px from the top at 1440, the photographs pouring on below it.",
        },
        {
          id: "third",
          label: "A third of the way down",
          means:
            "138 px from the top at 1440, nearer the title than the top edge; the photographs have the least room.",
        },
      ],
      recommended: "centre",
      because:
        "It is the most breathing room above the code that still leaves the album pouring below it, which is the whole of your note. It needs the photographs to run on behind the title (the next question); fading out above it, they get under 90 px to fall.",
      overrule:
        "If the photographs fade out above the title, a tenth down is the height that still lets them stream.",
    },
    {
      id: "fall",
      label: "Where the photographs end",
      question:
        "When the photographs reach the door's title, should they run on behind it or fade out above it?",
      context:
        "Every other door is a photograph that runs to its foot with the words over a shade. The river can end the same way, or dissolve just above the title so the words sit on bare ink.",
      lands:
        "Where the stream stops in the QR door, and so how low the code can sit.",
      options: [
        {
          id: "behind",
          label: "They run on behind the title",
          means:
            "The whole door streams, like the photographs beside it; the words read over moving pictures, under the shade the event cards were measured with.",
        },
        {
          id: "above",
          label: "They fade out above the title",
          means:
            "The words sit on still ink and no photograph passes under them; the stream ends where the copy starts, so it is shorter.",
        },
      ],
      recommended: "behind",
      because:
        "It is the door's own anatomy, a picture under the words with a shade, and the only way a centred code keeps its album pouring. The code stays above both shades either way, so it scans at full contrast.",
      overrule:
        "If moving pictures under the title are too busy for a door people skim, they fade out above it and the code moves up.",
    },
    {
      id: "opens",
      label: "What the code opens",
      question: "What should the code open when someone scans it?",
      context:
        "There is no label, so the code is an Easter egg for whoever scans it. What it encodes sets its size: a code scans off a screen at 3 px a module, and a longer link has more of them.",
      lands:
        "The value the QR door's code encodes, and a /demo route for the wiring if the short link wins.",
      options: [
        {
          id: "short",
          label: "partyreel.com/demo",
          means:
            "A short link that opens the live demo event, at the smallest code that scans: 99 px. The redirect ships with the wiring.",
        },
        {
          id: "event",
          label: "The demo event's full link",
          means:
            "Opens the demo with no redirect, but it is 33 modules, a 123 px code, and the short door has no room for it above its title.",
        },
        {
          id: "home",
          label: "partyreel.com, as the door does today",
          means:
            "A 99 px code that opens the home page, which is where most people who could scan it already are.",
        },
      ],
      recommended: "short",
      because:
        "The demo is the egg worth finding, and the short link reaches it at the same 99 px as the home page, 24 px less code than the full link.",
      overrule:
        "If a redirect route is unwanted, the full link is the honest way to the demo, and the short door has to grow.",
    },
    {
      id: "short",
      label: "The short door",
      question:
        "What should the short door do at the foot of the album and guests pages?",
      context:
        "Those pages end on a row of three short 3:2 doors. The code takes 119 of the short door's 220 px, so it fits only at the top, whatever height you picked, with little room for the album.",
      after: { ask: "place" },
      lands:
        "The shape of the row of doors every feature page ends on, and whether the QR door moves in it.",
      options: [
        {
          id: "still",
          label: "It stands still",
          means:
            "The code at the top of the short door with the album at rest around it: a still picture in a row of still photographs.",
        },
        {
          id: "pours",
          label: "It pours as the tall one does",
          means:
            "The same short door with the album running: the one moving door in its row, the code at the top.",
        },
        {
          id: "tall",
          label: "Every row takes the tall 4:5 door",
          means:
            "The row every feature page ends on uses the hub's tall doors, so the code sits where you put it: 193 px taller at 1440.",
        },
      ],
      recommended: "tall",
      because:
        "It fixes the room at its source. The short door cannot give a code that scans any air above it and still show the album, and the tall door is the one the hub already uses.",
      overrule:
        "If the pages' last row should stay short, it stands still: a moving code in a row of still photographs pulls the eye from the other two.",
    },
  ],
});
