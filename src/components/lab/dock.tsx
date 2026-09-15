"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { withDesignKey } from "@/lib/design-gate/links";
import { cn } from "@/lib/utils";

import { clearCandidate, useTunerCandidate } from "@/components/dev/candidate-style";

import { useBoardPage } from "./board-page-context";
import { setLabPref, useLabPrefs } from "./lab-prefs";
import { Toggle } from "./toggle";

/**
 * THE BOARD DOCK (round four of the review wave, 2026-09-15): a board's
 * page-wide controls, always on screen. Will's note on the palette board:
 * "the GUI control should be fixed so that variants can be toggled on
 * different previews anywhere on the page for better back-and-forth
 * comparisons"; the floating board's sticky bar was "a great example" and is
 * the model here. Put the switches that change the whole page in the dock
 * (the candidate, the ground, the canvas, the ramp, Replay); a control that
 * only changes one specimen stays beside that specimen.
 *
 * It sticks under the shell's top bar from `sm` up and stays static on a
 * phone (at 375 a bar this tall covers the specimen, which is worse than
 * scrolling back; the floating board measured it). It writes its own height
 * to `--board-dock-h` and the sum with the top bar to `scroll-padding-top` on
 * <html>, so a board's anchors land under the dock rather than beneath it and
 * a board that needs the number can read it. Its right end carries the
 * shell's reading controls (Fit or 1:1, the sidebar), the Sections menu and
 * the neighbours when the page provides them (board-page-context.tsx), and
 * the way back to the desk, so a board never has to draw them.
 */
