"use client";

import { Camera, Globe, KeyRound, Lock } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { VISIBILITY_HINTS } from "@/components/app/visibility-selector";
import { BrowserFrame } from "@/components/marketing/frames";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
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
      {/* The switch, its hint, and its preview are ONE device, so they arrive
          together on slot 3 (SectionShell's header spends 0-2); the plan note
          follows a beat later. */}
      <Reveal className="mx-auto mt-10 flex max-w-xl flex-col gap-5">
        {/* The segmented control, quoted: muted track, active segment lifted.
            Plain aria-pressed buttons (the preview is decorative theater; the
            live hint line below carries the meaning). */}
        <div
          role="group"
          aria-label="Who can see this album?"
          data-mkt-reveal
          className="relative grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 select-none"
          style={{ "--i": 3 } as CSSProperties}
        >
          {/* The sliding lift: one segment-shaped pill travels between slots.
              translateX(100%) = the pill's own width, so (100% + 4px) hops
              exactly one segment + the gap-1. */}
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc((100%-1rem)/3)] rounded-md bg-background shadow-sm transition-transform ease-emphasis [transition-duration:var(--mkt-tabs-dur)] motion-reduce:transition-none"
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
            announced), on the house text-swap recipe. */}
        <p
          aria-live="polite"
          data-mkt-reveal
          className="min-h-5 text-center"
          style={{ "--i": 3 } as CSSProperties}
        >
          <HintSwap text={VISIBILITY_HINTS[mode]} />
        </p>

        {/* The guest-side preview: one card, three states, cross-faded in a
            grid stack (every panel shares the tallest box, so nothing jumps). */}
        <div
          aria-hidden
          data-mkt-reveal
          className="select-none"
          style={{ "--i": 3 } as CSSProperties}
        >
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

        {/* The plan truth, stated at body weight. It used to hide in 12px mono
            under the demo, which reads coy on the page whose whole job is
            being straight with you; a paid gate on a trust page should be
            legible at a glance. Same words the app uses. */}
        <p
          data-mkt-reveal
          className="mx-auto flex max-w-md items-start gap-2.5 rounded-lg border bg-card/60 px-3.5 py-2.5 text-sm text-muted-foreground"
          style={{ "--i": 4 } as CSSProperties}
        >
          <KeyRound className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
          <span>
            <span className="font-medium text-foreground">
              Password protection is a Pro and Event Pass feature.
            </span>{" "}
            On the free plan the Password segment is disabled.
          </span>
        </p>
      </Reveal>
    </SectionShell>
  );
}

/**
 * The hint line on the house text-swap recipe (.mkt-text-swap, marketing.css
 * chapter 2) instead of tw-animate utilities: the old line exits upward with
 * blur, the new one enters from below. Three phases exactly as the recipe
 * specifies — is-exit, swap the text with is-enter-start (transition off),
 * force the reflow, release — with the clock READ from the CSS, never
 * hardcoded (Lightning CSS canonicalizes 150ms to `.15s`, which parseInt would
 * read as 0). Reduced motion swaps instantly: the CSS kills the transition, so
 * waiting on it there would only delay the words.
 */
function HintSwap({ text }: { text: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(text);
  // React renders the FIRST hint and then never touches this node's text again
  // (the children it sees are constant state, never updated); the effect below
  // owns every swap, the way the recipe wants it: a DOM update, not a render.
  const [initial] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown.current === text) return;
    shown.current = text;
    if (reduced) {
      el.textContent = text;
      return;
    }
    el.classList.add("is-exit");
    const t = setTimeout(() => {
      el.textContent = text;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      // Read a layout property so the browser commits the entry pose BEFORE
      // the class comes off; without this reflow there is no start value to
      // transition from and the line would just appear.
      void el.offsetHeight;
      el.classList.remove("is-enter-start");
    }, readCssMs("--mkt-swap-dur", 150));
    return () => clearTimeout(t);
  }, [text, reduced]);

  return (
    <span ref={ref} className="mkt-text-swap text-sm text-muted-foreground">
      {initial}
    </span>
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
        // Same clock as the pill it belongs to: the segments and their panels
        // are one control, so the duration has ONE home (--mkt-tabs-dur).
        "grid transition-opacity ease-emphasis [transition-duration:var(--mkt-tabs-dur)] [grid-area:1/1] motion-reduce:transition-none",
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
