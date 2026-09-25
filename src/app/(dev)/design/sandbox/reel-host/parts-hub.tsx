"use client";

import type { ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Copy,
  Download,
  Eye,
  ImagePlus,
  ImageUp,
  Images,
  Link2,
  ListChecks,
  MonitorPlay,
  Plus,
  Printer,
  QrCode,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { StyledQr } from "@/components/app/styled-qr";
import { Logo } from "@/components/shared/logo";
import { MasonryColumns } from "@/components/shared/masonry";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn, formatEventDate } from "@/lib/utils";

import {
  albumAt,
  EVENT,
  JOIN_LABEL,
  JOIN_URL,
  LIVE_ALBUM_COUNT,
  LIVING_STILLS,
  MINIMUM,
  QR_STYLE,
  stillOf,
} from "./fixtures";
import { Living, Pips } from "./parts-living";
import type { Device } from "./parts-view";

/**
 * THE HOST'S EVENT PAGE, QUOTED CLASS FOR CLASS RATHER THAN MOUNTED.
 *
 * `[eventId]/page.tsx` is a server page and `EventCardsRow` calls
 * `useEventShare()` (a provider this board has no business standing up) and
 * renders a `next/link` per card, so the hub is quoted at rest: the bar with
 * its crumb trail (`crumbs.tsx`: the whole trail at a desk, one step back in a
 * hand), the live code at the left of the title (`event-code-door.tsx`, 112 px
 * on a white plate), the metadata row with the Live pip and the link, the four
 * doors (`event-cards-row.tsx` at rest: `h-24`, `w-40` at a laptop and `w-36`
 * in a hand), then the album as `event-gallery.tsx` draws it: its header with
 * the four verbs and the real `MasonryColumns`. Before the first photograph the
 * album's place is the launch list (`launch-list.tsx`) for this event, whose
 * date and note are set, so only its print row and its share door remain.
 *
 * ★ THE ALBUM IS PRODUCTION'S OWN GRID, NEVER A STAND-IN. No question here is
 * about the album's layout (that is `album-columns`), which is exactly why it
 * is drawn as it ships: an option judged beside a grid that does not exist
 * would be judged on the wrong page.
 *
 * ★ A DEVICE PROP, NEVER A BREAKPOINT (the view's own reason): the hub is drawn
 * in real 375 and 1440 frames and inside the review composite's phone box, so
 * every size here is keyed off `device`. The masonry needs none: it counts its
 * columns off its own box, which is what makes it right inside the phone box.
 */

/* ── the app's top bar ───────────────────────────────────────────────────── */

