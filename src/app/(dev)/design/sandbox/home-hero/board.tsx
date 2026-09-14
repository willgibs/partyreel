"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { Stage as ShellStage, Toggle, type Mode } from "@/components/dev/board";
import { CinemaHero } from "@/components/marketing/sections/home/cinema-hero";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { Variant } from "../variant-frame";
import { gathering } from "./gathering";
import { reel } from "./reel";
import { type Concept, type CopyMode } from "./shared";
import { source } from "./source";

/**
 * Touchpoint: THE HOME HERO, round two (Will, 2026-09-14). The contract and
 * the doctrine are in shared.tsx; the three concepts are one file each, built
 * by three tracks in parallel (hero-source, hero-reel, hero-gathering) and
 * imported here in the order the board argues them.
 *
 * Lab convention, deliberate: nothing here wires use-ambient-pause on scroll
 * (the lab never pauses; side-by-side comparison wants everything running).
 * Loops pause on a hidden TAB only, through the stage's data-paused, which
 * costs nothing and cannot misfire. Production wiring is use-ambient-pause,
 * exactly as the shipped hero has it.
 */

const CONCEPTS: Concept[] = [source, reel, gathering];

/** The stage: the shell's, on the cinema ground with the group's body skin
 *  (this board is cinema-only, so the lab page matches the route group). */
function Stage({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <ShellStage mode={mode} ground="cinema" bodySkin>
      {children}
    </ShellStage>
  );
}

/** What a concept proposes beyond its stage, on the board where it can be
 *  ruled on: the eyebrow, the departures it flags, the assets it asks for. */
function ConceptMeta({ concept }: { concept: Concept }) {
  const rows: [string, string[]][] = [
    ["Eyebrow", [concept.eyebrow]],
    [
      "Proposed copy",
      [
        `${concept.proposed.h1} / ${concept.proposed.subhead} / ${concept.proposed.secondary}`,
      ],
    ],
    ["Departures", concept.departures.length ? concept.departures : ["none"]],
    ["Asks", concept.assets.length ? concept.assets : ["none yet"]],
  ];
  return (
    <dl className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {rows.map(([label, lines]) => (
        <div key={label} className="contents">
          <dt className="text-[11px]">{label}</dt>
          <dd>
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function HomeHeroBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [copy, setCopy] = useState<CopyMode>("ruled");
  const [scrim, setScrim] = useState(false);
  const [runId, setRunId] = useState(0);
  const reduced = usePrefersReducedMotion();
  const qrUrl = DEMO_EVENT_URL ?? null;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Round one asked where the type lives so no photograph is dimmed, and
          answered with four grids. They did not land: the image-grid idiom of
          ten to twenty years ago, and none of them caught the one thing
          Partyreel is.
        </p>
        <p>
          Round two asks one sharper question. The hero is the QR becoming the
          album: the scan is the origin of everything on screen. Three answers,
          one mechanism each. The source: the QR at the centre and the album
          streaming out of it forever. The reel: an encapsulated highlight film
          with the type over it and the live QR pinned as the announcement. The
          gathering: a bespoke field of photographs and clips around the type,
          the QR as the eyebrow. Each proposes its own eyebrow and its own copy
          beside the ruled line; each names the asset that replaces its
          stand-ins; each flags any departure from the bible on the board rather
          than in a footnote.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Toggle
          ariaLabel="Copy"
          options={[
            { id: "ruled" as CopyMode, label: "Ruled copy" },
            { id: "proposed" as CopyMode, label: "Proposed copy" },
          ]}
          value={copy}
          onChange={setCopy}
        />
        <Toggle
          ariaLabel="Type scrim (the reel only)"
          options={[
            { id: "off", label: "No scrim" },
            { id: "on", label: "Type scrim" },
          ]}
          value={scrim ? "on" : "off"}
          onChange={(v) => setScrim(v === "on")}
        />
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-transform active:scale-95"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
        {reduced && (
          <span className="text-[11px] text-muted-foreground">
            Reduced motion: every composition settled, the album already there.
          </span>
        )}
      </div>

      {CONCEPTS.map((c) => (
        <Variant
          key={c.id}
          n={c.n}
          name={c.name}
          rationale={c.rationale}
          framed={false}
        >
          <Stage
            mode={mode}
            key={`${c.id}-${mode}-${runId}-${copy}-${String(scrim)}`}
          >
            {c.render({ mode, copy, scrim, qrUrl, runId })}
          </Stage>
          <ConceptMeta concept={c} />
        </Variant>
      ))}

      {/* The reference, last on purpose: the board argues against it, so it
          should be judged after the three rather than framed by it. */}
      <Variant
        n={0}
        name="Today, for reference"
        rationale="The shipped hero, live from production code. Four stacked darkenings over twenty-four tiles; the reel card floats free of the composition."
        framed={false}
      >
        <Stage mode={mode} key={`today-${mode}-${runId}`}>
          {/* The shipped hero is 100svh and pulls itself up under the overlay
              header; the stage owns the height here, so both are neutralized
              locally rather than by touching production. */}
          <div className="h-full [--mkt-header-h:0px] [&>section]:h-full [&>section]:min-h-0">
            <CinemaHero />
          </div>
        </Stage>
      </Variant>
    </div>
  );
}
