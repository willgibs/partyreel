"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteAccountAsOperatorAction } from "@/app/admin/accounts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The operator's half of account deletion. Same request path as the host's own
 * card, so the outcome is identical: plan cancelled, events binned, profile
 * anonymised at once, and the purge cron finishes the hard delete.
 *
 * The retyped identifier is the wrong-row guard. It is checked SERVER-side
 * against the account being deleted, so this input is the prompt, not the
 * enforcement.
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
  const [confirmation, setConfirmation] = useState("");
  const [pending, startPending] = useTransition();

  function onDelete() {
    startPending(async () => {
      const result = await deleteAccountAsOperatorAction(userId, confirmation);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Account queued for deletion.");
      setOpen(false);
      setConfirmation("");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmation("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 /> Delete account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this account?</DialogTitle>
          <DialogDescription>
            Immediate and permanent, exactly as if the account holder had done
            it themselves.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            Any active subscription is cancelled first. If Stripe refuses,
            nothing is deleted.
          </li>
          <li>
            {eventCount === 1
              ? "1 event is binned now"
              : `${eventCount} events are binned now`}{" "}
            and hard-deleted by the next purge run, media and R2 objects
            included.
          </li>
          {heldEventCount > 0 && (
            <li className="text-foreground">
              {heldEventCount === 1
                ? "1 event is under a legal hold"
                : `${heldEventCount} events are under a legal hold`}
              . Held events are skipped and the auth user survives until the
              hold is released. The profile is still anonymised now.
            </li>
          )}
          <li>
            The profile is anonymised immediately and the person can no longer
            sign in.
          </li>
        </ul>

        <div className="space-y-1.5">
          <Label htmlFor="operator-delete-confirm">
            Type{" "}
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground tabular-nums">
              {identifier}
            </span>{" "}
            to confirm
          </Label>
          <Input
            id="operator-delete-confirm"
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending || confirmation.trim().length === 0}
            onClick={onDelete}
          >
            {pending ? "Deleting…" : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
