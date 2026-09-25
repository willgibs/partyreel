"use client";

import { useState, type CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { StepPicture } from "@/components/marketing/sections/how-it-works/step-picture";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import {
  LOOP_STEP_COUNT,
  loopSteps,
  type LoopPerspective,
} from "@/lib/constants/how-it-works";
import { cn } from "@/lib/utils";

/**
 * THE "HOW IT WORKS" OVERVIEW: the whole loop inside one ordinary section,
 * one step on screen at a time.
 *
 * Chosen on the walkthrough's `shape` step: "I made a
 * previous question note about using a simpler three steps for 'How It Works'
 * sections, such as on the homepage, to point into the more comprehensive How
 * It Works page. However, I think a numbered stepper would work better, where
 * we can present the full flow within a regular height section without feeling
 * crowded or long."
 *
 * That is the trade this component makes on purpose. A teaser that stopped at
 * three steps was shallower than the page it linked to, and six steps stacked
 * would be a second walkthrough; six numbered tabs with one step open is the
 * full flow at the height of a normal section, and the door at the foot is
 * where the depth lives.
 *
 * ★ TABS THAT ARE BUTTONS, NOT A TABLIST. Each number rewrites the block
 * beneath it rather than revealing one of six panels that all exist, so
 * `aria-pressed` on ordinary buttons is the honest shape (the walkthrough's
 * perspective toggle takes the same line). Every step's copy is in the DOM once,
 * so a reader on a screen reader hears one step, and the numbers say which.
 *
 * ★ THE STEPS ARE THE PAGE'S OWN (lib/constants/how-it-works.ts). This section
 * and /how-it-works cannot drift, because there is nothing here to drift: only
 * the shape differs.
 *
 * `perspective` is a prop and not a second toggle: a section that pointed at
 * the full walkthrough and ALSO carried its controls would be the walkthrough.
 * The home greets a host (Will, `who=host`), so the home passes "host".
 */
export function HowItWorksStepper({
  perspective = "host",
  className,
}: {
  perspective?: LoopPerspective;
  className?: string;
}) {
  const steps = loopSteps(perspective);
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <Reveal className={cn("mx-auto max-w-5xl", className)}>
      {/* The rail: six numbers on one line, the active one inked solid and the
          rest outlined. Press feedback is a 0.94 squeeze rather than a colour
          flash, because a number is a small target and the squeeze is what
          says the tap landed. */}
      <div
        data-mkt-cut
        style={{ "--i": 0 } as CSSProperties}
        className="flex items-center justify-center gap-2 sm:gap-2.5"
      >
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={i === active}
            aria-label={`Step ${i + 1}: ${s.title}`}
            onClick={() => setActive(i)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border text-sm font-medium tabular-nums outline-none",
              "transition-[color,background-color,border-color,transform,scale] duration-150 ease-emphasis",
              "focus-visible:ring-2 focus-visible:ring-ring/50",
              "active:scale-[0.94] motion-reduce:transition-none motion-reduce:active:scale-100",
              i === active
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* One step. Keyed by index so both halves mount fresh and run the
          `@starting-style` entrance: 200ms, out of a 3px blur, the picture 70ms
          behind its words. A transition rather than a keyframe, so there is no
          new animation name to collide with and reduced motion simply gets the
          step with no motion at all (`motion-safe`). */}
      <div
        data-mkt-cut
        style={{ "--i": 1 } as CSSProperties}
        className="mt-10 grid items-center gap-x-12 gap-y-8 sm:mt-12 lg:grid-cols-12"
      >
        <div
          key={`copy-${active}`}
          className="flex flex-col gap-3 blur-[0px] transition-[opacity,filter,translate] duration-200 ease-emphasis motion-reduce:transition-none lg:col-span-5 motion-safe:starting:translate-y-1.5 motion-safe:starting:opacity-0 motion-safe:starting:blur-[3px]"
        >
          <Caption className="text-sm tabular-nums">
            {String(active + 1).padStart(2, "0")} of {LOOP_STEP_COUNT}
          </Caption>
          <h3 className="font-heading text-subsection">{step.title}</h3>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
            {step.body}
          </p>
        </div>
        <div
          aria-hidden
          key={`picture-${active}`}
          style={{ transitionDelay: "70ms" }}
          className="blur-[0px] transition-[opacity,filter,translate] duration-200 ease-emphasis motion-reduce:transition-none lg:col-span-7 motion-safe:starting:translate-y-1.5 motion-safe:starting:opacity-0 motion-safe:starting:blur-[3px]"
        >
          <div className="mx-auto w-full max-w-md">
            <StepPicture id={step.id} />
          </div>
        </div>
      </div>

      {/* The door. A section that ends on a pointer is a bridge, not a full
          stop, which is why the mount gives back part of its bottom padding. */}
      <div
        data-mkt-cut
        style={{ "--i": 2 } as CSSProperties}
        className="mt-12 flex justify-center"
      >
        <LearnMoreLink href="/how-it-works">
          The full walkthrough, both sides
        </LearnMoreLink>
      </div>
    </Reveal>
  );
}
