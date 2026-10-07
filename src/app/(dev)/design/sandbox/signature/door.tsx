"use client";

import { type CSSProperties, type RefObject, useEffect, useState } from "react";

import { DoorHeading } from "@/components/guest/door/heading";
import { EntryShell } from "@/components/guest/entry-shell";
import { guestNameCopy } from "@/components/guest/guest-name-step";
import { UploadIntentBody } from "@/components/guest/upload/intent-sheet";
import { uploadStepReason } from "@/components/guest/upload-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishDoorHues } from "@/lib/guest/door-light";

import { GuestAlbum } from "./album";
import { ALBUM, COVER } from "./fixtures";
import type { Ground, Screen } from "./knobs";
import { albumLight, huesOf, keyLight, Seam } from "./light";
import { useNoFocus } from "./live";

/**
 * THE DOOR, OVER MAYA & JAY'S ALBUM: production's own sheet (`EntryShell`,
 * held, with its lit scrim over the album behind it) asking a new guest her
 * name, then her first photo, in production's own words and parts
 * (`guestNameCopy`, `DoorHeading`, `UploadIntentBody`, `uploadStepReason`).
 *
 * ★ TODAY'S LAMP IS PRODUCTION'S (`DoorLamp`, the shell's own), lit with the
 * album's three hues as the page's sampler hands them (`publishDoorHues`, here
 * the stills' reads). Every other option stands it down in the frame's own
 * document.
 *
 * ★ THE ONE LIGHT LIVES AT THE ALBUM'S EDGE, IN ITS DARK, NEVER ON THE SHEET
 * (the creative director's pass): the dimmed album over the sheet is already
 * the room, so the cover's light is born where the album meets the sheet's
 * free edge (its top in a hand, its left at a desk) and rises into the album
 * a little way, the scrim darkened under it so the light has its dark. The
 * sheet stays clean, its words untouched, and the answer is one construction
 * in the room and on paper alike (on paper the light never touches the
 * page: here it never even touches the sheet).
 *
 * ★ STAND-INS, SAID ONCE: the name step is drawn from production's atoms with
 * its words (the component itself posts to the server), the album behind is
 * the album's first screen, and every press is inert.
 */

// The page's sampler, as it would hand the door the album's newest photographs' light.
publishDoorHues(huesOf(albumLight(ALBUM.slice(0, 6).map((s) => s.id))));

export type DoorWay = "lamps" | "seam" | "grows" | "none";
export type DoorStep = "name" | "photo";

/**
 * THE COVER PHOTOGRAPH'S ONE LIGHT: its key (the heaviest hue it gives off) at
 * three depths, where today's lamp lays three of the album's hues side by side.
 */
const COVER_LIGHT = keyLight(COVER.id);

/** How far the light rises into the album from the sheet's edge, at her last step (the creative director's 28 px). */
const REACH = 30;
/** How far the album's scrim is darkened over the edge, so the light stands in its own dark. */
const DARK = 44;

/** Production's own stand-down of today's lamp, in the frame's document alone. */
const NO_LAMP = "[data-door-lamp] { display: none !important; }";

function NameBody() {
  const copy = guestNameCopy("join");
  return (
    <div className="flex flex-col gap-4 pt-1">
      <DoorHeading title={copy.title} reason={copy.reason} />
      <Input
        tabIndex={-1}
        placeholder="Your name"
        defaultValue="Priya"
        className="h-11 text-base"
      />
      <Button type="button" size="cta" tabIndex={-1} className="w-full">
        Continue
      </Button>
    </div>
  );
}

function PhotoBody() {
  return (
    <div data-upload-step="pick" className="flex flex-col gap-4 pt-1">
      <DoorHeading
        title="Add your photos"
        reason={uploadStepReason({
          isDemo: false,
          requireUpload: false,
          albumEmpty: false,
          camera: false,
        })}
      />
      <UploadIntentBody
        picks={[]}
        onPicks={() => {}}
        onSend={() => {}}
        footer={
          <Button
            type="button"
            variant="ghost"
            tabIndex={-1}
            className="w-full text-muted-foreground"
          >
            Skip for now
          </Button>
        }
      />
    </div>
  );
}

/** The sheet's box in the frame, read once it has risen (the panel portals a commit after it mounts, then slides in). */
function useSheetBox(ref: RefObject<HTMLElement | null>) {
  const [box, setBox] = useState<DOMRect | null>(null);
  useEffect(() => {
    const doc = ref.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;
    const read = () => {
      const sheet = doc.querySelector<HTMLElement>("[data-entry-sheet]");
      if (sheet) setBox(sheet.getBoundingClientRect());
    };
    const timers = [60, 400, 900, 1600].map((ms) => win.setTimeout(read, ms));
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [ref]);
  return box;
}

/**
 * THE LIGHT AT THE ALBUM'S EDGE: a Seam born on the sheet's free edge and
 * rising into the album (the album's side of the edge, never the sheet's), over
 * a darkening of the scrim along that edge. Above the scrim, never over the
 * sheet: it stands wholly outside the panel's box.
 */
function AlbumEdgeLight({
  way,
  step,
  edge,
  box,
}: {
  way: DoorWay;
  step: DoorStep;
  edge: "top" | "left";
  box: DOMRect | null;
}) {
  if (way === "lamps" || way === "none" || !box) return null;
  // ★ IT GROWS WITH HER STEPS: short at her first, its whole reach once she is at the last (here her photo).
  const reach = way === "grows" && step === "name" ? 12 : REACH;
  const place: CSSProperties =
    edge === "top"
      ? { left: box.left, width: box.width, top: box.top - DARK, height: DARK }
      : { top: 0, bottom: 0, left: box.left - DARK, width: DARK };
  const dark = `linear-gradient(${edge === "top" ? "to top" : "to left"}, rgb(0 0 0 / 0.42) 0, rgb(0 0 0 / 0.16) 55%, transparent 100%)`;
  return (
    <span
      aria-hidden
      data-sg-door-light={way}
      className="pointer-events-none fixed z-[51] block"
      style={place}
    >
      <span className="absolute inset-0 block" style={{ background: dark }} />
      <span
        className="absolute block"
        style={
          edge === "top"
            ? { left: 0, right: 0, bottom: 0, height: reach }
            : { top: 0, bottom: 0, right: 0, width: reach }
        }
      >
        <Seam
          light={COVER_LIGHT}
          edge={edge === "top" ? "bottom" : "right"}
          reach={reach}
        />
      </span>
    </span>
  );
}

export function DoorScene({
  way,
  screen,
  ground,
  step,
}: {
  way: DoorWay;
  screen: Screen;
  ground: Ground;
  step: DoorStep;
}) {
  const edge = screen === "1440" ? "left" : "top";
  const copy = guestNameCopy("join");
  const root = useNoFocus();
  const box = useSheetBox(root);
  return (
    <div ref={root} data-sg-door={way} data-sg-step={step}>
      {way !== "lamps" ? <style>{NO_LAMP}</style> : null}
      <GuestAlbum screen={screen} ground={ground} seam={false} scroll="top" />
      <EntryShell
        open
        dismissMode="held"
        onDismiss={() => {}}
        title={step === "name" ? copy.title : "Add your photos"}
        description={
          step === "name" ? copy.reason : "Add one now, or look around first."
        }
      >
        {step === "name" ? <NameBody /> : <PhotoBody />}
      </EntryShell>
      <AlbumEdgeLight way={way} step={step} edge={edge} box={box} />
    </div>
  );
}
