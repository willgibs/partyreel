"use client";

import { ArrowLeft, LayoutDashboard, Settings } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { EVENT, type Person } from "./fixtures";
import {
  Body,
  Foot,
  type HeadOption,
  Identity,
  Menu,
  MenuRow,
  ProfilePage,
} from "./profile";

/**
 * ROUND TWO'S PIECES: how a profile keeps the scanned event reachable
 * (`way-back`) and what stands above a person's page now that it can
 * (`head`). Everything here is new; nothing here reaches a Server Function or
 * a row. (`view-all` and `quick-look` moved to the `popups` board.)
 */

/* ── way-back: how a profile keeps the scanned event reachable ──────────── */

export type WayBackOption = "pill" | "menu" | "none";

export type ArrivedId = "album" | "direct";
export const arrivedOf = (v: string | undefined): ArrivedId =>
  v === "direct" ? "direct" : "album";

/** (a) A "Back to <event>" pill under the header: works whether the visitor is
 *  signed in or not, which is half the argument for it (a signed-out guest
 *  gets no account menu at all). Shown only when the visit began on the
 *  album; `arrived=direct` draws nothing, honestly. */
function BackPill({ event }: { event: string }) {
  return (
    <div className="border-b border-border/60 px-5 py-2.5">
      {/* `data-pp-back` on the pill itself, not the full-width bar it sits in:
          `measureBack` reports the affordance's own footprint, the same way
          `measureReach` never counts the row a control merely stands in. */}
      <a
        data-pp-back
        href="#event"
        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground outline-none transition-colors duration-150 ease-emphasis hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Back to {event}
      </a>
    </div>
  );
}

/** (b) The signed-in menu, one row longer: `Menu`/`MenuRow` are round one's own
 *  material (profile.tsx), so this reads as the same family as the block
 *  menu rather than a second one. Only reaches signed-in visitors. */
function AccountMenuHeader({
  event,
  arrived,
}: {
  event: string;
  arrived: ArrivedId;
}) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <span data-pp-back className="relative flex h-8 items-center">
        <Avatar size="default">
          <AvatarFallback>P</AvatarFallback>
        </Avatar>
        <Menu>
          {arrived === "album" && (
            <MenuRow>
              <ArrowLeft /> Back to {event}
            </MenuRow>
          )}
          <MenuRow>
            <LayoutDashboard /> Dashboard
          </MenuRow>
          <MenuRow>
            <Settings /> Account
          </MenuRow>
        </Menu>
      </span>
    </header>
  );
}

export function WayBackShowcase({
  option,
  person,
  arrived,
}: {
  option: WayBackOption;
  person: Person;
  arrived: ArrivedId;
}) {
  if (option === "menu") {
    return (
      <div data-pp-page className="flex min-h-full flex-1 flex-col">
        <AccountMenuHeader event={EVENT.name} arrived={arrived} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
          <Identity person={person} option="line" />
          <Body person={person} option="covers" />
        </main>
        <Foot />
      </div>
    );
  }
  return (
    <ProfilePage
      person={person}
      head="guest"
      identity="line"
      body="covers"
      block="report"
      viewer="stranger"
      belowHead={
        option === "pill" && arrived === "album" ? (
          <BackPill event={EVENT.name} />
        ) : undefined
      }
    />
  );
}

/* ── head, asked again: what should stand above a person's page now that
   way-back exists ────────────────────────────────────────────────────────── */

export type HeadAgainOption = "today" | "quiet" | "bare";

const HEAD_FOR: Record<HeadAgainOption, HeadOption> = {
  today: "guest",
  quiet: "quiet",
  bare: "bare",
};

/**
 * Drawn WITH way-back's own pill under every option, never without it: the
 * whole case for reopening this is that the pill already exists, so judging
 * the header alone, the way round one did, would be judging a world that no
 * longer stands. `arrived="album"` throughout, the case the pill answers.
 */
export function HeadAgainShowcase({
  option,
  person,
}: {
  option: HeadAgainOption;
  person: Person;
}) {
  return (
    <ProfilePage
      person={person}
      head={HEAD_FOR[option]}
      identity="line"
      body="covers"
      block="report"
      viewer="stranger"
      belowHead={<BackPill event={EVENT.name} />}
    />
  );
}
