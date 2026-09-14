"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./river.css";

import { type Concept, Placeholder } from "./shared";

/**
 * THE RIVER (concept 4 of the home-hero board, round three). A STUB:
 * the Orchestrator registered it; the `hero-river` track replaces everything
 * here, keeping the export name and the id. The brief is docs/tracks/hero-river.md;
 * the contract is shared.tsx (read it whole); the source (source.tsx) is the
 * ruled direction this varies. Keyframes live in river.css under `hhv-`.
 */
export const river: Concept = {
  id: "river",
  n: 4,
  name: "The river",
  rationale:
    "The origin at the top and the page as the album: the code sits where an eyebrow would, and the album pours down out of it into the page, so the hero reads the same way on a phone as on a desk.",
  eyebrow:
    "The QR at the top of the page, where the eyebrow sits, with one line under it.",
  proposed: {
    h1: "Scan the code. The album starts.",
    subhead:
      "Everything guests capture pours into one album from the moment they scan, with no app and no account.",
    secondary: "See a real album",
  },
  departures: [],
  assets: [],
  render: () => (
    <Placeholder
      concept={{
        name: "The river",
        rationale: "the hero-river track builds it on its own preview",
      }}
      track="hero-river"
    />
  ),
};
