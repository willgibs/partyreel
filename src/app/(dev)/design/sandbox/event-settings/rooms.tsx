"use client";

import { type ReactNode } from "react";
import { Check, ListChecks, UserCheck } from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { ReviewGrid } from "@/components/app/event-feed/review-grid";
import type { GridMedia } from "@/components/app/media-grid";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BLOCKED, EVENT, NEWCOMERS, type Person, QUEUE } from "./fixtures";
import { Face, HostPage, Mark } from "./hub";
import type { ScreenId } from "./screens";

/**
 * THE ROOMS THE JOIN ASKS TOUCH, QUOTED (ported from event-safety's
 * `host.tsx`): the Guests room as his answers leave it (the list always on,
 * `room=always`; the Blocked section at its foot, `blocked=foot`, which
 * `safety-wiring` builds), and the Review room on the real `ReviewGrid`.
 * Nothing is wired: every Let in and Decline is drawn at rest.
 */

/** One guest in the host's own room: face, name, the address only the host sees, a count. */
export function GuestRow({
  person,
  screen,
  trailing,
  muted = false,
}: {
  person: Person;
  screen: ScreenId;
  trailing?: ReactNode;
  muted?: boolean;
}) {
  return (
    <li className="relative flex items-center gap-3 px-4 py-3">
      <Face person={person} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            muted && "text-muted-foreground",
          )}
        >
          <span className="truncate">{person.name}</span>
          {!person.verified && <Mark />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {person.email ?? "Typed a name"}
        </p>
      </div>
      {trailing ?? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {screen === "375" ? person.uploads : `${person.uploads} photos`}
        </span>
      )}
    </li>
  );
}

/** A labelled group of rows in the room, on the room's own card. */
export function RoomSection({
  label,
  count,
  note,
  tone,
  children,
}: {
  label: string;
  count?: number;
  note?: ReactNode;
  tone?: "amber" | "quiet";
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <FeedSectionHeader label={label} count={count} amber={tone === "amber"} />
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <ul
        className={cn(
          "divide-y divide-border rounded-lg border",
          tone === "amber" && "border-warning/40",
          tone === "quiet" && "bg-muted/30",
        )}
      >
        {children}
      </ul>
    </section>
  );
}

/** The Blocked foot as safety-wiring builds it: who, since when, and the way back. */
function BlockedFoot({ screen }: { screen: ScreenId }) {
  return (
    <RoomSection
      label="Blocked"
      count={BLOCKED.length}
      tone="quiet"
      note="Only you see this. Blocked people meet a closed album."
    >
      {BLOCKED.map((b) => (
        <GuestRow
          key={b.id}
          person={b}
          screen={screen}
          muted
          trailing={
            <Button
              variant="outline"
              size="sm"
              tabIndex={-1}
              className="shrink-0"
            >
              Let back in
            </Button>
          }
        />
      ))}
    </RoomSection>
  );
}

/**
 * THE GUESTS ROOM (`/dashboard/[eventId]/guests`), as the host's own full
 * list: the heading and the one count, a section above the guests (the door's
 * queue), the guests, whatever stands under them, and the Blocked foot.
 */
export function GuestsRoom({
  screen,
  people,
  top,
  foot,
}: {
  screen: ScreenId;
  people: readonly Person[];
  top?: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <HostPage screen={screen} trail={[EVENT.name, "Guests"]}>
      <div className="space-y-5">
        <div className="flex items-baseline gap-2.5">
          <PageHeading>Guests</PageHeading>
          <span className="text-sm text-muted-foreground tabular-nums">
            {people.length}
          </span>
        </div>
        {top}
        <ul className="divide-y divide-border rounded-lg border">
          {people.map((p) => (
            <GuestRow key={p.id} person={p} screen={screen} />
          ))}
        </ul>
        {foot}
        <BlockedFoot screen={screen} />
      </div>
    </HostPage>
  );
}

/** A newcomer who confirmed an address and waits: Let in, or Decline (a block). */
export function NewcomerRow({
  n,
  screen,
  reachable = false,
}: {
  n: (typeof NEWCOMERS)[number];
  screen: ScreenId;
  reachable?: boolean;
}) {
  const phone = screen === "375";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Face person={{ name: n.name, verified: true, seed: n.seed }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{n.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {phone ? n.email : `${n.email} · ${n.when}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          tabIndex={-1}
          className="text-muted-foreground"
        >
          Decline
        </Button>
        <Button
          size="sm"
          tabIndex={-1}
          data-set-reach={reachable ? "" : undefined}
        >
          <UserCheck /> Let in
        </Button>
      </div>
    </li>
  );
}

/** The queue as a room section: the newcomers, and what declining does. */
export function DoorQueue({ screen }: { screen: ScreenId }) {
  return (
    <RoomSection
      label="At the door"
      count={NEWCOMERS.length}
      tone="amber"
      note="Declining someone blocks them. You can let them back from Blocked."
    >
      {NEWCOMERS.map((n, i) => (
        <NewcomerRow key={n.id} n={n} screen={screen} reachable={i === 0} />
      ))}
    </RoomSection>
  );
}

/** Nothing selected and nothing leaving: the queue at rest. */
const NONE: ReadonlySet<string> = new Set();

/**
 * THE REVIEW ROOM (`review/page.tsx` over `review-section.tsx` pending): the
 * page's heading, the amber header with its count and its pair, then the queue
 * on the real `ReviewGrid` (host-curation `queue=uniform`), imported whole.
 * `above` stands between the header and the grid, `prompt` directly on the
 * grid it folds into (his `arrivals=prompt`); `keys` rings the photograph the
 * arrows stand on (`keys=arrows`, with no hint row).
 */
export function ReviewRoom({
  screen,
  items = QUEUE,
  above,
  prompt,
  keys = false,
}: {
  screen: ScreenId;
  items?: readonly GridMedia[];
  above?: ReactNode;
  prompt?: ReactNode;
  keys?: boolean;
}) {
  return (
    <HostPage screen={screen} trail={[EVENT.name, "Review"]}>
      <div className="space-y-6">
        <PageHeading>Review</PageHeading>
        <section aria-label="Review" className="space-y-2.5">
          <FeedSectionHeader
            label="Review"
            count={items.length}
            amber
            action={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" tabIndex={-1}>
                  <ListChecks /> Select
                </Button>
                <Button size="sm" tabIndex={-1}>
                  <Check /> Approve all
                </Button>
              </div>
            }
          />
          {above}
          {prompt}
          <div data-set-keys={keys ? "" : undefined}>
            <ReviewGrid
              items={[...items]}
              selectMode={false}
              selected={NONE as Set<string>}
              exiting={NONE as Set<string>}
              onToggle={() => {}}
            />
          </div>
        </section>
      </div>
    </HostPage>
  );
}
