"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, UserCheck, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EVENT, GUESTS, HOST, PRIYA } from "./fixtures";
import { HandleGlyph, SettledMark } from "./scene";

/**
 * THE PIECES EACH DECISION DRAWS, IN PARTS, SO ONLY ONE OF THEM MOVES.
 *
 * ★ NOTHING HERE CALLS A SERVER FUNCTION OR MOUNTS A RADIX PORTAL. `FollowButton`,
 * `SaveEventButton`, `ClaimHandlePrompt`'s session read and `AccountDoor`'s magic
 * link all open with the network or a Supabase session, and a Popover, Dialog,
 * Sheet or DropdownMenu opened inside a portalled lab frame renders on the LAB
 * PAGE, not the phone being judged (`scene.tsx`'s own note; `host-curation`
 * names the same landmine for its lightbox). So every control below that looks
 * pressable is LOCAL STATE, the shipped icons, variants and words verbatim
 * (`profile-page`'s own fork of `FollowButton` is the precedent), and every
 * open popover, sheet or menu is QUOTED markup rather than a mounted primitive.
 * The Unverified mark is quoted the same way: the shipped one is a Popover.
 *
 * ★ THE WORDS ARE THE SHIPPED WORDS. The offer, the moment and the door all say
 * what confirming keeps: the event and every photograph, in her account (her
 * dashboard, where she comes back to it). Never "on your profile": a profile
 * publishes nothing until its owner chooses it, so a line promising one would
 * be drawing a product that does not exist.
 */

/* ── a follow button that moves a picture, never a row ──────────────────── */

export function LocalFollowButton({ initial = false }: { initial?: boolean }) {
  const [following, setFollowing] = useState(initial);
  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={() => setFollowing((v) => !v)}
      aria-pressed={following}
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}

/* ── the offer, before she has confirmed anything (`moment`, `shape`) ────── */

/** `save-account-prompt.tsx`'s own words, the heading counting the way it
 *  does: singular for exactly one photograph, plural otherwise. */
const offerWords = (count: number) => ({
  heading: count === 1 ? "Keep this photo" : "Keep these photos",
  body: `Confirm your email and ${
    count === 1 ? "it stays" : `all ${count} stay`
  } with you: this event in your account, and everything you added to it.`,
});

/** As shipped: the bordered card in the words column's post-upload slot. */
export function OfferCard({ count }: { count: number }) {
  const words = offerWords(count);
  return (
    <div
      data-media-tile
      data-gc-offer="card"
      className="rounded-xl border border-border bg-card p-5 text-center"
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bookmark className="size-5" />
      </div>
      <p className="font-heading text-subsection">{words.heading}</p>
      <p className="mx-auto mt-1 mb-4 max-w-xs text-reading text-muted-foreground">
        {words.body}
      </p>
      <div className="flex justify-center">
        <Button size="default">Confirm your email</Button>
      </div>
      <button
        type="button"
        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Maybe later
      </button>
    </div>
  );
}

/** A line under the photograph it is about, no card built around it. It
 *  rides inside her newest tile's own column block (`AlbumStrip`'s caption),
 *  so it is exactly as wide as that column: the cost of this shape, drawn. */
export function OfferCaption({ count }: { count: number }) {
  return (
    <p
      data-gc-offer="inline"
      className="text-working text-pretty text-muted-foreground"
    >
      {count === 1 ? "Yours, unverified." : `Yours, ${count} unverified.`}{" "}
      <button
        type="button"
        className="font-medium text-foreground underline underline-offset-4"
      >
        Confirm your email
      </button>{" "}
      to keep {count === 1 ? "it" : "them"}.
    </p>
  );
}

