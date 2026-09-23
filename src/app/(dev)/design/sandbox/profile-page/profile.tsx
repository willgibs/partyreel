"use client";

import { type ReactNode, useState } from "react";
import {
  CalendarDays,
  Flag,
  MoreHorizontal,
  Sparkles,
  UserCheck,
  UserPlus,
  UserRoundX,
} from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { EmptyState } from "@/components/shared/empty-state";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import type { Party, Person } from "./fixtures";

/**
 * THE PUBLIC PROFILE, IN PARTS, SO ONE PART AT A TIME CAN MOVE.
 *
 * ★ THE PAGE IS FORKED, NOT IMPORTED, AND THAT IS NOT A SHORTCUT. `/u/[slug]`
 * is a server component whose body is three awaited server calls: the anon
 * `get_public_profile` RPC, `supabase.auth.getUser()` for the follow gate, and
 * a presign round for every cover. Mounting it in a frame is not possible and
 * importing it would drag `server-only` into a client bundle. So the MARKUP is
 * copied from it line for line (the classNames below are its own) and the parts
 * that are real components stay real components: `EventCard`, `EmptyState`,
 * `Logo`, `Avatar`, `Button`, `Dialog`, `DropdownMenu` and `GuestMasonry` are
 * imported and wrapped, never re-drawn.
 *
 * ★ AND NOTHING ON THIS BOARD CALLS A SERVER FUNCTION. `FollowButton` and
 * `ProfileActionsMenu` are the two social controls on this page and BOTH open
 * with a Server Function against Supabase: a follow would write a real
 * `user_follows` row and a block would sever a real pair. They are forked here
 * as local state, with the shipped icons, variants, words and the shipped
 * confirm dialog verbatim, so a press moves the picture and never a row.
 */

/* ── The head ────────────────────────────────────────────────────────────── */

export type HeadOption = "today" | "guest" | "bare";

/**
 * ★ `GuestHeader` IS QUOTED, NOT MOUNTED, and the reason is a landmine rather
 * than a preference: it resolves the visitor's Supabase session on mount and
 * then fetches `/api/me/menu` once per frame, so every tile on the stage would
 * draw whatever the author happens to be signed in as. Its markup is copied
 * (the same h-8 slot that keeps the CTA-to-avatar swap height-stable) and the
 * menu is drawn closed, which is the state a header preview shows anyway.
 */
export function Head({
  option,
  signedIn,
}: {
  option: HeadOption;
  signedIn: boolean;
}) {
  if (option === "bare") return null;
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span aria-label="Partyreel home">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        {option === "guest" && signedIn ? (
          <Avatar size="default">
            <AvatarFallback>W</AvatarFallback>
          </Avatar>
        ) : (
          <Button variant="ghost" size="sm">
            {signedIn ? "Dashboard" : "Start for free"}
          </Button>
        )}
      </div>
    </header>
  );
}

/* ── The identity block ──────────────────────────────────────────────────── */

export type IdentityOption = "today" | "counts" | "line";

function Facts({ person, option }: { person: Person; option: IdentityOption }) {
  if (option === "counts") {
    const hosted = person.hosted.length;
    const attended = person.attended.length;
    return (
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
        <span>@{person.slug}</span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span className="tabular-nums">
          {hosted} album{hosted === 1 ? "" : "s"}
        </span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span className="tabular-nums">
          {attended} part{attended === 1 ? "y" : "ies"}
        </span>
      </p>
    );
  }
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
      <span>@{person.slug}</span>
      <span aria-hidden className="text-faint">
        ·
      </span>
      <span>{person.joined}</span>
    </p>
  );
}

