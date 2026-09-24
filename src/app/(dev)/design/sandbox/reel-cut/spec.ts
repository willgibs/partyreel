import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * FROM THE REEL TO A CUT (round one, 2026-09-22): the creator.
 *
 * A NEW BOARD, wave 2 of THE REEL ROUND ("the reel,
 * reconceived", every sentence his). The reel is now the event's: alive from
 * the third item, no host action, no file. A CUT is yours: from the reel,
 * anyone with album access taps "Make your own", picks moments, one of the
 * fourteen looks, portrait or landscape and a length; it renders on the
 * device, saves to the phone and shares as a FILE, and on a paid event it can
 * go back into the album as an ordinary video the live reel skips.
 *
 * ★ ONE GUEST, THE WHOLE BOARD, AND SHE IS `media-viewer`'S. Priya, at Maya
 * and Jay's wedding, met one beat after `guest-capture` leaves her: she has
 * watched the reel and tapped the verb. The one frame she does not appear in
 * is `blocked`, which is the host's alone, because a hidden photograph is not
 * in a guest's pool at all.
 *
 * ★ EVERY REEL FRAME IS THE REAL ENGINE over the fixture album (stills.tsx),
 * including the free mark, which the engine stamps in the dispatch layer so
 * no look can export without it. A hand-drawn thumb would be the exact
 * failure the house already names: a board showing a look production never
 * had.
 *
 * ★ THE GUEST-FACING WORD IS "CLIP" NOW (his own copy, on the album tile:
 * "Make your own clip to share"). This board, its folder and its files keep
 * "cut" as the internal name throughout, unchanged: nothing here asks which
 * word to use, so only what a guest actually reads moved.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. That cuts leave on devices; that the
 * fourteen looks are the cut's while the eight moods roll in the live reel;
 * that the free levers are the mark and the length and never the quality;
 * no music, no end card, no timeline and no per-clip editing; that Share is
 * its own tap and "Add to the album" rides the ordinary upload queue on a
 * paid event. All ruled. The reel view's own chrome is DECIDED now
 * (`reel-view` round one, verbatim in `reel-refresh-cut`'s manifest: a
 * weighted dock, "Add yours" an icon, "Make your own" the one primary
 * beneath it, the arrival chip top left, the event's code a plate bottom
 * right, no event name on screen), so `ReelView` below wears it as ground
 * rather than drawing it neutrally; only `entry` and `noencode` still touch
 * the one slot this board owns. `guest-capture.follow` and
 * `guest-capture.landing` are that board's; nothing here asks them.
 */

/**
 * THE SCREEN. A cut is a guest's phone act (saved to the phone, shared as a
 * file), so 375 leads and 1440 is the knob. `room` ignores this and draws
 * both at once, because "at a laptop and in a hand" is literally its question.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** Which look the cut is wearing, so a room is judged on a real one. */
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

/** Which fill the cut started from, which changes what the pool shows. */
const FILL: Control = {
  id: "fill",
  label: "Started from",
  options: [
    { id: "reel", label: "The reel's picks" },
    { id: "mine", label: "Only mine" },
    { id: "all", label: "Everything" },
  ],
  default: "reel",
};

/** Paid or free, which decides whether a third door exists at the finish. */
const PLAN: Control = {
  id: "plan",
  label: "The event",
  options: [
    { id: "paid", label: "Paid, so a cut can go back" },
    { id: "free", label: "Free, so it cannot" },
  ],
  default: "paid",
};

const DRAFT = defineExploration({
  id: "reel-cut",
  title: "From the reel to a cut",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "Re-cut under his batch-1 answers: entry now names both doors in (the view's primary and the tile's own line); noencode redrawn on the weighted dock's empty primary slot and the tile's description; finish's Save reads Save to Photos; the guest-facing word is clip throughout.",
  },
  context:
    "Priya is at Maya and Jay's wedding, watching the event's live reel, and she has tapped Make your own. Her cut renders on her phone and leaves as a file: nothing is stored and nothing is written. The album holds 26 items, one of them a cut Theo already added, so her pool is 25. Every frame of a cut here is the real engine over those photographs, at 375 with 1440 on the knob.",
  carried: [
    {
      id: "world",
      question: "Whose cut is on the board, and on what kind of event?",
      taken:
        "Priya's, a guest at a paid event, so Add to the album exists. The mark asks its question on a free one.",
      overrule:
        "If the host is the commoner maker, the room should be drawn from the hub instead and the pool starts hidden-aware.",
    },
    {
      id: "settings",
      question:
        "Do orientation, cover and length still get controls in the creator?",
      taken:
        "Yes: the shipped tray of five, drawn but not asked. Curated randomness is ruled, so nothing here edits a clip.",
      overrule:
        "If a cut should offer fewer knobs than the Studio did, say which chip goes and the tray loses it.",
    },
    {
      id: "fills",
      question: "What are the three fills a cut starts from called?",
      taken:
        "The reel's picks, Only mine, Everything, as placeholders. The sets are real; the words are a copy round's.",
      overrule:
        "Any of the three can be renamed without moving a pixel of the surfaces they sit on.",
    },
    {
      id: "noun",
      question: "Should every guest-facing string say clip, or keep cut?",
      taken:
        "Clip, following his own copy on the tile; cut stays the board's, the folder's and every identifier's internal name.",
      overrule:
        "If cut should stay the guest-facing word too, revert the strings this round touched; nothing structural moves.",
    },
  ],
  asks: [
    {
      id: "entry",
      label: "The way in",
      question: 'How should "Make your own" open, from either of its doors?',
      context:
        "Priya meets this from either of two doors now: the view's own primary \"Make your own\" beneath its dock, or the album tile's \"Make your own clip to share\" line, tapped straight from the page she is scrolling.",
      options: [
        {
          id: "sheet",
          label: "A sheet over the reel, becoming the creator",
          means:
            "The view's own door: the reel keeps playing behind; a panel rises holding her picks and grows into the whole creator as she works.",
        },
        {
          id: "room",
          label: "A room of its own, the reel sliding in",
          means:
            "The view's own door: it hands off, the cut arrives in its own frame with its own controls under it, and Back returns to the reel.",
        },
        {
          id: "beneath",
          label: "Back to the album, the creator beneath",
          means:
            "The tile's own door already opens this way: no view to leave, so the creator opens right under \"Highlight reel\" in the page itself.",
        },
      ],
      recommended: "room",
      because:
        "A cut is a different object from the reel: fourteen looks against eight, its own clip list, an orientation and a length. A sheet over the view puts two Style controls two inches apart. A room of its own also survives a refresh and makes the back gesture mean what it looks like.",
      overrule:
        "If leaving the reel to cut it reads as losing your place, only the sheet keeps the thing she liked on screen the whole way.",
      lands:
        "Whether the view's own door opens a sheet or a room, whether the tile's door still lands beneath, and what Back does mid-cut.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "room",
      label: "The room",
      question: "What should the creator be at a laptop and in a hand?",
      context:
        "The Studio is a near black room built for a hand: the cut capped at 360 px and every control sliding over it, unchanged at 1440. The creator inherits that room, and now its commonest visitor is a guest on a phone.",
      options: [
        {
          id: "capped",
          label: "The cut capped, the work over it",
          means:
            "The Studio as it ships: 360 px of cut in the middle of any room, and every sheet over the thing it is changing.",
        },
        {
          id: "float",
          label: "The cut fills the room, the work floats",
          means:
            "Both caps off: the cut takes the room and the header, the dock and the sheet float over it on the one ruled glass.",
        },
        {
          id: "bench",
          label: "A workbench, the sheet beside the cut",
          means:
            "At a laptop the room splits, the cut on the left and whatever is open a column beside it. A hand is unchanged.",
        },
      ],
      recommended: "bench",
      because:
        "Every control here covers the thing it changes, which only a hand has to forgive. At a laptop the work goes beside the cut, and picking a look means watching it change rather than remembering it. In a hand this is honestly today's room, and the caption says so.",
      overrule:
        "If the creator must read as one room at every size, the cut taking the room on the ruled glass is most of the win and no second layout.",
      lands:
        "The creator's shape at each size, and whether a control may ever cover the cut it is changing.",
      configs: [LOOK],
    },
    {
      id: "looks",
      label: "The looks",
      question: "How should the cut's fourteen looks be offered?",
      context:
        "Fourteen designed looks, eight moods and six treatments, each drawn here by the engine over her own clips. Today they are a four column wall in a sheet over the cut. The live reel offers only the eight, so this wall is the cut's own.",
      options: [
        {
          id: "wall",
          label: "The four column wall, in the ruled sheet",
          means:
            "Fourteen at once: a panel beside the cut at a desk, where it covers nothing, and the same wall over it in a hand.",
        },
        {
          id: "rail",
          label: "One scrolling row, the cut always visible",
          means:
            "Bigger frames, four or five in view, and nothing covering the cut at either size. Nine looks live off screen.",
        },
        {
          id: "three",
          label: "Three to start, the rest behind More",
          means:
            "One look per family at a size you can read, and eleven more a tap away, in whichever posture the sheet takes.",
        },
      ],
      recommended: "wall",
      because:
        "Every tile is her own clips drawn by the engine, so the wall does not need the cut behind it: each tile is the preview. Fourteen at once beats five in a row that hides nine, and at a desk the ruled panel stands beside the cut rather than over it.",
      overrule:
        "If a look can only be judged in motion, the rail is the one posture that keeps the cut playing while she picks.",
      lands:
        "Where the fourteen live, how big one is, and whether picking a look ever covers the cut.",
      after: { ask: "room" },
      configs: [SCREEN, LOOK],
    },
    {
      id: "moments",
      label: "The moments",
      question: "Where should a guest choose what is in her cut?",
      context:
        "Nothing is written: the pick is hers, on her device, and the cut re-cuts as she taps. Three fills start her off, and the pool is the album the reel plays, so a cut is never cut from cuts.",
      options: [
        {
          id: "sheet",
          label: "The sheet over the cut, as the Studio ships",
          means:
            "The pool in the ruled sheet: a column beside the cut at a desk, and a tall sheet over it in a hand.",
        },
        {
          id: "pool",
          label: "A pool under the cut, never over it",
          means:
            "The pool goes where there is room and never over the cut: a column on a workbench, a band at the foot anywhere else.",
        },
        {
          id: "tray",
          label: "The album itself, the cut in a tray",
          means:
            "Picking happens in the album, where the photographs are full size, under a tray holding the cut and the way back.",
        },
      ],
      recommended: "pool",
      because:
        "The three fills do most of the work, so whoever opens the pool is actually changing something, and for her the whole case is that the cut answers every tap. A band under it keeps the cut visible in a hand too, which a sheet cannot; at a desk the two are one column.",
      overrule:
        "If a hand cannot spare the height for both, the ruled sheet is what every other dialog does and the fills carry the rest.",
      lands:
        "Where a cut's membership is chosen, whether the cut is visible while it is, and how loudly the fills lead.",
      after: { ask: "room" },
      configs: [SCREEN, FILL],
    },
    {
      id: "blocked",
      label: "A tile no cut can take",
      question: "How should a hidden photograph answer the host in her pool?",
      context:
        "A guest never meets one: hidden items are not in her pool at all. The host is the only maker who sees them, dimmed, in her own album, and a cut cannot take one because the reel does not play it.",
      options: [
        {
          id: "caption",
          label: "The tile says it itself",
          means:
            "The word sits on the photograph beside the eye mark, readable before anyone taps, with Show as its own control.",
        },
        {
          id: "toast",
          label: "A line on the tap",
          means:
            "The tap is answered: a line says the moment is hidden and a cut cannot take it, and offers Show. It leaves after a few seconds.",
        },
        {
          id: "tooltip",
          label: "The ruled tooltip, and nothing else",
          means:
            "The tile is disabled and the reason lives in the tooltip a pointer gets instantly. A thumb taps and nothing answers.",
        },
      ],
      recommended: "caption",
      because:
        "A rule a host cannot read on the device she is holding is not a rule, it is a dead tile. Saying it on the photograph costs one line on two tiles in twenty-five and removes a tap that goes nowhere.",
      overrule:
        "If a standing caption reads as noise across an album with many hidden items, the line on the tap says it only when asked.",
      lands:
        "What a blocked tile draws, whether the reason survives a touch screen, and where Show lives.",
      after: { ask: "moments" },
      configs: [SCREEN],
    },
    {
      id: "wait",
      label: "The wait",
      question: "What should a guest see while her cut is being drawn?",
      context:
        "The cut encodes on her own device, frame by frame, with real progress, and the device is busy drawing them. Today a modal covers the room. Every option carries what a backgrounded tab and a lost context do to it.",
      options: [
        {
          id: "stack",
          label: "The frame stacks and counts the moments down",
          means:
            "The house idiom in place: the cut's own frame stacks, counts what is left to draw and holds Cancel. It stops playing.",
        },
        {
          id: "bar",
          label: "A bar across the cut's foot, still playing",
          means:
            "The preview keeps running and a bar crosses its foot with the percent beside it. One X cancels.",
        },
        {
          id: "modal",
          label: "A modal over the room, as shipped",
          means:
            "A dialog, a spinning clapperboard and a percent over the room. Closing it is what cancels, and nothing says so.",
        },
      ],
      recommended: "stack",
      because:
        "The room's one object is the cut, and the house already says a run in progress by stacking the thing being made and counting it down. It is honest too: the device is drawing those frames, so a preview that claims to keep playing is a fiction.",
      overrule:
        "If the preview really can keep running through the encode, a bar on a playing cut says the same thing and adds no furniture.",
      lands:
        "What the export's minute looks like, whether the cut stays visible, and how a lost tab is survived.",
      after: { ask: "room" },
      configs: [SCREEN],
    },
    {
      id: "finish",
      label: "The finish",
      question: "How should the finish screen offer what a cut can do next?",
      context:
        "The file is on her device and nothing has been uploaded. Save to Photos, Share as a file, Add to the album on a paid event, Make another. Share is its own tap, never chained off the encode, because iOS spends the tap during the render.",
      options: [
        {
          id: "four",
          label: "Four equal doors",
          means:
            "Save, Share, Add to the album and Make another as one grid of equal weight, the cut playing above them.",
        },
        {
          id: "share",
          label: "Share leads, the rest beneath",
          means:
            "One full width Share, with Save, Add to the album and Make another as quieter rows under it.",
        },
        {
          id: "save",
          label: "Save leads, Share and Add a pair",
          means:
            "Save is the one loud button; Share and Add to the album sit beside each other under it, Make another a quiet link.",
        },
      ],
      recommended: "share",
      because:
        "A cut exists to be posted, and Save is the fallback for a browser that cannot hand a file to an app. Leading with Share puts the loop first, and where sharing a file is impossible Save takes the same lead slot with one line, which no other shape survives as cleanly.",
      overrule:
        "Four equal doors is the only shape that does not move when Add to the album is absent on a free event.",
      lands:
        "What a finished cut leads with, and what the screen becomes when one of its doors is missing.",
      tile: "phone",
      configs: [SCREEN, PLAN],
    },
    {
      id: "mark",
      label: "The free mark",
      question: "How should a free cut's mark be shown before it is made?",
      context:
        "A free cut carries the small partyreel.com mark and a shorter cap; a paid cut carries neither. The mark is stamped in the dispatch layer so no look can export without it, and every frame here is the engine drawing it.",
      options: [
        {
          id: "line",
          label: "Drawn where it exports, with one line",
          means:
            "The mark sits in the preview exactly where the file will carry it, and a quiet line names the plan that removes it.",
        },
        {
          id: "bare",
          label: "Drawn, and nothing said",
          means:
            "The mark is in the preview and the room says nothing about it. What removes it is found somewhere else entirely.",
        },
        {
          id: "chip",
          label: "A corner chip that says free, and links",
          means:
            "The mark is in the preview and a small chip on the cut reads Free, opening the plan that would remove it.",
        },
      ],
      recommended: "line",
      because:
        "The mark is already the honest part: drawn where it exports, so nothing is a surprise at Save. One line names what removes it once, next to the thing it is on, rather than a chip competing with the cut's own controls for the corner.",
      overrule:
        "If a standing line reads as a pitch inside a guest's own creation, the bare mark says everything the file will and no more.",
      lands:
        "Whether a free cut ever names the paid plan, and where an upgrade door sits in a guest's room.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "noencode",
      label: "No encoder here",
      question: "What should the reel show on a device that cannot cut?",
      context:
        "Some browsers have no encoder. The reel plays anywhere, so only the clip is impossible. This shows in two places now: the view's own weighted dock, where removing the primary empties its slot, and the album tile's own description line.",
      options: [
        {
          id: "line",
          label: "One honest line where the button was",
          means:
            "Make your own is gone and a quiet sentence in its place says a clip needs a newer browser, and the reel plays either way.",
        },
        {
          id: "greyed",
          label: "A greyed button carrying the line",
          means:
            "The control stays in the row, visibly disabled, with the same sentence under it rather than behind a tap.",
        },
        {
          id: "nothing",
          label: "Nothing at all",
          means:
            "The control is simply absent, the rest of the chrome closes the gap, and nothing on the screen says why.",
        },
      ],
      recommended: "line",
      because:
        "Silence leaves a guest who has watched a friend make one thinking the page is broken, and a dead control is a dead end whatever it is called. One sentence answers both and costs a line the view has room for.",
      overrule:
        "If the view's chrome must stay clean while the reel plays, the absent control is cleanest and the help article can carry the reason.",
      lands:
        "What a device with no encoder is told, on the view's own dock and the tile's description, and whether either ever ships a dead control.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT. `defineExploration`
 * already dedupes by id, and this filter is the hand-rolled one every board
 * over this world carries: deduping twice is deduping once, and the day the
 * constructor's own filter moves, this board does not silently draw the
 * screen knob seven times.
 */
export const REEL_CUT: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
