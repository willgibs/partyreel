"use client";

import type { ReactNode } from "react";

import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

/**
 * THE CONFIRM DOOR ON AN ALBUM, ONE OBJECT FOR THE THREE PLACES THAT OPEN IT (guest by upload,
 * 2026-09-22): the offer card under a first upload, the Unverified mark on a guest's own credit, and
 * the header's name menu (which also opens it as Sign in). They were three hand-built dialogs that
 * each claimed the uploads and then SAVED the event; save is gone ("uploading to an event is now
 * effectively saving"), so all three now do one thing, in one order, here:
 *
 *   1. the account door in its `keep` wear (or `signin`), whose words hold before an upload too,
 *      since the name menu offers it the moment a name is typed;
 *   2. on a verified code, the CLAIM, awaited: the guest's uploads (and with them their events)
 *      become the account's before anything redraws, because a refresh that overtook the claim
 *      would redraw the very credit the guest just paid an email to fix;
 *   3. then the opener's own follow-through (a newsletter write, a dismissal, a refresh).
 *
 * A Google or magic-link confirmation never reaches step 2 here: it leaves the page and comes back
 * to the album's mount-time claim instead. That is why every opener writes the return marker
 * (`markPendingOffer`, lib/guest/album-return.ts) BEFORE it opens this, and why the follow moment
 * itself is the album page's decision, not this door's: the page hears every claim, from here or
 * from its own mount, and plays the moment only when this album's uploads actually moved.
 *
 * The Dialog owns the title and the description for a11y (radix wires aria-labelledby and
 * -describedby to them), so the words come from the door's own wear table rather than being retyped;
 * an opener may override the description alone, for a fact only it knows.
 */
export function ConfirmEmailDialog({
  open,
  onOpenChange,
  wear = "keep",
  description,
  hintEmail,
  onConfirmed,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `keep` confirms (and usually CREATES); `signin` is for somebody who already has an account. */
  wear?: "keep" | "signin";
  /** Replaces the wear's reason line when the opener knows something the table cannot. */
  description?: string;
  /**
   * An address typed at the album's door this visit, so the field opens on it. A convenience,
   * never an authorization: the code still has to land in that mailbox.
   */
  hintEmail?: string | null;
  /** The opener's follow-through, after the claim has landed. */
  onConfirmed?: () => void | Promise<void>;
  /** One extra control under the field (the offer card's newsletter switch). */
  children?: ReactNode;
}) {
  const copy = DOOR_WEAR[wear];
  // Built at render from where the guest is standing, so a magic link or the Google round trip
  // comes back to this album (a custom slug included) and its mount-time claim.
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${window.location.pathname}`
      : "/auth/callback";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.heading}</DialogTitle>
          <DialogDescription>{description ?? copy.reason}</DialogDescription>
        </DialogHeader>
        <AccountDoor
          wear={wear}
          methods={{ code: true, google: true, password: wear === "signin" }}
          emailRedirectTo={emailRedirectTo}
          chrome="none"
          // Confirming CREATES for most people; signing in does not, and saying "you already had an
          // account" to somebody who just pressed Sign in is noise rather than a warning.
          intent={wear === "signin" ? "signin" : "create"}
          // Undefined rather than null when there is nothing to hint: the door seeds its field from
          // this once, and a null would read as a hint of empty rather than as no hint.
          hintEmail={hintEmail ?? undefined}
          onVerified={async () => {
            await claimAnonymousUploads({ silent: true });
            await onConfirmed?.();
          }}
        >
          {children}
        </AccountDoor>
      </DialogContent>
    </Dialog>
  );
}