export function BoardDock({
  children,
  aside,
  label = "The board's controls",
  className,
}: {
  /** The board's switches; rows wrap on their own, or pass your own rows. */
  children: React.ReactNode;
  /** A short cluster kept beside the shell controls (a Replay, an Apply). */
  aside?: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  const { fit, sidebar } = useLabPrefs();
  const page = useBoardPage();
  // The gate key rides the URL; read it from the browser (useSearchParams
  // would want a Suspense boundary of its own). The Desk link is client-only
  // anyway: it renders keyless on the server and keyed after hydration.
  const key = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("key"),
    () => null,
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = document.documentElement;
    const sync = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      const top = parseFloat(
        getComputedStyle(html).getPropertyValue("--lab-topbar-h"),
      );
      html.style.scrollPaddingTop = `${h + (Number.isFinite(top) ? top : 0) + 8}px`;
      html.style.setProperty("--board-dock-h", `${h}px`);
    };
    sync();
    // A ResizeObserver does not re-fire in a background tab (the type-scale
    // track measured 246px then 97px on a 49px dock), so re-sync one frame
    // after mount and on every window resize as well.
    const raf = requestAnimationFrame(sync);
    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sync);
      ro.disconnect();
      html.style.scrollPaddingTop = "";
      html.style.removeProperty("--board-dock-h");
    };
  }, []);

  const pill = DOCK_PILL;

  return (
    <div
      ref={ref}
      data-board-dock
      role="region"
      aria-label={label}
      className={cn(
        "z-30 -mx-4 border-b border-border bg-background/90 px-4 py-2 backdrop-blur sm:sticky sm:top-[var(--lab-topbar-h,0px)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        {/* On a phone the board's switches take the whole row and the shell's
            cluster wraps under them (a basis-0 cell never forced the wrap and
            squeezed a board's switches into a 44px column at 375; brand-voice). */}
        <div
          className={cn(
            "flex basis-full flex-wrap items-center gap-2 sm:min-w-0 sm:flex-1 sm:basis-auto",
            !open && "hidden",
          )}
        >
          {children}
        </div>
        <div className="flex basis-full flex-wrap items-center gap-2 sm:ml-auto sm:basis-auto">
          {aside}
          {page && page.sections.length > 0 && (
            <details className="relative">
              <summary className={cn(pill, "cursor-pointer list-none")}>
                Sections
              </summary>
              <ul className="absolute right-0 z-40 mt-1 max-h-[60vh] w-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-[12px] shadow-md">
                {page.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${page.id}-${s.id}`}
                      className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <span className="tabular-nums">{i + 1}.</span> {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <Toggle
            ariaLabel="Stage scale"
            options={[
              { id: "true", label: "1:1" },
              { id: "zoom", label: "Fit" },
            ]}
            value={fit}
            onChange={(v) => setLabPref("fit", v)}
          />
          <button
            type="button"
            onClick={() =>
              setLabPref(
                "sidebar",
                sidebar === "collapsed" ? "open" : "collapsed",
              )
            }
            className={pill}
          >
            {sidebar === "collapsed" ? "Sidebar" : "Hide sidebar"}
          </button>
          {page?.prev && (
            <Link
              href={withDesignKey(page.prev.href, key)}
              className={pill}
              title={page.prev.label}
            >
              Prev
            </Link>
          )}
          {page?.next && (
            <Link
              href={withDesignKey(page.next.href, key)}
              className={pill}
              title={page.next.label}
            >
              Next
            </Link>
          )}
          <Link href={withDesignKey("/design/lab", key)} className={pill}>
            Desk
          </Link>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={pill}
          >
            {open ? "Collapse" : "Controls"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────  THE DOCK'S ATOMS  ────────────────────────── */

/**
 * The pill every dock control wears. Exported because the board-state knobs,
 * the walk and the review panel all draw one and three copies of a border
 * radius is how a dock stops looking like one thing.
 */
export const DOCK_PILL =
  "rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground";

/**
 * A NAMED CONTROL (lifted from the light board's `Knob`, 2026-09-15).
 *
 * The `Toggle` carries an ariaLabel and nothing visible, which is right for a
 * board with one switch and wrong for a dock with five: "Accent | Identity"
 * beside "House five | Warm | Cool" with no names on them is the first thing a
 * stranger stumbles over, and prose further down does not repair it, because
 * the prose is read after the control is pressed. The name goes on the control.
 */
export function Knob({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

/** One wrapping row of knobs inside the dock. A board with more switches than
 *  fit a line groups them rather than letting the wrap choose the grouping. */
export function DockRow({
  label,
  children,
}: {
  /** Names the row for a screen reader; the knobs carry the visible names. */
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className="flex min-w-0 flex-wrap items-center gap-2"
    >
      {children}
    </div>
  );
}

/**
 * WHICH BLOCK STANDS ON THE SITE, AND THE SWITCH OFF (lifted from the light
 * board's `AppliedCandidate`).
 *
 * Applying a block is a per-candidate decision and its button stays beside the
 * candidate; seeing that one is live, and turning it off, is page-wide. It is
 * the one thing in the dock that is sometimes absent: it renders nothing while
 * no block stands, so the dock never carries an empty slot. The label truncates
 * rather than wraps, so a long candidate name cannot push the dock to a second
 * row at 375.
 */
export function AppliedBadge() {
  const applied = useTunerCandidate();
  if (!applied) return null;
  return (
    <span className="flex items-center gap-1.5 rounded-lg border border-foreground/25 bg-card py-1 pr-1 pl-2 text-[11px]">
      <span className="text-muted-foreground">On the site</span>
      <span
        title={applied.label}
        className="max-w-[14ch] truncate font-medium text-foreground sm:max-w-[26ch]"
      >
        {applied.label.replace(/^[^:]+:\s*/, "")}
      </span>
      <button
        type="button"
        onClick={clearCandidate}
        className="rounded-[calc(var(--radius-action-sm)-2px)] border border-border px-2 py-0.5 font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
      >
        Clear
      </button>
    </span>
  );
}

/**
 * ONE REPLAY FOR EVERY ONE-SHOT ON THE BOARD. A one-shot fires by REMOUNT, not
 * by an animationend listener, so an incrementing key is the whole mechanism
 * (useReplay in motion.ts holds it). The count is on the label because a replay
 * that looks identical to the last one is indistinguishable from a dead button.
 */
export function ReplayButton({
  runId,
  onReplay,
}: {
  runId: number;
  onReplay: () => void;
}) {
  return (
    <button type="button" onClick={onReplay} className={DOCK_PILL}>
      {runId === 0 ? "Replay" : `Replay ${runId}`}
    </button>
  );
}

/**
 * LIVE OR REST, board-wide. "Every lamp's rest state designed, not absent" is a
 * claim about the whole page, and a per-specimen toggle would let it be true in
 * one place and quietly false in the next, so this is never a per-part control.
 * The board's own sheet does the freezing, scoped to its own animations: a
 * blanket `animation: none` also freezes the marketing reveal grammar, whose
 * pre-animation state is opacity 0, and the board reads as broken.
 */
export function MotionToggle({
  rest,
  onChange,
}: {
  rest: boolean;
  onChange: (rest: boolean) => void;
}) {
  return (
    <Knob label="Motion">
      <Toggle
        ariaLabel="Motion"
        options={[
          { id: "live", label: "Live" },
          { id: "rest", label: "Rest" },
        ]}
        value={rest ? "rest" : "live"}
        onChange={(v) => onChange(v === "rest")}
      />
    </Knob>
  );
}
