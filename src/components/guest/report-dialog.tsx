"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * The discreet report control at the foot of the event page. Anonymous: it
 * POSTs the event's `qr_token` (its capability) plus an optional reason to
 * /api/reports. Reporting NEVER hides content — it queues an operator review
 * (anti-griefing; see `create_report`). The trigger stays a muted link.
 *
 * ★ IT WEARS THE ONE PRODUCT SHEET, like the Invite beside it.
 *
 * ★ AND IT IS THE ONE WITH A FIELD IN IT, which is a known risk: the
 * responsive Sheet's phone half is a Radix panel, and a Radix panel has never
 * held a FOCUSED input on a real iPhone in this product. The guest gate next
 * door keeps vaul's engine for exactly that reason (`repositionInputs`,
 * entry-shell.tsx) — vaul lifts the sheet above the keyboard and Radix does
 * not. If the keyboard covers this textarea on a real phone, the fix is the
 * SHEET's phone half becoming vaul-backed for every consumer, ONE follow-up,
 * never a per-dialog exception that puts this screen back on its own surface.
 */
export function ReportDialog({ qrToken }: { qrToken: string }) {
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
            qr_token: qrToken,
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
        toast.success("Thanks. Your report has been sent for review.");
      } catch (err) {
        toast.error("Couldn't submit your report.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Flag /> Report
        </Button>
      </SheetTrigger>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Report this event</SheetTitle>
          <SheetDescription>
            Tell us what&rsquo;s wrong and our team will review it. Reports are
            anonymous.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2 px-4">
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
            placeholder="What's the problem here?"
          />
        </div>
        {/* A panel's footer stacks (it has a column, not a dialog's row of two);
            the primary leads, because the way out of a sheet is also its edge. */}
        <SheetFooter>
          <Button disabled={isPending} onClick={onSubmit}>
            {isPending ? "Sending…" : "Submit report"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
