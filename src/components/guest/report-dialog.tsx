"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { Textarea } from "@/components/ui/textarea";

/**
 * The discreet report control at the foot of the event page. Anonymous: it
 * POSTs the event's `qr_token` (its capability) plus an optional reason to
 * /api/reports. Reporting NEVER hides content — it queues an operator review
 * (anti-griefing; see `create_report`). The trigger stays a muted link.
 *
 * ★ IT IS A FORM, AND OPENS AS ONE (`popups` r1, `forms=dialog`, Will
 * 2026-09-27): a small centred dialog, the same object as a confirmation,
 * because it is one question with a field in it. It stands in what the
 * keyboard leaves while the reason is typed (the Dialog learned the Sheet's
 * keyboard rule, `use-keyboard-inset.ts`), and on a phone it opens with focus
 * on itself, so the keyboard rises only when the field is tapped.
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
    <Popup open={open} onOpenChange={setOpen}>
      <PopupTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Flag /> Report
        </Button>
      </PopupTrigger>
      <PopupContent kind="form">
        <PopupHeader
          title="Report this event"
          description={
            <>
              Tell us what&rsquo;s wrong and our team will review it. Reports
              are anonymous.
            </>
          }
        />
        <PopupBody className="space-y-2">
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
        </PopupBody>
        <PopupFooter>
          <PopupClose asChild>
            <Button variant="outline">Cancel</Button>
          </PopupClose>
          <Button disabled={isPending} onClick={onSubmit}>
            {isPending ? "Sending…" : "Submit report"}
          </Button>
        </PopupFooter>
      </PopupContent>
    </Popup>
  );
}
