"use client";

import { type CSSProperties } from "react";
import { Clock, Mail, Trash2 } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { GALLERY_UNIFORM_COLUMNS } from "@/components/shared/masonry";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { JUST_ADDED, QUEUE, type QueueItem } from "./fixtures";
import { Pane, type ScreenId, StateChip } from "./page-parts";

/**
 * `host-lens` AND `expiry` — THE HOST'S QUEUE, AND WHAT DAY SEVEN DOES.
 *
 * ★ THE QUEUE'S GRID IS QUOTED, AND ONLY BECAUSE OF THE QUESTION.
 * `ReviewGrid` is `SelectableMediaGrid` with previews on and a uniform layout,
 * and it has no per-tile slot for anything but the video marker and the select
 * check — which is exactly what `host-lens` is asking to add. So the tiles
 * below are the shipped `MediaTile` in the shipped `GALLERY_UNIFORM_COLUMNS`
 * at the shipped tile aspect, under the shipped `FeedSectionHeader` (the amber
 * band a live review queue already wears), with the one thing the product does
 * not have drawn on top. Nothing else is invented.
 *
 * ★ WHY THE SPLIT IS A REAL DIFFERENCE AND NOT A SORT. Under `gate=held` an
 * unproven upload is `pending` for a reason that is not the host's: it clears
 * itself the moment a code is typed, and no tap of theirs can hurry it. A host
 * whose queue does not separate the two reads nine items of work when four of
 * them are not work at all — and on a moderation-OFF event, where the host
 * never asked to review anything, all of it is the machine's.
 */

/* ── the queue's tiles ───────────────────────────────────────────────────── */

/** `selectable-media-grid.tsx`'s own tile box, quoted at its uniform aspect. */
const TILE_BOX = "relative w-full overflow-hidden bg-black/10";
const TILE_STYLE = {
  aspectRatio: "4 / 5",
  borderRadius: "var(--radius-tile)",
} as CSSProperties;

function QueueTile({
  item,
  marked,
  deadline,
}: {
  item: QueueItem;
  /** Whether this tile says who sent it and whether they are proven. */
  marked: boolean;
  /** A day-seven countdown, for `expiry`. */
  deadline?: string;
}) {
  return (
    <div
      data-gv-tile
      data-gv-proven={item.proven ? "yes" : "no"}
      className={TILE_BOX}
      style={TILE_STYLE}
    >
      <MediaTile item={item.media} playBadge="none" />
      {marked && (
        <span
          data-gv-queue-mark
          className={cn(
            "absolute inset-x-1 bottom-1 flex items-center gap-1 rounded-full py-1 pr-1 pl-1",
            item.proven ? "bg-background/92" : "bg-warning/25 backdrop-blur-sm",
          )}
        >
          <Avatar size="sm" seed={item.seed} className="size-4 shrink-0">
            <AvatarFallback className="text-[8px]">
              {(item.who ?? "?").slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-[10px]">
            {item.who ?? "No name"}
          </span>
          <StateChip proven={item.proven} compact />
        </span>
      )}
      {deadline && !item.proven && (
        <span
          data-gv-deadline
          className="absolute inset-x-1 top-1 flex items-center justify-center gap-1 rounded-full bg-warning/90 px-1.5 py-0.5 text-[9px] font-medium text-background"
        >
          <Clock className="size-2.5" aria-hidden />
          {deadline}
        </span>
      )}
    </div>
  );
}

function Tiles({
  items,
  marked,
  deadlines,
}: {
  items: QueueItem[];
  marked: boolean;
  deadlines?: boolean;
}) {
  return (
    <div className={GALLERY_UNIFORM_COLUMNS}>
      {items.map((it) => (
        <QueueTile
          key={it.media.id}
          item={it}
          marked={marked}
          deadline={
            deadlines
              ? it.waitedHours > 100
                ? "1 day left"
                : `${7 - Math.floor(it.waitedHours / 24)} days left`
              : undefined
          }
        />
      ))}
    </div>
  );
}

/* ── host-lens ───────────────────────────────────────────────────────────── */

export type LensShape = "today" | "badge" | "split";

export const lensOf = (v: string | undefined): LensShape =>
  v === "badge" ? "badge" : v === "split" ? "split" : "today";

const PROVEN = QUEUE.filter((q) => q.proven);
const UNPROVEN = QUEUE.filter((q) => !q.proven);

function Approve() {
  return (
    <Button size="sm" variant="ghost">
      Approve all
    </Button>
  );
}

export function LensScreen({
  shape,
  screen,
}: {
  shape: LensShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  const body =
    shape === "split" ? (
      <div className="space-y-5">
        <section data-gv-pile="mine" className="space-y-2.5">
          <FeedSectionHeader
            label="Waiting for you"
            count={PROVEN.length}
            amber
            action={<Approve />}
          />
          <Tiles items={PROVEN} marked />
        </section>
        <section data-gv-pile="theirs" className="space-y-2.5">
          <FeedSectionHeader
            label="Waiting for an email"
            count={UNPROVEN.length}
          />
          <p
            data-gv-split-note
            className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-snug text-muted-foreground"
          >
            <Mail className="mt-px size-3.5 shrink-0" aria-hidden />
            Not your work. These go up by themselves the moment each guest taps
            their code, and nothing you do here makes that happen sooner.
          </p>
          <Tiles items={UNPROVEN} marked />
        </section>
      </div>
    ) : (
      <section data-gv-pile="mine" className="space-y-2.5">
        <FeedSectionHeader
          label="Review"
          count={QUEUE.length}
          amber
          action={<Approve />}
        />
        <Tiles items={QUEUE} marked={shape === "badge"} />
        {shape === "today" && (
          <p
            data-gv-today-note
            className="text-[11px] leading-snug text-muted-foreground"
          >
            Nine items. Four of them are waiting on a code, not on you, and
            there is nothing on this screen that says which four.
          </p>
        )}
      </section>
    );

  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      <div
        className={cn("mx-auto px-5 py-5", wide ? "max-w-5xl" : "max-w-full")}
      >
        <p className="mb-4 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Maya &amp; Jay&rsquo;s Wedding · Review
        </p>
        {body}
      </div>
    </div>
  );
}

/* ── expiry ──────────────────────────────────────────────────────────────── */

export type ExpiryShape = "seven" | "keep" | "host";

export const expiryOf = (v: string | undefined): ExpiryShape =>
  v === "keep" ? "keep" : v === "host" ? "host" : "seven";

/** What the guest is told at the moment they upload, which is the only moment
 *  a deadline can honestly be set. */
function GuestSide({ shape }: { shape: ExpiryShape }) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="mx-auto w-32">
        <div className={TILE_BOX} style={TILE_STYLE}>
          <div className="opacity-40 grayscale">
            <MediaTile item={JUST_ADDED} />
          </div>
          <span className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-full bg-background/95 px-1.5 py-1 text-[9px] font-medium text-warning">
            <Clock className="size-2.5" aria-hidden />
            {shape === "keep" ? "Waiting" : "6 days left"}
          </span>
        </div>
      </div>
      <p
        data-gv-told={shape === "keep" ? "no deadline" : "a deadline"}
        className="text-center text-[12px] leading-snug"
      >
        {shape === "seven" &&
          "Confirm within seven days or this comes down. We'll remind you on day six."}
        {shape === "keep" &&
          "It stays here until you confirm. No deadline, ever."}
        {shape === "host" &&
          "Confirm within seven days. After that it's just an anonymous photo, and Maya's own setting decides."}
      </p>
      <p className="mt-auto text-center text-[10px] leading-snug text-muted-foreground">
        {shape === "seven" &&
          "The one sentence Partyreel has to say out loud: we will delete your photograph."}
        {shape === "keep" &&
          "Nothing is ever destroyed. Nobody ever sees it either."}
        {shape === "host" &&
          "No new policy: the host already answered this question when they set up the event."}
      </p>
    </div>
  );
}

