"use client";

import type { CSSProperties } from "react";

import { SideChip } from "@/components/marketing/sections/how-it-works/side-chip";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";

import type { StepDatum } from "./content";
import { type PictureTreatment, StepPicture } from "./picture-treatments";

/**
 * THE TWO-SIDED SPINE, reused wherever a decision needs N steps at a given
 * picture treatment: THE STEPS decision holds the treatment at "bespoke"
 * (today's) and varies the step count; THE PICTURES decision holds the count
 * at six (today's) and varies the treatment; THE SHAPE decision's "scroll"
 * option is this component at both recommendations. A QUOTE of spine.tsx's
 * layout, never an import of it: the real component has no step-count or
 * treatment prop, and never should for one board's sake (spine.tsx is a
 * `reads`, never edited here).
 */
export function SpineList({
  steps,
  treatment,
}: {
  steps: readonly StepDatum[];
  treatment: PictureTreatment;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-14 py-2 sm:gap-16">
      {steps.map((step, i) => (
        <Reveal
          key={step.id}
          className="grid items-center gap-x-10 gap-y-6 lg:grid-cols-12"
        >
          <div
            className={`flex flex-col gap-2.5 lg:col-span-5 ${i % 2 === 1 ? "lg:order-2" : ""}`}
          >
            <div
              data-mkt-reveal
              className="flex items-center gap-3"
              style={{ "--i": 0 } as CSSProperties}
            >
              <Caption className="text-sm tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </Caption>
              <SideChip>{step.side}</SideChip>
            </div>
            <h3
              data-mkt-reveal
              className="font-heading text-subsection"
              style={{ "--i": 1 } as CSSProperties}
            >
              {step.title}
            </h3>
            <p
              data-mkt-reveal
              className="text-sm leading-relaxed text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              {step.body}
            </p>
          </div>
          <div
            aria-hidden
            data-mkt-reveal
            className={`lg:col-span-7 ${i % 2 === 1 ? "lg:order-1" : ""}`}
            style={{ "--i": 2 } as CSSProperties}
          >
            <div className="mx-auto w-full max-w-md">
              <StepPicture
                moment={step.picture}
                treatment={treatment}
                first={i === 0}
              />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
