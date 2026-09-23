"use client";

import { type CSSProperties } from "react";
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

/**
 * THE STYLE STEP, REDESIGNED (Will, `style=step`, 2026-09-21: "The picker needs
 * a redesign. Choosing this selection because it makes more sense to handle it
 * up front. Hosts may not know they can adjust it later. This introduces the
 * feature").
 *
 * His verdict keeps the step and asks the drawing to earn it, and his note says
 * what the step is FOR: introducing a feature a host would otherwise never find.
 * So the swatches got big enough to read as a choice rather than four
 * thumbnails, each one says what it is, and the step says out loud that the
 * choice is not final — which is the exact fear the note names.
 *
 * ★ THE CODE SIZES ITSELF IN CSS, NOT IN JS, and that is what lets one picker
 * fit both consumers. `StyledQr` renders a fixed-pixel SVG from its `size` prop,
 * so a picker that wanted 96 px inside a ~460 px designer dialog and 160 inside
 * the wizard would have to measure its container and re-render the code. One
 * `w-full` on the svg does it with no layout effect and no second render: the
 * swatch is as big as its cell, with a cap so a wide container does not turn
 * four codes into four posters, and it never overflows at 375. `size` is still
 * passed, because it sets the rendered resolution and the quiet zone the
 * generator bakes in; the CSS only scales what it already drew. A square viewBox
 * with `h-auto` keeps it square at every width, and a code that is not square
 * does not scan (the mini-modal's own precedent, share.css).
 *
 * ★ A CONTAINER QUERY, NEVER A VIEWPORT BREAKPOINT. This grid lives in a 576 px
 * wizard card and in a ~460 px dialog, both of which are narrow on a wide
 * screen: a `sm:grid-cols-4` once forced four 96 px previews into the dialog and
 * clipped them (P5 S3·3b). `@3xl` asks the CELL's own container, so four-across
 * arrives only where four actually fit.
 *
 * Presentational and controlled: no event, no save, and NO new prop: `value` /
 * `onChange` / `joinUrl` are exactly what the Library's composition and the
 * designer dialog already pass. The step's one reassuring line ("You can change
 * this later from Share") belongs to the WIZARD, not here — inside the share
 * sheet's own designer it would be a surface telling you to visit itself.
 */
export function QrPresetPicker({
  value,
  onChange,
  joinUrl,
}: QrPresetPickerProps) {
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {QR_STYLE_KEYS.map((key, i) => {
          const preset = QR_PRESETS[key];
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={selected}
              // Cascade in when the designer opens (S4·A4): each swatch carries its
              // index for the stagger (a keyframe, so transition-colors stays intact).
              data-preset-arrive
              style={{ "--arrive-i": i } as CSSProperties}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-colors",
                selected
                  ? "border-brand"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <span className="block w-full rounded-lg bg-white p-2">
                <StyledQr
                  value={joinUrl}
                  size={160}
                  style={preset.options}
                  className="mx-auto w-full max-w-[160px] [&>svg]:h-auto [&>svg]:w-full"
                />
              </span>
              <span className="block">
                <span className="block text-sm font-medium">{preset.label}</span>
                <span className="block text-caption text-muted-foreground">
                  {preset.description}
                </span>
              </span>
              {selected && (
                <span
                  data-check-pop
                  className="absolute top-1.5 right-1.5 rounded-full bg-brand p-0.5 text-brand-foreground"
                >
                  <Check className="size-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
