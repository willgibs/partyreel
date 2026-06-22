"use client";

import { domMax, LayoutGroup, LazyMotion, m } from "motion/react";

// The C3 reorder variant: the SAME section reorder, done with `motion`'s `layout`
// prop instead of the hand-rolled FLIP (C2). LazyMotion + domMax loads only the
// layout feature set; this whole module is dynamic-imported by the lab orchestrator,
// so `motion` ships ONLY when C3 is selected in the gated /design route - never in
// the production app bundle. This is the evidence for the framer-motion adoption call.
// `strict` forbids the heavy `motion.*` components (must use `m.*`), keeping it lean.
export function MotionReorder({
  items,
  durationMs,
}: {
  items: { key: string; node: React.ReactNode }[];
  durationMs: number;
}) {
  return (
    <LazyMotion features={domMax} strict>
      <LayoutGroup>
        {items.map(({ key, node }) => (
          <m.div
            key={key}
            layout
            transition={{
              duration: durationMs / 1000,
              ease: [0.77, 0, 0.175, 1], // --ease-in-out-strong
            }}
          >
            {node}
          </m.div>
        ))}
      </LayoutGroup>
    </LazyMotion>
  );
}
