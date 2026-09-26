"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { floatingKeyboardFoot } from "@/components/ui/floating-layer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  attachGuestEmail,
  checkGuestEmail,
  type JoinRefusal,
} from "@/lib/guest/join";
import { SESSION_OTHER_ACCOUNT } from "@/lib/guest/session-owner";
import { setStoredEmailAttached } from "@/lib/guest/use-stored-name";
import { dropGuestTicket } from "@/lib/guest/use-stored-session";
import { cn } from "@/lib/utils";
import { MAX_GUEST_EMAIL_LENGTH } from "@/lib/validation/upload";

/**
 * ★ WHETHER A TYPED, UNCONFIRMED ADDRESS CAN BE REMOVED, as well as changed: the one line that
 * carries Will's answer (`identity-door` r1 `remove`). He proposed that an added email can only be
 * changed, so that "remove" never becomes a one-click excuse to stay anonymous; the refinement
 * built here lets a PENDING address be withdrawn, because no host ever sees one, the public mark
 * says Unverified either way and the upload record keeps what was typed, so nothing accountable is
 * lost, while a name-only guest has no account to delete. `false` puts his version back: the menu
 * says "Change it" and this sheet offers no removal. A CONFIRMED address is never here at all: it
 * changes only on the account page, confirmed at both addresses.
 */
export const PENDING_EMAIL_REMOVABLE = true;

/** What removing says, the one sentence a guest needs before they press it. */
export const REMOVE_CONSEQUENCE =
  "Your photos stay. Only the email you added is removed.";

/**
 * THE SECOND CHANCE AT THE OPTIONAL ADDRESS: the unconfirmed email between a
 * guest's name only and a verified account, added, changed or removed.
 *
 * The door offers an address under the name, and most guests will skip it
 * there: they are three taps from an album full of a party they are standing
 * at. This is the card waiting for them afterwards, in their own menu, once the
 * album has made the case the field could not.
 *
 * ★ A SHEET, NOT A STEP, and the ONE responsive Sheet every guest surface wears
 * (door-flow), whose phone half stands on the keyboard while the field is
 * focused. The door's steps are HELD and ordered, and a guest who reaches this
 * has already been through them; reopening the itinerary to add one optional
 * field would be re-gating an album they are already inside.
 *
 * ★ TWO ACTS. `add`: the address, and "Confirm it now instead" for the guest who
 * would rather be done. `change`: a new address replaces the pending one (the
 * route overwrites it), and, behind `PENDING_EMAIL_REMOVABLE`, a quiet way to
 * take it off altogether, which posts `null` through the same route.
 *
 * ★ IT PROMISES ONLY WHAT IT DELIVERS. An unconfirmed address is inert: nothing
 * is sent to it, the host never sees it, and it does not make this guest
 * anybody. What it buys is the one thing the copy says — the ability to claim
 * these photographs from any device the day they confirm it.
 *
 * ★ AND NOTHING HERE REMEMBERS THE ADDRESS. The attach hands back a boolean; the
 * device stores a boolean. A phone at a party belongs to whoever is holding it,
 * which is also why the change field opens empty.
 */
