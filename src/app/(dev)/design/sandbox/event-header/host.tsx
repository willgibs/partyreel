"use client";

import type { ReactNode } from "react";
import {
  Check,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  ImageUp,
  Images,
  ListChecks,
  Lock,
  Pause,
  Play,
  QrCode,
  Settings,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

import { EventChecklist } from "@/components/app/event-feed/checklist";
import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { ReelCard } from "@/components/app/event-feed/reel-card";
import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  reviewCardFace,
  roomCardSize,
  roomRowLayout,
} from "@/components/app/event-feed/room-card";
import { LivingStills, useLivingClock } from "@/components/app/living-stills";
import { NotificationBell } from "@/components/app/notification-bell";
import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventLinkRow } from "@/components/app/share/event-link-row";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { StyledQr } from "@/components/app/styled-qr";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { EVENT_ROOMS } from "@/lib/event/sections";
import { REEL_MINIMUM } from "@/lib/event/reel-progress";
import { readiness } from "@/lib/events/readiness";
import {
  codeMark,
  type CodeMarkGlyph,
  doorLabel,
} from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { cn, formatEventDate } from "@/lib/utils";

import { AlbumRows } from "./album";
import {
  EVENT,
  HOST,
  HOST_MOMENTS,
  type HostFacts,
  type HostMoment,
  REEL,
} from "./fixtures";
import type { GuestDirection } from "./guest";
import { AlbumLight, litVars, useAlbumHues } from "./light";
import type { ScreenId } from "./scene";

/**
 * MAYA'S HUB, HEADED FOUR WAYS.
 *
 * The hub (`dashboard/[eventId]/page.tsx`) is the host app's own chrome
 * (production's `AppShell`: the bar, the crumbs, the bell and her menu), a
 * head, the room row, the checklist while the event is not ready, and the
 * album. Every option keeps the album byte for byte and the checklist as
 * production's own component (`list=head` is settled), and redraws the head
 * and the room row.
 *
 * ★ TODAY IS PRODUCTION'S OWN PIECES WHEREVER THEY ARE PRESENTATIONAL: the
 * code with its corner mark (`EventCodeDoor`, under the share provider it
 * reads), the heading, the link row, the Highlight reel's card, the room
 * cards' shell (`room-card.ts`), the checklist and the section header. The
 * page reads a session and the album's live store, so it is composed here in
 * its own order; nothing is wired.
 */

export type HostOption = "today" | "shared" | "numbers" | "line";

const desk = (screen: ScreenId) => screen === "1440";

const EVENT_ID = "eh-maya-and-jay";

/**
 * ★ A HEAD THAT REACHES THE BAR TAKES THE MAIN'S 32px BACK INLINE, never with a
 * `-mt-8`: the hub's root is production's `space-y-6`, whose margin rule sits
 * in production's utilities layer and beats any lab utility on the same
 * property (the kit's `lab-utility-loses-to-production` trap), so the class
 * drew a 32px strip of paper between the bar and the cover.
 */
const TO_THE_BAR = { marginTop: -32 } as const;

/* ── the host app around every drawing ────────────────────────────────────── */

function HostPage({ children }: { children: ReactNode }) {
  return (
    <EventShareProvider initialSheet={null}>
      <div className="relative min-h-screen bg-background text-foreground">
        <AppShell
          headerActions={
            <>
              <NotificationBell items={[]} badgeCount={0} />
              <UserMenu
                email={HOST.email}
                displayName={HOST.fullName}
                avatarUrl={null}
                seed={HOST.seed}
                planName="Pro"
              />
            </>
          }
        >
          <SetCrumbs
            trail={[
              { label: "Partyreel", href: "/dashboard" },
              { label: EVENT.name },
            ]}
          />
          <div data-app-wide className="space-y-6">
            {children}
          </div>
        </AppShell>
      </div>
    </EventShareProvider>
  );
}

