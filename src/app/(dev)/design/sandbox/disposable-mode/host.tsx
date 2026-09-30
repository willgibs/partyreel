"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleX,
  Clapperboard,
  Eye,
  EyeOff,
  Images,
  Link2,
  ListChecks,
  Settings,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";

import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  reviewCardFace,
  roomCardSize,
  roomRowLayout,
} from "@/components/app/event-feed/room-card";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { EVENT_ROOMS, type EventRoomId } from "@/lib/event/sections";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import type { CameraId } from "./cam-shared";
import {
  EVENT,
  HOST,
  PARTY,
  PRIYA,
  ROLL,
  ROLL_STILLS,
  type Still,
} from "./fixtures";
import { FilmStill, type LookId } from "./film";
import type { ScreenId } from "./knobs";
import { AlbumThumb, CameraThumb } from "./thumbs";

/**
 * THE HOST'S TWO SURFACES, QUOTED: her event's hub (`/dashboard/[eventId]`,
 * the code, the rooms row, the album) and Create (`create-event-wizard.tsx`),
 * each at the app's tokens with the one thing an option adds drawn into it.
 * The hub needs a session and the wizard a form and a Server Action, so both
 * are redrawn from the same primitives in their own order and words;
 * wherever production's piece is presentational it is imported (the room
 * cards' shell and the Review face, the section header, the code).
 *
 * Nothing is wired: every control is inert (`tabIndex={-1}`), drawn at rest.
 */

export const deskOf = (screen: ScreenId) => screen === "1440";

/* ── the app's bar and page ─────────────────────────────────────────────── */

