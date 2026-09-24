"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  attachGuestEmail,
  checkGuestEmail,
  type JoinRefusal,
} from "@/lib/guest/join";
import { SESSION_OTHER_ACCOUNT } from "@/lib/guest/session-owner";
import { setStoredEmailAttached } from "@/lib/guest/use-stored-name";
import { dropGuestTicket } from "@/lib/guest/use-stored-session";
import { MAX_GUEST_EMAIL_LENGTH } from "@/lib/validation/upload";

/**
 * THE SECOND CHANCE AT THE OPTIONAL ADDRESS: the unconfirmed email between a
 * guest's name only and a verified account.
 *
 * The door asks for an address under the name, and most guests will skip it
 * there: they are three taps from an album full of a party they are standing
 * at. This is the row waiting for them afterwards, in their own menu, once the
 * album has made the case the field could not.
 *
 * ★ A DIALOG, NOT A STEP. The door's steps are HELD and ordered, and a guest who
 * reaches this has already been through them; reopening the itinerary to add one
 * optional field would be re-gating an album they are already inside.
 *
 * ★ IT PROMISES ONLY WHAT IT DELIVERS. An unconfirmed address is inert: nothing
 * is sent to it, the host never sees it, and it does not make this guest
 * anybody. What it buys is the one thing the copy says — the ability to claim
 * these photographs from any device the day they confirm it — so the same
 * sentence the door used says it here, and the way to actually get it NOW sits
 * underneath as a plain second choice rather than the loud one.
 *
 * ★ AND NOTHING HERE REMEMBERS THE ADDRESS. The attach hands back a boolean; the
 * device stores a boolean. A phone at a party belongs to whoever is holding it.
 */
export function AddEmailDialog({
  qrToken,
  sessionToken,
  open,
  onOpenChange,
  onAttached,
  onConfirmInstead,
}: {
  qrToken: string;
  /** The capability whose row the address lands on. */
  sessionToken: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after the row carries it, for a caller with more to true up. */
  onAttached?: () => void;
  /** "Confirm it now instead": the caller opens the real code door. */
  onConfirmInstead: () => void;
}) {
  const [email, setEmail] = useState("");
  const [refusal, setRefusal] = useState<JoinRefusal | null>(null);
  const [saving, startSave] = useTransition();

  function submit() {
    const checked = checkGuestEmail(email);
    // A blank field is "ok, nothing" from the shared parser, which is right at
    // the door's optional field and wrong here: pressing Save with an empty box
    // is a mistake, not an answer.
    if (!checked.ok || !checked.email) {
      setRefusal(
        checked.ok
          ? { kind: "email_invalid", message: "Enter an email address." }
          : checked.refusal,
      );
      return;
    }
    const address = checked.email;
    startSave(async () => {
      setRefusal(null);
      const put = await attachGuestEmail({
        qrToken,
        sessionToken,
        email: address,
      });
      if (!put.ok) {
        /* ★ EXCEPT A TICKET THAT WAS NOT THIS VIEWER'S. The name in this menu
           belongs to a row an account owns, kept by this device past that
           account's sign-out: nothing typed here could fix that, so a sentence
           under the field would be a dead end. The ticket goes down instead (its
           name with it, so this menu closes), and the door asks the person
           actually holding the phone for their own. */
        if (put.refusal.kind === SESSION_OTHER_ACCOUNT) {
          await dropGuestTicket(qrToken);
          onOpenChange(false);
          setEmail("");
          return;
        }
        // Every refusal lands under the field, including a dead session: this
        // is one small optional act and a toast for it would outlive the
        // surface it is about.
        setRefusal(put.refusal);
        return;
      }
      /* The device flag, written here rather than by the caller, so the act is
         one thing: the row carries the address and this browser knows it. The
         store's own emit re-labels the menu that opened this without a refresh,
         because nothing server-rendered changed — an unconfirmed address is
         invisible on every surface but this one. */
      setStoredEmailAttached(qrToken, put.emailAttached);
      onAttached?.();
      onOpenChange(false);
      setEmail("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your email</DialogTitle>
          {/* The door's own helper line, word for word: one promise, made in
              one place, whichever surface a guest meets it on. */}
          <DialogDescription>
            Come back to this album anytime, with every photo you add.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          /* The same reason the door's own form carries it: a native
             `type="email"` field would let the BROWSER refuse this form with
             its own bubble before `onSubmit` ever ran, replacing our sentence
             under the field with one we cannot style or word. */
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pr-add-email" className="sr-only">
              Email
            </Label>
            <Input
              id="pr-add-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (refusal) setRefusal(null);
              }}
              placeholder="you@email.com"
              maxLength={MAX_GUEST_EMAIL_LENGTH}
              enterKeyHint="go"
              aria-invalid={refusal ? true : undefined}
              aria-describedby={refusal ? "pr-add-email-hint" : undefined}
              className="h-11 text-base"
            />
            {refusal && (
              <p id="pr-add-email-hint" className="text-reading text-destructive">
                {refusal.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="cta"
            className="w-full"
            disabled={saving || !email.trim()}
          >
            {saving ? "Just a second…" : "Save"}
          </Button>
        </form>
        {/* The shortcut past the middle state, for the guest who would rather
            just be done. A link, deliberately: it is the better outcome and the
            quieter control, because the loud version of it is the offer card
            under the album and the mark on their own photographs. */}
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            onConfirmInstead();
          }}
          className="mx-auto text-reading text-muted-foreground underline-offset-4 hover:underline"
        >
          Confirm it now instead
        </button>
      </DialogContent>
    </Dialog>
  );
}
