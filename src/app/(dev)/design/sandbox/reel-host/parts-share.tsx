"use client";

import {
  Check,
  Copy,
  ExternalLink,
  MonitorPlay,
  Printer,
  QrCode,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { EVENT } from "./fixtures";

/**
 * THE SHARE SHEET, QUOTED (`share/event-share-sheet.tsx`'s own row and
 * classes: the code at the sheet's own width, ONE row of the four verbs a
 * host reaches for, the quiet doors, then "A readable link"). The real
 * `StyledQr` dynamic-imports `qr-code-styling` inside a `useEffect` that
 * touches `window` on construction (`host-app.md`'s own gotcha), so the
 * code here is a plain placeholder square, exactly the weight the hub's own
 * `QrCode` glyph already stands in for a real code elsewhere in this kit.
 *
 * ★ `screen`'s ONE varying thing. This piece exists only for the `share`
 * option: a "Play on a screen" block joins the code and the readable link as
 * a THIRD door in the one sharing surface, never touching the four-verb row
 * itself (the row is truth this board reads, not a question it is asking).
 */
export function ShareSheetWithScreen() {
  return (
    <div className="flex flex-col gap-5 px-1">
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-border bg-muted">
        <QrCode className="size-16 text-muted-foreground" aria-hidden />
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
        className="space-y-2 rounded-lg border border-reel/40 bg-reel/5 p-3"
      >
        <h3 className="flex items-center gap-2 font-heading text-card-title">
          <MonitorPlay className="size-4 text-reel" aria-hidden />
          Play on a screen
        </h3>
        <p className="text-xs text-muted-foreground">
          Open the reel full-bleed on a TV or a laptop by the door, with the
          code in the corner so guests can scan and add their own.
        </p>
        <Button variant="outline" size="sm" tabIndex={-1}>
          Open the screen
        </Button>
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-card-title">A readable link</h3>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <span className="min-w-0 flex-1 truncate">
            partyreel.com/e/{EVENT.name.toLowerCase().replace(/[^a-z]+/g, "-")}
          </span>
          <Check className="size-3.5 shrink-0" aria-hidden />
        </div>
      </section>
    </div>
  );
}
