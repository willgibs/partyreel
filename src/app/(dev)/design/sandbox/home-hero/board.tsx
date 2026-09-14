"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { Stage as ShellStage, Toggle, type Mode } from "@/components/dev/board";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { Variant } from "../variant-frame";
import { burst } from "./burst";
import { river } from "./river";
import { scan } from "./scan";
import { type Concept, type CopyMode } from "./shared";
import { source } from "./source";

/**
 * Touchpoint: THE HOME HERO, round three (Will, 2026-09-14). The contract and
 * the doctrine are in shared.tsx. Round two's three concepts were ruled the
 * same day: the source won ("definitely my favorite direction"), so it stays
 * on the board as the reference and three variations off it are one file
 * each, built by three tracks in parallel (hero-scan, hero-burst, hero-river)
 * and imported here in the order the board argues them. The reel and the
 * gathering left the board at ba82222 (`git show ba82222:<path>`).
 *
 * Lab convention, deliberate: nothing here wires use-ambient-pause on scroll
 * (the lab never pauses; side-by-side comparison wants everything running).
 * Loops pause on a hidden TAB only, through the stage's data-paused, which
 * costs nothing and cannot misfire. Production wiring is use-ambient-pause,
 * exactly as the shipped hero has it.
 */

const CONCEPTS: Concept[] = [source, scan, burst, river];

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
  const [runId, setRunId] = useState(0);
  const reduced = usePrefersReducedMotion();
  const qrUrl = DEMO_EVENT_URL ?? null;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Round two asked one question, the hero is the QR becoming the album,
          and answered it three ways. Will ruled the source: a stranger landing
          here should immediately think &quot;if I scan this, I get all of
          these&quot;, and the supporting elements and copy clarify from there.
          The reel read as the video being the product; the gathering&apos;s QR
          read as a scan-to-learn-more object beside an album, not the basis of
          the feature.
        </p>
        <p>
          Round three iterates on the source. It stays first as the reference;
          three variations follow, each pushing one axis of the same causality:
          the scan makes the cause literal (the act of scanning births the
          album), the burst takes the origin into every direction, the river
          runs the album down out of the code into the page. Each proposes its
          own supporting elements and copy, names its assets, and flags any
          departure on the board rather than in a footnote.
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
          <Stage mode={mode} key={`${c.id}-${mode}-${runId}-${copy}`}>
            {c.render({ mode, copy, scrim: false, qrUrl, runId })}
          </Stage>
          <ConceptMeta concept={c} />
        </Variant>
      ))}
    </div>
  );
}
