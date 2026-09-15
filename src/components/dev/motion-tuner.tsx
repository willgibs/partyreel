"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, RotateCcw, SlidersHorizontal, X } from "lucide-react";

import {
  TUNER_GROUP_LABEL,
  type TunerControl,
  type TunerGroup,
} from "@/components/dev/motion-tuner-config";
import { useTunerCandidate } from "@/components/dev/candidate-style";
import {
  clearCandidate,
  clearTunerValues,
  getTunerServerSnapshot,
  getTunerSnapshot,
  hydrateTuner,
  setTunerValue,
  subscribeTuner,
  type TunerValue,
} from "@/components/dev/tuner-store";

/**
 * A dev-only, design-key-gated tuning panel (S4·0; rebuilt for the rounding
 * and tweaking GUI round, 2026-09-14): the harness that makes "build-direct +
 * tune-live" (Will, 2026-06-21) work: finetune the polish timings and the
 * radius tokens LIVE on the real pages, no rebuild loop.
 *
 * HOW IT WORKS: each control binds to a CSS custom property written as an
 * inline style on the element that OWNS that token (tunerScope below); the CSS
 * reads `var(--tune-x, <baked default>)` or the token itself, so the panel is a
 * pure NO-OP until a control moves. The working set lives in tuner-store.ts
 * (persisted, hydrated once, re-applied on every mount), so a value survives a
 * Replay, a navigation out of the cinema group and a reload; Reset is what
 * clears it, and the badge on the collapsed pill always counts what stands.
 *
 * ★ WRITE TARGET IS NOT ALWAYS <html> (fixed 2026-08-28, caught while wiring the
 * nav knobs). The app's --tune-* tokens are only ever var() fallbacks, so an
 * inline value on <html> inherits down and wins. The marketing --mkt-* tokens
 * are DECLARED on the [data-mkt] wrapper (marketing.css's containment contract
 * forbids :root), and a declaration on a descendant beats an inherited value
 * from an ancestor no matter how specific that ancestor's rule is, so every
 * --mkt-* knob written to <html> was silently doing nothing. tunerScope()
 * routes each var to the element that actually declares it. Drag -> feel it ->
 * "Copy CSS" -> bake the value as the default -> "Reset". In-house on purpose
 * (no lil-gui/leva prod dep), tailored to CSS-var tuning, config-driven so each
 * increment adds knobs without touching this file.
 *
 * Every knob shows its description and where it ships (Will, 2026-09-12: "some
 * of the labels aren't very clear"), grouped; a knob without a specimen is not
 * on the panel (motion-tuner-config.ts).
 *
 * GATING: the SERVER page that mounts this checks isDesignGateOpen() (see
 * src/lib/design-gate/server.ts), or the cinema layout's island asks
 * /api/design-gate; so this never renders for a real host. It still ships in
 * the prod bundle (tiny + inert) BY DESIGN, because tune-live happens on
 * partyreel.com.
 *
 * Portaled to <body> so it floats above the route-fade transform (a transformed
 * ancestor breaks position:fixed) and above the focused-review Dialog (z-50);
 * useSyncExternalStore gives an SSR-safe mounted guard (mirrors the lab's
 * ThemeToggle) without a set-state-in-effect.
 */

function controlCssValue(control: TunerControl, raw: TunerValue): string {
  return control.kind === "range" ? `${raw}${control.unit}` : String(raw);
}

/** The element an override has to be written on to actually take effect (see
 *  the WRITE TARGET note above). Falls back to <html> if the marketing wrapper
 *  isn't on the page (then the var is a plain fallback and inheritance works). */
function tunerScope(cssVar: string): HTMLElement {
  if (cssVar.startsWith("--mkt-")) {
    const scope = document.querySelector<HTMLElement>("[data-mkt]");
    if (scope) return scope;
  }
  return document.documentElement;
}

function write(control: TunerControl, raw: TunerValue) {
  tunerScope(control.cssVar).style.setProperty(
    control.cssVar,
    controlCssValue(control, raw),
  );
}

