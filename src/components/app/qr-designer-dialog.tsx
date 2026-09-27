"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import { StyledQr } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  useResponsiveMenuShape,
} from "@/components/ui/responsive-menu";
import {
  DEFAULT_QR_PRESET,
  QR_PRESETS,
  QR_STYLE_KEYS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

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

/**
 * One style's code, the real renderer wearing the real preset. ★ ALWAYS DRAWN
 * AT 160 AND SCALED BY ITS BOX: below about 90 px `qr-code-styling` rounds a
 * module to zero, so Rounded and Dots would draw as blank squares at a row's 40.
 */
function StylePreview({
  styleKey,
  joinUrl,
  className,
}: {
  styleKey: QrStyleKey;
  joinUrl: string;
  className?: string;
}) {
  return (
    <span className={cn("block shrink-0 rounded-md bg-white p-1", className)}>
      <StyledQr
        value={joinUrl}
        size={160}
        style={QR_PRESETS[styleKey].options}
        className="[&>svg]:h-auto [&>svg]:w-full"
      />
    </span>
  );
}

/** The four styles, as the menu's shape wants them: tiles under the button, rows at the thumb. */
function StyleChoices({
  current,
  joinUrl,
  onChoose,
}: {
  current: QrStyleKey;
  joinUrl: string;
  onChoose: (key: QrStyleKey) => void;
}) {
  const shape = useResponsiveMenuShape();
  if (shape === "menu") {
    return (
      <div className="grid grid-cols-2 gap-1">
        {QR_STYLE_KEYS.map((key) => (
          <ResponsiveMenuItem
            key={key}
            aria-current={key === current ? "true" : undefined}
            icon={<StylePreview styleKey={key} joinUrl={joinUrl} />}
            onSelect={() => onChoose(key)}
            className={cn(
              "flex-col gap-1.5 p-2 text-center text-xs font-medium",
              key === current && "bg-accent",
            )}
          >
            {QR_PRESETS[key].label}
          </ResponsiveMenuItem>
        ))}
      </div>
    );
  }
  return QR_STYLE_KEYS.map((key) => (
    <ResponsiveMenuItem
      key={key}
      aria-current={key === current ? "true" : undefined}
      icon={
        <StylePreview styleKey={key} joinUrl={joinUrl} className="w-10" />
      }
      hint={key === current ? <Check className="size-4" aria-hidden /> : null}
      onSelect={() => onChoose(key)}
    >
      <span className="block">{QR_PRESETS[key].label}</span>
      <span className="block text-xs text-muted-foreground">
        {QR_PRESETS[key].description}
      </span>
    </ResponsiveMenuItem>
  ));
}

/**
 * THE CODE'S STYLE, AS A QUICK CHOICE (`popups` r1, `choices=menu`, Will
 * 2026-09-27): "Customize" in the share kit opens the four styles under itself
 * at a desk, like any menu, and at the thumb in a hand with the Cancel this
 * surface never had (the old centred dialog had only Save). Each style is drawn
 * as this event's real code.
 *
 * ★ A STYLE IS THE ACT. Pressing Rounded saves Rounded through the existing
 * `updateEventAction` (which revalidates the page, so the kit's code redraws in
 * it) and the menu closes; the toast says it landed. There is no Save, so
 * there is no unsaved choice to discard on the way out. Pressing the style
 * already in force closes the menu and saves nothing.
 *
 * The name stays for its one caller (`share/event-share-sheet.tsx`).
 */
export function QrDesignerDialog({
  eventId,
  joinUrl,
  current,
}: QrDesignerDialogProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const style = toStyleKey(current);

  function choose(key: QrStyleKey) {
    if (key === style) return;
    startSaving(async () => {
      const result = await updateEventAction(eventId, { qr_style: key });
      if (!result || result.ok) {
        toast.success("QR style saved.");
        return;
      }
      toast.error("Couldn't save the QR style.", {
        description: result.message,
      });
    });
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isSaving}
        onClick={() => setOpen((was) => !was)}
      >
        <Palette /> Customize
      </Button>
      <ResponsiveMenu
        open={open}
        onOpenChange={setOpen}
        anchor={triggerRef}
        title="The code's style, saved everywhere you share it"
        className="w-[18.5rem]"
      >
        <StyleChoices current={style} joinUrl={joinUrl} onChoose={choose} />
      </ResponsiveMenu>
    </>
  );
}
