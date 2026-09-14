"use client";

import { useState } from "react";

import { Stage, Toggle, type Ground, type Mode } from "@/components/dev/board";
import { cn } from "@/lib/utils";

import { Cell, Copy, matrixCols, Part, Photo, Proposal } from "./shared";

/**
 * PART A: DEPTH. What separates one object from another, per RELATIONSHIP.
 *
 * The contract today is "one depth technique per mode": light floats on one
 * shadow family, dark uses surface steps and borders and no shadow at all.
 * Bible 10's rewrite already broke the second half ("a shadow is allowed where
 * stacked or overlapping objects need separating"), and this part is the
 * argument for finishing the job: the mode was never the right axis. Two
 * photographs on top of each other are the same lightness in BOTH modes, so
 * lighter-is-closer has nothing to offer either of them, and a menu over
 * scrolling content needs to detach in both. What actually decides the cue is
 * the relationship between the two objects.
 *
 * Three subjects, four cues, on the three grounds that matter. Cue one is the
 * baseline (surface steps and borders, what ships today); the other three ADD
 * to it, so every column is the same object with one thing changed.
 *
 * Nothing here moves. A depth cue that needs motion to read is not a depth cue,
 * so this part's rest state is its only state and reduced motion changes
 * nothing about it.
 */

type Cue = "none" | "ring" | "shadow" | "lit";

const CUES: { id: Cue; label: string }[] = [
  { id: "none", label: "Lighter is closer" },
  { id: "ring", label: "The ring lift" },
  { id: "shadow", label: "A soft shadow" },
  { id: "lit", label: "The lit face" },
];

const GROUNDS: { id: Ground; label: string }[] = [
  { id: "cinema", label: "Cinema" },
  { id: "app-dark", label: "App dark" },
  { id: "paper", label: "Paper" },
];

/** The cue as classes plus the data attribute board.css keys off. A cue that
 *  needs a box-shadow rides the sheet, never an inline literal: the values are
 *  the proposal, and a proposal spread across six call sites cannot be ruled
 *  on in one place. */
function cueProps(cue: Cue, ring: string, shadow: "lift" | "float") {
  return {
    ring: cue === "ring" ? ring : undefined,
    cue: cue === "shadow" ? shadow : cue === "lit" ? "lit" : undefined,
  };
}

/* ── Subject 1: two photographs on top of each other ──────────────────────
   Bible 10's own case, and the one the pricing page already answered in
   production (plan-cards.tsx stacks its photographs with shadow-lg on cinema).
   A photograph has no surface token, so the baseline column is the honest
   nothing: whatever the two images happen to do at their meeting edge. */
