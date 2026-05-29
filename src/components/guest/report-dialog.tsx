"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Discreet album-level report control on the public gallery. Anonymous: it POSTs
// the album's share_token (its capability) + an optional reason to /api/reports.
// Reporting NEVER hides content — it just queues an operator review (anti-griefing
// — see create_report). The trigger is muted to fit the always-dark gallery; the
// Dialog itself renders on the default themed surface via the portal.
export function ReportDialog({ shareToken }: { shareToken: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            share_token: shareToken,
            reason: reason.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const message =
            data && typeof data === "object" && "message" in data
              ? String((data as { message: unknown }).message)
              : "Please try again.";
          throw new Error(message);
        }
        setOpen(false);
        setReason("");
        toast.success("Thanks — your report has been sent for review.");
      } catch (err) {
        toast.error("Couldn't submit your report.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gallery-muted hover:bg-white/10 hover:text-gallery-foreground"
        >
          <Flag /> Report this album
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this album</DialogTitle>
          <DialogDescription>
            Tell us what&rsquo;s wrong and our team will review it. Reports are
            anonymous.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="report-reason">
            Reason{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="report-reason"
            rows={4}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What's the problem with this album?"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={isPending} onClick={onSubmit}>
            {isPending ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
