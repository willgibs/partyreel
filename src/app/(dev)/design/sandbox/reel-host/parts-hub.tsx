"use client";

import type { ReactNode } from "react";
import {
  Bell,
  Clapperboard,
  Copy,
  Eye,
  ImagePlus,
  Images,
  Link2,
  ListChecks,
  MonitorPlay,
  Plus,
  Printer,
  QrCode,
  Settings,
  Users,
} from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  albumAt,
  EVENT,
  JOIN_LABEL,
  JOIN_URL,
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
 * renders a `next/link` per card, so the hub is quoted at rest: the live code
 * at the left of the title (`event-code-door.tsx`, 112 px on a white plate),
 * the metadata row and the link, the four doors (`event-cards-row.tsx` at rest:
 * `h-24`, `w-40` at a laptop and `w-36` in a hand, `font-heading
 * text-card-title`, the `text-xs` value line), then the album. The launch list
 * is `launch-list.tsx`'s own markup for this event, whose date and note are set,
 * so only its print row and its share door remain.
 *
 * ★ HIS HUB NOTE IS A GIVEN ON EVERY DRAWING HERE: the labelled Reel card wears
 * the calm living thumbnail as a full background with an overlay, from the
 * reel's minimum up. Below the minimum the card has no reel to show, and what
 * it says there is the `progress` question's to decide.
 *
 * ★ A DEVICE PROP, NEVER A BREAKPOINT (the view's own reason): the hub is drawn
 * in real 375 and 1440 frames and inside the review composite's phone box.
 */

/* ── the app's top bar ───────────────────────────────────────────────────── */

export function AppBar({
  device,
  bell = 0,
  bellPanel,
}: {
  device: Device;
  /** The bell's badge: the host's waiting total across events, as wired. */
  bell?: number;
  /** The bell's panel, drawn open under it. */
  bellPanel?: ReactNode;
}) {
  const phone = device === "phone";
  return (
    <header
      className={cn(
        "relative flex h-14 items-center justify-between gap-3 border-b border-border/60",
        phone ? "px-4" : "px-6",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Logo markOnly={phone} />
        {!phone ? (
          <span className="truncate text-sm text-muted-foreground">
            Partyreel / {EVENT.name}
          </span>
        ) : null}
      </span>
      <span className="relative flex items-center gap-1.5">
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
            "truncate font-heading font-semibold",
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
          {!phone ? <span>15 Aug 2026</span> : null}
          <span className="flex items-center gap-1.5">
            <Images className="size-3.5" aria-hidden />
            {items}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden />
            {items < MINIMUM ? items : EVENT.guests}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" aria-hidden />
            {items === 0 ? 3 : items < MINIMUM ? 9 : items === MINIMUM ? 14 : 128}
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
 * THE REEL CARD'S FACES. `living` is his hub note, the given from the minimum
 * up. `waiting` is the plain labelled card below it, with nothing to show yet.
 * `counting` is the `progress=card` option: the photograph it has behind "1
 * more photo" and two pips, the card already becoming the living one.
 */
export type ReelFace = "living" | "waiting" | "counting";

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
  if (face === "living") {
    return (
      <div
        data-rh-reel-card="living"
        className={cn(shell, "border-transparent text-white")}
      >
        <Living />
        {/* His "overlay": heavier at the foot where the words sit, so the
            card reads at a glance over the brightest photograph in the take. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30"
        />
        <Clapperboard className="relative size-4 text-white/85" aria-hidden />
        <span className="relative font-heading text-card-title font-medium">
          Reel
        </span>
        <span className="relative truncate text-xs text-white/80 tabular-nums">
          {items} items
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
          {items === 0 ? "Starts at 2 photos" : "1 more photo"}
        </span>
      </div>
    );
  }
  return (
    <div data-rh-reel-card="waiting" className={cn(shell, "border-border")}>
      <Clapperboard className="size-4 text-muted-foreground" aria-hidden />
      <span className="font-heading text-card-title font-medium">Reel</span>
      <span className="truncate text-xs text-muted-foreground">Not yet</span>
    </div>
  );
}

/** A fifth door: "Play on a screen", the `open=hub` and `open=link` option. */
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
  const guests = items < MINIMUM ? items : EVENT.guests;
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
 * The album under the row: the shared fixture's photographs in a plain tile
 * grid, so the hub a question is judged on is a hub with an event in it. Not
 * the masonry: no question here is about the album's layout, and a plain grid
 * reads the same in a real frame and in the composite's phone box.
 */
function AlbumGrid({
  device,
  items,
  after,
}: {
  device: Device;
  items: number;
  /** One more tile after the photographs: the `progress=tile` option's. */
  after?: ReactNode;
}) {
  const shown = albumAt(Math.min(items, device === "phone" ? 6 : 12));
  return (
    <div className="space-y-2.5">
      <p className="text-label font-semibold text-muted-foreground uppercase tabular-nums">
        Album <span className="font-normal">{items}</span>
      </p>
      <div
        className={cn(
          "grid gap-1",
          device === "phone" ? "grid-cols-2" : "grid-cols-6",
        )}
      >
        {shown.map((m) => (
          // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
          <img
            key={m.id}
            src={stillOf(m)}
            alt=""
            className="aspect-[4/5] w-full rounded-[var(--radius-tile)] object-cover"
          />
        ))}
        {after}
      </div>
    </div>
  );
}

/** `progress=tile`: the album keeps a dashed seat for the photograph that starts the reel. */
export function WaitingTile() {
  return (
    <div
      data-rh-said=""
      data-rh-waiting-tile=""
      className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-tile)] border border-dashed border-foreground/25 p-3 text-center"
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
      <span className="flex h-7 shrink-0 items-center rounded-[calc(var(--radius-action)*0.7)] border border-border px-2.5 text-xs font-medium">
        {row.action}
      </span>
    </li>
  );
}

/** `launch-list.tsx` for this event (date and note set), with the reel's row when `step` adds it. */
function LaunchList({ withReel }: { withReel?: boolean }) {
  const rows = withReel ? [REEL_ROW, PRINT_ROW] : [PRINT_ROW];
  return (
    <div className="py-2">
      <ol className="mx-auto max-w-xl space-y-2">
        {rows.map((row) => (
          <LaunchItem key={row.id} row={row} said={row.id === "reel"} />
        ))}
      </ol>
      <div className="flex justify-center pt-3">
        <span className="flex h-7 items-center gap-1 rounded-[calc(var(--radius-action)*0.7)] bg-primary px-2.5 text-xs font-medium text-primary-foreground">
          <QrCode className="size-3.5" aria-hidden />
          Share the code
        </span>
      </div>
      <p className="pt-3 text-center text-sm text-muted-foreground">
        The album takes this room back the moment a photograph lands.
      </p>
    </div>
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
          <span className="flex h-8 items-center rounded-action-sm bg-primary px-3 text-sm font-medium text-primary-foreground">
            Watch
          </span>
        ) : (
          <>
            <span className="flex h-8 items-center gap-1.5 rounded-action-sm bg-primary px-3 text-sm font-medium text-primary-foreground">
              <ImagePlus className="size-4" aria-hidden />
              Add a photo
            </span>
            <span className="flex h-8 items-center gap-1.5 rounded-action-sm border border-border px-3 text-sm font-medium">
              <QrCode className="size-4" aria-hidden />
              Share the code
            </span>
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

/** `open=link`'s second way in: a link for a machine that is not yours, drawn as later work. */
export function ScreenLinkRow() {
  return (
    <div data-rh-link-later="" className="max-w-xl space-y-1.5">
      <div className="flex items-center gap-2 rounded-[var(--radius)] border border-dashed border-border px-3 py-2">
        <MonitorPlay
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground tabular-nums">
          partyreel.com/screen/9f2c4a
        </span>
        <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-xs text-muted-foreground">
        Later: a screen link for a gated event is a capability token, so it
        expires, can be revoked, and never carries your session.
      </p>
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
  after,
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
  /** Right under the row (a later link). */
  below?: ReactNode;
  /** Between the row and the album (a band, a card, a step). */
  above?: ReactNode;
  /** One more tile after the album's photographs. */
  after?: ReactNode;
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
      <div className={cn(phone ? "space-y-5 px-4 py-5" : "space-y-6 px-6 py-6")}>
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
          <AlbumGrid device={device} items={items} after={after} />
        )}
      </div>
    </div>
  );
}