/** The last screen of the door's own sheet. The sheet she sent her first
 *  photograph from is the welcome sheet itself (welcome, then her name with
 *  the optional email under it, then the first upload), held with no exit:
 *  the album has not been shown to her yet, so there is nothing to "take her
 *  to" and a dismiss may never read as one. Quoted (a real Sheet would portal
 *  to the lab page, not this frame): `ui/sheet.tsx`'s own classes, copied
 *  rather than mounted, pinned to this frame's own foot.
 *
 *  ★ `fixed`, NEVER `absolute` (`host-curation`'s own landmine, verbatim in
 *  its stylesheet: "the frame IS the viewport... an absolute box inside a
 *  min-h-full column pins to the bottom of the CONTENT instead, which put it
 *  off the bottom of the picture"). `position: fixed` resolves against the
 *  iframe's own viewport regardless of whether an ancestor's height ever
 *  resolves, which is the only thing that keeps this pinned to the frame's
 *  true foot rather than to wherever the content above it happens to end. */
export function OfferSheet({ count }: { count: number }) {
  const words = offerWords(count);
  return (
    <div data-gc-offer="sheet" className="fixed inset-0">
      <div className="absolute inset-0 bg-black/10" />
      <div className="fixed inset-x-0 bottom-0 flex flex-col gap-4 border-t border-border bg-popover bg-clip-padding text-popover-foreground shadow-layer">
        <div className="flex flex-col gap-0.5 p-4">
          <p className="font-heading text-card-title font-medium text-foreground">
            Sent
          </p>
          <p className="text-sm text-muted-foreground">
            {count === 1 ? "Your photo joined" : `Your ${count} photos joined`}{" "}
            {EVENT.host}&rsquo;s album.
          </p>
        </div>
        <div className="px-4 pb-2 text-center">
          <p className="font-heading text-subsection">{words.heading}</p>
          <p className="mx-auto mt-1 max-w-xs text-reading text-muted-foreground">
            {words.body}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2 p-4">
          <Button size="default" className="w-full">
            Confirm your email
          </Button>
          {/* No exit (verbatim: "Including 'just browsing'
              defeats this entire purpose... No exit."): the quiet dismiss
              reads exactly as the same ask's own words do everywhere else it
              is drawn (`OfferCard`'s "Maybe later"), never as a door out of
              an album she is not yet holding. */}
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── the moment, once she has confirmed (`follow`, and the ground `name`
      holds steady while it asks something else) ─────────────────────────── */

export function MomentCard({
  count,
  hostFollow,
  handleRow = true,
}: {
  count: number;
  /** Mirrors the `follow` ask's own option ids: "card", the card's own host
   *  row, as shipped; "list", no row here, a line sends her to the list
   *  under the album; "jump", the host's name is a link to her profile
   *  instead of a button on this card. */
  hostFollow: "card" | "list" | "jump";
  /** The shipped card's handle line. Whether the card invites a page at all
   *  is `identity-profile.prompt`'s question; it is drawn as shipped. */
  handleRow?: boolean;
}) {
  return (
    <div
      data-media-tile
      data-gc-moment
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <SettledMark />
        <div className="min-w-0">
          <p className="font-heading text-subsection">
            {count === 1 ? "Your photo is safe" : "Your photos are safe"}
          </p>
          <p className="mt-0.5 text-reading text-pretty text-muted-foreground">
            {count === 1
              ? "It is in your account now, and this event came with it."
              : `All ${count} are in your account now, and this event came with them.`}
          </p>
        </div>
      </div>

      {hostFollow === "card" && (
        <div
          data-gc-follow="card"
          className="flex items-center justify-between gap-3 border-t border-border/60 pt-4"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar seed={HOST.seed} size="sm">
              <AvatarFallback>{HOST.displayName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-reading font-medium">
                {HOST.displayName}
              </span>
              <span className="block text-working text-muted-foreground">
                Your host
              </span>
            </span>
          </span>
          <LocalFollowButton />
        </div>
      )}

      {hostFollow === "list" && (
        <p className="border-t border-border/60 pt-4 text-reading text-pretty text-muted-foreground">
          {HOST.displayName} leads the Guests list under the album, with a
          Follow beside her name.
        </p>
      )}

      {hostFollow === "jump" && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar seed={HOST.seed} size="sm">
              <AvatarFallback>{HOST.displayName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 text-reading text-muted-foreground">
              Hosted by{" "}
              <Link
                href={`/u/${HOST.slug}`}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {HOST.displayName}
              </Link>
            </span>
          </span>
        </div>
      )}

      {handleRow && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground">
            <HandleGlyph className="mt-0.5" />
            Claim a handle and your name becomes a page.
          </p>
          <Button size="sm" variant="outline" className="shrink-0">
            Claim
          </Button>
        </div>
      )}
    </div>
  );
}

/** The Unverified mark on a chip, quoted: `unverified-mark.tsx`'s `paper`
 *  tone (a dot in a small disc), without the Popover it opens in the product. */
function QuotedMark() {
  return (
    <span
      role="img"
      aria-label="Unverified"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted"
    >
      <span aria-hidden className="size-1 rounded-full bg-muted-foreground" />
    </span>
  );
}

/** The named Guests section, real chips in the real shape, with Maya folded
 *  in as its first entry when the `follow` decision asks for that (`hostFirst`).
 *  A local fork rather than the shipped `GuestList`: that component's own
 *  Follow row is the real `FollowButton` and its mark is a real Popover, so a
 *  board that wants either pressable forks the chip too (the same reason
 *  `profile-page` forked it).
 *
 *  ★ THE SHIPPED ORDER AND THE SHIPPED RULES: confirmed accounts first, each
 *  in its own colour, linking only where it has a handle and offering a Follow
 *  only there (never on the viewer's own chip); then every typed name, on the
 *  plain disc with the mark, linking nowhere and offering nothing. */
export function GuestsSection({ hostFirst }: { hostFirst: boolean }) {
  const chip =
    "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";
  return (
    <div data-gc-guests className="space-y-2 border-t border-border/60 pt-4">
      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Guests
      </p>
      <ul className="flex flex-wrap items-center gap-1.5">
        {hostFirst && (
          <li data-gc-follow="list" className="flex items-center gap-1.5">
            <span className={cn(chip, "text-foreground")}>
              <Avatar seed={HOST.seed} size="sm">
                <AvatarFallback className="text-[10px]">
                  {HOST.displayName.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-40 truncate">{HOST.displayName}</span>
              <span
                className={cn(
                  "flex h-5 items-center rounded-full px-1.5 text-[10px] font-medium text-white",
                  GLASS_MARK,
                )}
              >
                Host
              </span>
            </span>
            <LocalFollowButton />
          </li>
        )}
        {GUESTS.map((g) => {
          const face = (
            <Avatar seed={g.seed ?? undefined} size="sm">
              <AvatarFallback className="text-[10px]">
                {g.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          );
          if (g.kind === "unverified") {
            return (
              <li key={g.name}>
                <span className={cn(chip, "text-muted-foreground")}>
                  {face}
                  <span className="max-w-40 truncate">{g.name}</span>
                  <QuotedMark />
                </span>
              </li>
            );
          }
          return (
            <li key={g.name} className="flex items-center gap-1.5">
              {g.slug ? (
                <Link
                  href={`/u/${g.slug}`}
                  className={cn(chip, "text-foreground")}
                >
                  {face}
                  <span className="max-w-40 truncate">{g.name}</span>
                </Link>
              ) : (
                <span className={cn(chip, "text-muted-foreground")}>
                  {face}
                  <span className="max-w-40 truncate">{g.name}</span>
                </span>
              )}
              {g.slug && !g.self && <LocalFollowButton />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── what the typed name becomes (`name`) ─────────────────────────────────── */

/** The step the `confirm` option ADDS, drawn in the moment card's slot: what
 *  stands there is the new thing, and the moment card itself (unchanged) is
 *  what follows once she submits it. The handle is not in it: when and how a
 *  page is set up is `identity-profile.setup`'s question. */
export function NameStepCard() {
  const [name, setName] = useState<string>(PRIYA.name);
  return (
    <div
      data-media-tile
      data-gc-namestep="confirm"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <p className="font-heading text-subsection">Is this right?</p>
        <p className="mt-0.5 text-reading text-pretty text-muted-foreground">
          You typed this at the door. It becomes your name everywhere you add
          photos from now on.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gc-name">Name</Label>
        <Input
          id="gc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button size="default" className="w-full">
        Save and continue
      </Button>
    </div>
  );
}
