"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

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

// Per-row hold release. Two-step (arm, then confirm) instead of a dialog: releasing a hold puts
// the item back on the purge clock, so an accidental single click must not do it.
export function ReleaseHoldButton({ mediaId }: { mediaId: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!armed) {
      setArmed(true);
      return;
    }
    startTransition(async () => {
      const res = await releaseHoldAction(mediaId);
      setArmed(false);
      if (!res.ok) {
        toast.error(res.message ?? "Release failed.");
        return;
      }
      toast.success("Hold released. Preserved copies are untouched.");
    });
  }

  return (
    <Button
      type="button"
      variant={armed ? "destructive" : "outline"}
      size="sm"
      disabled={pending}
      onClick={onClick}
      onBlur={() => setArmed(false)}
    >
      {pending ? "Releasing…" : armed ? "Confirm release" : "Release hold"}
    </Button>
  );
}
