"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  Images,
  Lock,
  Maximize2,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { Drawer } from "vaul";

import { cn } from "@/lib/utils";
import { EVENT_NAME, PHOTOS, PORTRAIT_PHOTO } from "../screens/sample-photos";
import { PhoneShell } from "../screens/phone-shell";

/**
 * THE ARRIVAL FLOW PLAYER (Phase 4.5 S1). An interactive, playable prototype
 * of the gated guest arrival as ONE choreographed narrative:
 *
 *   Act 1 "the stage"      - the locked page settles (name + ghost grid enter)
 *   Act 2 "the invitation" - after a deliberate beat, the sheet rises (REAL
 *                            Vaul physics, the iOS drawer curve)
 *   Act 3 "the threshold"  - the warm password gate (no autofocus, back
 *                            affordance, animated height)
 *   Act 4 "the reveal"     - success morph in --success green, sheet exits,
 *                            the gallery staggers in behind it
 *
 * Two containment modes: framed (Vaul portals into the PhoneShell screen; the
 * screen carries translateZ(0) so position:fixed anchors to it) and FULL
 * SCREEN (real viewport, real keyboard, real rubber-band - the mode Will
 * judges on his iPhone). The fake password is "demo". Hand-built per lab
 * convention: no production imports; the tuning Will lands on ratifies
 * verbatim into touchpoints.ts decisionNote and becomes production constants.
 */

export type ArrivalTuning = {
  beatMs: 450 | 600 | 700;
  welcomeHeight: "content" | "tall" | "taller";
  transition: "slide" | "rise" | "none";
  success: "check-700" | "morph-900" | "morph-1200";
  typeScale: "current" | "bumped" | "bumpier";
};

export const ARRIVAL_PRESETS: Record<
  "calm" | "swift" | "stately",
  ArrivalTuning
> = {
  calm: {
    beatMs: 600,
    welcomeHeight: "tall",
    transition: "slide",
    success: "morph-900",
    typeScale: "bumped",
  },
  swift: {
    beatMs: 450,
    welcomeHeight: "content",
    transition: "rise",
    success: "check-700",
    typeScale: "bumped",
  },
  stately: {
    beatMs: 700,
    welcomeHeight: "taller",
    transition: "slide",
    success: "morph-1200",
    typeScale: "bumpier",
  },
};

export function tuningSummary(t: ArrivalTuning): string {
  const success =
    t.success === "check-700"
      ? "check only 700ms"
      : t.success === "morph-900"
        ? "morph + hold 900ms"
        : "morph + hold 1200ms";
  return [
    `beat ${t.beatMs}ms (return visits 350ms)`,
    `welcome ${t.welcomeHeight}`,
    `transition ${t.transition}`,
    `success ${success}`,
    `type ${t.typeScale}`,
  ].join(" / ");
}

type Phase = "idle" | "stage" | "welcome" | "gate" | "success" | "revealed";

const SUCCESS_MS: Record<ArrivalTuning["success"], number> = {
  "check-700": 700,
  "morph-900": 900,
  "morph-1200": 1200,
};

/* Type-scale presets: stage name / welcome hero / gate title. */
const SCALE = {
  current: { stage: "text-xl", hero: "text-xl", gate: "text-xl" },
  bumped: { stage: "text-[26px]", hero: "text-[28px]", gate: "text-[22px]" },
  bumpier: { stage: "text-[28px]", hero: "text-[32px]", gate: "text-2xl" },
} as const;

/* Welcome presence: px inside the measured-height container so the
   welcome -> gate shrink GLIDES through the same height transition (the
   production translation is ~55/65svh). */
const WELCOME_MIN_H = {
  content: "",
  tall: "min-h-[340px]",
  taller: "min-h-[420px]",
} as const;

