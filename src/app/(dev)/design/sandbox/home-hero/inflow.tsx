"use client";

import "./inflow.css";

import { type Concept, DemoQr } from "./shared";

/**
 * THE INFLOW, variation 3 of the home hero (Will, 2026-09-15: "a new variation
 * off of 1 that has the images streaming into the QR rather than away"). This
 * is the stub the `hero-inflow` track replaces: the concept's contract is in
 * shared.tsx and the brief in docs/tracks/hero-inflow.md. The stub renders the
 * code alone so the board and the desk stay whole while the track builds.
 */
export const inflow: Concept = {
  id: "inflow",
  n: 3,
  name: "The inflow",
  rationale:
    "The mirror of the source: guests' photographs stream INTO the code from the edges of the room and vanish into it, so the code reads as the destination everything in the room goes to. Conceptually the truest reading (a guest's photo goes into the code); whether it presents as well as the outflow is the question this variation answers honestly.",
  eyebrow: "The QR itself, at the centre, the destination.",
  proposed: {
    h1: "Everything they shoot lands here.",
    subhead:
      "Guests scan the code. Their photos and videos flow into your album, with no app and no account.",
    secondary: "See a real album",
  },
  departures: [],
  assets: [],
  render: (p) => (
    <div className="relative grid h-full place-items-center">
      <DemoQr url={p.qrUrl} size={p.mode === "desktop" ? 144 : 112} />
      <p className="absolute bottom-6 text-xs text-muted-foreground">
        The inflow builds here (track hero-inflow, round four).
      </p>
    </div>
  ),
};
