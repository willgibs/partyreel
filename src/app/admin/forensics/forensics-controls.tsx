"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { preserveMediaAction, releaseHoldAction } from "./actions";

// The preserve form: media UUID + a required reason -> sets the legal hold + copies the original
// into the preservation prefix. Success/failure both land in the audit log; this only toasts.
export function PreserveForm() {
  const [mediaId, setMediaId] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await preserveMediaAction(mediaId, reason);
      if (!res.ok) {
        toast.error(res.message ?? "Preserve failed.");
        return;
      }
      toast.success("Hold set and evidence preserved.");
      setMediaId("");
      setReason("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="forensics-media-id">Media id</Label>
        <Input
          id="forensics-media-id"
          value={mediaId}
          onChange={(e) => setMediaId(e.target.value)}
          placeholder="the media row UUID (from a report or /admin/albums)"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="forensics-reason">Hold reason</Label>
        <Input
          id="forensics-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. report #123, CyberTipline filing"
          autoComplete="off"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Preserving…" : "Set hold and preserve"}
      </Button>
    </form>
  );
}

/**
 * Per-row hold release, on the portal's one destructive sheet
 * (`destructive=sheet`, 2026-09-20). It was the only arm-then-confirm control
 * in the portal: a real answer to "an accidental single click must not do
 * this", and a fourth grammar for the same question three other surfaces
 * answered three other ways. The panel says what the release costs, which
 * arming never could.
 *
 * Reversible, so nothing is typed: a released hold can be set again, and the
 * preserved copy is untouched either way.
 */
export function ReleaseHoldButton({
  mediaId,
  eventName,
  preserved,
}: {
  mediaId: string;
  eventName: string;
  preserved: boolean;
}) {
  const [asking, setAsking] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setAsking(true)}
      >
        Release hold
      </Button>
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title="Release this legal hold?"
        lede="The item goes back on its normal purge clock from this moment. Preserved copies are untouched."
        verb="Release hold"
        touches={[
          `1 item in ${eventName}`,
          preserved
            ? "The preserved copy stays in the segregated store until deleted by hand"
            : "Nothing was ever preserved, so nothing survives the purge",
          "The release is written to the forensic audit log either way",
        ]}
        severity="reversible"
        successMessage="Hold released. Preserved copies are untouched."
        onConfirm={() => releaseHoldAction(mediaId)}
      />
    </>
  );
}