/** Day seven, on the host's side. */
function DaySeven({ shape }: { shape: ExpiryShape }) {
  if (shape === "host") {
    return (
      <div
        data-gv-doom="4 on this event, 0 on an open one"
        className="flex h-full flex-col gap-2 p-3"
      >
        <p className="text-[11px] leading-snug text-muted-foreground">
          The address is dropped and the upload becomes an ordinary anonymous
          one. The host&rsquo;s own switch, already set, decides what that
          means:
        </p>
        <div className="grid flex-1 grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-2.5">
            <p className="text-[11px] font-medium">Accounts required</p>
            <p className="text-[10px] text-muted-foreground">
              An untied upload was never allowed here.
            </p>
            <p className="mt-auto flex items-center gap-1 text-[11px] font-medium text-destructive">
              <Trash2 className="size-3" aria-hidden /> Removed
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-2.5">
            <p className="text-[11px] font-medium">Anonymous allowed</p>
            <p className="text-[10px] text-muted-foreground">
              Exactly what every other anonymous upload here is.
            </p>
            <p className="mt-auto flex items-center gap-1 text-[11px] font-medium text-success">
              Kept, in the album
            </p>
          </div>
        </div>
        <p
          data-gv-cap="52"
          className="rounded-lg bg-success/10 px-3 py-2 text-[11px] leading-snug text-success"
        >
          One rule, and the arbiter is a decision the host has already made.
        </p>
      </div>
    );
  }
  const seven = shape === "seven";
  return (
    <div
      data-gv-doom={seven ? "4 of the 4" : "none of the 4"}
      className="flex h-full flex-col gap-2 p-3"
    >
      <Tiles items={UNPROVEN} marked deadlines={seven} />
      <div className="mt-auto space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Storage · Maya, Free</span>
          <span>{seven ? "1.1 GB of 2 GB" : "1.3 GB of 2 GB"}</span>
        </div>
        <div
          data-gv-cap={seven ? "55" : "65"}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full rounded-full",
              seven ? "bg-foreground/60" : "bg-warning",
            )}
            style={{ width: seven ? "55%" : "65%" }}
          />
        </div>
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-[11px] leading-snug",
            seven
              ? "bg-destructive/10 text-destructive"
              : "bg-warning/10 text-warning",
          )}
        >
          {seven
            ? "Four photographs leave for good on day seven, including one from a guest who confirms on day eight."
            : "180 MB of a Free host's 2 GB is photographs nobody will ever see, counting against their cap for ever."}
        </p>
      </div>
    </div>
  );
}

export function ExpiryScreen({
  shape,
  screen,
}: {
  shape: ExpiryShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  return (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3 text-foreground",
        wide ? "grid-cols-[1fr_1.3fr]" : "grid-rows-[1fr_1.35fr]",
      )}
    >
      <Pane label="What the guest is told, at the upload">
        <GuestSide shape={shape} />
      </Pane>
      <Pane label="Day seven, on the host's side" tone="host">
        <DaySeven shape={shape} />
      </Pane>
    </div>
  );
}
