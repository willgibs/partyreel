"use client";

import { useMemo, useState } from "react";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  AppliedBadge,
  ApplyToSite,
  BoardPage,
  CANVAS,
  Catalog,
  comparePair,
  Frame,
  FrameRow,
  labScenePath,
  ReplayButton,
  useDesignKey,
  useReplay,
  WalkPages,
  type BoardState,
  type Candidate,
  type Ground,
  type Section,
} from "@/components/lab";
import { withDesignKey } from "@/lib/design-gate/links";
import { env } from "@/lib/env";

import {
  contractCss,
  type EntranceRung,
  type Knobs,
  type LightRung,
  type RadiusRung,
} from "./candidates";
import {
  askOptionLabel,
  blockName,
  WALK,
  type Scene,
  type Sub,
} from "./constants";
import { DIRECTION_META, directionCss, type Direction } from "./directions";
import { FLOATING_SURFACES } from "./spec";

/**
 * THE FLOATING-SURFACES BOARD (round seven, the stepped review, 2026-09-16).
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is left here is
 * what a board should be and nothing else: the evidence for each declared
 * section, as a function of the declared state.
 *
 * ★ A SECTION IS NOW A STEP'S SPECIMEN, AND THAT IS WHY THEY ARE SMALL. The
 * review draws a section ONCE PER OPTION as a tile and again full size on the
 * stage below (`components/lab/step.tsx`), so a section holding four
 * comparisons would be drawn four times over and read as a wall. Round six's
 * one `calls` section (four headings, eleven frames) is four sections here,
 * each ONE menu in whatever state the option being looked at sets: the branch
 * held open or inline, the corner under its loupe, the trio landing, one panel
 * on dark with and without its shadow. The comparison is the tiles.
 *
 * ★ AND THE CATALOG IS ONE PICK. `catalog.mode: "pick-one"` makes the seven
 * cards the winner ask's own options, and `catalog.stage` puts the real product
 * under them: press a card and the dashboard, the phone, the covering family
 * and the guest's drawer all wear it. The any-two comparison round six opened
 * with is folded under that, because a pick is the decision and a comparison is
 * a tool for making it.
 *
 * ★ EVERY SPECIMEN IS A VIEWPORT, NEVER A STAGE, and that is not a preference.
 * Every radix panel portals its content to `globalThis.document.body`: inside a
 * div the panel leaves the ground it is judged on, leaves any zoom, and leaves
 * the canvas (`position: fixed` resolving against the browser, so a "375" bottom
 * sheet spans 1440). A same-origin iframe at the canvas's true pixels is the
 * only honest surface for this family, which is why this board invented the
 * frame and why the kit owns it now: `Frame` carries the gate hold, the adopted
 * candidate sheet, the scroll lock, the blocked banner and the approach mount.
 */

/* ── The frames ────────────────────────────────────────────────────────── */

const SCENE_ROUTE = "/design/sandbox/floating-surfaces";

/** The sections whose frames mount with the board rather than on approach. A
 *  reader meets the first one before they can scroll; every other frame is a
 *  page load that should happen a viewport ahead of the eye, never under it. */
const EAGER = new Set<string>(
  (FLOATING_SURFACES.sections as readonly Section[])
    .filter((s) => s.eager)
    .map((s) => s.id),
);

type ViewportProps = {
  /** Unique on the board; the scroll lock and the reload are keyed on it. */
  id: string;
  scene: Scene;
  title: string;
  caption?: React.ReactNode;
  w: number;
  h: number;
  /** The whole page's state, so a frame is never handed a stale ground. */
  state: BoardState;
  runId: number;
  /** The layer this frame renders. Defaults to the layer as it ships. */
  direction?: Direction;
  /** The nested branch, kept or deleted, when this frame is showing that call. */
  sub?: Sub;
  /** The calls, as CSS, when this frame is showing one of them. */
  knobs?: Knobs;
  /** A ground this frame PINS, when the ground is not the page's. */
  ground?: Ground;
  eager?: boolean;
};

