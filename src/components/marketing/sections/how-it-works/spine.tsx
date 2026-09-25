"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  LOOP_PERSPECTIVES,
  loopSteps,
  type LoopPerspective,
} from "@/lib/constants/how-it-works";
import { cn } from "@/lib/utils";

import { StepPicture } from "./step-picture";

/**
 * THE WALKTHROUGH: one scroll, six steps, and a toggle above them that swaps
 * the whole thing between the host's side and the guest's.
 *
 * Both halves were answered together (`shape=scroll`): "For the
 * full how it works walkthrough, let's do one scroll as today. It feels
 * cleanest and creates a more full page. However, let's include a toggle above
 * the steps to switch between Host/Guest perspective, and have custom steps for
 * each to see both sides."
 *
 * ── THE NUMBERS ARE THE SPINE, AND THEY DO NOT MOVE ─────────────────────────
 *
 * Toggling swaps each step's words and its picture and leaves 01 to 06 exactly
 * where they were. That is what the toggle is FOR: the same six moments, read
 * from either end of the code. If the numbers re-animated with everything else
 * the section would read as six NEW steps rather than the same six seen
 * differently.
 *
 * ── AND NEITHER DOES THE ENTRANCE ───────────────────────────────────────────
 *
 * ★ ONE <Reveal> PER INDEX, REUSED ACROSS BOTH SETS. A Reveal is a one-way
 * in-view trigger: mount a new one over already-visible content and its
 * observer fires immediately, so a toggle would replay six staggered 700ms
 * rises on steps the reader is already looking at. Keying the rows by INDEX
 * (never by step id) keeps the same six wrappers and their `data-inview="true"`
 * across a swap, which is also why both step sets are the same length by
 * contract (lib/constants/how-it-works.ts).
 *
 * The swap gets its own motion instead, on `<Swapped>` inside the revealed
 * columns: a 200ms rise out of a 3px blur, the picture 60ms behind its words.
 * `@starting-style` rather than a keyframe, so there is no new animation name
 * to collide with (keyframe-uniqueness) and no stylesheet to edit: the entrance
 * is a transition the element runs once, on mount. It is gated `motion-safe`,
 * so reduced motion gets the new words with no motion at all.
 */

/* ── the swap's entrance ─────────────────────────────────────────────────── */

/**
 * Content replaced when the perspective changes: give it `key={perspective}`
 * and it rises in on mount.
 *
 * Blur does work a fade alone cannot here. Words are being replaced by
 * different words in the same box, and a plain fade of two blocks of text
 * reads as two things overlapping; three pixels of blur at the start bridges
 * them into one change. Under 300ms on the house easing, with the press
 * feedback living on the control that caused it: a toggle is occasional, so it
 * earns a standard animation and no more.
 */
