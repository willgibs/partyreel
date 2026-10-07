"use client";

import { Lock } from "lucide-react";

import { ProfileHead } from "@/app/(guest)/u/[slug]/profile-head";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { PageInviteCard } from "@/components/app/dashboard/page-invite-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { AppPage } from "./chrome";
import {
  EVENT_SETS,
  FOLLOWING,
  LIKES,
  type Party,
  PRIYA,
  type Still,
  UPLOAD_SETS,
} from "./fixtures";
import { AddressInvite } from "./invite-address";
import { PlateInvite } from "./invite-plate";
import { WindowInvite } from "./invite-window";
import type { PhotosId } from "./knobs";

/**
 * HER OWN PAGE BEFORE IT IS PUBLIC, AS WIRED (`app/(app)/me/page.tsx`,
 * account-moments r1's `me-page=private`): production's `ProfileHead`, her
 * photo and name marked "Only you can see this page.", then the invitation,
 * then her own sections, in the app's shell. The sections are a server
 * component's (`owner-sections.tsx`), retyped here class for class: the feeds
 * are stand-in rows of the stills in the gallery's tile and gap, the
 * Connections chips production's markup.
 *
 * The invitation is the one thing an option changes: `today` is production's
 * `PageInviteCard` where `/me` draws it (`mt-6`, `dismissible={false}`); each
 * take is a file of its own (`invite-*.tsx`), drawn in the same place, and
 * owns its own space above and below. Her photographs are the Photos knob's
 * set, the same six under Your uploads and in the plate's light.
 */

export type InviteWay = "today" | "plate" | "address" | "window";

/** A run of stills in the gallery's own tile and gap, three to a row. */
function Rows({ stills }: { stills: readonly Still[] }) {
  const rows: Still[][] = [];
  for (let i = 0; i < stills.length; i += 3) rows.push(stills.slice(i, i + 3));
  return (
    <div className="flex flex-col" style={{ gap: "var(--gap-gallery)" }}>
      {rows.map((row, r) => (
        <div
          key={r}
          className="am-row flex"
          style={{ gap: "var(--gap-gallery)" }}
        >
          {row.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-tile bg-muted"
              style={{ flex: `${s.ratio} 1 0` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
              <img
                src={s.src}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The owner sections: her uploads, her likes, the people she follows. */
function Sections({ uploads }: { uploads: readonly Still[] }) {
  return (
    <div className="space-y-8">
      <FeedSection heading="Your uploads">
        <Rows stills={uploads} />
      </FeedSection>
      <FeedSection heading="Your likes">
        <Rows stills={LIKES.slice(0, 6)} />
      </FeedSection>
      <FeedSection heading="Connections">
        <ul className="flex flex-wrap gap-2">
          {FOLLOWING.slice(0, 3).map((p) => (
            <li key={p.id}>
              <span className="flex max-w-56 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1">
                <Avatar size="sm" seed={p.seed}>
                  <AvatarFallback className="text-[10px]">
                    {p.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{p.name}</span>
              </span>
            </li>
          ))}
        </ul>
      </FeedSection>
    </div>
  );
}

function Invite({
  way,
  uploads,
  events,
}: {
  way: InviteWay;
  uploads: readonly Still[];
  events: readonly Party[];
}) {
  if (way === "plate") return <PlateInvite stills={uploads} />;
  if (way === "address") return <AddressInvite />;
  if (way === "window") return <WindowInvite events={events} />;
  return (
    <div className="mt-6">
      <PageInviteCard dismissible={false} />
    </div>
  );
}

export function MePage({
  invite,
  photos = "wedding",
}: {
  invite: InviteWay;
  photos?: PhotosId;
}) {
  const uploads = UPLOAD_SETS[photos];
  return (
    <AppPage>
      <div className="mx-auto max-w-3xl">
        <ProfileHead
          seed={PRIYA.seed}
          avatarUrl={null}
          name={PRIYA.name}
          joined={PRIYA.joined}
        >
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden />
            Only you can see this page.
          </p>
        </ProfileHead>
        <div data-am-read="the invitation">
          <Invite way={invite} uploads={uploads} events={EVENT_SETS[photos]} />
        </div>
        <div className="mt-10">
          <Sections uploads={uploads} />
        </div>
      </div>
    </AppPage>
  );
}
