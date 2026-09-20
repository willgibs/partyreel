"use client";

import Link from "next/link";

import { StyledQr } from "@/components/app/styled-qr";
import { Caption } from "@/components/marketing/system/caption";
import { trackAttrs } from "@/lib/analytics/events";
import { DEMO_CTA_LABEL } from "@/lib/constants/marketing-voice";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

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
      // The layout IS the placement (row = hero, column = the nav mega-panel),
      // so the analytics source derives from it instead of a second prop.
      {...trackAttrs("demo_open", {
        source: column ? "nav-ticket" : "hero-ticket",
      })}
      // The two shapes sit on DIFFERENT grounds and so cannot share a palette
      // (2026-08-28): `row` floats over the hero's media wall, where hard
      // white-on-black glass is exactly right, while `column` sits inside the
      // OPAQUE nav mega-panel — on the paper skin that made a mid-grey block
      // with near-illegible white caption text, and the backdrop-blur bought a
      // per-frame filter pass with nothing behind it to blur. The panel shape
      // rides house surface tokens instead, so it reads on cinema AND paper.
      className={
        column
          ? "flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
          : "inline-flex items-center gap-4 rounded-xl border border-white/15 bg-black/45 p-2.5 pr-6 backdrop-blur-sm transition-[border-color,transform] duration-150 hover:border-white/35 active:scale-[0.99]"
      }
    >
      {/* A REAL white plate either way: scanners need the contrast and the
          quiet zone (the ConferenceBadge/LiveQr precedent). */}
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
        <span
          className={cn(
            "text-reading font-medium",
            column ? "text-foreground" : "text-white",
          )}
        >
          {DEMO_CTA_LABEL}
        </span>
        <Caption className={column ? undefined : "text-white/60"}>
          <span className="hidden sm:inline">
            Scan with your phone, or tap to open
          </span>
          <span className="sm:hidden">Tap to open the demo album</span>
        </Caption>
      </span>
    </Link>
  );
}