function Swapped({
  delayMs = 0,
  className,
  children,
}: {
  delayMs?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        "blur-[0px] transition-[opacity,filter,translate] duration-200 ease-emphasis",
        "motion-safe:starting:translate-y-1.5 motion-safe:starting:opacity-0 motion-safe:starting:blur-[3px]",
        "motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── the toggle ──────────────────────────────────────────────────────────── */

/**
 * The segmented pill, on the cadence toggle's cadence (sections/pricing/
 * plan-cards.tsx): a `role="group"`, one `aria-hidden` thumb sliding on
 * `--mkt-tabs-dur`, `aria-pressed` on the real buttons. Two of those are
 * load-bearing enough to say out loud: the thumb is a SEPARATE element, so the
 * moving part is a transform rather than a background colour crossing two
 * labels; and `aria-pressed` rather than `aria-selected`, because these are
 * buttons that rewrite the page under them, not tabs over panels.
 */
function PerspectiveToggle({
  value,
  onChange,
}: {
  value: LoopPerspective;
  onChange: (next: LoopPerspective) => void;
}) {
  const index = LOOP_PERSPECTIVES.findIndex((p) => p.id === value);
  return (
    <div
      role="group"
      aria-label="Whose side of the loop to read"
      className="relative grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 select-none"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.75rem)/2)] rounded-md bg-background transition-transform [transition-duration:var(--mkt-tabs-dur)] ease-emphasis motion-reduce:transition-none"
        style={{ transform: `translateX(calc(${index} * (100% + 0.25rem)))` }}
      />
      {LOOP_PERSPECTIVES.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={value === p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            "relative z-10 rounded-md px-7 py-1.5 text-sm font-medium transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/50",
            "active:scale-[0.98] motion-reduce:active:scale-100",
            value === p.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ── the spine ───────────────────────────────────────────────────────────── */

export function Spine() {
  const [perspective, setPerspective] = useState<LoopPerspective>("host");
  const steps = loopSteps(perspective);
  const legend =
    LOOP_PERSPECTIVES.find((p) => p.id === perspective)?.legend ?? "";
  const other = LOOP_PERSPECTIVES.find((p) => p.id !== perspective);
  const top = useRef<HTMLDivElement | null>(null);

  /**
   * The foot's invitation, and the one place this section moves the page. A
   * reader who has just finished the host's six is a couple of thousand pixels
   * past the toggle, so the answer to "now show me the other side" has to be
   * where they are standing; it takes them back to the top of the spine, so the
   * re-read starts at step one rather than in the middle of a set they have not
   * seen. `behavior` follows the preference rather than the default, because a
   * smooth jump of this length is exactly the motion reduced motion is for.
   */
  const flip = useCallback(() => {
    setPerspective((current) => (current === "host" ? "guest" : "host"));
    top.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }, []);

  return (
    <SectionShell
      eyebrow="The walkthrough"
      heading="Six steps, both sides."
      subhead="What you set up as the host, and what the room sees. Switch sides and the whole walkthrough changes with you."
    >
      {/* The toggle's own scroll anchor: the foot's flip lands here, clearing
          the sticky header the way SectionShell's own ids do. */}
      <div
        ref={top}
        className="mt-10 flex scroll-mt-[calc(var(--mkt-header-h)+2rem)] flex-col items-center gap-3"
      >
        <PerspectiveToggle value={perspective} onChange={setPerspective} />
        {/* The legend swaps with the pill, so the control says what it just
            did rather than leaving it to be inferred from six steps below. */}
        <Swapped key={`legend-${perspective}`}>
          <Caption className="text-center">{legend}</Caption>
        </Swapped>
      </div>

      <div className="mx-auto mt-16 flex max-w-5xl flex-col gap-20 sm:mt-20 sm:gap-24">
        {steps.map((step, i) => (
          <Reveal
            /* ★ THE INDEX, NEVER step.id: see the header note. */
            key={`step-${i}`}
            className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-12"
          >
            <div
              className={cn(
                "flex flex-col gap-3 lg:col-span-5",
                i % 2 === 1 && "lg:order-2",
              )}
            >
              {/* The number is the one thing a toggle leaves alone. */}
              <Caption
                data-mkt-reveal
                className="text-sm tabular-nums"
                style={{ "--i": 0 } as CSSProperties}
              >
                {String(i + 1).padStart(2, "0")}
              </Caption>
              <div data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
                <Swapped
                  key={`copy-${perspective}`}
                  className="flex flex-col gap-3"
                >
                  <h3 className="font-heading text-subsection">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
                    {step.body}
                  </p>
                  <div>
                    <LearnMoreLink href={step.href}>
                      {step.linkLabel}
                    </LearnMoreLink>
                  </div>
                </Swapped>
              </div>
            </div>
            {/* ONE width for every picture, centred in a column that never
                changes size: the old frames ran 280px to 448px with their own
                insets, so the two-column rhythm wobbled all the way down the
                spine. The picture arrives with the step's body, never before
                it. */}
            <div
              aria-hidden
              data-mkt-reveal
              className={cn("lg:col-span-7", i % 2 === 1 && "lg:order-1")}
              style={{ "--i": 2 } as CSSProperties}
            >
              <div className="mx-auto w-full max-w-md">
                <Swapped key={`picture-${perspective}`} delayMs={60}>
                  <StepPicture id={step.id} />
                </Swapped>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* The foot: the other side first (a reader who just finished six steps
          is the one reader ready for the other six), then the one article that
          retells the whole loop plainly. STILL by convention: a pointer you
          find, not a beat that performs. */}
      <div className="mt-20 flex flex-col items-center gap-8 text-center">
        <button
          type="button"
          onClick={flip}
          className="mkt-learn inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium transition-[color,border-color,transform,scale] duration-150 ease-emphasis outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100"
        >
          Now read it as {other?.id === "guest" ? "a guest" : "the host"}
        </button>
        <div className="flex flex-col items-center gap-2">
          <Caption>The exact details live in the help center</Caption>
          <LearnMoreLink href="/help/how-partyreel-works">
            Read the full how-to
          </LearnMoreLink>
        </div>
      </div>
    </SectionShell>
  );
}
