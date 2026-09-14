"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./scan.css";

import { type Concept, Placeholder } from "./shared";

/**
 * THE SCAN (concept 2 of the home-hero board, round three). A STUB:
 * the Orchestrator registered it; the `hero-scan` track replaces everything
 * here, keeping the export name and the id. The brief is docs/tracks/hero-scan.md;
 * the contract is shared.tsx (read it whole); the source (source.tsx) is the
 * ruled direction this varies. Keyframes live in scan.css under `hhc-`.
 */
export const scan: Concept = {
  id: "scan",
  n: 2,
  name: "The scan",
  rationale:
    "The cause made literal: the moment of scanning is in the frame, and the album is born from it. A stranger sees the act and its result in one composition, so the causality never has to be explained.",
  eyebrow:
    "The act of scanning, shown: a guest's phone at the code, or the code's own scan beat.",
  proposed: {
    h1: "Scan it. The whole night lands in one album.",
    subhead:
      "Every guest points a camera at the code. Their photos and videos arrive in your album, with no app and no account.",
    secondary: "See a real album",
  },
  departures: [],
  assets: [],
  render: () => (
    <Placeholder
      concept={{
        name: "The scan",
        rationale: "the hero-scan track builds it on its own preview",
      }}
      track="hero-scan"
    />
  ),
};
