"use client";

import { ArrowRight, Check, Images, Link2Off, ShieldAlert, Smartphone } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { CASES, PASSED, RETURNING } from "./fixtures";
import type { AddressShape } from "./address";
import { ClaimedSlot, FrameNote, Pane, type ScreenId } from "./page-parts";

/**
 * `collision` -- HIS CASE 2, AND THE STAGE OF EVERYTHING ELSE HE ASKED.
 *
 * His words: "I'm not logged in, enter my email I've used before at a different
 * event as a guest. Am I uploading as me, or do I need to prove it with log in?"
 *
 * ★ CASES 1 AND 3 ARE NOT ASKED HERE, AND THAT IS THE POINT. Both were settled
 * by the key at round one and are drawn on the stage as FACTS: nothing is
 * reassigned because nothing was assigned, and two devices are two sessions
 * whatever string they share. Re-asking a settled case is how a board spends a
 * reviewer's minute on work already done.
 *
 * ★ THE ORACLE IS REAL AND IS DRAWN FOR ITS COST. `require` is the only answer
 * that tells the person at the door whether an address has an account here,
 * which is exactly the fact every other door in this product is built to
 * withhold: `signInWithPassword` answers a wrong password, a Google-only
 * account and an unknown address with ONE sentence, and "already had an
 * account" is decided server-side AFTER the code, under a create intent
 * (auth-accounts.md). `require` reopens that at the one door a stranger can
 * reach without an account.
 *
 * ★ AND THE ANSWER DEPENDS ON DECISION ONE, so the frame reads the board's own
 * state rather than pretending otherwise: under `address=none` nobody types an
 * address at the door, so there is nothing to collide with and `offer` is the
 * only reachable answer. The other two presuppose a typed address, and the
 * frame says so rather than drawing a door that cannot exist.
 */

export type CollisionShape = "offer" | "label" | "require";

export const collisionOf = (v: string | undefined): CollisionShape =>
  v === "label" ? "label" : v === "require" ? "require" : "offer";

/* -- what Jo meets tonight ------------------------------------------------ */

function JoTonight({ shape }: { shape: CollisionShape }) {
  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2">
        <Avatar size="lg" seed={RETURNING.tonight.seed}>
          <AvatarFallback className="text-xs">J</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[12px] font-medium">{RETURNING.tonight.label}</p>
          <p className="text-[10px] text-muted-foreground">
            Not signed in. Her account already holds{" "}
            {RETURNING.account.uploads} photos from{" "}
            {RETURNING.account.events} other events.
          </p>
        </div>
      </div>

      {shape === "offer" && (
        <div
          data-gv-door="offer"
          className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
        >
          <p className="flex items-center gap-1.5 text-[12px] font-medium">
            <Images className="size-3.5 shrink-0" aria-hidden />
            Keep your photos together?
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Sign in and tonight&rsquo;s {RETURNING.tonight.uploads} join
            everything else you have added. Your photos are already in the album
            either way.
          </p>
          <Button size="sm" className="w-full">
            Sign in
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
          <p className="flex items-start gap-1 text-[10px] leading-snug text-success">
            <Check className="mt-px size-2.5 shrink-0" aria-hidden />
            Offered to every guest after their first photograph lands, whether
            or not an account exists. It reveals nothing, because it is not a
            reaction to anything.
          </p>
        </div>
      )}

      {shape === "label" && (
        <div
          data-gv-door="label"
          className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
        >
          <p className="text-[12px] font-medium">Added as Jo</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ClaimedSlot address={RETURNING.address} />
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Nothing is offered and nothing is said. The session carries the
            label; the day she signs in from this phone, the code merges
            tonight&rsquo;s {RETURNING.tonight.uploads} into her account.
          </p>
          <p className="flex items-start gap-1 text-[10px] leading-snug text-warning">
            <Link2Off className="mt-px size-2.5 shrink-0" aria-hidden />
            From any other phone the merge never happens, and she is never told
            that it could have.
          </p>
        </div>
      )}

      {shape === "require" && (
        <div
          data-gv-door="require"
          className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5"
        >
          <p className="text-[12px] font-medium">
            That address already has an account
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Enter the code we just sent to {RETURNING.address} to add photos as
            yourself.
          </p>
          <Input readOnly className="h-9 text-center text-[13px]" defaultValue="" placeholder="· · · · · ·" />
          <p className="flex items-start gap-1 text-[10px] leading-snug text-destructive">
            <ShieldAlert className="mt-px size-2.5 shrink-0" aria-hidden />
            Anyone can now test whether an address has an account here by typing
            it at a QR code, and a guest whose mail fails is back to being
            blocked at the party.
          </p>
        </div>
      )}

      <p className="mt-auto text-[10px] leading-snug text-muted-foreground">
        Jo&rsquo;s {RETURNING.tonight.uploads} photographs are in Maya&rsquo;s
        album on all three answers. What moves is whether they ever become part
        of hers, and what the door gave away to make it happen.
      </p>
    </div>
  );
}

