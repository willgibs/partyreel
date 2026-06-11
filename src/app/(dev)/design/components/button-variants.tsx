import { ImageUp } from "lucide-react";

import { Variant } from "./variant-frame";

/**
 * Touchpoint: the pressable language. Same actions in three shape systems,
 * plus the size ramp. Every sample carries the standard 140ms press feedback;
 * hold one down to judge the feel, not just the look.
 */
export function ButtonVariants() {
  return (
    <div aria-hidden className="space-y-8 py-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Variant
          n={1}
          name="Soft rectangle"
          rationale="The current geometry (radius 0.5rem): composed, neutral, disappears behind the label."
          framed={false}
        >
          <ShapeRow radius="var(--radius)" />
        </Variant>
        <Variant
          n={2}
          name="Pill"
          rationale="Fully round: friendlier and more thumbable, reads as a chip language across the app."
          framed={false}
        >
          <ShapeRow radius="999px" />
        </Variant>
        <Variant
          n={3}
          name="Sharp"
          rationale="Near-square corners (radius 0.2rem): the most editorial and print-like, pairs hardest with the serif."
          framed={false}
        >
          <ShapeRow radius="0.2rem" />
        </Variant>
      </div>

      <Variant
        n={4}
        name="Sharp surfaces, round actions"
        rationale="THE SELECTED SYSTEM: general UI stays sharp (6px cards), interactive elements round to 16px at the 40px standard and scale by height - the radius contrast itself says pressable. One token set flips it to full pill later."
        framed={false}
      >
        <div data-dir-card className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              data-dir-press
              className="h-12 rounded-[var(--radius-action-lg)] bg-primary px-7 text-base font-medium text-primary-foreground"
            >
              Hero · 19px
            </button>
            <button
              data-dir-press
              className="h-10 rounded-[var(--radius-action)] bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Standard · 16px
            </button>
            <button
              data-dir-press
              className="h-8 rounded-[var(--radius-action-sm)] bg-primary px-3.5 text-xs font-medium text-primary-foreground"
            >
              Compact · 13px
            </button>
            <button
              data-dir-press
              className="h-10 rounded-[var(--radius-action)] border border-border bg-card px-5 text-sm font-medium"
            >
              Secondary
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {/* The contrast on one row: sharp input surface, round action. */}
            <div className="h-10 flex-1 rounded-[var(--radius)] border border-input bg-background px-3.5 text-sm leading-10 text-muted-foreground">
              Sharp surface (inputs, cards)
            </div>
            <button
              data-dir-press
              className="h-10 shrink-0 rounded-[var(--radius-action)] bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Round action
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tokens: --radius (surfaces) + --radius-action / -lg / -sm (height
            ratio 0.4). Retune or go full pill by changing the action tokens
            once; every instance follows.
          </p>
        </div>
      </Variant>

      <div data-dir-card className="p-5">
        <p className="text-[11px] font-medium text-muted-foreground">
          Size ramp · one shape, four jobs
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            data-dir-press
            className="h-12 rounded-[var(--radius)] bg-primary px-7 text-base font-medium text-primary-foreground"
          >
            Hero CTA · 48px
          </button>
          <button
            data-dir-press
            className="h-10 rounded-[var(--radius)] bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Guest standard · 40px
          </button>
          <button
            data-dir-press
            className="h-8 rounded-[var(--radius)] bg-primary px-3.5 text-xs font-medium text-primary-foreground"
          >
            Host compact · 32px
          </button>
          <button
            data-dir-press
            aria-label="Add photos"
            className="flex size-10 items-center justify-center rounded-[var(--radius)] border border-border bg-card"
          >
            <ImageUp className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Touch targets never drop below 44px on guest surfaces; Compact is
          host/desktop only.
        </p>
      </div>
    </div>
  );
}

function ShapeRow({ radius }: { radius: string }) {
  return (
    <div data-dir-card className="flex flex-col gap-2.5 p-5">
      <button
        data-dir-press
        className="h-11 w-full bg-primary text-sm font-medium text-primary-foreground"
        style={{ borderRadius: radius }}
      >
        Add photos
      </button>
      <button
        data-dir-press
        className="h-11 w-full border border-border bg-card text-sm font-medium"
        style={{ borderRadius: radius }}
      >
        Save event
      </button>
      {/* Quiet tier gets a whisper of surface here so its SHAPE is judgeable
          in the comparison; in the app it stays bare until hover/press. */}
      <button
        data-dir-press
        className="h-11 w-full bg-muted/50 text-sm font-medium text-muted-foreground"
        style={{ borderRadius: radius }}
      >
        Just browsing
      </button>
    </div>
  );
}
