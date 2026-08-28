"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, RotateCcw, SlidersHorizontal, X } from "lucide-react";

import type { TunerControl } from "@/components/dev/motion-tuner-config";

/**
 * A dev-only, design-key-gated motion tuning panel (S4·0) — the harness that
 * makes "build-direct + tune-live" (Will, 2026-06-21) work: finetune the polish
 * timings LIVE on the real (prod) host event page, no rebuild loop.
 *
 * HOW IT WORKS: each control binds to a CSS custom property written as an
 * inline style on the element that OWNS that token; the polish CSS reads
 * `var(--tune-x, <baked default>)`, so the panel is a pure NO-OP until a control
 * moves, and unmount (navigation/reload) clears every var it set.
 *
 * ★ WRITE TARGET IS NOT ALWAYS <html> (fixed 2026-08-28, caught while wiring the
 * nav knobs). The app's --tune-* tokens are only ever var() fallbacks, so an
 * inline value on <html> inherits down and wins. The marketing --mkt-* tokens
 * are DECLARED on the [data-mkt] wrapper (marketing.css's containment contract
 * forbids :root), and a declaration on a descendant beats an inherited value
 * from an ancestor no matter how specific that ancestor's rule is — so every
 * --mkt-* knob written to <html> was silently doing nothing. Verified live:
 * setting --mkt-reveal-ms on <html> left the [data-mkt] scope reading .7s.
 * tunerScope() routes each var to the element that actually declares it. Drag -> feel it -> "Copy CSS" ->
 * bake the value as the globals.css default -> "Reset". In-house on purpose (no
 * lil-gui/leva prod dep), tailored to CSS-var tuning, config-driven so each
 * polish increment adds knobs without touching this file.
 *
 * GATING: the SERVER page that mounts this checks isDesignGateOpen() (see
 * app/(dev)/design/gate.ts) — opt-in via `?key=`, dev-open, prod requires the
 * timing-safe match. So this component never renders for a real host; it only
 * appears for a designer who arrived with the key. It still ships in the prod
 * bundle (tiny + inert) BY DESIGN, because tune-live happens on partyreel.com.
 *
 * Portaled to <body> so it floats above the route-fade transform (a transformed
 * ancestor breaks position:fixed) and above the focused-review Dialog (z-50);
 * useSyncExternalStore gives an SSR-safe mounted guard (mirrors the lab's
 * ThemeToggle) without a set-state-in-effect.
 */

function controlCssValue(control: TunerControl, raw: number | string): string {
  return control.kind === "range" ? `${raw}${control.unit}` : String(raw);
}

/** The element an override has to be written on to actually take effect — see
 *  the WRITE TARGET note above. Falls back to <html> if the marketing wrapper
 *  isn't on the page (then the var is a plain fallback and inheritance works). */
function tunerScope(cssVar: string): HTMLElement {
  if (cssVar.startsWith("--mkt-")) {
    const scope = document.querySelector<HTMLElement>("[data-mkt]");
    if (scope) return scope;
  }
  return document.documentElement;
}

