"use client";

import { useState } from "react";
import { ArrowLeft, LayoutDashboard, Settings } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { GuestList } from "@/components/social/guest-list";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";

import { AlbumHead, Album, FacesRow, NamesSheet, Section } from "./album";
import { type Chip, EVENT, GUESTS, type Person } from "./fixtures";
import { Body, Foot, Head, Identity, Menu, MenuRow, ProfilePage } from "./profile";
import type { ScreenId } from "./scene";

/**
 * ROUND TWO'S THREE PIECES, on the bases `album.tsx` kept: how the faces row's
 * "View all" opens (`view-all`), what a name opens first (`quick-look`), and
 * how a profile keeps the scanned event reachable (`way-back`). Everything
 * here is new; nothing here reaches a Server Function or a row.
 */

/* ── view-all: how the full list opens from the faces row ───────────────── */

export type ViewAllOption = "inline" | "sheet" | "modal" | "page";

const GROUP_SIZE = 24;

/** Round one's own number for "an ordinary wedding" (fixtures.ts): grouping the
 *  expansion at the same size a full page of names already reads as. */
function Pager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (next: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border/60 pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        Back
      </Button>
      <span className="text-xs text-muted-foreground">
        Group {page + 1} of {pages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === pages - 1}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

/**
 * (a) In place, under the row, grouped: the interim `profile-wiring` ships,
 * with the pagination Will's own note asked for ("For bigger lists, we should
 * continue to have pagination to expand into groups"). Drawn already open: the
 * expansion is the subject, not the row.
 */
function ViewAllInline({ items }: { items: Chip[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / GROUP_SIZE));
  const slice = items.slice(page * GROUP_SIZE, page * GROUP_SIZE + GROUP_SIZE);
  return (
    <div data-pp-list className="space-y-3">
      <GuestList items={slice} />
      <Pager page={page} pages={pages} onChange={setPage} />
    </div>
  );
}

/**
 * (b) A sheet over the album: rises from the foot, its own capped scroll
 * region, the row and the album beneath never resize under it.
 */
function ViewAllSheet({ items }: { items: Chip[] }) {
  return (
    <>
      <FacesRow items={items} onOpen={() => {}} />
      <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/50">
        <div
          className={`flex max-h-[80vh] flex-col rounded-t-2xl ${floatingPanel}`}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" />
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-3 pb-4">
            <p className="font-heading text-lg">Guests ({items.length})</p>
            <Button type="button" variant="ghost" size="sm">
              Close
            </Button>
          </div>
          <div
            data-pp-list
            className="min-h-0 flex-1 overflow-y-auto px-6 pb-6"
          >
            <GuestList items={items} />
          </div>
        </div>
      </div>
    </>
  );
}

/** (c) The centred modal round one drew, unchanged: `NamesSheet`. */
function ViewAllModal({ items }: { items: Chip[] }) {
  return (
    <>
      <FacesRow items={items} onOpen={() => {}} />
      <NamesSheet items={items} open onClose={() => {}} />
    </>
  );
}

/**
 * (d) Its own page, `/e/<token>/guests`: ordinary document flow, so it is the
 * one option allowed to be long (a page is supposed to scroll; an album is
 * not supposed to grow 100 screens tall underneath its own footer). Replaces
 * the scene instead of sitting over it: this is what leaving the album for a
 * real destination looks like, back link included.
 */
export function ViewAllPage({ items }: { items: Chip[] }) {
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background px-5 py-3">
        <button
          type="button"
          aria-label="Back to the album"
          className="flex size-8 items-center justify-center rounded-full outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <p className="font-heading text-subsection">Guests</p>
      </header>
      <div data-pp-list className="px-5 py-5">
        <p className="mb-3 text-sm text-muted-foreground">
          {items.length} people added photos to {EVENT.name}.
        </p>
        <GuestList items={items} />
      </div>
    </>
  );
}

/** (a), (b) and (c): the three that keep the album on screen underneath them. */
export function ViewAllShowcase({
  option,
  items,
}: {
  option: Exclude<ViewAllOption, "page">;
  items: Chip[];
}) {
  return (
    <>
      <Head option="guest" signedIn />
      <AlbumHead photoCount={items.length > GUESTS.length ? 640 : undefined} />
      <Album count={2} />
      <Section label="Guests" count={items.length}>
        {option === "inline" && <ViewAllInline items={items} />}
        {option === "sheet" && <ViewAllSheet items={items} />}
        {option === "modal" && <ViewAllModal items={items} />}
      </Section>
      <div className="mt-8">
        <Foot />
      </div>
    </>
  );
}

