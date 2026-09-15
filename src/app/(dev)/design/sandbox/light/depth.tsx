"use client";

import { useState } from "react";

import { Stage, Toggle, type Ground, type Mode } from "@/components/dev/board";
import { cn } from "@/lib/utils";

import { LIT_FACE, SHADOW_FAMILY } from "./candidates";
import {
  ApplyToSite,
  Cell,
  Copy,
  Knob,
  Labeled,
  matrixCols,
  Part,
  Photo,
  Proposal,
} from "./shared";

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
  const w = small ? 82 : 152;
  const h = small ? 110 : 203;
  return (
    <div
      className="relative"
      style={{ width: w * 1.64, height: h * 1.3 }}
      aria-hidden
    >
      {[
        { id: "reception-hall", x: 0, r: -8, z: 0 },
        { id: "wedding-toast", x: w * 0.52, r: 7, z: 1 },
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
      style={{ width: small ? 150 : 300, height: small ? 118 : 196 }}
      aria-hidden
    >
      <Copy
        lines={5}
        width={small ? 150 : 300}
        className="absolute inset-x-0 top-2"
      />
      <div
        className={cn(
          "absolute right-0 bottom-0 w-[62%] border border-border bg-popover p-3",
          p.ring,
        )}
        style={{ borderRadius: "var(--radius-float)" }}
        data-lgt-cue={p.cue}
      >
        <div className="space-y-2">
          {[86, 64, 74, 52].map((w, i) => (
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
        small ? "w-[150px]" : "w-[268px]",
        p.ring,
      )}
      style={{ borderRadius: "var(--radius)" }}
      data-lgt-cue={p.cue}
      aria-hidden
    >
      <div className="h-2 w-[54%] rounded-full bg-foreground/45" />
      <div className="mt-3">
        <Copy lines={3} width={small ? 126 : 236} />
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

/* ── THE LIT FACE ON THE THREE SURFACES THE DOCTRINE NAMES ────────────────
   The matrix above asks "does a cue separate two objects". This asks a
   different question, and it is the one that decides whether the lit face is
   elevation at all: put it on a face that is CATCHING light and it stops
   competing with the shadow, because it is not answering the same question.

   ★ THE CLASS STRINGS ARE THE PRODUCTION ONES, COPIED. A media tile is
   [data-media-tile] at --radius-tile (masonry.tsx); a screen is
   `rounded-xl bg-gallery` (reel-frame.tsx's player area, the one surface
   globals.css declares identical in light and dark); a plate is
   `rounded-2xl border bg-card ring-1 ring-foreground/5` around a white face
   (live-qr.tsx, qr-hero.tsx). They are rebuilt here rather than imported so
   every specimen on this board carries its cue the same way, through one
   data attribute on one box. The paste under this stage is what puts the cue
   on the REAL components. */

function FaceMedia({ cue, small }: { cue: Cue; small: boolean }) {
  const p = cueProps(cue, "ring-1 ring-foreground/10", "lift");
  return (
    <Photo
      id="reception-hall"
      sizes="200px"
      cue={p.cue}
      className={p.ring}
      style={{ width: small ? 132 : 188, height: small ? 88 : 125 }}
    />
  );
}

function FaceScreen({ cue, small }: { cue: Cue; small: boolean }) {
  const p = cueProps(cue, "ring-1 ring-foreground/10", "lift");
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-xl bg-gallery",
        p.ring,
      )}
      style={{ width: small ? 132 : 188, height: small ? 74 : 106 }}
      data-lgt-cue={p.cue}
    >
      <div className="absolute inset-0 grid place-items-center">
        <span className="flex size-8 items-center justify-center rounded-full bg-white/90">
          <span
            aria-hidden
            className="ml-0.5 border-y-[5px] border-l-[8px] border-y-transparent border-l-black/80"
          />
        </span>
      </div>
      <div className="absolute inset-x-3 bottom-2.5 h-1 rounded-full bg-white/25">
        <div className="h-full w-1/3 rounded-full bg-gallery-foreground/90" />
      </div>
    </div>
  );
}

/** The plate's white face, deterministic so it never drifts between renders. */
const PLATE_CELLS = Array.from({ length: 81 }, (_, i) => {
  const x = i % 9;
  const y = Math.floor(i / 9);
  const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
  return finder ? (x % 2 === 1 && y % 2 === 1 ? 0 : 1) : (x * 7 + y * 13) % 3 === 0 ? 1 : 0;
});

function FacePlate({ cue, small }: { cue: Cue; small: boolean }) {
  const p = cueProps(cue, "ring-1 ring-foreground/5", "lift");
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-border bg-card",
        small ? "p-3" : "p-4",
        p.ring,
      )}
      data-lgt-cue={p.cue}
    >
      <div className={cn("rounded-lg bg-white", small ? "p-2" : "p-2.5")}>
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
            width: small ? 72 : 92,
          }}
        >
          {PLATE_CELLS.map((on, i) => (
            <span
              key={i}
              className="aspect-square rounded-[1px]"
              style={{ background: on ? "oklch(0.15 0 0)" : "transparent" }}
            />
          ))}
        </div>
      </div>
      <span className="text-[10px] font-medium text-foreground">
        Scan to join
      </span>
    </div>
  );
}

const FACES: {
  id: string;
  title: string;
  why: string;
  render: (cue: Cue, small: boolean) => React.ReactNode;
}[] = [
  {
    id: "media",
    title: "A media frame",
    why: "the photograph is the face",
    render: (cue, small) => <FaceMedia cue={cue} small={small} />,
  },
  {
    id: "screen",
    title: "A screen",
    why: "the player, lit from inside",
    render: (cue, small) => <FaceScreen cue={cue} small={small} />,
  },
  {
    id: "plate",
    title: "A plate",
    why: "the QR, a printed thing",
    render: (cue, small) => <FacePlate cue={cue} small={small} />,
  },
];

