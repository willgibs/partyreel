"use client";

import Link from "next/link";

import { StyledQr } from "@/components/app/styled-qr";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { DEMO_CTA_LABEL } from "@/lib/constants/marketing-voice";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { DEMO_EVENT_URL } from "@/lib/demo";

/**
 * THE DEMO TICKET (Will's checkpoint ask; PROMOTED to system/ in the expansion round: the hero AND the Features mega-panel both render it): points at the REAL demo
 * event with both a scannable QR and a clickable route, folded into one small
 * glass artifact so the CTA stack stays calm. Desktop: scan with a phone OR
 * tap; mobile: the QR reads as the product's core symbol (scannability is a
 * bonus, the tap is the path) — same component, one size, per his "design
 * item" note. It REPLACES the hero's text-only DemoCtaLink (net addition is
 * the QR itself); DemoCtaLink stays everywhere else.
 *
 * The QR is ink-on-white on a real white plate (scanners need contrast + a
 * quiet zone; the ConferenceBadge/LiveQr precedent) at 92px — roughly 3px per
 * module for the /e/ URL, comfortably scannable at arm's length. StyledQr
 * dynamic-imports qr-code-styling inside its own effect, so the library never
 * rides the hero chunk; the explicitly sized container means the plate paints
 * immediately and the code pops in with zero layout shift. Env unset → null
 * (the DemoCtaLink contract).
 */
const QR_SIZE = 92;

export function DemoTicket({
  layout = "row",
}: {
  /** "row" = the hero shape (QR beside copy); "column" = the narrow-pane shape
   *  (QR above copy — the Features mega-panel's featured slot). */
  layout?: "row" | "column";
}) {
  if (!DEMO_EVENT_URL) return null;
  const column = layout === "column";
  return (
    <Link
      href={DEMO_EVENT_URL}
      className={
        column
          ? "flex flex-col items-center gap-3 rounded-xl border border-white/15 bg-black/45 p-4 text-center backdrop-blur-sm transition-[border-color,transform] duration-150 hover:border-white/35 active:scale-[0.99]"
          : "inline-flex items-center gap-4 rounded-xl border border-white/15 bg-black/45 p-2.5 pr-6 backdrop-blur-sm transition-[border-color,transform] duration-150 hover:border-white/35 active:scale-[0.99]"
      }
    >
      <span className="rounded-lg bg-white p-1.5">
        <StyledQr
          value={DEMO_EVENT_URL}
          size={QR_SIZE}
          style={resolveQrPreset("classic")}
          className="size-[92px]"
        />
      </span>
      <span
        className={
          column ? "flex flex-col items-center gap-1" : "flex flex-col gap-1.5"
        }
      >
        <span className="text-sm font-medium text-white sm:text-[15px]">
          {DEMO_CTA_LABEL}
        </span>
        <MonoCaption className="text-white/60">
          <span className="hidden sm:inline">
            Scan with your phone, or tap to open
          </span>
          <span className="sm:hidden">Tap to open the demo album</span>
        </MonoCaption>
      </span>
    </Link>
  );
}
