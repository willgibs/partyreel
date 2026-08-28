"use client";

import { ArrowDown, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  PRESS_BOILERPLATE,
  PRESS_BOILERPLATE_SHORT,
  PRESS_FACTS,
  PRESS_KIT,
  PRESS_KIT_BYTES,
  PRESS_KIT_ZIP,
  PRESS_USAGE_RULES,
  formatKitBytes,
  type PressKitAsset,
} from "@/lib/constants/press";
import { BRAND_HEX } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * Shared plumbing for the PRESS IDENTITY round (lab-local, 2026-08-28).
 *
 * ★ THE CONTENT IS IDENTICAL ACROSS BOTH DIRECTIONS, ON PURPOSE. Same H1, same
 * standfirst, same boilerplate, same twelve facts, same seven rules, same six kit
 * files, same CTA labels. If one direction had punchier copy Will would be ruling on
 * copy, not identity. What varies is GROUND (ink plate vs all paper), DENSITY (a 3px
 * album grid vs hairline editorial rows), MOTION BUDGET, and WHERE THE ASSETS LIVE.
 * Everything shared lives here so a divergence has to be deliberate.
 *
 * Copy is PROVISIONAL: agent drafts, awaiting Will's ruling (constants/press.ts).
 */

export const PRESS_COPY = {
  eyebrow: "Press & brand",
  h1: "Take what you need.",
  standfirst:
    "The boilerplate, the fact sheet, and the brand files, ready to quote and ready to publish. Anything else, write to help@partyreel.com.",
  kitCta: `Download the kit`,
  kitMeta: `${PRESS_KIT.length} files, ${formatKitBytes(PRESS_KIT_BYTES)}`,
  boilerplateLabel: "The boilerplate",
  shortLabel: "The one-liner",
  factsLabel: "The fact sheet",
  rulesLabel: "Using the marks",
  closeHeading: "Need something that is not here?",
  closeBody:
    "Interviews, higher-resolution assets, or a walkthrough of the product. Every note gets a reply, usually within a day.",
} as const;

/** The three marks, each carrying both of its formats. PRESS_KIT stores one row per
 *  FILE (the zip builder needs that); a press page thinks in marks, not files. */
export type PressMark = { label: string; note: string; files: PressKitAsset[] };

export function pressMarks(): PressMark[] {
  const byLabel = new Map<string, PressMark>();
  for (const asset of PRESS_KIT) {
    const found = byLabel.get(asset.label);
    if (found) found.files.push(asset);
    else
      byLabel.set(asset.label, {
        label: asset.label,
        note: asset.note.replace(/\.$/, ""),
        files: [asset],
      });
  }
  return [...byLabel.values()];
}

export const PRESS_INK = BRAND_HEX;
export {
  PRESS_BOILERPLATE,
  PRESS_BOILERPLATE_SHORT,
  PRESS_FACTS,
  PRESS_KIT_ZIP,
  PRESS_USAGE_RULES,
  formatKitBytes,
};

/**
 * Copy-to-clipboard with a receipt. A copy is a fire-and-forget action with no system
 * feedback, so the confirm is information, not decoration: both icons stack in one grid
 * cell so the swap causes zero layout shift, and a persistent (never conditionally
 * mounted) live region announces it, because a flipped aria-label alone is unreliable
 * across screen readers. navigator.clipboard is undefined on plain HTTP, hence the guard.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => void (timer.current && clearTimeout(timer.current)),
    [],
  );

  return (
    <>
      <button
        type="button"
        aria-label={copied ? `${label}, copied` : label}
        onClick={() => {
          void navigator.clipboard
            ?.writeText(value)
            .then(() => {
              setCopied(true);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 1600);
            })
            .catch(() => {});
        }}
        className={cn(
          "inline-flex items-center gap-2 rounded-action-sm border border-current/25 px-3 py-1.5",
          "text-xs font-medium transition-[color,border-color] duration-150 ease-[var(--dir-ease)]",
          "hover:border-current/60 focus-visible:ring-2 focus-visible:ring-current/40 focus-visible:outline-none active:scale-[0.97]",
          className,
        )}
      >
        <span className="grid size-3.5 place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
          <Copy
            aria-hidden
            className={cn(
              "size-3.5 transition-[opacity,transform] duration-200 ease-[var(--dir-ease)]",
              copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Check
            aria-hidden
            className={cn(
              "size-3.5 transition-[opacity,transform] duration-200 ease-[var(--dir-ease)]",
              copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </span>
        {copied ? "Copied" : label}
      </button>
      {/* Rendered unconditionally: a live region inserted at the same moment as its
          text usually fails to announce. */}
      <span aria-live="polite" className="sr-only">
        {copied ? `${label}, copied` : ""}
      </span>
    </>
  );
}

/** The primary kit action. Real href, real file: a dead button in a design review is
 *  worth less than a live one, and the zip is committed at public/press/. */
export function DownloadKit({ className }: { className?: string }) {
  return (
    <a
      href={PRESS_KIT_ZIP}
      download
      className={cn(
        "inline-flex items-center gap-2 rounded-action bg-foreground px-5 py-2.5 text-sm font-medium text-background",
        "transition-transform duration-150 ease-[var(--dir-ease)] active:scale-[0.97]",
        "focus-visible:ring-2 focus-visible:ring-current/40 focus-visible:outline-none",
        className,
      )}
    >
      <ArrowDown aria-hidden className="size-4" />
      {PRESS_COPY.kitCta}
      <span className="font-mono text-[11px] opacity-60">
        {PRESS_COPY.kitMeta}
      </span>
    </a>
  );
}

/** The lab-only baseline strip: the identical content both directions render, unstyled.
 *  It makes the comparison legible AS a comparison (and catches any accidental drift). */
export function ContentControlStrip() {
  return (
    <details className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        The shared content both directions render (identical, on purpose)
      </summary>
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-muted-foreground">
        <p>H1: {PRESS_COPY.h1}</p>
        <p>Standfirst: {PRESS_COPY.standfirst}</p>
        <p>
          Kit: {PRESS_KIT.length} files, {formatKitBytes(PRESS_KIT_BYTES)}, at{" "}
          {PRESS_KIT_ZIP}
        </p>
        <p>
          Facts: {PRESS_FACTS.length} rows. Rules: {PRESS_USAGE_RULES.length}.
        </p>
        <p>Ink: {PRESS_INK}</p>
      </div>
    </details>
  );
}

/** A labeled block in a direction, so both share section rhythm without sharing dress. */
export function LabelledBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </section>
  );
}
