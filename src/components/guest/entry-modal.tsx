"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Camera,
  ChevronLeft,
  Images,
  PartyPopper,
  Smartphone,
} from "lucide-react";

import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { EntryShell, type DismissMode } from "@/components/guest/entry-shell";
import { EntryStepTransition } from "@/components/guest/entry-step-transition";
import { PasswordGate } from "@/components/guest/password-gate";
import { Button } from "@/components/ui/button";
import { computeEntry, type GateStep } from "@/lib/guest/entry-steps";
import { useWelcomeSeen } from "@/lib/guest/use-welcome-seen";

// Stable no-op subscribe for the hydration flag (useSyncExternalStore wants a stable subscribe).
const subscribeNoop = () => () => {};

export type EntryModalHandle = { openToGate: () => void };

/**
 * The unified guest ENTRY surface: one shell (a Vaul drawer on phones, the
 * centered Dialog on sm+ - see entry-shell.tsx) whose ordered steps adapt to the event
 * (`welcome -> password? -> account?`). The CURRENT step is always the first un-satisfied one; it is
 * SERVER-DRIVEN -- each step's existing form (`<PasswordGate>` / `<EnterEventPrompt>`) calls
 * `router.refresh()` on success, which re-runs the RSC, drops the satisfied gate from `gateSteps`, and
 * re-derives the step here. No client step-machine to desync.
 *
 * Dismissibility fits what's behind each step (the "dismiss to what?" rule,
 * tightened in Phase 4.5 to the HONEST-AFFORDANCE table):
 * - welcome BEFORE a password gate: HELD (the old X "closed" it only for the
 *   firm gate to instantly re-open - a disorienting lie; the flow is now
 *   continuous: Continue is the path, drag rubber-bands).
 * - welcome before an account gate / standalone: free -> dismiss to the page
 *   behind (teaser or full gallery), marking the welcome seen.
 * - password: HELD (it IS the gated page, nothing real behind it).
 * - account: free -> closes to the BROWSABLE teaser; the gallery's "See all"
 *   caption re-opens it via the `openToGate` handle.
 */
export const EntryModal = forwardRef<
  EntryModalHandle,
  {
    qrToken: string;
    eventName: string;
    gateSteps: GateStep[];
    isOwner: boolean;
    isDemo: boolean;
    /** Approved media count (numbers only) — the gate steps' "N photos are
     *  waiting" tease (the ratified cardinality-only leak). */
    mediaTotal?: number;
  }
