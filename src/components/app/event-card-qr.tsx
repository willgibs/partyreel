import Link from "next/link";
import { QrCode } from "lucide-react";

import { trackAttrs } from "@/lib/analytics/events";

/**
 * The dashboard event card's top-left QR chip (Phase 5 S2a): a white tile that
 * reads as "share / QR" and opens this event's share sheet. Rendered as the
 * card's `qrSlot` - a SIBLING of the card Link, outside it - so tapping it goes
 * to sharing and NEVER to the event. A crisp QR glyph, not a 30px live QR
 * (which would be an illegible gray square plus N canvas renders); the real
 * scannable styled QR renders full-size inside the sheet.
 *
 * ★ IT IS A LINK NOW, AND THE SECOND SHARE SURFACE IS GONE (`hand=same`, Will
 * 2026-09-21). This chip used to open `EventShareDialog`, a separate dialog
 * drawing the same code, the same copy row and a quieter version of the same
 * designer as the share SHEET the event page ships — two surfaces answering one
 * question, so a fix to either only ever half-landed. The chip now navigates to
 * the event with `?room=share`, which the hub resolves server-side into the
 * sheet already open (`resolveEventSheet`). One sharing surface, reached from
 * both places, which is what `share=room` asked for in the first place.
 *
 * A plain <Link>, so this is a server component now: no dialog state to hold,
 * no `siteUrl` / `qrToken` / `qrStyle` to thread here to draw a code that is
 * drawn properly one screen along, and middle-click and open-in-new-tab do the
 * honest thing.
 */
export function EventCardQr({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
  /** ★ VESTIGIAL, AND ACCEPTED ON PURPOSE. The dialog needed these to draw a
   *  code; the link does not. They stay in the type because the Library's
   *  gallery demo and the dashboard's events section both still pass them, and
   *  a wiring lane never breaks the props of a module the lab imports. The next
   *  lane inside `dashboard/events-section.tsx` drops the three arguments and
   *  then these three lines go with them. */
  qrToken?: string;
  qrStyle?: string;
  siteUrl?: string;
}) {
  return (
    <Link
      href={`/dashboard/${eventId}?room=share`}
      aria-label={`Share ${eventName}`}
      {...trackAttrs("cta_click", {
        cta: "share-sheet",
        location: "dashboard-card",
      })}
      className="flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1.5 text-black shadow-lift outline-none transition-transform duration-150 ease-emphasis active:scale-95 focus-visible:ring-2 focus-visible:ring-white motion-reduce:active:scale-100"
    >
      <QrCode className="size-5" aria-hidden />
    </Link>
  );
}