/* ── the code, quoted where production's own cannot stand ─────────────────── */

const MARK_GLYPHS: Record<CodeMarkGlyph, LucideIcon> = {
  "only-me": EyeOff,
  paused: Pause,
  gate: Lock,
};

/** The code's corner mark, as `EventCodeDoor` draws it (its words are `codeMark`'s, on hover). */
function CornerMark({ f }: { f: HostFacts }) {
  const mark = codeMark({
    door: f.door,
    acceptingUploads: f.ready.acceptingUploads,
    waiting: f.waiting,
  });
  if (!mark) return null;
  const Icon = MARK_GLYPHS[mark.glyph];
  const waiting = mark.waiting > 0;
  return (
    <span
      title={mark.words}
      className={cn(
        "absolute -top-2 -right-2 z-10 flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full px-1.5 ring-2 ring-background",
        waiting
          ? "bg-warning text-warning-foreground"
          : "bg-neutral-900 text-white",
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      {waiting ? (
        <span className="text-[11px] font-semibold tabular-nums">
          {formatCount(mark.waiting)}
        </span>
      ) : null}
    </span>
  );
}

/** A scannable code on its white mat, at any size, with its mark: the head's own copy of the code. */
function CodeMat({
  f,
  px,
  className,
}: {
  f: HostFacts;
  /** The code's own edge, quiet zone included. */
  px: number;
  className?: string;
}) {
  return (
    <span data-eh-code="" className={cn("relative shrink-0", className)}>
      <span className="block rounded-lg bg-white p-2 shadow-layer">
        <StyledQr
          value={EVENT.joinUrl}
          size={px}
          style={resolveQrPreset(EVENT.qrStyle)}
        />
      </span>
      <CornerMark f={f} />
    </span>
  );
}

/**
 * THE CODE AS A CHIP, where the head has no room for a scannable one: its glyph
 * on the white mat, its mark on the corner, and a press opens the code card.
 * ★ NEVER A SHRUNKEN CODE: under the module floor a code cannot scan
 * (`module-floor.ts`), and `StyledQr` refuses to draw one that small, so a
 * thumbnail that looked like a code would be a code that does not work.
 */
function CodeChip({ f, size = "size-10" }: { f: HostFacts; size?: string }) {
  return (
    <span data-eh-code="" title="Show the code" className="relative shrink-0">
      <span
        className={cn(
          "flex items-center justify-center rounded-lg bg-white text-neutral-950 shadow-layer ring-1 ring-border",
          size,
        )}
      >
        <QrCode className="size-1/2" aria-hidden />
      </span>
      <CornerMark f={f} />
    </span>
  );
}

/* ── the facts a host reads, in glyphs ────────────────────────────────────── */

function MetaLine({
  f,
  onMedia = false,
  className,
}: {
  f: HostFacts;
  onMedia?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm",
        onMedia ? "text-white/85" : "text-muted-foreground",
        className,
      )}
    >
      <span>{formatEventDate(EVENT.date)}</span>
      <span
        className="flex items-center gap-1.5"
        title="Photos and videos in the album"
      >
        <Images className="size-3.5" aria-hidden />
        {formatCount(f.photos)}
      </span>
      <span className="flex items-center gap-1.5" title="Guests">
        <Users className="size-3.5" aria-hidden />
        {formatCount(f.guests)}
      </span>
      <span className="flex items-center gap-1.5" title="Views">
        <Eye className="size-3.5" aria-hidden />
        {formatCount(f.views)}
      </span>
      {f.photos > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          Live
        </span>
      )}
    </div>
  );
}

/** The link row on a photograph: the readable link and its copy, in white. */
function MediaLinkRow() {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs text-white/70">
      <span className="truncate">partyreel.com/e/maya-and-jay</span>
    </div>
  );
}

/* ══ TODAY: production's head ═════════════════════════════════════════════════ */

