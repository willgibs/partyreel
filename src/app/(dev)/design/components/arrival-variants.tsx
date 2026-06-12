"use client";

import { useState } from "react";
import { ClipboardCopy } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ARRIVAL_PRESETS,
  ArrivalPlayer,
  tuningSummary,
  type ArrivalTuning,
} from "./arrival-player";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the guest ARRIVAL (Phase 4.5) - judged as one choreographed
 * flow, so the variants are composed presets PLAYED by the interactive
 * player above them, not static boards. Protocol: load a preset, tune the
 * knobs, replay until it feels right (full screen on the phone is the
 * judging mode), then Select the closest preset and Copy tuning so the
 * exact values ride into the ratification notes.
 */
export function ArrivalVariants() {
  const [tuning, setTuning] = useState<ArrivalTuning>(ARRIVAL_PRESETS.calm);
  const [copied, setCopied] = useState(false);

  async function copyTuning() {
    await navigator.clipboard.writeText(`Arrival tuning: ${tuningSummary(tuning)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="py-4">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div>
          <ArrivalPlayer tuning={tuning} />
        </div>

        {/* The tuning panel: every knob is one moment of the choreography.
            Values are lab-local; the ratified set becomes the production
            constants verbatim. */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Tuning</p>
              <button
                onClick={copyTuning}
                className="flex h-7 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-medium transition-colors hover:border-foreground/40"
              >
                <ClipboardCopy className="size-3" />
                {copied ? "Copied" : "Copy tuning"}
              </button>
            </div>

            <Knob
              label="Arrival beat"
              hint="the pause after the page settles, before the sheet rises (return visits always 350ms)"
              options={[
                { label: "450ms", value: 450 },
                { label: "600ms", value: 600 },
                { label: "700ms", value: 700 },
              ]}
              value={tuning.beatMs}
              onChange={(beatMs) =>
                setTuning((t) => ({ ...t, beatMs: beatMs as ArrivalTuning["beatMs"] }))
              }
            />
            <Knob
              label="Welcome presence"
              hint="how tall the invitation stands (eyes go to screen center)"
              options={[
                { label: "Content", value: "content" },
                { label: "Tall", value: "tall" },
                { label: "Taller", value: "taller" },
              ]}
              value={tuning.welcomeHeight}
              onChange={(welcomeHeight) =>
                setTuning((t) => ({
                  ...t,
                  welcomeHeight: welcomeHeight as ArrivalTuning["welcomeHeight"],
                }))
              }
            />
            <Knob
              label="Step transition"
              hint="how welcome and the gate hand off inside the sheet"
              options={[
                { label: "Slide", value: "slide" },
                { label: "Rise", value: "rise" },
                { label: "None", value: "none" },
              ]}
              value={tuning.transition}
              onChange={(transition) =>
                setTuning((t) => ({
                  ...t,
                  transition: transition as ArrivalTuning["transition"],
                }))
              }
            />
            <Knob
              label="Success beat"
              hint="the You're-in moment before the sheet exits (it also masks the server roundtrip)"
              options={[
                { label: "Check 700ms", value: "check-700" },
                { label: "Morph 900ms", value: "morph-900" },
                { label: "Morph 1200ms", value: "morph-1200" },
              ]}
              value={tuning.success}
              onChange={(success) =>
                setTuning((t) => ({
                  ...t,
                  success: success as ArrivalTuning["success"],
                }))
              }
            />
            <Knob
              label="Type scale"
              hint="hero / gate title sizes (current 20/20, bumped 28/22, bumpier 32/24)"
              options={[
                { label: "Current", value: "current" },
                { label: "Bumped", value: "bumped" },
                { label: "Bumpier", value: "bumpier" },
              ]}
              value={tuning.typeScale}
              onChange={(typeScale) =>
                setTuning((t) => ({
                  ...t,
                  typeScale: typeScale as ArrivalTuning["typeScale"],
                }))
              }
            />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Full screen on the phone is the judging mode: real keyboard (the
            field lifts above it, no autofocus ambush), real rubber-band on
            the firm sheet, real exit physics. Wrong passwords show the error
            line growing the sheet smoothly; the back chevron revisits the
            welcome. Account-gated events keep drag-to-dismiss and a Just
            browsing path; this player shows the firm password flow.
          </p>
        </div>
      </div>

      {/* The ratification layer: Select the closest preset (the decision),
          and the copied tuning string rides into decisionNote. */}
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        <Variant
          n={1}
          name="Calm arrival"
          rationale="The recommended middle: a real pause, tall invitation, slide handoffs, a held green You're-in."
          framed={false}
        >
          <PresetCard
            tuning={ARRIVAL_PRESETS.calm}
            active={tuning === ARRIVAL_PRESETS.calm}
            onLoad={() => setTuning(ARRIVAL_PRESETS.calm)}
          />
        </Variant>
        <Variant
          n={2}
          name="Swift arrival"
          rationale="Speed-first: shortest beat, content-height sheet, rise transitions, check-only success."
          framed={false}
        >
          <PresetCard
            tuning={ARRIVAL_PRESETS.swift}
            active={tuning === ARRIVAL_PRESETS.swift}
            onLoad={() => setTuning(ARRIVAL_PRESETS.swift)}
          />
        </Variant>
        <Variant
          n={3}
          name="Stately arrival"
          rationale="Maximum occasion: longest beat, tallest invitation, biggest type, the longest held celebration."
          framed={false}
        >
          <PresetCard
            tuning={ARRIVAL_PRESETS.stately}
            active={tuning === ARRIVAL_PRESETS.stately}
            onLoad={() => setTuning(ARRIVAL_PRESETS.stately)}
          />
        </Variant>
      </div>
    </div>
  );
}

function Knob<T extends string | number>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-4 border-t border-border/60 pt-4 first:mt-3 first:border-0 first:pt-0">
      <p className="text-[13px] font-medium">{label}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            aria-pressed={o.value === value}
            className={cn(
              "flex h-7 items-center rounded-full px-3 text-[11px] font-medium transition-colors",
              o.value === value
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PresetCard({
  tuning,
  active,
  onLoad,
}: {
  tuning: ArrivalTuning;
  active: boolean;
  onLoad: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <ul className="space-y-1 text-xs text-muted-foreground">
        {tuningSummary(tuning)
          .split(" / ")
          .map((line) => (
            <li key={line}>{line}</li>
          ))}
      </ul>
      <button
        onClick={onLoad}
        className={cn(
          "mt-3 flex h-8 w-full items-center justify-center rounded-[var(--radius-action-sm)] text-xs font-medium transition-colors",
          active
            ? "bg-foreground text-background"
            : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
        )}
      >
        {active ? "Loaded in the player" : "Load in the player"}
      </button>
    </div>
  );
}