/* -- the passed phone, drawn as a confirmation ---------------------------- */

function PassedPhone() {
  return (
    <div
      data-gv-case="passed-phone"
      className="space-y-2 rounded-lg border border-border px-2.5 py-2"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-medium">
        <Smartphone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        The passed phone, and why the claim is never silent
      </p>
      <p className="text-[11px] leading-snug">
        Keep the {PASSED.length} photos added from this phone as yours?
      </p>
      <div className="flex gap-1">
        {PASSED.map((m) => (
          <div
            key={m.id}
            className="w-10 shrink-0 overflow-hidden rounded-[var(--radius-tile)]"
          >
            <MediaTile item={m} playBadge="none" />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" className="flex-1">
          Keep them
        </Button>
        <Button size="sm" variant="ghost" className="flex-1">
          Not mine
        </Button>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        A venue&rsquo;s iPad, or a phone handed round, still holds the previous
        guest&rsquo;s tokens. Declining leaves every row exactly where it was.
      </p>
    </div>
  );
}

/* -- the stage ------------------------------------------------------------ */

function Stage() {
  return (
    <div className="space-y-2 p-3">
      {CASES.filter((c) => c.settled).map((c) => (
        <div
          key={c.id}
          data-gv-case={c.id}
          className="space-y-1 rounded-lg border border-border px-2.5 py-2"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-medium">
            <Check className="size-3 shrink-0 text-success" aria-hidden />
            {c.title}
          </p>
          {c.his && (
            <p className="border-l-2 border-border pl-2 text-[10px] leading-snug text-muted-foreground italic">
              {c.his}
            </p>
          )}
          <p className="text-[10px] leading-snug">{c.answer}</p>
          <p className="text-[10px] leading-snug text-muted-foreground">
            {c.note}
          </p>
        </div>
      ))}
      <PassedPhone />
      {CASES.filter((c) => c.id === "host-lightbox").map((c) => (
        <div
          key={c.id}
          data-gv-case={c.id}
          className="space-y-1 rounded-lg border border-warning/40 bg-warning/5 px-2.5 py-2"
        >
          <p className="text-[11px] font-medium">{c.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>Added by Sam</span>
            <ClaimedSlot address="sam.here@example.com" />
          </div>
          <p className="text-[10px] leading-snug">{c.answer}</p>
          <p className="text-[10px] leading-snug text-muted-foreground">
            {c.note}
          </p>
        </div>
      ))}
    </div>
  );
}

export function CollisionScreen({
  shape,
  screen,
  address,
}: {
  shape: CollisionShape;
  screen: ScreenId;
  /** Decision one's current answer: it decides whether this one is reachable. */
  address: AddressShape;
}) {
  const wide = screen === "1440";
  const unreachable = address === "none" && shape !== "offer";
  return (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3 text-foreground",
        wide ? "grid-cols-[1fr_1.1fr] grid-rows-[1fr_auto]" : "grid-rows-[1fr_1fr_auto]",
      )}
    >
      <Pane
        label="Jo, back at a second party, not signed in"
        tone={shape === "require" ? "warn" : "plain"}
      >
        <JoTonight shape={shape} />
      </Pane>
      <Pane label="The cases, settled and drawn as fact" tone="good">
        <div className="h-full overflow-y-auto">
          <Stage />
        </div>
      </Pane>
      <div className={cn(wide && "col-span-2")}>
        <FrameNote
          label={unreachable ? "Not reachable under decision one" : "Under decision one"}
          tone={unreachable ? "warn" : "plain"}
        >
          {unreachable
            ? "address=none means nobody types an address at the door, so there is nothing here to collide with and this answer cannot be built. It is drawn so its cost can be read against the one that can."
            : address === "none"
              ? "address=none is the answer on the dock: nobody types an address at the door, so the offer is the only shape this question can take, and it reveals nothing because it is offered to everyone."
              : "A typed address exists on the dock's answer to decision one, so all three shapes here can be built. Only one of them keeps the door silent about what accounts exist."}
        </FrameNote>
      </div>
    </div>
  );
}
