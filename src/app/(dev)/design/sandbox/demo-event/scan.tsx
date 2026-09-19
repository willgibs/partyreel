"use client";

import { Laptop, Smartphone } from "lucide-react";

/**
 * THE OTHER WAY IN: A CODE SCANNED OFF A LAPTOP SCREEN.
 *
 * Two of the four doors are real, scannable matrices at scannable sizes (the
 * hero's plate at 128px, the footer's at 128px, both `FooterQr`), and the
 * footer's copy asks for exactly this: "Scan the code for a real event album
 * on your phone, exactly the way a guest arrives." So a share of the demo's
 * visitors end the visit holding two screens, and today neither one knows the
 * other exists: the phone opens the same page the laptop is showing, and the
 * laptop carries on.
 *
 * ★ WHAT `pair` WOULD COST, SAID HONESTLY. Nothing here is persisted (the
 * demo's whole contract), so a photograph that crosses from the phone to the
 * laptop cannot go through the media table: it is a Supabase Realtime
 * broadcast on a channel keyed by the code that was scanned, carrying an
 * object URL's bytes or a short-lived upload, and both screens forget it when
 * they close. One channel, no rows, no R2 objects, and the demo event stays
 * pristine, which is the invariant that matters.
 */

/** The `scanned` line: the phone names what the visitor just did. */
export function ScannedLine() {
  return (
    <div
      data-de-scan
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
    >
      <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-[15px] text-pretty">
        You just did what your guests will do.
        <span className="text-muted-foreground">
          {" "}
          Everything they scan lands here, in one album.
        </span>
      </p>
    </div>
  );
}

/** The `pair` line on the PHONE: the photograph went somewhere visible. */
export function PairedPhoneLine() {
  return (
    <div
      data-de-scan
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
    >
      <Laptop className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-[15px] text-pretty">
        It&rsquo;s on your laptop already.
        <span className="text-muted-foreground">
          {" "}
          That is what your guests do all night, from their own phones.
        </span>
      </p>
    </div>
  );
}

/** The `pair` line on the LAPTOP: where the photograph at the top came from. */
export function PairedLaptopLine() {
  return (
    <div
      data-de-scan
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
    >
      <Smartphone className="size-4 shrink-0 text-muted-foreground" />
      <p className="text-[15px]">
        That one just came from your phone.
        <span className="text-muted-foreground">
          {" "}
          Your guests&rsquo; photos arrive the same way.
        </span>
      </p>
    </div>
  );
}
