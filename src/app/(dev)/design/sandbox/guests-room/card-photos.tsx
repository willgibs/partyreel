"use client";

import type { ReactElement } from "react";

import { BlockLookAction } from "@/components/app/event-blocks/block-look-action";

import { CardShell, guestIdentity, Pair, Strip } from "./card-parts";
import type { Guest } from "./fixtures";

/**
 * WHO THEY ARE, AND WHAT THEY ADDED (the `card` ask's `photos`): the look Will
 * picked at popups r1 (`peek=card`, its strip drawn in it), built whole. Who
 * they are, as one block beside their face; then their photographs in this
 * album, leading the body as a contact strip under its count and See all; then
 * Follow and their page, a quiet pair, where there is a page; Block the quiet
 * last line (production's `BlockLookAction`). The card is a look: it opens
 * from the people in alone, as today's does, and a name at the door or in
 * Blocked stays words, its act on its row.
 *
 * ★ WHO FIRST IN BOTH SHAPES, THE PHOTOGRAPHS FIRST IN THE BODY: the sheet's
 * head is the person (it names the sheet for a screen reader and sits beside
 * its close, as every sheet's head does), the strip leads what is under it,
 * where a thumb reaches it, and the card a host learns at her desk is the
 * card in her hand. Above the name in a hand, the strip would stand where the
 * thumb is furthest and put the close on a photograph.
 *
 * ★ ONE CARD, BOTH SIDES OF THE ALBUM: `host` draws her lines (the address,
 * Block); a guest's album opens the same card without them.
 */
export function PhotosCard({
  guest,
  host = true,
  children,
}: {
  guest: Guest;
  /** The host's lines (the address, Block): her room passes them, a guest's album does not. */
  host?: boolean;
  /** The name that opens it: one button. */
  children: ReactElement;
}) {
  return (
    <CardShell
      who={guestIdentity(guest, host)}
      body={(shape) => (
        <div className="flex flex-col gap-4">
          <Strip guest={guest} />
          {guest.slug ? <Pair shape={shape} /> : null}
          {host ? (
            <BlockLookAction onPress={() => {}} className="-mt-1" />
          ) : null}
        </div>
      )}
    >
      {children}
    </CardShell>
  );
}