export function AppBar({
  device,
  bell = 0,
  bellPanel,
  trail,
}: {
  device: Device;
  /** The bell's badge: the host's waiting total across events, as wired. */
  bell?: number;
  /** The bell's panel, drawn open under it. */
  bellPanel?: ReactNode;
  /** The crumb trail; the event's page by default. */
  trail?: readonly string[];
}) {
  const phone = device === "phone";
  const steps = trail ?? ["Partyreel", EVENT.name];
  const parent = steps.length > 1 ? steps[steps.length - 2] : null;
  return (
    <header
      className={cn(
        "relative flex h-14 items-center justify-between gap-3 border-b border-border/60",
        phone ? "px-4" : "px-6",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-4">
        <Logo />
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 items-center text-sm"
        >
          {phone ? (
            parent ? (
              <span className="flex min-w-0 items-center gap-0.5 text-muted-foreground">
                <ChevronLeft className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{parent}</span>
              </span>
            ) : null
          ) : (
            <ol className="flex min-w-0 items-center gap-1">
              {steps.map((label, i) => (
                <li
                  key={`${label}-${i}`}
                  className="flex min-w-0 items-center gap-1"
                >
                  {i > 0 ? (
                    <ChevronRight
                      className="size-3.5 shrink-0 text-muted-foreground/60"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={
                      i === steps.length - 1
                        ? "truncate font-medium text-foreground"
                        : "truncate text-muted-foreground"
                    }
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </nav>
      </span>
      <span className="relative flex shrink-0 items-center gap-1.5">
        <span
          data-rh-bell={bell}
          className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground"
        >
          <Bell className="size-5" aria-hidden />
          {bell > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
              {bell}
            </span>
          ) : null}
        </span>
        <Avatar size="sm" seed="reel-host-mia">
          <AvatarFallback className="text-[10px]">
            {EVENT.host.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        {bellPanel}
      </span>
    </header>
  );
}

/* ── the header: the live code, the name, the numbers, the link ─────────── */

/**
 * The guests an album of `items` photographs has: one each while the album is
 * this small (a photograph is a guest, by upload), the shared event's 34 once
 * it is full. A hub at two photographs claiming 34 guests is a hub nobody has.
 */
const guestsAt = (items: number): number =>
  items >= LIVE_ALBUM_COUNT ? EVENT.guests : items;

/** The stills the Reel card crossfades: only the photographs the reel has. */
const livingAt = (items: number): string[] =>
  items >= LIVE_ALBUM_COUNT ? LIVING_STILLS : albumAt(items).map(stillOf);

function HubHeader({ device, items }: { device: Device; items: number }) {
  const phone = device === "phone";
  return (
    <div className={cn("flex items-center", phone ? "gap-3.5" : "gap-5")}>
      <span
        className="shrink-0 rounded-lg bg-white p-2"
        style={{ lineHeight: 0 }}
      >
        <StyledQr value={JOIN_URL} size={phone ? 72 : 112} style={QR_STYLE} />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <h1
          className={cn(
            "truncate font-heading",
            // The ladder's `page` step at each end: its phone end written out,
            // because inside the review composite's phone box the fluid step
            // would read the composite's 1440 viewport.
            phone
              ? "text-[1.5rem] leading-[1.89rem] tracking-[-0.02em]"
              : "text-page",
          )}
        >
          {EVENT.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground tabular-nums">
          <span>{formatEventDate(EVENT.date)}</span>
          <span className="flex items-center gap-1.5">
            <Images className="size-3.5" aria-hidden />
            {items}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden />
            {guestsAt(items)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" aria-hidden />
            {items === 0
              ? 3
              : items < MINIMUM
                ? 9
                : items === MINIMUM
                  ? 14
                  : 128}
          </span>
          {/* The page's one live island, as `EventLive` draws it once its
              channel is subscribed. */}
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Live
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{JOIN_LABEL}</span>
          <Copy className="size-3.5 shrink-0" aria-hidden />
        </div>
      </div>
    </div>
  );
}

/* ── the cards row ───────────────────────────────────────────────────────── */

const CARD_BASE =
  "relative flex h-24 shrink-0 flex-col justify-between gap-1 overflow-hidden rounded-xl border p-3";
const cardW = (device: Device) => (device === "phone" ? "w-36" : "w-40");

function Door({
  device,
  icon,
  label,
  value,
  amber,
  screen,
}: {
  device: Device;
  icon: ReactNode;
  label: string;
  value: string;
  amber?: boolean;
  /** The screen's own door, so a caption can find it. */
  screen?: boolean;
}) {
  return (
    <div
      data-rh-screen-door={screen ? "" : undefined}
      className={cn(
        CARD_BASE,
        cardW(device),
        amber ? "border-warning/40 bg-warning/5" : "border-border",
      )}
    >
      <span className={amber ? "text-warning" : "text-muted-foreground"}>
        {icon}
      </span>
      <span className="font-heading text-card-title font-medium">{label}</span>
      <span
        className={cn(
          "truncate text-xs tabular-nums",
          amber ? "font-medium text-warning" : "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * THE REEL CARD'S FACES. `living` is the labelled card over a calm living
 * thumbnail, from the minimum up: the one card in the row that shows what it
 * holds, because the reel is the one room whose contents move. `waiting` is the
 * plain labelled card below it, with nothing to show yet. `counting` is the
 * `progress=card` option (the photograph it has behind "1 more photo" and two
 * pips, already becoming the living card); `preview` is `progress=preview`
 * (the living card a photograph early, for the host alone).
 */
export type ReelFace = "living" | "waiting" | "counting" | "preview";

export function ReelCard({
  device,
  face,
  items,
}: {
  device: Device;
  face: ReelFace;
  items: number;
}) {
  const shell = cn(CARD_BASE, cardW(device));
  if (face === "living" || (face === "preview" && items > 0)) {
    const preview = face === "preview" && items < MINIMUM;
    return (
      <div
        data-rh-reel-card={preview ? "preview" : "living"}
        data-rh-said={preview ? "" : undefined}
        className={cn(shell, "border-transparent text-white")}
      >
        <Living stills={livingAt(items)} />
        {/* The overlay: heavier at the foot where the words sit, so the card
            reads at a glance over the brightest photograph in the take. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30"
        />
        <span className="relative flex items-center justify-between">
          <Clapperboard className="size-4 text-white/85" aria-hidden />
          {preview ? (
            <span className="rounded-full bg-white/20 px-1.5 text-[10px] leading-4 font-medium">
              Only you
            </span>
          ) : null}
        </span>
        <span className="relative font-heading text-card-title font-medium">
          Reel
        </span>
        <span className="relative truncate text-xs text-white/85 tabular-nums">
          {preview ? `Guests see it at ${MINIMUM}` : `${items} items`}
        </span>
      </div>
    );
  }
  if (face === "counting") {
    const first = albumAt(items)[0];
    return (
      <div
        data-rh-reel-card="counting"
        data-rh-said=""
        className={cn(
          shell,
          first
            ? "border-transparent text-white"
            : "border-dashed border-foreground/25",
        )}
      >
        {first ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
            <img
              src={stillOf(first)}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-black/60" />
          </>
        ) : null}
        <span className="relative flex items-center justify-between">
          <Clapperboard
            className={cn(
              "size-4",
              first ? "text-white/85" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <Pips have={items} of={MINIMUM} tone={first ? "light" : "ink"} />
        </span>
        <span className="relative font-heading text-card-title font-medium">
          Reel
        </span>
        <span
          className={cn(
            "relative truncate text-xs",
            first ? "text-white/85" : "text-muted-foreground",
          )}
        >
          {items === 0 ? `Starts at ${MINIMUM} photos` : "1 more photo"}
        </span>
      </div>
    );
  }
  // `waiting`, and `preview` with no photograph yet to play.
  return (
    <div
      data-rh-reel-card={face === "preview" ? "preview" : "waiting"}
      data-rh-said={face === "preview" ? "" : undefined}
      className={cn(shell, "border-border")}
    >
      <Clapperboard className="size-4 text-muted-foreground" aria-hidden />
      <span className="font-heading text-card-title font-medium">Reel</span>
      <span className="truncate text-xs text-muted-foreground">
        {face === "preview" ? "Plays from your first photo" : "Not yet"}
      </span>
    </div>
  );
}

/** A fifth door: "Play on a screen", the `open=hub` and `open=send` option. */
export function ScreenDoor({ device }: { device: Device }) {
  return (
    <Door
      device={device}
      screen
      icon={<MonitorPlay className="size-4" aria-hidden />}
      label="Play on a screen"
      value="Opens a new tab"
    />
  );
}

function CardsRow({
  device,
  items,
  reel,
  door,
  waiting,
}: {
  device: Device;
  items: number;
  reel: ReactNode;
  door?: ReactNode;
  waiting: number;
}) {
  const guests = guestsAt(items);
  return (
    <div
      role="group"
      aria-label="This event"
      className={cn(
        "flex gap-2",
        device === "phone" ? "-mr-4 overflow-hidden" : "",
      )}
    >
      <Door
        device={device}
        icon={<ListChecks className="size-4" aria-hidden />}
        label="Review"
        value={waiting > 0 ? `${waiting} waiting` : "All caught up"}
        amber={waiting > 0}
      />
      {reel}
      <Door
        device={device}
        icon={<Users className="size-4" aria-hidden />}
        label="Guests"
        value={`${guests} ${guests === 1 ? "guest" : "guests"}`}
      />
      <Door
        device={device}
        icon={<Settings className="size-4" aria-hidden />}
        label="Settings"
        value="Public"
      />
      {door}
    </div>
  );
}

/* ── the album, and the launch list before it ───────────────────────────── */

/**
 * The album's header as `event-gallery.tsx` draws it: the eyebrow and its
 * count, then Add photos, Download, Select and the one View menu, which wrap
 * under the eyebrow in a hand exactly as the real flex row does. Before the
 * first photograph it is named for what the room holds instead.
 */
function AlbumHeader({ items, launch }: { items: number; launch: number }) {
  return (
    <FeedSectionHeader
      label={items === 0 ? "Before the first photo" : "Album"}
      count={items || launch || undefined}
      action={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button variant="outline" size="sm" tabIndex={-1}>
            <ImageUp /> Add photos
          </Button>
          {items > 0 ? (
            <>
              <Button variant="outline" size="sm" tabIndex={-1}>
                <Download /> Download
              </Button>
              <Button variant="outline" size="sm" tabIndex={-1}>
                <ListChecks /> Select
              </Button>
            </>
          ) : null}
          <Button variant="outline" size="sm" tabIndex={-1}>
            <SlidersHorizontal /> View
          </Button>
        </div>
      }
    />
  );
}

/**
 * The album under the row: the shared fixture's photographs on the real
 * masonry, wrapped `pointer-events-none` so a reviewer's click never opens the
 * real lightbox inside a static preview.
 */
function Album({
  device,
  items,
  head,
}: {
  device: Device;
  items: number;
  /** A tile at the album's head, in the seat an arriving photograph takes. */
  head?: ReactNode;
}) {
  // A phone frame shows its first screen of the album, so eight is the whole
  // of what it can show; a laptop's frame holds every photograph the event has.
  const shown = albumAt(Math.min(items, device === "phone" ? 8 : items));
  return (
    <section aria-label="Album" className="space-y-2.5">
      <AlbumHeader items={items} launch={0} />
      <div data-rh-album="" className="pointer-events-none">
        <MasonryColumns items={shown} clampAspect viewerIsHost prefix={head} />
      </div>
    </section>
  );
}

/**
 * `progress=tile`: the album keeps a dashed tile at its head, in the seat
 * `MasonryColumns` gives its `prefix` (where a photograph arriving from this
 * page shows while it sends), so the tile sits exactly where the next one
 * lands.
 */
export function WaitingTile() {
  return (
    <div
      data-rh-said=""
      data-rh-waiting-tile=""
      className="mb-[var(--gap-gallery)] flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-tile)] border border-dashed border-foreground/25 p-3 text-center"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-muted">
        <Plus className="size-4 text-muted-foreground" aria-hidden />
      </span>
      <span className="text-xs text-muted-foreground">
        One more starts your highlight reel
      </span>
    </div>
  );
}

type LaunchRow = {
  id: string;
  icon: ReactNode;
  title: string;
  line: string;
  action: string;
};

const PRINT_ROW: LaunchRow = {
  id: "print",
  icon: (
    <Printer
      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      aria-hidden
    />
  ),
  title: "Print the table cards",
  line: "Nine to a page, or a welcome sign, or a poster.",
  action: "Print",
};

/** `progress=step`'s row: the reel as a thing that is left to do. */
const REEL_ROW: LaunchRow = {
  id: "reel",
  icon: (
    <Clapperboard
      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      aria-hidden
    />
  ),
  title: "Start your highlight reel",
  line: "It plays from the second photo, for everyone with the link.",
  action: "Add photos",
};

function LaunchItem({ row, said }: { row: LaunchRow; said?: boolean }) {
  return (
    <li
      data-rh-said={said ? "" : undefined}
      className="flex items-start gap-3 rounded-xl border border-border p-4"
    >
      {row.icon}
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-sm font-medium">{row.title}</span>
        <span className="block text-sm text-muted-foreground">{row.line}</span>
      </span>
      <Button variant="outline" size="sm" className="shrink-0" tabIndex={-1}>
        {row.action}
      </Button>
    </li>
  );
}

/** `launch-list.tsx` for this event (date and note set), with the reel's row when `step` adds it. */
function LaunchList({ withReel }: { withReel?: boolean }) {
  const rows = withReel ? [REEL_ROW, PRINT_ROW] : [PRINT_ROW];
  return (
    <section aria-label="Album" className="space-y-2.5">
      <AlbumHeader items={0} launch={rows.length} />
      <div className="py-2">
        <ol className="mx-auto max-w-xl space-y-2">
          {rows.map((row) => (
            <LaunchItem key={row.id} row={row} said={row.id === "reel"} />
          ))}
        </ol>
        <div className="flex justify-center pt-3">
          <Button size="sm" tabIndex={-1}>
            <QrCode /> Share the code
          </Button>
        </div>
        <p className="pt-3 text-center text-sm text-muted-foreground">
          The album takes this room back the moment a photograph lands.
        </p>
      </div>
    </section>
  );
}

/** `progress=step` once a photograph has landed: the one row stays above the album. */
export function StepRow() {
  return (
    <ol className="max-w-xl">
      <LaunchItem
        said
        row={{
          ...REEL_ROW,
          line: "One more photo and it plays, for everyone with the link.",
        }}
      />
    </ol>
  );
}

/* ── the progression's band, and the reel's own card on the page ────────── */

/**
 * `progress=band`: two frames that fill with the photographs themselves, the
 * path to the reel drawn in the reel's own material. At the minimum it plays
 * once, says the reel is live, and leaves: the unlock is the delight, the two
 * frames becoming the living thumbnail.
 */
export function ProgressBand({
  device,
  items,
}: {
  device: Device;
  items: number;
}) {
  const phone = device === "phone";
  const photos = albumAt(Math.min(items, MINIMUM));
  const live = items >= MINIMUM;
  return (
    <div
      data-rh-said=""
      data-rh-band={live ? "live" : `${items}`}
      className={cn(
        "flex rounded-xl border border-border bg-card",
        phone ? "flex-col gap-3 p-3" : "max-w-4xl items-center gap-5 p-4",
      )}
    >
      <div className={cn("flex shrink-0 gap-1.5", phone ? "w-full" : "w-56")}>
        {live ? (
          <span className="relative block aspect-video w-full overflow-hidden rounded-[var(--radius-tile)]">
            <Living stills={photos.map(stillOf)} />
          </span>
        ) : (
          Array.from({ length: MINIMUM }, (_, i) => {
            const m = photos[i];
            return m ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
              <img
                key={m.id}
                src={stillOf(m)}
                alt=""
                className={cn(
                  "w-1/2 rounded-[var(--radius-tile)] object-cover",
                  phone ? "aspect-video" : "aspect-[4/5]",
                )}
              />
            ) : (
              <span
                key={`seat-${i}`}
                className={cn(
                  "flex w-1/2 items-center justify-center rounded-[var(--radius-tile)] border border-dashed border-foreground/25",
                  phone ? "aspect-video" : "aspect-[4/5]",
                )}
              >
                <Plus className="size-4 text-muted-foreground" aria-hidden />
              </span>
            );
          })
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-2 font-heading text-card-title font-medium">
          <Clapperboard
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          {live
            ? "Your highlight reel is live"
            : items === 0
              ? "Your highlight reel starts at the second photo"
              : "Your highlight reel starts with the next photo"}
        </p>
        <p className="text-sm text-muted-foreground">
          {live
            ? "Guests can watch it on the album now, and make their own clip."
            : "Add one of yours, or share the code, and it plays for everyone with the link."}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {live ? (
          <Button size="sm" tabIndex={-1}>
            Watch
          </Button>
        ) : (
          <>
            <Button size="sm" tabIndex={-1}>
              <ImagePlus /> Add a photo
            </Button>
            <Button variant="outline" size="sm" tabIndex={-1}>
              <QrCode /> Share the code
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * `switch=card`: the reel's own card on the event page, the one that counts to
 * two before the reel starts, holding the switch once it plays.
 */
export function ReelHomeCard({ device }: { device: Device }) {
  const phone = device === "phone";
  return (
    <div
      data-rh-reel-home=""
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card",
        phone ? "p-3" : "max-w-4xl p-4",
      )}
    >
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-[var(--radius-tile)]",
          phone ? "aspect-[4/5] w-16" : "aspect-video w-40",
        )}
      >
        <Living />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-heading text-card-title font-medium">
          Highlight reel
        </p>
        <p className="text-sm text-muted-foreground">
          {phone
            ? "Live for guests."
            : "Live for guests on the album, in the view and on any screen."}
        </p>
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
        {!phone ? "Show the reel" : null}
        <Switch defaultChecked aria-label="Show the reel" tabIndex={-1} />
      </label>
    </div>
  );
}

/**
 * `open=send`'s second way in: a link made for the screen. It is the event's
 * own link with the screen posture on, so the laptop by the screen meets the
 * welcome like any guest's and needs no session of the host's.
 */
export function ScreenLinkRow() {
  return (
    <div
      data-rh-send-link=""
      className="flex max-w-xl items-center gap-3 rounded-xl border border-border p-3"
    >
      <MonitorPlay
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-sm font-medium">A link for the screen</span>
        <span className="block truncate text-xs text-muted-foreground tabular-nums">
          {JOIN_LABEL}?reel=screen
        </span>
        <span className="block text-xs text-muted-foreground">
          Open it on the computer by the screen. It meets the welcome like any
          guest.
        </span>
      </span>
      <Button variant="outline" size="sm" className="shrink-0" tabIndex={-1}>
        <Copy /> Copy
      </Button>
    </div>
  );
}

/* ── the whole page ──────────────────────────────────────────────────────── */

export function Hub({
  device,
  items,
  reel,
  door,
  below,
  above,
  head,
  launchWithReel,
  waiting = 0,
  bell = 0,
  bellPanel,
}: {
  device: Device;
  items: number;
  /** The Reel card, whichever face the question gives it. */
  reel?: ReactNode;
  /** A fifth door in the row. */
  door?: ReactNode;
  /** Right under the row (a link to send). */
  below?: ReactNode;
  /** Between the row and the album (a band, a card, a step). */
  above?: ReactNode;
  /** A tile at the album's head, where the next photograph lands. */
  head?: ReactNode;
  /** The launch list gains the reel's row (`progress=step` with none yet). */
  launchWithReel?: boolean;
  waiting?: number;
  bell?: number;
  bellPanel?: ReactNode;
}) {
  const phone = device === "phone";
  return (
    <div
      data-rh-hub={device}
      className="min-h-full bg-background text-foreground"
    >
      <AppBar device={device} bell={bell} bellPanel={bellPanel} />
      <div
        className={cn(phone ? "space-y-5 px-4 py-5" : "space-y-6 px-6 py-6")}
      >
        <HubHeader device={device} items={items} />
        <CardsRow
          device={device}
          items={items}
          waiting={waiting}
          reel={
            reel ?? (
              <ReelCard
                device={device}
                face={items >= MINIMUM ? "living" : "waiting"}
                items={items}
              />
            )
          }
          door={door}
        />
        {below}
        {above}
        {items === 0 ? (
          <LaunchList withReel={launchWithReel} />
        ) : (
          <Album device={device} items={items} head={head} />
        )}
      </div>
    </div>
  );
}
