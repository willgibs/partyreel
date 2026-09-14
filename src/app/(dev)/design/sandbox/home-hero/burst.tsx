"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./burst.css";

import { type Concept, Placeholder } from "./shared";

/**
 * THE BURST (concept 3 of the home-hero board, round three). A STUB:
 * the Orchestrator registered it; the `hero-burst` track replaces everything
 * here, keeping the export name and the id. The brief is docs/tracks/hero-burst.md;
 * the contract is shared.tsx (read it whole); the source (source.tsx) is the
 * ruled direction this varies. Keyframes live in burst.css under `hhb-`.
 */
export const burst: Concept = {
  id: "burst",
  n: 3,
  name: "The burst",
  rationale:
    "The origin in every direction: the album radiates out of the code on a depth axis, toward the viewer and past the edges, so the code reads as the source of everything on screen at any width.",
  eyebrow:
    "The QR itself at the centre of the burst, no label: the eyebrow is the object.",
  proposed: {
    h1: "One code. Everyone's photos.",
    subhead:
      "Guests scan it and the album fills itself, from every phone at the event, with no app and no account.",
    secondary: "See a real album",
  },
  departures: [],
  assets: [],
  render: () => (
    <Placeholder
      concept={{
        name: "The burst",
        rationale: "the hero-burst track builds it on its own preview",
      }}
      track="hero-burst"
    />
  ),
};
