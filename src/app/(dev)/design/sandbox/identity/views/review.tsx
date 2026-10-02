"use client";

import { useEffect } from "react";

import { ReviewRoom } from "@/components/app/event-feed/review-room";
import type { ReviewWrites } from "@/components/app/event-feed/use-review-triage";
import { SetCrumbs } from "@/components/shared/crumbs";

import { EVENT, NAME, QUEUE } from "../fixtures";

import { HostFrame } from "./settings";

/**
 * REVIEW: production's room, whole and inert, holding twelve of the wedding's
 * uploads: its head with the queue's count, its actions, its note and the
 * triage grid at the photograph's 2px.
 *
 * ★ THE ROOM WITHOUT ITS LIVE ALBUM (the Library's own specimen does the
 * same): no seed, so nothing polls, and its writes answer after a round trip
 * and change nothing, so a press here never approves anyone's upload.
 *
 * ★ MID-TRIAGE: once the room has settled, Select is pressed and three
 * uploads chosen, the real way, so the frame holds the room's bulk bar and
 * its chosen tiles (more of the atoms than a room at rest), then the focus
 * is let go, as a tap leaves it.
 */
const answered = () =>
  new Promise<{ ok: true }>((resolve) =>
    setTimeout(() => resolve({ ok: true }), 320),
  );
const INERT: ReviewWrites = {
  approve: answered,
  reject: answered,
  undo: answered,
};

export function ReviewScreen() {
  useEffect(() => {
    const room = () => document.querySelector("[data-review-room]");
    const select = window.setTimeout(() => {
      const button = [...(room()?.querySelectorAll("button") ?? [])].find(
        (b) => b.textContent?.trim() === "Select",
      );
      button?.click();
    }, 600);
    const pick = window.setTimeout(() => {
      room()
        ?.querySelectorAll<HTMLElement>("[data-tile-button]")
        .forEach((tile, i) => {
          if (i === 1 || i === 2 || i === 4) tile.click();
        });
      (document.activeElement as HTMLElement | null)?.blur();
    }, 1000);
    return () => {
      window.clearTimeout(select);
      window.clearTimeout(pick);
    };
  }, []);
  return (
    <HostFrame>
      <div data-route-fade className="space-y-6">
        <SetCrumbs
          trail={[
            { label: "Partyreel", href: "/dashboard" },
            { label: NAME, href: `/dashboard/${EVENT.id}` },
            { label: "Review" },
          ]}
        />
        <ReviewRoom
          eventId={EVENT.id}
          moderationOn
          pendingItems={QUEUE}
          writes={INERT}
          claimPage={false}
        />
      </div>
    </HostFrame>
  );
}
