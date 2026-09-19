"use client";

import {
  ArrowLeft,
  Check,
  Clapperboard,
  Copy,
  Eye,
  Globe,
  Images,
  ImageUp,
  ListChecks,
  type LucideIcon,
  QrCode,
  Settings,
  Users,
} from "lucide-react";

import { EventFilterPills } from "@/components/app/event-feed/event-filter-pills";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { MediaTile } from "@/components/app/media-grid";
import {
  GALLERY_UNIFORM_COLUMNS,
  MasonryColumns,
} from "@/components/shared/masonry";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ALBUM, GUESTS, JOIN_URL, LIVE, QUEUE, REEL } from "./fixtures";

/**
 * THE EVENT, IN THREE SHAPES, WITH SHARING AND SETTINGS DRAWN ON WHICHEVER ONE
 * IS PICKED.
 *
 * The event page is where a host spends the party, and today it is one scroll:
 * a back link, a name, five glyphs, two chips, a command strip and then five
 * pills over a stack of sections in urgency order, with a bar floating over the
 * lot. Every one of those pieces arrived with a feature. This asks what the
 * page IS before it asks where any of them go.
 *
 * The album is the shipped `MasonryColumns` over the fixture, inside `as-grid`
 * so it wears the 240 px column Will ruled on 2026-09-19 (`gallery-wiring` is
 * landing the same thing in the component while this is drawn). The pills are
 * the shipped `EventFilterPills`, the section eyebrows the shipped
 * `FeedSectionHeader`, the cards the shipped `Card`. Nothing here edits one.
 */

export type Event = "feed" | "hub" | "album";
export type Share = "modal" | "room" | "front";
export type Setting = "column" | "sheet" | "rooms";

export const eventOf = (v: string | undefined): Event =>
  v === "feed" || v === "hub" ? v : "album";
export const shareOf = (v: string | undefined): Share =>
  v === "modal" || v === "room" ? v : "front";
export const settingOf = (v: string | undefined): Setting =>
  v === "column" || v === "rooms" ? v : "sheet";

/* ── The pieces ──────────────────────────────────────────────────────────── */

const STAT = "flex items-center gap-1.5";

/**
 * The album: the shipped `MasonryColumns`, at the shipped column width.
 *
 * ★ `as-grid` IS A MARKER, NOT A STYLE, and it has no stylesheet behind it.
 * This board was first drawn with a candidate sheet that gave the galleries a
 * 220 px column in place of their hard-coded count, so no shape would be judged
 * against a width Will had already ruled out; `gallery-wiring` landed exactly
 * that in the component itself (`GALLERY_COLUMNS`) while this was being drawn,
 * so the sheet went and the class stayed. It says which grid on a page is the
 * ALBUM, so the frame's caption counts the album's columns rather than every
 * thumbnail in a row or an arrivals strip (chrome.tsx, `Measure`).
 */
function Album({ items = ALBUM }: { items?: typeof ALBUM }) {
  return (
    <div className="as-grid">
      <MasonryColumns items={items} viewerIsHost clampAspect />
    </div>
  );
}

/** A QR block, at three sizes, so one drawing serves the modal, the room and
 *  the header. The real designer lives behind a dialog the frame cannot open. */
function QrBlock({ size = 128 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-xl bg-foreground text-background"
      style={{ width: size, height: size }}
    >
      <QrCode style={{ width: size * 0.66, height: size * 0.66 }} />
    </span>
  );
}

function LinkRow({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm",
        className,
      )}
    >
      <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{JOIN_URL}</span>
      <Copy
        className="ml-auto size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </span>
  );
}

function StatLine() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>{LIVE.dateLabel}</span>
      <span className={STAT}>
        <Images className="size-3.5" aria-hidden />
        {LIVE.items}
      </span>
      <span className={STAT}>
        <Users className="size-3.5" aria-hidden />
        {LIVE.guests}
      </span>
      <span className={STAT}>
        <Eye className="size-3.5" aria-hidden />
        {LIVE.views}
      </span>
    </div>
  );
}

function ReviewBanner() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
      <ListChecks className="size-4 shrink-0 text-warning" aria-hidden />
      <p className="text-sm font-medium text-warning">
        {LIVE.pending} photos are waiting for you
      </p>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm">
          <ListChecks /> Review them
        </Button>
        <Button size="sm">
          <Check /> Approve all
        </Button>
      </div>
    </div>
  );
}

/** The shipped selectable review grid needs a provider-backed selection, so the
 *  queue is drawn here over the pending fixture wearing the shipped column rule
 *  itself (`GALLERY_UNIFORM_COLUMNS`), which is what keeps a page whose album
 *  runs six across from putting its queue on four. */
