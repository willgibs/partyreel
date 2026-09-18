"use client";

import { lazy, Suspense, useEffect, useState } from "react";

import { CandidateStyle } from "@/components/dev/candidate-style";
import { ROUNDING_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";

// Lazy so the tuner's JS never ships to a host's first paint; the chunk loads
// only after the server validates the key.
const MotionTuner = lazy(() =>
  import("@/components/dev/motion-tuner").then((m) => ({
    default: m.MotionTuner,
  })),
);

/**
 * The key-gated design island on the HOST APP's layout (the review wave's
 * second round, 2026-09-14): the same static-safe pattern as the cinema
 * group's MarketingMotionTuner. A zero-cost island that does NOTHING unless
 * the host arrived with `?key=`, then asks the server to validate it
 * (/api/design-gate, timing-safe, 404 on anything invalid) before mounting the
 * rounding knobs and the candidate <style>, so a sitting can walk the
 * dashboard, an event page and the account page with a radius set or a
 * candidate palette applied. The gate decision stays server-side; only the
 * boolean crosses the wire, and nothing here touches data.
 */
export function AppDesignIsland() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key");
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/design-gate?key=${encodeURIComponent(key)}`, {
      signal: ctrl.signal,
    })
      .then((res) => setOpen(res.ok))
      .catch(() => {
        // Closed on any failure: a dev affordance, never worth a retry.
      });
    return () => ctrl.abort();
  }, []);

  if (!open) return null;
  return (
    <>
      <CandidateStyle />
      <Suspense fallback={null}>
        <MotionTuner controls={ROUNDING_TUNER_CONTROLS} />
      </Suspense>
    </>
  );
}
