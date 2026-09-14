"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState, useSyncExternalStore } from "react";

import {
  BoardMeta,
  Toggle,
  type Ground,
  type Mode,
} from "@/components/dev/board";

import { RUNGS, type Dim } from "./constants";
import { Frame } from "./frame";

/** A ladder asks for exactly the width its rungs need, so it renders 1:1 in the
 *  lab column: judging a 6px corner against a 12px one at half scale judges the
 *  scale. Above 768, so `sm:` still resolves on the desktop side. */
const ladderWidth = (dim: Dim) => Math.max(800, RUNGS[dim].length * 230);

/**
 * THE FLOATING-SURFACES BOARD (the review wave, 2026-09-14). Bible 15 says every
 * floating surface rides one contract: one radius, one entrance, one light. This
 * board writes the three, judges the nine primitives together on every ground at
 * both widths, and asks what happens to the three that stand outside.
 *
 * Rising tides (bible 22): the question was taken from the ground up rather than
 * as a tuning of today's five lines, and it turned up a rule-9 miss inside the
 * contract itself. Today a menu draws an 8px container around 1.6px items sitting
 * in 4px of padding, so the highlighted row's corner does not nest inside the
 * panel's corner: by rule 9 the container is the item plus its offset, which is
 * 5.6px, not 8. That is why the radius ladder is not three sizes of the same
 * answer. Each rung anchors at a different END of the same rule (items sharp,
 * today's container, items on the action law) and derives the other value from
 * it, so every rung is internally correct and the ruling is about which family a
 * floating layer belongs to.
 *
 * Nothing under src/components/ui is edited: the frames render the real
 * primitives and the candidates are applied from the outside (board.css explains
 * the two hooks). If a candidate wins, the change lands in the primitives in the
 * wiring round.
 */

const QUESTION =
  "If the floating layer were designed today, what is its radius, its entrance and its light on every ground, and what happens to the primitives that stand outside it?";

const CANDIDATES = [
  {
    name: "Radius, sharp",
    rationale:
      "A floating layer is a surface, so it keeps the sharp family: items at the 1.6px surface radius, container at items plus their 4px padding. The panel is only as round as what it holds.",
  },
  {
    name: "Radius, nested",
    rationale:
      "Today's ratified container, corrected: the 8px stays and the items rise to 4px so the highlighted row nests inside the corner. The smallest true change, and it tracks the rounding round's retune.",
  },
  {
    name: "Radius, round",
    rationale:
      "A menu is a cluster of things you press, so the items take the action family at row height (8px) and the container follows at 12px. Ties menus to buttons instead of to cards.",
  },
  {
    name: "Entrance, one clock",
    rationale:
      "Today's law: one origin-aware zoom-fade for the whole family, 175ms in and 120ms out on the emphasis curve. One entrance is the half of rule 15 that is easiest to keep.",
  },
  {
    name: "Entrance, by frequency",
    rationale:
      "Bible 12 applied to the family rather than to one control: a tooltip or a menu is opened fifty times a night, so it lands in 90ms with no zoom at all, while a dialog or a sheet stays occasional at 220ms. Two clocks, chosen by how often the surface appears. This rung argues with rule 15's one entrance, deliberately.",
  },
  {
    name: "Entrance, origin true",
    rationale:
      "One clock, more physical: the panel grows out of its trigger from 0.92 with a 6px travel along the side axis, so the tie to the trigger is the motion rather than a transform-origin nobody sees.",
  },
  {
    name: "Light, lighter is closer",
    rationale:
      "Today in dark: the popover surface sits lighter than the ground, the shadow is zeroed, the ring draws the edge. Nothing casts in dark.",
  },
  {
    name: "Light, a soft shadow",
    rationale:
      "Bible 10 as rewritten allows a shadow where a layer sits over content, and a floating layer is that case by definition. A dark-tuned family returns in dark: wider, softer and lower than the light one.",
  },
  {
    name: "Light, a lit edge",
    rationale:
      "No shadow on either ground: a hairline of light along the top edge and a dark hairline under the bottom, so the panel catches the room's light the way an object does. The scrim separates the modal ones.",
  },
];

const ASKS = [
  "The radius: sharp, nested or round, and whether the sheet and dialog take a second token or the same one",
  "The entrance: one clock, by frequency, or origin true",
  "The light in dark: lighter is closer, a soft shadow, or a lit edge",
  "The outliers: select, drawer and sheet onto the contract, or dropped",
];

