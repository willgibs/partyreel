"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SUPPORT_EMAIL } from "@/lib/constants/site";

/**
 * The desk's contact facts (the V2 definition rows, replacing the old icon-chip
 * cards): the plain address with the copy micro-delight, and the reply
 * expectation. Real text registers only; no mono, no icon chips.
 *
 * The address is a FACT beside the form, never a door of its own (contact-page
 * r1 `reach=routed`), and it wears its weight: contact-page r1 `beside` asked
 * for "the email link white/heavier", so it reads full ink at semibold on the
 * reading step, where it was a medium 14px that sat below everything else in
 * the rail.
 */
export function ContactFacts() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast(SUPPORT_EMAIL, { description: "Copy the address from here." });
    }
  }

  return (
    <dl className="flex flex-col text-sm">
      <div className="flex items-baseline justify-between gap-4 border-t py-3.5">
        <dt className="text-muted-foreground">Plain email</dt>
        <dd className="flex items-center gap-1.5">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-reading font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
          >
            {SUPPORT_EMAIL}
          </a>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy email address"}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.9]"
          >
            {copied ? (
              <Check aria-hidden className="size-3.5 text-success" />
            ) : (
              <Copy aria-hidden className="size-3.5" />
            )}
          </button>
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-y py-3.5">
        <dt className="text-muted-foreground">Reply time</dt>
        <dd className="text-pretty">Usually within a day</dd>
      </div>
    </dl>
  );
}
