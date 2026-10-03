"use client";

import { useState } from "react";
import { Trash2, Undo2 } from "lucide-react";

import {
  cancelAccountDeletionAsOperatorAction,
  deleteAccountAsOperatorAction,
} from "@/app/admin/accounts/actions";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * The operator's half of account deletion. Same request path as the host's own
 * card, so the outcome is identical: plan cancelled, events binned, profile
 * anonymised at once, and the purge cron finishes the hard delete.
 *
 * The retyped identifier is the wrong-row guard. It is checked SERVER-side
 * against the account being deleted, so this input is the prompt, not the
 * enforcement.
 *
 * ★ IT IS THE PORTAL'S ONE SHEET NOW, AND IT IS THE ONE THAT TYPES
 * (`destructive=sheet`, Will 2026-09-20: "only the permanent one makes you
 * type"). This surface was already the strictest of the portal's four
 * grammars, so what it gains is not friction but the panel's "what this
 * touches" list, which is the same list its dialog carried as loose prose.
 */
export function DeleteAccountControl({
  userId,
  identifier,
  eventCount,
  heldEventCount,
}: {
  userId: string;
  /** The account's email, or its id when there is no address on file. */
  identifier: string;
  eventCount: number;
  heldEventCount: number;
}) {
  const [open, setOpen] = useState(false);

  // Every count through formatCount: an account past 999 events read "1249 events" here, raw.
  const touches = [
    "Any active subscription is cancelled first. If Stripe refuses, nothing is deleted",
    `${eventCount === 1 ? "1 event is" : `${formatCount(eventCount)} events are`} binned now and hard-deleted by the next purge run, media and R2 objects included`,
    "The profile is anonymised immediately and the person can no longer sign in",
  ];
  if (heldEventCount > 0) {
    touches.splice(
      2,
      0,
      `${heldEventCount === 1 ? "1 event is" : `${formatCount(heldEventCount)} events are`} under a legal hold, skipped, and the auth user survives until it is released`,
    );
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 /> Delete account
      </Button>
      <DestructiveSheet
        open={open}
        onOpenChange={setOpen}
        title="Delete this account?"
        lede="Immediate and permanent, exactly as if the account holder had done it themselves."
        verb="Delete account"
        touches={touches}
        severity="permanent"
        confirmText={identifier}
        successMessage="Account queued for deletion."
        onConfirm={(typed) => deleteAccountAsOperatorAction(userId, typed)}
      />
    </>
  );
}

/**
 * What a cancelled deletion brings back and what it cannot, one line each, in the order an
 * operator explains it to the person who wrote in. Exported for its test: the list IS the control's
 * promise (Will, 2026-10-03: "say plainly in the control what comes back and what does not").
 */
export function cancelDeletionTouches(eventCount: number): string[] {
  const events =
    eventCount === 0
      ? null
      : eventCount === 1
        ? `Comes back: their event, in Deleted, restorable for ${RECENTLY_DELETED_WINDOW_DAYS} days from when it was deleted`
        : `Comes back: their ${formatCount(eventCount)} events, in Deleted, each restorable for ${RECENTLY_DELETED_WINDOW_DAYS} days from when it was deleted`;
  return [
    "Comes back: the sign-in, with its email address",
    ...(events ? [events] : []),
    "Stays gone: their name, profile photo and handle (they set a name again at their next sign-in)",
    "Stays gone: their plan, cancelled in Stripe and not refunded, and their newsletter signup",
    "Stays gone: their name and address on their rows in other hosts' albums, and any uploads they took out of those albums",
  ];
}

/**
 * THE OPERATOR'S CANCEL DELETION (lp/account-exit): the private failsafe for a deletion asked for
 * by mistake, offered only while the purge has not run (the page draws it while the stamp is set,
 * and a profile row means the sign-in still exists). Never offered to the person; never a SQL job.
 *
 * Reversible (the account can be deleted again), so the portal's one confirmation asks for no
 * typing (`destructive-sheet.tsx`: typing is for what nothing brings back); what it lists is the
 * promise, and the server refuses for itself what it cannot honour (`cancelAccountDeletion`).
 */
export function CancelDeletionControl({
  userId,
  eventCount,
}: {
  userId: string;
  /** Events still standing, every one of them in Deleted since the request. */
  eventCount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Undo2 /> Cancel deletion
      </Button>
      <DestructiveSheet
        open={open}
        onOpenChange={setOpen}
        title="Cancel this deletion?"
        lede="The account can sign in again, but much of what the deletion did stays done."
        // Its own verb, never "Cancel deletion" beside the sheet's own Cancel: the operator keeps the
        // account, as the person's dialog says "Keep my account".
        verb="Keep the account"
        touches={cancelDeletionTouches(eventCount)}
        severity="reversible"
        successMessage="Deletion cancelled. The account can sign in again."
        onConfirm={() => cancelAccountDeletionAsOperatorAction(userId)}
      />
    </>
  );
}
