"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

import { EmailSignIn } from "@/components/auth/email-sign-in";
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

// lucide-react dropped brand glyphs, so the Google "G" is inlined (mirrors login-form).
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
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

  // Best-effort newsletter capture (post-upload card only). The verified account's email
  // goes on the marketing list via the existing capture_guest_email RPC (keyed by the
  // guest session_token). Never blocks the save.
  const captureNewsletter = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase.rpc("capture_guest_email", {
          p_session_token: sessionToken,
          p_email: user.email,
          p_newsletter_opt_in: true,
        });
      }
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