function TodayHead({ f }: { f: HostFacts }) {
  return (
    <div data-eh-head="" className="flex items-center gap-4 sm:gap-5">
      <span data-eh-code="">
        <EventCodeDoor
          eventName={EVENT.name}
          joinUrl={EVENT.joinUrl}
          qrStyle={EVENT.qrStyle}
          door={f.door}
          acceptingUploads={f.ready.acceptingUploads}
          waiting={f.waiting}
        />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <PageHeading className="truncate">{EVENT.name}</PageHeading>
        <MetaLine f={f} />
        <EventLinkRow
          prettyUrl={EVENT.prettyUrl}
          permanentUrl={EVENT.joinUrl}
        />
      </div>
    </div>
  );
}

/* ── the room row, as production draws it ─────────────────────────────────── */

function settingsValue(f: HostFacts): { text: string; strong?: boolean } {
  const left = readiness(f.ready).left.filter((i) => i.essential).length;
  return left > 0
    ? { text: `${formatCount(left)} left`, strong: true }
    : { text: doorLabel(f.door) };
}

const ROOM_ICONS = { guests: Users, review: ListChecks, settings: Settings };

/**
 * THE ROOM ROW (`event-cards-row.tsx`), quoted on production's own shell: the
 * cards at rest, or condensed to pills once it has stuck under the bar, with
 * the QR pill that stands in for the header's code when it is off screen.
 */
