"use client";

import type { CSSProperties } from "react";

import { RelationToggle } from "@/components/social/relation-toggle";

/**
 * THE WELL ON A PAGE SHE BLOCKED (`account-moments` r1, `block=line`, Will 2026-10-06). Where Follow
 * stood, a quiet well says it to her alone: she blocked them, they are not told, and Unblock sits
 * beside it, on every visit. A block is a standing state, not an event, so the page says it where
 * the button vanished from, and the way back is in sight (the menu's row stays the second way).
 *
 * ★ HERS ALONE, NEVER A TELL. The page draws this only for `hasBlocked(viewer, them)`, her own block,
 * and never when only they blocked her: that stays what it always was, a Follow that is not there.
 * `page.tsx` is where that is decided, and it is the same read that decides the menu's row.
 *
 * ★ UNBLOCK TAKES THE WELL AWAY, AND FOCUS WITH IT. The Server Function's re-render removes this whole
 * element (and brings Follow back where it stood), so a press by keyboard would leave focus on a node
 * that is gone and put her back at the top of the document. The press hands focus to the page's own
 * actions row first (`data-profile-actions`), the nearest thing that stays.
 */
export function BlockedWell({
  profileId,
  name,
}: {
  profileId: string;
  name: string;
}) {
  return (
    <div
      data-arrive
      style={{ "--arrive-i": 1 } as CSSProperties}
      className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3"
    >
      <p className="min-w-0 flex-1 basis-56 text-sm text-pretty text-muted-foreground">
        You blocked {name}. Neither of you can follow the other, and they
        aren&rsquo;t told.
      </p>
      {/* The page's status region holds this well, so what it says is announced the moment it arrives; the
          button's own flip (Unblock turns to Block for the beat before the well goes) is not part of that. */}
      <div aria-live="off" className="shrink-0">
        <RelationToggle
          relation="block"
          profileId={profileId}
          on
          person={name}
          srLabel={name}
          size="sm"
          onSettle={handBackFocus}
        />
      </div>
    </div>
  );
}

function handBackFocus() {
  document.querySelector<HTMLElement>("[data-profile-actions] button")?.focus();
}
