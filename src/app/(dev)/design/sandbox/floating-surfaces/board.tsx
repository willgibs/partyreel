"use client";

import { useMemo, useState } from "react";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  AppliedBadge,
  ApplyToSite,
  BoardPage,
  CANVAS,
  CellLabel,
  ConceptCard,
  Frame,
  FrameRow,
  Knob,
  labScenePath,
  ReplayButton,
  Toggle,
  useDesignKey,
  useReplay,
  WalkPages,
  type BoardState,
  type Ground,
  type Section,
} from "@/components/lab";
import { withDesignKey } from "@/lib/design-gate/links";
import { env } from "@/lib/env";

import { BIBLE } from "../../rules/bible";
import {
  contractCss,
  contractLabel,
  REDUCED_MOTION_CSS,
  rungCss,
  type EntranceRung,
  type Knobs,
  type LightRung,
  type RadiusRung,
} from "./candidates";
import { RUNGS, WALK, type Ramp, type Scene, type Side } from "./constants";
import {
  DIRECTION_META,
  directionCss,
  directionLabel,
  type Direction,
} from "./directions";
import { FLOATING_SURFACES } from "./spec";

/**
 * THE FLOATING-SURFACES BOARD (round four's argument, on the kit's template
 * since the migration wave, 2026-09-15).
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the verdict, the five one-word calls, the candidates, the departures and the
 * twelve sections with their ledes. What is left here is what a board should be
 * and nothing else: the evidence for each declared section, as a function of the
 * declared state.
 *
 * ★ THE DOCK IS HOME GROUND FOR THIS BOARD. Its own sticky bar was the model
 * Will named ("a great example of how the fixed/sticky configurator works") and
 * the shell generalised it; what the migration adds is that the six switches are
 * DECLARED (spec.controls) rather than seven `useState` calls the URL never saw.
 * A review note is a link now: `?direction=glass&ground=app-light` plus the
 * section's anchor reopens the exact comparison it was written about, and the
 * walk's steps set that state rather than describing it in prose nobody executes.
 *
 * ★ EVERY SPECIMEN IS A VIEWPORT, NEVER A STAGE, and that is not a preference.
 * Every radix panel portals its content to `globalThis.document.body`: inside a
 * div the panel leaves the ground it is judged on, leaves any zoom, and leaves
 * the canvas (`position: fixed` resolving against the browser, so a "375" bottom
 * sheet spans 1440). A same-origin iframe at the canvas's true pixels is the
 * only honest surface for this family, which is why this board invented the
 * frame and why the kit owns it now: `Frame` carries the gate hold, the adopted
 * candidate sheet, the scroll lock, the blocked banner and the approach mount,
 * with every landmine written down once in `traps.ts`.
 *
 * ★ THE CANDIDATE GOES IN FROM THE PARENT NOW. Round four built the CSS inside
 * the frame document out of six URL params; the kit's `Frame` writes it into the
 * frame's own realm as an adopted stylesheet instead, so what a section renders
 * and what its Apply button pastes are one string built in one place. Only what
 * the scene RENDERS differently still travels: the direction (an anatomy, not a
 * paste), the ground, the ramp and the replay ride `lab:set`, which the scene
 * owns because next-themes lives in that document too and puts `dark` back after
 * anything else writes the class list.
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
  /** The anatomy this frame renders. Defaults to the layer as it ships. */
  direction?: Direction;
  /** The three knobs, as CSS, when this frame is showing them. */
  knobs?: Knobs;
  /** Candidate classes this frame's panels wear (a ladder holds several). */
  rungs?: readonly string[];
  dim?: string;
  variant?: "sheet" | "drawer";
  side?: Side;
  /** A ground this frame PINS, when the ground is the comparison. */
  ground?: Ground;
  eager?: boolean;
};

