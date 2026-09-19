import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HIGHLIGHT REEL, ROUND ONE (2026-09-19).
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
    date: "2026-09-19",
    changed:
      "The first round: the door into the studio, the room at a laptop, where fourteen looks live, where moments are picked, what a tile the reel cannot take says, how unsharing is answered, what the export's minute looks like, and how a guest meets the reel.",
  },
  context:
    "A host curates their event's best moments and gets a shareable highlight video. Everything that shapes it lives in one room at /dashboard/[eventId]/reel, and everything in that room was composed for a phone. Every picture here is that room, or the surfaces on either side of it, at 1440 by 900 with 375 on the knob, over one wedding: 148 photographs, eight in the cut. Every reel frame is the real engine drawing the real fixture clips. Nothing on this board presigns, encodes, publishes or writes anything.",
  bible: [1, 12, 15, 22],
  asks: [
    {
      id: "door",
      label: "The door",
      question: "How should a host get into the studio?",
      context:
        "The Studio is the only room with any control over the reel, and the only visible way in from the event page is an 11 px underlined link beside the status chip. The poster below it, which is the reel's own face, is not tappable at all.",
      options: [
        {
          id: "link",
          label: "The 11 px link, as today",
          means:
            "A text link in the status row, at the page's smallest size, carrying the whole room behind it.",
        },
        {
          id: "button",
          label: "A button beside the chip",
          means:
            "The same row, a real control with the clapperboard on it. One more piece of furniture over the poster.",
        },
        {
          id: "poster",
          label: "The poster is the door",
          means:
            "The reel's own face is the tap, with Edit reel at its corner; the link stays for a keyboard and a screen reader.",
        },
      ],
      recommended: "poster",
      because:
        "The reel's face is the object a host reaches for and it is inert, while the door to every control is a footnote beside it. Making the picture the door costs no furniture and puts the largest thing in the section to work.",
      overrule:
        "If a live poster is a strange thing to make a button, the real button is the honest middle.",
      lands:
        "What the event page's Reel section offers, and how big the door into the only room with controls is.",
      configs: [SCREEN, SHARED],
    },
    {
      id: "room",
      label: "The room",
      question: "What should the studio be on a laptop?",
      context:
        "The Studio is a near-black room built for a hand: the reel is capped at 360 px and every control slides up over it. On a 1440 by 900 laptop that same frame sits in a room a thousand pixels wider.",
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
            "Both caps removed: the reel fills the room, and the header, the dock and the tray float over the black it already stood on.",
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
        "If the Studio must read as one room at every size, giving the reel the whole room is most of the win and no second layout.",
      lands:
        "The Studio's shape at a laptop, where the reel's frame is capped, and whether a control may cover it.",
      configs: [SCREEN, SHARED, LOOK],
    },
    {
      id: "styles",
      label: "The looks",
      question: "How should fourteen looks be offered?",
      context:
        "Fourteen designed looks, each drawn here as a real engine frame of this host's own cut. Today they are a four-column wall in a sheet over the reel, and a finished scrolling rail sits in the code with no caller.",
      options: [
        {
          id: "wall",
          label: "The four-column wall, as today",
          means:
            "Fourteen at once, small, in a sheet. Reopening it is cheap; seeing what you just picked is not.",
        },
        {
          id: "rail",
          label: "One scrolling row, the reel still visible",
          means:
            "The dead rail, resurrected: bigger frames, four or five in view, the reel uncovered above them.",
        },
        {
          id: "three",
          label: "Three to start, the rest behind More",
          means:
            "One look per family at a size you can actually read, and eleven more a tap away.",
        },
      ],
      recommended: "rail",
      because:
        "A look is judged against the reel, so a picker that covers the reel cannot answer its own question. A row keeps it on screen and makes each frame big enough to tell Noir from Editorial.",
      overrule:
        "If the room becomes a workbench, the wall covers nothing any more and fourteen at once is the better grid.",
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
        "A tap writes, the dock reshuffles and the player re-cuts. The case for picking inside the Studio is that the reel plays two inches above, but the sheet is 70 percent of the room's height. Drawn in the room you chose.",
      options: [
        {
          id: "sheet",
          label: "The sheet over the reel, as today",
          means:
            "The album's pool in a tall dark sheet. The reel re-cuts behind it, where it cannot be seen.",
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
            "Picking happens where the photographs are big, on the event page, under a tray holding the cut and the way into the room.",
        },
      ],
      recommended: "pool",
      because:
        "The whole case for picking inside the Studio is that the reel answers every tap. A sheet that covers nearly all of it keeps the cost of being in the room and gives none of the benefit.",
      overrule:
        "If a phone cannot spare the height for both at once, the sheet is the honest way to give the pool the screen.",
      lands:
        "Where membership is chosen, whether the reel is visible while it is, and what the dock's job becomes.",
      after: { ask: "room" },
      configs: [SCREEN],
    },
    {
      id: "blocked",
      label: "A tile it cannot take",
      question: "How should a photograph the reel cannot take explain itself?",
      context:
        "A hidden photograph stays in the pool but cannot be added: the RPC refuses anything unapproved. Today its tile is disabled and the reason rides a native tooltip, which never fires on a touch screen.",
      options: [
        {
          id: "title",
          label: "A native tooltip, as today",
          means:
            "A sentence only a mouse can reach. On the phone this room was designed for, the tile simply does not answer.",
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
        "Share is the room's one loud action, and a shared reel rests lit from behind for as long as it is shared. Unshare is that same control tapped again: silent, instant, no confirm and no way back on screen, while guests may have the reel open.",
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
            "Sharing stays one tap and keeps its light. Unsharing lands, then holds the way back for a few seconds.",
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
        "Sharing is the celebrated half and should stay one tap; unsharing takes something away from people who may be looking at it right then. Undo is the house answer for a reversible act, and it costs the share nothing.",
      overrule:
        "If a host needs to know who loses the reel before they take it away, only the panel says it.",
      lands:
        "What unsharing costs, whether the way back is ever on screen, and where the guest count is said.",
      configs: [SCREEN, SHARED],
    },
    {
      id: "wait",
      label: "The wait",
      question: "What should a host see while their video is being made?",
      context:
        "Download encodes the mp4 on the host's own device, frame by frame, with real progress. Today a modal covers the room with a spinning clapperboard and a percentage, so the one thing actually being made is hidden behind a description of it.",
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
          id: "quiet",
          label: "It happens behind you",
          means:
            "The tap answers with a line at the foot and the host carries on working; the file arrives with a notice.",
        },
      ],
      recommended: "player",
      because:
        "The thing being made is on the screen. Covering it to announce that it is being made is backwards, and the dialog's one unique job, cancelling, is a gesture nobody would guess.",
      overrule:
        "If the encode makes the room unusable anyway, the modal is at least honest about what it is costing.",
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
        "On the album the reel is a still poster with a play badge; tapping it opens a full bleed cinema with a flash, the event's name, then the reel looping without chrome. The whole canvas engine loads on that first tap and never before it.",
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
        "The cinema is the product's one theatrical beat and it is built on the swap from a small still. The other two spend the whole canvas engine on the first paint of every album, including for the guests who came only to upload.",
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