/**
 * ★ THE LINE SITS UNDER THE ROW, NOT IN IT (Will, `identity=line`, as the page
 * ships it): "Profile picture (avatar) should be center aligned to the
 * name/meta group, so if a bio 1) doesn't exist it looks correct, or 2) does
 * exist and runs at any length, the avatar is still aligned to the top
 * name/meta". A line inside the flex row would drag the avatar down by half of
 * whatever the person wrote, so `line` draws it after the row, exactly as
 * `/u/[slug]` does, and the avatar is the shipped `xl` one in its own colour.
 *
 * ★ THE ROW IS FIXED AT A PHONE, IN EVERY OPTION, AND THAT IS DELIBERATE.
 * The shipped block is `flex flex-wrap items-center gap-5` with the avatar, a
 * `min-w-0 flex-1` column and the actions all on ONE line. At 375 that leaves
 * the column about 90px: the first captures read against their own words had
 * "Joined June 2026" on two lines and a one-line bio on four. A decision about
 * what the top SAYS cannot be judged through a layout bug, and offering three
 * ways to live with one and none that fixes it is the mistake `type-phone` was
 * pulled up for (docs/PROGRAM.md). So the name column takes the rest of the
 * row and the actions wrap under it, identically in all three options.
 *
 * ★ AND THE FIX IS `max-sm:` ONLY, which the captures are why. The first pass
 * wrote `basis-[...] sm:basis-auto` and a `w-full sm:w-auto` wrapper, and the
 * 1440 capture came back with Follow on a second row: the shipped desktop
 * composition had moved under a question about a phone. Adding classes ONLY
 * below the breakpoint leaves every wider screen byte-identical to what ships.
 */
export function Identity({
  person,
  option,
  actions,
}: {
  person: Person;
  option: IdentityOption;
  actions?: ReactNode;
}) {
  return (
    <>
      <section className="flex flex-wrap items-center gap-5">
        <Avatar size="xl" seed={person.seed}>
          <AvatarImage src={person.avatar ?? undefined} alt="" />
          <AvatarFallback>{person.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-6.25rem)]">
          <h1 className="font-heading text-page text-balance">{person.name}</h1>
          <Facts person={person} option={option} />
        </div>
        {actions}
      </section>
      {option === "line" && person.line && (
        <p className="mt-4 max-w-prose text-sm text-pretty text-foreground">
          {person.line}
        </p>
      )}
    </>
  );
}

/* ── The body ────────────────────────────────────────────────────────────── */

export type BodyOption = "events" | "covers" | "wall";

const HEADING =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";

