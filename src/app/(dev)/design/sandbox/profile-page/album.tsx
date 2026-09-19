"use client";

import { type ReactNode, useState } from "react";
import { AtSign, ImageUp } from "lucide-react";

import { GuestMasonry } from "@/components/guest/guest-masonry";
import { GuestList } from "@/components/social/guest-list";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";

import {
  ALBUM,
  type Chip,
  EVENT,
  GUESTS,
  GUESTS_WITH_HANDLES,
  MY_CHIP_INDEX,
  type Person,
} from "./fixtures";
import { Acts, Body, Foot, Head, Identity } from "./profile";

/**
 * THE ALBUM SIDE: where a person's name is BEFORE they have a page.
 *
 * Three of this board's decisions live here rather than on the profile, because
 * the guest list is where Partyreel actually publishes a person: `named` (who
 * is on it), `claim` (when a handle is offered) and `list` (how it draws when a
 * party is big). The shipped `GuestList` is ONE component for two surfaces on
 * purpose ("so the two can never drift"), so every option here that changes it
 * changes the host's event page and the guest's album at once, and the words on
 * each option say so.
 *
 * ★ `GuestList` IS THE REAL COMPONENT, imported and handed real-shaped items:
 * it is presentational (its only interactive part is a `Link` to `/u/<slug>`)
 * and it calls nothing. The two new shapes are drawn beside it rather than
 * through it, because a lab board may not edit a shipped component.
 */

const HEADING =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";

/** The album's own head, as the guest page draws it above the gallery. */
function AlbumHead() {
  return (
    <div className="space-y-1 px-5 pt-6">
      <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
      <p className="text-sm text-muted-foreground">
        Hosted by {EVENT.host} · {EVENT.dateLabel} · {EVENT.count} photos
      </p>
    </div>
  );
}

/** The album under everything, at the real masonry's real columns. Pointer
 *  events are off: a tile opens the shipped lightbox and its like control posts
 *  to a Server Function. */
function Album({ count = 8 }: { count?: number }) {
  return (
    <div className="pointer-events-none px-5">
      <GuestMasonry items={ALBUM.slice(0, count)} />
    </div>
  );
}

