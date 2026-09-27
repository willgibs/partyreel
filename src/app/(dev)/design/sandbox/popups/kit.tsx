"use client";

import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Lock,
  Palette,
  Printer,
  QrCode,
  Share2,
  X,
} from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { EVENT, QR_STYLES } from "./fixtures";
import type { Spot } from "./grounds";
import { Scrim, type Parts, type Size } from "./surfaces";

/**
 * THE SHARE PIECES two kinds draw: the host's whole kit (`event-share-sheet.tsx`,
 * a sheet today, and the ground the code's Customize opens over), his code card
 * (`event-code-modal.tsx`, his `share=room` pick) and the four code styles
 * (`qr-preset-picker.tsx`). Quoted markup on production's classes; the QR is
 * `FooterQr` (synchronous SVG) and a style's preview is the real `StyledQr`
 * wearing the real preset.
 */

const JOIN = `https://${EVENT.url}`;

/** The code on its white plate: scanner contrast in either theme. */
export function CodePlate({ size }: { size: number }) {
  return (
    <div className="mx-auto w-fit rounded-xl bg-white p-3">
      <FooterQr value={JOIN} size={size} />
    </div>
  );
}

/** The kit's parts: the code, the verbs, the files, and the readable link. */
export function kitParts(customize?: Spot): Parts {
  return {
    title: `Share ${EVENT.name}`,
    body: (
      <div className="flex flex-col gap-5 pb-2">
        <CodePlate size={220} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            tabIndex={-1}
            data-pop-primary=""
          >
            <Copy /> Copy link
          </Button>
          <Button variant="outline" size="sm" tabIndex={-1}>
            <Share2 /> Share
          </Button>
          <Button variant="outline" size="sm" tabIndex={-1}>
            <ExternalLink /> Open
          </Button>
          <Button variant="outline" size="sm" tabIndex={-1}>
            <Printer /> Print
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" tabIndex={-1}>
            <Download /> Download the code <ChevronDown />
          </Button>
          {customize?.replace ?? (
            <span className="relative">
              <Button variant="outline" size="sm" tabIndex={-1}>
                <Palette /> Customize
              </Button>
              {customize?.at}
            </span>
          )}
        </div>
        {customize?.below}
        <section className="space-y-2">
          <h3 className="font-heading text-card-title">A readable link</h3>
          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <span className="text-sm">Custom link</span>
            <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
              <Lock className="size-3" aria-hidden /> Pro
            </span>
          </div>
        </section>
      </div>
    ),
  };
}

/* ── the four code styles ────────────────────────────────────────────────── */

/**
 * One style's preview: the real renderer wearing the real preset, drawn at
 * `width` px. ★ ALWAYS RENDERED AT 160 AND SCALED BY ITS BOX, as the shipped
 * picker renders it: below about 90 px `qr-code-styling` rounds a module to
 * zero, so Rounded and Dots drew as blank squares at a row's 40 px.
 */
export function StylePreview({
  id,
  width,
}: {
  id: QrStyleKey;
  width?: number;
}) {
  return (
    <span
      className="block rounded-lg bg-white p-1.5"
      style={width ? { width } : undefined}
    >
      <StyledQr
        value={JOIN}
        size={160}
        style={QR_PRESETS[id].options}
        className="mx-auto [&>svg]:h-auto [&>svg]:w-full"
      />
    </span>
  );
}

