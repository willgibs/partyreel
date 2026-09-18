"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  clearCandidate,
  getCandidateServerSnapshot,
  getCandidateSnapshot,
  hydrateTuner,
  setCandidateCss,
  subscribeTuner,
  type TunerCandidate,
} from "@/components/dev/tuner-store";

/** The candidate block the store holds, live; null when none is applied. */
export function useTunerCandidate(): TunerCandidate | null {
  const candidate = useSyncExternalStore(
    subscribeTuner,
    getCandidateSnapshot,
    getCandidateServerSnapshot,
  );
  useEffect(() => {
    hydrateTuner();
  }, []);
  return candidate;
}

/**
 * Renders the applied candidate as a <style> so the real page wears it (the
 * review wave's second round, 2026-09-14). Mounted where a tuner island mounts:
 * the lab layout, the cinema island, the app island. A block is real CSS with
 * real selectors (`:root, .surface-paper`, `.dark`, `.surface-ink`, a
 * primitive's class), and a <style> rendered here comes after every stylesheet
 * in the cascade, so at equal specificity the candidate wins. Nothing renders
 * when no candidate is set.
 */
export function CandidateStyle() {
  const candidate = useTunerCandidate();
  if (!candidate) return null;
  return <style data-tuner-candidate={candidate.label}>{candidate.css}</style>;
}

export { clearCandidate, setCandidateCss };