function erase(control: TunerControl) {
  tunerScope(control.cssVar).style.removeProperty(control.cssVar);
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
  const overrides = useSyncExternalStore(
    subscribeTuner,
    getTunerSnapshot,
    getTunerServerSnapshot,
  );
  const candidate = useTunerCandidate();

  // Apply the working set to the DOM on every mount and on every change: a
  // fresh [data-mkt] wrapper after a navigation, a remount after a Replay, a
  // reload (hydrate reads the store once). Cleanup erases nothing, on purpose:
  // the store, not the panel, owns the values; Reset erases.
  // The shell reads where the panel is (the Library x Lab round, 2026-09-15):
  // `data-lab-panel` names the side it sits on and `--lab-panel-w` its width,
  // so design.css can pad a wide board page clear of it on a desktop window
  // (at 375 the answer is to collapse the panel, not to squeeze the board).
  // Cleared on unmount, like the dock clears --board-dock-h.
  useEffect(() => {
    const html = document.documentElement;
    if (open) {
      html.setAttribute("data-lab-panel", side);
      html.style.setProperty("--lab-panel-w", "20rem");
    } else {
      html.removeAttribute("data-lab-panel");
      html.style.setProperty("--lab-panel-w", "0px");
    }
    return () => {
      html.removeAttribute("data-lab-panel");
      html.style.removeProperty("--lab-panel-w");
    };
  }, [open, side]);

  useEffect(() => {
    hydrateTuner();
    const set = getTunerSnapshot();
    for (const c of controls) {
      const v = set[c.cssVar];
      if (v === undefined) erase(c);
      else write(c, v);
    }
  }, [controls, overrides]);

  if (!mounted) return null;

  const valueOf = (c: TunerControl): TunerValue =>
    overrides[c.cssVar] ?? c.default;
  const changed = controls.filter((c) => overrides[c.cssVar] !== undefined);

  function update(control: TunerControl, raw: TunerValue) {
    setTunerValue(control, raw);
    if (raw === control.default) erase(control);
    else write(control, raw);
    setCopied(false);
  }

  function reset() {
    for (const c of controls) erase(c);
    clearTunerValues(controls);
    setCopied(false);
  }

  async function copyCss() {
    // --mkt-* tokens bake onto [data-mkt] in marketing.css, never :root (the
    // containment contract), so they get their own block; a `:root {}` block
    // would be dead the moment it was pasted, for the same reason the writes
    // above needed a scope. Inside a block the lines are grouped like the panel.
    const block = (selector: string, list: TunerControl[]) => {
      if (list.length === 0) return "";
      const groups = [...new Set(list.map((c) => c.group))];
      const lines = groups.flatMap((g) => [
        `  /* ${TUNER_GROUP_LABEL[g]} */`,
        ...list
          .filter((c) => c.group === g)
          .map((c) => `  ${c.cssVar}: ${controlCssValue(c, valueOf(c))};`),
      ]);
      return `${selector} {\n${lines.join("\n")}\n}`;
    };
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

  const groups = [...new Set(controls.map((c) => c.group))] as TunerGroup[];

  const panel = (
    <div
      className={`fixed bottom-3 z-[9999] text-[11px] ${
        side === "right" ? "right-3" : "left-3"
      }`}
      // Dev tool: keep it visually distinct from product chrome and never let it
      // inherit the page's tuned vars.
      data-motion-tuner
    >
      {open ? (
        <div className="w-80 rounded-lg border border-white/15 bg-neutral-900/95 text-neutral-100 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <span className="flex items-center gap-1.5 font-semibold tracking-tight">
              <SlidersHorizontal className="size-3.5" /> Tuner
              {changed.length > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-neutral-900 tabular-nums">
                  {changed.length}
                </span>
              )}
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

          {candidate && (
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-amber-400/10 px-3 py-2">
              <span className="min-w-0 truncate text-amber-200">
                Candidate on the site: {candidate.label}
              </span>
              <button
                type="button"
                onClick={clearCandidate}
                className="shrink-0 rounded px-1.5 py-0.5 text-neutral-300 hover:bg-white/10 hover:text-neutral-100"
                title="Take the candidate block off the site (the board that applied it can apply it again)"
              >
                clear
              </button>
            </div>
          )}

          <div className="max-h-[64vh] space-y-4 overflow-y-auto px-3 py-3">
            {controls.length === 0 && (
              <p className="text-neutral-400">No knobs wired yet.</p>
            )}
            {groups.map((g) => (
              <section key={g} className="space-y-2.5">
                <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                  {TUNER_GROUP_LABEL[g]}
                </h3>
                {controls
                  .filter((c) => c.group === g)
                  .map((c) => {
                    const v = valueOf(c);
                    const moved = overrides[c.cssVar] !== undefined;
                    return (
                      <div key={c.cssVar} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-neutral-200">{c.label}</label>
                          <span
                            className={`tabular-nums ${
                              moved ? "text-amber-300" : "text-neutral-500"
                            }`}
                          >
                            {c.kind === "range"
                              ? `${v}${c.unit}`
                              : c.options.find((o) => o.value === v)?.label}
                          </span>
                        </div>
                        <p className="text-[10px] leading-snug text-neutral-400">
                          {c.description}
                        </p>
                        <p className="text-[10px] leading-snug text-neutral-500">
                          Ships: {c.ships}.
                        </p>
                        {c.kind === "range" ? (
                          <input
                            type="range"
                            min={c.min}
                            max={c.max}
                            step={c.step}
                            value={Number(v)}
                            onChange={(e) => update(c, Number(e.target.value))}
                            className="w-full accent-amber-400"
                            aria-label={c.label}
                          />
                        ) : (
                          <select
                            value={String(v)}
                            onChange={(e) => update(c, e.target.value)}
                            className="w-full rounded border border-white/15 bg-neutral-800 px-1.5 py-1 text-neutral-100"
                            aria-label={c.label}
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
              </section>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
            <button
              type="button"
              onClick={copyCss}
              className="flex flex-1 items-center justify-center gap-1.5 rounded bg-white/10 py-1.5 hover:bg-white/15"
              title="Copy the changed vars as CSS, grouped, to bake into globals.css or marketing.css"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied
                ? "Copied"
                : `Copy CSS${changed.length ? ` (${changed.length})` : ""}`}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-1.5 rounded bg-white/10 px-2 py-1.5 hover:bg-white/15"
              title="Drop every override this panel owns (back to the baked defaults, here and after a reload)"
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
          title="Open the tuner"
        >
          <SlidersHorizontal className="size-3.5" />
          {changed.length > 0 && (
            <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-neutral-900 tabular-nums">
              {changed.length}
            </span>
          )}
        </button>
      )}
    </div>
  );

  return createPortal(panel, document.body);
}
