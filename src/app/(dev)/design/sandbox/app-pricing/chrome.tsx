"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  CreditCard,
  LifeBuoy,
  Lock,
  LogOut,
  Monitor,
  Settings,
} from "lucide-react";

import { Frame, useLabPrefs } from "@/components/lab";
import { EventPasswordControl } from "@/components/app/event-password-control";
import { EventSlugControl } from "@/components/app/event-slug-control";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  formatLimit,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { FIXTURES, type Fixture, type Trigger, pctOf } from "./fixtures";
import { LockChip } from "./surface";

/**
 * THE APP AROUND THE SURFACE: the real chrome, the real doors, the real copy.
 *
 * ★ TODAY IS THE SHIPPED CODE, NOT A DRAWING OF IT. `AppShell` is imported and
 * wrapped, the gated paragraphs come from `EventPasswordControl` and
 * `EventSlugControl` in their locked branches (which render copy and nothing
 * pressable), and the storage strip is the shipped `StorageMeter` with its
 * popover held open. So every "as today" option on this board IS today.
 *
 * ★ THE METER IS DRAWN WITH NO STRIPE BUTTON. `StorageMeter` renders the
 * shipped `CheckoutButton` and `ManageBillingButton` when the host has billing
 * on record, and both POST on click. Every fixture is passed `hasBilling` and
 * `isEventPass` false so the popover's foot is empty here, and the two buttons
 * are drawn beside it as inert furniture where the question is about them. The
 * board never opens a payment session, by construction.
 *
 * ★ THE NUMBER UNDER EVERY FRAME IS MEASURED IN THE FRAME. A pricing surface
 * has exactly one cost a picture can hide: how much of the window it takes and
 * how far it scrolls. `Measure` reads `[data-surface]` inside the frame's own
 * document and reports its height against the viewport's. If the words above a
 * frame and the caption under it disagree, the caption is the truth.
 */

export const SIZES = {
  laptop: { w: 1440, h: 900, name: "1440 x 900, a laptop" },
  phone: { w: 375, h: 812, name: "375 x 812, a phone" },
} as const;
export type Size = keyof typeof SIZES;

export const sizeOf = (v: string | undefined): Size =>
  v === "phone" ? "phone" : "laptop";

/* ── The measurement ─────────────────────────────────────────────────────── */

type Measured = { w: number; h: number; window: number; scrolls: boolean };

