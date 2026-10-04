"use client";

import { useCallback, type ReactNode } from "react";

import {
  CreditLookContext,
  type CreditLook,
  type ViewerMedia,
} from "@/components/shared/media-lightbox-parts/credit";
import type { GuestListItem } from "@/components/social/guest-list";
import { GuestPeek } from "@/components/social/guest-peek";

/**
 * THE HOST'S LOOK FROM A PHOTOGRAPH'S CREDIT (event-safety `entry=all`: "every road opens the
 * person's look", the viewer's face-led credit and the uploader in Review among them). Mounted by the
 * host's album and the Review room, it lets every credit under it open its sender's look, the same
 * one a name in the Guests room opens, with Block its quiet last line. Block names the photograph
 * (`{ kind: "media" }`): the database decides who sent it, so no person's id or address ever rides a
 * credit to get here.
 *
 * ★ A PROVIDER, SO THE SHARED VIEWER NEVER IMPORTS THE LOOK: the look carries Follow and Block, host
 * and social machinery the guest album and the viewer's own module must not pull in (the credit
 * sits three modules deep under `shared/masonry.tsx`).
 */
export function HostCreditLookProvider({ children }: { children: ReactNode }) {
  const look = useCallback<CreditLook>(
    ({ item, name, unverified, trigger }) => (
      <GuestPeek
        item={lookItem(item, name, unverified)}
        email={item.uploaderEmail ?? null}
        canFollow={false}
        block={{ target: { kind: "media", mediaId: item.id } }}
      >
        {trigger}
      </GuestPeek>
    ),
    [],
  );
  return (
    <CreditLookContext.Provider value={look}>
      {children}
    </CreditLookContext.Provider>
  );
}

/**
 * The look's person, from what the credit already holds: the name, the mark, and the face where the
 * item carries one. The id is the photograph's (a look keys on it and follows nobody from here), and
 * a page is offered only where the item carries its `/u/<slug>` door.
 */
function lookItem(
  item: ViewerMedia,
  name: string,
  unverified: boolean,
): GuestListItem {
  if (unverified) {
    // Her colour is the credit's own (her row's, hashed on the server): the look wears what the credit wears.
    return {
      kind: "unverified",
      id: item.id,
      displayName: name,
      seed: item.uploaderFace?.seed ?? undefined,
    };
  }
  const href = item.uploaderFace?.href ?? null;
  const slug = href?.startsWith("/u/")
    ? decodeURIComponent(href.slice("/u/".length))
    : null;
  return {
    id: item.id,
    displayName: name,
    slug,
    avatarMarker: null,
    avatarUrl: item.uploaderFace?.avatarUrl ?? null,
    seed: item.uploaderFace?.seed ?? undefined,
  };
}
