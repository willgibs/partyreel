"use client";

import { useState } from "react";

import {
  Cell,
  Compare,
  CopyButton,
  Knob,
  Labeled,
  Loupe,
  Paste,
  SelectTable,
  Specimen,
  Stage,
  Toggle,
} from "@/components/lab";

/**
 * THE KIT'S SPECIMENS: each piece rendered, so the kit page is the same kind of
 * page as a library component's.
 *
 * ★ EVERY SPECIMEN IS REAL, NEVER A PICTURE OF ONE. A kit page that drew a
 * screenshot of a dock would be exactly the failure the kit exists to end (a
 * board arguing from a rendering of evidence rather than from evidence), so the
 * dock here is a dock, the compare compares, and the loupe magnifies. The two
 * pieces that cannot be shown inertly are the Frame, which would load real
 * pages into this page, and the BoardPage template, which IS the two pilot
 * boards: both are linked rather than mounted.
 */

export function ToggleDemo() {
  const [v, setV] = useState("desktop");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Knob label="Canvas">
        <Toggle
          ariaLabel="Canvas"
          options={[
            { id: "desktop", label: "1440" },
            { id: "phone", label: "375" },
          ]}
          value={v}
          onChange={setV}
        />
      </Knob>
      <span className="text-[11px] text-muted-foreground">
        The name goes on the control: a dock of five unnamed pill groups is five
        questions a stranger answers by clicking.
      </span>
    </div>
  );
}

export function StageDemo() {
  return (
    <Labeled
      name="A 375 canvas on the app's light ground"
      note="Real pixels, so a size is judged at the size it ships. A breakpoint prefix inside a stage reads the BROWSER's width, not the canvas's; key off the mode prop instead."
    >
      <Stage mode="phone" ground="app-light" height={220} fit="zoom">
        <div className="flex h-full flex-col justify-center gap-3 px-6">
          <p className="font-heading text-2xl tracking-tight">A real stage</p>
          <p className="text-sm text-muted-foreground">
            375 CSS pixels wide, on the ground the app paints.
          </p>
        </div>
      </Stage>
    </Labeled>
  );
}

export function SpecimenDemo() {
  return (
    <Specimen cols={3}>
      {[2, 8, 16].map((r) => (
        <Cell
          key={r}
          name={`${r}px`}
          note={r === 2 ? "today" : undefined}
          proposed={r === 8 ? "the corner you can see" : undefined}
        >
          <div
            className="size-20 border border-border bg-muted"
            style={{ borderRadius: r }}
          />
        </Cell>
      ))}
    </Specimen>
  );
}

export function CompareDemo() {
  const card = (r: number) => (
    <div
      className="flex h-24 items-center justify-center border border-border bg-muted text-[11px] text-muted-foreground"
      style={{ borderRadius: r }}
    >
      {r}px
    </div>
  );
  return (
    <Compare
      mode="wipe"
      differs="The corner radius, 2px against 8px. Nothing else in the card moves, so the seam down the middle is the difference."
      a={card(2)}
      b={card(8)}
    />
  );
}

export function LoupeDemo() {
  return (
    <Loupe zoom={6} size={140}>
      <div className="flex gap-1 p-6">
        {[2, 3, 4].map((r) => (
          <div
            key={r}
            className="size-16 bg-foreground/80"
            style={{ borderRadius: r }}
          />
        ))}
      </div>
    </Loupe>
  );
}

export function SelectTableDemo() {
  const [v, setV] = useState("c");
  return (
    <SelectTable
      caption="The rows are the choice: the numbers being compared and the control that picks between them are one object."
      columns={["Family", "Surface", "Float", "Tile"]}
      rows={[
        {
          id: "a",
          cells: ["A, Today", "2", "8", "3"],
          note: "the site as built",
        },
        { id: "b", cells: ["B, Square", "0", "6", "0"] },
        { id: "c", cells: ["C, Soft", "8", "12", "4"], recommended: true },
        { id: "d", cells: ["D, One family", "6", "6", "6"] },
      ]}
      value={v}
      onChange={setV}
    />
  );
}

export function PasteDemo() {
  return (
    <Paste
      label="The block a ruling would land"
      lines={3}
      code={`:root {
  --radius: 8px;
  --radius-float: 12px;
  --radius-tile: 4px;
}

.surface-paper {
  --radius: 8px;
}`}
    />
  );
}

export function CopyDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CopyButton text="review rounding r5: surfaces=c; ladder=quarters" />
      <span className="text-[11px] text-muted-foreground">
        One settled state, 1.6 seconds, everywhere on a board. The clipboard can
        reject without a gesture or over plain http; the label stays put rather
        than lying.
      </span>
    </div>
  );
}
