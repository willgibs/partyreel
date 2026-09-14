"use client";

// the concept's own sheet; keyframes here carry the hhg- prefix.
import "./gathering.css";

import { type Concept, Placeholder } from "./shared";

/**
 * The gathering (concept 3 of the home-hero board, round two). Built by the
 * lp/hero-gathering track against the contract in shared.tsx; this stub is what the
 * board renders until the track lands.
 */
export const gathering: Concept = {
  id: "gathering",
  n: 3,
  name: "The gathering",
  rationale:
    "Centred type on the cinema ground with a bespoke field of photographs and short vertical clips around it, cards of unequal size and slight rotation on an irregular field, never a grid, the whole field breathing. Above the h1 the eyebrow is the demo QR, small and real, with a caption.",
  eyebrow:
    "The QR, small and real, above the h1, with a caption in the Caption atom.",
  proposed: {
    h1: "Made by everyone who was there.",
    subhead: "One link. Every phone. One album.",
    secondary: "Scan the demo",
  },
  departures: [],
  assets: [],
  render: () => (
    <Placeholder
      concept={{
        name: "The gathering",
        rationale:
          "Centred type on the cinema ground with a bespoke field of photographs and short vertical clips around it, cards of unequal size and slight rotation on an irregular field, never a grid, the whole field breathing. Above the h1 the eyebrow is the demo QR, small and real, with a caption.",
      }}
      track="hero-gathering"
    />
  ),
};
