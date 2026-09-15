"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { withDesignKey } from "@/lib/design-gate/links";
import { cn } from "@/lib/utils";

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
 * It sticks to the top from `sm` up and stays static on a phone (at 375 a bar
 * this tall covers the specimen, which is worse than scrolling back; the
 * floating board measured it). It writes its own height to `scroll-padding-top`
 * on <html> and to `--board-dock-h`, so a board's anchors land under the dock
 * rather than beneath it and a board that needs the number can read it. Its
 * right end carries the shell's reading controls (Fit or 1:1, the sidebar) and
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
  const { fit, bleed } = useLabPrefs();
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
      html.style.scrollPaddingTop = `${h + 8}px`;
      html.style.setProperty("--board-dock-h", `${h}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      html.style.scrollPaddingTop = "";
      html.style.removeProperty("--board-dock-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      data-board-dock
      role="region"
      aria-label={label}
      className={cn(
        "z-30 -mx-4 border-b border-border bg-background/90 px-4 py-2 backdrop-blur sm:sticky sm:top-0",
        className,
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-wrap items-center gap-2",
            !open && "hidden",
          )}
        >
          {children}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {aside}
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
            onClick={() => setLabPref("bleed", !bleed)}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {bleed ? "Sidebar" : "Hide sidebar"}
          </button>
          <Link
            href={withDesignKey("/design/c", key)}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Desk
          </Link>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {open ? "Collapse" : "Controls"}
          </button>
        </div>
      </div>
    </div>
  );
}
