"use client";

import { Camera, Globe, KeyRound, Lock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { VISIBILITY_HINTS } from "@/components/app/visibility-selector";
import { BrowserFrame } from "@/components/marketing/frames";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE ACCESS SWITCH (this page's signature): an interactive quote of the app's
 * real visibility control (components/app/visibility-selector.tsx), stylized to
 * marketing. Same three segments (Public / Password / Private, same icons),
 * same one-line hints (imported from the app module, the sanctioned
 * "any future surface" single source), driving ONE event-card preview through
 * the three guest-side states. The pill slides with the app's lifted-segment
 * look (bg-background + shadow-sm) instead of .mkt-tabs' 48px-radius track so
 * the mock stays shape-faithful; reduced motion swaps instantly.
 */

type Mode = "open" | "password" | "private";

const SEGMENTS: { mode: Mode; label: string; Icon: typeof Globe }[] = [
  { mode: "open", label: "Public", Icon: Globe },
  { mode: "password", label: "Password", Icon: KeyRound },
  { mode: "private", label: "Private", Icon: Lock },
];

// The site-wide fixture event (one coherent fictional album across pages) and
// its count, matching the ruled decomposition fact "Built from 214 photos."
const EVENT_NAME = "Maya & Jay's Wedding";
const PHOTO_COUNT = "214 photos";

/** Same manifest sweep the home album card uses, for cross-page coherence. */
const ALBUM_TILE_IDS = [
  "wedding-golden",
  "party-balloons",
  "wedding-toast",
  "festival-crowd",
  "reception-table",
  "party-dj",
  "wedding-arch",
  "concert-confetti",
];

export function AccessSwitch() {
  const [mode, setMode] = useState<Mode>("open");
  const index = SEGMENTS.findIndex((s) => s.mode === mode);

  return (
    <SectionShell
      eyebrow="Visibility"
      heading="Three ways to share, one switch."
      subhead="Every event answers one question: who can see the album. Try each answer below, exactly as the control works in the app."
    >
      <div className="mx-auto mt-10 flex max-w-xl flex-col gap-5">
        {/* The segmented control, quoted: muted track, active segment lifted.
            Plain aria-pressed buttons (the preview is decorative theater; the
            live hint line below carries the meaning). */}
        <div
          role="group"
          aria-label="Who can see this album?"
          className="relative grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 select-none"
        >
          {/* The sliding lift: one segment-shaped pill travels between slots.
              translateX(100%) = the pill's own width, so (100% + 4px) hops
              exactly one segment + the gap-1. */}
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc((100%-1rem)/3)] rounded-md bg-background shadow-sm transition-transform duration-250 ease-emphasis motion-reduce:transition-none"
            style={{
              transform: `translateX(calc(${index} * (100% + 0.25rem)))`,
            }}
          />
          {SEGMENTS.map(({ mode: value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/50",
                "active:scale-[0.98] motion-reduce:active:scale-100",
                mode === value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* The one hint line, verbatim from the app (aria-live so the swap is
            announced; the re-key replays a whisper of entrance). */}
        <p aria-live="polite" className="min-h-5 text-center">
          <span
            key={mode}
            className="text-sm text-muted-foreground motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
          >
            {VISIBILITY_HINTS[mode]}
          </span>
        </p>

        {/* The guest-side preview: one card, three states, cross-faded in a
            grid stack (every panel shares the tallest box, so nothing jumps). */}
        <div aria-hidden className="select-none">
          <BrowserFrame label="partyreel.com/a/maya-and-jay">
            <div className="grid">
              <PreviewPanel active={mode === "open"}>
                <div className="grid grid-cols-4 gap-2">
                  {ALBUM_TILE_IDS.map((id) => {
                    const m = marketingImage(id);
                    return (
                      <div
                        key={id}
                        className="relative aspect-square overflow-hidden rounded-lg"
                      >
                        <Image
                          src={m.src}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 136px, 25vw"
                          className="object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              </PreviewPanel>

              <PreviewPanel active={mode === "password"}>
                <GhostBackdrop />
                <div className="z-10 flex items-center justify-center p-3 [grid-area:1/1]">
                  <div className="w-full max-w-[17rem] rounded-xl border bg-card/95 p-4 text-center shadow-sm backdrop-blur">
                    <p className="flex items-center justify-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      <Lock className="size-3" />
                      Almost in
                    </p>
                    <p className="mt-1.5 font-heading text-base text-balance sm:text-lg">
                      {EVENT_NAME} is private
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter the password from your invite to come in.
                    </p>
                    <div className="mt-3 flex h-8 items-center rounded-md border bg-background px-2.5 text-xs tracking-[0.3em] text-muted-foreground">
                      ••••••••
                    </div>
                    <div className="mt-2 flex h-8 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
                      Unlock
                    </div>
                  </div>
                </div>
              </PreviewPanel>

              <PreviewPanel active={mode === "private"}>
                <GhostBackdrop />
                <div className="z-10 flex items-center justify-center p-3 [grid-area:1/1]">
                  <div className="flex flex-col items-center gap-2 rounded-xl border bg-card/95 px-8 py-6 text-center shadow-sm backdrop-blur">
                    <span className="flex size-9 items-center justify-center rounded-full border text-muted-foreground">
                      <Lock className="size-4" />
                    </span>
                    <p className="font-heading text-base text-balance sm:text-lg">
                      {EVENT_NAME}
                    </p>
                    <MonoCaption>{PHOTO_COUNT}</MonoCaption>
                  </div>
                </div>
              </PreviewPanel>
            </div>
          </BrowserFrame>
        </div>

        {/* The plan truth, stated once and quietly (the app disables the
            Password segment on free and says so in the same words). */}
        <MonoCaption className="text-center">
          On the free plan the Password segment is disabled: password protection
          is a Pro and Event Pass feature.
        </MonoCaption>
      </div>
    </SectionShell>
  );
}

/**
 * One stacked preview state; inactive panels fade out and stop catching taps.
 * Each panel is its own grid stack so an overlay card (the unlock / locked
 * states) CONTRIBUTES to the shared height instead of absolutely overflowing
 * it: the outer stack sizes to the tallest state at every width (the 375
 * check caught the unlock card spilling past the frame).
 */
function PreviewPanel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-opacity duration-250 ease-emphasis [grid-area:1/1] motion-reduce:transition-none",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {children}
    </div>
  );
}

/**
 * The locked-gallery tease behind the gated states, echoing the app's ghost
 * grid (components/guest/ghost-grid.tsx): shape and count, zero pixels. Same
 * 4x2 footprint as the open album so the card never changes height.
 */
function GhostBackdrop() {
  return (
    <div className="grid grid-cols-4 gap-2 self-center [grid-area:1/1]">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center rounded-lg border border-border/70 bg-muted/60"
        >
          {/* Cameras on the outer columns, where the centered card can't
              cover them (the app puts one every 4th cell for the same
              "not a broken grid" read). */}
          {(i === 3 || i === 4) && (
            <Camera className="size-4 text-muted-foreground/40" />
          )}
        </div>
      ))}
    </div>
  );
}
