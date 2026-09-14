/**
 * THE TUNER'S STORE (the rounding and tweaking GUI round, 2026-09-14). The one
 * root of both defects Will hit on the panel: its only state was component
 * state, so a Replay on the playground (the control array rebuilt per render,
 * the cleanup effect re-firing) wiped every tuned value, and leaving the
 * cinema group (the layout unmounting) killed them again. Now the working set
 * lives here, outside any component: a map of cssVar -> the value moved off
 * its default, persisted to localStorage under one key, hydrated once per
 * page load, and re-applied to the DOM whenever a tuner mounts. Values survive
 * a Replay, a soft navigation out of the group and back, and a reload; Reset
 * is the only thing that clears them, and the panel's badge always says how
 * many stand, so an override can never silently mask a baked default while
 * a tuner is on the page.
 *
 * Only the overrides are stored (never a default), so a baked default that
 * moves in CSS shows up as the new live state rather than an old number.
 */

import type { TunerControl } from "./motion-tuner-config";

export type TunerValue = number | string;
export type TunerOverrides = Readonly<Record<string, TunerValue>>;

const KEY = "partyreel.tuner.v1";
const EMPTY: TunerOverrides = Object.freeze({});

let overrides: TunerOverrides = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    if (Object.keys(overrides).length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(overrides));
  } catch {
    // Private mode or a full store: the working set still lives for the page.
  }
}

/** Read localStorage once per page load; safe to call on every mount. */
export function hydrateTuner(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const next: Record<string, TunerValue> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "number" || typeof v === "string") next[k] = v;
      }
      overrides = Object.freeze(next);
    }
  } catch {
    overrides = EMPTY;
  }
}

export function subscribeTuner(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTunerSnapshot(): TunerOverrides {
  return overrides;
}

export function getTunerServerSnapshot(): TunerOverrides {
  return EMPTY;
}

/** The live value of a control: its override, else its baked default. */
export function tunerValue(control: TunerControl): TunerValue {
  return overrides[control.cssVar] ?? control.default;
}

export function setTunerValue(control: TunerControl, value: TunerValue): void {
  const next: Record<string, TunerValue> = { ...overrides };
  if (value === control.default) delete next[control.cssVar];
  else next[control.cssVar] = value;
  overrides = Object.freeze(next);
  persist();
  emit();
}

/** Drop the overrides for these controls (Reset), leaving other mounts' alone. */
export function clearTunerValues(controls: TunerControl[]): void {
  const next: Record<string, TunerValue> = { ...overrides };
  for (const c of controls) delete next[c.cssVar];
  overrides = Object.freeze(next);
  persist();
  emit();
}
