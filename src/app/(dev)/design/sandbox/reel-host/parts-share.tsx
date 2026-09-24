"use client";

import {
  Check,
  Copy,
  ExternalLink,
  MonitorPlay,
  Printer,
  Share2,
} from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";

import { JOIN_LABEL, JOIN_URL, QR_STYLE } from "./fixtures";

/**
 * THE SHARE SHEET, QUOTED (`share/event-share-sheet.tsx`'s own row and classes:
 * the code at the sheet's own width, ONE row of the four verbs a host reaches
 * for, then "A readable link"), for the `open=share` option alone. The code is
 * the shipped renderer on its white plate, the same one the hub's header uses.
 *
 * ★ `open`'s ONE VARYING THING. A "Play on a screen" block joins the code and
 * the readable link as a third door in the one sharing surface, never touching
 * the four-verb row itself (the row is truth this board reads, not a question
 * it is asking).
 */
export function ShareSheetWithScreen() {
  return (
    <div className="flex flex-col gap-5 px-1">
      <div
        className="w-full rounded-xl bg-white p-4"
        style={{ lineHeight: 0 }}
      >
        <StyledQr
          value={JOIN_URL}
          size={280}
          style={QR_STYLE}
          className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="flex-1" tabIndex={-1}>
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

      <section
        data-rh-screen-block
        className="space-y-2 rounded-lg border border-border p-3"
      >
        <h3 className="flex items-center gap-2 font-heading text-card-title">
          <MonitorPlay className="size-4 text-muted-foreground" aria-hidden />
          Play on a screen
        </h3>
        <p className="text-xs text-muted-foreground">
          The reel full screen on a TV or a laptop by the door, with the code
          in its corner so guests can scan and add their own.
        </p>
        <Button variant="outline" size="sm" tabIndex={-1}>
          Open on this computer
        </Button>
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-card-title">A readable link</h3>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <span className="min-w-0 flex-1 truncate">{JOIN_LABEL}</span>
          <Check className="size-3.5 shrink-0" aria-hidden />
        </div>
      </section>
    </div>
  );
}