function HostBar({ screen, trail }: { screen: ScreenId; trail?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-14 items-center gap-4">
        <span className="shrink-0">
          <Logo />
        </span>
        {trail && (
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
          >
            {deskOf(screen) ? (
              <>
                <span>Partyreel</span>
                <span aria-hidden className="text-faint">
                  /
                </span>
                <span className="truncate font-medium text-foreground">
                  {trail}
                </span>
              </>
            ) : (
              <span className="flex min-w-0 items-center gap-1">
                <ChevronLeft className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Partyreel</span>
              </span>
            )}
          </nav>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            tabIndex={-1}
            aria-label="Notifications"
          >
            <Bell />
          </Button>
          <Avatar size="sm" seed={HOST.seed}>
            <AvatarFallback className="text-[10px]">
              {HOST.displayName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </div>
      </Container>
    </header>
  );
}

function HostPage({
  screen,
  trail,
  overlay,
  children,
}: {
  screen: ScreenId;
  trail?: string;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <HostBar screen={screen} trail={trail} />
      <main className="py-8">
        <Container>{children}</Container>
      </main>
      {overlay}
    </div>
  );
}

/* ── the hub ────────────────────────────────────────────────────────────── */

/**
 * The cards row at rest, on `room-card.ts`'s one shell and its Review face,
 * in production's own order (`EVENT_ROOMS`: Highlight reel, Guests, Review,
 * Settings) and its own label (the heading face at its one weight).
 */
function Rooms({ review, pending }: { review: boolean; pending: number }) {
  const face = reviewCardFace(review, pending);
  const cards: Record<
    EventRoomId,
    { value: string; Icon: typeof ListChecks; amber?: boolean }
  > = {
    reel: { value: `Premieres at ${ROLL.develops}`, Icon: Clapperboard },
    guests: { value: `${PARTY.guests} guests`, Icon: Users },
    review: { value: face.value, Icon: ListChecks, amber: face.amber },
    settings: { value: "Disposable", Icon: Settings },
  };
  return (
    <div role="group" aria-label="This event" className={roomRowLayout(false)}>
      {EVENT_ROOMS.map(({ id, label }) => {
        const { value, Icon, amber } = cards[id];
        return (
          <span
            key={id}
            data-dm-room-card={id}
            className={cn(
              ROOM_CARD_BASE,
              roomCardSize(false),
              amber ? "border-warning/40 bg-warning/5" : ROOM_CARD_QUIET,
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                amber ? "text-warning" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="font-heading text-card-title">{label}</span>
            <span
              className={cn(
                "truncate text-xs tabular-nums",
                ROOM_CARD_VALUE,
                amber ? "font-medium text-warning" : "text-muted-foreground",
              )}
            >
              {value}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * THE EVENT'S HUB at 10:40 pm: the code beside the title and its metadata,
 * the cards row, then the album's area, which is what the peek decides.
 */
export function Hub({
  screen,
  area,
  review,
  pending = 0,
  overlay,
}: {
  screen: ScreenId;
  area: ReactNode;
  review: boolean;
  pending?: number;
  overlay?: ReactNode;
}) {
  return (
    <HostPage screen={screen} trail={EVENT.name} overlay={overlay}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="shrink-0 rounded-lg bg-white p-2">
            <FooterQr
              value={`https://${EVENT.address}`}
              size={deskOf(screen) ? 112 : 88}
            />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <PageHeading className="truncate">{EVENT.name}</PageHeading>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{EVENT.date}</span>
              <span className="flex items-center gap-1.5">
                <Camera className="size-3.5" aria-hidden />
                {PARTY.shots}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                {PARTY.guests}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <Link2
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {EVENT.address}
              </span>
            </div>
          </div>
        </div>
        <Rooms review={review} pending={pending} />
        {area}
      </div>
    </HostPage>
  );
}

/* ── the album's area, three ways ───────────────────────────────────────── */

/** One of the roll's photographs as her album lays it, in the roll's look. */
function Tile({
  still,
  look,
  flag,
}: {
  still: Still;
  look: LookId;
  flag?: boolean;
}) {
  return (
    <div
      style={
        {
          aspectRatio: `${still.width} / ${still.height}`,
          borderRadius: "var(--radius-tile)",
        } as CSSProperties
      }
      className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
      data-dm-tile
    >
      <FilmStill
        still={still}
        look={look}
        stamp={false}
        className="size-full"
      />
      {flag && (
        <span
          className={cn(
            GLASS,
            "absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-2 py-1 text-micro font-medium text-white",
          )}
          data-dm-flag
        >
          <TriangleAlert className="size-3" aria-hidden />
          Taken before the party?
        </span>
      )}
    </div>
  );
}

/** Her album, open: every shot so far, marked as developing, one flagged. */
export function OpenAlbum({
  look,
  screen,
  early,
  count = PARTY.shots,
}: {
  look: LookId;
  screen: ScreenId;
  /** Opened under the cover for this visit: the line that puts it back. */
  early?: boolean;
  count?: number;
}) {
  const stills = deskOf(screen) ? ROLL_STILLS : ROLL_STILLS.slice(0, 6);
  return (
    <div className="space-y-2.5" data-dm-album="open">
      <FeedSectionHeader label="Album" count={count} />
      <p
        className="flex items-center gap-2 text-sm text-muted-foreground"
        data-dm-say
      >
        {early ? (
          <>
            <Eye className="size-4 shrink-0" aria-hidden />
            {`You're looking early. Guests see these at ${ROLL.develops}.`}
            <span className="ml-auto shrink-0 font-medium text-foreground">
              Cover it
            </span>
          </>
        ) : (
          <>
            <span className="size-2 shrink-0 rounded-full bg-[oklch(0.62_0.19_25)]" />
            {`Developing. Guests see these at ${ROLL.develops}.`}
          </>
        )}
      </p>
      <div
        className={cn(
          "gap-[var(--gap-gallery)]",
          deskOf(screen) ? "columns-5" : "columns-2",
        )}
      >
        {stills.map((s, i) => (
          <Tile key={s.id} still={s} look={look} flag={i === 3} />
        ))}
      </div>
    </div>
  );
}

/** `peek=covered`: the album waits under a cover she can lift for a visit. */
export function CoverCard() {
  return (
    <div className="space-y-2.5" data-dm-album="covered">
      <FeedSectionHeader label="Album" count={PARTY.shots} />
      <div className="dm-cover surface-ink px-6 py-10 text-center">
        <span aria-hidden className="dm-room-light" />
        <p className="relative font-heading text-section tabular-nums">
          {PARTY.shots}
        </p>
        <p className="relative mt-1 text-reading">shots developing</p>
        <p
          className="relative mt-3 text-working text-pretty text-muted-foreground"
          data-dm-say
        >
          {`Your guests see them at ${ROLL.develops}. So do you, unless you look now.`}
        </p>
        <div className="relative mt-5 flex flex-wrap justify-center gap-2">
          <Button type="button" tabIndex={-1} data-dm-reach>
            <Eye /> Look anyway
          </Button>
          <Button type="button" variant="outline" tabIndex={-1}>
            Develop now
          </Button>
        </div>
      </div>
    </div>
  );
}

/** `peek=waits`: her album is the darkroom too, Develop now her one door. */
export function WaitCard({
  review,
  pending,
}: {
  review: boolean;
  pending: number;
}) {
  return (
    <div className="space-y-2.5" data-dm-album="waits">
      <FeedSectionHeader label="Album" count={PARTY.shots} />
      <div className="dm-cover surface-ink px-6 py-10 text-center">
        <span aria-hidden className="dm-room-light" />
        <p className="relative font-heading text-section tabular-nums">
          {PARTY.shots}
        </p>
        <p className="relative mt-1 text-reading">shots developing</p>
        <p
          className="relative mt-3 text-working text-pretty text-muted-foreground"
          data-dm-say
        >
          {review
            ? `You see each one in Review as you approve it (${pending} waiting). The rest waits for ${ROLL.develops}, for you too.`
            : `You see them at ${ROLL.develops} with everyone.`}
        </p>
        <div className="relative mt-5 flex justify-center">
          <Button type="button" variant="outline" tabIndex={-1}>
            Develop now
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── taking a shot out, in her viewer ───────────────────────────────────── */

/**
 * THE HOST'S VIEWER, QUOTED (the shared media viewer: the credit top left,
 * the close top right, the capsule at the foot with her curate group behind
 * a divider), over the shot she is about to take out of the roll.
 */
export function HostViewer({ look }: { look: LookId }) {
  const still = ROLL_STILLS[3];
  return (
    <div
      className="relative flex min-h-screen flex-col bg-black text-white"
      data-dm-viewer
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <span className="flex items-center gap-2">
          <Avatar size="sm" seed={PRIYA.seed}>
            <AvatarFallback className="text-[10px]">
              {PRIYA.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{PRIYA.name}</span>
          <span className="text-xs text-white/55">10:18 pm</span>
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
          <X className="size-5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-1 items-center">
        <FilmStill
          still={still}
          look={look}
          className="w-full"
          style={{ aspectRatio: `${still.width} / ${still.height}` }}
        />
      </div>
      <p
        className="px-6 pb-3 text-center text-sm text-pretty text-white/70"
        data-dm-say
      >
        {`Guests see this at ${ROLL.develops} unless you take it out.`}
      </p>
      <div className="flex justify-center pb-8">
        <span
          className={cn(
            GLASS,
            "flex items-center gap-5 rounded-full px-5 py-3 text-white/85",
          )}
        >
          <Eye className="size-5" aria-hidden />
          <span aria-hidden className="h-5 w-px bg-white/20" />
          <span className="flex items-center gap-1.5 text-sm">
            <EyeOff className="size-5" aria-hidden /> Hide
          </span>
          <span
            className="flex items-center gap-1.5 text-sm font-medium text-white"
            data-dm-reach
          >
            <Trash2 className="size-5" aria-hidden /> Take out
          </span>
        </span>
      </div>
    </div>
  );
}

/** Her Review room, quoted: the held shots she approves one by one. */
export function ReviewQueue({
  look,
  pending,
  screen,
}: {
  look: LookId;
  pending: number;
  screen: ScreenId;
}) {
  return (
    <HostPage screen={screen} trail={EVENT.name}>
      <div className="space-y-4" data-dm-review>
        <div className="flex items-center justify-between">
          <PageHeading>Review</PageHeading>
          <span className="text-sm text-warning tabular-nums">{`${pending} waiting`}</span>
        </div>
        <p className="text-sm text-pretty text-muted-foreground" data-dm-say>
          {`Each one develops for everyone at ${ROLL.develops} once you approve it.`}
        </p>
        <div className="grid grid-cols-2 gap-[var(--gap-gallery)]">
          {ROLL_STILLS.slice(0, 4).map((s) => (
            <div
              key={s.id}
              className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-tile)]"
            >
              <FilmStill
                still={s}
                look={look}
                stamp={false}
                className="size-full"
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" tabIndex={-1}>
            <CircleX className="text-warning" /> Reject
          </Button>
          <Button type="button" tabIndex={-1}>
            <Check /> Approve
          </Button>
        </div>
      </div>
    </HostPage>
  );
}

/* ── Create's new step ──────────────────────────────────────────────────── */

export type CreateShape = "cards" | "phone" | "compare";
export type Kind = "album" | "camera";

const FACTS: Record<Kind, { title: string; line: string; facts: string[] }> = {
  album: {
    title: "An album",
    line: "Everyone adds from their phones, and sees it all as it lands.",
    facts: [
      "Photos from their phones, and videos on a paid plan",
      "In the album the moment they land",
      "The reel plays as the album grows",
    ],
  },
  camera: {
    title: "A disposable camera",
    line: "Everyone shoots on the album's own camera, and sees it all at once.",
    facts: [
      `${ROLL.shots} shots each, on the album's own camera`,
      `Develops for everyone at ${ROLL.develops} the next morning`,
      "The reel premieres the whole roll",
    ],
  },
};

function Steps({ active }: { active: number }) {
  const labels = ["Name", "Guests add", "Style", "Ready"];
  return (
    <ol
      data-dm-steps
      className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs"
    >
      {labels.map((label, i) => {
        const n = i + 1;
        const on = n === active;
        const done = n < active;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-micro font-medium",
                on
                  ? "bg-brand text-brand-foreground"
                  : done
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3" /> : n}
            </span>
            <span
              className={cn(
                on ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {n < labels.length && (
              <ArrowRight className="size-3 text-muted-foreground" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The camera's three defaults once it is picked, each changeable right here. */
function Defaults({ look }: { look: LookId }) {
  const looks: Record<LookId, string> = {
    warm: "Warm",
    cool: "Cool",
    mono: "B&W",
    clean: "No look",
  };
  return (
    <div className="flex flex-wrap gap-1.5" data-dm-defaults>
      {[
        `${ROLL.shots} shots each`,
        `Develops ${ROLL.develops} tomorrow`,
        looks[look],
      ].map((d) => (
        <span
          key={d}
          className="flex h-7 items-center gap-1 rounded-action-sm border border-border px-2.5 text-xs font-medium"
        >
          {d}
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
        </span>
      ))}
    </div>
  );
}

function Picture({
  kind,
  camera,
  look,
  className,
}: {
  kind: Kind;
  camera: CameraId;
  look: LookId;
  className?: string;
}) {
  return kind === "camera" ? (
    <CameraThumb id={camera} look={look} className={className} />
  ) : (
    <AlbumThumb className={className} />
  );
}

/** `create=cards`: two big cards, a picture and three facts each. */
function Cards({
  picked,
  camera,
  look,
  wide,
}: {
  picked: Kind;
  camera: CameraId;
  look: LookId;
  wide: boolean;
}) {
  return (
    <div
      className={cn("grid gap-3", wide ? "grid-cols-2" : "grid-cols-1")}
      data-dm-control
    >
      {(["album", "camera"] as const).map((k) => {
        const on = picked === k;
        const f = FACTS[k];
        return (
          <span
            key={k}
            data-state={on ? "on" : "off"}
            data-dm-choice={k}
            className={cn(
              "flex gap-3 rounded-xl border p-3 text-left",
              wide ? "flex-col" : "flex-row",
              on ? "border-foreground ring-1 ring-foreground" : "border-border",
            )}
          >
            <Picture
              kind={k}
              camera={camera}
              look={look}
              className={cn(
                "shrink-0",
                wide ? "aspect-[4/3] w-full" : "aspect-[3/4] w-24",
              )}
            />
            <span className="min-w-0 space-y-1.5">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {k === "camera" ? (
                  <Camera className="size-3.5" aria-hidden />
                ) : (
                  <Images className="size-3.5" aria-hidden />
                )}
                {f.title}
                {on && <Check className="ml-auto size-4" aria-hidden />}
              </span>
              <ul className="space-y-1 text-xs text-pretty text-muted-foreground">
                {f.facts.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {on && k === "camera" && <Defaults look={look} />}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** `create=phone`: one switch over the guest's own screen, the facts beside it. */
function PhoneChoice({
  picked,
  camera,
  look,
  wide,
}: {
  picked: Kind;
  camera: CameraId;
  look: LookId;
  wide: boolean;
}) {
  const f = FACTS[picked];
  return (
    <div className="space-y-4" data-dm-control>
      <div
        className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        data-dm-switch
      >
        {(["album", "camera"] as const).map((k) => (
          <span
            key={k}
            data-state={picked === k ? "on" : "off"}
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground"
          >
            {k === "camera" ? (
              <Camera className="size-3.5" aria-hidden />
            ) : (
              <Images className="size-3.5" aria-hidden />
            )}
            {FACTS[k].title}
          </span>
        ))}
      </div>
      <div
        className={cn(
          "flex gap-5",
          wide ? "flex-row items-center" : "flex-col items-center",
        )}
      >
        <span className="dm-phone-mock shrink-0">
          <Picture
            kind={picked}
            camera={camera}
            look={look}
            className="size-full"
          />
        </span>
        <div className={cn("space-y-2", !wide && "w-full")}>
          <p className="text-sm font-medium">{f.line}</p>
          <ul className="space-y-1 text-sm text-pretty text-muted-foreground">
            {f.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {picked === "camera" && <Defaults look={look} />}
        </div>
      </div>
    </div>
  );
}

/** `create=compare`: the two as columns of one table, row by row. */
function Compare({ picked, look }: { picked: Kind; look: LookId }) {
  const rows: [string, string, string][] = [
    [
      "How guests add",
      "From their phones, any time",
      `On the album's camera, ${ROLL.shots} shots each`,
    ],
    [
      "When they see it",
      "The moment it lands",
      `Together, at ${ROLL.develops} the next morning`,
    ],
    ["The reel", "Plays as the album grows", "Premieres the whole roll"],
    ["On Free", "About 30 photos", "About 30 shots"],
  ];
  return (
    <div className="space-y-3" data-dm-control>
      <div className="overflow-hidden rounded-xl border" data-dm-table>
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] border-b bg-muted/50 text-sm font-medium">
          <span className="p-2.5" />
          {(["album", "camera"] as const).map((k) => (
            <span
              key={k}
              data-state={picked === k ? "on" : "off"}
              className="flex items-center gap-1.5 p-2.5 data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              <span
                className={cn(
                  "size-3.5 shrink-0 rounded-full border",
                  picked === k
                    ? "border-background bg-background"
                    : "border-muted-foreground",
                )}
              />
              {FACTS[k].title}
            </span>
          ))}
        </div>
        {rows.map(([label, a, b]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] border-b text-xs last:border-b-0"
          >
            <span className="p-2.5 font-medium text-muted-foreground">
              {label}
            </span>
            <span
              className={cn(
                "p-2.5 text-pretty",
                picked === "album" && "bg-muted/60",
              )}
            >
              {a}
            </span>
            <span
              className={cn(
                "p-2.5 text-pretty",
                picked === "camera" && "bg-muted/60",
              )}
            >
              {b}
            </span>
          </div>
        ))}
      </div>
      {picked === "camera" && <Defaults look={look} />}
    </div>
  );
}

/**
 * CREATE, with the new step between the name and the code's style
 * (`pick=step`, settled). `picked` is what the step holds: the album as a new
 * event starts, or the camera once she picks it.
 */
export function CreateStep({
  screen,
  shape,
  picked,
  camera,
  look,
}: {
  screen: ScreenId;
  shape: CreateShape;
  picked: Kind;
  camera: CameraId;
  look: LookId;
}) {
  const wide = deskOf(screen);
  return (
    <HostPage screen={screen}>
      <div className="space-y-6">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back to events
        </span>
        <Card className="mx-auto w-full max-w-xl" data-dm-create>
          <CardHeader>
            <CardTitle>Create an event</CardTitle>
            <CardDescription>
              Name it, choose how guests add photos, pick a style for the code,
              and you&rsquo;re collecting.
            </CardDescription>
            <Steps active={2} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">How will guests add photos?</p>
              <p className="text-sm text-muted-foreground">
                {`For ${EVENT.name}'s wedding. You can switch any time in Settings, both ways.`}
              </p>
            </div>
            {shape === "cards" && (
              <Cards picked={picked} camera={camera} look={look} wide={wide} />
            )}
            {shape === "phone" && (
              <PhoneChoice
                picked={picked}
                camera={camera}
                look={look}
                wide={wide}
              />
            )}
            {shape === "compare" && <Compare picked={picked} look={look} />}
          </CardContent>
          <CardFooter className="justify-between">
            <Button type="button" variant="ghost" tabIndex={-1}>
              <ArrowLeft /> Back
            </Button>
            <Button type="button" tabIndex={-1}>
              Continue <ArrowRight />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </HostPage>
  );
}