function Section({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className="mt-8 space-y-3 px-5">
      <h2 className="flex items-center gap-1.5">
        <span className={HEADING}>{label}</span>
        {count !== undefined && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

/* ── The list, three ways ────────────────────────────────────────────────── */

export type ListOption = "wrap" | "cap" | "faces";

const CAP = 12;

/**
 * The names in a sheet: the tail of the capped list, and the whole list behind
 * a row of faces. Both surfaces would open the same one.
 *
 * ★ QUOTED, NOT A `Dialog`. radix portals to the OWNING document's body, which
 * for a portalled frame is the lab page, so a real one would open over the
 * board rather than inside the picture. `fixed` here IS the frame's viewport.
 */
function NamesSheet({
  items,
  open,
  onClose,
}: {
  items: Chip[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        className={`max-h-[80vh] w-full max-w-lg overflow-y-auto p-6 ${floatingPanel}`}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="font-heading text-lg">Guests ({items.length})</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-4">
          <GuestList items={items} />
        </div>
      </div>
    </div>
  );
}

export function Guests({
  option,
  items = GUESTS,
}: {
  option: ListOption;
  items?: Chip[];
}) {
  const [open, setOpen] = useState(false);

  if (option === "faces") {
    const shown = items.slice(0, 6);
    return (
      <div data-pp-list>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <AvatarGroup>
            {shown.map((g) => (
              <Avatar key={g.id} size="sm">
                <AvatarImage src={g.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="text-[10px]">
                  {(g.displayName ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount className="size-6 text-[10px]">
              +{items.length - shown.length}
            </AvatarGroupCount>
          </AvatarGroup>
          <span className="text-sm text-muted-foreground">
            {items.length} guests added photos
          </span>
        </button>
        <NamesSheet items={items} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  }

  if (option === "cap" && items.length > CAP) {
    const rest = items.length - CAP;
    return (
      <div data-pp-list className="space-y-2">
        <GuestList items={items.slice(0, CAP)} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 items-center rounded-full border border-dashed border-border px-3 text-sm text-muted-foreground outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          +{rest} more
        </button>
        <NamesSheet items={items} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <div data-pp-list>
      <GuestList items={items} />
    </div>
  );
}

/**
 * The album with its guest list at the foot, which is where the list really
 * sits: between the photographs and the footer.
 *
 * ★ IT WEARS THE `named` ANSWER, because that is what staging it behind `named`
 * is for: picking "only people with a handle" turns this wedding's list of 24
 * into a list of 5, and a list of 5 does not wrap. Judging the shapes against a
 * membership he already ruled out would be judging a question that is closed.
 */
export function ListShowcase({
  option,
  membership,
}: {
  option: ListOption;
  membership: NamedOption;
}) {
  const items = membershipOf(membership);
  return (
    <>
      <Head option="today" signedIn />
      <AlbumHead />
      {/* ★ THE ALBUM IS CUT TO ONE ROW ON PURPOSE, and `lab:demo` is why: six
          tiles put the Guests section below the frame's own fold at 375, so the
          capped list and the row of faces drew the identical stage and the
          thing being judged was off screen in two options of three. The album
          above a guest list is context; the list is the evidence. The count in
          the head still says 214. */}
      <Album count={2} />
      <Section label="Guests" count={items.length}>
        <Guests option={option} items={items} />
      </Section>
      <div className="mt-8">
        <Foot />
      </div>
    </>
  );
}

/* ── Who is named ────────────────────────────────────────────────────────── */

export type NamedOption = "everyone" | "handles" | "optout";
export const namedOf = (v: string | undefined): NamedOption =>
  v === "handles" || v === "optout" ? v : "everyone";

/** Who the list holds under a given answer to `named`. The opt-out option is
 *  everyone until somebody uses the switch, which is the honest picture of it. */
export const membershipOf = (option: NamedOption): Chip[] =>
  option === "handles" ? GUESTS_WITH_HANDLES : GUESTS;

/**
 * The sentence on /features/guests, quoted at its own type. It is on this frame
 * because it is half the decision: today the album names twenty-four people and
 * the marketing page promises that skipping a handle keeps you invisible, and
 * exactly one of the two has to move.
 */
function Promise_({ option }: { option: NamedOption }) {
  const copy =
    option === "everyone"
      ? "Claim a handle and you get a public page that carries your name from event to event. Skip it and your name still appears on the albums you add photos to, with no page behind it."
      : option === "handles"
        ? "Profiles are optional and opt-in. Claim a handle and you get a public page that carries your name from event to event; skip it and nothing about you is public at all."
        : "Profiles are optional and opt-in. Claim a handle and you get a public page that carries your name from event to event; skip it, or switch yourself off any guest list, and nothing about you is public at all.";
  return (
    <div className="mt-8 border-t border-border/60 px-5 pt-5">
      <p className={HEADING}>On the features page</p>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">{copy}</p>
    </div>
  );
}

/**
 * ★ NO PHOTOGRAPHS ON THIS ONE, AND `lab:demo` IS WHY. This decision carries TWO
 * surfaces in one phone column, the album's guest list and the sentence on the
 * features page, and the sentence is half of it. With even one row of album
 * above them, twenty-four chips pushed the sentence past 812px and the frame
 * for "everyone" and the frame for "one switch that removes you" came out
 * identical. The album above a guest list is context; here it costs the
 * evidence, so the head says what album this is and the photographs stay off.
 */
export function NamedShowcase({ option }: { option: NamedOption }) {
  const items = membershipOf(option);
  return (
    <>
      <AlbumHead />
      <Section label="Guests" count={items.length}>
        <Guests option="wrap" items={items} />
        {option === "optout" && (
          <p className="pt-1 text-xs text-muted-foreground">
            You can take your name off every guest list from your account.
          </p>
        )}
      </Section>
      <Promise_ option={option} />
    </>
  );
}

/* ── When the handle is offered ──────────────────────────────────────────── */

export type ClaimOption = "account" | "after" | "inline";

/** The shipped handle card, quoted at the foot of the account page. Its live
 *  control debounces a signed-in Server Function on every keystroke, so it is
 *  drawn at rest rather than mounted. */
function AccountCard() {
  return (
    <div className="mx-5 mt-6 rounded-xl border border-border p-5">
      <p className="font-heading text-subsection">Your handle</p>
      <p className="mt-1 text-sm text-muted-foreground">
        A public page at partyreel.com/u/yourname.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex h-9 flex-1 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
          partyreel.com/u/
        </div>
        <Button size="sm">Save</Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Handles are part of Pro.
      </p>
    </div>
  );
}

/** The offer as it would read after an upload lands: the one moment a person
 *  has ever cared what their name does on Partyreel. */
function AfterUpload() {
  const [taken, setTaken] = useState(false);
  return (
    <div className="mx-5 mt-4 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <ImageUp
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          {taken
            ? "Your handle is yours. Your name on this album is now a link."
            : "Your 12 photos are on this album under your name."}
        </p>
        {!taken && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Claim a handle and that name becomes a page.
          </p>
        )}
      </div>
      {!taken && (
        <Button size="sm" variant="outline" onClick={() => setTaken(true)}>
          Claim
        </Button>
      )}
    </div>
  );
}

/** The offer on the one chip that is the viewer's own, which nobody else sees. */
function OwnChip({ others: pool }: { others: Chip[] }) {
  const mine = GUESTS[MY_CHIP_INDEX];
  const others = pool.filter((g) => g.id !== mine.id).slice(0, 7);
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        className="flex h-8 items-center gap-2 rounded-full border border-dashed border-foreground/40 py-1 pr-3 pl-1 text-sm text-foreground outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Avatar size="sm">
          <AvatarFallback className="text-[10px]">
            {(mine.displayName ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate">{mine.displayName}</span>
        <AtSign className="size-3.5 opacity-70" aria-hidden />
      </button>
      <GuestList items={others} />
    </div>
  );
}

export function ClaimShowcase({
  option,
  membership,
}: {
  option: ClaimOption;
  membership: NamedOption;
}) {
  const items = membershipOf(membership);
  if (option === "account") {
    return (
      <>
        <Head option="today" signedIn />
        <div className="px-5 pt-6">
          <h1 className="font-heading text-page">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything about you, four cards down.
          </p>
        </div>
        <AccountCard />
        <p className="mt-4 px-5 text-xs text-muted-foreground">
          Nothing on the album, in the upload, or in any email says a handle
          exists.
        </p>
      </>
    );
  }

  if (option === "after") {
    return (
      <>
        <AlbumHead />
        <AfterUpload />
        <Album count={2} />
      </>
    );
  }

  return (
    <>
      <AlbumHead />
      {/* One row: the marked chip is the evidence, and four tiles put the
          Guests section below this short frame's own fold. */}
      <Album count={2} />
      {/* The count is the real membership: the viewer's own chip is already
          in it, and the chips below are simply what the row holds. */}
      <Section label="Guests" count={items.length}>
        <div data-pp-list>
          <OwnChip others={items} />
        </div>
        <p className="pt-1 text-xs text-muted-foreground">
          Only you see the mark on your own chip.
        </p>
      </Section>
    </>
  );
}

/* ── The album when a person has no page at all ──────────────────────────── */

/** `exists: none`: the same list, with nothing behind any name. */
export function NoPage() {
  const flat: Chip[] = GUESTS.map((g) => ({ ...g, slug: null }));
  return (
    <>
      <Head option="today" signedIn />
      <AlbumHead />
      {/* One row: the unlinked chips are the evidence and six tiles put them
          below the frame's own fold at 375. */}
      <Album count={2} />
      <Section label="Guests" count={flat.length}>
        <Guests option="wrap" items={flat} />
      </Section>
      <div className="mt-8">
        <Foot />
      </div>
    </>
  );
}

/* ── A person with no address ────────────────────────────────────────────── */

/**
 * `exists: card`. The same person, over the album they were met on, with no URL
 * of their own: a sheet that rises when a chip is tapped and is gone when it is
 * dismissed. Nothing to share, nothing for a search engine to index, and a
 * handle that is a name rather than a link.
 *
 * It carries the identity block and the body VERBATIM from the page (they are
 * the same components), which is the honest comparison: what a card costs is
 * not its contents, it is the address.
 */
export function CardSheet({ person }: { person: Person }) {
  return (
    <>
      <Head option="today" signedIn />
      <AlbumHead />
      <Album count={6} />
      <Section label="Guests" count={GUESTS.length}>
        <Guests option="wrap" />
      </Section>
      <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/50">
        <div
          className={`max-h-[78%] overflow-y-auto rounded-t-2xl px-5 pt-5 pb-8 ${floatingPanel}`}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <Identity
            person={person}
            option="today"
            actions={
              <Acts person={person} option="overflow" viewer="stranger" />
            }
          />
          <Body person={person} option="events" />
        </div>
      </div>
    </>
  );
}
