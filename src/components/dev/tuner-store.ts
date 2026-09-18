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
const CANDIDATE_KEY = "partyreel.tuner.candidate.v1";
const EMPTY: TunerOverrides = Object.freeze({});

/**
 * THE CANDIDATE (the review wave's second round, 2026-09-14): a board can hand
 * the whole site a CSS block, the same paste its ruling would land (a palette's
 * token set, a shadow family, a floating rung), so Will judges a candidate on
 * the real pages and not only on a stage. It is one block with a label, kept
 * beside the knob overrides under its own key, rendered as a <style> by
 * CandidateStyle wherever a tuner island mounts (the lab, every cinema page,
 * the app), and cleared from the panel or by the board that set it. Never a
 * production path: the islands are key-gated and the block lives in this
 * browser only.
 */
export type TunerCandidate = Readonly<{ label: string; css: string }>;

let overrides: TunerOverrides = EMPTY;
let candidate: TunerCandidate | null = null;
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

function persistCandidate() {
  try {
    if (!candidate) localStorage.removeItem(CANDIDATE_KEY);
    else localStorage.setItem(CANDIDATE_KEY, JSON.stringify(candidate));
  } catch {
    // Private mode or a full store: the candidate still lives for the page.
  }
}

/** Read localStorage once per page load; safe to call on every mount. Emits
 *  when it loaded something, so a subscriber mounted before hydration
 *  (CandidateStyle, a board's applied badge) re-renders with the stored set. */
export function hydrateTuner(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  let loaded = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const next: Record<string, TunerValue> = {};
        for (const [k, v] of Object.entries(
          parsed as Record<string, unknown>,
        )) {
          if (typeof v === "number" || typeof v === "string") next[k] = v;
        }
        overrides = Object.freeze(next);
        loaded = true;
      }
    }
  } catch {
    overrides = EMPTY;
  }
  try {
    const raw = localStorage.getItem(CANDIDATE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as { css?: unknown }).css === "string" &&
        typeof (parsed as { label?: unknown }).label === "string"
      ) {
        candidate = Object.freeze({
          label: (parsed as { label: string }).label,
          css: (parsed as { css: string }).css,
        });
        loaded = true;
      }
    }
  } catch {
    candidate = null;
  }
  if (loaded) emit();
}

export function getCandidateSnapshot(): TunerCandidate | null {
  return candidate;
}

export function getCandidateServerSnapshot(): TunerCandidate | null {
  return null;
}

/** A board applies its candidate to the whole site (every page with a tuner
 *  island renders it); one block at a time, the newest replaces the last. */
export function setCandidateCss(label: string, css: string): void {
  candidate = Object.freeze({ label, css });
  persistCandidate();
  emit();
}

export function clearCandidate(): void {
  candidate = null;
  persistCandidate();
  emit();
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
