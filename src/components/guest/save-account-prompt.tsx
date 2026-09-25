"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { MailCheck } from "lucide-react";

import { ConfirmEmailDialog } from "@/components/auth/confirm-email-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCount } from "@/lib/format/count";
import { markPendingOffer } from "@/lib/guest/album-return";
import { createClient } from "@/lib/supabase/client";

/**
 * THE OFFER, RIGHT AFTER A GUEST'S FIRST PHOTOGRAPHS LAND, where it reads as the
 * natural next step rather than a random Save button above an album. It opens
 * the CAPTURE FLOW, which lets a guest with no account keep the event and their
 * uploads on a profile and follow the host and the other guests.
 *
 * ★ IT COUNTS WHAT THEY JUST ADDED, and that is the whole difference between a
 * growth card and an offer: "Keep your 7 photos" is about the thing in front of
 * them, "create a free account" is about us.
 *
 * ★ CONFIRMING CLAIMS, AND THE CLAIM IS THE WHOLE KEEP. What the address buys is
 * the event, saved under the account for the future, and uploading to an event
 * already amounts to saving it. There is no save step behind this door: the
 * claim puts the photographs in the account, and the event comes with them
 * as a Guest card on the dashboard, which is exactly what the card promises.
 *
 * ★ IT MARKS THE DOOR'S OPENING (`pr_pending_offer_<qr_token>`, through
 * `markPendingOffer`) so the beat AFTER a confirmation is the same on every
 * path: the album page's claim consumes the marker and stands the follow moment
 * up, whether the guest typed the code here or left for Google or a magic link
 * and came back. Written on OPEN rather than on success, because by the time a
 * redirect happens there is no code of ours running.
 *
 * ★ AND THE NEWSLETTER SWITCH LIVES IN THIS CARD'S DOOR, its one place in the
 * product: "Send me occasional Partyreel updates", written only on an in-page
 * confirmation, through `/api/guests/capture-email`, which derives the address
 * from the confirmed session (never from this page).
 *
 * The file's name says "save", though the thing it offers is a confirmation:
 * the lab's touchpoints list it by this name, and the links test checks it
 * exists.
 */

function promptKey(qrToken: string) {
  return `pr_save_prompt_${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs. Mirrors
// the use-stored-session localStorage gate; server snapshot is `true` so the card never
// flashes before hydration.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

function useDismissed(key: string): [boolean, () => void] {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const dismissed = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => true,
  );

  const dismiss = useCallback(() => {
    localStorage.setItem(key, "1");
    emit();
  }, [key]);

  return [dismissed, dismiss];
}

export function SaveAccountPrompt({
  qrToken,
  sessionToken,
  count = 0,
  hintEmail,
}: {
  qrToken: string;
  sessionToken: string;
  /** Photographs this guest added in this session (the sentence's number). */
  count?: number;
  /**
   * The address typed at the DOOR this visit (the optional field), so the door
   * behind this card opens on it. The card's own words do not
   * change: a guest who typed an address is being offered the same thing, one
   * tap cheaper. Null for everyone who skipped the field and on every later
   * visit, because the page holds it in memory alone.
   */
  hintEmail?: string | null;
}) {
  const [dismissed, dismiss] = useDismissed(promptKey(qrToken));
  const [open, setOpen] = useState(false);
  const [optIn, setOptIn] = useState(false);
  // ★ The belt: this card is for somebody WITHOUT an account. The slot's owner
  // (`claim-handle-prompt.tsx`) already renders it only for a signed-out guest;
  // a card that finds a session anyway hides itself rather than asking an
  // account holder to confirm an email they have. Checked once, at mount, so a
  // confirmation made through this very card never pulls it out from under its
  // own open door.
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const {
        data: { session },
      } = await createClient().auth.getSession();
      if (active && session) setHasSession(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Best-effort, never blocking: a newsletter write must never fail the
  // confirmation it rides on. The route derives the confirmed address from the
  // session (getUser()), so nothing here can put somebody else's on the list.
  async function captureNewsletter() {
    if (!sessionToken) return;
    try {
      await fetch("/api/guests/capture-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: sessionToken,
          newsletter_opt_in: true,
        }),
      });
    } catch {
      // swallowed on purpose (see above)
    }
  }

  if (dismissed || hasSession) return null;

  return (
    <div
      data-media-tile
      className="rounded-xl border border-border bg-card p-5 text-center"
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MailCheck className="size-5" />
      </div>
      {/* A prompt tile's title: the app's quiet middle, `subsection`. The
          NUMBER rides the sentence under it, where it belongs: "Keep these
          photos" is the offer, "these 7" is what is in front of them. ★ THE
          HEADING COUNTS TOO, for exactly one: the body says "it stays" in the
          singular, so a heading that said "photos" would read as a mismatch
          beside its own sentence. Every other count keeps the constant
          plural a help article quotes
          (content/help/find-your-uploads-and-events.mdx). */}
      <p className="font-heading text-subsection">
        {count === 1 ? "Keep this photo" : "Keep these photos"}
      </p>
      {/* ★ "In your account", never "on your profile": confirming claims the
          photographs into the account and the event arrives with them, while a
          profile shows nothing until its owner chooses it (profiles-social.md). */}
      <p className="mx-auto mt-1 mb-4 max-w-xs text-reading text-muted-foreground">
        Confirm your email and{" "}
        {count === 1 ? "it stays" : count > 1 ? `all ${formatCount(count)} stay` : "they stay"}{" "}
        with you: this event in your account, and everything you added to it.
      </p>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="active:scale-[0.98] motion-reduce:active:scale-100"
          onClick={() => {
            // BEFORE the door opens: Google and a magic link leave the page.
            markPendingOffer(qrToken);
            setOpen(true);
          }}
        >
          <MailCheck /> Confirm your email
        </Button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Maybe later
      </button>

      <ConfirmEmailDialog
        open={open}
        onOpenChange={setOpen}
        hintEmail={hintEmail}
        onConfirmed={async () => {
          if (optIn) await captureNewsletter();
          setOpen(false);
          // Confirmed: the card's job is done. The slot's owner plays the
          // follow moment in its place once the album hears the claim land.
          dismiss();
        }}
      >
        <div className="flex items-center gap-2">
          <Switch
            id="pr-offer-newsletter"
            size="sm"
            checked={optIn}
            onCheckedChange={setOptIn}
          />
          <Label
            htmlFor="pr-offer-newsletter"
            className="text-xs font-normal text-muted-foreground"
          >
            Send me occasional Partyreel updates
          </Label>
        </div>
      </ConfirmEmailDialog>
    </div>
  );
}