function Hosted({ parties }: { parties: Party[] }) {
  if (parties.length === 0) return null;
  return (
    <section aria-label="Events" className="mt-10 space-y-3">
      <h2 className={HEADING}>Events</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {parties.map((p) => (
          <li key={p.id}>
            <EventCard
              href={`#${p.id}`}
              name={p.name}
              coverUrl={p.cover}
              dateLabel={p.dateLabel}
              statusLabel={p.lock}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The shipped "Also at" list: names and dates, and NO link, because being on a
 *  guest list is not a capability grant (the RPC returns no token). */
function AlsoAtRows({ parties }: { parties: Party[] }) {
  if (parties.length === 0) return null;
  return (
    <section aria-label="Also at" className="mt-10 space-y-3">
      <h2 className={HEADING}>Also at</h2>
      <ul className="divide-y divide-border/60">
        {parties.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-4 py-2.5"
          >
            <span className="min-w-0 truncate text-sm text-foreground">
              {p.name}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden />
              {p.dateLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The page's Host or Guest marker, `/u/[slug]`'s own `Marker`, copied. */
function Marker({ role }: { role: "host" | "guest" }) {
  return (
    <span
      className={cn(
        "flex h-5 items-center rounded-full px-2 text-[10px] font-medium text-white",
        GLASS_MARK,
      )}
    >
      {role === "host" ? "Host" : "Guest"}
    </span>
  );
}

/**
 * ONE GRID, AS THE PAGE SHIPS IT (Will's `made-of=covers` note: "rather than a
 * separate 'also at' section, maybe we could just have host/guest UI on each
 * event card to denote within a single group"). Hosted and attended together,
 * each with its marker; a Guest card carries its cover and no link, because
 * being on a guest list is not a way into an album, and it is here at all only
 * because its owner turned it on.
 */
function PartyGrid({ person }: { person: Person }) {
  const parties = [
    ...person.hosted.map((p) => ({ party: p, role: "host" as const })),
    ...person.attended.map((p) => ({ party: p, role: "guest" as const })),
  ];
  return (
    <section aria-label="Events" className="mt-10 space-y-3">
      <h2 className={HEADING}>Events</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {parties.map(({ party, role }) => (
          <li key={party.id}>
            <EventCard
              href={role === "host" ? `#${party.id}` : null}
              name={party.name}
              coverUrl={party.cover}
              dateLabel={party.dateLabel}
              statusLabel={party.lock}
              action={<Marker role={role} />}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Body({
  person,
  option,
}: {
  person: Person;
  option: BodyOption;
}) {
  const empty = person.hosted.length === 0 && person.attended.length === 0;
  if (empty) {
    return (
      <div className="mt-10">
        <EmptyState
          variant="quiet"
          icon={Sparkles}
          title="No events here yet"
          description={`When ${person.name} shares an event, it shows up here.`}
        />
      </div>
    );
  }

  if (option === "wall") {
    return (
      <>
        <Hosted parties={person.hosted} />
        <section aria-label="Photographs" className="mt-10 space-y-3">
          <h2 className={HEADING}>Photographs</h2>
          {/* The real guest masonry, at its real columns. Pointer events are
              off: its tiles open the shipped lightbox and its like control
              posts to a Server Function. */}
          <div className="pointer-events-none">
            <GuestMasonry items={person.photos} />
          </div>
        </section>
      </>
    );
  }

  if (option === "covers") return <PartyGrid person={person} />;

  return (
    <>
      <Hosted parties={person.hosted} />
      <AlsoAtRows parties={person.attended} />
    </>
  );
}

/* ── The acts: follow, and block ─────────────────────────────────────────── */

export type BlockOption = "overflow" | "inline" | "report";

export type ViewerId = "stranger" | "self" | "blocked";
export const viewerOf = (v: string | undefined): ViewerId =>
  v === "self" || v === "blocked" ? v : "stranger";

/** The shipped follow control's own variants, icons and two words, with the
 *  Server Function replaced by a `useState`. */
function Follow() {
  const [following, setFollowing] = useState(false);
  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      onClick={() => setFollowing((f) => !f)}
      aria-pressed={following}
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}

/**
 * ★ THE MENU AND THE CONFIRM ARE QUOTED, AND THAT IS A LANDMINE RATHER THAN A
 * PREFERENCE. Both are radix surfaces and radix portals to the OWNING
 * document's body: this subtree is portalled INTO an iframe but the JS realm is
 * still the lab page's, so a real `DropdownMenuContent` or `DialogContent`
 * would open over the whole board instead of inside the picture being judged.
 * They are drawn here on the shared material (`floatingPanel`, `floatingRow`
 * from the kit, never a copy of the numbers) with the shipped icons, the
 * destructive colouring and the confirm's copy word for word.
 *
 * ★ AND THE MENU IS DRAWN OPEN ONLY WHERE IT IS THE DECISION, because the
 * menu's CONTENTS are what `block` asks about: closed, "a menu with one row"
 * and "a menu with a report in it" are the same three-dot button. Everywhere
 * else it is drawn closed, which is how a profile really sits. The first
 * capture read against its own words had it open on every page frame, covering
 * "Joined June 2026" under a menu nobody had asked about.
 *
 * ★ EXPORTED FOR ROUND TWO (2026-09-19): `way-back`'s account-menu option
 * anchors this same panel and row under the header's avatar trigger instead of
 * the overflow button, so the menu family stays one material rather than a
 * second copy of `floatingPanel`/`floatingRow` in `reach.tsx`.
 */
export function Menu({ children }: { children: ReactNode }) {
  return (
    <div
      className={`absolute top-full right-0 z-50 mt-1 min-w-48 p-1 ${floatingPanel}`}
    >
      {children}
    </div>
  );
}

export function MenuRow({
  destructive,
  onClick,
  children,
}: {
  destructive?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-default items-center gap-2 px-2 py-1.5 text-left text-sm ${floatingRow} ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-accent hover:text-accent-foreground [&>svg:first-child]:text-muted-foreground"
      } [&_svg]:size-4 [&_svg]:shrink-0`}
    >
      {children}
    </button>
  );
}

/** The shipped confirm, word for word (profiles-social.md point 5), as a fixed
 *  overlay: the frame IS the viewport, so this lands where a real dialog does. */
function BlockConfirm({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 text-left">
      <div className={`w-full max-w-lg p-6 ${floatingPanel}`}>
        <p className="font-heading text-lg">Block {name}?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          You&rsquo;ll stop following each other, and neither of you can follow
          the other again while the block is on. They won&rsquo;t be notified,
          and they can&rsquo;t see that you blocked them. You can undo this
          anytime from your account settings.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onClose}>
            Block
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Acts({
  person,
  option,
  viewer,
  menuOpen = false,
}: {
  person: Person;
  option: BlockOption;
  viewer: ViewerId;
  /** Only the `block` decision opens it: everywhere else a menu nobody asked
   *  about would sit over the person's own name. */
  menuOpen?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  if (viewer === "self") {
    return (
      <div data-pp-act className="flex items-center max-sm:w-full">
        <Button variant="outline" size="sm">
          Edit profile
        </Button>
      </div>
    );
  }

  // ★ A BLOCKED PAIR KEEPS THE MENU AND LOSES ONLY THE FOLLOW. A menu that
  // vanished would tell the other side they had been blocked, which is the one
  // thing the block promises it will not do.
  const follow = viewer === "blocked" ? null : <Follow />;
  const verb = viewer === "blocked" ? "Unblock" : "Block";

  if (option === "inline") {
    return (
      <div data-pp-act className="flex items-center gap-3 max-sm:w-full">
        {follow}
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="text-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {verb}
        </button>
        {confirm && (
          <BlockConfirm name={person.name} onClose={() => setConfirm(false)} />
        )}
      </div>
    );
  }

  return (
    <div data-pp-act className="flex items-center gap-2 max-sm:w-full">
      {follow}
      {/* ★ THE MENU ANCHORS TO ITS TRIGGER, not to the cluster. With the
          relative box on the row, a blocked pair (no Follow) drew the panel at
          the far right of a full-width row while the three dots sat at the
          left, which radix would never do. */}
      <span className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="More options"
        >
          <MoreHorizontal />
        </Button>
        {menuOpen && (
          <Menu>
            {option === "report" && (
              // Drawn as a future: nothing in the product reports a PERSON yet.
              // The operator's inbox it would land in already exists for media.
              <MenuRow>
                <Flag /> Report this person
              </MenuRow>
            )}
            <MenuRow destructive onClick={() => setConfirm(true)}>
              <UserRoundX /> {verb}
            </MenuRow>
          </Menu>
        )}
      </span>
      {confirm && (
        <BlockConfirm name={person.name} onClose={() => setConfirm(false)} />
      )}
    </div>
  );
}

/* ── The whole page ──────────────────────────────────────────────────────── */

export function Foot() {
  return (
    <footer className="border-t border-border/60 px-5 py-4 text-center text-xs text-muted-foreground">
      Made with{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        Partyreel
      </span>
      , the guest-powered event album.
    </footer>
  );
}

export function ProfilePage({
  person,
  head = "today",
  identity = "today",
  body = "events",
  block = "overflow",
  viewer = "stranger",
  menuOpen = false,
  belowHead,
}: {
  person: Person;
  head?: HeadOption;
  identity?: IdentityOption;
  body?: BodyOption;
  block?: BlockOption;
  viewer?: ViewerId;
  menuOpen?: boolean;
  /** ROUND TWO's slot (2026-09-19): `way-back`'s pill lands between the header
   *  and the name, the one place a "back to the album" line can sit without
   *  moving `Identity` (bible 9's centring ruling keeps the avatar aligned to
   *  the name, not the page). Undefined renders nothing, so every round-one
   *  call site is byte-identical. */
  belowHead?: ReactNode;
}) {
  return (
    <div data-pp-page className="flex min-h-full flex-1 flex-col">
      {/* Every viewer on this board is SIGNED IN, which is the only state where
          the page has any control on it at all: Follow renders for a signed-in
          non-self visitor and the overflow for every signed-in non-self one. A
          signed-out visitor gets the same page with the actions gone, which is
          the case `head` is least interesting for. */}
      <Head option={head} signedIn />
      {belowHead}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <Identity
          person={person}
          option={identity}
          actions={
            <Acts
              person={person}
              option={block}
              viewer={viewer}
              menuOpen={menuOpen}
            />
          }
        />
        <Body person={person} option={body} />
      </main>
      <Foot />
    </div>
  );
}
