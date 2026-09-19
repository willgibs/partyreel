"use client";

import { type ReactNode, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarPlus,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";

import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import { PageHeading } from "@/components/shared/page-heading";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { Code, modulePx, type Size } from "./frame";
import { EVENT, EXISTING, JOIN_URL, PLACEHOLDER_URL } from "./fixtures";

/**
 * MAKING IT: what creating asks for, where the code's style is chosen, and what
 * a Free host at their one event meets.
 *
 * ★ REDRAWN, NOT IMPORTED, AND THAT IS A SAFETY RULE RATHER THAN A STYLE ONE.
 * `CreateEventWizard` calls `createEventInWizard` on its Create press: a
 * reviewer pressing a button inside a preview would insert a real row on the
 * real database, which this round is forbidden to do. So today's card is
 * rebuilt here from the same `Card`, `Input`, `Textarea` and `Button` with its
 * shipped copy word for word (down to "Just for your reference: events never
 * expire."), and the one shipped component that persists nothing —
 * `QrPresetPicker` — is imported whole.
 *
 * ★ AND TODAY'S STYLE STEP PREVIEWS A DEAD LINK. The shipped wizard draws its
 * four swatches against `previewJoinUrl`, which is `/e/` plus 32 zeroes: the
 * right module density, deliberately (share-urls.ts), and a URL no event has.
 * A host who test-scans the code they are choosing gets a 404. The `step`
 * option draws exactly that, with the link under it, because that is the cost
 * of choosing a style before the thing exists.
 */

/* ── The axes ────────────────────────────────────────────────────────────── */

/** What creating asks for. */
export type Asks = "form" | "one" | "none";
export const asksOf = (v: string | undefined): Asks =>
  v === "form" || v === "none" ? v : "one";

/** Where the code's style is chosen. */
export type Style = "step" | "after" | "later";
export const styleOf = (v: string | undefined): Style =>
  v === "step" || v === "later" ? v : "after";

/** What a Free host at their one event meets. */
export type Limit = "after" | "door" | "inplace";
export const limitOf = (v: string | undefined): Limit =>
  v === "after" || v === "door" ? v : "inplace";

/* ── The wizard's own furniture ──────────────────────────────────────────── */

const STEP_LABELS = ["Details", "Design", "Share"] as const;

/** The shipped three-step rail, at the step being drawn. */
function StepRail({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
                active
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
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {n < STEP_LABELS.length && (
              <ArrowRight className="size-3 text-muted-foreground" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The 576 px card the create route floats in the shell, at both windows. */
function CreateCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("mx-auto w-full max-w-xl", className)}>{children}</Card>
  );
}

/* ── What creating asks for ──────────────────────────────────────────────── */

/**
 * TODAY: three fields, one of them required, and two step numbers still to go
 * before the event exists. The description and the date are both optional and
 * both are shown, so a host reads three labels to give one answer.
 */
function AsksForm() {
  return (
    <CreateCard>
      <CardHeader>
        <CardTitle>Create an event</CardTitle>
        <CardDescription>
          Name it, pick a QR style, and you&rsquo;re ready to collect photos.
        </CardDescription>
        <StepRail step={1} />
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Event name">
          <Input defaultValue={EVENT.name} />
        </Field>
        <Field label="Description" optional>
          <Textarea
            rows={3}
            placeholder="A note your guests will see when they join."
          />
        </Field>
        <Field
          label="Event date"
          optional
          hint="Just for your reference: events never expire."
        >
          <Input type="date" readOnly defaultValue="2026-10-11" />
        </Field>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="button">
          Continue <ArrowRight />
        </Button>
      </CardFooter>
    </CreateCard>
  );
}

/**
 * ONE FIELD. The name is the only thing a host arrives with; the date and the
 * note are things about an event that already exists, so they are asked where
 * they are read, on the event's own page under its header.
 */
function AsksOne() {
  return (
    <CreateCard>
      <CardHeader>
        <CardTitle>What are you collecting photos for?</CardTitle>
        <CardDescription>
          Give it a name. Everything else you can set once it exists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field label="Event name">
          <Input defaultValue={EVENT.name} className="h-11 text-base" />
        </Field>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="button">
          Create event <ArrowRight />
        </Button>
      </CardFooter>
    </CreateCard>
  );
}

/**
 * NO FIELD AT ALL. The press on the empty dashboard IS the creation: the event
 * exists a beat later, named from the day it will happen, with the name under a
 * cursor. Nothing is asked and nothing is lost, because the one thing a form
 * would have collected is editable in place on the page it already governs.
 */
function AsksNone({ size }: { size: Size }) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <p className="text-sm text-muted-foreground">
        The press on the dashboard was the whole of it. This is the next frame.
      </p>
      <div className="space-y-3">
        <div className="flex max-w-xl items-center gap-2 rounded-lg border-2 border-brand bg-background px-3 py-2">
          {/* The proposed name, live and selected, as the heading it will be. */}
          <span className="font-heading text-page truncate">
            {EVENT.dateLabel}
          </span>
          <Pencil className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Named from the day. Type over it, or leave it.
        </p>
      </div>
      <div
        className={cn(
          "flex items-center gap-6 rounded-xl border border-border bg-muted/30 p-5",
          size === "phone" && "flex-col items-start gap-4",
        )}
      >
        <Code size={132} value={JOIN_URL} pad="p-3" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Your code is already live.</p>
          <p className="text-sm text-muted-foreground">
            Nothing was asked, so nothing is waiting on you. Print it, or show
            it.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreateScreen({ asks, size }: { asks: Asks; size: Size }) {
  if (asks === "none") return <AsksNone size={size} />;
  return asks === "form" ? <AsksForm /> : <AsksOne />;
}

/* ── Where the code's style is chosen ────────────────────────────────────── */

/**
 * TODAY: a whole step of the wizard, between the name and the event existing,
 * spent on four swatches of a code for an event that is not there yet.
 */
function StyleStep({ style }: { style: QrStyleKey }) {
  return (
    <CreateCard>
      <CardHeader>
        <CardTitle>Create an event</CardTitle>
        <CardDescription>
          Name it, pick a QR style, and you&rsquo;re ready to collect photos.
        </CardDescription>
        <StepRail step={2} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Guest join QR</p>
          <p className="text-sm text-muted-foreground">
            Pick a style for the QR your guests scan. You can change it anytime.
          </p>
        </div>
        {/* The wrapper is the measurement's handle on the picker's own codes
            (frame.tsx, `data-fe-swatch`): the swatches are 96 px whatever the
            window, and the module edge depends on the preset's error level. */}
        <div
          data-fe-swatch
          data-fe-module={modulePx(96, PLACEHOLDER_URL, style).toFixed(2)}
        >
          <QrPresetPicker
            value={style}
            onChange={() => {}}
            joinUrl={PLACEHOLDER_URL}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          These four encode {PLACEHOLDER_URL.replace("https://", "")}. Right
          density, no event: scan one now and you get a 404.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost">
          <ArrowLeft /> Back
        </Button>
        <Button type="button">Create event</Button>
      </CardFooter>
    </CreateCard>
  );
}

/**
 * AFTER IT EXISTS. Creating is one press, and the style is chosen on the code
 * the guests will actually scan, changing under the host's hand. Reversible
 * forever, because it lives where the code lives.
 */
function StyleAfter({ style, size }: { style: QrStyleKey; size: Size }) {
  const [picked, setPicked] = useState<QrStyleKey>(style);
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <EventHead />
      <div
        className={cn(
          "flex gap-8 rounded-xl border border-border p-6",
          size === "phone" ? "flex-col items-center" : "items-start",
        )}
      >
        <Code size={200} style={picked} value={JOIN_URL} />
        <div className="w-full max-w-xs space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Style</p>
            <p className="text-sm text-muted-foreground">
              This is your code, not a sample. Change it whenever you like.
            </p>
          </div>
          <div
            data-fe-swatch
            data-fe-module={modulePx(96, JOIN_URL, picked).toFixed(2)}
          >
            <QrPresetPicker
              value={picked}
              onChange={setPicked}
              joinUrl={JOIN_URL}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * OUT OF THE FLOW. Classic until somebody wants otherwise: the code stands on
 * its own and a quiet line beside it offers the other three, which is what a
 * preference that most hosts never touch is worth in screen time.
 */
function StyleLater({ size }: { size: Size }) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <EventHead />
      <div
        className={cn(
          "flex gap-8 rounded-xl border border-border p-6",
          size === "phone" ? "flex-col items-center" : "items-start",
        )}
      >
        <Code size={200} value={JOIN_URL} />
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Your guest code</p>
            <p className="text-sm text-muted-foreground">
              Print it, show it, or send the link. It never changes.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Change the style
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StyleScreen({
  style,
  pick,
  size,
}: {
  style: Style;
  /** Which of the four presets is showing, so the step is judged on one. */
  pick: QrStyleKey;
  size: Size;
}) {
  if (style === "step") return <StyleStep style={pick} />;
  if (style === "later") return <StyleLater size={size} />;
  return <StyleAfter style={pick} size={size} />;
}

/* ── The Free host at their one event ────────────────────────────────────── */

/**
 * TODAY: she filled the form in, chose Rounded, pressed Create, and the app
 * bounced her to the dashboard with a toast. The row WAS inserted and then
 * refused, the style went with the screen, and the only door out of the toast
 * leaves the app for /pricing.
 */
function LimitAfter() {
  return (
    <div className="space-y-6">
      <PageHeading>Dashboard</PageHeading>
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <ExistingCard />
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          The wedding is not here.
        </div>
      </div>
      {/* Sonner's shape, redrawn: the real toaster is a portal to the document
          body and would land outside the frame's measured page. FIXED, not
          absolute: reading the first captures caught it sitting halfway up a
          1440 page and landing on top of the empty card at 375, which is not
          where a toast is. The frame IS a viewport, so `fixed` anchors it
          exactly where sonner would put it. */}
      <div className="fixed right-4 bottom-4 z-50 w-[22rem] max-w-[calc(100%-2rem)] rounded-lg border border-border bg-background p-4 shadow-lift">
        <p className="text-sm font-medium">
          Event limit reached on the Free plan.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Delete an event or upgrade to add more.
        </p>
        <Button size="sm" variant="outline" className="mt-3">
          Upgrade
        </Button>
      </div>
    </div>
  );
}

/** REFUSED AT THE DOOR: the route never opens the form at all. */
function LimitDoor() {
  return (
    <CreateCard>
      <CardHeader>
        <CardTitle>Free holds one event</CardTitle>
        <CardDescription>
          You have {EXISTING.name}, with {EXISTING.items} photos in it. Pro
          holds as many events as you want.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ExistingCard compact />
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost">Back to {EXISTING.name}</Button>
        <Button>See Pro</Button>
      </CardFooter>
    </CreateCard>
  );
}

/**
 * IN PLACE: the form opens, because she came to make an event, and the thing
 * the app already knows is said at the top with both exits beside it. Nothing
 * is typed twice and nothing is inserted and un-inserted.
 */
function LimitInPlace({ asks }: { asks: Asks }) {
  return (
    <CreateCard>
      <CardHeader>
        <CardTitle>
          {asks === "form" ? "Create an event" : "What are you collecting photos for?"}
        </CardTitle>
        <CardDescription>
          {asks === "form"
            ? "Name it, pick a QR style, and you're ready to collect photos."
            : "Give it a name. Everything else you can set once it exists."}
        </CardDescription>
        {asks === "form" && <StepRail step={1} />}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="text-sm">
            Free holds one event and you have {EXISTING.name}. Pick one before
            this goes live.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Go Pro, keep both</Button>
            <Button size="sm" variant="outline">
              <Trash2 /> Delete {EXISTING.name} ({EXISTING.items} photos)
            </Button>
          </div>
        </div>
        <Field label="Event name">
          <Input defaultValue={EVENT.name} />
        </Field>
        {asks === "form" && (
          <Field label="Event date" optional>
            <Input type="date" readOnly defaultValue="2026-10-11" />
          </Field>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="button">
          {asks === "form" ? "Continue" : "Create event"} <ArrowRight />
        </Button>
      </CardFooter>
    </CreateCard>
  );
}

/**
 * ★ AND WHEN CREATING ASKS NOTHING, THERE IS NO FORM TO PUT A BAND ON. Reading
 * the first captures caught this one: staged behind the create question, the
 * in-place refusal was still drawing a one-field card in a world where the
 * first question had removed every field. With no form, the press IS the
 * creation, so the refusal belongs on the press, where she is, which is still
 * the option's whole argument and still not a page of its own.
 */
function LimitInPlaceNone() {
  return (
    <div className="space-y-6">
      <PageHeading>Dashboard</PageHeading>
      <div className="max-w-xl space-y-4">
        <ExistingCard compact />
        <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="text-sm">
            Free holds one event and you have {EXISTING.name}. Pick one and the
            next press makes the wedding.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Go Pro, keep both</Button>
            <Button size="sm" variant="outline">
              <Trash2 /> Delete {EXISTING.name} ({EXISTING.items} photos)
            </Button>
          </div>
        </div>
        <CreateDoor />
      </div>
    </div>
  );
}

export function LimitScreen({ limit, asks }: { limit: Limit; asks: Asks }) {
  if (limit === "after") return <LimitAfter />;
  if (limit === "door") return <LimitDoor />;
  if (asks === "none") return <LimitInPlaceNone />;
  return <LimitInPlace asks={asks} />;
}

/* ── Shared small parts ──────────────────────────────────────────────────── */

function Field({
  label,
  optional = false,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        {optional && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** The event's identity line, so a style drawn on the event reads as one. */
export function EventHead() {
  return (
    <div className="space-y-2">
      <PageHeading>{EVENT.name}</PageHeading>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="size-3.5" /> {EVENT.dateLabel}
      </p>
    </div>
  );
}

/** Theo's 30th, the one event Free already holds. */
function ExistingCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border",
        compact && "flex items-center gap-3",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still, not a product surface */}
      <img
        src={EXISTING.cover}
        alt=""
        className={cn(
          "object-cover",
          compact ? "size-16 shrink-0" : "aspect-[16/10] w-full",
        )}
      />
      <div className="space-y-0.5 p-3">
        <p className="text-sm font-medium">{EXISTING.name}</p>
        <p className="text-sm text-muted-foreground">
          {EXISTING.dateLabel} · {EXISTING.items} photos
        </p>
      </div>
    </div>
  );
}

/**
 * One of the three labels the product uses for this one act ("Create my first
 * event" at the welcome's end, "Create your first event" on the empty
 * dashboard, "New event" in the app): the SECOND-event surface takes the third,
 * because a host with an event already does not have a first one to create.
 */
export function CreateDoor({ label = "New event" }: { label?: string }) {
  return (
    <Button size="lg">
      <CalendarPlus /> {label}
    </Button>
  );
}
