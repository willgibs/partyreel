"use client";

import { Check } from "lucide-react";

import {
  QR_PRESETS,
  QR_STYLE_KEYS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";
import { StyledQr } from "@/components/app/styled-qr";
import { cn } from "@/lib/utils";

type QrPresetPickerProps = {
  value: QrStyleKey;
  onChange: (value: QrStyleKey) => void;
  /** The real join URL, so each swatch previews this event's actual QR. */
  joinUrl: string;
};

// Presentational, controlled grid of live preset previews. Reused by the QR
// designer dialog now and the create wizard (cut #2) later — no event/save logic
// here; the parent owns `value` + persistence.
export function QrPresetPicker({
  value,
  onChange,
  joinUrl,
}: QrPresetPickerProps) {
  // 2-up. A viewport `sm:grid-cols-4` forced 4 columns into the ~460px QR designer
  // dialog on desktop, overflowing the fixed 96px previews into a clipped band
  // (P5 S3·3b). A 2x2 grid fits any container the picker lands in. If a WIDER
  // consumer (the create wizard) later wants 4-across, gate it on a CONTAINER query
  // (@container + @2xl:grid-cols-4), never a viewport breakpoint: the dialog is
  // narrow even when the viewport is wide.
  return (
    <div className="grid grid-cols-2 gap-3">
      {QR_STYLE_KEYS.map((key) => {
        const preset = QR_PRESETS[key];
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={selected}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors",
              selected
                ? "border-brand"
                : "border-border hover:border-foreground/30",
            )}
          >
            <div className="rounded-md bg-white p-2">
              <StyledQr value={joinUrl} size={96} style={preset.options} />
            </div>
            <span className="text-xs font-medium">{preset.label}</span>
            {selected && (
              <span className="absolute top-1.5 right-1.5 rounded-full bg-brand p-0.5 text-brand-foreground">
                <Check className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
