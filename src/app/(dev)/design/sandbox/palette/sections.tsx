"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Mode } from "@/components/lab";

/**
 * THE SURFACE LADDER, which is the one composition the wipe is judged on.
 *
 * ★ WHAT LEFT THIS FILE IN THE CLARITY ROUND (2026-09-15). `MarketingChapter`,
 * `PanelBand` and `InkLeaf` were three sections built to argue three separate
 * asks (the no-photograph case, the mat, the slab). The mat is folded into a
 * palette now and the slab is on every catalog card's strip, so their asks are
 * gone and a section whose ask is gone is a section nobody reads. The real
 * routes in `live.tsx` show all three in their actual context anyway, which is
 * a better reading than a rebuilt one.
 *
 * ★ Breakpoints do NOT work inside a Stage: the stage is a 1440 or 375 wide box
 * inside a wide viewport, so `sm:` fires at 375. This takes `mode` and branches
 * on it, which is the house pattern (home-hero/gathering.tsx:247).
 */

/* ── The stack: ground, card, panel, input, menu ────────────────────────── */

/**
 * The surface ladder in one frame, which is where today's dark ramp fails: the
 * ground, a card on it, a panel inside the card, an input, and a menu over the
 * lot. The menu is hand-placed rather than a real DropdownMenu ON PURPOSE:
 * radix portals to document.body, which would escape the stage's zoom AND its
 * token overrides. The skin is copied verbatim from dropdown-menu.tsx.
 *
 * ROUND THREE fixed where the menu sits. It used to hang at `-right-24` on
 * desktop and `right-2` on the phone, which covered the panel's own explanation
 * at 1440 and hid three lines of it at 375: the specimen is a menu OVER a card,
 * not a menu over the one sentence that says what the panel is. On desktop it
 * hangs off the card's top-right corner from outside; on the phone, where a
 * 224px menu cannot clear a 335px card at all, it sits over the action row, so
 * the overlap is still a menu over a card and nothing it covers is an
 * explanation. Both positions are checked by measuring which text nodes the
 * menu's box intersects, at both canvases.
 */
export function SurfaceStack({
  mode,
  tone = "dark",
}: {
  mode: Mode;
  /** Which ground the copy addresses. The specimen itself is the same on
   *  either: the paper set crushes five surfaces into 0.037 exactly as the
   *  dark one crushes five into 0.11. */
  tone?: "light" | "dark";
}) {
  const desktop = mode === "desktop";
  return (
    // ★ CENTRED IN THE CANVAS, AND THAT IS THE WHOLE POINT SINCE THE MIGRATION
    // WAVE. Round four split the canvas down the middle and drew this twice,
    // once per token block; the kit's `Compare` in wipe mode lays the two
    // blocks over ONE canvas with the seam on a slider instead, so the join can
    // be dragged onto the exact surface in question. That only works if the
    // specimen is under the seam: left-aligned in a 1440 canvas (which is what
    // this was) the whole composition sits in the half the wipe clips away, and
    // the candidate reads as an empty room. Centred, the seam cuts the card,
    // and a 0.02 step is being judged across four pixels rather than across a
    // gap.
    //
    // ★ AND THE NUMBERS LEFT THE CANVAS WITH IT. The printed lightnesses used
    // to sit on the ground inside each half; under a wipe they would be sliced
    // down the middle and read as garbled. They are the caption under the
    // canvas now, both blocks at once, which is where the kit's own rule wants
    // a label anyway. The one line that stays inside is identical on both
    // blocks, so the seam through it is invisible.
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-center",
        desktop ? "px-20 py-12" : "px-5 py-8",
      )}
    >
      {/* The register the half is standing on is named rather than implied:
          "ground" meant two different things on the two halves of row 02. */}
      <p className="mt-5 mb-4 text-xs text-muted-foreground">
        {tone === "dark"
          ? "Room, card, panel, input, menu. Five surfaces, one frame."
          : "Paper, card, mat, input, menu. Five surfaces, one frame."}
      </p>
      <div className={cn("relative", desktop && "w-xl")}>
        <Card>
          <CardHeader>
            <CardTitle>Event settings</CardTitle>
            <CardDescription>
              Who can upload, and what happens to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Guests need an email</p>
              <p className="text-muted-foreground">
                The set-apart ground, an alpha of a token that also does hover.
              </p>
            </div>
            <div className="flex h-9 items-center rounded-lg border border-input px-3 text-sm text-muted-foreground">
              partyreel.com/e/your-event
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary">
                Copy link
              </Button>
              <Button size="sm" variant="outline">
                Download the code
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-between text-xs text-muted-foreground">
            <span>Last change 4 minutes ago</span>
            <span className="tabular-nums">312 items</span>
          </CardFooter>
        </Card>

        {/* Anchored to the card's corner, the way the real overflow menu opens:
            the whole question is whether the menu, the card and the panel
            inside it are three surfaces or one. It overlaps the card's EDGE and
            never its copy (see the note above). */}
        <div
          className={cn(
            "absolute w-56 rounded-float bg-popover p-1 text-popover-foreground shadow-float ring-1 ring-foreground/10",
            // ★ Measured, not guessed: at 375 the card is 335 wide and this
            // menu is 224, so anything anchored to the TOP corner lands on the
            // card's title, its description and the panel's heading, which is
            // exactly the copy that says what the specimen is. On the phone it
            // sits over the action row instead, where the overlap is still a
            // menu over a card but nothing it covers is an explanation.
            desktop ? "-top-2 -right-16" : "-right-2 bottom-6",
          )}
        >
          {["Share the album", "Download everything", "Close uploads"].map(
            (item, i) => (
              <div
                key={item}
                className={cn(
                  "relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm",
                  i === 1 && "bg-accent text-accent-foreground",
                )}
              >
                {i === 1 ? <Check className="size-4" /> : null}
                {item}
              </div>
            ),
          )}
          <div className="my-1 h-px bg-border" />
          <div className="relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-destructive">
            Delete the event
          </div>
        </div>
      </div>
    </div>
  );
}