export function AddEmailDialog({
  qrToken,
  sessionToken,
  mode = "add",
  open,
  onOpenChange,
  onAttached,
  onConfirmInstead,
}: {
  qrToken: string;
  /** The capability whose row the address lands on. */
  sessionToken: string;
  /** `add` a first address, or `change` (and maybe remove) the pending one. */
  mode?: "add" | "change";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after the row carries it, for a caller with more to true up. */
  onAttached?: () => void;
  /** "Confirm it now instead": the caller opens the real code door. */
  onConfirmInstead: () => void;
}) {
  const [email, setEmail] = useState("");
  const [refusal, setRefusal] = useState<JoinRefusal | null>(null);
  const [removeRefusal, setRemoveRefusal] = useState<JoinRefusal | null>(null);
  const [saving, startSave] = useTransition();
  const [removing, startRemove] = useTransition();
  const changing = mode === "change";

  function close() {
    onOpenChange(false);
    setEmail("");
    setRefusal(null);
    setRemoveRefusal(null);
  }

  /**
   * ★ EXCEPT A TICKET THAT WAS NOT THIS VIEWER'S. The name in this menu belongs
   * to a row an account owns, kept by this device past that account's sign-out:
   * nothing typed here could fix that, so a sentence under the field would be a
   * dead end. The ticket goes down instead (its name with it, so this menu
   * closes), and the door asks the person actually holding the phone for their
   * own. True when it was handled.
   */
  async function putDownForeignTicket(refused: JoinRefusal): Promise<boolean> {
    if (refused.kind !== SESSION_OTHER_ACCOUNT) return false;
    await dropGuestTicket(qrToken);
    close();
    return true;
  }

  function submit() {
    const checked = checkGuestEmail(email);
    // A blank field is "ok, nothing" from the shared parser, which is right at
    // the door's optional field and wrong here: pressing Save with an empty box
    // is a mistake, not an answer (removing is its own, labelled act).
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
        if (await putDownForeignTicket(put.refusal)) return;
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
      close();
    });
  }

  function remove() {
    startRemove(async () => {
      setRemoveRefusal(null);
      // `null` is the route's detach (`/api/guests/email`): the same capability, the same limiter.
      const put = await attachGuestEmail({
        qrToken,
        sessionToken,
        email: null,
      });
      if (!put.ok) {
        if (await putDownForeignTicket(put.refusal)) return;
        setRemoveRefusal(put.refusal);
        return;
      }
      setStoredEmailAttached(qrToken, false);
      close();
      toast.success("Email removed");
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <SheetContent responsive className="overflow-y-auto overscroll-contain">
        <SheetHeader>
          <SheetTitle>
            {changing ? "Change your email" : "Add your email"}
          </SheetTitle>
          {/* Adding repeats the door's own helper line, word for word: one
              promise, made in one place, whichever surface a guest meets it on. */}
          <SheetDescription>
            {changing
              ? "The new address replaces the one you added. Nothing is sent to it until you confirm it."
              : "Come back to this album anytime, with every photo you add."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4"
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
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (refusal) setRefusal(null);
              }}
              placeholder={changing ? "Your new email" : "you@email.com"}
              maxLength={MAX_GUEST_EMAIL_LENGTH}
              aria-invalid={refusal ? true : undefined}
              aria-describedby={refusal ? "pr-add-email-hint" : undefined}
              className="h-11 text-base"
            />
            {refusal && (
              <p
                id="pr-add-email-hint"
                className="text-reading text-destructive"
              >
                {refusal.message}
              </p>
            )}
          </div>
          <div
            data-sheet-primary
            className={cn("relative", floatingKeyboardFoot)}
          >
            <Button
              type="submit"
              size="cta"
              className="w-full"
              disabled={saving || removing || !email.trim()}
            >
              {saving ? "Just a second…" : "Save"}
            </Button>
          </div>
        </form>
        <div className="flex flex-col items-center gap-1.5 px-4 pb-6 text-center">
          {changing ? (
            PENDING_EMAIL_REMOVABLE && (
              <>
                {/* ★ THE WAY OUT OF THE MIDDLE STATE, QUIETLY, with its consequence said before
                    the press rather than after it. */}
                <button
                  type="button"
                  onClick={remove}
                  disabled={removing || saving}
                  className="text-reading text-destructive underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {removing ? "Removing…" : "Remove this email"}
                </button>
                <p
                  className={cn(
                    "text-xs",
                    removeRefusal
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {removeRefusal ? removeRefusal.message : REMOVE_CONSEQUENCE}
                </p>
              </>
            )
          ) : (
            /* The shortcut past the middle state, for the guest who would rather
               just be done. A link, deliberately: it is the better outcome and the
               quieter control, because the loud version of it is the offer card
               under the album and the mark on their own photographs. */
            <button
              type="button"
              onClick={() => {
                close();
                onConfirmInstead();
              }}
              className="text-reading text-muted-foreground underline-offset-4 hover:underline"
            >
              Confirm it now instead
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
