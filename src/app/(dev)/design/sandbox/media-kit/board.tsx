"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { AppliedBadge, BoardPage, type Mode } from "@/components/lab";

import type { Route } from "./kit";
import {
  ApplyPart,
  BridgePart,
  CallSheetPart,
  ExposurePart,
  GapPart,
  LicencesPart,
  RecordPart,
  RunbookPart,
} from "./parts";
import { PlanCard, SourcingSheet, SurfaceCheck } from "./sheet";
import type { Vertical } from "./sources";
import { MEDIA_KIT } from "./spec";

/**
 * THE MEDIA-KIT BOARD (the review wave, 2026-09-14; on the kit's template since
 * the Library x Lab migration wave, 2026-09-15).
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the verdict, the four one-word calls, the three candidates, the seven
 * departures and the eight assets. What is left here is what a board should be
 * and nothing else: the evidence for each declared section, as a function of the
 * declared state.
 *
 * WHAT THE MIGRATION CHANGED, AND WHAT IT DELIBERATELY DID NOT.
 *
 *  1. THE ANSWER IS THE FIRST SCREEN. Round three put a verdict block at the top
 *     of the board and round four put a plan above it; both were still a block
 *     the board drew for itself, in its own grammar, under a page header saying
 *     the same thing one line higher. The template's Answer is the question, the
 *     verdict, what would change it, and the four words a reviewer can reply
 *     with, in the same shape on every board in the wave.
 *  2. ROUND FOUR'S FOLD IS GONE, AND NOTHING IT HID IS GONE WITH IT. Five
 *     sections sat behind one `details` summary because an argument already made
 *     should not sit in front of the answer it produced. The template does that
 *     better and at the right grain: the answer is above everything, the index
 *     is a map of the whole board, and each section folds its OWN argument under
 *     the evidence it belongs to. A reviewer who disagrees with one line opens
 *     one paragraph rather than seven sections.
 *  3. THE FOUR APPLIED BLOCKS RIDE THE KIT'S `ApplyToSite`. Round four carried
 *     them as bare pills in the dock. The kit's Apply is a radio across the
 *     board that reads the tuner store, carries the walk line and the
 *     persistence warning with it, and cannot show two blocks applied at once;
 *     the dock keeps `AppliedBadge`, which is what actually has to be on screen
 *     from anywhere: the name of the block standing on the site, and its clear.
 *  4. THE VIEWPORT IS ONE SWITCH NOW. The bridge stage and the surface check had
 *     a viewport toggle each, so a reviewer comparing them set the same thing
 *     twice. Canvas is declared state (`spec.controls`), which puts it in the
 *     dock, in the URL and inside the walk's steps. The surface check's SOURCE
 *     toggle stays beside it: it dresses one stage, and a control in the dock
 *     claims a reach it does not have.
 *  5. NO CANDIDATE, NUMBER OR RECOMMENDATION MOVED. The wave moves the argument,
 *     it does not re-argue it. The one substantive fix is the two blog counts
 *     the route table used to type (a literal 23), now derived from BRIDGE,
 *     which is this board's own oldest rule applied to the last two places that
 *     still broke it.
 *
 * ★ THE STATE IS THE URL, WHICH IS WHY IT IS DECLARED. Four page-wide switches,
 * one home: the dock renders them, the evidence is a function of them, a walk
 * step sets them, and a link pasted into chat reopens the exact canvas, route,
 * geometry and section a note was written about. Round four held all four in
 * `useState` and could do none of that.
 *
 * Keyframes live in board.css under `mk-`, and there are none: the develop beat
 * is marketing.css's own, tuned here in clock only, so a reduced-motion reader
 * gets the settled composition with nothing to undo. No mono face anywhere: data
 * sits on the body face with tabular figures and every label is the Caption atom.
 */
export function MediaKitBoard() {
  return (
    <BoardPage
      spec={MEDIA_KIT}
      dock={() => <AppliedBadge />}
      evidence={(id, state, api) => {
        const mode = state.canvas as Mode;
        const vertical = state.vertical as Vertical | "all";
        const route = state.route as Route;
        const geometry = state.geometry as "card" | "share";
        switch (id) {
          case "plan":
            return <PlanCard />;
          case "sheet":
            return <SourcingSheet vertical={vertical} />;
          case "surface":
            return <SurfaceCheck vertical={vertical} mode={mode} />;
          case "licences":
            return <LicencesPart />;
          case "apply":
            return <ApplyPart />;
          case "exposure":
            return <ExposurePart />;
          case "gap":
            return <GapPart />;
          case "bridge":
            return (
              <BridgePart
                mode={mode}
                route={route}
                geometry={geometry}
                setRoute={(r) => api.setState({ route: r })}
              />
            );
          case "callsheet":
            return <CallSheetPart />;
          case "record":
            return <RecordPart />;
          case "runbook":
            return <RunbookPart />;
          default:
            return null;
        }
      }}
    />
  );
}
