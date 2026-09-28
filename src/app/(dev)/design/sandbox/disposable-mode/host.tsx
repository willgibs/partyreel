"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronLeft,
  Clapperboard,
  Eye,
  Images,
  Link2,
  ListChecks,
  Lock,
  Settings,
  Users,
  X,
} from "lucide-react";

import {
  ROOM_CARD_BASE,
  ROOM_CARD_QUIET,
  ROOM_CARD_VALUE,
  roomCardSize,
  roomRowLayout,
} from "@/components/app/event-feed/room-card";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { MediaTile } from "@/components/app/media-grid";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  asMedia,
  EVENT,
  EVENT_PASS,
  FREE_BYTES,
  HOST,
  MB,
  PRO_100,
  ROLL,
  ROLL_STILLS,
  SCENE,
} from "./fixtures";
import { FilmStill, type LookId } from "./film";
import type { ScreenId } from "./knobs";

/**
 * THE HOST'S TWO SURFACES, QUOTED: Create (`create-event-wizard.tsx`, under
 * the app's bar at /dashboard/new) and Settings (`event-settings-sheet.tsx`,
 * the settings kind: the whole screen under a back arrow in a hand, the panel
 * beside the album at a desk), each at the app's tokens with the one thing an
 * option adds drawn into it. The wizard itself needs a form, a router and a
 * Server Action, and the sheet a portal, so both are redrawn from the same
 * primitives (`Card`, `Input`, `Switch`, `Button`) in their own order and
 * words; wherever production's piece is presentational it is imported (the
 * hub's room cards, its section header, the code, the album's tile).
 *
 * ★ THE CAMERA'S ROWS LIVE IN GUEST UPLOADS, at its head, because how guests
 * add photos is that card's own question ("Control whether and how guests
 * contribute"). `event-settings` is restructuring the whole sheet; these rows
 * move with whatever structure wins there, which is why nothing here asks
 * where the card sits.
 *
 * Nothing is wired: every control is inert (`tabIndex={-1}`), drawn at rest.
 */

export const deskOf = (screen: ScreenId) => screen === "1440";

/* ── the app's bar and page ─────────────────────────────────────────────── */

/** `AppShell`'s bar, quoted: the wordmark, the trail when a page claims one, the bell and her face. */
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

/* ── Create ─────────────────────────────────────────────────────────────── */

export type CreateShape = "line" | "cards" | "step" | "settings";

const NAME = "Maya & Jay's wedding";

