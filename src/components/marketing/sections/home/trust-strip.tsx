import type { CSSProperties } from "react";

import { Container } from "@/components/shared/container";

import { TextsReveal } from "../shared/texts-reveal";

/**
 * QUIET (the loud/quiet map): type and hairlines only, texts-reveal and
 * nothing else, so the cinema hero above and the decomposition below pop.
 * The four claims are the pre-launch honesty pattern (true product promises,
 * never fabricated social proof; no counts while Stripe is TEST).
 *
 * PROVISIONAL (R4 truth ruling A1): the bare "No watermarks" read as a
 * whole-product promise, but a FREE event's clips do carry a small
 * partyreel.com mark (photos, the album and the live reel are unmarked on every
 * tier, and a paid plan clears the clips' mark). The claim is scoped to photos
 * in the copy itself, so the strip can stay short without over-promising.
 *
 * ★ THE SAME TRAP CAUGHT THE FIRST CLAIM (Will, 2026-09-19, voice r1). It read
 * "No app, no account": four words at the top of the page promising something
 * Require verified emails switches off by default. Four SHORT claims is the
 * strip's whole form, so there is nowhere to hedge in place and the claim had
 * to become one that is true of every event. Never restore the second half.
 */
const CLAIMS = [
  "No app required",
  "Private by default",
  "Yours until you delete it",
  "No photo watermarks",
];

export function TrustStrip() {
  return (
    <section className="border-y">
      <Container>
        <TextsReveal className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-8 lg:justify-between">
          {CLAIMS.map((claim, i) => (
            <span
              key={claim}
              className="mkt-line text-sm text-muted-foreground"
              style={{ "--i": i } as CSSProperties}
            >
              {claim}
            </span>
          ))}
        </TextsReveal>
      </Container>
    </section>
  );
}
