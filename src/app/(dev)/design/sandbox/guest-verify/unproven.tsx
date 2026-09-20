"use client";

import { type CSSProperties } from "react";
import { BadgeCheck, Clock, EyeOff, MailWarning } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import {
  GALLERY_UNIFORM_COLUMNS,
  MasonryColumns,
} from "@/components/shared/masonry";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { doorFailure } from "@/lib/auth/door-failure";
import { cn } from "@/lib/utils";

import { ALBUM, PEOPLE, QUEUE, UNPROVEN_COUNT } from "./fixtures";
import {
  ClaimedSlot,
  EventBlock,
  FrameNote,
  GUTTER,
  type MarkShape,
  Pane,
  PersonAvatar,
  type ScreenId,
  StateChip,
} from "./page-parts";

/**
 * `unproven` -- WHERE UNPROVEN CONTENT GOES AND WHAT IT LOOKS LIKE.
 *
 * ★ TWO OF HIS HELD RULINGS MEET HERE, so two of the three answers change one
 * and say so on their own frame. `gate=after` put the photograph in the album
 * straight away; `badge=mark` put a mark on the avatar where guests read it,
 * with his two corrections in the same breath ("Rather than a warning icon,
 * this could be more subtle" and "When the icon/mark is hovered, a tooltip
 * should clarify what it means"). `shown-marked` is both rulings drawn.
 * `shown-plain` keeps `gate=after` and drops `badge=mark`. `held` keeps
 * `badge=mark` and changes `gate=after` for GUESTS, and that is written on it.
 *
 * ★ HIS OWN REASON FOR THE MARK IS THE STRONGEST ARGUMENT ON THE BOARD, and it
 * is not a safety argument: "I'm expecting a guest to see themselves as marked
 * as unverified publicly and want to correct that immediately by verifying."
 * The mark is a prompt aimed at the one person who can clear it. So it is drawn
 * on every surface he named (the tile, the guest list, the pop-up when a guest
 * is tapped, the profile) and its tap is the door, not an explanation.
 *
 * ★ THE THINGS BELOW ARE FRAME NOTES, NOT OPTIONS, because each one is a
 * consequence rather than a choice: the host's per-event switch (his own
 * "Displaying photos from unverified guests in the public guest album could be
 * an event setting") is the two positions `shown` and `held` and nothing else;
 * the host's vouch clears a mark inside one event and grants nothing anywhere;
 * `expiry` follows from the answer rather than being asked again (under
 * `shown-*` nothing is pending, so nothing can expire; under `held` the day
 * seven rule applies and his `expiry=host` decides it); and "the code did not
 * come" is the shipped failure table, imported rather than written, because
 * inventing that copy here is how two doors drift apart.
 */

export type UnprovenShape = "shown-marked" | "shown-plain" | "held";

export const unprovenOf = (v: string | undefined): UnprovenShape =>
  v === "shown-plain"
    ? "shown-plain"
    : v === "held"
      ? "held"
      : "shown-marked";

/** How each answer marks a GUEST's screen. The host's is always marked. */
const GUEST_MARK: Record<UnprovenShape, MarkShape> = {
  "shown-marked": "mark",
  "shown-plain": "none",
  held: "mark",
};

const TILE_BOX = "relative w-full overflow-hidden bg-black/10";
const TILE_STYLE = {
  aspectRatio: "4 / 5",
  borderRadius: "var(--radius-tile)",
} as CSSProperties;

/* -- the guest's album ---------------------------------------------------- */

/** The four tiles from unproven sessions, drawn where the answer puts them. */
const UNPROVEN_TILES = ALBUM.slice(0, 4);
const PROVEN_TILES = ALBUM.slice(4, 16);
/** Which tiles in the drawn album came from a session that proved nothing. */
const unprovenIds = new Set(UNPROVEN_TILES.map((m) => m.id));

/** A subtle corner mark on a tile: the same dot the avatar wears, at tile size. */
function TileMark() {
  return (
    <span
      data-gv-tile-mark
      aria-label="From a guest who has not confirmed"
      className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-background/90"
    >
      <span className="size-1.5 rounded-full bg-warning/80" />
    </span>
  );
}