// SSR-safe "are we on the client yet" without set-state-in-effect (the lab's
// ThemeToggle uses the same shape). Server snapshot = false -> renders nothing
// during SSR; client first render = true.
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function MotionTuner({ controls }: { controls: TunerControl[] }) {
  const mounted = useMounted();
  const [open, setOpen] = useState(true);
  const [side, setSide] = useState<"right" | "left">("right");
  const [copied, setCopied] = useState(false);
  // Raw control values (number for range, string for select). Initialized to the
  // baked defaults (no DOM read -> SSR-safe); writes push to the <html> inline
  // style on change only.
  const [values, setValues] = useState<Record<string, number | string>>(() =>
    Object.fromEntries(controls.map((c) => [c.cssVar, c.default])),
  );

  // Clear every var we set on unmount (navigation/reload) so the inline overrides
  // never outlive the panel and silently mask the baked defaults. Cleanup-only ->
  // no set-state-in-effect.
  useEffect(() => {
    return () => {
      for (const c of controls)
        tunerScope(c.cssVar).style.removeProperty(c.cssVar);
    };
  }, [controls]);

  if (!mounted) return null;

  function update(control: TunerControl, raw: number | string) {
    setValues((v) => ({ ...v, [control.cssVar]: raw }));
    tunerScope(control.cssVar).style.setProperty(
      control.cssVar,
      controlCssValue(control, raw),
    );
    setCopied(false);
  }

  function reset() {
    for (const c of controls)
      tunerScope(c.cssVar).style.removeProperty(c.cssVar);
    setValues(Object.fromEntries(controls.map((c) => [c.cssVar, c.default])));
    setCopied(false);
  }

  // Only the controls moved off their default — exactly what to bake.
  function changedControls() {
    return controls.filter((c) => values[c.cssVar] !== c.default);
  }

  async function copyCss() {
    const changed = changedControls();
    // --mkt-* tokens bake onto [data-mkt] in marketing.css, never :root (the
    // containment contract), so they get their own block — a `:root {}` block
    // would be dead the moment it was pasted, for the same reason the writes
    // above needed a scope.
    const block = (selector: string, list: TunerControl[]) =>
      list.length === 0
        ? ""
        : `${selector} {\n${list
            .map(
              (c) => `  ${c.cssVar}: ${controlCssValue(c, values[c.cssVar])};`,
            )
            .join("\n")}\n}`;
    const text =
      changed.length === 0
        ? ":root {\n  /* no changes from the baked defaults */\n}"
        : [
            block(
              ":root",
              changed.filter((c) => !c.cssVar.startsWith("--mkt-")),
            ),
            block(
              "[data-mkt]",
              changed.filter((c) => c.cssVar.startsWith("--mkt-")),
            ),
          ]
            .filter(Boolean)
            .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard can reject without a user gesture / over http; the on-screen
      // readout is the fallback (the values are visible next to each control).
      setCopied(false);
    }
  }

  const changedCount = changedControls().length;

  const panel = (
    <div
      className={`fixed bottom-3 z-[9999] font-mono text-[11px] ${
        side === "right" ? "right-3" : "left-3"
      }`}
      // Dev tool: keep it visually distinct from product chrome and never let it
      // inherit the page's tuned vars.
      data-motion-tuner
    >
      {open ? (
        <div className="w-64 rounded-lg border border-white/15 bg-neutral-900/95 text-neutral-100 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <span className="flex items-center gap-1.5 font-semibold tracking-tight">
              <SlidersHorizontal className="size-3.5" /> Motion tuner
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setSide((s) => (s === "right" ? "left" : "right"))
                }
                className="rounded px-1.5 py-0.5 text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
                title="Flip to the other corner"
              >
                {side === "right" ? "←" : "→"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-1 py-0.5 text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
                title="Collapse"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto px-3 py-3">
            {controls.length === 0 && (
              <p className="text-neutral-400">No knobs wired yet.</p>
            )}
            {controls.map((c) => {
              const changed = values[c.cssVar] !== c.default;
              return (
                <div key={c.cssVar} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-neutral-300">{c.label}</label>
                    <span
                      className={
                        changed ? "text-amber-300" : "text-neutral-500"
                      }
                    >
                      {c.kind === "range"
                        ? `${values[c.cssVar]}${c.unit}`
                        : c.options.find((o) => o.value === values[c.cssVar])
                            ?.label}
                    </span>
                  </div>
                  {c.kind === "range" ? (
                    <input
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={Number(values[c.cssVar])}
                      onChange={(e) => update(c, Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  ) : (
                    <select
                      value={String(values[c.cssVar])}
                      onChange={(e) => update(c, e.target.value)}
                      className="w-full rounded border border-white/15 bg-neutral-800 px-1.5 py-1 text-neutral-100"
                    >
                      {c.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
            <button
              type="button"
              onClick={copyCss}
              className="flex flex-1 items-center justify-center gap-1.5 rounded bg-white/10 py-1.5 hover:bg-white/15"
              title="Copy the changed vars as CSS to bake into globals.css"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied
                ? "Copied"
                : `Copy CSS${changedCount ? ` (${changedCount})` : ""}`}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-1.5 rounded bg-white/10 px-2 py-1.5 hover:bg-white/15"
              title="Drop all inline overrides (back to baked defaults)"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-900/95 px-3 py-2 text-neutral-100 shadow-xl backdrop-blur-sm hover:bg-neutral-800"
          title="Open the motion tuner"
        >
          <SlidersHorizontal className="size-3.5" />
          {changedCount > 0 && (
            <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-neutral-900">
              {changedCount}
            </span>
          )}
        </button>
      )}
    </div>
  );

  return createPortal(panel, document.body);
}
