"use client";

import { useState } from "react";
import { ArrowLeft, LayoutDashboard, Settings } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import {
  AlbumHead,
  Album,
  CHIP,
  Face,
  FacesRow,
  HEADING,
  headingCount,
  NameList,
  NamesSheet,
  QuotedMark,
  Section,
} from "./album";
import {
  type Chip,
  EVENT,
  GUESTS,
  isUnverified,
  type Person,
  type Tapped,
} from "./fixtures";
import { Body, Foot, Head, Identity, Menu, MenuRow, ProfilePage } from "./profile";
import type { ScreenId } from "./scene";

/**
 * ROUND TWO'S THREE PIECES, on the bases `album.tsx` kept: how the faces row's
 * "View all" opens (`view-all`), what a name opens first (`quick-look`), and
 * how a profile keeps the scanned event reachable (`way-back`). Everything
 * here is new; nothing here reaches a Server Function or a row.
 */

/* ── view-all: how the full list opens from the faces row ───────────────── */

export type ViewAllOption = "inline" | "sheet" | "centred" | "page";

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
 * (a) In place, under the row, grouped, with the pagination Will's own note
 * asked for ("For bigger lists, we should continue to have pagination to
 * expand into groups"). Drawn already open: the expansion is the subject, not
 * the row.
 */
function ViewAllInline({ items }: { items: Chip[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / GROUP_SIZE));
  const slice = items.slice(page * GROUP_SIZE, page * GROUP_SIZE + GROUP_SIZE);
  return (
    <div data-pp-list className="space-y-3">
      <NameList items={slice} />
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
            <NameList items={items} />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * (c) The centred list, on round one's own `NamesSheet`: capped, scrolling
 * within itself, the same object the app already celebrates Pro in
 * (`welcome-to-pro.tsx`, app-pricing r1) rather than a bespoke modal drawn
 * for this board alone.
 */
function ViewAllCentred({ items }: { items: Chip[] }) {
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
        <NameList items={items} />
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
      <Section label="Guests" count={headingCount(items)}>
        {option === "inline" && <ViewAllInline items={items} />}
        {option === "sheet" && <ViewAllSheet items={items} />}
        {option === "centred" && <ViewAllCentred items={items} />}
      </Section>
      <div className="mt-8">
        <Foot />
      </div>
    </>
  );
}

/* ── quick-look: what a name opens first ─────────────────────────────────── */

export type QuickLookOption = "sheet" | "mini-modal" | "none";

/** The events a page shows, as small covers, plus the overflow line: round
 *  one's `made-of=covers` at a size smaller than a grid column, so a look
 *  stays a peek rather than a second full page. Only what its owner chose:
 *  `attended` is the opt-in list, never everything she went to. */
function SmallCovers({ person }: { person: Person }) {
  const parties = [...person.hosted, ...person.attended];
  if (parties.length === 0) return null;
  const shown = parties.slice(0, 3);
  const rest = parties.length - shown.length;
  return (
    <div className="mt-5 space-y-2">
      <p className={HEADING}>Events</p>
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
      {rest > 0 && <p className="text-xs text-muted-foreground">+{rest} more</p>}
    </div>
  );
}

/** Who this is, in the words the album already uses: a page's own head (the
 *  handle, the month, the line) where there is a page; the name alone for a
 *  confirmed account without one; the name and the mark for a typed name. */
function LookHead({ tapped }: { tapped: Tapped }) {
  if (tapped.person) return <Identity person={tapped.person} option="line" />;
  const unverified = tapped.kind === "unverified";
  return (
    <section className="flex items-center gap-5">
      <Avatar size="xl" seed={unverified ? undefined : (tapped.seed ?? undefined)}>
        {!unverified && <AvatarImage src={tapped.avatar ?? undefined} alt="" />}
        <AvatarFallback>{tapped.name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-page text-balance">{tapped.name}</p>
        {unverified && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <QuotedMark />
            Unverified: anyone can type a name
          </p>
        )}
      </div>
    </section>
  );
}

/** The one thing every name on the list has: what they added to this album,
 *  already public on it by name, so a look shows nothing the album did not. */
function PhotosHere({ tapped }: { tapped: Tapped }) {
  const shown = tapped.photosHere.slice(0, 4);
  return (
    <div className="mt-5 space-y-2">
      <p className={HEADING}>{tapped.photosHere.length} photos in this album</p>
      <div className="grid grid-cols-4 gap-1.5">
        {shown.map((m) => (
          <div
            key={m.id}
            className="aspect-square overflow-hidden bg-black/10"
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still, not a presigned URL */}
            <img src={m.url} alt="" className="size-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The look itself: who, what they added here, and, only where a page stands
 *  behind the name, the events it shows and the door to it. */
function LookBody({ tapped }: { tapped: Tapped }) {
  return (
    <>
      <LookHead tapped={tapped} />
      <PhotosHere tapped={tapped} />
      {tapped.person && (
        <>
          <SmallCovers person={tapped.person} />
          <Button type="button" className="mt-5 w-full">
            Open full profile
          </Button>
        </>
      )}
    </>
  );
}

/** The app's own responsive Sheet (app-shape r1): a bottom sheet in a hand, a
 *  right-edge panel at a desk, one component rather than a split by screen.
 *  The phone side is a centred column inside an edge-to-edge panel, because
 *  the shipped `Sheet`'s own bottom side is edge-to-edge at every width
 *  (`sheet.tsx`); the desk side narrows to a column pinned to the right edge,
 *  never full width, which is what keeps the rest of the list in view. */
function LookSheet({ tapped, screen }: { tapped: Tapped; screen: ScreenId }) {
  const desk = screen === "1440";
  return (
    <div
      className={`fixed inset-0 z-[60] flex bg-black/50 ${desk ? "justify-end" : "flex-col justify-end"}`}
    >
      <div
        data-pp-card
        className={
          desk
            ? `h-full w-full max-w-sm overflow-y-auto rounded-l-2xl p-6 ${floatingPanel}`
            : `max-h-[80vh] overflow-y-auto rounded-t-2xl p-6 ${floatingPanel}`
        }
      >
        {!desk && (
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        )}
        <div className="mx-auto w-full max-w-md">
          <LookBody tapped={tapped} />
        </div>
      </div>
    </div>
  );
}

/** The mini-modal: the same small, centred, capped dialog the QR already
 *  opens in (app-shape r1's `share=room`), reused for a look at a person
 *  rather than a code. Identical at both screens, unlike the Sheet, because
 *  the QR's own mini-modal never adapted by width either. */
function LookModal({ tapped }: { tapped: Tapped }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        data-pp-card
        className={`max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl p-6 ${floatingPanel}`}
      >
        <LookBody tapped={tapped} />
      </div>
    </div>
  );
}

/** The names, open in place as the shipped list opens them, with the one a
 *  tap just landed on marked: the chip a look (or nothing) answers. */
function ListWithTap({ tappedId }: { tappedId: string }) {
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {GUESTS.map((chip) => (
        <li key={chip.id}>
          <span
            data-pp-tapped={chip.id === tappedId ? "" : undefined}
            className={cn(
              CHIP,
              chip.id === tappedId
                ? "border-ring/50 bg-muted/60 text-foreground ring-2 ring-ring/30"
                : !isUnverified(chip) && chip.slug
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            <Face chip={chip} />
            <span className="max-w-40 truncate">{chip.displayName}</span>
            {isUnverified(chip) && <QuotedMark />}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function QuickLookShowcase({
  option,
  tapped,
  screen,
}: {
  option: QuickLookOption;
  tapped: Tapped;
  screen: ScreenId;
}) {
  // As shipped, a name with a page is a link straight to it.
  if (option === "none" && tapped.person) {
    return (
      <ProfilePage
        person={tapped.person}
        head="guest"
        identity="line"
        body="covers"
        block="report"
        viewer="stranger"
      />
    );
  }
  return (
    <>
      <Head option="guest" signedIn />
      <AlbumHead />
      <Album count={2} />
      <Section label="Guests" count={headingCount(GUESTS)}>
        {/* As shipped, every other name opens nothing: no page, no look. */}
        <div data-pp-inert={option === "none" ? "" : undefined}>
          <ListWithTap tappedId={tapped.id} />
        </div>
      </Section>
      {option === "sheet" && <LookSheet tapped={tapped} screen={screen} />}
      {option === "mini-modal" && <LookModal tapped={tapped} />}
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
