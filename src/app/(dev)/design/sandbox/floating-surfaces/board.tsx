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
  CellLabel,
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
  rungCss,
  type EntranceRung,
  type Knobs,
  type LightRung,
  type RadiusRung,
} from "./candidates";
import {
  askOptionLabel,
  contractName,
  RUNGS,
  WALK,
  type Scene,
  type Sub,
} from "./constants";
import {
  DIRECTION_META,
  directionCss,
  directionLabel,
  type Direction,
} from "./directions";
import { FLOATING_SURFACES } from "./spec";

/**
 * THE FLOATING-SURFACES BOARD (round six, the revamp, 2026-09-16).
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is left here is
 * what a board should be and nothing else: the evidence for each declared
 * section, as a function of the declared state.
 *
 * ★ THE ROUND IS A CATALOG, AND THE GRID IS THE BOARD. Round five's twelve
 * sections were a paper with pictures in it: four answers side by side, then
 * the desk, then the submenu, then the phone, then the family, then glass's
 * cost, then the directions as cards, then three ladders, then the outliers.
 * Seven of those were a comparison of the same seven things on a different
 * surface, which is what a page-wide switch is for. So: one grid of seven
 * cards, one comparison of any two on real surfaces, the four calls that are
 * not a card, and the real routes wearing the pick.
 *
 * ★ EVERY SPECIMEN IS A VIEWPORT, NEVER A STAGE, and that is not a preference.
 * Every radix panel portals its content to `globalThis.document.body`: inside a
 * div the panel leaves the ground it is judged on, leaves any zoom, and leaves
 * the canvas (`position: fixed` resolving against the browser, so a "375" bottom
 * sheet spans 1440). A same-origin iframe at the canvas's true pixels is the
 * only honest surface for this family, which is why this board invented the
 * frame and why the kit owns it now: `Frame` carries the gate hold, the adopted
 * candidate sheet, the scroll lock, the blocked banner and the approach mount.
 *
 * ★ AND THE COMPARISONS DO NOT USE `CompareTwo`, WHICH IS DELIBERATE. Its
 * `side` mode is a grid of `minmax(0, 1fr)` columns, and a Frame is a fixed
 * width that will not shrink: a 1440 frame in a 1fr column runs straight past
 * the lab's content column at 1:1, which is the exact fault the round-five
 * sweep found and the shell now clips at the window edge. `FrameRow` is the
 * kit's own answer (a bleed, then a sideways scroll), so the pair is drawn in
 * one of those with `comparePair` naming the two cards.
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
  /** The three calls, as CSS, when this frame is showing them. */
  knobs?: Knobs;
  /** Candidate classes this frame's panels wear (a ladder holds several). */
  rungs?: readonly string[];
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
  rungs = [],
  ground,
  eager = false,
}: ViewportProps) {
  const key = useDesignKey();
  const rungKey = rungs.join(",");
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
      ...(rungs.length === 1 ? { rung: rungs[0] } : {}),
      ...(scene === "ladder" ? { dim: "light" } : {}),
      // `pin` tells the frame its ground is the EVIDENCE, so it ignores the
      // board's own URL when it corrects its seed (scene-shell.tsx).
      ...(ground ? { pin: "1" } : {}),
    },
    key ?? null,
  );

  // The paste, built HERE and handed to the frame: the layer's material, the
  // calls, and any panel-scoped rung the scene needs, all at once.
  const css = useMemo(
    () =>
      [
        directionCss(direction, "frame"),
        knobs ? contractCss(knobs, "frame") : "",
        ...rungKey.split(",").filter(Boolean).map(rungCss),
      ]
        .filter(Boolean)
        .join("\n\n"),
    [direction, knobs, rungKey],
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

/** A ladder asks for exactly the width its rungs need and renders at those
 *  pixels: judging a 6px corner against a 12px one at half scale judges the
 *  scale. Kept above 768 so `sm:` still resolves desktop-side inside the frame. */
const ladderWidth = (rungs: number) => Math.max(800, rungs * 230);

const WALK_PAGES = "/, /pricing, /help, /e/<token>, the dashboard";

/** The four real surfaces any two cards are compared on. The desk is the whole
 *  argument; the other three are what makes the layer a FAMILY rather than a
 *  menu, which is what rule 15 is about. */
const SPOTS = [
  {
    id: "desk",
    scene: "desk" as Scene,
    name: "The host's desk, the production dashboard at 1440",
    note: "Three panels at once on the real shell, chips and event cards.",
    w: CANVAS.desktop.w,
    h: CANVAS.desktop.h,
  },
  {
    id: "pocket",
    scene: "pocket" as Scene,
    name: "The same host on a phone",
    note: "Command answers 375 as a bottom sheet, on purpose.",
    w: CANVAS.phone.w,
    h: CANVAS.phone.h,
  },
  {
    id: "surfaces",
    scene: "surfaces" as Scene,
    name: "The covering family: a dialog, a tooltip, a toast",
    note: "A layer that only answers the menu is half an answer.",
    w: CANVAS.phone.w,
    h: CANVAS.phone.h,
  },
  {
    id: "guest",
    scene: "guest" as Scene,
    name: "The guest's entry drawer, the real EntryShell",
    note: "The tenth surface, and the first thing anyone sees after the QR.",
    w: CANVAS.phone.w,
    h: CANVAS.phone.h,
  },
];

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
        const knobs: Knobs = {
          radius: state.radius as RadiusRung | "off",
          entrance: state.entrance as EntranceRung | "off",
          light: state.light === "shadow" ? ("shadow" as LightRung) : "off",
        };
        const shared = { state, runId, eager: EAGER.has(id) } as const;

        switch (id) {
          /* 1 ─ The seven layers */
          case "catalog":
            return (
              <>
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
                <CellLabel className="max-w-2xl">
                  Pick drives the page, so the real routes at the foot wear the
                  card you press; A and B set the comparison under this. Ground
                  moves all seven onto another surface at once.
                </CellLabel>
              </>
            );

          /* 2 ─ Any two, on the host's desk and the rest of the family */
          case "desk": {
            const pair = comparePair(FLOATING_SURFACES, state);
            if (!pair) return null;
            const { a, b } = pair;
            if (a.id === b.id) {
              return (
                <CellLabel className="max-w-2xl">
                  A and B are both {a.name}, so both halves would be the same
                  thing. Press B on another card in the catalog and the seam
                  comes back.
                </CellLabel>
              );
            }
            return (
              <div className="flex flex-col gap-8">
                {SPOTS.map((spot) => (
                  <section key={spot.id} className="flex min-w-0 flex-col gap-2">
                    <div>
                      <h3 className="text-sm font-medium">{spot.name}</h3>
                      <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                        {spot.note}
                      </p>
                    </div>
                    <FrameRow>
                      {[a, b].map((c, i) => (
                        <Viewport
                          {...shared}
                          key={c.id}
                          id={`${spot.id}-${i === 0 ? "a" : "b"}`}
                          scene={spot.scene}
                          direction={c.id as Direction}
                          w={spot.w}
                          h={spot.h}
                          title={`${i === 0 ? "A" : "B"}: ${c.name}`}
                          // No caption: the card upstairs carries the line, and
                          // eight of them here would be the paper again.
                          caption={null}
                        />
                      ))}
                    </FrameRow>
                  </section>
                ))}
              </div>
            );
          }

          /* 3 ─ The four calls that are not a card */
          case "calls":
            return (
              <div className="flex flex-col gap-8">
                <Call
                  title="The nested menu, and the bug inside it"
                  note="Open the avatar on the left, hover Theme, and nothing paints."
                >
                  <FrameRow lock={false}>
                    <Viewport
                      {...shared}
                      id="sub-real"
                      scene="real"
                      w={420}
                      h={360}
                      title="The account menu, as it ships"
                      caption="app/user-menu.tsx, untouched."
                    />
                    <Viewport
                      {...shared}
                      id="sub-branch"
                      scene="sub"
                      direction={picked ?? "card"}
                      w={560}
                      h={360}
                      title={askOptionLabel("submenu", state.submenu ?? "keep")}
                      caption="Portalled, so it paints at all."
                    />
                  </FrameRow>
                </Call>

                <Call
                  title="The corner, measured at six times"
                  note="Outer arc the panel, inner arc the lit row, dashed arc where the row has to sit."
                >
                  <FrameRow lock={false}>
                    {RUNGS.radius.map((r) => (
                      <Viewport
                        {...shared}
                        key={r.label}
                        id={`corner-${r.label}`}
                        scene="nest"
                        rungs={r.id ? [r.id] : []}
                        w={236}
                        h={330}
                        title={r.label}
                        caption={
                          r.id ? "One line." : "As it ships: two different lines."
                        }
                      />
                    ))}
                  </FrameRow>
                </Call>

                <Call
                  title="How it appears: two rules disagree"
                  note="One rule per frame, on the same three surfaces. Press Replay: the difference is the tooltip."
                >
                  <FrameRow lock={false}>
                    {(["one-clock", "by-frequency"] as const).map((e) => (
                      <Viewport
                        {...shared}
                        key={e}
                        id={`entrance-${e}`}
                        scene="trio"
                        rungs={[`flt-e-${e}`]}
                        w={900}
                        h={300}
                        title={askOptionLabel("entrance", e)}
                        caption={
                          e === "one-clock"
                            ? "Rule 15, literally: one beat for all three."
                            : "Rule 12, literally: 90ms for the first two."
                        }
                      />
                    ))}
                  </FrameRow>
                </Call>

                <Call
                  title="The shadow in dark"
                  note="The same panel twice on the app's own dark. Nothing casts there today."
                >
                  <FrameRow lock={false}>
                    <Viewport
                      {...shared}
                      id="light-ladder"
                      scene="ladder"
                      ground="app-dark"
                      rungs={RUNGS.light.map((r) => r.id).filter(Boolean)}
                      w={ladderWidth(RUNGS.light.length)}
                      h={300}
                      title="No shadow, and a soft shadow"
                      caption="The two options, one ground."
                    />
                  </FrameRow>
                </Call>

                <ApplyToSite
                  block={{
                    label: contractName(knobs),
                    css: contractCss(knobs, "site"),
                    what: "The three calls that are a paste, as the dock has them.",
                    pages: WALK_PAGES,
                  }}
                />
              </div>
            );

          /* 4 ─ The real routes, wearing the pick */
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
                <ApplyToSite
                  block={{
                    label: directionLabel(picked ?? "card"),
                    css: directionCss(picked ?? "card", "site"),
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

/* ── The parts only this board has ─────────────────────────────────────── */

/** One of the four calls: a heading, the one line that says what to read, and
 *  its evidence. Four of these instead of four sections, because they are four
 *  answers to one question ("what is still open once a layer is picked") and a
 *  section each would put three screens of chrome between them. */
function Call({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      </div>
      {children}
    </section>
  );
}
