"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  SAVE_FAILED,
  SAVED_TO_DASHBOARD,
  completePendingSave,
  markPendingSave,
  saveEvent,
  type SaveableEvent,
} from "@/lib/events/save-event";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// The offer card's door (`SaveAccountPrompt`, after a guest's first photographs
// land): for a signed-out guest it IS the account-creation moment, and confirming
// saves the event to their dashboard.
//
// Save is the capability `save_event(token)` RPC (resolves the event from the page's
// token, refuses private/your-own, idempotent) through `lib/events/save-event.ts`,
// which the Unverified mark and the header's name menu share; status-check + unsave
// are plain per-user RLS calls straight from the browser client. The signed-out path
// opens a dialog with the shared <EmailSignIn> (code-first OTP) + Google.
//
// A save intent is remembered across a REDIRECT sign-in (Google / magic link) so the
// save completes when the visitor returns signed-in (`CompletePendingSave` below, on
// the event page). The in-page OTP code path doesn't need it (it saves in onVerified,
// no redirect), but setting it on dialog open covers every method uniformly;
// save_event is idempotent so a double save is harmless.

export function SaveEventButton({
  eventId,
  qrToken,
  tone = "default",
  sessionToken,
  hintEmail,
  offerNewsletter = false,
  onSaved,
  onDoorOpen,
  triggerClassName,
  triggerLabel,
}: {
  eventId: string;
  qrToken: string;
  /** "gallery" = a dark-surface variant kept for the Part 2 redesign. */
  tone?: "default" | "gallery";
  /** Lets the header action row size/stretch the trigger (Phase 4). */
  triggerClassName?: string;
  /** Shorter trigger label for tight rows (default "Save event"). */
  triggerLabel?: string;
  /** Guest capability token — enables the optional newsletter opt-in (post-upload card). */
  sessionToken?: string;
  /**
   * Prefill the door's address field with what this guest typed at the DOOR a
   * few minutes ago (the optional field, 2026-09-22). It is a convenience and
   * never an authorization: the code still has to land in that mailbox, so
   * confirming here proves exactly as much as confirming from a blank field.
   */
  hintEmail?: string | null;
  /** Show a "send me updates" checkbox in the create-account dialog (folds the old
   *  newsletter capture into the account-first flow). Captured on the in-page code path. */
  offerNewsletter?: boolean;
  /** Fires after a successful save (any path) — e.g. to dismiss the post-upload card. */
  onSaved?: () => void;
  /**
   * Fires the instant the create-account dialog OPENS (the identity reshape,
   * 2026-09-21). The capture flow's offer card uses it to write its own pending
   * marker, so the beat that follows a confirmation is the same one whether the
   * guest typed the code here or left for a magic link and came back.
   */
  onDoorOpen?: () => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [optIn, setOptIn] = useState(false);

  const save = useCallback(async (): Promise<boolean> => {
    if (!(await saveEvent({ eventId, qrToken }))) return false;
    setSaved(true);
    onSaved?.();
    return true;
  }, [eventId, qrToken, onSaved]);

  // Best-effort newsletter capture (post-upload card only). Posts to /api/guests/capture-email, which
  // derives the verified account email server-side (getUser) and calls capture_guest_email via the
  // service-role client (database-security.md -- the email is never client-supplied). Never blocks the save.
  const captureNewsletter = useCallback(async () => {
    if (!sessionToken) return;
    try {
      // Server-mediated (H3): the email is derived from the verified session inside the route (never sent
      // from the client), so capture_guest_email can't be poisoned with a victim's address.
      await fetch("/api/guests/capture-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: sessionToken,
          newsletter_opt_in: true,
        }),
      });
    } catch {
      // swallow — a newsletter write must never fail the save
    }
  }, [sessionToken]);

  // Resolve sign-in + saved state on mount. getSession() is local (no network) — fine
  // for UI; the save/unsave/status calls are RLS-enforced server-side. If we returned
  // from a redirect sign-in with a pending flag, complete the save now.
  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      // DELIBERATE swallow: seeding the button's saved/unsaved look. A failed read
      // shows "Save", and pressing it runs the idempotent save which surfaces its
      // own error. Throwing inside this mount effect would blank the button instead.
      // eslint-disable-next-line partyreel/no-swallowed-db-error
      const { data: row } = await supabase
        .from("saved_events")
        .select("event_id")
        .eq("event_id", eventId)
        .maybeSingle();
      if (!active) return;
      if (row) {
        setSaved(true);
        return;
      }
      // Taken, not read: the event page's own reader may be finishing the
      // same intent, and exactly one of them may say so.
      if (await completePendingSave({ eventId, qrToken })) {
        if (!active) return;
        setSaved(true);
        onSaved?.();
        toast.success(SAVED_TO_DASHBOARD);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId, qrToken, onSaved]);

  async function onClick() {
    if (busy) return;
    if (saved) {
      // unsave (toggle) — plain per-user RLS delete
      setBusy(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("saved_events")
        .delete()
        .eq("event_id", eventId);
      setBusy(false);
      if (error) {
        toast.error("Couldn't update.");
        return;
      }
      setSaved(false);
      toast.success("Removed from saved.");
      return;
    }
    if (signedIn) {
      setBusy(true);
      const ok = await save();
      setBusy(false);
      if (ok) toast.success(SAVED_TO_DASHBOARD);
      else toast.error(SAVE_FAILED);
      return;
    }
    // Signed out → remember the intent (so a redirect sign-in still saves) + open the
    // create-account-to-save dialog.
    markPendingSave(eventId);
    onDoorOpen?.();
    setOpen(true);
  }

  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${window.location.pathname}`
      : "/auth/callback";

  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={busy}
        aria-pressed={saved}
        className={cn(
          "active:scale-[0.98] motion-reduce:active:scale-100",
          tone === "gallery" &&
            "border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white",
          triggerClassName,
        )}
      >
        <Icon /> {saved ? "Saved" : (triggerLabel ?? "Save event")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {/* The Dialog owns the title and the description for a11y (Radix
              wires aria-labelledby / -describedby to these), so the words come
              from the door's own wear table rather than being retyped here. */}
          <DialogHeader>
            <DialogTitle>{DOOR_WEAR.save.heading}</DialogTitle>
            <DialogDescription>{DOOR_WEAR.save.reason}</DialogDescription>
          </DialogHeader>
          {/* ★ THE SAVE WEAR (Will, 2026-09-20, `surfaces=one`). Save was one of
              the two account surfaces that created accounts with NO Terms line;
              the door carries it now, for every wear, and it cannot be
              forgotten by a new surface again. */}
          <AccountDoor
            wear="save"
            methods={{ code: true, google: true }}
            emailRedirectTo={emailRedirectTo}
            chrome="none"
            intent="create"
            // Undefined rather than null when there is nothing to hint: the
            // door's own state seeds from this once, and a null would read as
            // a hint of empty rather than as no hint.
            hintEmail={hintEmail ?? undefined}
            onVerified={async () => {
              // In-page OTP verify (no reload) -> claim this browser's uploads directly. Silent:
              // the "Saved to your dashboard." toast below is the feedback here. The redirect paths (Google /
              // magic link) reload /e/ and are covered by the EventExperience mounts instead (the claim,
              // and `CompletePendingSave` for the save).
              //
              // ★ AWAITED, NOT FIRED AND FORGOTTEN (the identity reshape,
              // 2026-09-21). The save writes a row keyed on this account and the
              // page refreshes behind it; a claim still in flight when that
              // happens redraws the album with the guest's own photographs still
              // credited to a name nobody proved, which is the one thing they
              // just paid an email to fix. It is best-effort and never throws,
              // so awaiting it costs an ordinary round trip and nothing else.
              await claimAnonymousUploads({ silent: true });
              const ok = await save();
              if (offerNewsletter && optIn) await captureNewsletter();
              setOpen(false);
              if (ok) toast.success(SAVED_TO_DASHBOARD);
              else toast.error(SAVE_FAILED);
            }}
          >
            {offerNewsletter && (
              <div className="flex items-center gap-2">
                <Switch
                  id="pr-save-newsletter"
                  size="sm"
                  checked={optIn}
                  onCheckedChange={setOptIn}
                />
                <Label
                  htmlFor="pr-save-newsletter"
                  className="text-xs font-normal text-muted-foreground"
                >
                  Send me occasional Partyreel updates
                </Label>
              </div>
            )}
          </AccountDoor>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * THE OTHER HALF OF A DOOR THAT LEFT THE PAGE. Every door that saves an event
 * (this card's, the Unverified mark's, the name menu's) writes its intent when
 * it opens, and a Google or magic-link sign-in comes back to a fresh page with
 * none of their code running. The event page mounts this once, beside the claim
 * that runs on the same return, so the save the door promised lands whichever
 * way the guest confirmed. It used to be read only by this button, which by
 * then is not on the page: the offer card belongs to a guest who is signed out.
 * Renders nothing.
 */
export function CompletePendingSave({ eventId, qrToken }: SaveableEvent) {
  useEffect(() => {
    let active = true;
    void (async () => {
      const {
        data: { session },
      } = await createClient().auth.getSession();
      // Signed out: the intent waits for the sign-in it was written for.
      if (!active || !session) return;
      if (await completePendingSave({ eventId, qrToken })) {
        toast.success(SAVED_TO_DASHBOARD);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId, qrToken]);
  return null;
}
