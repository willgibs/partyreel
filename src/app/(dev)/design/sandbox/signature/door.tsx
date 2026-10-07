"use client";

import type { CSSProperties, ReactNode } from "react";

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
import { albumLight, huesOf, keyLight, Seam, Strip } from "./light";
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
 * document and draws its light inside the sheet, behind every word.
 *
 * ★ THE SEAM IS SPENT BEFORE THE WORDS (Afterglow's "never behind words"):
 * the sheet's free edge is its top in a hand and its left at a desk, and the
 * light falls only as far as the sheet's own margin before the first line.
 * On paper it sits in a strip of the room along that edge, and the sheet's
 * words step past the strip.
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

/** How far the Seam falls into the sheet before its first line, per edge. */
const REACH = { top: 44, left: 24 } as const;
/** The strip of the room on paper: the brand's minimum, so the light has room to fall. */
const STRIP = 30;

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

/** The option's light on the sheet's free edge, behind every word (the sheet is its own stacking context). */
function EdgeLight({
  way,
  step,
  edge,
  ground,
}: {
  way: DoorWay;
  step: DoorStep;
  edge: "top" | "left";
  ground: Ground;
}) {
  if (way === "lamps" || way === "none") return null;
  // ★ IT GROWS WITH HER STEPS: short at the first, its whole reach once she is at the last (here her photo).
  const share = way === "grows" && step === "name" ? 0.42 : 1;
  const place: CSSProperties =
    edge === "top"
      ? { position: "absolute", left: 0, right: 0, top: 0, zIndex: -1 }
      : { position: "absolute", top: 0, bottom: 0, left: 0, zIndex: -1 };
  if (ground === "paper")
    return (
      <span style={place} data-sg-door-light="strip">
        <Strip
          light={COVER_LIGHT}
          edge={edge}
          height={STRIP}
          style={{
            ...(edge === "left" ? { height: "100%" } : null),
            // On paper the strip keeps its height; growing, its light spreads along it instead.
            ...(share < 1
              ? ({
                  WebkitMaskImage: `linear-gradient(${edge === "top" ? "90deg" : "180deg"}, #000 ${share * 100}%, transparent ${share * 100 + 18}%)`,
                  maskImage: `linear-gradient(${edge === "top" ? "90deg" : "180deg"}, #000 ${share * 100}%, transparent ${share * 100 + 18}%)`,
                } as CSSProperties)
              : null),
          }}
        />
      </span>
    );
  return (
    <span
      style={{
        ...place,
        ...(edge === "top" ? { height: REACH.top } : { width: REACH.left }),
      }}
      data-sg-door-light="seam"
    >
      <Seam
        light={COVER_LIGHT}
        edge={edge}
        reach={Math.round(REACH[edge] * share)}
      />
    </span>
  );
}

/** On paper the strip takes the sheet's first room, so the words step past it. */
function Past({
  ground,
  edge,
  way,
  children,
}: {
  ground: Ground;
  edge: "top" | "left";
  way: DoorWay;
  children: ReactNode;
}) {
  if (ground !== "paper" || way === "lamps" || way === "none")
    return <>{children}</>;
  return (
    <div style={edge === "top" ? { paddingTop: 22 } : { paddingLeft: 16 }}>
      {children}
    </div>
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
  return (
    <div ref={root} data-sg-door={way} data-sg-step={step}>
      {way !== "lamps" ? <style>{NO_LAMP}</style> : null}
      <GuestAlbum screen={screen} ground={ground} seam={null} scroll={false} />
      <EntryShell
        open
        dismissMode="held"
        onDismiss={() => {}}
        title={step === "name" ? copy.title : "Add your photos"}
        description={
          step === "name" ? copy.reason : "Add one now, or look around first."
        }
      >
        <EdgeLight way={way} step={step} edge={edge} ground={ground} />
        <Past ground={ground} edge={edge} way={way}>
          {step === "name" ? <NameBody /> : <PhotoBody />}
        </Past>
      </EntryShell>
    </div>
  );
}
