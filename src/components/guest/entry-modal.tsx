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
  }
>(function EntryModal({ qrToken, eventName, gateSteps, isOwner, isDemo }, ref) {
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
        showCloseButton={!isFirm}
        onInteractOutside={isFirm ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isFirm ? (e) => e.preventDefault() : undefined}
        className="sm:max-w-sm"
      >
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
              onContinue={continueFromWelcome}
            />
          )}
          {current === "password" && (
            <PasswordGate token={qrToken} eventName={eventName} />
          )}
          {current === "account" && <EnterEventPrompt qrToken={qrToken} />}
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
  onContinue,
}: {
  eventName: string;
  gateNext: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <PartyPopper className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-lg font-semibold tracking-tight text-balance">
          You&rsquo;re invited to {eventName}
        </p>
        <p className="text-sm text-muted-foreground">
          A shared gallery for the whole event.
        </p>
      </div>
      <ul className="w-full space-y-2.5 text-left text-sm">
        <li className="flex items-center gap-3">
          <Camera className="size-4 shrink-0 text-brand" />
          Add your photos and videos
        </li>
        <li className="flex items-center gap-3">
          <Images className="size-4 shrink-0 text-brand" />
          See everyone&rsquo;s shots in one place
        </li>
        <li className="flex items-center gap-3">
          <Smartphone className="size-4 shrink-0 text-brand" />
          No app to download, just your phone
        </li>
      </ul>
      <Button onClick={onContinue} className="w-full active:scale-[0.99]">
        {gateNext ? "Continue" : "View event"}
      </Button>
    </div>
  );
}
