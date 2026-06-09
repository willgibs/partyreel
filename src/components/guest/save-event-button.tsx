"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// The always-visible "Save event" growth lever (Phase 3). Shown to EVERYONE — for a
// signed-out visitor it IS the account-creation moment ("create a free account to
// save"), surfaced proactively, not just after an upload.
//
// Save is the capability `save_event(token)` RPC (resolves the event from the page's
// token, refuses private/your-own, idempotent); status-check + unsave are plain
// per-user RLS calls straight from the browser client. The signed-out path opens a
// dialog with the shared <EmailSignIn> (code-first OTP) + Google.

// Remember a save intent across a REDIRECT sign-in (Google / magic link) so the save
// completes when the visitor returns signed-in. The in-page OTP code path doesn't
// need it (it saves in onVerified, no redirect), but setting it on dialog open covers
// every method uniformly; save_event is idempotent so a double save is harmless.
function pendingKey(eventId: string) {
  return `pr_pending_save_${eventId}`;
}

export function SaveEventButton({
  eventId,
  qrToken,
  tone = "default",
  sessionToken,
  offerNewsletter = false,
  onSaved,
}: {
  eventId: string;
  qrToken: string;
  /** "gallery" = a dark-surface variant kept for the Part 2 redesign. */
  tone?: "default" | "gallery";
  /** Guest capability token — enables the optional newsletter opt-in (post-upload card). */
  sessionToken?: string;
  /** Show a "send me updates" checkbox in the create-account dialog (folds the old
   *  newsletter capture into the account-first flow). Captured on the in-page code path. */
  offerNewsletter?: boolean;
  /** Fires after a successful save (any path) — e.g. to dismiss the post-upload card. */
  onSaved?: () => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [optIn, setOptIn] = useState(false);

  const save = useCallback(async (): Promise<boolean> => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("save_event", {
      p_qr_token: qrToken,
    });
    if (error || !data) return false;
    setSaved(true);
    if (typeof window !== "undefined")
      localStorage.removeItem(pendingKey(eventId));
    onSaved?.();
    return true;
  }, [eventId, qrToken, onSaved]);

  // Best-effort newsletter capture (post-upload card only). Posts to /api/guests/capture-email, which
  // derives the verified account email server-side (getUser) and calls capture_guest_email via the
  // service-role client (ADR-0016 -- the email is never client-supplied). Never blocks the save.
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
      if (localStorage.getItem(pendingKey(eventId)) === "1") {
        if (await save()) toast.success("Saved to your dashboard.");
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId, save]);

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
      if (ok) toast.success("Saved to your dashboard.");
      else toast.error("Couldn't save this event.");
      return;
    }
    // Signed out → remember the intent (so a redirect sign-in still saves) + open the
    // create-account-to-save dialog.
    if (typeof window !== "undefined")
      localStorage.setItem(pendingKey(eventId), "1");
    setOpen(true);
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error)
      toast.error("Couldn't start Google sign-in", {
        description: error.message,
      });
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
        )}
      >
        <Icon /> {saved ? "Saved" : "Save event"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this event</DialogTitle>
            <DialogDescription>
              Create a free account to keep this event on your dashboard and
              come back to it anytime. No app, just your email.
            </DialogDescription>
          </DialogHeader>
          <EmailSignIn
            emailRedirectTo={emailRedirectTo}
            onVerified={async () => {
              // In-page OTP verify (no reload) -> claim this browser's anonymous uploads directly. Silent:
              // the "Saved to your dashboard." toast below is the feedback here. The redirect paths (Google /
              // magic link) reload /e/ and are covered by the EventExperience claim mount instead.
              void claimAnonymousUploads({ silent: true });
              const ok = await save();
              if (offerNewsletter && optIn) await captureNewsletter();
              setOpen(false);
              if (ok) toast.success("Saved to your dashboard.");
              else toast.error("Couldn't save this event.");
            }}
          />
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
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={signInWithGoogle}
          >
            <GoogleIcon /> Continue with Google
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
