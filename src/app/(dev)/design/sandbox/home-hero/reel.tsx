"use client";

// the concept's own sheet; keyframes here carry the hhr- prefix.
import "./reel.css";

import { type Concept, Placeholder } from "./shared";

/**
 * The reel (concept 2 of the home-hero board, round two). Built by the
 * lp/hero-reel track against the contract in shared.tsx; this stub is what the
 * board renders until the track lands.
 */
export const reel: Concept = {
  id: "reel",
  n: 2,
  name: "The reel",
  rationale:
    "An encapsulated hero: a rounded container inset to the page column, a fast-cut highlight reel of real party moments filling it, the display type set large over it, and bottom-left a pinned announcement card carrying the live demo QR that stays with the visitor down the page.",
  eyebrow: "An announcement pill with a live dot: Live demo, scan to try.",
  proposed: {
    h1: "Every guest is the camera.",
    subhead:
      "One QR at the door. Every photo and video, in one album, by morning.",
    secondary: "Scan the demo",
  },
  departures: [],
  assets: [],
  render: () => (
    <Placeholder
      concept={{
        name: "The reel",
        rationale:
          "An encapsulated hero: a rounded container inset to the page column, a fast-cut highlight reel of real party moments filling it, the display type set large over it, and bottom-left a pinned announcement card carrying the live demo QR that stays with the visitor down the page.",
      }}
      track="hero-reel"
    />
  ),
};
