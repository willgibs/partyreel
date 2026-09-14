"use client";

// the concept's own sheet; keyframes here carry the hhs- prefix.
import "./source.css";

import { type Concept, Placeholder } from "./shared";

/**
 * The source (concept 1 of the home-hero board, round two). Built by the
 * lp/hero-source track against the contract in shared.tsx; this stub is what the
 * board renders until the track lands.
 */
export const source: Concept = {
  id: "source",
  n: 1,
  name: "The source",
  rationale:
    "The real demo QR sits at the exact centre, at rest, scannable. On load the album's frames branch out of it, left and right, in two perspective rows, and never stop: frames are born at the QR and travel to the edges in a loop, the way an album fills from one scan.",
  eyebrow:
    "The QR itself, at the centre, with no label: the eyebrow is the object.",
  proposed: {
    h1: "One scan. The whole night.",
    subhead: "Guests scan the QR. The album fills itself.",
    secondary: "Scan the demo",
  },
  departures: [],
  assets: [],
  render: () => (
    <Placeholder
      concept={{
        name: "The source",
        rationale:
          "The real demo QR sits at the exact centre, at rest, scannable. On load the album's frames branch out of it, left and right, in two perspective rows, and never stop: frames are born at the QR and travel to the edges in a loop, the way an album fills from one scan.",
      }}
      track="hero-source"
    />
  ),
};