function AlbumSide({ shape }: { shape: UnprovenShape }) {
  const held = shape === "held";
  const marked = shape === "shown-marked";
  const shown = held ? PROVEN_TILES : [...UNPROVEN_TILES, ...PROVEN_TILES];
  return (
    <div className="h-full overflow-y-auto">
      <div className={cn("pt-3 pb-2", GUTTER)}>
        <EventBlock count={shown.length} />
      </div>
      {held && (
        <div className={cn("pb-2", GUTTER)}>
          <p
            data-gv-waiting={String(UNPROVEN_TILES.length)}
            className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground"
          >
            <EyeOff className="size-3 shrink-0" aria-hidden />
            {UNPROVEN_TILES.length} more waiting on their owners
          </p>
        </div>
      )}
      {/* ★ THE SHIPPED GRID, WITH THE ONE THING IT DOES NOT HAVE. `GuestMasonry`
          has no per-tile slot for a mark (that IS the question), and adding one
          would be an edit in the guest lane's file. `MasonryColumns` is the grid
          underneath it and already carries `renderOverlay`, so every unproven
          tile wears the mark rather than one standing in for four. */}
      <div data-gv-album className={GUTTER}>
        <MasonryColumns
          items={shown}
          renderOverlay={(item) =>
            marked && unprovenIds.has(item.id) ? <TileMark /> : null
          }
        />
      </div>
      <div className={cn("py-3", GUTTER)}>
        <p
          data-gv-album-says={
            held ? "nothing unproven" : marked ? "marked" : "plain"
          }
          className="text-[10px] leading-snug text-muted-foreground"
        >
          {held &&
            "Nothing unproven is on this screen. A guest scrolling the album cannot tell that anything is missing, except for the one line above."}
          {marked &&
            "The four tiles from unproven sessions are here, live, each wearing the same small dot the avatar wears. Tapping it opens the door."}
          {shape === "shown-plain" &&
            "The four tiles from unproven sessions are here, live, and nothing on a guest's screen says which four. The host's queue still does."}
        </p>
      </div>
    </div>
  );
}

/* -- the people surfaces his note named ----------------------------------- */

/** The faces row, the tapped pop-up and a profile: his three named surfaces. */
function PeopleSide({ shape }: { shape: UnprovenShape }) {
  const mark = GUEST_MARK[shape];
  const sam = PEOPLE[1];
  return (
    <div className="space-y-2.5 p-3">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          The album&rsquo;s faces row
        </p>
        <div data-gv-guest className="flex items-center gap-3">
          <AvatarGroup>
            {PEOPLE.slice(0, 6).map((p) => (
              <PersonAvatar key={p.id} person={p} shape={mark} />
            ))}
            <AvatarGroupCount className="size-6 text-[10px]">
              +{PEOPLE.length - 6}
            </AvatarGroupCount>
          </AvatarGroup>
          <span className="text-[11px] text-muted-foreground">
            {PEOPLE.length} guests added photos
          </span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Tapped, the pop-up
          </p>
          <div className="flex items-center gap-2">
            <PersonAvatar person={sam} shape={mark} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium">{sam.name}</p>
              {mark === "mark" ? (
                <p className="flex items-center gap-1 text-[10px] text-warning">
                  <Clock className="size-2.5 shrink-0" aria-hidden />
                  Email not confirmed
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  6 photos at this event
                </p>
              )}
            </div>
          </div>
          {mark === "mark" && (
            <Button size="sm" variant="secondary" className="mt-2 w-full">
              That&rsquo;s me. Confirm now
            </Button>
          )}
        </div>
        <div className="rounded-lg border border-border p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Their profile page
          </p>
          <div className="flex items-center gap-2">
            <PersonAvatar person={sam} shape={mark} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium">{sam.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {mark === "mark"
                  ? "Guest at 1 event, unconfirmed"
                  : "Guest at 1 event"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p
        data-gv-marked-people={
          mark === "mark" ? String(UNPROVEN_COUNT) : "0"
        }
        className="text-[10px] leading-snug text-muted-foreground"
      >
        {mark === "mark"
          ? `${UNPROVEN_COUNT} of ${PEOPLE.length} guests wear the mark on all three surfaces. His reason is the prompt, not the warning: the person who can clear it is the person reading it.`
          : "Nothing on any guest-facing surface says an address went unproven. The twenty-two who could do nothing about it are never shown a state about somebody else."}
      </p>
    </div>
  );
}

/* -- the host's side, on his ruled host-lens=badge ------------------------ */

