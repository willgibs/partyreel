"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useCallback, useState } from "react";

import {
  BoardPage,
  CANVAS,
  Catalog,
  CellLabel,
  comparePair,
  CostMeter,
  Frame,
  FrameRow,
  labScenePath,
  type Mode,
  ReplayButton,
  Stage,
  useDesignKey,
} from "@/components/lab";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { CinemaHeroDraft } from "./hero";
import { HOME_HERO } from "./spec";
import { BUILT, STREAM_IDS, type StreamId } from "./streams";

/**
 * THE HOME HERO BOARD (round six, 2026-09-16): a catalog of four streams.
 *
 * Three sections and nothing else, because the board is down to one open
 * question. The direction, the lockup, the headline and the count were ruled on
 * round five, and what is left is which composition the photographs leaving the
 * code should be.
 *
 * ★ A CARD IS THE REAL HERO AT 1:1, NOT A THUMBNAIL OF ONE. The grid's minimum
 * column is the canvas itself, so the four stack in one column and each stage
 * carries a real 1440, which is Will's standing ruling on the lab's previews
 * (2026-09-15: 1:1, never zoom-fitted). A hero judged at 0.7x is a different
 * hero: the frames are the size of the thing being argued about.
 *
 * ★ AND EVERY CARD REPLAYS ON ITS OWN. Each of the four opens with a branch-out
 * that has finished by the time a reviewer scrolls to it, and the honest way to
 * see it again is a remount, so each stage is keyed on its own run rather than
 * on one board-wide Replay: comparing two entrances means running one of them
 * twice while the other holds still.
 *
 * ★ NO `bodySkin` ON THESE STAGES, deliberately. `data-mkt-skin` flips the whole
 * page through `body:has(...)`, which would make the lab's own chrome
 * cinema-dark whatever theme the reviewer chose; Will's lab-surface ruling is
 * that dark and light are chosen separately. The stages carry cinema themselves,
 * which is where it belongs.
 *
 * Lab convention, unchanged: nothing here pauses on scroll (side-by-side
 * comparison wants everything running). The loop pauses on a hidden TAB only,
 * through the stage's data-paused; production wiring is useAmbientPause.
 */
export function HomeHeroBoard() {
  const qrUrl = DEMO_EVENT_URL ?? null;
  const key = useDesignKey();

  // One run counter per card: see the second landmine above.
  const [runs, setRuns] = useState<Record<string, number>>({});
  const replay = useCallback(
    (id: string) => setRuns((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 })),
    [],
  );

  /**
   * ★ THE COST METER'S ONLY HONEST ISOLATION IS AN UNSTARTED LOOP. The kit's
   * meter sets `data-lab-solo` on <html> and a board's sheet usually answers by
   * hiding its other specimens, which works for a CSS animation and is a lie
   * here: `display: none` does not stop a requestAnimationFrame callback, so a
   * hidden stream writes sixteen transforms a frame exactly like a visible one
   * and a run taken beside three of them measures the board. So the meter's
   * phases put the board into a measuring mode instead, and every hero but the
   * one being measured renders its rest state with no loop at all.
   *
   * It is React state rather than a declared control on purpose: it is a
   * transient mode belonging to one instrument, not a page-wide switch a review
   * note would ever link to, and the kit's rule is that a switch in the dock is
   * in the spec and one that is not sits beside its own specimen.
   */
  const [measuring, setMeasuring] = useState<StreamId | null>(null);

  return (
    <BoardPage
      spec={HOME_HERO}
      evidence={(id, state, api) => {
        const mode = state.canvas as Mode;
        const pick = state.stream as StreamId | "none";
        switch (id) {
          case "stream":
            return (
              <div className="flex flex-col gap-6">
                <Catalog
                  spec={HOME_HERO}
                  state={state}
                  setState={api.setState}
                  minWidth={CANVAS.desktop.w}
                  render={(candidate) => {
                    const stream = candidate.id as StreamId;
                    const run = runs[stream] ?? 0;
                    return (
                      <div
                        className="flex min-w-0 flex-col gap-2"
                        data-lab-solo-target={
                          measuring === stream ? "" : undefined
                        }
                      >
                        <Stage
                          key={`${stream}-${mode}-${run}`}
                          mode={mode}
                          ground="cinema"
                        >
                          <CinemaHeroDraft
                            mode={mode}
                            stream={stream}
                            qrUrl={qrUrl}
                            still={measuring !== null && measuring !== stream}
                          />
                        </Stage>
                        <div className="flex justify-end">
                          <ReplayButton
                            runId={run}
                            onReplay={() => replay(stream)}
                          />
                        </div>
                      </div>
                    );
                  }}
                />
                <Cost mode={mode} onMeasure={setMeasuring} />
              </div>
            );

          case "pair": {
            // ★ A FRAME ROW RATHER THAN THE KIT'S CompareTwo, for one reason:
            // `Compare mode="side"` lays its halves in `minmax(0, 1fr)`
            // columns, and a half here is a 1440 px viewport. Two of those in a
            // squeezed grid is two frames that are no longer 1440, which is the
            // one thing this section exists to be. A FrameRow scrolls sideways
            // at 1:1 and locks the two documents' scroll together, so the same
            // moment of the page is on screen in both halves, which is what
            // makes a comparison of a moving hero possible at all. The A/B
            // plumbing is still the kit's: `comparePair` reads the two declared
            // controls the catalog's own buttons set.
            const pair = comparePair(HOME_HERO, state);
            if (!pair) return null;
            const { a, b } = pair;
            if (a.id === b.id) {
              return (
                <div className="flex min-w-0 flex-col gap-2">
                  <WornPage
                    id="hh-pair-a"
                    stream={a.id as StreamId}
                    mode={mode}
                    designKey={key ?? null}
                    height={CANVAS[mode].h}
                  />
                  <CellLabel>
                    A and B are the same card. Press B on another one.
                  </CellLabel>
                </div>
              );
            }
            return (
              <div className="flex min-w-0 flex-col gap-2">
                <FrameRow>
                  <WornPage
                    id="hh-pair-a"
                    stream={a.id as StreamId}
                    mode={mode}
                    designKey={key ?? null}
                    height={CANVAS[mode].h}
                  />
                  <WornPage
                    id="hh-pair-b"
                    stream={b.id as StreamId}
                    mode={mode}
                    designKey={key ?? null}
                    height={CANVAS[mode].h}
                  />
                </FrameRow>
                <CellLabel>
                  One component swapped: the only difference between these two
                  pages is how the album leaves the code.
                </CellLabel>
              </div>
            );
          }

          case "page":
            return (
              <FrameRow lock={false}>
                {pick === "none" ? (
                  <Frame
                    id="hh-today"
                    src="/"
                    w={CANVAS[mode].w}
                    h={Math.round(CANVAS[mode].h * 1.4)}
                    title="The hero that ships today"
                    caption="The real route: three darkening layers over twenty-four tiles. Pick a card above and this frame wears it."
                    onApproach
                  />
                ) : (
                  <WornPage
                    id="hh-pick"
                    stream={pick}
                    mode={mode}
                    designKey={key ?? null}
                    height={Math.round(CANVAS[mode].h * 1.4)}
                  />
                )}
              </FrameRow>
            );

          default:
            return null;
        }
      }}
    />
  );
}

