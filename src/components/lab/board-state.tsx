"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import type { BoardSpec, BoardState, Control } from "./board-spec";
import { Knob } from "./dock";
import { Toggle } from "./toggle";

/**
 * THE BOARD'S DECLARED STATE, WHICH IS THE URL.
 *
 * A board's page-wide switches are DATA (`spec.controls`), not JSX, and this is
 * what makes three separate things work off one declaration: the dock renders
 * them, the evidence is a function of them, and a walk step can set them. A
 * board that holds its switches in ad-hoc `useState` can do none of that, and
 * every board before this one did.
 *
 * ★ THE URL IS THE SHARE FORMAT, AND THAT IS THE POINT. A review conversation
 * is "look at the composer with the register on identity", and the only thing
 * that survives being pasted into a chat is a link. Every control writes its
 * option id under its own id, so `?canvas=phone&register=identity#light-composer`
 * reopens the exact canvas, candidate and section a note was written about.
 *
 * ★ IT REPLACES, IT DOES NOT PUSH. A knob is not a navigation: pushing would put
 * an entry in the history for every flip and bury the page the reader came from
 * under thirty of them. `history.replaceState` keeps Back meaning what it meant.
 *
 * ★ AND IT NEVER TOUCHES A PARAM IT DOES NOT OWN. `key` is the gate and dropping
 * it 404s the page on the next navigation; the shell owns any others. The write
 * walks the board's OWN control ids and leaves the rest of the query alone, and
 * a control that claims a reserved name is refused rather than allowed to eat
 * the gate key at runtime (`registry.test.ts` catches it at build time too).
 *
 * ★ THE URL IS THE STATE, NOT A MIRROR OF IT, and that is what keeps this out
 * of an effect. A `useState` seeded from `window.location` during render makes
 * the server's HTML and the browser's first render disagree whenever a link
 * carries state (a hydration mismatch, repaired by throwing the server tree
 * away), and seeding it from an effect instead is a cascading render. Reading
 * the URL through `useSyncExternalStore` is neither: the server snapshot is the
 * empty query, so the server renders the declared defaults and the browser
 * renders whatever the link carried, with no commit in between. Back and
 * Forward then work for free, which a mirrored copy never gave.
 *
 * ★ `replaceState` DOES NOT FIRE `popstate`, so the store would never learn
 * about its own writes. The write dispatches `lab:urlstate` and the
 * subscription listens for both.
 *
 * The param names are the control ids as declared. When the shell's own state
 * model lands (`_data/state.ts`, the lab-shell track) this is the one place
 * that has to agree with it.
 */
export const RESERVED_PARAMS = ["key"] as const;

const URL_EVENT = "lab:urlstate";

function subscribeUrl(fn: () => void) {
  window.addEventListener("popstate", fn);
  window.addEventListener(URL_EVENT, fn);
  return () => {
    window.removeEventListener("popstate", fn);
    window.removeEventListener(URL_EVENT, fn);
  };
}