export function ArrivalPlayer({ tuning }: { tuning: ArrivalTuning }) {
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [full, setFull] = useState(false);
  // The Vaul portal target = the active screen element, so the drawer inherits
  // the lab's .mono tokens in BOTH modes.
  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Act 1 -> Act 2: the arrival beat. The whole point of the knob: the page
  // settles FIRST, then the invitation arrives as its own deliberate act.
  useEffect(() => {
    if (phase !== "stage") return;
    const t = setTimeout(
      () => setPhase("welcome"),
      reduced ? 0 : tuning.beatMs,
    );
    return () => clearTimeout(t);
  }, [phase, tuning.beatMs, reduced]);

  // Act 4: the success hold, then the sheet exit + the reveal together (the
  // 250ms exit overlaps the gallery's entrance: the sheet IS the curtain).
  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(
      () => setPhase("revealed"),
      reduced ? 0 : SUCCESS_MS[tuning.success],
    );
    return () => clearTimeout(t);
  }, [phase, tuning.success, reduced]);

  const start = useCallback(() => {
    setRunId((n) => n + 1);
    setPhase("stage");
  }, []);

  const sheetOpen =
    phase === "welcome" || phase === "gate" || phase === "success";

  const screen = (
    <div
      ref={setScreenEl}
      data-arrival-player
      className="relative h-full w-full overflow-hidden bg-background text-foreground"
      style={full ? undefined : { transform: "translateZ(0)" }}
    >
      {phase === "idle" ? (
        <IdleScreen onPlay={start} />
      ) : (
        <RunScreen
          key={runId}
          phase={phase}
          tuning={tuning}
          onReplay={start}
        />
      )}

      {/* The sheet lives OUTSIDE the keyed run so its exit animation is never
          cut short by a replay remount. */}
      {screenEl && (
        <Drawer.Root
          open={sheetOpen}
          // The firm password flow: no swipe-away (rubber-band resistance is
          // the honest signal). Account-gated events keep real dismissal +
          // "Just browsing"; that path is out of this player's scope.
          dismissible={false}
          modal={full}
          container={screenEl}
          repositionInputs
        >
          <Drawer.Portal>
            <Drawer.Overlay
              data-arrival-overlay
              className="absolute inset-0 z-20 bg-black/10"
            />
            <Drawer.Content
              data-arrival-sheet
              aria-describedby={undefined}
              className={cn(
                // position:fixed anchors to the framed screen (its transform
                // is the containing block) or the real viewport when full.
                "fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[calc(var(--radius-action)*1.4)] border border-b-0 border-border bg-popover px-6 pt-5 text-popover-foreground outline-none",
                full
                  ? "pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                  : "pb-6",
              )}
            >
              <Drawer.Title className="sr-only">
                Welcome to {EVENT_NAME}
              </Drawer.Title>
              <SheetBody
                phase={phase}
                tuning={tuning}
                onContinue={() => setPhase("gate")}
                onUnlock={() => setPhase("success")}
              />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      {/* Full-screen exit: small, top-right, above everything. */}
      {full && (
        <button
          type="button"
          aria-label="Exit full screen"
          onClick={() => {
            setFull(false);
            setPhase("idle");
          }}
          className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-40 flex size-8 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 backdrop-blur-sm"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Scoped motion CSS: the step-transition variants, the Vaul
          exit-faster + reduced-motion overrides (vaul writes 500ms INLINE,
          so the overrides need !important; keyed to data-state="closed" so
          drag-release physics stay untouched). */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          [data-arrival-step] {
            transition: opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
          }
          [data-arrival-step][data-dir="fwd"] { @starting-style { opacity: 0; transform: translateX(16px); } }
          [data-arrival-step][data-dir="back"] { @starting-style { opacity: 0; transform: translateX(-16px); } }
          [data-arrival-step][data-dir="rise"] { @starting-style { opacity: 0; transform: translateY(8px); } }
          [data-arrival-sheet][data-state="closed"] { transition-duration: 250ms !important; }
          [data-arrival-overlay][data-state="closed"] { transition-duration: 200ms !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-arrival-step] { transition: opacity 180ms ease-out; }
          [data-arrival-step][data-dir] { @starting-style { opacity: 0; } }
          [data-arrival-sheet], [data-arrival-overlay] { transition-duration: 0.01ms !important; }
        }
      `}</style>

      {full ? (
        <div className="fixed inset-0 z-50">{screen}</div>
      ) : (
        <PhoneShell className="max-w-[340px]">
          <div className="absolute inset-0">{screen}</div>
        </PhoneShell>
      )}

      {!full && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            data-dir-press
            onClick={() => {
              setFull(true);
              setPhase("idle");
            }}
            className="flex h-9 items-center gap-2 rounded-[var(--radius-action-sm)] border border-border px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <Maximize2 className="size-3.5" />
            Play full screen
          </button>
        </div>
      )}
    </div>
  );
}

/* ── The pre-play screen ─────────────────────────────────────────────────── */

function IdleScreen({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <button
        type="button"
        data-dir-press
        onClick={onPlay}
        aria-label="Play the arrival"
        className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <Play className="ml-1 size-6" />
      </button>
      <div>
        <p className="text-sm font-medium">Play the arrival</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          A guest scans the QR of a password event. The password here is
          &ldquo;demo&rdquo;.
        </p>
      </div>
    </div>
  );
}

/* ── One run of the narrative (keyed by runId so entrances replay) ───────── */

function RunScreen({
  phase,
  tuning,
  onReplay,
}: {
  phase: Phase;
  tuning: ArrivalTuning;
  onReplay: () => void;
}) {
  const scale = SCALE[tuning.typeScale];
  const revealed = phase === "revealed";

  return (
    <div className="flex h-full flex-col overflow-hidden px-5 pt-12">
      {/* The event name is THE fixed point: it mounts when the run starts and
          never remounts, so it stays planted while the world changes around
          it (locked stage -> revealed gallery). */}
      <p
        data-dir-enter
        data-dir-display
        className={cn("leading-tight text-balance", scale.stage)}
      >
        {EVENT_NAME}
      </p>

      {!revealed ? (
        <>
          <p
            data-dir-enter
            style={{ transitionDelay: "60ms" }}
            className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground"
          >
            <Lock className="size-3.5" aria-hidden />
            24 photos &amp; videos inside
          </p>
          <div
            data-dir-enter
            style={{ transitionDelay: "120ms" }}
            className="mt-4 flex-1"
          >
            <GhostGridLab />
          </div>
        </>
      ) : (
        <RevealedBody onReplay={onReplay} />
      )}
    </div>
  );
}

/* The locked stage's ghost grid: shape + count, zero pixels (mirrors the
   ratified production GhostGrid; hand-built per lab convention). */
function GhostGridLab() {
  return (
    <div aria-hidden className="grid grid-cols-3 gap-[3px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center rounded-[var(--radius-tile)] border border-border/70 bg-muted/60"
        >
          {i % 4 === 0 && (
            <Camera className="size-4 text-muted-foreground/40" />
          )}
        </div>
      ))}
    </div>
  );
}

/* Act 4's payoff: the byline/stats/Add rise in a small stagger (mirrors the
   production data-reveal plan), then the masonry cascades after them. */
function RevealedBody({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div data-dir-stagger>
        <p
          style={{ "--i": 0 } as React.CSSProperties}
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span className="relative inline-block size-5 overflow-hidden rounded-full">
            <Image
              src={PORTRAIT_PHOTO}
              alt=""
              fill
              sizes="20px"
              className="object-cover"
            />
          </span>
          Hosted by <span className="font-medium text-foreground">Maya</span>
          <span aria-hidden className="text-muted-foreground/50">
            ·
          </span>
          June 14, 2026
        </p>
        <p
          style={{ "--i": 1 } as React.CSSProperties}
          className="mt-1 text-xs text-muted-foreground"
        >
          24 photos &amp; videos from 9 guests
        </p>
        <button
          type="button"
          style={{ "--i": 2 } as React.CSSProperties}
          data-dir-press
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-action)] bg-primary text-sm font-medium text-primary-foreground"
        >
          <Camera className="size-4" />
          Add photos
        </button>
      </div>

      <div
        aria-hidden
        data-dir-stagger
        className="mt-3 min-h-0 flex-1 columns-2 gap-[3px] overflow-hidden"
      >
        {PHOTOS.slice(0, 8).map((src, i) => (
          <div
            key={src}
            style={{ "--i": i + 3 } as React.CSSProperties}
            className={cn(
              "relative mb-[3px] overflow-hidden rounded-[var(--radius-tile)]",
              ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]"][
                i % 4
              ],
            )}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex justify-center">
        <button
          type="button"
          data-dir-press
          onClick={onReplay}
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-full bg-foreground/85 px-4 text-[13px] font-medium text-background backdrop-blur-sm"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
      </div>
    </div>
  );
}

/* ── The sheet body: welcome <-> gate inside ONE height-animated container ── */

function SheetBody({
  phase,
  tuning,
  onContinue,
  onUnlock,
}: {
  phase: Phase;
  tuning: ArrivalTuning;
  onContinue: () => void;
  onUnlock: () => void;
}) {
  // The back affordance ("reviewing the welcome"), mirroring the production
  // plan: a transient view OVER the flow; the flow itself only moves forward.
  // Direction is EVENT-DRIVEN state (the back chevron is the only "back").
  const [reviewing, setReviewing] = useState(false);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");

  // The typed password survives the back trip (the gate step unmounts while
  // reviewing; losing the half-typed value would punish curiosity).
  const [gateValue, setGateValue] = useState("");

  // Reset the transient view when the FLOW advances (the sanctioned
  // adjust-state-during-render pattern; no effect, no refs).
  const [prevPhase, setPrevPhase] = useState(phase);
  if (phase !== prevPhase) {
    setPrevPhase(phase);
    setReviewing(false);
    setDirection("fwd");
    if (phase === "welcome") setGateValue("");
  }

  const step: "welcome" | "gate" =
    phase === "welcome" || reviewing ? "welcome" : "gate";

  const dir =
    tuning.transition === "none"
      ? undefined
      : tuning.transition === "rise"
        ? "rise"
        : direction;

  return (
    <HeightAnimated>
      <div key={step} data-arrival-step data-dir={dir}>
        {step === "welcome" ? (
          <WelcomeStepLab
            scale={SCALE[tuning.typeScale]}
            minH={WELCOME_MIN_H[tuning.welcomeHeight]}
            reviewing={reviewing}
            onContinue={() => {
              setDirection("fwd");
              if (reviewing) setReviewing(false);
              else onContinue();
            }}
          />
        ) : (
          <GateStepLab
            phase={phase}
            tuning={tuning}
            value={gateValue}
            onValueChange={setGateValue}
            onBack={() => {
              setDirection("back");
              setReviewing(true);
            }}
            onUnlock={onUnlock}
          />
        )}
      </div>
    </HeightAnimated>
  );
}

/* The measured-height container (the S3 production mechanism, proven here):
   a ResizeObserver feeds the px height into a CSS transition, so step swaps
   AND same-step growth (the error line appearing) glide instead of jumping. */
function HeightAnimated({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    setH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="overflow-hidden"
      style={{
        height: h ?? undefined,
        transition: "height 300ms cubic-bezier(0.77, 0, 0.175, 1)",
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

function WelcomeStepLab({
  scale,
  minH,
  reviewing,
  onContinue,
}: {
  scale: (typeof SCALE)[keyof typeof SCALE];
  minH: string;
  reviewing: boolean;
  onContinue: () => void;
}) {
  return (
    <div className={cn("flex flex-col gap-5 pb-1", minH)}>
      <div data-dir-stagger className="flex flex-col">
        <p
          style={{ "--i": 0 } as React.CSSProperties}
          className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
        >
          You&rsquo;re invited to
        </p>
        <p
          style={{ "--i": 1 } as React.CSSProperties}
          data-dir-display
          className={cn("mt-1.5 leading-[1.15] text-balance", scale.hero)}
        >
          {EVENT_NAME}
        </p>
        <p
          style={{ "--i": 2 } as React.CSSProperties}
          className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground"
        >
          <span className="relative inline-block size-5 overflow-hidden rounded-full">
            <Image
              src={PORTRAIT_PHOTO}
              alt=""
              fill
              sizes="20px"
              className="object-cover"
            />
          </span>
          Hosted by Maya
          <span aria-hidden className="text-muted-foreground/50">
            ·
          </span>
          June 14, 2026
        </p>
      </div>

      <div data-dir-stagger className="flex flex-col gap-3.5">
        <p
          style={{ "--i": 3 } as React.CSSProperties}
          className="flex items-start gap-3 text-base leading-relaxed"
        >
          <Camera className="mt-1 size-4.5 shrink-0 text-muted-foreground" />
          Add your photos and videos in seconds. No app, no account.
        </p>
        <p
          style={{ "--i": 4 } as React.CSSProperties}
          className="flex items-start gap-3 text-base leading-relaxed"
        >
          <Images className="mt-1 size-4.5 shrink-0 text-muted-foreground" />
          Everyone&rsquo;s shots land in one gallery. 24 are already inside.
        </p>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          data-dir-press
          onClick={onContinue}
          className="flex h-12 w-full items-center justify-center rounded-[var(--radius-action-lg)] bg-primary text-[15px] font-medium text-primary-foreground"
        >
          {reviewing ? "Back to the password" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function GateStepLab({
  phase,
  tuning,
  value,
  onValueChange,
  onBack,
  onUnlock,
}: {
  phase: Phase;
  tuning: ArrivalTuning;
  value: string;
  onValueChange: (v: string) => void;
  onBack: () => void;
  onUnlock: () => void;
}) {
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scale = SCALE[tuning.typeScale];
  const success = phase === "success";
  const morph = tuning.success !== "check-700";

  return (
    <div className="flex flex-col gap-4 pb-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            <Lock className="size-3" aria-hidden />
            Almost in
          </p>
          <p
            data-dir-display
            className={cn("mt-1.5 leading-tight text-balance", scale.gate)}
          >
            {EVENT_NAME} is private
          </p>
        </div>
        <button
          type="button"
          aria-label="Back to the welcome"
          onClick={onBack}
          disabled={success}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>

      <p className="text-base leading-relaxed text-muted-foreground">
        The host keeps this gallery private for guests. Enter the password
        from your invite to come in.
      </p>

      <form
        className="flex flex-col gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (success) return;
          if (value.trim().toLowerCase() === "demo") {
            setError(false);
            // Blur FIRST so the keyboard retracts during the success hold,
            // never during the sheet exit (the iOS visualViewport jump).
            inputRef.current?.blur();
            onUnlock();
          } else {
            setError(true);
          }
        }}
      >
        {/* NO autofocus: the keyboard rises only on an intentional tap (the
            R3 fix). Vaul's repositionInputs lifts the sheet above it. */}
        <input
          ref={inputRef}
          type="password"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Event password"
          aria-label="Event password"
          disabled={success}
          enterKeyHint="go"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {error && !success && (
          <p className="text-sm text-destructive">
            That password didn&rsquo;t work. Give it another try.
          </p>
        )}
        <button
          type="submit"
          data-dir-press
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-action-lg)] text-[15px] font-medium transition-colors duration-200",
            success
              ? "bg-[var(--success)] text-[var(--success-foreground)]"
              : "bg-primary text-primary-foreground",
          )}
        >
          {success ? (
            <span key="in" data-dir-enter className="flex items-center gap-2">
              <Check className="size-4.5" />
              You&rsquo;re in
            </span>
          ) : (
            "Unlock"
          )}
        </button>
        {success && morph ? (
          <p className="text-center text-sm text-muted-foreground">
            Opening the gallery
          </p>
        ) : (
          !success && (
            <p className="text-center text-xs text-muted-foreground/70">
              For this demo the password is &ldquo;demo&rdquo;
            </p>
          )
        )}
      </form>
    </div>
  );
}