/**
 * ONE SCENE, IN A REAL VIEWPORT.
 *
 * The src carries only what the scene re-renders FOR and nothing else: a change
 * to any of it is a deliberate reload, and a change of direction, ground or ramp
 * must never be one (flipping the direction would otherwise reload twenty-four
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
  knobs,
  rungs = [],
  dim,
  variant,
  side,
  ground,
  eager = false,
}: ViewportProps) {
  const key = useDesignKey();
  const rungKey = rungs.join(",");
  // ★ THE GROUND TRIPLE IS SEEDED ONCE AND NEVER RE-READ. The frame's src is its
  // React key, so a src that moved with the dock would remount the iframe on
  // every flip: the panels would close, the injected candidate would go and the
  // reader would watch two dozen documents reload to change one colour. But it
  // cannot be LEFT OUT either, or the first paint is cinema on a paper board for
  // as long as it takes the parent's effect to push. So: the values as they were
  // when this frame mounted, in the URL, and every change after that by event.
  // A lazy initial state rather than a ref, because a ref read during render is
  // exactly the stale-UI hazard the compiler's rule is about: this value is
  // rendered (it is half the src), and state that is initialised once says so.
  const [seed] = useState(() => ({
    ground: (ground ?? state.ground) as string,
    ramp: state.ramp as string,
    direction,
  }));
  const src = labScenePath(
    SCENE_ROUTE,
    {
      scene,
      w: w <= 400 ? "375" : "1440",
      ...seed,
      ...(dim ? { dim } : {}),
      ...(variant ? { variant } : {}),
      ...(side ? { side } : {}),
      ...(rungs.length === 1 ? { rung: rungs[0] } : {}),
    },
    key ?? null,
  );

  // The paste, built HERE and handed to the frame: the direction's material,
  // the knobs, and any panel-scoped rung the scene needs, all at once.
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
      ramp: state.ramp as string,
      run: String(runId),
    }),
    [direction, ground, state.ground, state.ramp, runId],
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

function rule(n: number): string {
  return BIBLE.find((r) => r.n === n)?.statement ?? "";
}

type Outlier = "select" | "sheet" | "drawer";

/** A ladder asks for exactly the width its rungs need and renders at those
 *  pixels: judging a 6px corner against a 12px one at half scale judges the
 *  scale. Kept above 768 so `sm:` still resolves desktop-side inside the frame. */
const ladderWidth = (rungs: number) => Math.max(800, rungs * 230);

const WALK_PAGES = "/, /pricing, /help, /contact, the dashboard";

