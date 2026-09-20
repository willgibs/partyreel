"use client";

import { ImageUp, QrCode } from "lucide-react";

import { GuestMasonry } from "@/components/guest/guest-masonry";
import { FloatingAddButton } from "@/components/shared/floating-add-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALBUM } from "./fixtures";
import {
  ControlsRow,
  EventBlock,
  GUTTER,
  READABLE,
  ReportFoot,
  ScrollPage,
  TopBar,
  type ScreenId,
} from "./page-parts";

/**
 * THE CHROME, ROUND TWO: WHERE ADD AND INVITE LIVE.
 *
 * His verdict on round one's `chrome=dock`, verbatim: "the best option of
 * these three, but having the actions tucked in the bottom right is one of
 * the last places a guest's eye will reach... having the actions above felt
 * more actionable when landing... also appreciate that the actions docked are
 * always accessible, no matter how deep into the album you get. This likely
 * warrants a second round." So the criterion is his: found on landing AND
 * reachable at every depth, and every option below is judged on BOTH at once
 * via `position`, never landing alone.
 *
 * ★ THE GROUND IS TODAY'S SHIPPED PAGE, NOT ROUND ONE'S RECOMMENDATION.
 * `event-experience.tsx` moved Save out of this row already (`account=after`):
 * a full-width Add over a full-width Invite, then a floating Add-only pill
 * once the row scrolls out of view (`floating-add-button.tsx`, real component,
 * no portal). `column` is exactly that page; the other three are genuine
 * alternatives to it, not round one's stale three-action version.
 *
 * ★ `position` IS THE MEASURING INSTRUMENT, NOT A KNOB FOR ITS OWN SAKE. A
 * static tile can show "found on landing" or it can show "reachable deep",
 * never both at once, so this is the one ask on this board with its own real
 * scroll container (`ScrollPage`, the `demo-event` precedent): `landing` is
 * scrollTop 0, `deep` is 900px down, past the row and well into the album at
 * every screen this board judges, and the caption reads which of Add and
 * Invite are actually inside the frame's own viewport at that position.
 *
 * ★ THE TILE-SIZE CONTROL'S GUEST MOUNT RIDES EVERY OPTION (the brief's own
 * line), because `app-vocabulary`'s ruled `cluster` shape sits in the same
 * row as Download all, immediately above the album — real chrome this board
 * cannot pretend is not there once the actions above it move.
 */

export type ChromeShape = "column" | "dock" | "both" | "header";

export const chromeOf = (v: string | undefined): ChromeShape =>
  v === "dock" ? "dock" : v === "both" ? "both" : v === "header" ? "header" : "column";

export type PositionId = "landing" | "deep";
export const positionOf = (v: string | undefined): PositionId =>
  v === "deep" ? "deep" : "landing";

/* ── the two actions ─────────────────────────────────────────────────────── */

function AddButton({ className }: { className?: string }) {
  return (
    <Button type="button" size="lg" className={className} data-gs-add="">
      <ImageUp /> Add photos
    </Button>
  );
}

function InviteButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("h-9", className)}
      data-gs-invite=""
    >
      <QrCode /> Invite
    </Button>
  );
}

/** The dock: one bar fixed to the FRAME's own foot, holding whichever of the
 *  two actions this shape gives it. */
function Dock({
  screen,
  actions,
}: {
  screen: ScreenId;
  actions: readonly ("invite" | "add")[];
}) {
  return (
    <div
      data-gs-dock
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 px-5 py-3 backdrop-blur-sm"
    >
      <div
        className={cn(
          "flex items-center gap-2",
          screen === "1440" && "justify-end",
        )}
      >
        {actions.includes("invite") && (
          <InviteButton className={screen === "375" ? "flex-1" : undefined} />
        )}
        {actions.includes("add") && (
          <AddButton
            className={cn("h-9", screen === "375" && "flex-[2]")}
          />
        )}
      </div>
    </div>
  );
}

/* ── the whole page ──────────────────────────────────────────────────────── */

/**
 * `900px` down: past the event block and the action row at both screens this
 * board judges (round one measured the shipped column's own row leaving the
 * screen well under that at a phone, and the album runs far taller than one
 * screen at either width), so `deep` genuinely stands "no matter how deep
 * into the album you get" without scrolling past the album's own end.
 */
const DEEP_SCROLL = 900;

export function ChromePage({
  shape,
  screen,
  position,
}: {
  shape: ChromeShape;
  screen: ScreenId;
  position: PositionId;
}) {
  const wide = screen === "1440";
  const scrollTo = position === "deep" ? DEEP_SCROLL : 0;

  const showRow =
    shape === "column" || (shape === "both" && position === "landing");
  const showPill = shape === "column" && position === "deep";

  const dockActions: readonly ("invite" | "add")[] =
    shape === "dock"
      ? ["invite", "add"]
      : shape === "both" && position === "deep"
        ? ["invite", "add"]
        : shape === "header"
          ? ["invite"]
          : [];

  return (
    <ScrollPage scrollTo={scrollTo}>
      <TopBar
        sticky={shape === "header"}
        right={shape === "header" ? <AddButton className="h-9" /> : undefined}
      />
      <div
        className={cn(
          "py-8",
          wide ? "px-5" : GUTTER,
          dockActions.length > 0 && "pb-24",
        )}
      >
        <div className={wide ? READABLE : undefined}>
          <EventBlock count={ALBUM.length} />
          {showRow && (
            <div data-gs-actions className="mt-4 flex flex-col gap-2">
              <AddButton className="w-full" />
              <InviteButton className="w-full" />
            </div>
          )}
        </div>
        <div className="mt-7">
          <ControlsRow albumKey="lab" />
          <GuestMasonry items={ALBUM} />
        </div>
        <ReportFoot />
      </div>
      {dockActions.length > 0 && <Dock screen={screen} actions={dockActions} />}
      {showPill && (
        <FloatingAddButton show uploadingCount={0} onClick={() => {}} />
      )}
    </ScrollPage>
  );
}