function StackedMedia({ cue, small }: { cue: Cue; small: boolean }) {
  const p = cueProps(cue, "ring-1 ring-foreground/10", "lift");
  const w = small ? 74 : 104;
  const h = small ? 99 : 139;
  return (
    <div
      className="relative"
      style={{ width: w * 1.9, height: h * 1.28 }}
      aria-hidden
    >
      {[
        { id: "reception-hall", x: 0, r: -6, z: 0 },
        { id: "wedding-toast", x: w * 0.78, r: 5, z: 1 },
      ].map((s) => (
        <Photo
          key={s.id}
          id={s.id}
          sizes="160px"
          cue={p.cue}
          className={cn("absolute top-1/2", p.ring)}
          style={{
            left: s.x,
            width: w,
            height: h,
            zIndex: s.z,
            translate: "0 -50%",
            rotate: `${s.r}deg`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Subject 2: a layer over content that keeps living behind it ──────────
   The floating-layer case. The baseline is the real one: --popover is a step
   up from --card which is a step up from --background, plus a border. */
function FloatingLayer({ cue, small }: { cue: Cue; small: boolean }) {
  const p = cueProps(cue, "ring-1 ring-foreground/5", "float");
  return (
    <div
      className="relative"
      style={{ width: small ? 150 : 216, height: small ? 108 : 128 }}
      aria-hidden
    >
      <Copy
        lines={4}
        width={small ? 150 : 216}
        className="absolute inset-x-0 top-2"
      />
      <div
        className={cn(
          "absolute right-0 bottom-0 w-[64%] border border-border bg-popover p-2",
          p.ring,
        )}
        style={{ borderRadius: "var(--radius-float)" }}
        data-lgt-cue={p.cue}
      >
        <div className="space-y-1.5">
          {[86, 64, 74].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-foreground/25"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Subject 3: a flat card with nothing behind it ────────────────────────
   The control. If a cue improves this one, the cue is a surface effect and
   bible 10's "never as a flat surface effect" is the thing it breaks. */
function FlatCard({ cue, small }: { cue: Cue; small: boolean }) {
  const p = cueProps(cue, "ring-1 ring-foreground/5", "lift");
  return (
    <div
      className={cn(
        "border border-border bg-card p-3",
        small ? "w-[150px]" : "w-[196px]",
        p.ring,
      )}
      style={{ borderRadius: "var(--radius)" }}
      data-lgt-cue={p.cue}
      aria-hidden
    >
      <div className="h-2 w-[54%] rounded-full bg-foreground/45" />
      <div className="mt-3">
        <Copy lines={3} width={small ? 126 : 172} />
      </div>
    </div>
  );
}

const SUBJECTS: {
  id: string;
  title: string;
  relationship: string;
  render: (cue: Cue, small: boolean) => React.ReactNode;
  proposed: Cue;
  proposedNote: string;
}[] = [
  {
    id: "stacked",
    title: "Two photographs, overlapping",
    relationship: "same lightness, one in front of the other",
    render: (cue, small) => <StackedMedia cue={cue} small={small} />,
    proposed: "shadow",
    proposedNote: "lift: the only cue that survives two dark frames meeting",
  },
  {
    id: "floating",
    title: "A layer over content",
    relationship: "detached, the page still living behind it",
    render: (cue, small) => <FloatingLayer cue={cue} small={small} />,
    proposed: "shadow",
    proposedNote: "float: the step alone reads as a hole cut in the page",
  },
  {
    id: "flat",
    title: "A flat card",
    relationship: "nothing behind it, nothing over it",
    render: (cue, small) => <FlatCard cue={cue} small={small} />,
    proposed: "none",
    proposedNote:
      "the step and its hairline, unchanged. A shadow here is a smudge",
  },
];

export function DepthPart({ mode }: { mode: Mode }) {
  const [ground, setGround] = useState<Ground>("cinema");
  const small = mode === "phone";
  const cols = matrixCols(mode, 4);
  const rowH = small ? 168 : 214;

  return (
    <Part
      n="A"
      title="Depth: the cue is the relationship, not the mode"
      lede={
        <>
          <p>
            Three subjects, each rendered four ways beside each other. Cue one
            is what ships today (lighter is closer, plus a hairline); the other
            three add the ring lift (37 uses at 5 percent, 12 at 10, and the
            elevation contract never named it), a soft shadow, and the lit face
            from the beam board. Switch the ground: the same three subjects on
            the cinema room, on the app dark, and on paper as the control.
          </p>
          <p>
            The shadow column is one family at two sizes, declared in board.css:
            the light mode geometry verbatim, at the alpha a dark ground needs.
            That is the finding underneath bible 10. Dark did not lack a shadow
            because shadows are wrong in dark; it lacked one because 6 percent
            of black over a near black room is arithmetically invisible.
          </p>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Ground"
          options={GROUNDS}
          value={ground}
          onChange={setGround}
        />
      </div>

      <Stage
        mode={mode}
        ground={ground}
        height={rowH * 3 + (small ? 320 : 150)}
      >
        <div
          data-lgt-cues
          className={cn("h-full", small ? "px-4 py-5" : "px-10 py-8")}
        >
          <div
            className="grid gap-x-4 gap-y-6"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {SUBJECTS.map((s) => (
              <div key={s.id} className="contents">
                {/* The subject's name spans the row on desktop; at 375 it sits
                    above its own pair, which is why the header is its own grid
                    child rather than a table caption. */}
                <div
                  className="flex items-baseline gap-2"
                  style={{ gridColumn: `span ${cols}` }}
                >
                  <h3 className="text-[12px] font-semibold">{s.title}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {s.relationship}
                  </p>
                </div>
                {CUES.map((c) => (
                  <Cell
                    key={c.id}
                    name={c.label}
                    className="min-h-0"
                    note={
                      c.id === s.proposed
                        ? `Proposed. ${s.proposedNote}`
                        : undefined
                    }
                  >
                    <div
                      className={cn(
                        "flex w-full items-center justify-center",
                        c.id === s.proposed &&
                          "rounded-md outline-1 outline-offset-8 outline-foreground/20 outline-dashed",
                      )}
                      style={{ height: rowH - (small ? 56 : 62) }}
                    >
                      {s.render(c.id, small)}
                    </div>
                  </Cell>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Stage>

      <Proposal>
        One shadow family, two sizes, one alpha ramp per ground. Lift separates
        objects of the same lightness that overlap; float detaches a layer from
        content that keeps living behind it; a flat surface takes neither, in
        either mode. The lit face is not elevation at all: it describes the
        material of a face that is catching light, so it belongs to media frames
        and screens, and on paper it reads off the bottom edge rather than the
        top.
      </Proposal>
    </Part>
  );
}
