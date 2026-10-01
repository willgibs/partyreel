/**
 * THE FRONT DOOR, AS DATA: one row per piece a board imports.
 *
 * Every row is a name `src/components/lab/index.ts` exports (the page's test
 * holds the two lists to each other), with what it is for and WHEN to reach
 * for it. The "when" is the half a list of nouns lacks: an agent arriving with
 * a board to build needs to know which piece its preview wants, and the
 * alternative to answering that here is a board building its own. The kit is
 * a review instrument, not a catalog component, so its index lives here rather
 * than in the Library.
 */
export type KitPiece = {
  /** The names, as the front door exports them. */
  names: readonly string[];
  file: string;
  /** What it is for, in this lab. */
  note: string;
  /** When to reach for it, against the piece next to it. */
  reach: string;
  /** Where it can be seen working (a lab path), since none of these mounts inertly here. */
  seen: string;
};

export const KIT_PIECES: readonly KitPiece[] = [
  {
    names: ["ExplorationBoard"],
    file: "src/components/lab/exploration-board.tsx",
    note: "the whole of board.tsx: it takes the spec and a preview per option, and the template, the dock, the step and the walk do the rest",
    reach:
      "always, once, as the board's one export. Its `dock` prop takes the board's own cluster (a Reload, a Measure) and carries it onto the step too.",
    seen: "every board on the desk",
  },
  {
    names: ["PreviewsFor"],
    file: "src/components/lab/exploration.ts",
    note: "the preview map's type, keyed `<decision>.<option>` from the spec itself, so a missing or orphaned preview is a type error rather than a blank tile",
    reach:
      "always: `const PREVIEWS: PreviewsFor<typeof SPEC> = {...}`. A preview that depends on another answer is a function of the state (`(s) => ...`), which is how a decision staged behind another is drawn wearing the answer it waits on.",
    seen: "every board on the desk",
  },
  {
    names: ["Frame"],
    file: "src/components/lab/frame.tsx",
    note: "the lab's only real viewport: a same-origin iframe the preview portals into, so `vw`, breakpoints and the type ladder read the frame's width, not the lab's. A portalled one is its own world: a link or a form pressed in it goes nowhere, a production popup, menu or tooltip opens inside it, and it follows the lab's theme toggle while open",
    reach:
      "for anything judged at a width (a page, a breakpoint, a phone column), production drawn whole, its layers included: no `stopLinks` or `Inert` of the board's own is needed. Its neighbours in frame.tsx (FrameRow, for frames that scroll together) join the front door in the change whose board first needs them.",
    seen: "/design/lab/sample",
  },
  {
    names: ["Fit"],
    file: "src/components/lab/scene.tsx",
    note: "zooms a frame to the lab's Fit preference; zoom scales the picture and leaves the frame's own viewport, and every breakpoint in it, alone. On a step's whole stage it steps aside: the stage scales the whole option, and a row of frames in a Fit may wrap there",
    reach:
      "around a Frame wider than the room it sits in (a 1440 frame in a tile). A bare Frame has no opinion of its own.",
    seen: "locked-door, disposable-mode",
  },
  {
    names: ["Measured"],
    file: "src/components/lab/scene.tsx",
    note: "a number read off the frame's own document, never computed or typed: its observer, its timers and the webfont settle it, and the caption prints what it read. A step keeps the caption out of Will's view and in the page; the whole board prints it, and `lab:demo --verbose` lists it",
    reach:
      "whenever a caption states a number (a size, a line count, a gap). If the words above a frame and the caption under it disagree, the caption is the truth.",
    seen: "locked-door, disposable-mode",
  },
  {
    names: ["CANVAS", "Mode"],
    file: "src/components/lab/stage.tsx",
    note: "the two canvases the boards judge on, 1440 by 930 and 375 by 760, and the name of each",
    reach:
      'to size a frame at a real viewport rather than a number of your own; a decision whose options are a phone column also says `tile: "phone"`.',
    seen: "privacy-hero",
  },
  {
    names: ["DOCK_PILL"],
    file: "src/components/lab/dock.tsx",
    note: "the dock's own pill, as a class string",
    reach:
      "for a control in the board's own dock cluster, so it reads as the dock's and not as the board's drawing.",
    seen: "disposable-mode",
  },
  {
    names: ["BoardState", "optionId", "optionLabel", "optionMeans"],
    file: "src/components/lab/board-spec.ts",
    note: "the board's state (every control's current option) and the readers for an option, whatever its shape",
    reach:
      "inside a function preview or a scene that reads another answer or a knob. A knob's own shape, `Control`, is data: a spec imports it from `@/components/lab/exploration`.",
    seen: "locked-door, disposable-mode",
  },
];
