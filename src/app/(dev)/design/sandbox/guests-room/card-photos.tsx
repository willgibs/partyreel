"use client";

import type { ReactElement } from "react";

import { BlockLookAction } from "@/components/app/event-blocks/block-look-action";

import type { Guest } from "./fixtures";
import { kindLine, LookShell, PageKey, QuietFollow, Strip } from "./look";
import { Face } from "./people";

/**
 * WHAT THEY ADDED, FIRST (the `card` ask's `photos`): the look Will picked at
 * popups r1 (`peek=card`), built whole. Their count and four of their
 * photographs in this album lead it, under who they are (the face, the name,
 * the handle or the mark; for the host, the confirmed address); their page and
 * Follow a quiet pair where there is a page; Block the quiet last line.
 * Opened from the people in alone, as today: the door's and Blocked's names
 * stay words.
 *
 * ★ THE STRIP IS A READ THE LIST DOES NOT CARRY (ROADMAP's look strip): their
 * approved uploads by account or guest row, presigned and gated like the
 * album; the stills here stand in for theirs.
 */
export function PhotosCard({
  guest,
  children,
}: {
  guest: Guest;
  children: ReactElement;
}) {
  return (
    <LookShell
      face={<Face name={guest.name} seed={guest.seed} className="size-12" />}
      name={guest.name}
      line={kindLine(guest)}
      body={
        <>
          {guest.email ? (
            <p className="-mt-1 truncate text-caption text-muted-foreground">
              {guest.email}
            </p>
          ) : null}
          <Strip guest={guest} />
          {guest.slug ? (
            <div className="grid grid-cols-2 gap-2">
              <QuietFollow className="w-full" />
              <PageKey className="w-full" />
            </div>
          ) : null}
          <BlockLookAction onPress={() => {}} />
        </>
      }
    >
      {children}
    </LookShell>
  );
}