const DEPARTURES = [
  "The stage is not the shell's Stage. Every radix panel portals to globalThis.document.body, so inside a zoom-fitted div it leaves the ground, leaves the zoom and leaves the canvas (a 375 bottom sheet spans the real browser). Each frame here is an iframe laid out at the canvas's true pixels, running the scene route in its own document. Offered to the shell as an addition, not a replacement.",
  "Today's contract misses bible 9 inside itself: an 8px panel around 1.6px items in 4px of padding does not nest. Every radius rung fixes it; the ruling is which end to anchor.",
  "The entrance rung 'by frequency' contests rule 15's one entrance with rule 12's animate-by-frequency. Both are ratified and on this family they disagree. A finding for Will, not a quiet choice.",
  "The light rungs overlap the light board's question of where a shadow returns in dark. The manifest says show both answers here rather than wait, so this board proposes and the two should be ruled once.",
  "tw-animate-css ships no reduced-motion guard, so the primitives' own animate-in utilities run for a reader who asked for less motion. board.css switches them off for the board; the same hole is live in production.",
];

const GROUNDS: { id: Ground; label: string }[] = [
  { id: "cinema", label: "Cinema" },
  { id: "paper", label: "Paper" },
  { id: "ink", label: "Ink" },
  { id: "app-dark", label: "App dark" },
  { id: "app-light", label: "App light" },
];

type SceneId = "family" | "overlay" | "edge";
type Outlier = "select" | "sheet" | "drawer";

function Row({
  n,
  name,
  note,
  children,
}: {
  n: number;
  name: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground text-[11px] tabular-nums text-background">
            {n}
          </span>
          {name}
        </p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      </div>
      {children}
    </section>
  );
}

/** The lab's key, read from the address bar rather than through
 *  `useSearchParams()`. The dispatcher that renders this board (design/c) owns no
 *  Suspense boundary for it, and a client component that reads search params
 *  without one suspends its subtree: the lab nav's own boundary was left hanging
 *  and every frame stayed unmounted. An effect costs one render and needs
 *  nothing from anyone else's tree. */
const noop = () => () => {};
const readKey = () => new URLSearchParams(window.location.search).get("key");
// undefined = not read yet. A frame must not load before then: on the preview
// the scene route is gated, so a keyless first src would 404 and then reload.
// useSyncExternalStore rather than an effect, so the value arrives with the
// first post-hydration render instead of one render later.
const noKeyYet = () => undefined;

function useDesignKey(): string | null | undefined {
  return useSyncExternalStore(noop, readKey, noKeyYet);
}

