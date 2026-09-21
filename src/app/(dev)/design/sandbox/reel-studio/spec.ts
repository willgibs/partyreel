import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HIGHLIGHT REEL, ROUND ONE (2026-09-19; reshaped by the overtaken audit,
 * 2026-09-21).
 *
 * Will (docs/design/rulings.md, 2026-09-19): the app and the guest pages are
 * unprotected, "absolutely everything is up for relitigation or reconcepting
 * from the ground up". The reel is core-loop step 5 and the product's North
 * Star, so it is asked from the foundation: the door into the room, the room,
 * the two things a host does in it, the two moments it makes them wait, and
 * what a guest finally meets.
 *
 * ★ THE LAPTOP IS THE DEFAULT SCREEN, AND THAT IS THE FINDING THAT SHAPED THE
 * ROUND. Every surface in the Studio was composed for a hand: the reel is
 * capped at 360 px, every control slides up over it, and none of that changes
 * at 1440 by 900, where the same frame sits in a room a thousand pixels wider.
 * A host curating an event's best moments is at a desk as often as not, so 1440
 * leads and 375 is the knob.
 *
 * ★ THE ORDER IS THE WORK. Five decisions are roots and can be taken in any
 * order (the door, the room, where moments are picked, how sharing is answered,
 * how a guest watches); three wait on one of those, because they are only
 * answerable once it is settled: where fourteen looks live and what the export's
 * minute looks like are both questions about a room that has not been chosen
 * yet, and a blocked tile has no shape until the picker does.
 *
 * ★ THE OVERTAKEN AUDIT (Will, 2026-09-21: "For any open questions that have
 * been 'overtaken', please evaluate whether they should be reshaped or
 * removed... I'd rather you lean into reshape if you aren't confident in
 * removal"). All eight questions were badged by a later ruling; none is
 * removed and no option is dropped. Each one carries the ruling that reached it
 * INSIDE its own context; `door` is REDRAWN, because `event=hub` took away the
 * status row its three options lived in and made the Reel card the only door,
 * so the question is now what that card shows and round one's poster idea moves
 * onto it; and `wait` gains a fourth answer the rulings made possible, the
 * reel's own frame stacking and counting down. The round is still round one.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. No option touches the engine: the fourteen
 * styles are drawn, never re-authored; there is no music, no timeline, no
 * per-clip editing and no end card (host-app.md, all ruled). The watermark and
 * the 60 second lock are `app-pricing`'s upgrade doors, measured here and never
 * re-asked. The studio's missing loading state and the builder's ghosted grid
 * are `app-vocabulary`'s; the overlay's material over media is `glass`'s; where
 * the guest's card SITS in the album is ruled and `guest-shape`'s. Nothing on
 * this board fires an RPC, presigns, encodes or writes a row.
 */

/**
 * THE SCREEN, the knob every decision shares, so one real viewport is on the
 * stage at a time. 1440 by 900 by default, because that is where the room is
 * least designed; 375 by 812 on the same knob, because the same host finishes
 * the reel on the sofa and the guest is never anywhere else.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Whether the reel is shared yet, which changes the room's light and its chip. */
const SHARED: Control = {
  id: "shared",
  label: "The reel",
  options: [
    { id: "draft", label: "A draft, not shared" },
    { id: "live", label: "Shared with guests" },
  ],
  default: "live",
};

/** Where the guest is standing: on the album, or one tap in. */
const MOMENT: Control = {
  id: "moment",
  label: "The guest",
  options: [
    { id: "rest", label: "On the album" },
    { id: "tap", label: "One tap in" },
  ],
  default: "rest",
};

/** Which look the room is wearing, so a style decision is judged on a real one. */
const LOOK: Control = {
  id: "look",
  label: "The look",
  options: [
    { id: "classic", label: "Cinematic" },
    { id: "mono", label: "Noir" },
    { id: "polaroid", label: "Polaroid stack" },
  ],
  default: "classic",
};

const DRAFT = defineExploration({
  id: "reel-studio",
  title: "The highlight reel",
  round: {
    n: 1,
    date: "2026-09-21",
    changed:
      "The overtaken audit: the door redrawn onto the event hub's Reel card, a fourth answer for the wait in the house's own idiom, and every question reshaped with the ruling that reached it folded in. Nothing answered, no option dropped.",
  },
  context:
    "A host curates their event's best moments and gets a shareable highlight video. Everything that shapes it lives in one room at /dashboard/[eventId]/reel, and everything in that room was composed for a phone. Every picture here is that room, the event hub on one side of it or the guest's album on the other, at 1440 by 900 with 375 on the knob, over one wedding: 148 photographs, eight in the cut. Every reel frame is the real engine drawing the real fixture clips. Nothing on this board presigns, encodes, publishes or writes anything.",
  bible: [1, 12, 15, 22],
  asks: [
    {
      id: "door",
      label: "The door",
      question: "What should the event hub's Reel card show?",
      context:
        "The event page is a hub: a row of cards into Review, Reel, Guests and Settings, with the album beneath them. The Reel card is the only door into the Studio, and it is a 160 by 96 px card with an icon, a word and a count.",
      options: [
        {
          id: "card",
          label: "The labelled card, as shipped",
          means:
            "A clapperboard, the word Reel and the clip count, matching the three cards beside it exactly. The reel's own face is nowhere on the page.",
        },
        {
          id: "face",
          label: "The reel's own face is the card",
          means:
            "The same footprint, filled with a frame of the reel, Edit reel at its corner and the count on the picture. One card stops matching its neighbours.",
        },
      ],
      recommended: "face",
      because:
        "The reel is the product's North Star and the hub shows no sign of it: one of four identical cards says a room exists, where the reel's own frame says what is in it. Round one's poster idea costs no furniture now that the card is the door.",
      overrule:
        "If the row reads as one set of doors and a photograph in it breaks the rhythm, the labelled card is the honest one.",
      lands:
        "What the event hub shows of the reel, and how big the door into the only room with controls is.",
      // No `shared` knob: the hub's Reel card reads the clip count and nothing
      // about sharing, so a knob here would move nothing on the stage.
      configs: [SCREEN],
    },
    {
      id: "room",
      label: "The room",
      question: "What should the studio be on a laptop?",
      context:
        "The Studio is a near black room built for a hand: the reel is capped at 360 px and every control slides over it. At 1440 that frame sits in a room a thousand pixels wider. A pane floating over it now has a ruled material.",
      options: [
        {
          id: "capped",
          label: "360 px wide, as today",
          means:
            "The phone's room at every size: the reel at its cap, in the middle of a room a thousand pixels wider.",
        },
        {
          id: "float",
          label: "The reel takes the whole room",
          means:
            "Both caps removed: the reel fills the room, and the header, the dock and the tray float over it on the one ruled glass.",
        },
        {
          id: "bench",
          label: "A workbench: the reel, the work beside it",
          means:
            "At a laptop the room splits: the reel stands large, and whatever is open takes a column beside it. A phone is unchanged.",
        },
      ],
      recommended: "bench",
      because:
        "Every control here slides over the thing it changes, which is only forgivable in a hand. A laptop has the room to put the work beside the reel, and then picking a look means watching the reel change rather than remembering it.",
      overrule:
        "If the Studio must read as one room at every size, the reel taking the room on the ruled glass is most of the win and no second layout.",
      lands:
        "The Studio's shape at a laptop, where the reel's frame is capped, and whether a control may cover it.",
      configs: [SCREEN, SHARED, LOOK],
    },
    {
      id: "styles",
      label: "The looks",
      question: "How should fourteen looks be offered?",
      context:
        "Fourteen designed looks, each a real engine frame of this host's own cut. Today they are a four column wall in a sheet over the reel. The one sheet is ruled a side panel at a desk, so only a hand still pays that price.",
      options: [
        {
          id: "wall",
          label: "The four column wall, in the ruled sheet",
          means:
            "Fourteen at once: a panel beside the reel at a desk, where it covers nothing, and the same wall over the reel in a hand.",
        },
        {
          id: "rail",
          label: "One scrolling row, the reel always visible",
          means:
            "The dead rail, resurrected: bigger frames, four or five in view, and nothing covering the reel at either size.",
        },
        {
          id: "three",
          label: "Three to start, the rest behind More",
          means:
            "One look per family at a size you can actually read, and eleven more a tap away, in whichever posture the sheet takes.",
        },
      ],
      recommended: "wall",
      because:
        "The ruled panel answers the old objection where it mattered: at a desk the wall stops covering the reel it is picking for, and fourteen at once is the gallery of designs he asked for after the printed codes. A hand pays what every dialog pays.",
      overrule:
        "If a look cannot be judged while a bottom sheet covers the reel in a hand, only the rail never covers it.",
      lands:
        "Where the fourteen looks live, how big one is, and whether the reel is visible while a host chooses.",
      after: { ask: "room" },
      configs: [SCREEN, LOOK],
    },
    {
      id: "moments",
      label: "The moments",
      question: "Where should a host choose what is in the reel?",
      context:
        "A tap writes, the dock reshuffles and the player re cuts. In a hand the sheet is 70 percent of the room's height; at a desk the ruled sheet is already a column beside the reel. The album now sits under the hub's cards.",
      options: [
        {
          id: "sheet",
          label: "The sheet over the reel, as today",
          means:
            "The album's pool in the ruled sheet: a column beside the reel at a desk, and a tall sheet over it in a hand.",
        },
        {
          id: "pool",
          label: "A pool under the reel, never over it",
          means:
            "The pool goes where there is room and never over the reel: a column on a workbench, a band at the foot anywhere else.",
        },
        {
          id: "tray",
          label: "The album, with the cut in a tray",
          means:
            "Picking happens on the hub, where the photographs are full size, under a tray holding the cut and the way into the room.",
        },
      ],
      recommended: "pool",
      because:
        "This is a long act rather than one pick, and its whole case is that the reel answers every tap. A band under the reel keeps it visible in a hand too, which the ruled sheet cannot: at a desk the two are the same column.",
      overrule:
        "If a hand cannot spare the height for both, the ruled sheet is what every other dialog does and the tray is where the photographs are big.",
      lands:
        "Where membership is chosen, whether the reel is visible while it is, and what the dock's job becomes.",
      after: { ask: "room" },
      configs: [SCREEN],
    },
    {
      id: "blocked",
      label: "A tile it cannot take",
      question: "How should a photograph the reel cannot take answer a thumb?",
      context:
        "A hidden photograph stays in the pool but cannot be added. Our own tooltip is ruled to open the instant a pointer arrives, so a mouse is answered and a thumb, in the room this was designed for, still is not.",
      options: [
        {
          id: "title",
          label: "The ruled tooltip, and nothing else",
          means:
            "The tile is disabled and the reason lives in the tooltip a pointer gets instantly. A thumb taps and nothing at all answers.",
        },
        {
          id: "toast",
          label: "A line on the tap",
          means:
            "The tap is answered: a line says the moment is hidden and offers Show. It leaves after a few seconds.",
        },
        {
          id: "caption",
          label: "The tile says it itself",
          means:
            "The word sits on the photograph beside the eye mark, readable before anyone taps, with Show as its own control.",
        },
      ],
      recommended: "caption",
      because:
        "A rule a host cannot read on the device they are holding is not a rule, it is a dead tile. Saying it on the tile costs one line on two photographs in thirty and removes a tap that goes nowhere.",
      overrule:
        "If a standing caption reads as noise across a pool with many hidden items, the line on the tap says it only when asked.",
      lands:
        "What a blocked tile draws, whether the reason survives a touch screen, and where Show lives.",
      after: { ask: "moments" },
      configs: [SCREEN],
    },
    {
      id: "sharing",
      label: "Sharing",
      question: "How should sharing, and unsharing, be answered?",
      context:
        "Share is the room's one loud action and a shared reel rests lit. Unshare is that control tapped again: silent, instant, no way back, while guests may be watching. Sharing is ruled to have one comprehensive sheet.",
      options: [
        {
          id: "silent",
          label: "A silent toggle, as today",
          means:
            "One tap out, with nothing said. The light goes and the only clue is a chip that changed its word.",
        },
        {
          id: "undo",
          label: "An Undo on the way out",
          means:
            "Sharing stays one tap and keeps its light. Unsharing lands, then holds the way back in the toast's own action slot.",
        },
        {
          id: "confirm",
          label: "A confirm that names who is watching",
          means:
            "The Shared chip opens a small panel: 19 guests can watch this now. Stop sharing, or keep it.",
        },
      ],
      recommended: "undo",
      because:
        "Sharing is the celebrated half and should stay one tap; unsharing takes something away from people who may be looking at it right then. Undo is the house answer for a reversible act, and every toast already carries the slot for it.",
      overrule:
        "If a host needs to know who loses the reel before they take it away, only the panel says it at the moment of the tap.",
      lands:
        "What unsharing costs, whether the way back is ever on screen, and where the guest count is said.",
      configs: [SCREEN, SHARED],
    },
    {
      id: "wait",
      label: "The wait",
      question: "What should a host see while their video is being made?",
      context:
        "Download encodes the mp4 on the host's own device, frame by frame, with real progress; today a modal covers the room. A modal is ruled for a moment worth feeling, and a tile stacked and counting down is the house idiom for a run.",
      options: [
        {
          id: "dialog",
          label: "The modal, as today",
          means:
            "A dialog over the room, a spinner and a percent. Closing it is what cancels, and nothing says so.",
        },
        {
          id: "player",
          label: "Progress on the reel itself",
          means:
            "A bar across the reel's foot and the percent beside it. The reel keeps playing, and one X cancels.",
        },
        {
          id: "stack",
          label: "The reel's own frame becomes the stack",
          means:
            "The house idiom, in place: the frame stacks, counts down the moments still to draw, and holds Cancel. It stops playing, because the device is busy.",
        },
        {
          id: "quiet",
          label: "It happens behind you",
          means:
            "The tap answers with a line at the foot and the host carries on working; the file arrives with a notice.",
        },
      ],
      recommended: "stack",
      because:
        "The room's one object is the reel, and the house already says a run in progress by stacking the thing being made and counting it down. It is honest too: the device is drawing those frames, so a reel that claims to keep playing is a fiction.",
      overrule:
        "If the preview really can keep running through the encode, a bar on a playing reel says the same thing with no new furniture.",
      lands:
        "What the export's minute looks like, whether the reel stays visible, and how a host cancels one.",
      after: { ask: "room" },
      configs: [SCREEN],
    },
    {
      id: "guests",
      label: "How a guest watches",
      question: "How should a guest meet the reel on the album page?",
      context:
        "On the album the reel is a still poster; the tap opens a full bleed cinema, and the canvas engine loads then and never before. The site's demo door is ruled a plain framed still, and the album's head carries a waiting tile.",
      options: [
        {
          id: "overlay",
          label: "A poster, then the cinema, as today",
          means:
            "A still on the album and a theatrical opening on the tap. A guest who never taps downloads no engine at all.",
        },
        {
          id: "playing",
          label: "The poster already moving",
          means:
            "The card is the reel, playing in place, and the tap still opens the cinema. Every guest pays the engine on first paint.",
        },
        {
          id: "inline",
          label: "No cinema: it plays where it sits",
          means:
            "The card becomes the player in the column, the two verbs under it. Nothing ever covers the album.",
        },
      ],
      recommended: "overlay",
      because:
        "He took a plain framed still over the running engine at the site's own door, and the head of the album is already spoken for by a guest's own waiting tile. The other two spend the whole canvas engine on the first paint of every album.",
      overrule:
        "If the reel is the point of a finished album, playing in place beats a card that has to be found and tapped.",
      lands:
        "What the album's first paint costs, and whether the ruled cinema opening survives at all.",
      configs: [SCREEN, MOMENT],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls, so a knob eight decisions share arrives eight times: the dock would
 * draw it eight times and React would warn on the duplicate key. Each decision
 * keeps it on its own strip (that is what `configs` is for); the board declares
 * it once. The finding `gallery-width` left for the constructor, which could
 * dedupe by id itself, still stands.
 */
export const REEL_STUDIO: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
