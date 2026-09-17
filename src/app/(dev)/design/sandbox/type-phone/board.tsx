"use client";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";
import { cn } from "@/lib/utils";

import { TYPE_PHONE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE.
 *
 * `defineExploration` derived the sections, the controls and every state patch,
 * so what is left to write is the one thing only a person can: what each option
 * LOOKS like.
 *
 * ★ EVERY STEP OF THE LADDER IS A `vw` CLAMP, SO A NARROW DIV IS A LIE. These
 * were first drawn as a 375-wide column inside the board page and every caption
 * was wrong: `clamp(4rem, 1.887rem + 9.01vw, 10rem)` reads the BROWSER's width,
 * not its container's, so a "375" column on a 1550 page rendered the masthead at
 * 160px while the label said 64. Measured, not guessed: `getComputedStyle`
 * returned `fontSize: 160px` inside a box 375 wide.
 *
 * A real viewport is the only thing a `vw` obeys, and a same-origin iframe is
 * the only real viewport the lab has. `Frame` takes `children` and portals a
 * composition INTO the frame's document, so no scene route is needed: the
 * markup below is the shipped markup, rendered at a true 375, and every number
 * in the spec is the number on screen.
 */

/** A 375 viewport, sized to its content: an empty half-frame reads as a bug. */
const PHONE = { w: 375, h: 215 } as const;

/**
 * /about and /help: a `prose` h2, then the sub-head under it, then body copy.
 * The whole question is which of the first two is louder.
 */
function Subhead({ step, title }: { step: string; title: string }) {
  return (
    <Frame id={`subhead-${step}`} {...PHONE} title={title} className="mx-auto">
      <div className="min-h-full bg-background px-5 py-6 text-foreground">
        <h2 className="font-heading text-prose text-balance">
          What we are building
        </h2>
        <div className="mt-6 grid gap-2">
          <h3 className={cn("font-heading", step)}>One place, not five</h3>
          <p className="text-[15px] leading-7 text-pretty text-muted-foreground">
            Every photo and video from the night lands in one album, at the size
            it was shot, without anyone installing anything.
          </p>
        </div>
      </div>
    </Frame>
  );
}

/** The marketing 404, at the step its title wears. */
function DeadLink({ step, title }: { step: string; title: string }) {
  return (
    <Frame id={`dead-${step}`} w={375} h={235} title={title} className="mx-auto">
      <div className="flex min-h-full flex-col gap-3 bg-background px-5 py-6 text-foreground">
        <span className="text-sm font-medium text-brand">404</span>
        {/* Copied from not-found-screen.tsx: no font-semibold, no
            tracking-tight (it resolves to 0em and would cancel the step). */}
        <h1 className={cn("font-heading text-balance", step)}>
          That page has moved on
        </h1>
        <p className="text-pretty text-muted-foreground">
          The link you followed does not lead anywhere any more. The pages below
          are the ones people usually want.
        </p>
      </div>
    </Frame>
  );
}

/**
 * A masthead at the display step. The rule is the line the caps should sit on,
 * so the gap between them IS the question.
 *
 * ★ `1lh` IS THE HALF-LEADING, EXACTLY. The flat trim bundles two things: the
 * space the line box leaves above the caps (which tracks the leading, and the
 * leading is itself a clamp) and the font's own ascender-to-cap gap (a
 * constant). One number can only be right where those happen to sum correctly,
 * which is 1440. `calc((1lh - 1em) / 2 - 0.05em)` separates them: the first
 * term is the half-leading at whatever width is being drawn, the second is the
 * font constant the flat value implies at 1440.
 */
function Trim({ trim, title }: { trim: string; title: string }) {
  return (
    <Frame id={`trim-${title}`} w={375} h={215} title={title} className="mx-auto">
      <div className="min-h-full bg-background px-5 py-6 text-foreground">
        <span className="block h-px w-full bg-brand/60" />
        <p
          className={cn(
            "mkt-name py-[0.08em] text-display whitespace-nowrap",
            trim,
          )}
        >
          About
        </p>
        <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
          The gap between the rule and the caps is what the trim takes back.
        </p>
      </div>
    </Frame>
  );
}

const PREVIEWS: PreviewsFor<typeof TYPE_PHONE> = {
  "subhead.today": (
    <Subhead step="text-xl sm:text-2xl" title="text-xl: 20px at 375" />
  ),
  "subhead.subsection": (
    <Subhead step="text-subsection" title="text-subsection: 18px at 375" />
  ),
  "dead-link.prose": (
    <DeadLink step="text-prose" title="text-prose: 18px at 375" />
  ),
  "dead-link.section": (
    <DeadLink step="text-section" title="text-section: 24px at 375" />
  ),
  "display-trim.flat": (
    <Trim trim="-mt-[0.12em]" title="-0.12em flat: what ships" />
  ),
  "display-trim.clamped": (
    <Trim
      trim="mt-[calc((1lh-1em)/2-0.05em)]"
      title="a trim that tracks the leading"
    />
  ),
};

export function TypePhoneBoard() {
  return <ExplorationBoard spec={TYPE_PHONE} previews={PREVIEWS} />;
}

