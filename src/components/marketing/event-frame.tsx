import {
  AlbumFrame,
  PhoneFrame,
  QrFrame,
  ReelFrame,
} from "@/components/marketing/frames";
import type { EventFrame } from "@/lib/constants/events-layout";

// Resolves an event type's presentation frame ([events-layout.ts](events-layout.ts)) to a
// rendered element, sized for its context — so the /events/[slug] hero and the /events hub
// card stay in lockstep (one frame→component mapping, not two). The wide frames (album /
// reel) fill their column; the narrow ones (phone / qr) self-clamp, so the hero just needs
// top spacing while the hub "preview" shrinks them to sit in a uniform card stage.
//
// NOTE: the QR path renders the DECORATIVE QrFrame and must NEVER pass `liveQrUrl` — that
// swaps in the real scannable `LiveQr` client component, which belongs only on the R3 demo
// CTA, not a marketing landing hero.
export function eventFrame(
  frame: EventFrame,
  variant: "hero" | "preview",
  slug?: string,
) {
  const hero = variant === "hero";
  switch (frame) {
    case "album":
      return (
        <AlbumFrame
          className={hero ? "mt-12 w-full max-w-3xl" : "w-full"}
          label={slug ? `partyreel.com/a/${slug}` : undefined}
        />
      );
    case "reel":
      return (
        <ReelFrame className={hero ? "mt-12 w-full max-w-3xl" : "w-full"} />
      );
    case "phone":
      // Intrinsically tall, and its mock text re-wraps (taller) when too narrow, so
      // 150px is the sweet spot to sit in the hub's fixed-height stage (h-64).
      return <PhoneFrame className={hero ? "mt-12" : "max-w-[150px]"} />;
    case "qr":
      // Decorative only — no `liveQrUrl` (see note above). The hub preview drops the
      // redundant "Scan to join" caption (the card already labels the type).
      return (
        <QrFrame
          className={hero ? "mt-12" : "max-w-[208px]"}
          caption={hero ? undefined : ""}
        />
      );
  }
}
