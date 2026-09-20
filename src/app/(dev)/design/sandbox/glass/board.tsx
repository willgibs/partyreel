"use client";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { GROUNDS, type GroundId, groundOf } from "./fixtures";
import {
  ACTIVE,
  CONTRAST,
  COST,
  COST_METHOD,
  EDGE_LIP,
  EDGE_SEEN,
  FLAT_COST,
  type MaterialId,
  METHOD,
  REEL_READ,
} from "./measured";
import {
  type EdgeId,
  edgeLine,
  edgeOf,
  type Recipe,
  recipeLine,
  recipeOf,
  withEdge,
} from "./recipes";
import { GLASS } from "./spec";
import { MaterialSheet, SHEET, type ScreenId, screenOf } from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: one frame per option, holding all six glass
 * surfaces at 1:1 over real photographs.
 *
 * ★ A FRAME, BECAUSE A DIV LIES. Each sheet goes in a same-origin iframe, the
 * only 1:1 surface the lab has: a 375 column drawn in a div on a 1440 page
 * resolves every `md:` prefix at the browser's width, so the host's grid would
 * show its desktop row on a phone and the mobile card's marks would be judged
 * on the wrong shape.
 *
 * ★ NO `tile` DECLARATION, AND THAT IS THE INSTRUMENT. Without one the step
 * arranges its options as a FLIP: three materials appearing in exactly the same
 * position, one after another. For a question about a material that is worth
 * more than three tiles side by side, because a 12 percent tint moving to white
 * is invisible at a glance across a gutter and unmissable in place.
 *
 * ★ THE SECOND DECISION IS DRAWN ON THE FIRST ONE'S ANSWER. `edge` is staged
 * behind `material`, so its options wear whichever body he picked: Frost's
 * darkness with Crystal's double edge is a real frame rather than a sentence.
 *
 * ★ THE CAPTION UNDER A FRAME IS MEASURED (measured.ts). The words above a
 * frame say what an option is; the caption says what it did on a browser. If
 * they ever disagree, the caption is the truth.
 */

type Look = { recipe: Recipe; ground: GroundId; screen: ScreenId };

const look = (s: BoardState): Look => ({
  recipe: recipeOf(s.material),
  ground: groundOf(s.ground),
  screen: screenOf(s.screen),
});

/** The three bodies carry measurements of their own; `today` is only a floor. */
const idOf = (r: Recipe): MaterialId =>
  r.id === "crystal" || r.id === "white" ? r.id : "frost";

/* ── the captions ─────────────────────────────────────────────────────────── */

/**
 * The material in its numbers, what its white text and its ACTIVE mark measured
 * on this photograph, what the reel's own pane measured, and what a phone's
 * worth of marks costs to scroll. Four clauses, each one a reading rather than
 * a claim.
 */
function materialCaption(r: Recipe, g: GroundId): string {
  const id = idOf(r);
  const [, text] = CONTRAST[id][g];
  const [, active] = ACTIVE[id][g];
  const ground = GROUNDS[g];
  return `${recipeLine(r)} · over the ${ground.short} photograph in the set (mean luminance ${ground.luma} of 255) the action pill's white text reads ${text}:1 on its worst twelfth, the rose active mark on a card reads ${active}:1, and the reel's own pane ${REEL_READ[id]}:1 · ${COST[id]}ms of compositor work over a 3s phone scroll against ${FLAT_COST}ms with no filter, and the three materials are within a millisecond of each other · ${METHOD}; ${COST_METHOD}`;
}

/** The edge in its numbers, and how much of the pane's outline you can see. */
function edgeCaption(r: Recipe, e: EdgeId, g: GroundId): string {
  const id = idOf(r);
  const seen = EDGE_SEEN[id][e][g];
  const lip = EDGE_LIP[id][e];
  const ground = GROUNDS[g];
  const highlight =
    e === "none"
      ? "no highlight at all, so the pane separates by its body alone"
      : `the lip stands ${lip} off the pane's own interior on 0 to 255`;
  return `${r.name} with ${edgeLine(e)} · ${highlight}, and ${seen} percent of its outline stands clear of the ${ground.short} photograph behind it · an inset shadow is not a filter, so this decision costs nothing: ${COST[id]}ms a scroll whichever you pick · ${METHOD}`;
}

/* ── the previews ─────────────────────────────────────────────────────────── */

function Sheet({
  s,
  recipe,
  caption,
  tag,
}: {
  s: BoardState;
  recipe: Recipe;
  caption: string;
  tag: string;
}) {
  const l = look(s);
  const { w, h } = SHEET[l.screen];
  return (
    <Frame
      id={`gl-${tag}-${recipe.id}-${recipe.edge}-${recipe.ring}-${l.ground}-${l.screen}`}
      w={w}
      h={h}
      title={
        l.screen === "375"
          ? "Six surfaces, one material, 375"
          : "Six surfaces, one material, 1440"
      }
      caption={caption}
    >
      <MaterialSheet recipe={recipe} ground={l.ground} screen={l.screen} />
    </Frame>
  );
}

function material(s: BoardState, id: "frost" | "crystal" | "white") {
  const r = recipeOf(id);
  return (
    <Sheet
      s={s}
      recipe={r}
      tag="mat"
      caption={materialCaption(r, groundOf(s.ground))}
    />
  );
}

function edge(s: BoardState, e: EdgeId) {
  // The body he picked, wearing this edge: the step hands us the board's state
  // with every decided answer worn, so `material` is his answer by the time
  // this question is open.
  const base = recipeOf(s.material);
  const r = withEdge(base, e);
  return (
    <Sheet
      s={s}
      recipe={r}
      tag="edge"
      caption={edgeCaption(base, e, groundOf(s.ground))}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof GLASS> = {
  /* 1. the one material, on all six surfaces at once */
  "material.frost": (s) => material(s, "frost"),
  "material.crystal": (s) => material(s, "crystal"),
  "material.white": (s) => material(s, "white"),

  /* 2. its edge, on the body he picked */
  "edge.lip": (s) => edge(s, edgeOf("lip")),
  "edge.double": (s) => edge(s, edgeOf("double")),
  "edge.none": (s) => edge(s, edgeOf("none")),
};

export function GlassBoard() {
  return <ExplorationBoard spec={GLASS} previews={PREVIEWS} />;
}