export function FloatingSurfacesBoard() {
  const { runId, replay } = useReplay();
  // Not declared, and deliberately: the outlier picks which ONE section's three
  // frames are drawn, so by the dock's own rule it belongs beside that section
  // rather than in the dock, and it has no business in a shared link.
  const [outlier, setOutlier] = useState<Outlier>("select");
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
      evidence={(id, state) => {
        const direction = state.direction as Direction;
        const ramp = state.ramp as Ramp;
        const meta = DIRECTION_META[direction];
        const knobs: Knobs = {
          radius: state.radius as RadiusRung | "off",
          entrance: state.entrance as EntranceRung | "off",
          light: state.light as LightRung | "off",
        };
        const shared = { state, runId, eager: EAGER.has(id) } as const;

        switch (id) {
          /* 1 ─ The host's desk, at 1440 */
          case "desk":
            return (
              <>
                <DirectionPanel direction={direction} />
                <FrameRow lock={false}>
                  <Viewport
                    {...shared}
                    id="desk"
                    scene="desk"
                    direction={direction}
                    w={CANVAS.desktop.w}
                    h={CANVAS.desktop.h}
                    title={`The host's desk, ${meta.label.toLowerCase()}`}
                    caption="The header's panel, the event's actions menu and the account menu open together, with the tooltip beside them. Flip the direction on the dock and the whole desk answers."
                  />
                </FrameRow>
              </>
            );

          /* 2 ─ The four answers, side by side */
          case "answers":
            return (
              <FrameRow lock={false}>
                {(["today", "card", "glass", "command"] as const).map((d) => (
                  <Viewport
                    {...shared}
                    key={d}
                    id={`answer-${d}`}
                    scene="menu"
                    direction={d}
                    // 328, not 340: four of these plus their gaps have to clear
                    // the lab column at 1440 minus the vertical scrollbar, and
                    // at 340 the fourth answer wrapped onto a second line and
                    // turned a four-way comparison into a three-way one.
                    w={328}
                    h={420}
                    title={`${DIRECTION_META[d].label}${d === direction ? ", on the dock now" : ""}`}
                    caption={DIRECTION_META[d].oneLine}
                  />
                ))}
              </FrameRow>
            );

          /* 3 ─ The nested branch, kept and deleted */
          case "submenu":
            return (
              <FrameRow lock={false}>
                <Viewport
                  {...shared}
                  id="sub-card"
                  scene="sub"
                  direction="card"
                  w={680}
                  h={380}
                  title="Card: the submenu, done properly"
                  caption="The best version of the tree, and it only exists here because this board wraps it in a portal: shipped, a submenu paints nothing at all."
                />
                <Viewport
                  {...shared}
                  id="sub-command"
                  scene="sub"
                  direction="command"
                  w={680}
                  h={380}
                  title="Command: no submenu, two letters typed"
                  caption="The same three values as a group in the one list. The recommendation takes this idea into card's anatomy."
                />
              </FrameRow>
            );

          /* 4 ─ The phone */
          case "phone":
            return (
              <FrameRow lock={false}>
                <Viewport
                  {...shared}
                  id="pocket"
                  scene="pocket"
                  direction={direction}
                  w={CANVAS.phone.w}
                  h={CANVAS.phone.h}
                  title={`The host's phone, ${meta.label.toLowerCase()}`}
                  caption="Command answers 375 differently on purpose: a field with no keyboard is a bottom sheet with big rows."
                />
                <Viewport
                  {...shared}
                  id="guest"
                  scene="guest"
                  direction={direction}
                  w={CANVAS.phone.w}
                  h={CANVAS.phone.h}
                  title="The guest's entry drawer, the real EntryShell"
                  caption="The tenth surface, and the first thing anyone sees after the QR. It wears the direction through its own attribute."
                />
              </FrameRow>
            );

          /* 5 ─ The rest of the family */
          case "family":
            return (
              <FrameRow lock={false}>
                <Viewport
                  {...shared}
                  id="surfaces"
                  scene="surfaces"
                  direction={direction}
                  w={CANVAS.phone.w}
                  h={CANVAS.phone.h}
                  title="The dialog, the tooltip and the toast"
                  caption="The covering family: a dialog over its scrim, a tooltip, and the real sonner toast."
                />
                <Viewport
                  {...shared}
                  id="field"
                  scene="field"
                  direction={direction}
                  w={CANVAS.phone.w}
                  h={420}
                  title="The field"
                  caption="A listbox in three directions, a search in the fourth."
                />
                <Viewport
                  {...shared}
                  id="edge"
                  scene="edge"
                  direction={direction}
                  variant="sheet"
                  side="top"
                  w={CANVAS.phone.w}
                  h={CANVAS.phone.h}
                  title="The edge panel, on its one real side"
                  caption="ui/sheet.tsx's only product call site is the marketing mobile menu, and it enters from the TOP."
                />
              </FrameRow>
            );

          /* 6 ─ Where glass stops paying for itself */
          case "glass-cost":
            return (
              <FrameRow lock={false}>
                <Viewport
                  {...shared}
                  id="glass-cinema"
                  scene="menu"
                  direction="glass"
                  ground="cinema"
                  w={340}
                  h={420}
                  title="Glass over the album"
                  caption="A room behind the panel, which is the condition the blur is written for."
                />
                <Viewport
                  {...shared}
                  id="glass-flat"
                  scene="menu"
                  direction="glass"
                  ground="app-light"
                  w={340}
                  h={420}
                  title="Glass over a flat app ground"
                  caption="Nothing to let through, and the GPU still pays for the layer."
                />
                <Viewport
                  {...shared}
                  id="card-flat"
                  scene="menu"
                  direction="card"
                  ground="app-light"
                  w={340}
                  h={420}
                  title="Card over the same flat ground"
                  caption="The comparison: what the same surface is worth when the material buys nothing."
                />
              </FrameRow>
            );

          /* 7 ─ Every direction, and what it costs */
          case "directions":
            return (
              <div className="grid gap-3 sm:grid-cols-3">
                {(["card", "glass", "command"] as const).map((d) => {
                  const candidate = FLOATING_SURFACES.candidates.find(
                    (c) => c.id === d,
                  );
                  if (!candidate) return null;
                  return (
                    <ConceptCard
                      key={d}
                      candidate={candidate}
                      selected={d === direction}
                    >
                      <ul className="flex flex-col gap-1">
                        {DIRECTION_META[d].changes.map((c) => (
                          <li
                            key={c}
                            className="text-[11px] leading-relaxed text-muted-foreground"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[11px] leading-relaxed">
                        <strong className="font-medium">The cost. </strong>
                        <span className="text-muted-foreground">
                          {DIRECTION_META[d].cost}
                        </span>
                      </p>
                      <ApplyToSite
                        block={{
                          label: directionLabel(d),
                          css: directionCss(d, "site"),
                          what: DIRECTION_META[d].paste,
                          pages: WALK_PAGES,
                        }}
                      />
                    </ConceptCard>
                  );
                })}
              </div>
            );

          /* 8 ─ The corner, measured */
          case "corner":
            return (
              <>
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
                        r.id
                          ? "The dashed arc and the row's arc are one line."
                          : "As it ships: the dashed arc and the row's arc are two different lines."
                      }
                    />
                  ))}
                </FrameRow>
                <RungApplies dim="radius" />
              </>
            );

          /* 9 ─ The light in dark, over the ramps */
          case "light":
            return (
              <>
                <FrameRow lock={false}>
                  <Viewport
                    {...shared}
                    id="light-ladder"
                    scene="ladder"
                    dim="light"
                    rungs={RUNGS.light.map((r) => r.id).filter(Boolean)}
                    w={ladderWidth(RUNGS.light.length)}
                    h={300}
                    title="The light ladder"
                    caption={`Over ramp ${ramp}. Flip the ramp on the dock: a floating layer's light in dark is a question about the ground under it.`}
                  />
                </FrameRow>
                <RungApplies dim="light" />
              </>
            );

          /* 10 ─ The entrance: rule 12 against rule 15 */
          case "entrance":
            return (
              <>
                <div className="grid max-w-3xl gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:grid-cols-2">
                  <p>
                    <strong className="text-foreground">Rule 12.</strong>{" "}
                    {rule(12)}
                  </p>
                  <p>
                    <strong className="text-foreground">Rule 15.</strong>{" "}
                    {rule(15)}
                  </p>
                </div>
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
                      title={
                        e === "one-clock"
                          ? "One clock, rule 15 taken literally"
                          : "By frequency, rule 12 taken literally"
                      }
                      caption={
                        e === "one-clock"
                          ? "The family moves as one: the tooltip, the menu and the dialog on the same beat."
                          : "The tooltip and the menu land in 90ms; the dialog keeps its own beat."
                      }
                    />
                  ))}
                </FrameRow>
                <CellLabel className="max-w-2xl">
                  Press Replay in the dock and watch the two together. The
                  difference is the tooltip, and the tooltip is the surface a
                  host opens fifty times in an evening.
                </CellLabel>
                <RungApplies dim="entrance" />
              </>
            );

          /* 11 ─ The outliers, and bible 14's first line */
          case "outliers":
            return (
              <>
                <Knob label="Outlier">
                  <Toggle
                    ariaLabel="Outlier"
                    options={[
                      { id: "select" as Outlier, label: "Select" },
                      { id: "sheet" as Outlier, label: "Sheet" },
                      { id: "drawer" as Outlier, label: "Drawer" },
                    ]}
                    value={outlier}
                    onChange={setOutlier}
                  />
                </Knob>
                <FrameRow lock={false}>
                  <Viewport
                    {...shared}
                    id={`outlier-today-${outlier}`}
                    scene={outlier === "select" ? "select" : "edge"}
                    variant={outlier === "drawer" ? "drawer" : "sheet"}
                    w={CANVAS.phone.w}
                    h={outlier === "select" ? 360 : 520}
                    title="As it ships"
                    caption="The primitive with nothing overridden, for the eye to come back to."
                  />
                  <Viewport
                    {...shared}
                    id={`outlier-knobs-${outlier}`}
                    scene={outlier === "select" ? "select" : "edge"}
                    variant={outlier === "drawer" ? "drawer" : "sheet"}
                    knobs={knobs}
                    w={CANVAS.phone.w}
                    h={outlier === "select" ? 360 : 520}
                    title="On the knobs in the dock"
                    caption="The same primitive brought onto the contract you have set."
                  />
                  <Viewport
                    {...shared}
                    id={`outlier-dropped-${outlier}`}
                    scene={outlier === "select" ? "radio" : "edge"}
                    variant={outlier === "drawer" ? "sheet" : "drawer"}
                    knobs={knobs}
                    w={CANVAS.phone.w}
                    h={outlier === "select" ? 360 : 520}
                    title={
                      outlier === "select"
                        ? "Dropped: the dropdown with radio items"
                        : outlier === "sheet"
                          ? "Dropped: the drawer takes the bottom case"
                          : "Dropped: the sheet takes the bottom case"
                    }
                    caption="What takes the work if the outlier goes, so the ask is a choice between two real things."
                  />
                </FrameRow>
                <div className="flex flex-col gap-3">
                  <ApplyToSite
                    block={{
                      label: contractLabel(knobs),
                      css: contractCss(knobs, "site"),
                      what: "The three knobs as the dock has them, as one paste.",
                      pages: WALK_PAGES,
                    }}
                  />
                  <ApplyToSite
                    block={{
                      label: "Floating layer: the reduced-motion patch",
                      css: REDUCED_MOTION_CSS,
                      what: "Bible 14's first line: a gate of the family's own, a stop rather than a clamp. It competes with nothing.",
                      pages:
                        "any marketing page, with reduced motion on in the OS",
                    }}
                  />
                </div>
              </>
            );

          /* 12 ─ Where to walk a candidate */
          case "walk":
            return (
              <>
                <ApplyToSite
                  block={{
                    label: directionLabel("card"),
                    css: directionCss("card", "site"),
                    what: "The recommendation as one paste: card's material, radius and motion, but not its anatomy.",
                    pages: WALK_PAGES,
                  }}
                />
                <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {WALK.map((w) => {
                    const href =
                      w.href.startsWith("/e/") && demo ? `/e/${demo}` : w.href;
                    const linkable = !href.includes("[");
                    return (
                      <li
                        key={w.href}
                        className="flex flex-wrap items-baseline gap-2"
                      >
                        {linkable ? (
                          <a
                            className="font-medium text-foreground underline underline-offset-2"
                            href={withDesignKey(href, designKey ?? null)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {href}
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">
                            {href}
                          </span>
                        )}
                        <span>{w.what}</span>
                      </li>
                    );
                  })}
                </ul>
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

/**
 * WHAT THE DIRECTION ON THE DOCK IS, in its own words: the changes in the order
 * a reader meets them, the honest cost, and the line saying which half of it a
 * paste can carry. It sits at the head of the first section rather than above
 * it, because the template's first screen belongs to the answer.
 */
function DirectionPanel({ direction }: { direction: Direction }) {
  const meta = DIRECTION_META[direction];
  return (
    <div className="flex max-w-3xl flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm font-semibold">
          The {meta.label.toLowerCase()} direction
        </p>
        <p className="text-xs text-muted-foreground">{meta.thesis}</p>
      </div>
      <ul className="flex flex-col gap-1">
        {meta.changes.map((c) => (
          <li key={c} className="text-xs leading-relaxed text-muted-foreground">
            {c}
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed">
        <strong className="font-semibold">The cost. </strong>
        <span className="text-muted-foreground">{meta.cost}</span>
      </p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">
          What the paste carries.{" "}
        </strong>
        {meta.paste}
      </p>
    </div>
  );
}

/**
 * A LADDER'S RUNGS, EACH AS THE PASTE A RULING WOULD LAND. The rung that ships
 * has no block to apply and says so rather than drawing a dead button: an
 * "Apply" that hands the site what it already wears is exactly the control with
 * no visible consequence a cold walk goes looking for.
 */
function RungApplies({ dim }: { dim: "radius" | "light" | "entrance" }) {
  return (
    <div className="flex flex-col gap-2">
      {RUNGS[dim].map((r) => {
        const value = r.id ? r.id.slice(6) : "";
        if (!value) {
          return (
            <p key={r.label} className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">today: </span>
              what ships, so there is nothing to apply.
            </p>
          );
        }
        const knobs: Knobs = {
          radius: dim === "radius" ? (value as RadiusRung) : "off",
          light: dim === "light" ? (value as LightRung) : "off",
          entrance: dim === "entrance" ? (value as EntranceRung) : "off",
        };
        return (
          <ApplyToSite
            key={r.label}
            block={{
              label: contractLabel(knobs),
              css: contractCss(knobs, "site"),
              what: `The ${dim} rung "${r.label}", on the real primitives.`,
              pages: WALK_PAGES,
            }}
          />
        );
      })}
    </div>
  );
}