function Measure({
  onMeasure,
  children,
}: {
  onMeasure: (m: Measured) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const read = () => {
      const s = el.querySelector<HTMLElement>("[data-surface]");
      const box = s?.getBoundingClientRect();
      report.current({
        w: Math.round(box?.width ?? 0),
        h: Math.round(box?.height ?? 0),
        window: win.innerHeight,
        // The surface is taller than the box it was given: the host scrolls.
        scrolls: s ? s.scrollHeight - s.clientHeight > 4 : false,
      });
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}

/** The lab's Fit, kept by a frame (app-shape's, which retires with its wiring). */
function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      data-stage-fit={zoomed ? "zoom" : "true"}
      ref={box}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** One option's picture: a real window, the app inside it, the numbers under. */
export function Screen({
  id,
  size,
  title,
  caption,
  children,
}: {
  id: string;
  size: Size;
  title: string;
  caption: string;
  children: ReactNode;
}) {
  const { w, h, name } = SIZES[size];
  const [m, setM] = useState<Measured | null>(null);
  const measured = !m
    ? "measuring"
    : m.h === 0
      ? "no surface open"
      : `the surface is ${m.w} by ${m.h} px, ${Math.round((m.h / m.window) * 100)} percent of the window${m.scrolls ? ", and it scrolls" : ""}`;
  return (
    <Fit w={w}>
      <Frame
        id={`app-pricing-${id}`}
        w={w}
        h={h}
        title={`${title} · ${name}`}
        caption={`${caption} Measured in the frame: ${measured}.`}
      >
        <Measure
          onMeasure={(next) =>
            setM((prev) =>
              prev &&
              prev.w === next.w &&
              prev.h === next.h &&
              prev.window === next.window &&
              prev.scrolls === next.scrolls
                ? prev
                : next,
            )
          }
        >
          {children}
        </Measure>
      </Frame>
    </Fit>
  );
}

/* ── The app's chrome, with the doors the sixth decision is about ─────────── */

export type Doors = "same" | "menu" | "page";
export const doorsOf = (v: string | undefined): Doors =>
  v === "same" || v === "page" ? v : "menu";

/** The shipped user menu, held open, with the row an option adds. */
function OpenMenu({ f, plan }: { f: Fixture; plan: boolean }) {
  return (
    <div className="relative">
      <Avatar className="size-8">
        <AvatarFallback>{f.initial}</AvatarFallback>
      </Avatar>
      <div className="absolute top-10 right-0 z-30 w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-layer">
        <div className="px-2 py-1.5 text-sm font-medium">
          <span className="block truncate">{f.email}</span>
        </div>
        <p className="px-2 py-1 text-xs text-muted-foreground">Your account</p>
        {plan && (
          <div
            data-new-row
            className="flex items-center justify-between gap-2 rounded-md bg-muted/60 px-2 py-1.5 text-sm"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="size-4" /> Plan and storage
            </span>
            <span className="text-xs text-muted-foreground">{f.planName}</span>
          </div>
        )}
        <p className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <Settings className="size-4" /> Account
        </p>
        <p className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <Monitor className="size-4" /> Theme
        </p>
        <p className="px-2 py-1 text-xs text-muted-foreground">Partyreel</p>
        <p className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <ArrowLeft className="size-4" /> Back to site
        </p>
        <p className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <LifeBuoy className="size-4" /> Help center
        </p>
        <div className="mt-1 border-t border-border bg-muted/40 p-1">
          <p className="flex items-center gap-2 px-2 py-1.5 text-sm">
            <LogOut className="size-4" /> Sign out
          </p>
        </div>
      </div>
    </div>
  );
}

/** The shipped `AppShell`, with the page inside it and the overlay over it. */
export function HostApp({
  f,
  menu = false,
  openMenu = false,
  overlay,
  children,
}: {
  f: Fixture;
  /** The menu carries a plan row (the sixth decision's second option). */
  menu?: boolean;
  /** Drawn open, because the question is about what is in it. */
  openMenu?: boolean;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      <AppShell
        headerActions={
          openMenu ? (
            <OpenMenu f={f} plan={menu} />
          ) : (
            <Avatar className="size-8">
              <AvatarFallback>{f.initial}</AvatarFallback>
            </Avatar>
          )
        }
      >
        <div className="w-full min-w-0">{children}</div>
      </AppShell>
      {overlay}
    </div>
  );
}

/* ── The dashboard, where three of the four doors are ─────────────────────── */

/** The at-cap and over-cap banners, in the dashboard's own words. */
function CapBanner() {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">
        You&rsquo;re over your storage limit
      </p>
      <p className="mt-1 text-muted-foreground">
        Upgrade or remove media by{" "}
        <strong className="text-foreground">14 June</strong>. After that
        we&rsquo;ll automatically reduce your storage (largest files first).{" "}
        <span className="font-medium text-foreground underline underline-offset-4">
          See plans
        </span>
        .
      </p>
    </div>
  );
}

export function Dashboard({
  f,
  trigger,
  /** The panel option unfolds the surface where the meter's popover was. */
  inline,
  /** The receipt a purchase lands with. */
  receipt,
}: {
  f: Fixture;
  trigger: Trigger;
  inline?: ReactNode;
  receipt?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      {receipt}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-page-title font-heading">Dashboard</h1>
          {/* The shipped line pluralises on the LIMIT, never the count, which
              is why a Pro host reads "of unlimited events". Drawing it off the
              count read "1 of unlimited event used" in the first captures. */}
          <p className="text-sm text-muted-foreground">
            {`${f.events} of ${formatLimit(MAX_EVENTS[f.tier], "unlimited")} event${MAX_EVENTS[f.tier] === 1 ? "" : "s"} used`}
          </p>
        </div>
        <Button disabled={f.tier !== "pro"}>
          <CalendarPlus /> New event
        </Button>
      </div>
      {trigger === "cap" && <CapBanner />}
      <StorageMeter
        storageUsed={f.used}
        storageCap={f.cap}
        storagePct={pctOf(f)}
        standbyBytes={0}
        overBudget={trigger === "cap"}
        passExpiry={null}
        planName={f.planName}
        // Never true here: the two buttons behind this flag POST to Stripe.
        hasBilling={false}
        isEventPass={false}
      />
      {inline}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">{f.eventName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {`Saturday, 14 June · ${formatBytes(f.used)} stored`}
        </p>
      </div>
    </div>
  );
}

/* ── Event settings, where the four gated sites are ───────────────────────── */

export type Words = "each" | "one" | "chip";
export const wordsOf = (v: string | undefined): Words =>
  v === "each" || v === "one" ? v : "chip";

const noop = () => {};

/** One shared sentence, the second wording option, named by its feature. */
function OneSentence({ feature }: { feature: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {`${feature} comes with every paid plan.`}{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        See plans
      </span>
      .
    </p>
  );
}

export function EventSettings({
  f,
  words,
  /** The panel option unfolds the surface inside the locked card. */
  inline,
  receipt,
  /** After Checkout returns: the control is open and waiting. */
  unlocked = false,
}: {
  f: Fixture;
  words: Words;
  inline?: ReactNode;
  receipt?: ReactNode;
  unlocked?: boolean;
}) {
  return (
    <div className="space-y-6">
      {receipt}
      <div>
        <h1 className="text-page-title font-heading">Settings</h1>
        <p className="text-sm text-muted-foreground">{f.eventName}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Who can see this album?</CardTitle>
          <CardDescription>
            Anyone with the link can view and upload.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {unlocked ? (
            <div className="space-y-2 rounded-lg border border-foreground/40 bg-muted/30 p-3 ring-2 ring-ring/50">
              <p className="text-xs font-medium text-muted-foreground">
                Set a password
              </p>
              <div className="flex gap-2">
                <span className="h-8 flex-1 rounded-action-sm border border-border bg-background" />
                <Button size="sm">Save</Button>
              </div>
            </div>
          ) : words === "each" ? (
            // The shipped component, in its locked branch: today's exact words.
            <EventPasswordControl
              eventId="lab"
              hasPassword={false}
              locked
              onPasswordSet={noop}
              onPasswordCleared={noop}
            />
          ) : words === "one" ? (
            <OneSentence feature="Password protection" />
          ) : (
            <LockChip label="Password" />
          )}
          {inline}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link</CardTitle>
          <CardDescription>Where guests land when they scan.</CardDescription>
        </CardHeader>
        <CardContent>
          {words === "each" ? (
            <EventSlugControl
              eventId="lab"
              siteUrl="https://partyreel.com"
              slug={null}
              locked
              eventName={f.eventName}
            />
          ) : words === "one" ? (
            <OneSentence feature="A custom link" />
          ) : (
            <LockChip label="Custom link" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploads</CardTitle>
          <CardDescription>What guests may add.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Video uploads</p>
              {words === "each" ? (
                <p className="text-sm text-muted-foreground">
                  This event accepts photos only.{" "}
                  <span className="font-medium text-foreground underline underline-offset-4">
                    Upgrade to allow video
                  </span>
                  .
                </p>
              ) : words === "one" ? (
                <OneSentence feature="Video uploads" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  This event accepts photos only.
                </p>
              )}
            </div>
            {words === "chip" ? (
              <LockChip label="Video" />
            ) : (
              <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                Photos only
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── The account page, the third place money could live ───────────────────── */

export function AccountPage({ f, card }: { f: Fixture; card: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-heading">Account</h1>
        <p className="text-sm text-muted-foreground">{f.email}</p>
      </div>
      {card && (
        <Card data-new-row>
          <CardHeader>
            <CardTitle>Plan and storage</CardTitle>
            <CardDescription>
              {`You are on ${f.planName}. ${formatBytes(f.used)} of ${formatBytes(f.cap)} used.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <span className="block h-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-foreground/70"
                style={{ width: `${pctOf(f)}%` }}
              />
            </span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Change plan</Button>
              <Button size="sm" variant="outline">
                Manage billing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Email and sign-in</CardTitle>
          <CardDescription>{f.email}</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your public profile</CardTitle>
          {/* Derived, not typed: the who knob swaps the host under this page,
              and a pinned slug read as Rosa's page under Maya's email. */}
          <CardDescription>{`partyreel.com/u/${f.email.split("@")[0]}`}</CardDescription>
        </CardHeader>
      </Card>
      {!card && (
        <p className="text-sm text-muted-foreground">
          Nothing on this page mentions what you pay.
        </p>
      )}
    </div>
  );
}

/* ── The receipt, for the question about coming back from Checkout ────────── */

export function Receipt({ plan }: { plan: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lift">
      <Check className="mt-0.5 size-4 shrink-0 text-success" />
      <div>
        <p className="text-sm font-medium">You&rsquo;re on {plan}</p>
        <p className="text-xs text-muted-foreground">
          {`Video, locks and ${MAX_REEL_SECONDS.pro}-second reels are on for every event you host.`}
        </p>
      </div>
    </div>
  );
}

/** The one thing the host was refused at, waiting for them. */
export function LockedRowNote() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="size-3" aria-hidden /> The password field is two clicks
      away, on the event they came from.
    </p>
  );
}

export const fixtureOf = (trigger: Trigger): Fixture => FIXTURES[trigger];
