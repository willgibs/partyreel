import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * FULL-BLEED PHOTOGRAPH SECTIONS THAT SWITCH WITH THE CURSOR (2026-09-18).
 *
 * Will, after finding the Codrops "Image Trail Effects" resource: "Rather than
 * leaning on aurora treatments for more UI-forward sections (eg. icon feature
 * cards with no media visual), we could have full image background sections
 * that switch the image based on cursor position. This would help break up the
 * strictly alternating dark/light chapters and make the page feel very alive,
 * especially once we begin our higgsfield generations for custom media." And
 * the bind on everything drawn here: "I think this crisp media motion design is
 * going to be the foundation of our visual identity."
 *
 * The section comes first because everything else is judged ON one: a treatment
 * that holds over a centred three-up is not the treatment a left-aligned ledger
 * needs. The trigger and the legibility are then independent of each other and
 * he can take them in either order; the entrance waits on the trigger, because
 * how a photograph should arrive depends on what sent it. The rhythm and the
 * phone wait on nothing at all: one is about the page and one is about a screen
 * with no cursor on it, and both can be answered before any of the rest.
 *
 * THE DELIGHT PROPOSED (bible 22, the craft stack's "recommend it by default"):
 * the INDEX RAIL. `band` turns the section into something you scrub and nothing
 * on screen says so, so eight hairline ticks sit at the section's bottom edge
 * with the live one lit in the accent, fading in only while the pointer is
 * inside the room. A readout, never a control: it is the smallest thing that
 * teaches the interaction, it costs one opacity transition, and it does not
 * appear for a reader who asked for less motion. It is drawn on the `band`
 * option, and it is his to keep or kill with the trigger.
 */

/** The ground the section sits on: the two chapters the page already has. */
const GROUND: Control = {
  id: "ground",
  label: "Ground",
  options: [
    { id: "cinema", label: "Cinema, the dark chapter" },
    { id: "paper", label: "Paper, the light chapter" },
  ],
  default: "cinema",
};

/** How far the cursor travels between switches, for the `travel` rule. */
const TRAVEL: Control = {
  id: "travel",
  label: "Travel",
  options: [
    { id: "100", label: "100 px, the reference" },
    { id: "180", label: "180 px" },
    { id: "260", label: "260 px" },
  ],
  default: "180",
};

/** One entrance, end to end. The reference's is 1.2 s, which reads slow here. */
const PACE: Control = {
  id: "pace",
  label: "Pace",
  options: [
    { id: "480", label: "480 ms, brisk" },
    { id: "680", label: "680 ms" },
    { id: "1000", label: "1000 ms, near the reference" },
  ],
  default: "680",
};

export const CURSOR_BACKDROP = defineExploration({
  id: "cursor-backdrop",
  title: "Cursor backdrop",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round: which section takes a full-bleed photograph backdrop, what switches it, how it arrives, how the copy stays readable over eight different photographs, where it sits in the page's dark and light run, and what it does on a phone.",
  },
  context:
    "Five home sections carry no media of their own and lean on the aurora or on nothing. The ask (2026-09-18): give the UI-forward ones a full-bleed photograph that switches with the cursor, to break the strictly alternating chapters and make the page feel alive. Every option is a shipped section, imported and drawn in place; the pool is eight of the hero's own photographs, and the cursor is simulated so a still shows its own cause.",
  bible: [1, 13, 14, 22],
  asks: [
    {
      id: "section",
      label: "The section",
      question:
        "Which home-page section should take a photograph backdrop first?",
      context:
        "Five home sections carry no media of their own. The trust strip is eight words tall and the FAQ is read rather than moved through, so these three are the ones with a whole section's height and nothing in it, each drawn as it ships.",
      lands:
        "Which UI-forward section stops leaning on the aurora and takes a photograph, and where the wiring round puts the first one.",
      options: [
        {
          id: "full-quality",
          label: "Full quality: three icon cards",
          means:
            "The section your note describes: three hairline icons, three claims, and nothing else, in the middle of chapter 1.",
        },
        {
          id: "no-app",
          label: "No app: the guest ledger",
          means:
            "The page's one left-aligned header and its hairline rows. It holds the home page's only Aurora room-cast, so a photograph would replace a light.",
        },
        {
          id: "pricing-teaser",
          label: "Pricing: three plan cards",
          means:
            "Chapter 3's plans, two sections from the end. A photograph lands late here, where the page is asking for a decision.",
        },
        {
          id: "none",
          label: "None: the sections as they are",
          means:
            "The aurora stays the only light these sections get, and the switching backdrop is banked for a page that needs it more.",
        },
      ],
      recommended: "full-quality",
      because:
        "It is the one your note names, it has the most empty section height on the page, and it sits sixth of the seven dark sections in chapter 1, which is the longest unbroken dark run on the site.",
      overrule:
        "If replacing a bespoke aurora is the point rather than filling a gap, the guest ledger is the section where a photograph takes a light's place.",
    },
    {
      id: "legibility",
      label: "The copy over it",
      question:
        "How should the copy stay readable over a photograph that keeps changing?",
      context:
        "The pool runs from a golden-hour flare to a dark club floor, so a treatment has to hold over the brightest photograph, not the first. The ground knob moves the section between a cinema chapter and a paper one, where a dark scrim would hurt.",
      lands:
        "The treatment every photograph backdrop on the site wears, on both grounds.",
      options: [
        {
          id: "plate",
          label: "A glass plate under the words",
          means:
            "The photograph is left alone; the words sit on the Glass board's frost pane, which re-samples the picture as it switches.",
        },
        {
          id: "scrim",
          label: "A scrim over the whole photograph",
          means:
            "One gradient, heavy at the section's two edges and lighter through the middle. The simplest, and the one that darkens the picture.",
        },
        {
          id: "half",
          label: "Half-bleed: the words beside it",
          means:
            "The photograph keeps the end 46 percent behind a hairline and the words keep the section's own ground. No contrast risk, a narrower column.",
        },
      ],
      recommended: "plate",
      because:
        "Bible 1 says the media is the colour, and the home hero's argument is that no layer darkens a photograph anywhere. A pane keeps that true everywhere except behind the words, and the switch reads through it.",
      overrule:
        "If a pane over a full-bleed photograph reads like a dialog rather than a section, the scrim is the quieter answer.",
      after: { ask: "section" },
      configs: [GROUND],
    },
    {
      id: "trigger",
      label: "What switches it",
      question: "What should make the photograph change?",
      context:
        "The same section and the same pool under three rules. The ring is the simulated cursor, drawn so a still shows its own cause; on the desk it is yours. The travel distance is on the knob, from the reference's 100 px up.",
      lands:
        "The rule every photograph backdrop follows, and whether a visitor can get back to a photograph they liked.",
      options: [
        {
          id: "band",
          label: "The cursor's position across it",
          means:
            "The pool is laid across the section's width, so moving back returns the photograph you just left. The section becomes something you scrub.",
        },
        {
          id: "travel",
          label: "Every so many pixels travelled",
          means:
            "The reference's rule: the next photograph arrives once the cursor has gone far enough, whichever way it went. It never comes back.",
        },
        {
          id: "cells",
          label: "Each card owns a photograph",
          means:
            "Hovering a card brings up its own picture, so the photograph and the words under the pointer are about the same thing.",
        },
      ],
      recommended: "band",
      because:
        "It is what your note asks for in words, and it is the only one of the three you can move back through: the photograph is a function of where the cursor IS, not of how far it has come.",
      overrule:
        "If the section should feel like a room that keeps changing rather than an instrument, travel is the livelier of the two.",
      after: { ask: "section" },
      configs: [TRAVEL],
    },
    {
      id: "entrance",
      label: "How it arrives",
      question: "How should the next photograph arrive?",
      context:
        "Each option is held still part-way through its entrance, so the three are pictures rather than animations you have to catch; on the desk they run. Nothing fades in any of them. The pace is on the knob.",
      lands:
        "The one motion a photograph backdrop makes, and how many milliseconds it takes.",
      options: [
        {
          id: "slide",
          label: "It slides in from the way you moved",
          means:
            "A tenth of the section wide, settling on an expo curve. The sliver of the photograph underneath is gone in about 90 ms.",
        },
        {
          id: "wipe",
          label: "It is uncovered from that edge",
          means:
            "The photograph does not move: a hard line crosses the section and leaves it behind. The page's own chapter-cut grammar, on its side.",
        },
        {
          id: "cut",
          label: "A hard cut, then a settle",
          means:
            "The photograph is simply there, 3.5 percent over size, easing back. A film cut with a breath after it.",
        },
      ],
      recommended: "slide",
      because:
        "It is the only one of the three that carries the direction you moved in, so the room answers the cursor rather than just noticing it, and expo-out makes 680 ms read crisp rather than slow.",
      overrule:
        "If the identity is the hard cut the chapters already use, the wipe is the same idea with no dissolve and no drift.",
      after: { ask: "trigger" },
      configs: [PACE],
    },
    {
      id: "rhythm",
      label: "Where it sits",
      question:
        "Where should a photograph section sit in the page's dark and light run?",
      context:
        "The home page runs seven dark sections, then three light, then five dark. The strip is every section at its measured share of the page's height, with the photograph drawn as one; the section is at 1:1 underneath.",
      lands:
        "Whether a photograph section breaks a chapter or joins two, and how many the page ends up with.",
      options: [
        {
          id: "swap-dark",
          label: "Inside the long dark run",
          means:
            "Full quality becomes a photograph, sixth of chapter 1's seven dark sections. The chapter map does not move.",
        },
        {
          id: "swap-paper",
          label: "Inside the light chapter",
          means:
            "Privacy becomes a photograph between two paper sections, so the morning-after chapter opens onto a room for one section.",
        },
        {
          id: "insert",
          label: "A new band at the chapter cut",
          means:
            "A photograph section is added where the page turns from the event to the morning after, so the cut gets a hinge instead of a hairline.",
        },
      ],
      recommended: "swap-dark",
      because:
        "Seven dark sections in a row is the page's longest unbroken stretch and the one your note is about; swapping one costs the page no height and no new copy.",
      overrule:
        "If the cut itself is the moment worth marking, the inserted band is the only option that adds a section rather than changing one.",
    },
    {
      id: "phone",
      label: "At a phone",
      question: "With no cursor, what should the section do on a phone?",
      context:
        "Every option is the same section in a 375 column with its rule already running. A phone has no pointer at all, so the question is what stands in for one, and the answer need not be the rule the cursor gets.",
      lands:
        "What a photograph backdrop does on the screen most guests and half the hosts will meet it on.",
      options: [
        {
          id: "scroll",
          label: "The scroll through the section",
          means:
            "The pool is indexed by how far the section has come up the screen, so the room changes as you move through it, as it does with a cursor.",
        },
        {
          id: "cycle",
          label: "A slow cycle on its own",
          means:
            "One photograph every 1.2 seconds, whether or not anyone is looking. The liveliest, and the only one that moves while you read.",
        },
        {
          id: "still",
          label: "One still photograph",
          means:
            "The section keeps the pool's first frame and nothing switches. It is also what a reader who asked for less motion gets under every option.",
        },
      ],
      recommended: "scroll",
      because:
        "It is the same idea the cursor rule has (the photograph follows where you are in the section) driven by the only thing a phone gives you, and it never moves while someone is holding still to read.",
      overrule:
        "If the section has to feel alive in a screenshot and in a scroll-stopped moment, the slow cycle is the only one that moves on its own.",
      tile: "phone",
    },
  ],
});