function HostSide({ shape }: { shape: UnprovenShape }) {
  const items = QUEUE.slice(0, 6);
  return (
    <div className="space-y-2 p-3">
      <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Maya&rsquo;s queue, one list, every card saying who
      </p>
      <div className={GALLERY_UNIFORM_COLUMNS}>
        {items.map((it) => (
          <div
            key={it.media.id}
            data-gv-tile
            data-gv-proven={it.proven ? "yes" : "no"}
            className={TILE_BOX}
            style={TILE_STYLE}
          >
            <MediaTile item={it.media} playBadge="none" />
            <span
              className={cn(
                "absolute inset-x-1 bottom-1 flex items-center gap-1 rounded-full py-1 pr-1 pl-1",
                it.proven
                  ? "bg-background/92"
                  : "bg-warning/25 backdrop-blur-sm",
              )}
            >
              <span className="min-w-0 flex-1 truncate pl-1 text-[10px]">
                {it.who ?? "No name"}
              </span>
              <StateChip proven={it.proven} compact />
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        {shape === "held"
          ? "The host sees all nine at once, including the four no guest can see. Their release is a code, not a tap of hers."
          : "The host sees all nine, and four of them are already in the album. Her tap is approval, never release."}
      </p>
      <div className="space-y-1.5 rounded-lg border border-border px-2.5 py-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium">
          <BadgeCheck className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          The host&rsquo;s vouch, drawn once
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="secondary">
            That&rsquo;s Sam, I know them
          </Button>
          <ClaimedSlot address="sam.here@example.com" />
        </div>
        <p className="text-[10px] leading-snug text-muted-foreground">
          It clears the mark inside this one event and grants nothing else: never
          a verified state, never a profile, never a claim, never a byte of
          reach. A host may vouch for a person at their own party and for nothing
          beyond it.
        </p>
      </div>
    </div>
  );
}

/* -- the frame notes ------------------------------------------------------ */

/** The shipped failure table, imported rather than written. */
function CodeDidNotCome() {
  const failed = doorFailure("send_failed");
  const limited = doorFailure("rate_limited", 42);
  return (
    <div className="space-y-2 rounded-lg border border-border px-2.5 py-2">
      <p className="flex items-center gap-1.5 text-[11px] font-medium">
        <MailWarning className="size-3.5 shrink-0 text-warning" aria-hidden />
        What the mark&rsquo;s tap opens when the code does not come
      </p>
      {[failed, limited].map((f) => (
        <div key={f.kind} className="space-y-1">
          <p className="text-[11px]">{f.line}</p>
          <div className="flex flex-wrap gap-1">
            {f.actions.map((a) => (
              <span
                key={a.id}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px]",
                  a.waiting
                    ? "border-dashed border-border text-muted-foreground"
                    : "border-border text-foreground",
                )}
              >
                {a.label}
              </span>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[10px] leading-snug text-success">
        And the sentence that is only true once the gate is gone: confirm later
        from anywhere. Your photos are already in.
      </p>
    </div>
  );
}

const EXPIRY_NOTE: Record<UnprovenShape, string> = {
  "shown-marked":
    "Nothing is pending, so nothing can expire. A mark that is never cleared is a mark, not a deadline, and his expiry=host ruling never fires.",
  "shown-plain":
    "Nothing is pending and nothing is marked, so an unproven upload is indistinguishable from any other and nothing expires.",
  held: "This is the only answer with a deadline in it. His expiry=host ruling decides day seven: the address drops, and the host's own setting says whether an untied upload belongs in their album.",
};

export function UnprovenScreen({
  shape,
  screen,
}: {
  shape: UnprovenShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  const changes =
    shape === "held"
      ? "This answer changes his gate=after ruling for GUESTS: the photograph is in and safe, and nobody at the party sees it until a code lands."
      : shape === "shown-plain"
        ? "This answer drops his badge=mark ruling on every guest-facing surface. The host keeps the fact; guests are told nothing."
        : "Both of his rulings, drawn: gate=after puts it in the album, badge=mark puts the dot on the avatar with its tooltip.";

  const album = (
    <Pane label="The guest's album" tone={shape === "held" ? "warn" : "plain"}>
      <AlbumSide shape={shape} />
    </Pane>
  );
  const people = (
    <Pane label="The three surfaces his note named">
      <PeopleSide shape={shape} />
    </Pane>
  );
  const host = (
    <Pane label="The host, on his ruled host-lens=badge" tone="host">
      <HostSide shape={shape} />
    </Pane>
  );
  const notes = (
    <div className="space-y-2">
      <FrameNote
        label="What it changes"
        tone={shape === "shown-marked" ? "good" : "warn"}
      >
        {changes}
      </FrameNote>
      <FrameNote label="The host's switch, if he wants one">
        His own words on gate: displaying photos from unverified guests could be
        an event setting. That switch has exactly two positions and they are the
        first and third answers here: shown, or held.
      </FrameNote>
      <FrameNote label="Expiry, as a consequence">
        {EXPIRY_NOTE[shape]}
      </FrameNote>
      <CodeDidNotCome />
    </div>
  );

  if (!wide) {
    return (
      <div className="h-screen overflow-y-auto bg-background p-3 text-foreground">
        <div className="space-y-2">
          <div className="h-[380px]">{album}</div>
          {people}
          {host}
          {notes}
        </div>
      </div>
    );
  }
  return (
    <div className="grid h-screen grid-cols-[1fr_1fr_1fr] gap-3 bg-background p-3 text-foreground">
      <div className="min-h-0">{album}</div>
      <div className="min-h-0 space-y-3 overflow-y-auto">
        {people}
        {host}
      </div>
      <div className="min-h-0 overflow-y-auto">{notes}</div>
    </div>
  );
}