export function FloatingSurfacesBoard() {
  const designKey = useDesignKey();

  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("cinema");
  const [scene, setScene] = useState<SceneId>("family");
  const [variant, setVariant] = useState<"sheet" | "drawer">("sheet");
  const [radius, setRadius] = useState("nested");
  const [entrance, setEntrance] = useState("one-clock");
  const [light, setLight] = useState("lighter");
  const [outlier, setOutlier] = useState<Outlier>("select");
  const [replay, setReplay] = useState(0);

  const knobs = { radius, entrance, light };
  const phone = mode === "phone";

  return (
    <div className="flex flex-col gap-10 py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {QUESTION}
      </p>

      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Toggle
          ariaLabel="Family"
          options={[
            { id: "family" as SceneId, label: "Menus" },
            { id: "overlay" as SceneId, label: "Overlays" },
            { id: "edge" as SceneId, label: "Edges" },
          ]}
          value={scene}
          onChange={setScene}
        />
        <Toggle
          ariaLabel="Ground"
          options={GROUNDS}
          value={ground}
          onChange={setGround}
        />
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "1440" },
            { id: "phone" as Mode, label: "375" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <button
          type="button"
          onClick={() => setReplay((n) => n + 1)}
          className="rounded-lg border border-border px-3 py-1 text-[12px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted active:scale-[0.97]"
        >
          Replay every entrance
        </button>
      </div>

      <Row
        n={1}
        name="The contract, live"
        note="The nine primitives on the ground being judged, held open together so the family reads as a family. Set the three knobs and the whole family changes at once: a ruling here is three words. Today is the 'today' rung of each knob, which is the as-shipped panel with nothing overridden."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            ariaLabel="Radius"
            options={[
              { id: "off", label: "Radius: today" },
              { id: "sharp", label: "sharp" },
              { id: "nested", label: "nested" },
              { id: "round", label: "round" },
            ]}
            value={radius}
            onChange={setRadius}
          />
          <Toggle
            ariaLabel="Entrance"
            options={[
              { id: "off", label: "Entrance: today" },
              { id: "one-clock", label: "one clock" },
              { id: "by-frequency", label: "by frequency" },
              { id: "origin-true", label: "origin true" },
            ]}
            value={entrance}
            onChange={setEntrance}
          />
          <Toggle
            ariaLabel="Light"
            options={[
              { id: "off", label: "Light: today" },
              { id: "lighter", label: "lighter" },
              { id: "shadow", label: "shadow" },
              { id: "lit-edge", label: "lit edge" },
            ]}
            value={light}
            onChange={setLight}
          />
          {scene === "edge" ? (
            <Toggle
              ariaLabel="Edge primitive"
              options={[
                { id: "sheet" as const, label: "Sheet" },
                { id: "drawer" as const, label: "Drawer" },
              ]}
              value={variant}
              onChange={setVariant}
            />
          ) : null}
        </div>
        <Frame
          label="The contract, live"
          scene={scene}
          ground={ground}
          mode={mode}
          variant={variant}
          replay={replay}
          designKey={designKey}
          {...knobs}
        />
      </Row>

      <Row
        n={2}
        name="The radius ladder"
        note="The same menu, four rungs, one frame: today as it ships, then the three that obey rule 9 from a different end. Watch the highlighted row's corner against the panel's corner, which is the thing today gets wrong. The nested rung reads --radius-float live, so it follows the rounding round's retune."
      >
        <Frame
          label="Radius ladder"
          scene="ladder"
          dim="radius"
          ground={ground}
          mode={mode}
          width={phone ? undefined : ladderWidth("radius")}
          height={phone ? 470 : 300}
          replay={replay}
          designKey={designKey}
        />
      </Row>

      <Row
        n={3}
        name="The light ladder"
        note="The dark question, over photographs, because bible 10 turns on the words 'a layer over content'. Lighter-is-closer alone, a dark-tuned shadow returning, and a lit edge with no shadow at all. Flip the ground to paper to check that whichever wins does not break the light side."
      >
        <Frame
          label="Light ladder"
          scene="ladder"
          dim="light"
          ground={ground}
          mode={mode}
          width={phone ? undefined : ladderWidth("light")}
          height={phone ? 470 : 300}
          replay={replay}
          designKey={designKey}
        />
      </Row>

      <Row
        n={4}
        name="The entrance ladder"
        note="Three clocks side by side; press Replay to run them again. One clock is today's law. By frequency is rule 12 taken literally: the menu lands in 90ms with no zoom while the dialog keeps its beat. Origin true grows the panel out of the trigger."
      >
        <Frame
          label="Entrance ladder"
          scene="ladder"
          dim="entrance"
          ground={ground}
          mode={mode}
          width={phone ? undefined : ladderWidth("entrance")}
          height={phone ? 470 : 300}
          replay={replay}
          designKey={designKey}
        />
      </Row>

      <Row
        n={5}
        name="The outliers"
        note="Select is stock shadcn (a 1.6px radius, a raw shadow that draws in dark, no house ease); the sheet has the shadow but is square by side; the drawer has the radius but no shadow. Left is as it ships, right is the same primitive on the contract you have set above. Dropping one is a legal answer: select has one call site, the sheet one, the drawer none, and each one's replacement is already on this board (a dropdown with radio items, a bottom sheet, a dialog)."
      >
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
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              As it ships
            </p>
            <Frame
              label="Outlier today"
              scene={outlier === "select" ? "select" : "edge"}
              variant={outlier === "drawer" ? "drawer" : "sheet"}
              ground={ground}
              mode="phone"
              height={560}
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              On the contract
            </p>
            <Frame
              label="Outlier on the contract"
              scene={outlier === "select" ? "select" : "edge"}
              variant={outlier === "drawer" ? "drawer" : "sheet"}
              ground={ground}
              mode="phone"
              height={560}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
        </div>
      </Row>

      <BoardMeta
        question={QUESTION}
        candidates={CANDIDATES}
        asks={ASKS}
        departures={DEPARTURES}
      />
    </div>
  );
}
