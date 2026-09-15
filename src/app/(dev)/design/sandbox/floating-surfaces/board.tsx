"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState, useSyncExternalStore } from "react";

import {
  BoardMeta,
  Toggle,
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { withDesignKey } from "@/lib/design-gate/links";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

import { BIBLE } from "../../rules/bible";
import {
  REDUCED_MOTION_CSS,
  contractCss,
  contractLabel,
  entranceCss,
  lightCss,
  radiusCss,
  type EntranceRung,
  type LightRung,
  type RadiusRung,
} from "./candidates";
import {
  RAMPS,
  RAMP_LABEL,
  RUNGS,
  WALK,
  type Dim,
  type Ramp,
} from "./constants";
import { Frame } from "./frame";

/** A ladder asks for exactly the width its rungs need, so it renders 1:1 in the
 *  lab column: judging a 6px corner against a 12px one at half scale judges the
 *  scale. Above 768, so `sm:` still resolves on the desktop side. */
const ladderWidth = (dim: Dim) => Math.max(800, RUNGS[dim].length * 230);

/**
 * THE FLOATING-SURFACES BOARD, round two (2026-09-14).
 *
 * Round one put all the primitives on one canvas and found that the contract
 * misses bible 9 inside itself. It was a good finding badly shown: the
 * arithmetic was in a caption, the candidates were stage-local CSS that only
 * resembled what a ruling would land, and the surface most people on this
 * product actually touch was not on the board at all.
 *
 * Round two rebuilt it from the ground up around three changes.
 *
 * 1  EVERY RUNG IS ITS OWN PASTE. candidates.ts generates each candidate as real
 *    CSS against the primitives' own data-slots, in three scopes, and the board
 *    renders the very same string it hands the site through setCandidateCss. So
 *    "Apply to the site" is not a demo of a candidate, it IS the candidate, and
 *    Will rules it on the real header nav, a real dropdown, a real dialog and
 *    the guest surface rather than only on a stage.
 * 2  THE GUEST SURFACE IS THE PRIMARY SPECIMEN, because it is the floating
 *    layer this product is mostly made of: every guest who scans a QR meets it
 *    at 375 before they see anything else. It is also a tenth primitive nobody
 *    counted, a raw vaul drawer inside guest/entry-shell.tsx that never goes
 *    through ui/drawer.tsx and carries a literal radius.
 * 3  THE FINDING IS MEASURED, NOT ASSERTED. Row 2 reads the panel's radius, its
 *    padding and the lit row's radius off the live DOM and draws all three at
 *    6x, so the rule-9 miss is a picture and a number rather than a claim, and
 *    a rung that says it nests is checked by the board proposing it.
 *
 * Nothing under src/components/ui is edited: every candidate reaches the
 * primitives from outside, exactly as the paste would.
 */

const QUESTION =
  "If the floating layer were designed today, what is its radius, its entrance and its light on every ground, what happens to the primitives that stand outside it, and does the contract reach the surface a guest actually meets?";

const CANDIDATES = [
  {
    name: "Radius, sharp",
    rationale:
      "A floating layer is a surface, so it keeps the sharp family: rows at the 1.6px surface radius, the panel at rows plus their 4px padding, big boxes at double. The panel is only as round as what it holds.",
  },
  {
    name: "Radius, nested",
    rationale:
      "Today's ratified container, corrected: the 8px stays and the rows rise to 4px so the lit row nests inside the corner. The smallest true change, and it follows the rounding round's retune of --radius-float by itself.",
  },
  {
    name: "Radius, round",
    rationale:
      "A menu is a cluster of things you press, so the rows take the action family at row height (8px) and the container follows at 12px. Ties menus to buttons instead of to cards.",
  },
  {
    name: "Entrance, one clock",
    rationale:
      "Rule 15 taken literally: one origin-aware zoom-fade for the whole family, 175ms in and 120ms out on the emphasis curve. One entrance is the half of the rule that is easiest to keep.",
  },
  {
    name: "Entrance, by frequency",
    rationale:
      "Rule 12 taken literally, applied to the family rather than to one control: a tooltip or a menu is opened fifty times in an evening, so it lands in 90ms with no zoom, while a dialog or a toast stays occasional at 220ms. Two clocks, chosen by how often the surface appears.",
  },
  {
    name: "Entrance, origin true",
    rationale:
      "One clock, more physical: the panel grows out of its trigger from 0.92 with a 6px travel along the side axis, so the tie to the trigger is the motion rather than a transform-origin nobody sees.",
  },
  {
    name: "Light, lighter is closer",
    rationale:
      "Today in dark: the popover surface sits lighter than the ground, the shadow is zeroed, the ring draws the edge. Nothing casts in dark. Judge it on ramp A and ramp B, where the surface gap it leans on is a different size.",
  },
  {
    name: "Light, a soft shadow",
    rationale:
      "The light board's own --lgt-float family, adopted here rather than invented: one geometry, two sizes, one alpha ramp per ground. Two boards proposing two dark shadows would be the exact failure rule 15 exists to prevent, so this rung makes the two rulings one.",
  },
  {
    name: "Light, a lit edge",
    rationale:
      "No shadow on either ground: a hairline of light along the top edge and a dark hairline under the bottom, so the panel catches the room's light the way an object does. The scrim separates the modal ones.",
  },
  {
    name: "The reduced-motion patch",
    rationale:
      "Not a candidate, a hole with its fix attached: tw-animate-css ships no reduced-motion guard, so the whole floating layer still animates for a reader who asked for less motion. One paste closes it site-wide. It wants applying whatever else is ruled.",
  },
];

const ASKS = [
  "The radius: sharp, nested or round, and whether the big boxes take a second token or the same one",
  "The entrance: one clock (rule 15) or by frequency (rule 12), and which rule gives way on this family",
  "The light in dark: lighter is closer, a soft shadow, or a lit edge, ruled on the palette ramp you intend to keep",
  "The edge family: which ONE of sheet and drawer survives, and does the guest entry shell adopt it",
  "The select: onto the contract, or dropped for the dropdown with radio items",
];

const DEPARTURES = [
  "The family is TEN surfaces, not nine. guest/entry-shell.tsx renders a raw vaul drawer that never goes through ui/drawer.tsx, and it is the floating layer most people on this product will ever see. It carries a literal radius, calc(var(--radius-action) * 1.4), the second literal on the layer after the tooltip arrow's. Every rung here reaches it through [data-entry-drawer].",
  "ui/sheet.tsx has exactly ONE product call site and it is the marketing mobile menu, which enters from the TOP. So the sheet's two corners that stay on screen are the BOTTOM two, and an edge rung that covered bottom and right (round one's) reached nothing that ships. Every rung here covers all four sides.",
  "Today's contract misses bible 9 inside itself: an 8px panel around 1.6px rows in 4px of padding does not nest. Row 2 measures it off the live DOM. Every rung fixes it; the ruling is which end to anchor.",
  "The entrance rung 'by frequency' contests rule 15's one entrance with rule 12's animate-by-frequency. Both are ratified and on this family they disagree. A finding for Will, not a quiet choice.",
  "The 'soft shadow' rung is the light board's proposed --lgt-float family verbatim (docs/specs/light.md), not a second design. If a shadow returns in dark it should return once, in one family, for both boards.",
  "The light rungs compose var(--tw-ring-shadow) back in. A bare box-shadow silently deletes the ring the dropdown, the popover, the dialog and the entry shell all ship, because ring-1 IS a box-shadow in Tailwind v4. Round one's board had that bug and it flattened every panel it was trying to judge.",
  "tw-animate-css ships no reduced-motion guard, so every animate-in utility on the site runs for a reader who asked for less motion. The board obeys bible 14 for itself and offers the same patch as a paste.",
  "The stage is not the shell's Stage. Every radix panel portals to globalThis.document.body, so inside a zoom-fitted div it leaves the ground, the zoom and the canvas. Each frame here is an iframe laid out at the canvas's true pixels, running the scene route in its own document.",
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

function rule(n: number): string {
  return BIBLE.find((r) => r.n === n)?.statement ?? "";
}

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

/** THE APPLY BUTTON: one candidate, as the paste a ruling would land, handed to
 *  the whole site. The label is the identity, so a second press on the applied
 *  one clears it and pressing another replaces it. */
function Apply({ label, css }: { label: string; css: string }) {
  const candidate = useTunerCandidate();
  const on = candidate?.label === label;
  return (
    <button
      type="button"
      onClick={() => (on ? clearCandidate() : setCandidateCss(label, css))}
      aria-pressed={on}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
        on
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {on ? "Applied to the site, clear" : "Apply to the site"}
    </button>
  );
}

/** A ladder's rungs, each with its own paste. The row of buttons sits under the
 *  frame in the rungs' own order, so the button under a rung is that rung. */
function ApplyRow({
  dim,
  build,
}: {
  dim: Dim;
  build: (value: string) => { label: string; css: string } | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {RUNGS[dim].map((r) => {
        const value = r.id ? r.id.slice(6) : "";
        const built = value ? build(value) : null;
        return (
          <div key={r.label} className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">{r.label}</span>
            {built ? (
              <Apply label={built.label} css={built.css} />
            ) : (
              <span className="text-[11px] text-muted-foreground/60">
                ships today
              </span>
            )}
          </div>
        );
      })}
    </div>
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
  const candidate = useTunerCandidate();

  const [mode, setMode] = useState<Mode>("desktop");
  const [ground, setGround] = useState<Ground>("cinema");
  const [ramp, setRamp] = useState<Ramp>("today");
  const [scene, setScene] = useState<SceneId>("family");
  const [variant, setVariant] = useState<"sheet" | "drawer">("sheet");
  const [radius, setRadius] = useState("nested");
  const [entrance, setEntrance] = useState("one-clock");
  const [light, setLight] = useState("lighter");
  const [outlier, setOutlier] = useState<Outlier>("select");
  const [replay, setReplay] = useState(0);

  const knobs = { radius, entrance, light };
  const phone = mode === "phone";
  const contract = {
    radius: radius as RadiusRung | "off",
    entrance: entrance as EntranceRung | "off",
    light: light as LightRung | "off",
  };
  const demo = env.NEXT_PUBLIC_DEMO_QR_TOKEN;

  return (
    <div className="flex flex-col gap-10 py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {QUESTION}
      </p>

      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            ariaLabel="Ground"
            options={GROUNDS}
            value={ground}
            onChange={setGround}
          />
          <Toggle
            ariaLabel="Ramp"
            options={RAMPS.map((r) => ({ id: r, label: RAMP_LABEL[r] }))}
            value={ramp}
            onChange={setRamp}
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
          <Apply
            label={contractLabel(contract)}
            css={contractCss(contract, "site")}
          />
        </div>
        {candidate ? (
          <p className="text-[11px] text-muted-foreground">
            On the site now: <strong>{candidate.label}</strong>. It rides every
            lab page, every marketing page and the host app (all with the key),
            and it stays until you clear it. The frames on this board are
            deliberately excluded, so the rungs below keep telling the truth.
          </p>
        ) : null}
      </div>

      <Row
        n={1}
        name="The guest surface at 375, the one most people meet"
        note="Not ui/sheet.tsx: guest/entry-shell.tsx renders a raw vaul drawer with its own radius literal, and it is the first thing every guest sees after the QR. The contract has to reach it or it is not a contract. Beside it is the house sheet on its real side: its one product call site is the marketing mobile menu, which enters from the top, so its two corners are the bottom two. The strip below pins the guest case, one frame per rung, at 1:1."
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2" style={{ flexBasis: 375 }}>
            <p className="text-[11px] font-medium text-muted-foreground">
              The real EntryShell, on the knobs above
            </p>
            <Frame
              label="The guest entry surface"
              scene="guest"
              ground={ground}
              ramp={ramp}
              mode="phone"
              fit={375}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              ui/sheet.tsx as it is actually used: the marketing mobile menu,
              which enters from the TOP
            </p>
            <Frame
              label="The house sheet at 375"
              scene="edge"
              variant="sheet"
              side="top"
              ground={ground}
              ramp={ramp}
              mode="phone"
              fit={375}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The two corners that stay on screen, one frame per rung, at 1:1.
        </p>
        <div className="flex flex-wrap gap-3">
          {RUNGS.radius.map((r) => (
            <div
              key={r.label}
              className="flex flex-col gap-1"
              style={{ flexBasis: 375 }}
            >
              <span className="text-[11px] font-medium">{r.label}</span>
              <Frame
                label={`Sheet corners, ${r.label}`}
                scene="edge"
                variant="sheet"
                compact
                rung={r.id || undefined}
                ground={ground}
                ramp={ramp}
                mode="phone"
                height={250}
                fit={375}
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
      </Row>

      <Row
        n={2}
        name="The corner, measured"
        note="The finding the round turned on, at 6x, read off the live DOM rather than claimed in a caption. The solid outer arc is the panel, the solid inner arc is the lit row, and the dashed arc is where the row's corner has to sit for the two to share a centre (bible 9: the container is the object plus its offset). On today's rung the dashed arc and the row's arc are different lines, and they are the same line on all three candidates. That is the whole argument for changing anything."
      >
        <div className="flex flex-wrap gap-3">
          {RUNGS.radius.map((r) => (
            <div
              key={r.label}
              className="flex flex-col gap-1"
              style={{ flexBasis: 236 }}
            >
              <span className="text-[11px] font-medium">{r.label}</span>
              <Frame
                label={`Corner, ${r.label}`}
                scene="nest"
                rung={r.id || undefined}
                ground={ground}
                ramp={ramp}
                mode="desktop"
                width={236}
                height={330}
                fit={236}
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
      </Row>

      <Row
        n={3}
        name="The radius ladder"
        note="The same menu, four rungs, one frame, so the families can be compared rather than the numbers. Each rung obeys rule 9 from a different end: the surface family, today's container corrected, or the action family. Every rung is a complete paste: press the button under it and the real header nav, a real dropdown, the dialogs and the guest drawer all take it."
      >
        <Frame
          label="Radius ladder"
          scene="ladder"
          dim="radius"
          ground={ground}
          ramp={ramp}
          mode={mode}
          width={phone ? undefined : ladderWidth("radius")}
          height={phone ? 470 : 300}
          replay={replay}
          designKey={designKey}
        />
        <ApplyRow
          dim="radius"
          build={(v) => ({
            label: `Floating radius: ${v}`,
            css: radiusCss(v as RadiusRung, "site"),
          })}
        />
      </Row>

      <Row
        n={4}
        name="The light in dark, over the palette's ramps"
        note="A floating layer's light in dark is a question about the ground it floats over, so the ramp is a knob. Today's dark popover sits lighter than the card it opens from (0.245 over 0.21, the palette board's finding), which is exactly what 'lighter is closer' leans on; ramp A widens that gap, ramp B makes every dark surface one room. Walk the three lights on today, then on A, then on B, and check on paper that whichever wins leaves the light side standing."
      >
        <Frame
          label="Light ladder"
          scene="ladder"
          dim="light"
          ground={ground}
          ramp={ramp}
          mode={mode}
          width={phone ? undefined : ladderWidth("light")}
          height={phone ? 470 : 300}
          replay={replay}
          designKey={designKey}
        />
        <ApplyRow
          dim="light"
          build={(v) => ({
            label: `Floating light: ${v}`,
            css: lightCss(v as LightRung, "site"),
          })}
        />
      </Row>

      <Row
        n={5}
        name="The entrance: rule 12 against rule 15"
        note="Not a number, a principle. Two ratified rules disagree on this family, and the two frames below are each rule taken literally on the same three primitives: the tooltip (the highest-frequency surface on the site), the menu, and the dialog. Press Replay and watch them together. Rule 15 asks the family to move as one; rule 12 asks each surface to move at the rate a person meets it. One of them gives way here."
      >
        <div className="grid gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:grid-cols-2">
          <p>
            <strong className="text-foreground">Rule 12.</strong> {rule(12)}
          </p>
          <p>
            <strong className="text-foreground">Rule 15.</strong> {rule(15)}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {(["one-clock", "by-frequency"] as const).map((e) => (
            <div key={e} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium">
                {e === "one-clock"
                  ? "One clock, rule 15: the family moves as one"
                  : "By frequency, rule 12: the tooltip and the menu land in 90ms, the dialog keeps its beat"}
              </span>
              <Frame
                label={`Entrance, ${e}`}
                scene="trio"
                rung={`flt-e-${e}`}
                ground={ground}
                ramp={ramp}
                mode="desktop"
                width={900}
                height={300}
                fit={900}
                replay={replay}
                designKey={designKey}
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          The third answer, origin true, on the menus alone:
        </p>
        <Frame
          label="Entrance ladder"
          scene="ladder"
          dim="entrance"
          ground={ground}
          ramp={ramp}
          mode={mode}
          width={phone ? undefined : ladderWidth("entrance")}
          height={phone ? 470 : 300}
          replay={replay}
          designKey={designKey}
        />
        <ApplyRow
          dim="entrance"
          build={(v) => ({
            label: `Floating entrance: ${v}`,
            css: entranceCss(v as EntranceRung, "site"),
          })}
        />
      </Row>

      <Row
        n={6}
        name="The contract, live"
        note="The whole family held open together on the ground being judged, so a stray one reads as a stray one. This is the canvas rule 15 is actually about. The knobs at the top drive it; a ruling here is three words."
      >
        <div className="flex flex-wrap items-center gap-2">
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
          ramp={ramp}
          mode={mode}
          variant={variant}
          replay={replay}
          designKey={designKey}
          {...knobs}
        />
      </Row>

      <Row
        n={7}
        name="The outliers, and what replaces them"
        note="Three columns, so the ask is a choice between two real things rather than a word. Left is as it ships, middle is the same primitive on the contract you have set above, right is the answer if it is dropped: the surface that takes its work, already on the contract. Select has one product call site, the sheet has one (the marketing mobile menu), and ui/drawer.tsx has none at all, so the honest version of the ask is which ONE edge primitive survives and whether the guest entry shell then adopts it."
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
        {/* The three wrap below ~1100: two 375 canvases in a 343 column would
            each be scaled to a third, which judges the scale rather than the
            primitive. */}
        <div className="flex flex-wrap gap-3">
          <div
            className="flex min-w-0 grow flex-col gap-2"
            style={{ flexBasis: 300 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              As it ships
            </p>
            <Frame
              label="Outlier today"
              scene={outlier === "select" ? "select" : "edge"}
              variant={outlier === "drawer" ? "drawer" : "sheet"}
              ground={ground}
              ramp={ramp}
              mode="phone"
              height={520}
              replay={replay}
              designKey={designKey}
            />
          </div>
          <div
            className="flex min-w-0 grow flex-col gap-2"
            style={{ flexBasis: 300 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              On the contract
            </p>
            <Frame
              label="Outlier on the contract"
              scene={outlier === "select" ? "select" : "edge"}
              variant={outlier === "drawer" ? "drawer" : "sheet"}
              ground={ground}
              ramp={ramp}
              mode="phone"
              height={520}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
          <div
            className="flex min-w-0 grow flex-col gap-2"
            style={{ flexBasis: 300 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {outlier === "select"
                ? "Dropped: the dropdown with radio items"
                : outlier === "sheet"
                  ? "Dropped: the drawer takes the bottom case"
                  : "Dropped: the sheet takes the bottom case"}
            </p>
            <Frame
              label="The replacement"
              scene={outlier === "select" ? "radio" : "edge"}
              variant={outlier === "drawer" ? "sheet" : "drawer"}
              ground={ground}
              ramp={ramp}
              mode="phone"
              height={520}
              replay={replay}
              designKey={designKey}
              {...knobs}
            />
          </div>
        </div>
      </Row>

      <Row
        n={8}
        name="The hole under all of it, and its patch"
        note="Bible 14 says every animation lives inside the reduced-motion block. tw-animate-css, which every primitive's entrance rides, ships no such block, so the whole floating layer animates for a reader who asked for less motion. This board honours the preference for itself; the button hands the same patch to the site. It is not a candidate and it does not compete with the three above: whatever is ruled, this wants applying."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Apply
            label="Floating layer: the reduced-motion patch"
            css={REDUCED_MOTION_CSS}
          />
          <span className="text-[11px] text-muted-foreground">
            Turn reduced motion on in the OS, then reload a marketing page with
            it applied.
          </span>
        </div>
      </Row>

      <Row
        n={9}
        name="Where to walk a candidate"
        note="A candidate is applied to the whole site, so it is judged where the family actually lives. One block at a time; the newest replaces the last, and the tuner panel clears it too. The lab frames on this board are excluded on purpose, so the rungs above stay honest while a candidate is on."
      >
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {WALK.map((w) => {
            const href =
              w.href.startsWith("/e/") && demo ? `/e/${demo}` : w.href;
            const linkable = !href.includes("[");
            return (
              <li key={w.href} className="flex flex-wrap items-baseline gap-2">
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
                  <span className="font-medium text-foreground">{href}</span>
                )}
                <span>{w.what}</span>
              </li>
            );
          })}
        </ul>
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
