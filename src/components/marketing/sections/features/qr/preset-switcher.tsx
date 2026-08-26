"use client";

import { Check, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { StyledQr, type StyledQrHandle } from "@/components/app/styled-qr";
import { TextSwap } from "@/components/marketing/sections/features/shared/text-swap";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  QR_PRESETS,
  QR_STYLE_KEYS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * THE PRESET SWITCHER (the /features/qr signature; the /reel style-switcher's
 * sibling): ONE live QR restyled instantly through the four REAL app presets
 * (QR_PRESETS is the same constants module the in-app designer reads, and
 * StyledQr the same renderer, so "the designer is real" is literally true).
 * The mock quotes the shipped designer's control shapes: a 2x2 swatch grid
 * with a check on the selected preset and one "Save QR style" button; the
 * downloads echo the app's exact framings and, when the demo event is
 * configured, REALLY download the styled code via StyledQr's imperative
 * handle. Bold's coral corner markers are product truth inside the render;
 * the chrome around it stays achromatic.
 */

const QR_VALUE = DEMO_EVENT_URL ?? "https://partyreel.com/e/demo";

/**
 * R4 / review B8: at swatch scale a full event URL packs ~33 modules into ~100px,
 * and Classic / Rounded / Dots become the same grey square — the headline says
 * "four presets" while the visual proves one. The swatches encode a SHORT value
 * instead, so the same real renderer draws chunky modules whose square / rounded
 * / dot shapes are legible at a glance. The big live preview keeps the real
 * (scannable) demo URL: only the style SAMPLES trade payload for legibility.
 */
const SWATCH_VALUE = "https://partyreel.com";
const SAVED_FLASH_MS = 1600;

export function PresetSwitcher() {
  const [selected, setSelected] = useState<QrStyleKey>("classic");
  const [saved, setSaved] = useState(false);
  const qrRef = useRef<StyledQrHandle>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const preset = QR_PRESETS[selected];

  return (
    <SectionShell
      id="designer"
      eyebrow="The designer"
      heading={
        <>
          {/* R4 / review B22: the auto-break landed mid-phrase ("One / rule").
              The break is explicit from sm up; below sm the line wraps on its
              own anyway and a forced two-line split would only crowd it. */}
          Four presets.
          <br className="hidden sm:block" /> One rule: it has to scan.
        </>
      }
      subhead="Every preset keeps dark modules on a white background, always. The brand color only ever tints the corner markers, so a styled code still reads first try."
    >
      {/* R4 / review B7: the two columns were vertically CENTERED and split 5/7,
          so the preview floated low under ~220px of dead air while the picker
          towered over it. Even columns, top-aligned, with a bigger code: the
          thing being styled outweighs the control that styles it. */}
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
        {/* The one live code: a preset tap rerenders it in place. */}
        <div className="flex flex-col gap-6 lg:col-span-6">
          <div className="mx-auto w-fit">
            <div className="w-fit rounded-2xl border bg-card p-4 ring-1 ring-foreground/5">
              <div className="w-fit rounded-xl bg-white p-4">
                <StyledQr
                  ref={qrRef}
                  value={QR_VALUE}
                  size={300}
                  style={preset.options}
                />
              </div>
            </div>
            <MonoCaption aria-live="polite" className="mt-3 text-center">
              <TextSwap value={`${preset.label} · ${preset.description}`} />
            </MonoCaption>
          </div>
          {/* The explainer belongs with the thing it explains — and it is what
              keeps the two columns near the same height (B7 again). */}
          <p className="mx-auto max-w-md text-center text-sm text-pretty text-muted-foreground">
            Tap a swatch and the code restyles instantly, exactly like the
            designer inside the app. Shape changes that trim the decode margin
            automatically step up the error correction, so pretty never beats
            scannable.
          </p>
        </div>

        {/* The designer, quoted: the app's 2x2 swatch grid + save. */}
        <div className="flex flex-col gap-5 lg:col-span-6">
          <div className="mx-auto w-full max-w-md rounded-2xl border bg-card/60 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              {QR_STYLE_KEYS.map((key) => {
                const p = QR_PRESETS[key];
                const isSelected = key === selected;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelected(key)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors duration-150",
                      isSelected
                        ? "border-foreground/50"
                        : "border-border hover:border-foreground/25",
                    )}
                  >
                    <span className="rounded-md bg-white p-1.5">
                      <StyledQr
                        value={SWATCH_VALUE}
                        size={128}
                        style={p.options}
                      />
                    </span>
                    <span className="text-xs font-medium">{p.label}</span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-foreground p-0.5 text-background">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                // A wink, not a form: the flash is the whole save (nothing
                // persists on a marketing page).
                setSaved(true);
                if (savedTimer.current) clearTimeout(savedTimer.current);
                savedTimer.current = setTimeout(
                  () => setSaved(false),
                  SAVED_FLASH_MS,
                );
              }}
              className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.98]"
            >
              {/* R4: the label trades on the .mkt-text-swap grammar instead of a
                  hard conditional. The shipped button carries no icon at all
                  ("Saving…" / "Save QR style"), so the wink is the WORD. */}
              <TextSwap value={saved ? "Saved" : "Save QR style"} />
            </button>
          </div>

          {DEMO_EVENT_URL ? (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {/* REAL downloads of the code on screen (the app's exact download
                  framings), only when the encoded URL is the real demo event. */}
              <button
                type="button"
                onClick={() => qrRef.current?.download("partyreel-qr", "svg")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <Download className="size-3.5" />
                SVG (best for print)
              </button>
              <button
                type="button"
                onClick={() => qrRef.current?.download("partyreel-qr", "png")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <Download className="size-3.5" />
                PNG (best for screens)
              </button>
            </div>
          ) : (
            <MonoCaption className="text-center">
              Downloads in the app: SVG (best for print) · PNG (best for
              screens)
            </MonoCaption>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