export function useBoardState(spec: BoardSpec): {
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
  controls: readonly Control[];
} {
  const controls = useMemo(() => spec.controls ?? [], [spec.controls]);
  const search = useSyncExternalStore(
    subscribeUrl,
    () => window.location.search,
    () => "",
  );

  const state = useMemo<BoardState>(() => {
    const q = new URLSearchParams(search);
    const next: Record<string, string> = {};
    for (const c of controls) {
      const v = q.get(c.id);
      next[c.id] = v && c.options.some((o) => o.id === v) ? v : c.default;
    }
    return next;
  }, [controls, search]);

  const setState = useCallback(
    (patch: Record<string, string>) => {
      // ★ THE WRITE WAITS ONE MICROTASK, AND HANDS NEXT NOTHING (crumbs-16).
      //
      // NEVER THE ENTRY'S OWN STATE: it carries Next's `__NA`, which makes
      // Next's patched `replaceState` take the call for its own and apply no
      // URL, so its copy of the address (`useSearchParams`: `CopyLink`, every
      // sticky link in the shell) stayed on the last address it heard, and a
      // `router.refresh()` wrote that address back over the bar.
      //
      // NOT BEFORE THE PATCH EXISTS: Next installs it in a passive effect of its
      // Router, and a child's effect runs before its parent's, so a write from a
      // mount effect (a step LANDING on a board sets its controls) reaches the
      // browser's own `replaceState`, where `null` empties the entry's `__NA`
      // and tree (a later Back onto it is then ignored by Next) and Next never
      // hears the URL. lab-tides (2026-09-19) saw the emptied state and kept the
      // entry's own, believing `null` throws Next's bookkeeping away: measured
      // under `next dev`, a `null` write AFTER the patch keeps both (Next copies
      // them from the entry), Back through it does not reload and no server round
      // trip follows; and a microtask runs after the whole flush of a commit's
      // effects, the Router's included. A click's write is a microtask late,
      // which nothing can see: the store below re-reads the address on the event.
      // `history-state-policy.test.ts` refuses the first shape everywhere.
      queueMicrotask(() => {
        try {
          const url = new URL(window.location.href);
          for (const c of controls) {
            const v = patch[c.id];
            if (!v || !c.options.some((o) => o.id === v)) continue;
            if ((RESERVED_PARAMS as readonly string[]).includes(c.id)) continue;
            if (v === c.default) url.searchParams.delete(c.id);
            else url.searchParams.set(c.id, v);
          }
          window.history.replaceState(null, "", url);
          window.dispatchEvent(new Event(URL_EVENT));
        } catch {
          // A sandboxed frame or a blocked history API. Nothing to fall back on:
          // the URL is the state, so say nothing rather than drift from it.
        }
      });
    },
    [controls],
  );

  return { state, setState, controls };
}

/**
 * The declared controls, as the dock renders them. A board never writes these:
 * a switch that is in the dock is in the spec, and one that is not in the spec
 * changes exactly one specimen and sits beside it.
 */
export function ControlKnobs({
  controls,
  state,
  setState,
  quiet = false,
}: {
  controls: readonly Control[];
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
  /**
   * The step's one quiet row on the stage (lab-focus, 2026-09-29): every knob
   * on one line, never wrapping, since the row scrolls sideways where it runs
   * out of room rather than growing a second row over the pictures.
   */
  quiet?: boolean;
}) {
  return (
    <>
      {controls.map((c) => (
        <Knob key={c.id} label={c.label} quiet={quiet}>
          {c.options.length > LONG_CONTROL ? (
            <LongControl
              control={c}
              value={state[c.id] ?? c.default}
              onChange={(v) => setState({ [c.id]: v })}
              quiet={quiet}
            />
          ) : (
            <Toggle
              ariaLabel={c.label}
              options={c.options.map((o) => ({ id: o.id, label: o.label }))}
              value={state[c.id] ?? c.default}
              onChange={(v) => setState({ [c.id]: v })}
              quiet={quiet}
              // Four or more options overflow a 343px dock at 375 (rounding,
              // 2026-09-16); the quiet row scrolls instead.
              wrap={!quiet && c.options.length > 3}
            />
          )}
        </Knob>
      ))}
    </>
  );
}

/**
 * ★ ABOVE EIGHT OPTIONS A CONTROL IS A SELECT (lab-sitting, 2026-10-01). A pill
 * row of nine wraps to two or three rows in the dock at a desk and runs a long
 * way along the step's one quiet row, so the dock spends a screen on one knob;
 * a select is one control's width whatever it holds. Eight and under keep their
 * pills, where every option is one press and all of them are in view.
 */
export const LONG_CONTROL = 8;

function LongControl({
  control,
  value,
  onChange,
  quiet,
}: {
  control: Control;
  value: string;
  onChange: (v: string) => void;
  quiet: boolean;
}) {
  return (
    <select
      aria-label={control.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "min-w-0 cursor-pointer border border-border bg-card font-medium text-foreground",
        quiet
          ? "h-[24px] rounded-md px-1.5 text-[11px]"
          : "h-[30px] rounded-lg px-2 text-[12px]",
      )}
    >
      {control.options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
