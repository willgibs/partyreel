"use client";

import { lazy, Suspense, useEffect, useState } from "react";

import { MARKETING_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";

// Lazy so the tuner's JS never ships to a normal visitor's first paint; the
// chunk loads only after the server validates the key.
const MotionTuner = lazy(() =>
  import("@/components/dev/motion-tuner").then((m) => ({
    default: m.MotionTuner,
  })),
);

/**
 * The key-gated marketing MotionTuner mount (Track B; lives on the (cinema)
 * group layout so EVERY cinema page is tunable in-sitting). Layouts don't
 * receive searchParams in Next 16 and awaiting them in the page would make the
 * static marketing home per-request rendered (an LCP-budget risk), so this is
 * the honest static-safe equivalent of the event page's isDesignGateOpen
 * precedent: a zero-cost island that does NOTHING unless the visitor arrived
 * with `?key=`, and then asks the server to validate it (/api/design-gate,
 * timing-safe, 404 on anything invalid) before mounting the tuner. The gate
 * decision stays server-side; only the boolean crosses the wire.
 */
export function MarketingMotionTuner() {
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
        // Closed on any failure: the tuner is a dev affordance, never worth a retry.
      });
    return () => ctrl.abort();
  }, []);

  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <MotionTuner controls={MARKETING_TUNER_CONTROLS} />
    </Suspense>
  );
}
