"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

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
  /**
   * The link every swatch encodes. Before an event exists (Create's look step) it is the stand-in
   * (`previewJoinUrl`), as long as a real one so each corner draws the real code's density, and opening
   * no event: the step says its codes are samples.
   */
  joinUrl: string;
  className?: string;
};

/**
 * THE FOUR LOOKS, AS FOUR CORNERS (create-wizard r2 `look=places`, Will 2026-10-03: four swatches under
 * the two places her code goes, re-dressing both as she picks; the step itself is first-event's
 * `style=step`, "This introduces the feature").
 *
 * ★ A CORNER, NEVER A WHOLE CODE. Four whole codes at a swatch's size read as the same grey noise four
 * times; a window onto the top left of each look's own code, drawn at nearly three times the window,
 * shows what tells them apart: a rounded finder reads as rounded, Bold's coral as coral, the dots as
 * dots. The pictures above the swatches carry the whole code, so a swatch only has to name its look.
 *
 * ★ ONE CHOICE OF FOUR, SAID AS ONE: a radio group, so a screen reader hears "one of four" and the
 * arrows move between the looks, choosing as they go (Radix's roving focus). The chosen corner wears a
 * ring offset from it in the ground's own ink, its name in the foreground.
 *
 * ★ ITS SIZE IS SET IN CSS, NEVER BY RE-RENDERING (host-app.md): `StyledQr` draws once at a fixed
 * resolution and the window scales it, so a swatch at a phone and one at a desk are the same drawing.
 *
 * Presentational and controlled: no event, no save; `value`, `onChange` and `joinUrl` are what the
 * Library's composition passes too. The step's own words ("Change it any time from Share") are Create's,
 * never this picker's.
 */
export function QrPresetPicker({
  value,
  onChange,
  joinUrl,
  className,
}: QrPresetPickerProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(v) => onChange(v as QrStyleKey)}
      aria-label="The code's look"
      orientation="horizontal"
      loop
      className={cn("flex justify-center gap-5 md:gap-7", className)}
    >
      {QR_STYLE_KEYS.map((key) => {
        const preset = QR_PRESETS[key];
        return (
          <RadioGroupPrimitive.Item
            key={key}
            value={key}
            data-look={key}
            className="group/look flex cursor-pointer flex-col items-center gap-2 rounded-lg outline-none"
          >
            <span
              aria-hidden
              className={cn(
                "relative block size-[3.375rem] overflow-hidden rounded-[22%] bg-white md:size-16",
                "outline-2 outline-offset-3 outline-transparent transition-[outline-color] duration-150",
                "group-data-[state=checked]/look:outline-foreground",
                "group-focus-visible/look:ring-3 group-focus-visible/look:ring-ring/50",
              )}
            >
              {/* The look's own code at 2.7 times the window, its quiet zone pulled past the edge, so
                  the window shows the finder and the first modules. */}
              <span className="absolute -top-[14.85%] -left-[14.85%] block w-[270%]">
                <StyledQr
                  value={joinUrl}
                  size={176}
                  style={preset.options}
                  className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                />
              </span>
            </span>
            <span className="text-caption text-muted-foreground transition-colors duration-150 group-data-[state=checked]/look:font-medium group-data-[state=checked]/look:text-foreground">
              {preset.label}
            </span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