function ReviewGrid({ phone }: { phone: boolean }) {
  return (
    <div className={cn(GALLERY_UNIFORM_COLUMNS, phone && "grid-cols-3")}>
      {QUEUE.map((m) => (
        <span
          key={m.id}
          data-media-tile
          data-static
          data-lit=""
          className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
        >
          <MediaTile item={m} playBadge="none" />
        </span>
      ))}
    </div>
  );
}

function ReelStrip({ phone }: { phone: boolean }) {
  return (
    <div className={cn("grid gap-1.5", phone ? "grid-cols-4" : "grid-cols-8")}>
      {REEL.map((m) => (
        <span
          key={m.id}
          data-media-tile
          data-static
          data-lit=""
          className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-tile)]"
        >
          <MediaTile item={m} playBadge="none" />
        </span>
      ))}
    </div>
  );
}

function GuestList() {
  return (
    <div className="flex flex-wrap gap-2">
      {GUESTS.map((g) => (
        <span
          key={g.name}
          className="flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm"
        >
          <span className="grid size-6 place-items-center rounded-full bg-muted text-[11px] font-medium">
            {g.initial}
          </span>
          {g.name}
          <span className="text-xs text-muted-foreground tabular-nums">
            {g.items}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ── Where sharing sits ──────────────────────────────────────────────────── */

/** The modal, drawn open over the page, which is the only way to judge it. */
function ShareModal() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/50 p-6">
      <div className="w-[420px] space-y-4 rounded-2xl border border-border bg-background p-6 shadow-layer">
        <div>
          <p className="font-heading text-card-title">Share this event</p>
          <p className="text-sm text-muted-foreground">
            Guests scan the code or open the link. No app, no account.
          </p>
        </div>
        <div className="flex justify-center">
          <QrBlock size={176} />
        </div>
        <LinkRow />
        <div className="flex gap-2">
          <Button className="flex-1">Download poster</Button>
          <Button variant="outline" className="flex-1">
            Invite by email
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The header block that carries sharing on the page itself. */
function ShareFront({ phone }: { phone: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl border border-border bg-card p-4",
        phone && "flex-col items-start",
      )}
    >
      <QrBlock size={phone ? 96 : 104} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Guests scan this or open the link. No app, no account.
        </p>
        <LinkRow />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            Download poster
          </Button>
          <Button size="sm" variant="outline">
            Invite by email
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The whole page, when sharing is a room of its own. */
function ShareRoom({ phone }: { phone: boolean }) {
  return (
    <div className={cn("flex gap-10", phone ? "flex-col" : "items-start")}>
      <div className="space-y-4">
        <QrBlock size={phone ? 260 : 320} />
        <p className="text-center text-sm text-muted-foreground">
          Point a camera at this
        </p>
      </div>
      <div className="min-w-0 flex-1 space-y-5">
        <div className="space-y-2">
          <h2 className="font-heading text-subsection">The link</h2>
          <LinkRow />
          <p className="text-xs text-muted-foreground">
            Public · anyone with the link can add photos
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-subsection">A poster to print</h2>
          <div className="flex gap-2">
            <span className="grid h-28 w-20 place-items-center rounded-lg border border-border text-[10px] text-muted-foreground">
              A4
            </span>
            <span className="grid h-28 w-20 place-items-center rounded-lg border border-border text-[10px] text-muted-foreground">
              Table
            </span>
            <span className="grid h-28 w-20 place-items-center rounded-lg border border-border text-[10px] text-muted-foreground">
              Story
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-subsection">Invite by email</h2>
          <div className="flex gap-2">
            <span className="flex h-9 flex-1 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground">
              Add an address
            </span>
            <Button>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Where settings sit ──────────────────────────────────────────────────── */

const SETTING_CARDS = [
  {
    title: "Details",
    desc: "The name, the date and the description guests read.",
  },
  {
    title: "Who can see this",
    desc: "Public, a password, or private. It changes what a link opens.",
  },
  {
    title: "Uploads",
    desc: "Accepting uploads, videos, and whether photos wait for you.",
  },
  { title: "Guest list", desc: "Name signed-in guests on the album." },
  { title: "Event link", desc: "The permanent link, and a readable slug." },
  {
    title: "Deleted",
    desc: "41 items you removed. Restore within 30 days, or delete now.",
  },
  { title: "Danger zone", desc: "Delete this event and everything in it." },
] as const;

function SettingsColumn() {
  return (
    <div className="space-y-4">
      {SETTING_CARDS.map((c) => (
        <Card key={c.title}>
          <CardHeader>
            <CardTitle>{c.title}</CardTitle>
            <CardDescription>{c.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-9 rounded-lg border border-dashed border-border" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A sheet over the album, so a change to who can see this is judged against
 *  the photographs it governs rather than on a page of its own. */
function SettingsSheet({ phone }: { phone: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex justify-end bg-black/30">
      <div
        className={cn(
          "h-full space-y-4 overflow-hidden border-l border-border bg-background p-5 shadow-layer",
          phone ? "w-[320px]" : "w-[420px]",
        )}
      >
        <div className="flex items-center justify-between">
          <p className="font-heading text-card-title">Settings</p>
          <span className="text-sm text-muted-foreground">Done</span>
        </div>
        {SETTING_CARDS.slice(0, 5).map((c) => (
          <div key={c.title} className="space-y-1.5">
            <p className="text-sm font-medium">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.desc}</p>
            <div className="h-9 rounded-lg border border-dashed border-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Each setting beside the thing it governs, and one Danger room for the rest. */
function SettingsRooms() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          On the Share room
        </p>
        <p className="mt-1 text-sm">
          Who can see this · the event link · a readable slug
        </p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          On the Review room
        </p>
        <p className="mt-1 text-sm">
          Photos wait for approval · accepting uploads · videos
        </p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          On the Guests room
        </p>
        <p className="mt-1 text-sm">
          Name signed-in guests on the album · show this event on your profile
        </p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          On the Album
        </p>
        <p className="mt-1 text-sm">
          Deleted photos, as a filter beside All · the name, date and
          description
        </p>
      </div>
      <div className="rounded-xl border border-destructive/40 p-4">
        <p className="text-[11px] font-semibold tracking-wide text-destructive uppercase">
          Danger
        </p>
        <p className="mt-1 text-sm">Delete this event and everything in it.</p>
      </div>
    </div>
  );
}

/* ── The three event pages ───────────────────────────────────────────────── */

/**
 * TODAY: the whole page as one scroll. The back link, the name, the stat line,
 * the two status chips, the command strip, the five pills, then the sections in
 * urgency order with the floating bar over them. 404 px of page before the
 * first photograph at 1440, which the frame will show.
 */
function FeedPage({
  phone,
  share,
  openModal,
}: {
  phone: boolean;
  share: Share;
  openModal: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back to events
        </span>
        <div className="space-y-2">
          <PageHeading>{LIVE.name}</PageHeading>
          <StatLine />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              <Globe className="size-3" /> Public
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" /> Accepting
              uploads
            </span>
          </div>
        </div>
      </div>

      {share === "front" ? (
        <ShareFront phone={phone} />
      ) : (
        <div className={cn("flex gap-2", phone && "flex-col")}>
          <Button className={phone ? "" : "flex-1"}>
            <QrCode /> Share
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <ImageUp /> Add
            </Button>
            <Button variant="outline">
              <Settings /> Settings
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <EventFilterPills
          pills={[
            { value: "all", label: "All" },
            {
              value: "review",
              label: "Review",
              count: LIVE.pending,
              amber: true,
            },
            { value: "gallery", label: "Gallery", count: LIVE.items },
            { value: "reel", label: "Reel", count: REEL.length },
            { value: "guests", label: "Guests", count: LIVE.guests },
          ]}
          active="all"
          onSelect={() => {}}
          stuck={false}
        />
        <section className="space-y-2.5">
          <FeedSectionHeader
            label="Review"
            count={LIVE.pending}
            amber
            action={
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm">
                  <ListChecks /> Select
                </Button>
                <Button size="sm">
                  <Check /> Approve all
                </Button>
              </div>
            }
          />
          <ReviewGrid phone={phone} />
        </section>
        <section className="space-y-2.5">
          <FeedSectionHeader label="Gallery" count={LIVE.items} />
          <Album />
        </section>
        <section className="space-y-2.5">
          <FeedSectionHeader label="Reel" count={REEL.length} />
          <ReelStrip phone={phone} />
        </section>
        <section className="space-y-2.5">
          <FeedSectionHeader label="Guests" count={LIVE.guests} />
          <GuestList />
        </section>
      </div>
      {openModal && <ShareModal />}
    </div>
  );
}

const DOORS: {
  id: string;
  label: string;
  Icon: LucideIcon;
  value: string;
  amber?: boolean;
}[] = [
  {
    id: "review",
    label: "Review",
    Icon: ListChecks,
    value: `${LIVE.pending} waiting`,
    amber: true,
  },
  { id: "album", label: "Album", Icon: Images, value: `${LIVE.items} photos` },
  {
    id: "reel",
    label: "Reel",
    Icon: Clapperboard,
    value: "8 clips, 42 seconds",
  },
  {
    id: "guests",
    label: "Guests",
    Icon: Users,
    value: `${LIVE.guests} contributors`,
  },
];

/** A HUB: the event's own front page, with a door into each room. */
function HubPage({
  phone,
  share,
  openModal,
}: {
  phone: boolean;
  share: Share;
  openModal: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still, never optimizable in a frame */}
        <img
          src={LIVE.cover}
          alt=""
          className="h-48 w-full object-cover sm:h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-5 text-white">
          <PageHeading className="text-white">{LIVE.name}</PageHeading>
          <p className="text-sm text-white/80">
            {LIVE.dateLabel} · Public · accepting uploads
          </p>
        </div>
      </div>

      {share === "front" && <ShareFront phone={phone} />}

      <div className={cn("grid gap-3", phone ? "grid-cols-2" : "grid-cols-4")}>
        {DOORS.map(({ id, label, Icon, value, amber }) => (
          <div
            key={id}
            className={cn(
              "space-y-2 rounded-xl border p-4",
              amber ? "border-warning/40 bg-warning/5" : "border-border",
            )}
          >
            <Icon
              className={cn(
                "size-4",
                amber ? "text-warning" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <p className="font-heading text-card-title">{label}</p>
            <p
              className={cn(
                "text-xs",
                amber ? "font-medium text-warning" : "text-muted-foreground",
              )}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-2.5">
        <FeedSectionHeader label="Just arrived" count={12} />
        <div
          className={cn("grid gap-1.5", phone ? "grid-cols-4" : "grid-cols-8")}
        >
          {ALBUM.slice(0, phone ? 8 : 16).map((m) => (
            <span
              key={m.id}
              data-media-tile
              data-static
              data-lit=""
              className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
            >
              <MediaTile item={m} playBadge="none" />
            </span>
          ))}
        </div>
      </section>
      {openModal && <ShareModal />}
    </div>
  );
}

/**
 * THE ALBUM IS THE PAGE. One line of identity, the queue as a banner while
 * there is one, then the photographs to the window's edge. Review, Reel,
 * Guests, Share and Settings are rooms the chrome carries, so this page has one
 * subject and it is the reason the host opened it.
 */
function AlbumPage({
  phone,
  share,
  openModal,
}: {
  phone: boolean;
  share: Share;
  openModal: boolean;
}) {
  return (
    <div className="space-y-5">
      <div
        className={cn(
          "flex gap-4",
          phone ? "flex-col" : "items-end justify-between",
        )}
      >
        <div className="min-w-0 space-y-1">
          <PageHeading className="truncate">{LIVE.name}</PageHeading>
          <StatLine />
        </div>
        {share === "front" ? (
          <div className="flex shrink-0 items-center gap-3">
            <QrBlock size={64} />
            <div className="w-64 space-y-1.5">
              <LinkRow className="h-8 text-xs" />
              <p className="text-xs text-muted-foreground">
                Public · guests scan or tap
              </p>
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 gap-2">
            <Button>
              <QrCode /> Share
            </Button>
            <Button variant="outline">
              <ImageUp /> Add photos
            </Button>
          </div>
        )}
      </div>
      <ReviewBanner />
      <Album />
      {openModal && <ShareModal />}
    </div>
  );
}

/* ── The one door every preview goes through ─────────────────────────────── */

export function EventPage({
  event,
  share,
  size,
  openModal = false,
}: {
  event: Event;
  share: Share;
  size: "laptop" | "phone";
  /**
   * ★ ONLY THE SHARE STEP OPENS THE DIALOG. `share: "modal"` is today's answer
   * everywhere else, and today's answer is a Share BUTTON with nothing over the
   * page: drawing the open dialog on every other step put a scrim over the
   * event page the reader was there to judge (found by reading the first
   * captures against their words).
   */
  openModal?: boolean;
}) {
  const phone = size === "phone";
  const props = { phone, share, openModal };
  if (event === "feed") return <FeedPage {...props} />;
  if (event === "hub") return <HubPage {...props} />;
  return <AlbumPage {...props} />;
}

/** The share ROOM is a page of its own, so it replaces the event page rather
 *  than sitting on it. */
export function ShareRoomPage({ size }: { size: "laptop" | "phone" }) {
  return (
    <div className="space-y-5">
      <PageHeading>Share</PageHeading>
      <ShareRoom phone={size === "phone"} />
    </div>
  );
}

/** Settings, drawn in whichever place was picked. `column` and `rooms` are
 *  pages; `sheet` is the album with a panel over it. */
export function SettingsScreen({
  setting,
  size,
}: {
  setting: Setting;
  size: "laptop" | "phone";
}) {
  const phone = size === "phone";
  if (setting === "sheet") {
    return (
      <div className="space-y-5">
        <div className="min-w-0 space-y-1">
          <PageHeading className="truncate">{LIVE.name}</PageHeading>
          <StatLine />
        </div>
        <Album />
        <SettingsSheet phone={phone} />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <PageHeading>Settings</PageHeading>
      {setting === "column" ? <SettingsColumn /> : <SettingsRooms />}
    </div>
  );
}
