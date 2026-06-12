"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useSyncExternalStore,
} from "react";
import { Camera, Images, PartyPopper, Smartphone } from "lucide-react";

import { EnterEventPrompt } from "@/components/guest/enter-event-prompt";
import { PasswordGate } from "@/components/guest/password-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { computeEntry, type GateStep } from "@/lib/guest/entry-steps";
import { useWelcomeSeen } from "@/lib/guest/use-welcome-seen";

// Stable no-op subscribe for the hydration flag (useSyncExternalStore wants a stable subscribe).
const subscribeNoop = () => () => {};

export type EntryModalHandle = { openToGate: () => void };

/**
 * The unified guest ENTRY modal: one Dialog whose ordered steps adapt to the event
 * (`welcome -> password? -> account?`). The CURRENT step is always the first un-satisfied one; it is
 * SERVER-DRIVEN -- each step's existing form (`<PasswordGate>` / `<EnterEventPrompt>`) calls
 * `router.refresh()` on success, which re-runs the RSC, drops the satisfied gate from `gateSteps`, and
 * re-derives the step here. No client step-machine to desync.
 *
 * Dismissibility fits what's behind each step (the "dismiss to what?" rule):
 * - welcome: freely dismissable -> the page behind (full gallery if public; teaser if gated).
 * - password: FIRM (no X / backdrop / Escape) -- it IS the gated page, nothing real behind it.
 * - account: closes (a deliberate X) back to the BROWSABLE teaser; the gallery's "See all" caption
 *   re-opens it via the `openToGate` handle.
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

  const isFirm = current === "password"; // nothing behind it, so no casual dismiss

  function handleOpenChange(next: boolean) {
    if (next) return; // open is fully controlled; we never open via Radix
    if (current === "welcome") {
      // Dismissing the welcome marks it seen; re-derivation decides what shows: a password gate
      // re-opens (it auto-opens), an account gate closes to the teaser, public closes to the gallery.
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        // The ADAPTIVE SHEET chrome (Phase 4): a bottom-pinned full-width sheet
        // on phones (max-sm: utilities neutralize the dialog's centered
        // translate + pin it to the bottom with big top corners + a slide-up),
        // the centered float on sm+. max-sm: lands LAST in the merged className,
        // so it beats the base utilities at equal specificity. The step machine,
        // firmness, and welcome-seen wiring are untouched.
        data-entry-sheet
        showCloseButton={!isFirm}
        onInteractOutside={isFirm ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isFirm ? (e) => e.preventDefault() : undefined}
        className="sm:max-w-sm max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[calc(var(--radius-action)*1.4)] max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))] max-sm:data-open:slide-in-from-bottom-6 max-sm:data-closed:slide-out-to-bottom-6"
      >
        {/* The drag-indicator bar: DISMISSIBLE steps only (a drag bar on the
            firm password step would promise a swipe-away it blocks). */}
        {!isFirm && (
          <div
            aria-hidden
            className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-muted-foreground/30 sm:hidden"
          />
        )}
        {/* a11y name (Radix requires a title); each step renders its own visible heading. */}
        <DialogTitle className="sr-only">
          {current === "password"
            ? `${eventName} is private`
            : current === "account"
              ? "See all the photos"
              : `Welcome to ${eventName}`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {current === "password"
            ? "Enter the event password to view it."
            : current === "account"
              ? "Create a free account to see the full gallery and add your own photos."
              : "A shared gallery for the whole event."}
        </DialogDescription>
        <div data-entry-step key={current} className="pt-1">
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
        </div>
      </DialogContent>
    </Dialog>
  );
});

// The always-on friendly front door: a light mini-guide. The host's event voice (minimal Partyreel
// branding). One primary button advances ("Continue" when a gate follows) or dismisses ("View event").
function WelcomeStep({
  eventName,
  gateNext,
  browseAvailable,
  onContinue,
  onBrowse,
}: {
  eventName: string;
  gateNext: boolean;
  /** A browsable teaser exists behind the next gate (account gates only). */
  browseAvailable: boolean;
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
        {gateNext ? "Continue" : "View event"}
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