function LitFaceMatrix({ mode, ground }: { mode: Mode; ground: Ground }) {
  const small = mode === "phone";
  const cols = matrixCols(mode, 4);
  return (
    // ★ MEASURED, NOT GUESSED (round three). Both canvases were short. The
    // three faces plus the stage's own padding come to 856px at 1440 against a
    // 780px canvas, and 1363 against 1180 at 375, so the plate's row, the one
    // that carries the proposal, was clipped off the bottom of the stage on
    // both. Two rounds of checks measured stage WIDTH and never height, which
    // is how a clipped row survives a walk.
    //
    // ★ AND MEASURE THE CHILD, NOT THE STAGE. A stage carries `zoom`, and
    // Chrome reports scrollHeight and clientHeight on a zoomed element in
    // different spaces, so `scrollHeight - clientHeight` reads a constant
    // phantom overflow that does not move when the height changes. The honest
    // number is the child's own rect divided by the computed zoom.
    <Stage mode={mode} ground={ground} height={small ? 1370 : 870}>
      <div
        data-lgt-cues
        className={cn("h-full", small ? "px-4 py-5" : "px-10 py-8")}
      >
        <div
          className="grid gap-x-4 gap-y-6"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {FACES.map((f) => (
            <div key={f.id} className="contents">
              <div
                className={cn(
                  "flex gap-2",
                  small ? "flex-col gap-0.5" : "items-baseline",
                )}
                style={{ gridColumn: `span ${cols}` }}
              >
                <h3 className="text-[12px] font-semibold">{f.title}</h3>
                <p className="text-[11px] text-muted-foreground">{f.why}</p>
              </div>
              {CUES.map((c) => (
                <Cell
                  key={c.id}
                  name={c.label}
                  className="min-h-0"
                  proposed={
                    c.id === "lit"
                      ? "the face is catching light, so it is material"
                      : undefined
                  }
                >
                  <div
                    className="flex w-full items-center justify-center"
                    style={{ height: small ? 132 : 168 }}
                  >
                    {f.render(c.id, small)}
                  </div>
                </Cell>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

export function DepthPart({ mode, rules }: { mode: Mode; rules: string[] }) {
  const [ground, setGround] = useState<Ground>("cinema");
  const small = mode === "phone";
  const cols = matrixCols(mode, 4);
  const rowH = small ? 178 : 300;

  return (
    <Part
      n="A"
      title="Depth: the cue is the relationship, not the mode"
      rules={rules}
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
          <p>
            <span className="font-medium text-foreground">
              One ruling, two boards.
            </span>{" "}
            The floating-surfaces board asks the same question for its own
            family, as item 5 of its contract: the light in dark, lighter is
            closer against a soft shadow against a lit edge. The middle subject
            here is that question, and the three answers are the same three
            columns. A ruling on this row answers both, and FLOAT is the
            shadow-tuned-for-dark option written out with values.
          </p>
        </>
      }
    >
      <Knob label="Ground">
        <Toggle
          ariaLabel="Ground"
          options={GROUNDS}
          value={ground}
          onChange={setGround}
        />
      </Knob>

      {/* The canvas is taller than a viewport on purpose: a matrix is not a
          screen, and 375 pairs the four cues into two rows per subject, so the
          phone canvas is roughly a third taller again. Measured, not guessed:
          a stage that clips its last row hides the control column. */}
      <Stage mode={mode} ground={ground} height={small ? 1320 : 1050}>
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
                  className={cn(
                    "flex gap-2",
                    small ? "flex-col gap-0.5" : "items-baseline",
                  )}
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
                    proposed={c.id === s.proposed ? s.proposedNote : undefined}
                  >
                    <div
                      className="flex w-full items-center justify-center"
                      style={{ height: rowH - (small ? 60 : 74) }}
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
        either mode. On a light ground lift is what ships today, to the byte, so
        paper does not move: the finding was only ever that dark has no ramp,
        because 6 percent of black over a near black room is arithmetically
        invisible.
      </Proposal>

      <ApplyToSite candidate={SHADOW_FAMILY} />

      <div className="max-w-2xl space-y-2 pt-6 text-xs leading-relaxed text-muted-foreground">
        <h3 className="text-[13px] font-semibold text-foreground">
          The lit face is not a fifth depth cue
        </h3>
        <p>
          The matrix above asks whether a cue separates two objects. This asks
          the question that decides what the lit face IS: put it on a face that
          is catching light and it stops competing with the shadow, because it
          is not answering the same question. A media frame, a screen and a
          plate, each with the same four treatments, on the same two grounds.
        </p>
        <p>
          Watch the screen column on paper. The gallery surface is the one
          surface globals.css declares identical in light and dark, so it is a
          dark screen on a near white page, and its lip stays on the top edge
          while the tile beside it moves its lip to the bottom. The face{"'"}s
          own ground decides, not the page{"'"}s, which is the whole reason the
          cue is called material rather than elevation.
        </p>
      </div>

      <Labeled
        name="The three surfaces the doctrine names"
        note="Same cues, same grounds. The lit face column is the proposal; the ring and the shadow are there so it can lose."
      >
        <LitFaceMatrix mode={mode} ground={ground} />
      </Labeled>

      <Proposal>
        The lit face is material, not elevation. It belongs to a face that is
        catching light: a media frame, a screen, a plate. On paper the lip reads
        off the bottom edge rather than the top, unless the face carries its own
        ground, in which case the face wins. It never lands on a card, a panel
        or a control, which is the line that keeps it from becoming a fifth
        depth technique.
      </Proposal>

      <ApplyToSite candidate={LIT_FACE} />
    </Part>
  );
}