>(function EntryModal(
  { qrToken, eventName, gateSteps, isOwner, isDemo, mediaTotal },
  ref,
) {
  const [seen, markSeen] = useWelcomeSeen(qrToken);
  // `proceeded` = the guest advanced past the welcome into the gate (keeps a non-auto-opening account
  // gate open). `manuallyClosed` = they closed the account step back to the teaser.
  const [proceeded, setProceeded] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  // Open only AFTER hydration: useWelcomeSeen's server snapshot is `seen=true`, so deciding `open`
  // during SSR/hydration would flash the wrong step before the real value resolves. useSyncExternalStore
  // (server=false, client=true) gives a hydrated flag without a setState-in-effect mount flag.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const { steps, autoOpen } = computeEntry({
    gateSteps,
    welcomeSeen: seen,
    isOwner,
    isDemo,
  });
  const current = steps[0] ?? null;
  const open =
    hydrated && current !== null && (autoOpen || proceeded) && !manuallyClosed;

  // THE BACK AFFORDANCE (Phase 4.5 S3): `reviewing` is a transient client
  // view OVER the server-driven machine - a gate step's chevron re-shows the
  // welcome content; its primary returns forward. The machine never knows
  // (markSeen/steps untouched). Direction is event-driven state: only the
  // chevron goes "back". Both reset when the FLOW advances (the sanctioned
  // adjust-state-during-render pattern).
  const [reviewing, setReviewing] = useState(false);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [prevStep, setPrevStep] = useState(current);
  if (current !== prevStep) {
    setPrevStep(current);
    setReviewing(false);
    setDirection("fwd");
  }
  const isReviewing = reviewing && current !== "welcome" && current !== null;

  useImperativeHandle(
    ref,
    () => ({
      // The teaser's "See all" caption re-opens the gate (to the account step).
      openToGate: () => {
        setManuallyClosed(false);
        setProceeded(true);
      },
    }),
    [],
  );

  // THE HONEST-AFFORDANCE TABLE (Phase 4.5, ratified): dismissal exists only
  // when there is something to dismiss TO. A welcome whose NEXT step is the
  // firm password gate is held (the continuous invitation -> gate flow).
  const dismissMode: DismissMode =
    current === "password" ||
    (current === "welcome" && steps[1] === "password")
      ? "held"
      : "free";

  // Fired by the shell ONLY for a user dismissal of a "free" surface.
  function handleDismiss() {
    if (current === "welcome") {
      // Dismissing the welcome marks it seen; re-derivation decides what shows: an account gate
      // closes to the teaser, public closes to the gallery (password welcomes are held, never here).
      markSeen();
    } else if (current === "account") {
      setManuallyClosed(true); // close to the browsable teaser; the "See all" caption reopens it
    }
  }

  function continueFromWelcome() {
    markSeen();
    // If a gate follows (steps had welcome + a gate), keep the modal open into it; an account gate
    // wouldn't auto-open on its own, so `proceeded` carries it. For a public event (welcome only),
    // markSeen empties the steps and the modal closes to the gallery.
    if (steps.length > 1) setProceeded(true);
  }

  // Nothing renders pre-hydration (open is always false there anyway); the
  // early return keeps the shell branch (drawer vs dialog) client-only.
  if (!hydrated) return null;

  return (
    <EntryShell
      open={open}
      dismissMode={dismissMode}
      onDismiss={handleDismiss}
      title={
        isReviewing || current === "welcome"
          ? `Welcome to ${eventName}`
          : current === "password"
            ? `${eventName} is private`
            : "See all the photos"
      }
      description={
        isReviewing || current === "welcome"
          ? "A shared gallery for the whole event."
          : current === "password"
            ? "Enter the event password to view it."
            : "Create a free account to see the full gallery and add your own photos."
      }
    >
      <EntryStepTransition
        stepKey={isReviewing ? "welcome-review" : (current ?? "none")}
        direction={direction}
      >
        <div className="relative pt-1">
          {isReviewing ? (
            <WelcomeStep
              eventName={eventName}
              gateNext
              browseAvailable={false}
              continueLabel={
                current === "password" ? "Back to the password" : "Back"
              }
              onContinue={() => {
                setDirection("fwd");
                setReviewing(false);
              }}
              onBrowse={() => {}}
            />
          ) : (
            <>
              {/* The gate steps carry a chevron back to the welcome (R5: the
                  guest can always re-read what this is). */}
              {(current === "password" || current === "account") && (
                <button
                  type="button"
                  aria-label="Back to the welcome"
                  onClick={() => {
                    setDirection("back");
                    setReviewing(true);
                  }}
                  className="absolute top-0 left-0 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}
              {current === "welcome" && (
                <WelcomeStep
                  eventName={eventName}
                  gateNext={steps.length > 1}
                  // "Just browsing" only when a BROWSABLE teaser sits behind (an
                  // account gate); a password gate has nothing to browse, and it
                  // would auto-reopen anyway.
                  browseAvailable={steps[1] === "account"}
                  onContinue={continueFromWelcome}
                  onBrowse={() => markSeen()}
                />
              )}
              {current === "password" && (
                <PasswordGate token={qrToken} eventName={eventName} />
              )}
              {current === "account" && (
                <EnterEventPrompt qrToken={qrToken} mediaTotal={mediaTotal} />
              )}
            </>
          )}
        </div>
      </EntryStepTransition>
    </EntryShell>
  );
});

// The always-on friendly front door: a light mini-guide. The host's event voice (minimal Partyreel
// branding). One primary button advances ("Continue" when a gate follows) or dismisses ("View event").
function WelcomeStep({
  eventName,
  gateNext,
  browseAvailable,
  continueLabel,
  onContinue,
  onBrowse,
}: {
  eventName: string;
  gateNext: boolean;
  /** A browsable teaser exists behind the next gate (account gates only). */
  browseAvailable: boolean;
  /** Override for the review view ("Back to the password"). */
  continueLabel?: string;
  onContinue: () => void;
  /** Dismiss to the teaser (marks the welcome seen WITHOUT advancing). */
  onBrowse: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PartyPopper className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-xl text-balance">
          You&rsquo;re invited to {eventName}
        </p>
        <p className="text-[15px] text-muted-foreground">
          A shared gallery for the whole event.
        </p>
      </div>
      <ul className="w-full space-y-2.5 text-left text-[15px]">
        <li className="flex items-center gap-3">
          <Camera className="size-4 shrink-0 text-muted-foreground" />
          Add your photos and videos
        </li>
        <li className="flex items-center gap-3">
          <Images className="size-4 shrink-0 text-muted-foreground" />
          See everyone&rsquo;s shots in one place
        </li>
        <li className="flex items-center gap-3">
          <Smartphone className="size-4 shrink-0 text-muted-foreground" />
          No app to download, just your phone
        </li>
      </ul>
      <Button onClick={onContinue} className="h-11 w-full text-[15px]">
        {continueLabel ?? (gateNext ? "Continue" : "View event")}
      </Button>
      {browseAvailable && (
        <Button
          variant="ghost"
          onClick={onBrowse}
          className="-mt-2 w-full text-muted-foreground"
        >
          Just browsing
        </Button>
      )}
    </div>
  );
}
