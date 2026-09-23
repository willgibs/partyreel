"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteAccountAsOperatorAction } from "@/app/admin/accounts/actions";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";

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

  const touches = [
    "Any active subscription is cancelled first. If Stripe refuses, nothing is deleted",
    `${eventCount === 1 ? "1 event is" : `${eventCount} events are`} binned now and hard-deleted by the next purge run, media and R2 objects included`,
    "The profile is anonymised immediately and the person can no longer sign in",
  ];
  if (heldEventCount > 0) {
    touches.splice(
      2,
      0,
      `${heldEventCount === 1 ? "1 event is" : `${heldEventCount} events are`} under a legal hold, skipped, and the auth user survives until it is released`,
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