/* ── quick-look: what a name opens first ─────────────────────────────────── */

export type QuickLookOption = "sheet" | "adaptive" | "none";

/** The parties as small covers, plus the overflow line: the one place this
 *  round draws round one's `made-of=covers` at a size smaller than a grid
 *  column, so a card stays a peek rather than a second full page. */
function SmallCovers({ person }: { person: Person }) {
  const parties = [...person.hosted, ...person.attended];
  if (parties.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">Nothing here yet.</p>
    );
  }
  const shown = parties.slice(0, 3);
  const rest = parties.length - shown.length;
  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-2">
        {shown.map((p) => (
          <EventCard
            key={p.id}
            href={person.hosted.includes(p) ? `#${p.id}` : null}
            name={p.name}
            coverUrl={p.cover}
            dateLabel={p.dateLabel}
          />
        ))}
      </div>
      {rest > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">+{rest} more</p>
      )}
    </div>
  );
}

/** The face, the name, the line and the parties as small covers, plus the
 *  door to the full page: Will's own words for what a quick look holds. */
function QuickLookBody({ person }: { person: Person }) {
  return (
    <>
      <Identity person={person} option="line" />
      <SmallCovers person={person} />
      <Button type="button" className="mt-5 w-full">
        Open full profile
      </Button>
    </>
  );
}

/** The bottom sheet: the same card at 375 and, under "sheet", at 1440 too. A
 *  centred column inside an edge-to-edge panel, because the shipped `Sheet`'s
 *  own bottom side is edge-to-edge at every width (`sheet.tsx`): the panel can
 *  span the window without the READING measure doing the same. */
function QuickLookSheet({ person }: { person: Person }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/50">
      <div
        data-pp-card
        className={`max-h-[80vh] overflow-y-auto rounded-t-2xl p-6 ${floatingPanel}`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="mx-auto w-full max-w-md">
          <QuickLookBody person={person} />
        </div>
      </div>
    </div>
  );
}

/** The one chip a tap marks, so an anchored popover has something to anchor
 *  beside: `GuestList` renders its own `<ul>` and takes no per-chip slot, so
 *  this repeats its chip markup for one row rather than editing the shipped
 *  component (the same move `OwnChip` made in round one). */
function ClickedChip({ chip }: { chip: Chip }) {
  return (
    <span className="flex h-8 items-center gap-2 rounded-full border border-ring/50 bg-muted/60 py-1 pr-3 pl-1 text-sm ring-2 ring-ring/30">
      <Avatar size="sm">
        <AvatarImage src={chip.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="text-[10px]">
          {(chip.displayName ?? "?").slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-40 truncate">{chip.displayName}</span>
    </span>
  );
}

/** The popover: anchored beside the name that opened it, a peek that leaves
 *  the rest of the list in view, "adaptive"'s 1440 half. */
function QuickLookPopover({ person }: { person: Person }) {
  const chip: Chip = {
    id: person.id,
    displayName: person.name,
    slug: person.slug,
    avatarMarker: null,
    avatarUrl: person.avatar,
  };
  return (
    <div className="relative inline-block">
      <ClickedChip chip={chip} />
      <div
        data-pp-card
        className={`absolute top-full left-0 z-50 mt-2 w-80 p-4 ${floatingPanel}`}
      >
        <QuickLookBody person={person} />
      </div>
    </div>
  );
}

export function QuickLookShowcase({
  option,
  person,
  screen,
}: {
  option: QuickLookOption;
  person: Person;
  screen: ScreenId;
}) {
  if (option === "none") {
    return (
      <ProfilePage
        person={person}
        head="guest"
        identity="line"
        body="covers"
        block="report"
        viewer="stranger"
      />
    );
  }
  const popover = option === "adaptive" && screen === "1440";
  return (
    <>
      <Head option="guest" signedIn />
      <AlbumHead />
      <Album count={2} />
      <Section label="Guests" count={GUESTS.length}>
        {popover ? (
          <QuickLookPopover person={person} />
        ) : (
          <>
            <FacesRow items={GUESTS} onOpen={() => {}} />
            <QuickLookSheet person={person} />
          </>
        )}
      </Section>
    </>
  );
}

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
