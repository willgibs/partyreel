"use client";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { GROUNDS, type GroundId, groundOf } from "./fixtures";
import {
  BEHIND_COST,
  CONTRAST,
  COST,
  FLAT_COST,
  METHOD,
  ROW_COST,
} from "./measured";
import { type Recipe, recipeLine, recipeOf } from "./recipes";
import { GLASS } from "./spec";
import {
  type Behind,
  GridScene,
  type Grade,
  type Grades,
  LightboxScene,
  type PaperSkin,
  PaperScene,
  ReelScene,
  type ReelSkin,
  type RowShape,
  TilesScene,
} from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is a real app screen at a real
 * viewport, over real photographs.
 *
 * ★ A FRAME, BECAUSE A DIV LIES. Each scene goes in a same-origin iframe, the
 * only 1:1 surface the lab has: a 375 column drawn in a div on a 1440 page
 * resolves every `md:` prefix at the browser's width, so the host's grid would
 * show its desktop row on a phone and the whole tile step would be wrong.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE. Six of the seven
 * decisions wait on the recipe, so each is drawn wearing the one he picked, and
 * the ground knob every one of them shares swaps the photograph underneath.
 * Going back to the recipe after answering a later step redraws it in the world
 * he chose rather than in the one the board assumed.
 *
 * ★ THE CAPTION UNDER A FRAME IS MEASURED (measured.ts). The words above a
 * frame say what an option is; the caption says what it did on a browser. If
 * they ever disagree, the caption is the truth.
 */

type Look = { recipe: Recipe; ground: GroundId };

const look = (s: BoardState): Look => ({
  recipe: recipeOf(s.recipe),
  ground: groundOf(s.ground),
});

const gradesOf = (v: string | undefined): Grades =>
  v === "one" ? "one" : "two";

/* ── the captions ─────────────────────────────────────────────────────────── */

/** The recipe in its numbers, what its text measured on this ground, and the
 *  cost of wearing it on a phone's worth of tiles. */
function pillCaption(r: Recipe, g: GroundId): string {
  const [mean, worst] = CONTRAST[r.id][g];
  return `${recipeLine(r)} · over ${GROUNDS[g].label.toLowerCase()} photograph in the set (mean luminance ${GROUNDS[g].luma} of 255) its white text reads ${mean}:1, and ${worst}:1 on its worst twelfth · ${COST[r.id].full}ms of compositor work a scroll against ${FLAT_COST}ms with no filter · ${METHOD}`;
}

/* ── the previews ─────────────────────────────────────────────────────────── */

function Lightbox({
  s,
  recipe,
  grades,
  behind,
  note,
}: {
  s: BoardState;
  recipe?: Recipe;
  grades?: Grades;
  behind?: Behind;
  note?: string;
}) {
  const l = look(s);
  const r = recipe ?? l.recipe;
  return (
    <Frame
      id={`gl-lb-${r.id}-${l.ground}-${grades ?? gradesOf(s.grades)}-${behind ?? "wall"}`}
      w={1440}
      h={900}
      title="The lightbox, 1440"
      caption={note ?? pillCaption(r, l.ground)}
    >
      <LightboxScene
        recipe={r}
        ground={l.ground}
        grades={grades ?? gradesOf(s.grades)}
        behind={behind ?? (s.behind as Behind) ?? "wall"}
      />
    </Frame>
  );
}

function Phone({
  id,
  title,
  caption,
  children,
}: {
  id: string;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <Frame id={id} w={375} h={812} title={title} caption={caption}>
      {children}
    </Frame>
  );
}

