"use client";

import { BoardPage } from "@/components/lab/board-page";
import { Frame, FrameRow } from "@/components/lab/frame";

import { SAMPLE_BOARD } from "../_desk/sample-spec";

/**
 * THE BOARD TEMPLATE'S OWN DRY RUN (lab-tides, 2026-09-19).
 *
 * The desk has walked the fixture board's STEPS since the stepped review
 * (`/design/lab?session=sample...`), but the board PAGE the template renders
 * had no fixture at all: the only way to look at a change to the template was
 * to open a real board, which is somebody else's file and somebody else's
 * round. So `/design/lab/sample` renders the same fixture through `BoardPage`,
 * and a change to the template is judged on a board nobody is being asked to
 * rule on.
 *
 * It draws three things a template change keeps breaking, in one screen:
 *
 *  1. the CARRIED CALLS above the sections (the fixture declares two);
 *  2. a PORTALLED FRAME holding a `<table>`, which is how the quirks-mode bug
 *     was found and how the doctype fix is read back (frame.tsx, PORTAL_DOC):
 *     the cells inherit the room's colour, or they do not;
 *  3. a lab-only RESPONSIVE VARIANT inside that frame, beside the same rule
 *     written as plain CSS. A lab-only `sm:w-[200px]` compiles into the
 *     `utilities.lab` SUB-layer and loses to production's own `w-full` in
 *     `utilities`, whatever the frame's width; the media query in the board's
 *     own sheet is unlayered and wins. Drawn rather than described, because
 *     that is the difference between a rule people believe and one they forget
 *     (design.css says the same thing in words).
 *
 * It is not in the registry, nothing links to it, and the crawl never reaches
 * it: it is a tool, not a board, and `sandbox/registry.ts` stays the one list
 * of what Will is asked to rule on.
 */
export function SampleBoardPage() {
  return (
    <BoardPage
      spec={SAMPLE_BOARD}
      // The board's own dock cluster, which a step's stage head now carries
      // too (step.tsx, `StepBoard.tools`).
      dock={() => (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium"
        >
          Reload frames
        </button>
      )}
      evidence={(section) => (section === "walk" ? <Scene /> : <LedgerNote />)}
    />
  );
}

function Scene() {
  return (
    <FrameRow>
      <Frame
        id="sample-720"
        w={720}
        h={320}
        title="A portalled scene, 720"
        caption="Above the sm breakpoint: the CSS box is 200px wide, the Tailwind one is not."
      >
        <Room />
      </Frame>
      <Frame
        id="sample-375"
        w={375}
        h={320}
        title="The same scene, 375"
        caption="Below it: both boxes are full width, which is what a frame's own viewport means."
      >
        <Room />
      </Frame>
    </FrameRow>
  );
}

/** The scene each frame portals: the two checks, drawn. */
function Room() {
  return (
    <div data-sample-room className="flex flex-col gap-3 p-4 text-foreground">
      {/* A board's own sheet, as two standing boards already carry one. It is
          UNLAYERED, which is why it beats production's `w-full`. */}
      <style>{`
        [data-sample-room] .sample-css-box { width: 100% }
        @media (min-width: 640px) { [data-sample-room] .sample-css-box { width: 200px } }
      `}</style>
      <table className="w-full border-collapse text-left text-[11px]">
        <tbody>
          <tr>
            <th className="border-b border-border py-1 font-medium">
              A table
            </th>
            <td className="border-b border-border py-1">
              These cells wear the room&apos;s colour in standards mode, and the
              browser&apos;s black in quirks.
            </td>
          </tr>
        </tbody>
      </table>
      <span className="text-[11px] text-muted-foreground">
        Tailwind, lab-only: w-full sm:w-[200px]
      </span>
      <div
        data-sample-box="tailwind"
        className="h-5 w-full rounded bg-foreground/20 sm:w-[200px]"
      />
      <span className="text-[11px] text-muted-foreground">
        The same rule in the board&apos;s own sheet
      </span>
      <div
        data-sample-box="css"
        className="sample-css-box h-5 rounded bg-foreground/20"
      />
    </div>
  );
}

function LedgerNote() {
  return (
    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
      The fixture&apos;s own ledger section. What a sitting composes is on the
      desk, not here: this page exists so a change to the board TEMPLATE can be
      looked at without opening a board somebody is being asked to rule on.
    </p>
  );
}
