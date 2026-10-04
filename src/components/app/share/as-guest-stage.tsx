"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useRef, useSyncExternalStore } from "react";
import { ChevronLeft, ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingClock } from "@/components/ui/floating-layer";
import { usePortalContainer } from "@/components/ui/portal-container";
import { trackAttrs } from "@/lib/analytics/events";
import { asGuestHref } from "@/lib/event/sections";
import { cn } from "@/lib/utils";

/** A phone's viewport, the one a guest's album is laid out in: 390 by 844, as the board drew it. */
const PHONE = { w: 390, h: 844 } as const;
/** The bezel round the screen (10px a side), so the phone is this big before it is fitted. */
const BEZEL = 10;
const FRAME = { w: PHONE.w + BEZEL * 2, h: PHONE.h + BEZEL * 2 } as const;
/** What stands round the phone at a desk: the way back above it, the caption, and the new tab's link under it. */
const AROUND = { y: 176, x: 48 } as const;

function subscribeSize(change: () => void) {
  window.addEventListener("resize", change);
  return () => window.removeEventListener("resize", change);
}

/**
 * THE PHONE, FITTED TO THE WINDOW AT A DESK: never larger than a phone, and as large as the window lets it stand with
 * its caption and its link, so a 900px laptop sees the whole of it (the board's own frame scaled it to fit). Read off
 * the window, never the server (the stage opens after hydration, as every layer does).
 */
function usePhoneScale(): number {
  return useSyncExternalStore(
    subscribeSize,
    () =>
      Math.min(
        1,
        Math.max(0.4, (window.innerHeight - AROUND.y) / FRAME.h),
        Math.max(0.4, (window.innerWidth - AROUND.x) / FRAME.w),
      ),
    () => 1,
  );
}

/**
 * SEE IT AS A GUEST, OVER THE HUB (Will, event-header r2 `rooms=over`: "As a guest screen is a really cool idea"):
 * at a desk her album stands in a phone over the dimmed hub, a real phone's viewport (the guest's page laid out as
 * her guests' phones lay it out, which a narrow box in the hub's own page could never be), its way back over the
 * hub; in a hand it is the whole screen, under a bar whose arrow names the event, as every room is in a hand. Either
 * way the hub stays mounted and scrolled under it, and Back, Escape, the way back or a press on the dimmed hub closes
 * it onto the hub as she left it.
 *
 * ★ THE PHONE HOLDS THE GUEST VIEW'S OWN PAGE (`/dashboard/<id>/as-guest`, framed): a true guest's read in the guest
 * page's own pieces, inert to her presses (`as-guest-view.tsx`). It loads as the stage opens, so it is always her
 * album as it stands now, and unloads as it closes.
 *
 * ★ ITS OWN SHAPE, as the code card is (`code-card.tsx`): no popup kind is a phone over the page, so it is Radix's
 * Dialog drawn here, on the floating layer's clocks, holding the keyboard (its way back, its new tab, the phone) and
 * the page's scroll while it stands.
 */
