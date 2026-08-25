import type { CSSProperties } from "react";

import { Container } from "@/components/shared/container";

import { TextsReveal } from "../shared/texts-reveal";

/**
 * QUIET (the loud/quiet map): type and hairlines only, texts-reveal and
 * nothing else, so the cinema hero above and the decomposition below pop.
 * The four claims are the pre-launch honesty pattern (true product promises,
 * never fabricated social proof; no counts while Stripe is TEST). "No
 * watermarks" stays scoped to photos and the album; the free REEL's small
 * mark is the /reel page's detail (the IA's collision note), so this section
 * never mentions reels.
 */
const CLAIMS = [
  "No app, no account",
  "Private by default",
  "Yours until you delete it",
  "No watermarks",
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