/**
 * ONE SCENE, IN A REAL VIEWPORT.
 *
 * The src carries only what the scene re-renders FOR and nothing else: a change
 * to any of it is a deliberate reload, and a change of layer, ground or branch
 * must never be one (flipping the pick would otherwise reload two dozen
 * documents and lose every panel open in them).
 */
function Viewport({
  id,
  scene,
  title,
  caption,
  w,
  h,
  state,
  runId,
  direction = "today",
  sub,
  knobs,
  ground,
  eager = false,
}: ViewportProps) {
  const key = useDesignKey();
  const pushedSub = (sub ?? state.submenu ?? "keep") as Sub;
  // ★ THE GROUND TRIPLE IS SEEDED ONCE AND NEVER RE-READ. The frame's src is its
  // React key, so a src that moved with the dock would remount the iframe on
  // every flip: the panels would close, the injected candidate would go and the
  // reader would watch two dozen documents reload to change one colour. But it
  // cannot be LEFT OUT either, or the first paint is the app's dark on a cinema
  // board for as long as it takes the parent's effect to push. So: the values as
  // they were when this frame mounted, in the URL, and every change after that
  // by event. A lazy initial state rather than a ref, because a ref read during
  // render is exactly the stale-UI hazard the compiler's rule is about.
  const [seed] = useState(() => ({
    ground: (ground ?? state.ground) as string,
    direction,
  }));
  const src = labScenePath(
    SCENE_ROUTE,
    {
      scene,
      w: w <= 400 ? "375" : "1440",
      ...seed,
      // ★ THE BRANCH RIDES THE SRC, WHICH MEANS IT RELOADS, and that is the
      // right trade for exactly one frame. Keeping or deleting a submenu is
      // MARKUP, so it cannot be a stylesheet; and a page-wide switch that
      // changes ONE frame can afford a reload where the ground, which changes
      // sixteen of them, cannot.
      sub: pushedSub,
      // `pin` tells the frame its ground is the EVIDENCE, so it ignores the
      // board's own URL when it corrects its seed (scene-shell.tsx).
      ...(ground ? { pin: "1" } : {}),
    },
    key ?? null,
  );

  // The paste, built HERE and handed to the frame: the layer's material and
  // whichever call this specimen is about.
  const knobKey = knobs
    ? `${knobs.radius}|${knobs.entrance}|${knobs.light}`
    : "";
  const css = useMemo(
    () =>
      [
        directionCss(direction, "frame"),
        knobs ? contractCss(knobs, "frame") : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    // knobKey is the object's value, so a fresh literal on every render of the
    // board does not rebuild a paste that did not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, knobKey],
  );

  // What the scene renders FROM rather than skins with. `run` is the replay:
  // one number, compared inside the frame, so a press re-opens every panel in
  // every mounted frame with no reload and no second channel.
  const push = useMemo(
    () => ({
      direction,
      ground: (ground ?? state.ground) as string,
      run: String(runId),
    }),
    [direction, ground, state.ground, runId],
  );

  return (
    <Frame
      id={id}
      src={src}
      gated
      w={w}
      h={h}
      css={css}
      push={push}
      title={title}
      caption={caption}
      onApproach={!eager}
    />
  );
}

/* ── The board ─────────────────────────────────────────────────────────── */

const WALK_PAGES = "/, /pricing, /help, /e/<token>, the dashboard";

/** The four real surfaces the pick is worn on, in one row. The desk is the
 *  whole argument; the other three are what makes the layer a FAMILY rather
 *  than a menu, which is what rule 15 is about. */
const SPOTS = [
  {
    id: "desk",
    scene: "desk" as Scene,
    name: "The host's desk, the production dashboard",
    w: CANVAS.desktop.w,
    h: CANVAS.desktop.h,
  },
  {
    id: "pocket",
    scene: "pocket" as Scene,
    name: "The same host on a phone",
    w: CANVAS.phone.w,
    h: CANVAS.phone.h,
  },
  {
    id: "surfaces",
    scene: "surfaces" as Scene,
    name: "A dialog, a tooltip, a toast",
    w: CANVAS.phone.w,
    h: CANVAS.phone.h,
  },
  {
    id: "guest",
    scene: "guest" as Scene,
    name: "The guest's entry drawer",
    w: CANVAS.phone.w,
    h: CANVAS.phone.h,
  },
];

/** A call's specimen is about ONE thing, so it carries one knob and the other
 *  two stay as they ship: a corner tile that also moved the shadow would be two
 *  differences in a comparison the question says is about one. */
const ONE_CALL = (knob: Partial<Knobs>): Knobs => ({
  radius: "off",
  entrance: "off",
  light: "off",
  ...knob,
});

export function FloatingSurfacesBoard() {
  const { runId, replay } = useReplay();
  const demo = env.NEXT_PUBLIC_DEMO_QR_TOKEN;
  const designKey = useDesignKey();

  return (
    <BoardPage
      spec={FLOATING_SURFACES}
      dock={() => (
        <>
          {/* Which block stands on the site, and its clear. Absent until one
              stands, so the dock never carries an empty slot. */}
          <AppliedBadge />
          <ReplayButton runId={runId} onReplay={replay} />
        </>
      )}
      evidence={(id, state, api) => {
        const pick = state.direction as Direction | "none";
        const picked = pick === "none" ? undefined : pick;
        const worn = picked ?? "today";
        const knobs: Knobs = {
          radius: state.radius as RadiusRung | "off",
          entrance: state.entrance as EntranceRung | "off",
          light: state.light === "shadow" ? ("shadow" as LightRung) : "off",
        };
        const shared = { state, runId, eager: EAGER.has(id) } as const;

        switch (id) {
          /* 1 ─ The seven layers: the winner ask's own tiles */
          case "catalog":
            return (
              <Catalog
                spec={FLOATING_SURFACES}
                state={state}
                setState={api.setState}
                // 328 for the menu plus the card's own 12px of padding each
                // side: the frame is the thing being judged, so the card is
                // sized off it rather than the other way round.
                minWidth={352}
                render={(candidate: Candidate) => (
                  <Viewport
                    {...shared}
                    id={`card-${candidate.id}`}
                    scene="menu"
                    direction={candidate.id as Direction}
                    // 328, not 340: three of these plus their gaps have to
                    // clear the lab column at 1440 minus the scrollbar.
                    w={328}
                    h={420}
                    title={candidate.name}
                  />
                )}
              />
            );

          /* 2 ─ The stage: the pick on the real product, any two folded under */
          case "desk": {
            const pair = comparePair(FLOATING_SURFACES, state);
            return (
              <div className="flex flex-col gap-3">
                {/* flt-worn: board.css turns this row around below 640, so a
                    phone meets the three phone canvases first instead of the
                    left third of a 1440 dashboard. */}
                <FrameRow className="flt-worn">
                  {SPOTS.map((spot) => (
                    <Viewport
                      {...shared}
                      key={spot.id}
                      id={`worn-${spot.id}`}
                      scene={spot.scene}
                      direction={worn}
                      w={spot.w}
                      h={spot.h}
                      title={spot.name}
                      caption={
                        picked
                          ? DIRECTION_META[picked].label
                          : "As the site ships"
                      }
                    />
                  ))}
                </FrameRow>
                {/* A pick is the decision; a comparison is a tool for making
                    one, so it is one press away rather than in the way. Its
                    frames mount when the fold opens, never before. */}
                {pair && pair.a.id !== pair.b.id && (
                  <details className="min-w-0">
                    <summary className="w-fit cursor-pointer rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none">
                      Any two, side by side
                    </summary>
                    <div className="mt-3 flex flex-col gap-6">
                      {SPOTS.map((spot) => (
                        <FrameRow key={spot.id}>
                          {[pair.a, pair.b].map((c, i) => (
                            <Viewport
                              {...shared}
                              key={c.id}
                              id={`${spot.id}-${i === 0 ? "a" : "b"}`}
                              scene={spot.scene}
                              direction={c.id as Direction}
                              w={spot.w}
                              h={spot.h}
                              title={`${i === 0 ? "A" : "B"}: ${c.name}`}
                              caption={spot.name}
                            />
                          ))}
                        </FrameRow>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          }

          /* 3 ─ The branch, held open or inline */
          case "branch":
            return (
              <Viewport
                {...shared}
                id="branch"
                scene="sub"
                direction={worn}
                w={560}
                h={360}
                title={askOptionLabel("submenu", state.submenu ?? "keep")}
                caption="Portalled, so it paints at all."
              />
            );

          /* 4 ─ The corner, at six times */
          case "corner":
            return (
              <Viewport
                {...shared}
                id="corner"
                scene="nest"
                direction={worn}
                // Sized off the scaled loupe (scenes.tsx): 500 of drawing plus
                // the scene's own inset, and the real menu standing above it.
                knobs={ONE_CALL({ radius: knobs.radius })}
                w={560}
                h={570}
                title={
                  knobs.radius === "off"
                    ? "As it ships: two different lines"
                    : askOptionLabel("radius", knobs.radius)
                }
              />
            );

          /* 5 ─ How it appears */
          case "appears":
            return (
              // ★ THE REPLAY IS IN THE SECTION, NOT ONLY IN THE DOCK. A step
              // renders no dock (board-page.tsx), and this is the one question
              // whose evidence exists only while it is moving: without a press
              // to re-open them the two options are two identical still
              // pictures. One press re-runs EVERY mounted frame, so the option
              // tiles above land at the same moment as the stage.
              <div className="flex flex-col items-start gap-2">
                <Viewport
                  {...shared}
                  id="appears"
                  scene="trio"
                  direction={worn}
                  knobs={ONE_CALL({ entrance: knobs.entrance })}
                  w={900}
                  h={300}
                  title={
                    knobs.entrance === "off"
                      ? "As it ships: one beat for all three"
                      : askOptionLabel("entrance", knobs.entrance)
                  }
                />
                <ReplayButton runId={runId} onReplay={replay} />
              </div>
            );

          /* 6 ─ The shadow in dark. The layer as it SHIPS, pinned: four of the
                 seven cards already cast, and a specimen wearing one of those
                 would answer this question before it was asked. */
          case "shadow":
            return (
              <Viewport
                {...shared}
                id="shadow"
                scene="menu"
                ground="app-dark"
                knobs={ONE_CALL({ light: knobs.light })}
                w={328}
                h={420}
                title={askOptionLabel("light", state.light ?? "today")}
              />
            );

          /* 7 ─ The real routes, wearing the pick */
          case "pages":
            return (
              <>
                <FrameRow lock={false}>
                  {WALK.filter((w) => w.framed).map((w) => {
                    const href =
                      w.href.startsWith("/e/") && demo ? `/e/${demo}` : w.href;
                    return (
                      <Frame
                        key={w.href}
                        id={`page-${w.href}`}
                        src={withDesignKey(href, designKey ?? null)}
                        w={w.phone ? CANVAS.phone.w : CANVAS.desktop.w}
                        h={w.phone ? CANVAS.phone.h : 760}
                        // The SITE scope, so what this frame shows and what
                        // Apply hands the real site are one string.
                        css={picked ? directionCss(picked, "site") : ""}
                        title={`${href}${picked ? `, wearing ${DIRECTION_META[picked].label}` : ", as built"}`}
                        caption={w.what}
                        onApproach
                      />
                    );
                  })}
                </FrameRow>
                {/* ONE block, not two. The layer and the three calls that are a
                    paste land together, so what a reviewer walks the site in is
                    the whole ruling rather than half of it. */}
                <ApplyToSite
                  block={{
                    label: blockName(knobs, picked ?? "card"),
                    css: [
                      directionCss(picked ?? "card", "site"),
                      contractCss(knobs, "site"),
                    ]
                      .filter(Boolean)
                      .join("\n\n"),
                    what: picked
                      ? `${DIRECTION_META[picked].label}: its material, radius and motion, not its anatomy.`
                      : "Nothing picked, so this is the board's own answer: Card's material, radius and motion.",
                    pages: WALK_PAGES,
                  }}
                />
                <WalkPages pages={FLOATING_SURFACES.links.pages ?? []} />
              </>
            );

          default:
            return null;
        }
      }}
    />
  );
}