export function AsGuestStage({
  open,
  onOpenChange,
  eventId,
  eventName,
  doorLine,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  /** Who meets this album as it stands (the door's own words), under the caption at a desk. */
  doorLine: string;
}) {
  const scale = usePhoneScale();
  // Focus goes back where it was when the stage opened (a card, the band's pill, a keyboard's door).
  const opener = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={usePortalContainer()}>
        <DialogPrimitive.Overlay
          data-as-guest-scrim=""
          className={cn(
            "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm max-sm:hidden",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            floatingClock.standard,
          )}
        />
        <DialogPrimitive.Content
          data-room-panel="as-guest"
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            const active = document.activeElement;
            opener.current =
              active instanceof HTMLElement && active !== document.body
                ? active
                : null;
          }}
          onCloseAutoFocus={(event) => {
            const back = opener.current;
            opener.current = null;
            if (back?.isConnected) {
              event.preventDefault();
              back.focus({ preventScroll: true });
            }
          }}
          // At a desk the stage is the whole window over the dimmed hub: a press on that dimmed hub (the stage itself,
          // never the phone or a control on it) closes it, as a scrim's would.
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
          className={cn(
            "fixed inset-0 z-50 flex flex-col outline-none",
            // A hand: the whole screen, risen from the foot like any screen a phone opens over the moment.
            "max-sm:bg-background max-sm:ease-drawer max-sm:data-open:slide-in-from-bottom-10 max-sm:data-closed:slide-out-to-bottom-10",
            // A desk: the phone over the dimmed hub, rising a little as it comes.
            "sm:items-center sm:justify-center sm:gap-4 sm:ease-emphasis sm:data-open:zoom-in-95 sm:data-closed:zoom-out-95",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            floatingClock.edge,
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {`${eventName}, as your guests see it`}
          </DialogPrimitive.Title>

          {/* A hand's bar: the arrow names where it returns, as every room's screen does. */}
          <div className="grid h-13 shrink-0 grid-cols-[minmax(auto,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b px-2 sm:hidden">
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="sm"
                data-as-guest-back=""
                className="max-w-[40vw] gap-0.5 justify-self-start px-1.5 text-muted-foreground"
              >
                <ChevronLeft className="size-5" />
                <span className="truncate">{eventName}</span>
              </Button>
            </DialogPrimitive.Close>
            <span className="max-w-[55vw] truncate text-center font-heading text-base">
              As a guest
            </span>
            <span aria-hidden />
          </div>

          {/* A desk's way back, over the dimmed hub it returns to. */}
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              data-as-guest-back=""
              className="absolute top-5 right-5 flex h-10 items-center gap-1.5 rounded-full bg-white/10 pr-4 pl-3 text-sm font-medium text-white transition-colors outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.97] max-sm:hidden"
            >
              <X className="size-4" aria-hidden />
              Back to your hub
            </button>
          </DialogPrimitive.Close>

          <div className="max-sm:hidden sm:space-y-0.5 sm:text-center">
            <p className="text-sm font-medium text-white">
              What your guests see
            </p>
            <p className="text-xs text-white/60">{doorLine}</p>
          </div>

          {/* The phone: at a desk a bezel round a phone's viewport, fitted to the window (its box reserves the fitted
              size, the phone inside it scaled from its corner); in a hand, the rest of the screen under the bar. */}
          <div
            data-as-guest-phone=""
            className="relative min-h-0 flex-1 max-sm:w-full sm:h-(--phone-h) sm:w-(--phone-w) sm:flex-none"
            style={{
              ["--phone-w" as string]: `${FRAME.w * scale}px`,
              ["--phone-h" as string]: `${FRAME.h * scale}px`,
              ["--phone-scale" as string]: String(scale),
            }}
          >
            <div className="max-sm:size-full sm:absolute sm:top-0 sm:left-0 sm:origin-top-left sm:scale-(--phone-scale) sm:rounded-[46px] sm:bg-black sm:p-2.5 sm:shadow-2xl sm:ring-1 sm:ring-white/15">
              <div className="overflow-hidden max-sm:size-full sm:h-[844px] sm:w-[390px] sm:rounded-[36px] sm:bg-background">
                {/* Inside the dialog's content, so it loads as the stage opens and unloads once its exit is
                    over (Radix keeps the content through it), never a blank phone fading out. */}
                <iframe
                  src={asGuestHref(eventId, true)}
                  title={`${eventName}, as your guests see it`}
                  data-as-guest-frame=""
                  className="block size-full border-0"
                />
              </div>
            </div>
          </div>

          <a
            href={asGuestHref(eventId, false)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 max-sm:hidden"
            {...trackAttrs("cta_click", {
              cta: "as-guest-tab",
              location: "as-guest",
            })}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open it in a new tab
          </a>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
