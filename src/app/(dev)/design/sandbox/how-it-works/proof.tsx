"use client";

import { QrFrame } from "@/components/marketing/frames";
import { ReelPayoff } from "@/components/marketing/sections/how-it-works/reel-payoff";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { MAX_REEL_SECONDS } from "@/lib/constants/tiers";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

import { Widths } from "./scene";

/**
 * THE PROOF: what the payoff section proves, after the sample reel. Nothing
 * here is a usage number (zero real events exist yet, docs/design/rulings.md,
 * "no image rights tracking" sits beside the same honesty rule): the stats
 * option is three DERIVED product facts, never invented, and the demo option
 * reuses the real `QrFrame`/`DEMO_EVENT_URL` wiring the header already ships.
 */
export type ProofShape = "reel" | "stats" | "demo";

function StatsBand() {
  return (
    <SectionShell
      eyebrow="What that reel actually is"
      width="narrow"
      className="pt-0"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4 text-center">
        {[
          { n: String(STYLE_CATALOG.length), label: "render styles to pick from" },
          { n: "Free", label: "on every plan, watermark included" },
          { n: `${MAX_REEL_SECONDS.free}s`, label: "on the free plan, 60s on Pro" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <span className="font-heading text-subsection tabular-nums">
              {s.n}
            </span>
            <span className="text-xs text-pretty text-muted-foreground">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function DemoDoor() {
  return (
    <SectionShell width="narrow" className="pt-0">
      <div className="flex flex-col items-center gap-3">
        <QrFrame
          liveQrUrl={DEMO_EVENT_URL}
          href={DEMO_EVENT_URL}
          caption="Try the live demo"
        />
        <p className="max-w-xs text-center text-sm text-pretty text-muted-foreground">
          Scan it, or tap through: a real event, curated, no sign-up.
        </p>
      </div>
    </SectionShell>
  );
}

function ProofPage({ shape }: { shape: ProofShape }) {
  return (
    <div className="dark bg-background text-foreground">
      {/* ReelPayoff is a `reads`, never edited, so its own picture (the phone-
          shaped sample render) cannot carry `data-hiw-picture` itself; wrapping
          its whole section is the honest measurement every option shares. */}
      <div data-hiw-picture>
        <ReelPayoff />
      </div>
      {shape === "stats" && <StatsBand />}
      {shape === "demo" && <DemoDoor />}
    </div>
  );
}

// Measured against the real rendered frames (a board once shipped with the
// tile cropped by a formula's sign backwards; PROGRAM.md, "measure every tile
// before it ships"): "demo" ran 1,317 px against a first guess of 1,300;
// "stats" ran 1,269 against 1,200.
const PROOF_H: Record<ProofShape, { d: number; p: number }> = {
  reel: { d: 950, p: 1200 },
  stats: { d: 1350, p: 1650 },
  demo: { d: 1400, p: 1750 },
};

const NOTE: Record<ProofShape, string> = {
  reel: "As today: one sample render and a door to /reel.",
  stats: "Three derived facts, never a usage number: style count, price, length.",
  demo: "The reel, then a real scannable door into the live demo event.",
};

export function proofPreview(shape: ProofShape) {
  return (
    <Widths
      id={`proof-${shape}`}
      ground="cinema"
      desktopH={PROOF_H[shape].d}
      phoneH={PROOF_H[shape].p}
      note={NOTE[shape]}
      render={() => <ProofPage shape={shape} />}
    />
  );
}
