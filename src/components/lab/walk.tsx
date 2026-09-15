"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { anchorFor, type BoardSpec } from "./board-spec";
import { DOCK_PILL } from "./dock";

/**
 * THE LAB'S GATE KEY, read from the browser without a state-in-effect.
 *
 * Every /design route is gated and the key rides the query string, so a board
 * that builds a URL (a frame's src, a walk link, the way back to the desk)
 * needs it. `useSearchParams` would want a Suspense boundary of its own and the
 * search string is a primitive that never changes under a board, so an external
 * store read is both SSR-safe and stable.
 *
 * ★ THE THREE VALUES ARE DIFFERENT AND ALL THREE MATTER. `undefined` means the
 * browser has not answered yet (the server render): a gated frame must WAIT.
 * `null` means the browser answered and there is no key, which is the normal
 * state in local dev where the gate is open: a gated frame may load. A string
 * is the key. Collapsing undefined into null is what makes a gated frame paint
 * the lab's 404 and then reload.
 */
export function useDesignKey(): string | null | undefined {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("key"),
    () => undefined,
  );
}

/**
 * THE GUIDED WALK: the board's `lookFirst`, executable.
 *
 * A board is tens of thousands of pixels, and the author knows the six places a
 * reviewer should look and in which state. Writing that as prose at the top
 * ("scroll to the composer, set the register to identity, then compare...") is
 * a set of instructions the reviewer has to execute by hand, and nobody does.
 * So the board executes them: each step scrolls to its section AND sets the
 * declared state it was written in, and the reviewer presses Next.
 *
 * ★ IT SETS THE STATE, WHICH IS WHY IT LIVES IN THE DOCK AND NOT IN THE PAGE.
 * A walk step is a coordinate in (section, state) space; a link is only half of
 * one. A step that lands on the right section in the wrong state shows the
 * reviewer something the note does not describe, which is worse than no walk.
 *
 * ★ AND THE SCROLL IS `scrollIntoView`, NOT A HASH CHANGE. Writing the hash also
 * pushes a history entry, so a six-step walk leaves six entries between the
 * reader and the page he came from. The dock's own Sections menu uses hrefs
 * because those ARE navigations; a walk is not.
 */
export function Walk({
  spec,
  setState,
  className,
}: {
  spec: BoardSpec;
  setState: (patch: Record<string, string>) => void;
  className?: string;
}) {
  const steps = useMemo(() => spec.lookFirst ?? [], [spec.lookFirst]);
  const [at, setAt] = useState<number | null>(null);

  const go = useCallback(
    (i: number) => {
      const step = steps[i];
      if (!step) return;
      setAt(i);
      if (step.state) setState(step.state as Record<string, string>);
      const el = document.getElementById(anchorFor(spec.id, step.section));
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [steps, setState, spec.id],
  );

  if (steps.length === 0) return null;
  const step = at === null ? null : steps[at];

  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {step === null ? (
        <button type="button" onClick={() => go(0)} className={DOCK_PILL}>
          Look first
        </button>
      ) : (
        <>
          <span className="rounded-lg border border-foreground/25 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground">
            Walk <span className="tabular-nums">{at! + 1}</span> of{" "}
            <span className="tabular-nums">{steps.length}</span>
          </span>
          <button
            type="button"
            onClick={() => go(at! - 1)}
            disabled={at === 0}
            className={cn(DOCK_PILL, "disabled:opacity-40")}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => go(at! + 1)}
            disabled={at === steps.length - 1}
            className={cn(DOCK_PILL, "disabled:opacity-40")}
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setAt(null)}
            className={DOCK_PILL}
          >
            End
          </button>
          <span className="max-w-[40ch] text-[11px] leading-snug text-muted-foreground">
            {step.note}
          </span>
        </>
      )}
    </span>
  );
}