function RoomsRow({ f, stuck = false }: { f: HostFacts; stuck?: boolean }) {
  const review = reviewCardFace(true, f.review);
  const settings = settingsValue(f);
  return (
    <div
      className={cn(
        "sticky top-14 z-30 -mx-3 sm:-mx-5",
        stuck && "border-b border-border bg-background/85 backdrop-blur",
      )}
    >
      <div className="px-3 py-2 sm:px-5">
        <div
          role="group"
          aria-label="This event"
          className={cn(roomRowLayout(stuck), "overflow-hidden")}
        >
          {EVENT_ROOMS.map((room) => {
            if (room.id === "reel")
              return (
                <ReelCard
                  key="reel"
                  eventId={EVENT_ID}
                  stuck={stuck}
                  reel={{
                    state:
                      f.reel === "live"
                        ? "live"
                        : f.reel === "off"
                          ? "off"
                          : "counting",
                    have: Math.min(f.ready.playable, REEL_MINIMUM),
                    of: REEL_MINIMUM,
                    stills: f.reel === "live" ? [...REEL] : [],
                    viewHref: "#",
                    moderated: true,
                    pending: f.review,
                  }}
                />
              );
            const Icon = ROOM_ICONS[room.id];
            const face =
              room.id === "review"
                ? {
                    value: review.value,
                    amber: review.amber,
                    count: review.count,
                  }
                : room.id === "guests"
                  ? f.waiting > 0
                    ? {
                        value: `${formatCount(f.waiting)} waiting`,
                        amber: true,
                        count: f.waiting,
                      }
                    : { value: `${formatCount(f.guests)} guests`, amber: false }
                  : {
                      value: settings.text,
                      amber: false,
                      strong: settings.strong,
                    };
            return (
              <span
                key={room.id}
                className={cn(
                  ROOM_CARD_BASE,
                  roomCardSize(stuck),
                  face.amber
                    ? "border-warning/40 bg-warning/5"
                    : ROOM_CARD_QUIET,
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    face.amber ? "text-warning" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                {stuck ? (
                  <span className="text-xs font-medium">{room.label}</span>
                ) : (
                  <span className="font-heading text-card-title">
                    {room.label}
                  </span>
                )}
                <span
                  className={cn(
                    "truncate text-xs tabular-nums",
                    ROOM_CARD_VALUE,
                    stuck && "hidden",
                    face.amber
                      ? "font-medium text-warning"
                      : "strong" in face && face.strong
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {face.value}
                </span>
                {stuck && face.amber && "count" in face && face.count ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
                    {face.count}
                  </span>
                ) : null}
              </span>
            );
          })}
          {stuck && (
            <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium">
              <QrCode className="size-4 shrink-0" aria-hidden />
              Invite
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── the checklist and the album, production's own ────────────────────────── */

function Checklist({ f, moment }: { f: HostFacts; moment: HostMoment }) {
  if (moment !== "before") return null;
  return (
    <EventChecklist
      eventId={EVENT_ID}
      facts={f.ready}
      over={false}
      plan={{ tier: "pro", hasBilling: true }}
    />
  );
}

function HubAlbum({ f, screen }: { f: HostFacts; screen: ScreenId }) {
  const has = f.photos > 0;
  return (
    <section aria-label="Album" className="space-y-2.5">
      <FeedSectionHeader
        label="Album"
        count={has ? f.photos : undefined}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button variant="outline" size="sm">
              <ImageUp /> Add photos
            </Button>
            {has && (
              <>
                <Button variant="outline" size="sm" className="max-sm:hidden">
                  <Download /> Download
                </Button>
                <Button variant="outline" size="sm">
                  <ListChecks /> Select
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon-sm" aria-label="View">
              <SlidersHorizontal />
            </Button>
          </div>
        }
      />
      {has ? (
        <div className="-mx-1">
          <AlbumRows screen={screen} />
        </div>
      ) : (
        <div data-eh-empty="">
          <FeedSectionEmpty
            icon={Images}
            title="No photos yet"
            desc="The album fills here as you and your guests add photos."
          />
        </div>
      )}
    </section>
  );
}

/* ══ ONE GRAMMAR: the album's own head, with her tools ════════════════════════ */

/** The reel's stills, living, under a head (the cover's ground). */
function LivingGround() {
  const { ref, at } = useLivingClock<HTMLDivElement>(REEL.length);
  return (
    <div ref={ref} className="absolute inset-0 -z-10">
      <LivingStills stills={REEL} at={at} />
    </div>
  );
}

/**
 * THE COVER, HERS: the album's cover under her head, the name and her facts
 * over it, and the code on its white mat in the cover's corner, as the room's
 * screen wears it, scannable from across a table.
 */
function SharedCover({ f, screen }: { f: HostFacts; screen: ScreenId }) {
  const atDesk = desk(screen);
  const empty = f.photos === 0;
  const hues = useAlbumHues(empty);
  return (
    <section
      data-eh-head=""
      style={TO_THE_BAR}
      className={cn(
        "relative isolate -mx-3 flex items-end overflow-hidden text-white sm:-mx-5",
        atDesk ? "h-[400px]" : "h-[330px]",
        empty && "bg-neutral-950",
      )}
    >
      {empty ? (
        <AlbumLight hues={hues} className="eh-light-room" />
      ) : (
        <>
          <LivingGround />
          <div aria-hidden className="eh-cover-scrim" />
        </>
      )}
      <div
        className={cn(
          "relative flex w-full items-end gap-4 px-3 pb-4 sm:px-5",
          atDesk && "gap-8 pb-7",
        )}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <h1
            className={cn(
              "font-heading text-balance",
              atDesk ? "text-chapter" : "text-section",
            )}
          >
            {EVENT.name}
          </h1>
          <MetaLine f={f} onMedia />
          <MediaLinkRow />
        </div>
        <CodeMat f={f} px={atDesk ? 112 : 92} />
      </div>
    </section>
  );
}

/**
 * THE DOORWAY'S GRAMMAR, HERS: the code is her door, so it stands where the
 * guest's door stands, in the album's light, and the name takes the doorway's
 * size beside it.
 */
function SharedDoorway({ f, screen }: { f: HostFacts; screen: ScreenId }) {
  const atDesk = desk(screen);
  const hues = useAlbumHues(f.photos === 0);
  return (
    <section
      data-eh-head=""
      style={TO_THE_BAR}
      className="relative isolate -mx-3 px-3 pt-8 pb-2 sm:-mx-5 sm:px-5"
    >
      <AlbumLight
        hues={hues}
        source={atDesk ? { x: "6%", y: "55%" } : { x: "16%", y: "55%" }}
      />
      <div className={cn("flex items-center gap-4", atDesk && "gap-7")}>
        <span className="relative shrink-0" style={litVars(hues)}>
          <CodeMat f={f} px={atDesk ? 128 : 92} />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1
            className={cn(
              "font-heading text-balance",
              atDesk ? "text-title" : "text-chapter",
            )}
          >
            {EVENT.name}
          </h1>
          <MetaLine f={f} />
          <EventLinkRow
            prettyUrl={EVENT.prettyUrl}
            permanentUrl={EVENT.joinUrl}
          />
        </div>
      </div>
    </section>
  );
}

/** THE MASTHEAD'S GRAMMAR, HERS: the name set large, her numbers as numerals, the code beside them. */
function SharedMasthead({ f, screen }: { f: HostFacts; screen: ScreenId }) {
  const atDesk = desk(screen);
  return (
    <section
      data-eh-head=""
      className={cn(atDesk && "grid grid-cols-12 items-end gap-x-12")}
    >
      <div className={cn(atDesk && "col-span-7")}>
        <h1 className="font-heading text-hero text-balance">{EVENT.name}</h1>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-foreground/80 pt-3 text-label text-muted-foreground uppercase">
          <span>{formatEventDate(EVENT.date)}</span>
          <span className="flex items-center gap-1.5">
            {f.photos > 0 && (
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
            )}
            {f.photos > 0 ? "Live" : doorLabel(f.door)}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "flex items-end gap-5",
          atDesk ? "col-span-5 justify-between" : "mt-6",
        )}
      >
        <div className="grid flex-1 grid-cols-3 divide-x divide-border [&>*+*]:pl-4">
          <Num n={formatCount(f.photos)} label="Photos" />
          <Num n={formatCount(f.guests)} label="Guests" />
          <Num n={formatCount(f.views)} label="Views" />
        </div>
        <CodeMat f={f} px={atDesk ? 96 : 92} />
      </div>
    </section>
  );
}

function Num({ n, label }: { n: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 pr-3">
      <span className="font-heading text-page tabular-nums">{n}</span>
      <span className="text-label text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

/* ══ THE NUMBERS ARE THE DOORS ═══════════════════════════════════════════════ */

/** The reel's door among the numbers: its stills living in a small round frame. */
function ReelThumb({
  live,
  size = "size-9",
}: {
  live: boolean;
  size?: string;
}) {
  const { ref, at } = useLivingClock<HTMLSpanElement>(REEL.length);
  return (
    <span
      ref={ref}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        size,
        live ? "" : "border border-dashed border-foreground/30",
      )}
    >
      {live && <LivingStills stills={REEL} at={at} />}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          live ? "bg-black/25 text-white" : "text-muted-foreground",
        )}
      >
        {live ? (
          <Play className="size-3 fill-current" aria-hidden />
        ) : (
          <Clapperboard className="size-3.5" aria-hidden />
        )}
      </span>
    </span>
  );
}

/** One door: what it counts, its glyph and its word, and the one thing waiting in it. */
function NumberDoor({
  icon: Icon,
  label,
  value,
  amber,
  sub,
  first,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  amber?: boolean;
  /** One line under the numeral: what waits, or what it is. */
  sub?: ReactNode;
  first?: boolean;
}) {
  return (
    <span
      title={label}
      className={cn(
        "flex min-w-0 flex-col justify-between gap-1 px-4 py-1",
        !first && "border-l border-border",
      )}
    >
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
        {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
        {label}
      </span>
      <span
        className={cn(
          "font-heading text-page leading-none tabular-nums",
          amber && "text-warning",
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "truncate text-caption",
          amber ? "font-medium text-warning" : "text-muted-foreground",
        )}
      >
        {sub ?? " "}
      </span>
    </span>
  );
}

function NumbersHead({
  f,
  screen,
  stuck = false,
}: {
  f: HostFacts;
  screen: ScreenId;
  stuck?: boolean;
}) {
  const atDesk = desk(screen);
  const left = readiness(f.ready).left.filter((i) => i.essential).length;
  const doors = (
    <div
      className={cn(
        "grid",
        atDesk ? "grid-cols-5" : "-mx-4 grid-cols-3 gap-y-3",
      )}
    >
      <NumberDoor
        first
        icon={Images}
        label="Photos"
        value={formatCount(f.photos)}
        sub={f.photos > 0 ? "In the album" : "None yet"}
      />
      <NumberDoor
        icon={Users}
        label="Guests"
        value={formatCount(f.guests)}
        amber={f.waiting > 0}
        sub={
          f.waiting > 0 ? `${formatCount(f.waiting)} at the door` : undefined
        }
      />
      <NumberDoor
        icon={ListChecks}
        label="Review"
        value={formatCount(f.review)}
        amber={f.review > 0}
        sub={f.review > 0 ? "To look at" : "All caught up"}
      />
      <NumberDoor
        first={!atDesk}
        label="Highlight reel"
        value={<ReelThumb live={f.reel === "live"} size="size-7" />}
        sub={f.reel === "live" ? "Live for guests" : "Starts at 2 photos"}
      />
      <NumberDoor
        icon={Settings}
        label="Settings"
        value={
          left > 0 ? (
            `${left} left`
          ) : (
            <Check
              className="size-6 text-success"
              strokeWidth={2.5}
              aria-label="Ready"
            />
          )
        }
        sub={left > 0 ? "Before guests arrive" : doorLabel(f.door)}
      />
    </div>
  );
  if (stuck)
    return (
      <div className="sticky top-14 z-30 -mx-3 border-b border-border bg-background/85 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="flex h-9 items-center gap-3 text-sm">
          <CodeChip f={f} size="size-8" />
          <span className="min-w-0 flex-1 truncate font-heading text-card-title">
            {EVENT.name}
          </span>
          <span
            className="flex items-center gap-1.5 text-muted-foreground tabular-nums"
            title="Photos"
          >
            <Images className="size-3.5" />
            {formatCount(f.photos)}
          </span>
          <span
            className="flex items-center gap-1.5 text-warning tabular-nums"
            title="Guests at the door"
          >
            <Users className="size-3.5" />
            {formatCount(f.waiting)}
          </span>
          <span
            className="flex items-center gap-1.5 text-warning tabular-nums"
            title="Review"
          >
            <ListChecks className="size-3.5" />
            {formatCount(f.review)}
          </span>
          <ReelThumb live={f.reel === "live"} size="size-6" />
          <Settings className="size-4 text-muted-foreground" />
        </div>
      </div>
    );
  return (
    <section
      data-eh-head=""
      className={cn("flex gap-5", atDesk ? "items-center gap-6" : "flex-col")}
    >
      <div className="flex min-w-0 items-center gap-4">
        <CodeMat f={f} px={atDesk ? 104 : 96} />
        <div className="min-w-0 space-y-1">
          <PageHeading className="truncate">{EVENT.name}</PageHeading>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {formatEventDate(EVENT.date)}
            {f.photos > 0 && (
              <span className="flex items-center gap-1.5">
                <span
                  className="size-1.5 rounded-full bg-success"
                  aria-hidden
                />
                Live
              </span>
            )}
          </p>
          <EventLinkRow
            prettyUrl={EVENT.prettyUrl}
            permanentUrl={EVENT.joinUrl}
          />
        </div>
      </div>
      <div className={cn(atDesk && "ml-auto")}>{doors}</div>
    </section>
  );
}

/* ══ THE ALBUM FIRST: one line, then the album ════════════════════════════════ */

function LinePill({
  icon: Icon,
  children,
  amber,
  label,
}: {
  icon?: LucideIcon;
  children?: ReactNode;
  amber?: boolean;
  label: string;
}) {
  return (
    <span
      title={label}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm tabular-nums",
        amber
          ? "border-warning/40 bg-warning/5 text-warning"
          : "border-border text-foreground",
      )}
    >
      {Icon && (
        <Icon
          className={cn("size-4 shrink-0", !amber && "text-muted-foreground")}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

function LineHead({ f, screen }: { f: HostFacts; screen: ScreenId }) {
  const atDesk = desk(screen);
  const left = readiness(f.ready).left.filter((i) => i.essential).length;
  const pills = (
    <div
      className={cn(
        "flex items-center gap-1.5",
        !atDesk && "-mx-3 overflow-hidden px-3",
      )}
    >
      <LinePill label="Highlight reel">
        <ReelThumb live={f.reel === "live"} size="size-5" />
        Reel
      </LinePill>
      <LinePill icon={Users} label="Guests" amber={f.waiting > 0}>
        {f.waiting > 0
          ? `${formatCount(f.waiting)} waiting`
          : formatCount(f.guests)}
      </LinePill>
      <LinePill icon={ListChecks} label="Review" amber={f.review > 0}>
        {f.review > 0 ? formatCount(f.review) : "Clear"}
      </LinePill>
      <LinePill icon={Settings} label="Settings">
        {left > 0 ? `${left} left` : doorLabel(f.door)}
      </LinePill>
      <LinePill icon={QrCode} label="Invite">
        Invite
      </LinePill>
    </div>
  );
  return (
    <section
      data-eh-head=""
      style={{ marginTop: -12 }}
      className={cn(
        "sticky top-14 z-30 -mx-3 flex gap-3 border-b border-border bg-background/85 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5",
        atDesk ? "items-center" : "flex-col",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <CodeChip f={f} size="size-11" />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-subsection">
            {EVENT.name}
          </h1>
          <p className="flex items-center gap-2 text-caption text-muted-foreground">
            {formatEventDate(EVENT.date)}
            {f.photos > 0 && (
              <span className="flex items-center gap-1">
                <span
                  className="size-1.5 rounded-full bg-success"
                  aria-hidden
                />
                Live
              </span>
            )}
          </p>
        </div>
      </div>
      <div className={cn(atDesk && "ml-auto")}>{pills}</div>
    </section>
  );
}

/* ══ THE PAGE ══════════════════════════════════════════════════════════════════ */

export function HubPage({
  option,
  guest,
  screen,
  moment,
  scrolled = false,
}: {
  option: HostOption;
  /** The guest's head, which the one-grammar option wears. */
  guest: GuestDirection;
  screen: ScreenId;
  moment: HostMoment;
  scrolled?: boolean;
}) {
  const f = HOST_MOMENTS[moment];
  const shared = option === "shared" ? guest : null;
  const head =
    option === "today" || shared === "today" ? (
      <TodayHead f={f} />
    ) : shared === "cover" ? (
      <SharedCover f={f} screen={screen} />
    ) : shared === "doorway" ? (
      <SharedDoorway f={f} screen={screen} />
    ) : shared === "masthead" ? (
      <SharedMasthead f={f} screen={screen} />
    ) : option === "numbers" ? (
      <NumbersHead f={f} screen={screen} />
    ) : (
      <LineHead f={f} screen={screen} />
    );
  const rooms =
    option === "numbers" ? (
      scrolled ? (
        <NumbersHead f={f} screen={screen} stuck />
      ) : null
    ) : option === "line" ? null : (
      <RoomsRow f={f} stuck={scrolled} />
    );
  return (
    <HostPage>
      {head}
      {rooms}
      <Checklist f={f} moment={moment} />
      <HubAlbum f={f} screen={screen} />
    </HostPage>
  );
}
