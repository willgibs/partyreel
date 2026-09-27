"use client";

import { CodeCard } from "./code-card";
import { useEventShare } from "./event-share-provider";

/**
 * THE EVENT PAGE'S CODE CARD: the header's code (and the sticky row's Invite)
 * open it, bigger and scannable, with the link to copy or share and a door to
 * the whole kit (Will, `share` note: "clicking it opens a view transition
 * animation-style mini-modal like you have in 1 to get a bigger scannable code,
 * view/copy the link, or visit the share page for everything").
 *
 * ★ IT IS THE CARD EVERY SHARE OPENS NOW (`popups` r1, `share=card`), so its
 * drawing lives in `code-card.tsx` and this is only the event page's wiring:
 * the provider's open state, the kit behind Everything, and the morph, whose
 * name this card's code carries while it is open (`morphNameFor("modal")`),
 * exactly one element at a time.
 *
 * ★ IT IS A LOOK, NOT A ROOM, so it takes no URL of its own (the provider
 * keeps it out of history; `event-share.test.tsx` holds that).
 */
export function EventCodeModal({
  eventName,
  joinUrl,
  prettyUrl,
  qrStyle,
}: {
  eventName: string;
  /** The permanent qr_token URL: what the code encodes and what gets copied. */
  joinUrl: string;
  prettyUrl: string;
  qrStyle: string;
}) {
  const { codeOpen, closeCode, openSheet, morphNameFor } = useEventShare();

  return (
    <CodeCard
      open={codeOpen}
      onOpenChange={(next) => {
        if (!next) closeCode();
      }}
      who="host"
      eventName={eventName}
      joinUrl={joinUrl}
      prettyUrl={prettyUrl}
      qrStyle={qrStyle}
      viewTransition
      morphName={morphNameFor("modal")}
      onEverything={() => {
        closeCode();
        openSheet("share");
      }}
      location="code-modal"
    />
  );
}