/**
 * ONE STREAM, WORN BY THE WHOLE HOME PAGE.
 *
 * Named `WornPage` rather than the obvious thing: `PageFrame` is a name the kit
 * owns and `kit-discipline.test.ts` fails a board that re-declares one, which is
 * the ratchet that stops two boards growing two grammars for the same piece.
 * This is not that piece; it is one stream's scene inside the kit's own Frame.
 *
 * ★ A SCENE ROUTE RATHER THAN A CSS PASTE, and it is the one thing that makes
 * this board different from every other. The kit's Frame writes a candidate
 * stylesheet into the real route, which is enough when a ruling is a token or a
 * radius; this ruling is a composition, and no sheet can swap a hero. `page.tsx`
 * beside this file renders production's own section order and chrome with one
 * component replaced, so what is inside the frame is the real page and the real
 * scroll rather than a section portalled into a box.
 *
 * ★ THE STREAM RIDES `push`, NOT THE URL. Changing `src` reloads the document
 * and the reader loses the scroll position; `push` dispatches `lab:set` into the
 * frame's window and the scene swaps the hero in place. The src carries the
 * stream as well, because that is what seeds the FIRST paint: the push lands an
 * effect later, and a frame that painted the wrong stream for a frame would be
 * lying on the one board that is about which stream to ship.
 *
 * ★ AND IT IS GATED. Every lab route 404s without the key and the key is
 * browser-only, so the frame must not be server rendered or the reader watches a
 * 404 paint and then a reload.
 */
function WornPage({
  id,
  stream,
  mode,
  designKey,
  height,
}: {
  id: string;
  stream: StreamId;
  mode: Mode;
  designKey: string | null;
  height: number;
}) {
  const built = BUILT[stream][mode];
  return (
    <Frame
      id={id}
      src={labScenePath(
        "/design/sandbox/home-hero",
        { stream, w: String(CANVAS[mode].w) },
        designKey,
      )}
      w={CANVAS[mode].w}
      h={height}
      gated
      onApproach
      push={{ stream }}
      title={HOME_HERO.candidates.find((c) => c.id === stream)?.name ?? stream}
      caption={`${built.facts.onScreen} frames at the busiest instant, ${built.facts.smallest} to ${built.facts.largest} px.`}
    />
  );
}

/**
 * WHAT A STREAM COSTS, measured here rather than asserted, because "it feels
 * smooth on my machine" is the claim this exists to replace.
 *
 * ★ THE STATIC HALF IS THE PART THAT CARRIES TO A PHONE. A frame gap counts
 * what the page MISSED; it cannot see how hard the compositor worked to make
 * the frames it hit, and a laptop hits sixty at loads a mid-range phone would
 * not. So the line under the table is the honest half: the layers handed to the
 * compositor and the photographs on screen at the busiest instant, which are the
 * same numbers on any machine. Every stream writes one transform and one opacity
 * per visible card per frame and nothing else: no filter, no blur, and the one
 * shadow rides the element's own transform.
 */
function Cost({
  mode,
  onMeasure,
}: {
  mode: Mode;
  onMeasure: (id: StreamId | null) => void;
}) {
  const statics = STREAM_IDS.map((id) => {
    const f = BUILT[id][mode].facts;
    return `${id} ${f.onScreen} on screen of ${f.layers} nodes`;
  }).join(", ");
  return (
    <CostMeter
      phases={STREAM_IDS.map((id) => ({
        id,
        label: HOME_HERO.candidates.find((c) => c.id === id)?.name ?? id,
        enter: () => onMeasure(id),
        solo: "target",
      }))}
      statics={`At ${CANVAS[mode].w}: ${statics}. One transform and one opacity per lit card per frame, no filter. The three not being measured are stopped, not hidden: hiding one does not stop its loop.`}
    />
  );
}