/** The step list under the card's head, as the wizard draws it. */
function Steps({
  labels,
  active,
}: {
  labels: readonly string[];
  active: number;
}) {
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

/** The name, at the size it will be on the event (`asks=one`'s field, quoted). */
function NameField() {
  return (
    <div className="space-y-2" data-dm-control>
      <p className="text-sm text-muted-foreground">
        What are you collecting photos for?
      </p>
      <Input
        readOnly
        tabIndex={-1}
        defaultValue={NAME}
        aria-label="Event name"
        className="h-auto rounded-none border-0 border-b-2 border-border bg-transparent px-0 py-2 font-heading !text-section shadow-none"
      />
    </div>
  );
}

/** `pick=line`: one quiet switch under the name, its defaults in one line once it is on. */
function CameraLine({ defaults }: { defaults: string }) {
  return (
    <div className="border-t pt-4" data-dm-control>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <Camera className="size-4 text-muted-foreground" aria-hidden />
          Make it a disposable camera
        </span>
        <Switch
          checked
          tabIndex={-1}
          aria-label="Make it a disposable camera"
        />
      </div>
      <p className="mt-2 text-sm text-pretty text-muted-foreground" data-dm-say>
        {defaults}
      </p>
    </div>
  );
}

/** A small picture of what a guest gets: the album's rows, or the camera's frame. */
function Picture({
  kind,
  className,
}: {
  kind: "album" | "camera";
  className?: string;
}) {
  if (kind === "camera") {
    return (
      <FilmStill
        still={SCENE}
        look="warm"
        className={cn("rounded-md", className)}
        position="50% 45%"
      />
    );
  }
  return (
    <div
      className={cn(
        "grid grid-cols-3 grid-rows-2 gap-0.5 overflow-hidden rounded-md",
        className,
      )}
    >
      {ROLL_STILLS.slice(1, 7).map((s) => (
        // eslint-disable-next-line @next/next/no-img-element -- a local still in a small picture of the album
        <img key={s.id} src={s.src} alt="" className="size-full object-cover" />
      ))}
    </div>
  );
}

/** One of the two answers to "How will guests add photos?". */
function Choice({
  kind,
  title,
  line,
  on,
  big = false,
}: {
  kind: "album" | "camera";
  title: string;
  line: string;
  on?: boolean;
  big?: boolean;
}) {
  return (
    <span
      data-state={on ? "on" : "off"}
      className={cn(
        "flex gap-2.5 rounded-xl border p-2.5 text-left",
        big ? "flex-row items-center" : "flex-col",
        on ? "border-foreground ring-1 ring-foreground" : "border-border",
      )}
    >
      <Picture
        kind={kind}
        className={cn("aspect-[3/2]", big ? "w-32 shrink-0 sm:w-40" : "w-full")}
      />
      <span className="space-y-0.5 px-0.5 pb-0.5">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {kind === "camera" ? (
            <Camera className="size-3.5" aria-hidden />
          ) : (
            <Images className="size-3.5" aria-hidden />
          )}
          {title}
        </span>
        <span className="block text-xs text-pretty text-muted-foreground">
          {line}
        </span>
      </span>
    </span>
  );
}

function HowCards({ big = false }: { big?: boolean }) {
  return (
    <div className="space-y-2.5" data-dm-control>
      <p className="text-sm font-medium">How will guests add photos?</p>
      <div className={cn("grid gap-2", big ? "grid-cols-1" : "grid-cols-2")}>
        <Choice
          kind="album"
          title="An album"
          line="Photos and videos from their phones, as many as they like."
          big={big}
        />
        <Choice
          kind="camera"
          title="A disposable camera"
          line={`${ROLL.shots} shots each on the album's camera, developed the next morning.`}
          on
          big={big}
        />
      </div>
    </div>
  );
}

/**
 * CREATE, as each option shapes it: `line` and `cards` add to the name's own
 * screen, `step` adds a screen of its own (drawn), `settings` leaves Create as
 * it ships. `defaults` is the one line that says what turning it on set.
 */
export function CreatePage({
  screen,
  shape,
  defaults,
}: {
  screen: ScreenId;
  shape: CreateShape;
  defaults: string;
}) {
  const step = shape === "step";
  const labels = step
    ? ["Name", "Guests add", "Style", "Ready"]
    : ["Name", "Style", "Ready"];
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
              {step
                ? "Name it, say how guests add photos, pick a style for the code, and you're collecting."
                : "Name it, pick a style for the code, and you're collecting photos."}
            </CardDescription>
            <Steps labels={labels} active={step ? 2 : 1} />
          </CardHeader>
          <CardContent className="space-y-5">
            {step ? (
              <HowCards big />
            ) : (
              <>
                <NameField />
                {shape === "line" && <CameraLine defaults={defaults} />}
                {shape === "cards" && <HowCards />}
              </>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button type="button" variant="ghost" tabIndex={-1}>
              {step ? (
                <>
                  <ArrowLeft /> Back
                </>
              ) : (
                "Cancel"
              )}
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

/* ── the event's hub, quoted ────────────────────────────────────────────── */

const ROOMS = [
  { id: "review", label: "Review", value: "Off", Icon: ListChecks },
  {
    id: "reel",
    label: "Highlight reel",
    value: "Waiting for photos",
    Icon: Clapperboard,
  },
  { id: "guests", label: "Guests", value: "0 guests", Icon: Users },
  { id: "settings", label: "Settings", value: "Public", Icon: Settings },
] as const;

/** The cards row at rest (`event-cards-row.tsx` on `room-card.ts`'s one shell, imported). */
function Rooms() {
  return (
    <div role="group" aria-label="This event" className={roomRowLayout(false)}>
      {ROOMS.map(({ id, label, value, Icon }) => (
        <span
          key={id}
          className={cn(ROOM_CARD_BASE, roomCardSize(false), ROOM_CARD_QUIET)}
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="font-heading text-card-title font-medium">
            {label}
          </span>
          <span
            className={cn(
              "truncate text-xs text-muted-foreground tabular-nums",
              ROOM_CARD_VALUE,
            )}
          >
            {value}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * THE EVENT'S HUB (`/dashboard/[eventId]`): the code beside the title and its
 * metadata, the cards row, whatever a decision stands under it, then the
 * album. `empty` is the event minutes old, before a single photograph.
 */
function Hub({
  screen,
  strip,
  empty = false,
  overlay,
}: {
  screen: ScreenId;
  strip?: ReactNode;
  empty?: boolean;
  overlay?: ReactNode;
}) {
  const photos = empty ? 0 : 214;
  return (
    <HostPage screen={screen} trail={EVENT.name} overlay={overlay}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="shrink-0 rounded-lg bg-white p-2">
            <FooterQr value="https://partyreel.com/e/maya-and-jay" size={112} />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <PageHeading className="truncate">{EVENT.name}</PageHeading>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{EVENT.date}</span>
              <span className="flex items-center gap-1.5">
                <Images className="size-3.5" aria-hidden />
                {photos}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                {empty ? 0 : 14}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" aria-hidden />
                {empty ? 0 : 61}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <Link2
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                partyreel.com/e/maya-and-jay
              </span>
            </div>
          </div>
        </div>
        <Rooms />
        {strip}
        <div className="space-y-2.5">
          <FeedSectionHeader label="Album" count={photos || undefined} />
          {empty ? (
            <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Photos your guests add will appear here.
            </p>
          ) : (
            <div className={GALLERY_COLUMNS}>
              {ROLL_STILLS.map((s, i) => (
                <div
                  key={s.id}
                  style={
                    {
                      aspectRatio: `${s.width} / ${s.height}`,
                      borderRadius: "var(--radius-tile)",
                    } as CSSProperties
                  }
                  className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
                >
                  <MediaTile item={asMedia(s, i)} playBadge="none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </HostPage>
  );
}

/**
 * `pick=settings`: Create as it ships, and the new event offering the camera
 * once, under its cards, where the host lands straight after Create's beat.
 */
export function HubOffer({ screen }: { screen: ScreenId }) {
  return (
    <Hub
      screen={screen}
      empty
      strip={
        <div
          data-dm-offer
          className="flex items-start gap-3 rounded-xl border border-border p-3"
        >
          <Picture kind="camera" className="aspect-[3/4] w-16 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium" data-dm-say>
              Make it a disposable camera?
            </p>
            <p className="text-xs text-pretty text-muted-foreground">
              {`Guests shoot ${ROLL.shots} each on the album's own camera, and the roll develops at ${ROLL.develops} the next morning.`}
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" tabIndex={-1}>
                Turn it on
              </Button>
              <Button type="button" size="sm" variant="ghost" tabIndex={-1}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      }
    />
  );
}

/* ── Settings ───────────────────────────────────────────────────────────── */

/**
 * OPENS THE SETTINGS SCROLLED TO GUEST UPLOADS, the card a decision is about,
 * inside whichever element scrolls (the page in a hand, the panel at a desk).
 */
function ScrollToMe({ offset = 12 }: { offset?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const go = () => {
      const scroller = el.closest<HTMLElement>("[data-dm-scroller]");
      if (scroller) {
        const top =
          el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        scroller.scrollTop += top - offset;
      } else {
        win.scrollTo(0, win.scrollY + el.getBoundingClientRect().top - offset);
      }
    };
    go();
    const timers = [150, 600, 1500].map((ms) => win.setTimeout(go, ms));
    win.document.fonts?.ready.then(go).catch(() => {});
    return () => timers.forEach((t) => win.clearTimeout(t));
  }, [offset]);
  return <span ref={ref} aria-hidden className="block h-0" />;
}

/** A settings row: its label and line, and its control at the end. */
function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: ReactNode;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4" data-dm-row>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm leading-none font-medium">{label}</p>
        {description && (
          <p className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/** A select, quoted at rest (`uploads-section.tsx`'s own box). */
function Picked({ value }: { value: string }) {
  return (
    <span className="flex h-8 min-w-16 items-center justify-between gap-2 rounded-lg border border-input px-2.5 text-sm tabular-nums">
      {value}
      <span aria-hidden className="text-muted-foreground">
        ▾
      </span>
    </span>
  );
}

/** The lock chip, quoted (`lock-chip.tsx`: the control's own name and the plan that opens it). */
export function LockQuote({ name, plan }: { name: string; plan: string }) {
  return (
    <span
      data-dm-lock
      className="inline-flex h-7 items-center gap-1.5 rounded-action-sm border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground"
    >
      <Lock className="size-3" aria-hidden />
      {name}
      <span className="text-faint">{plan}</span>
    </span>
  );
}

/** How the reveal answer reads as the Develops row. */
export type RevealId = "morning" | "host" | "hour" | "live";

const DEVELOPS: Record<RevealId, string | null> = {
  morning: `Tomorrow, ${ROLL.develops}`,
  host: "When you say",
  hour: "An hour after each shot",
  live: null,
};

/**
 * THE CAMERA'S ROWS, at the head of Guest uploads. `control` mirrors how
 * Create turned it on (a switch, or the two-way choice); the rows under it
 * are its defaults, each changeable: shots each, when it develops (the
 * `reveal` answer), the look (the `look` answer). `estimate` is the one line
 * the price decision adds; `locked` draws it behind the Event Pass.
 */
export function CameraBlock({
  control,
  reveal,
  look,
  shots = ROLL.shots,
  estimate,
  locked,
}: {
  control: "switch" | "choice";
  reveal: RevealId;
  look: "clean" | "film" | "stocks";
  shots?: number;
  estimate?: ReactNode;
  locked?: boolean;
}) {
  const develops = DEVELOPS[reveal];
  return (
    <div className="space-y-4" data-dm-camera-block>
      {control === "switch" ? (
        <SettingRow
          label="Disposable camera"
          description="Guests shoot on the album's own camera: no library, and a set number of shots each."
          control={
            locked ? (
              <LockQuote name="Disposable camera" plan={EVENT_PASS.name} />
            ) : (
              <Switch checked tabIndex={-1} aria-label="Disposable camera" />
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-none font-medium">
            How guests add photos
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <span
              data-state={locked ? "on" : "off"}
              className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground"
            >
              <Images className="size-3.5" aria-hidden />
              Anything
            </span>
            <span
              data-state={locked ? "off" : "on"}
              className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground"
            >
              {locked ? (
                <Lock className="size-3.5" aria-hidden />
              ) : (
                <Camera className="size-3.5" aria-hidden />
              )}
              A disposable
            </span>
          </div>
          <p className="text-sm text-pretty text-muted-foreground">
            Guests shoot on the album&rsquo;s own camera: no library, and a set
            number of shots each.
          </p>
          {locked && (
            <LockQuote name="Disposable camera" plan={EVENT_PASS.name} />
          )}
        </div>
      )}
      {!locked && (
        <div className="space-y-4 border-l-2 border-border pl-3">
          <SettingRow
            label="Shots each"
            control={<Picked value={String(shots)} />}
          />
          {estimate}
          {develops && (
            <SettingRow
              label="Develops"
              description={develops}
              control={
                reveal === "hour" ? undefined : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    tabIndex={-1}
                  >
                    Develop now
                  </Button>
                )
              }
            />
          )}
          {look === "film" && (
            <SettingRow
              label="Film look"
              description="A warm cast, grain and the date in the corner."
              control={<Switch checked tabIndex={-1} aria-label="Film look" />}
            />
          )}
          {look === "stocks" && <LookSwatches />}
        </div>
      )}
      {locked && estimate}
    </div>
  );
}

/** `look=stocks`: the three looks on one of the roll's own photographs, the host's pick marked. */
export function LookSwatches({ picked = "mono" }: { picked?: LookId }) {
  const looks: { id: LookId; name: string }[] = [
    { id: "warm", name: "Warm" },
    { id: "cool", name: "Cool" },
    { id: "mono", name: "Black and white" },
  ];
  return (
    <div className="space-y-2.5" data-dm-swatches data-dm-row>
      <p className="text-sm leading-none font-medium">Film look</p>
      <div className="grid grid-cols-3 gap-2">
        {looks.map((l) => (
          <span key={l.id} className="space-y-1.5">
            <FilmStill
              still={SCENE}
              look={l.id}
              className={cn(
                "aspect-square w-full rounded-md",
                l.id === picked &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
            />
            <span
              className={cn(
                "block text-center text-xs",
                l.id === picked
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {l.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Guest uploads, the shipped card, with the camera's rows at its head and today's rows under them. */
function GuestUploads({ camera }: { camera: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest uploads</CardTitle>
        <CardDescription>
          Control whether and how guests contribute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {camera}
        <div className="border-t" />
        <SettingRow
          label="Accepting uploads"
          description="Turn off to freeze the album. Guests can still view it."
          control={
            <Switch checked tabIndex={-1} aria-label="Accepting uploads" />
          }
        />
        <SettingRow
          label="Review uploads before they appear"
          description="Hold new photos until you approve or reject them, instead of showing them live."
          control={
            <Switch checked={false} tabIndex={-1} aria-label="Review uploads" />
          }
        />
        <SettingRow
          label="Require verified emails"
          description="On (recommended): guests confirm their email once before they see the full album or add photos."
          control={
            <Switch
              checked
              tabIndex={-1}
              aria-label="Require verified emails"
            />
          }
        />
      </CardContent>
    </Card>
  );
}

/** The two cards above Guest uploads, at rest: what the sheet opens on. */
function AboveUploads() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            The name, the date and a note for guests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            readOnly
            tabIndex={-1}
            defaultValue={NAME}
            aria-label="Event name"
          />
          <Input
            readOnly
            tabIndex={-1}
            defaultValue="14 June 2026"
            aria-label="Date"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Visibility &amp; access</CardTitle>
          <CardDescription>Control who can see the album.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-sm font-medium text-muted-foreground">
            <span className="rounded-md bg-background px-2 py-1.5 text-center text-foreground">
              Public
            </span>
            <span className="px-2 py-1.5 text-center">Password</span>
            <span className="px-2 py-1.5 text-center">Private</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * SETTINGS, AS THE SETTINGS KIND: in a hand the whole screen under a back arrow
 * that names the event; at a desk the panel from the right edge over the
 * album it governs. Opened scrolled to Guest uploads.
 */
export function SettingsSurface({
  screen,
  camera,
}: {
  screen: ScreenId;
  camera: ReactNode;
}) {
  const body = (
    <div className="flex flex-col gap-6 pb-6">
      <AboveUploads />
      <ScrollToMe />
      <GuestUploads camera={camera} />
    </div>
  );
  if (!deskOf(screen)) {
    return (
      <div
        className="min-h-full bg-background text-foreground"
        data-dm-settings
      >
        <div className="sticky top-0 z-10 shrink-0 border-b bg-background">
          <div className="grid h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              className="max-w-full gap-0.5 justify-self-start px-1.5 text-muted-foreground"
            >
              <ChevronLeft className="size-5" />
              <span className="truncate">{EVENT.name}</span>
            </Button>
            <p className="text-center font-heading text-base font-medium">
              Settings
            </p>
            <span aria-hidden />
          </div>
        </div>
        <div className="px-4 pt-4">{body}</div>
      </div>
    );
  }
  return (
    <Hub
      screen={screen}
      overlay={
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
          />
          <div
            data-dm-settings
            className="fixed top-0 right-0 bottom-0 z-50 flex w-3/4 max-w-md flex-col overflow-hidden border-l bg-popover text-sm text-popover-foreground shadow-layer"
          >
            <div className="flex shrink-0 flex-col gap-1 p-4 pr-12">
              <p className="font-heading text-card-title font-medium">
                Settings
              </p>
              <p className="text-sm text-muted-foreground">{EVENT.name}</p>
            </div>
            <span
              aria-hidden
              className="absolute top-3.5 right-3.5 flex size-7 items-center justify-center rounded-md text-muted-foreground"
            >
              <X className="size-4" />
            </span>
            <div
              data-dm-scroller
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
            >
              {body}
            </div>
          </div>
        </>
      }
    />
  );
}

/* ── the plan, where a Free host meets a paid camera ────────────────────── */

/**
 * THE PLAN SHEET, QUOTED AS A HAND OPENS IT (`pricing-sheet.tsx`, the plan
 * kind's `cover`): its lead for the locked control, Free held beside the next
 * plan, and the pass on its one line, which is where a single wedding's host
 * buys.
 */
export function PlanCover() {
  return (
    <div className="min-h-full bg-background text-foreground" data-dm-plan>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="font-heading text-card-title font-medium" data-dm-say>
            A disposable camera is on every paid plan
          </p>
          <p className="text-sm text-muted-foreground">
            On Free, guests add photos from their phones.
          </p>
        </div>
        <X className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-3 px-4 pb-6">
        <div className="rounded-xl border p-4">
          <p className="text-sm font-medium">Free</p>
          <p className="text-xs text-muted-foreground">
            {`One event, photos only, ${FREE_BYTES / MB} MB. Your plan.`}
          </p>
        </div>
        <div className="space-y-3 rounded-xl bg-foreground p-4 text-background">
          <p className="text-sm font-medium">{`${PRO_100.name} · ${PRO_100.price}`}</p>
          <ul className="space-y-1.5 text-xs text-background/80">
            <li>A disposable camera, and video</li>
            <li>As many events as you like</li>
            <li>No mark on the reel</li>
          </ul>
          <span className="flex h-7 w-full items-center justify-center rounded-md bg-background/15 text-xs font-medium">
            {`Get ${PRO_100.name}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3">
          <p className="min-w-0 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {EVENT_PASS.name}
            </span>{" "}
            {`one event, paid once: ${EVENT_PASS.price} for ${EVENT_PASS.gb} GB, a disposable camera included.`}
          </p>
          <span className="flex h-7 shrink-0 items-center rounded-md border px-2.5 text-xs font-medium">
            Buy a pass
          </span>
        </div>
      </div>
    </div>
  );
}
