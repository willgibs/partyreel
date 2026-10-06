"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";

import { CodeCard, readableLink } from "@/components/app/share/code-card";
import { trackAttrs } from "@/lib/analytics/events";
import { eventUrl } from "@/lib/events/share-urls";

const CHIP =
  "flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1.5 text-black shadow-lift outline-none transition-transform duration-150 ease-emphasis active:scale-95 focus-halo motion-reduce:active:scale-100";

/**
 * The dashboard event card's top-left QR chip (Phase 5 S2a): a white tile that
 * reads as "invite / QR". Rendered as the card's `qrSlot` - a SIBLING of the
 * card Link, outside it - so tapping it goes to sharing and NEVER to the event.
 * A crisp QR glyph, not a 30px live QR (which would be an illegible gray square
 * plus N canvas renders); the real scannable code opens full-size in the card.
 *
 * ★ IT OPENS THE CODE CARD, RIGHT HERE (`popups` r1, `share=card`, Will
 * 2026-09-27: every share's first surface is his code card, opened by an
 * Invite). A host at the door with the dashboard open holds up the code without
 * leaving it; the whole kit is one tap behind, on Everything, which goes to the
 * event with `?room=share` exactly as this chip used to. One card for every
 * share, one kit behind it: the second share surface the chip once opened
 * (`hand=same`, 2026-09-21) stays retired.
 *
 * ★ IT NEEDS THE TOKEN, THE STYLE AND THE SITE TO DRAW A CODE, which the
 * dashboard's events section passes (and the Library's specimen). A caller that
 * cannot is handed the old door: a link to the kit.
 */
export function EventCardQr({
  eventId,
  eventName,
  qrToken,
  qrStyle,
  siteUrl,
}: {
  eventId: string;
  eventName: string;
  qrToken?: string;
  qrStyle?: string;
  siteUrl?: string;
}) {
  const router = useRouter();
  const kit = `/dashboard/${eventId}?room=share`;
  const label = `Invite guests to ${eventName}`;

  if (!qrToken || !siteUrl) {
    return (
      <Link
        href={kit}
        aria-label={label}
        {...trackAttrs("cta_click", {
          cta: "share-sheet",
          location: "dashboard-card",
        })}
        className={CHIP}
      >
        <QrCode className="size-5" aria-hidden />
      </Link>
    );
  }

  const joinUrl = eventUrl(siteUrl, qrToken);
  return (
    <CodeCard
      who="host"
      eventName={eventName}
      joinUrl={joinUrl}
      prettyUrl={readableLink(joinUrl)}
      qrStyle={qrStyle ?? "classic"}
      location="dashboard-card"
      onEverything={() => router.push(kit)}
      trigger={
        <button
          type="button"
          aria-label={label}
          {...trackAttrs("cta_click", {
            cta: "event-code",
            location: "dashboard-card",
          })}
          className={CHIP}
        >
          <QrCode className="size-5" aria-hidden />
        </button>
      }
    />
  );
}