const PREVIEWS: PreviewsFor<typeof GLASS> = {
  /* 1. the recipe, on the pill he presses.
     ★ OVER TODAY'S WALL, NOT OVER THE BOARD'S OWN PROPOSAL. Every preview
     wears the board's state, and a control he has not reached yet sits at its
     recommendation, so the first capture of this step drew the material
     decision over the blurred album the LATER step proposes. A step asks one
     thing: the recipe and the grades are judged against the lightbox as it
     ships, and `behind` is the step that changes what is under it. */
  "recipe.today": (s) => (
    <Lightbox s={s} recipe={recipeOf("today")} behind="wall" />
  ),
  "recipe.veil": (s) => (
    <Lightbox s={s} recipe={recipeOf("veil")} behind="wall" />
  ),
  "recipe.frost": (s) => (
    <Lightbox s={s} recipe={recipeOf("frost")} behind="wall" />
  ),
  "recipe.crystal": (s) => (
    <Lightbox s={s} recipe={recipeOf("crystal")} behind="wall" />
  ),

  /* 2. one grade or two, on the same screen */
  "grades.two": (s) => (
    <Lightbox
      s={s}
      grades="two"
      behind="wall"
      note={`The action pill at the full recipe; the attribution pill, the close and the arrows at half its blur with no edges. ${COST[look(s).recipe.id].quiet}ms a scroll against ${COST[look(s).recipe.id].full}ms.`}
    />
  ),
  "grades.one": (s) => (
    <Lightbox
      s={s}
      grades="one"
      behind="wall"
      note={`Every surface at the full recipe: ${recipeLine(look(s).recipe)}. ${COST[look(s).recipe.id].full}ms a scroll. ${METHOD}`}
    />
  ),

  /* 3. what sits behind the photograph */
  "behind.album": (s) => (
    <Lightbox
      s={s}
      behind="album"
      note={`One full-screen pane: a 28px blur at half brightness over the real album. ${BEHIND_COST.album}ms a scroll against the wall's ${BEHIND_COST.wall}ms, and a seventh of what the tile chips already pay.`}
    />
  ),
  "behind.dim": (s) => (
    <Lightbox
      s={s}
      behind="dim"
      note={`The same pane at 28 percent brightness. ${BEHIND_COST.dim}ms a scroll; the album is a texture and the photograph keeps the room.`}
    />
  ),
  "behind.wall": (s) => (
    <Lightbox
      s={s}
      behind="wall"
      note={`Today: a 90 percent black over the album, no filter at all. ${BEHIND_COST.wall}ms a scroll, and the album is gone.`}
    />
  ),

  /* 4. the chips over tiles, at a phone */
  "tiles.quiet": (s) => (
    <Phone
      id={`gl-tiles-quiet-${look(s).recipe.id}`}
      title="The host's grid, 375"
      caption={`Half the recipe's blur, no edges: ${COST[look(s).recipe.id].quiet}ms of compositor work over a 3s scroll, against ${FLAT_COST}ms with no filter. ${METHOD}`}
    >
      <TilesScene recipe={look(s).recipe} grade={"quiet" satisfies Grade} />
    </Phone>
  ),
  "tiles.full": (s) => (
    <Phone
      id={`gl-tiles-full-${look(s).recipe.id}`}
      title="The host's grid, 375"
      caption={`The full recipe on every chip: ${COST[look(s).recipe.id].full}ms over the same scroll, against ${FLAT_COST}ms with no filter. ${METHOD}`}
    >
      <TilesScene recipe={look(s).recipe} grade={"full" satisfies Grade} />
    </Phone>
  ),
  "tiles.flat": (s) => (
    <Phone
      id={`gl-tiles-flat-${look(s).recipe.id}`}
      title="The host's grid, 375"
      caption={`A 50 percent black and no backdrop filter: ${FLAT_COST}ms over the same scroll, about seventeen times less than any glass. ${METHOD}`}
    >
      <TilesScene recipe={look(s).recipe} grade={"flat" satisfies Grade} />
    </Phone>
  ),

  /* 5. the reel's controls, over a playing reel */
  "reel.dark": (s) => (
    <Phone
      id={`gl-reel-dark-${look(s).recipe.id}`}
      title="The reel, 375"
      caption={`The recipe as everywhere else: ${recipeLine(look(s).recipe)}. The reel plays under it, and rests on its poster under reduced motion.`}
    >
      <ReelScene recipe={look(s).recipe} skin={"dark" satisfies ReelSkin} />
    </Phone>
  ),
  "reel.white": (s) => (
    <Phone
      id={`gl-reel-white-${look(s).recipe.id}`}
      title="The reel, 375"
      caption="Today's material at the new blur: a white tint over a lightened backdrop, so the pane lifts the reel rather than sinking it."
    >
      <ReelScene recipe={look(s).recipe} skin={"white" satisfies ReelSkin} />
    </Phone>
  ),
  "reel.flat": (s) => (
    <Phone
      id={`gl-reel-flat-${look(s).recipe.id}`}
      title="The reel, 375"
      caption="Today exactly: a 12 percent white with no filter. Nothing is filtered over a backdrop that moves every frame, which is the cheapest a reel can be."
    >
      <ReelScene recipe={look(s).recipe} skin={"flat" satisfies ReelSkin} />
    </Phone>
  ),

  /* 6. the host's row: three panes or one */
  "row.bar": (s) => (
    <Frame
      id={`gl-row-bar-${look(s).recipe.id}`}
      w={1440}
      h={900}
      title="The host's gallery, 1440"
      caption={`One pane per tile holding three glyphs: ${ROW_COST.bar}ms of compositor work over a scroll of this grid, against ${ROW_COST.chips}ms for three separate panes. ${METHOD}`}
    >
      <GridScene recipe={look(s).recipe} shape={"bar" satisfies RowShape} />
    </Frame>
  ),
  "row.chips": (s) => (
    <Frame
      id={`gl-row-chips-${look(s).recipe.id}`}
      w={1440}
      h={900}
      title="The host's gallery, 1440"
      caption={`Three panes per tile, the shipped shape in the new material: ${ROW_COST.chips}ms over the same scroll. ${METHOD}`}
    >
      <GridScene recipe={look(s).recipe} shape={"chips" satisfies RowShape} />
    </Frame>
  ),
  "row.today": (s) => (
    <Frame
      id={`gl-row-today-${look(s).recipe.id}`}
      w={1440}
      h={900}
      title="The host's gallery, 1440"
      caption="The shipped row untouched: three chips at 40 percent black with an 8px blur, so the grid is the one surface that does not join the system."
    >
      <GridScene recipe={look(s).recipe} shape={"today" satisfies RowShape} />
    </Frame>
  ),

  /* 7. the light ground, asked on its own */
  "paper.dark": (s) => (
    <Frame
      id={`gl-paper-dark-${look(s).recipe.id}`}
      w={1440}
      h={900}
      title="The dashboard on paper, 1440"
      caption={`The dark recipe, unchanged by the theme: ${recipeLine(look(s).recipe)}. The covers run darkest to brightest so the pane is judged on all three.`}
    >
      <PaperScene recipe={look(s).recipe} skin={"dark" satisfies PaperSkin} />
    </Frame>
  ),
  "paper.paper": (s) => (
    <Frame
      id={`gl-paper-paper-${look(s).recipe.id}`}
      w={1440}
      h={900}
      title="The dashboard on paper, 1440"
      caption="A white tint over a brightened backdrop, with ink glyphs and an ink hairline. The same recipe's blur and saturation, its direction reversed."
    >
      <PaperScene recipe={look(s).recipe} skin={"paper" satisfies PaperSkin} />
    </Frame>
  ),
  "paper.edge": (s) => (
    <Frame
      id={`gl-paper-edge-${look(s).recipe.id}`}
      w={1440}
      h={900}
      title="The dashboard on paper, 1440"
      caption="The dark material with its highlight taken to 34 percent and a hairline all round, so a dark pane still separates from a pale photograph on a pale page."
    >
      <PaperScene recipe={look(s).recipe} skin={"edge" satisfies PaperSkin} />
    </Frame>
  ),
};

export function GlassBoard() {
  return <ExplorationBoard spec={GLASS} previews={PREVIEWS} />;
}
