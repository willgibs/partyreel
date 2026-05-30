"use client";

import { useState, useTransition } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import {
  DEFAULT_QR_PRESET,
  QR_STYLE_KEYS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";

type QrDesignerDialogProps = {
  eventId: string;
  joinUrl: string;
  /** The persisted `events.qr_style` (string — may be a legacy/unknown value). */
  current: string;
};

function toStyleKey(value: string): QrStyleKey {
  return (QR_STYLE_KEYS as readonly string[]).includes(value)
    ? (value as QrStyleKey)
    : DEFAULT_QR_PRESET;
}

// "Customize" launcher for the event page. Saves the chosen preset via the
// existing updateEventAction (which revalidates the page, so the live EventQr on
// the card re-renders with the new style). Reopening re-syncs to the persisted
// value, discarding any unsaved selection.
export function QrDesignerDialog({
  eventId,
  joinUrl,
  current,
}: QrDesignerDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<QrStyleKey>(toStyleKey(current));
  const [isSaving, startSaving] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) setSelected(toStyleKey(current));
    setOpen(next);
  }

  function onSave() {
    startSaving(async () => {
      const result = await updateEventAction(eventId, { qr_style: selected });
      if (!result || result.ok) {
        toast.success("QR style saved.");
        setOpen(false);
        return;
      }
      toast.error("Couldn't save the QR style.", {
        description: result.message,
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette /> Customize
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize the QR code</DialogTitle>
          <DialogDescription>
            Pick a style for your guest-join QR. It&rsquo;s saved to this event
            and used everywhere you share it.
          </DialogDescription>
        </DialogHeader>
        <QrPresetPicker
          value={selected}
          onChange={setSelected}
          joinUrl={joinUrl}
        />
        <DialogFooter>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save QR style"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
