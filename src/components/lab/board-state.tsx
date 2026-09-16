"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

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
}: {
  controls: readonly Control[];
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
}) {
  return (
    <>
      {controls.map((c) => (
        <Knob key={c.id} label={c.label}>
          <Toggle
            ariaLabel={c.label}
            options={c.options.map((o) => ({ id: o.id, label: o.label }))}
            value={state[c.id] ?? c.default}
            onChange={(v) => setState({ [c.id]: v })}
            wrap={c.options.length > 3} // four or more options overflow a 343px dock at 375 (rounding, 2026-09-16)
          />
        </Knob>
      ))}
    </>
  );
}