/** `QrPresetPicker`'s cards, quoted: two columns, the chosen one ringed. */
export function StyleGrid({ columns = 2 }: { columns?: 2 | 4 }) {
  return (
    <div
      data-pop-rows=""
      data-pop-noun="styles"
      className={cn(
        "grid gap-3",
        columns === 4 ? "grid-cols-4" : "grid-cols-2",
      )}
    >
      {QR_STYLES.map((s, i) => (
        <span
          key={s.id}
          data-pop-row=""
          className={cn(
            "relative flex flex-col items-center gap-2 rounded-xl border-2 p-2.5 text-center",
            i === 0 ? "border-brand" : "border-border",
          )}
        >
          <StylePreview id={s.id} />
          <span className="block">
            <span className="block text-sm font-medium">{s.name}</span>
            <span className="block text-caption text-muted-foreground">
              {s.line}
            </span>
          </span>
          {i === 0 && (
            <span className="absolute top-1.5 right-1.5 rounded-full bg-brand p-0.5 text-brand-foreground">
              <Check className="size-3" aria-hidden />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/* ── his code card ───────────────────────────────────────────────────────── */

const CARD_BUTTON =
  "flex-1 border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900";

/**
 * `event-code-modal.tsx`, quoted: the whole screen in white in a hand (its
 * edges the viewport's, so the corner comes off), a 384 panel in the middle
 * at a desk, over a 40 percent scrim. `who` is whose share it is: a guest's
 * card offers Download where the host's offers Everything.
 */
export function CodeCard({ size, who }: { size: Size; who: "guest" | "host" }) {
  const phone = size === "phone";
  return (
    <>
      <Scrim dim={0.4} blur={0} />
      <div
        data-pop-surface="card"
        className={cn(
          "fixed z-50 flex flex-col items-center justify-center gap-5 bg-white p-6 text-neutral-900",
          phone
            ? "inset-0"
            : cn(
                "top-1/2 left-1/2 w-96 -translate-x-1/2 -translate-y-1/2",
                floatingPanel,
                "bg-white text-neutral-900",
              ),
        )}
      >
        <div className="rounded-lg bg-white p-3">
          <FooterQr value={JOIN} size={phone ? 300 : 260} />
        </div>
        <div className="space-y-1 text-center">
          <p className="font-heading text-card-title">{EVENT.name}</p>
          <p className="text-xs text-neutral-500">{EVENT.url}</p>
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={CARD_BUTTON}
            tabIndex={-1}
            data-pop-primary=""
          >
            <Copy /> Copy link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={CARD_BUTTON}
            tabIndex={-1}
          >
            <Share2 /> Share
          </Button>
          {who === "host" ? (
            <Button size="sm" className="flex-1" tabIndex={-1}>
              <QrCode /> Everything
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={CARD_BUTTON}
              tabIndex={-1}
            >
              <Download /> Download
            </Button>
          )}
        </div>
        <span className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-neutral-500">
          <X className="size-4" aria-hidden />
        </span>
      </div>
    </>
  );
}

/* ── the phone's own share sheet ─────────────────────────────────────────── */

const APPS = [
  { name: "AirDrop", tone: "#1c8cf6" },
  { name: "Messages", tone: "#34c759" },
  { name: "Mail", tone: "#2f7cf6" },
  { name: "WhatsApp", tone: "#25d366" },
  { name: "Notes", tone: "#f7c948" },
] as const;

/**
 * THE SYSTEM'S SHARE SHEET, a flat stand-in for iOS's own (`popups.css` holds
 * its greys): the link's preview in its head, the apps under it, the actions
 * in a card. Not ours to style, which is the option's whole point: a phone
 * already knows how to send a link, and every guest has used this sheet.
 */
export function OsShareSheet() {
  return (
    <>
      <Scrim dim={0.25} blur={0} />
      <div
        data-pop-surface="os-share"
        data-pop-os=""
        className="fixed inset-x-0 bottom-0 z-50 space-y-4 rounded-t-[14px] bg-[var(--os-bg)] px-4 pt-4 pb-8 text-[var(--os-ink)]"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-white p-0.5">
            <FooterQr value={JOIN} size={40} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{EVENT.name}</p>
            <p className="truncate text-[13px] text-[var(--os-sub)]">
              partyreel.com · Options ›
            </p>
          </div>
          <span className="flex size-7 items-center justify-center rounded-full bg-[var(--os-sep)]/60 text-[var(--os-sub)]">
            <X className="size-3.5" aria-hidden />
          </span>
        </div>
        <div className="h-px bg-[var(--os-sep)]" />
        <div className="flex justify-between">
          {APPS.map((a) => (
            <span
              key={a.name}
              className="flex w-16 flex-col items-center gap-1.5"
            >
              <span
                className="size-14 rounded-[14px]"
                style={{ backgroundColor: a.tone }}
              />
              <span className="text-[11px]">{a.name}</span>
            </span>
          ))}
        </div>
        <div className="divide-y divide-[var(--os-sep)] overflow-hidden rounded-[10px] bg-[var(--os-card)] text-[15px]">
          {[
            "Copy",
            "Add to Reading List",
            "Add Bookmark",
            "Add to Home Screen",
          ].map((row) => (
            <p
              key={row}
              className="flex h-11 items-center justify-between px-4"
            >
              {row}
              {row === "Copy" && (
                <Copy className="size-4 text-[var(--os-sub)]" aria-hidden />
              )}
            </p>
          ))}
        </div>
      </div>
    </>
  );
}
