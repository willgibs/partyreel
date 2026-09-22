"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, UserRoundSearch } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { ATTENDED, type AttendedEvent, EVENT, PRIYA } from "./fixtures";

/**
 * THE PIECES, ONE PER OPTION. Every one is quoted (guest-capture's own word for
 * it): the real markup and classes a shipped or precedent surface uses, redrawn
 * with LOCAL state instead of a server action, a session or a Radix portal, so
 * a reviewer judges the same pixels without this board reaching a database or
 * escaping its frame. `setup.cards` and `attended.switches` are the closest
 * thing this board has to a screenshot of production: the account page and
 * `attended-events-visibility.tsx` are this board's `reads`, "never edited",
 * and every class below is copied from them rather than invented.
 */

/* ── shared bits ──────────────────────────────────────────────────────────── */

function UnrelatedCard({ title, body }: { title: string; body: string }) {
  return (
    <Card data-ip-unrelated-card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function MenuRow({ label }: { label: string }) {
  return (
    <div className="rounded-md px-2 py-1.5 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

/* ── setup: the account page's cards, as shipped ─────────────────────────── */

export function SetupCards() {
  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <UnrelatedCard title="Plan" body="Free plan &middot; 0 B used" />
      <Card data-ip-relevant>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your photo, name, and the email tied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg" seed={PRIYA.seed}>
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm">
              Change photo
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ip-cards-name">Display name</Label>
            <Input id="ip-cards-name" defaultValue={PRIYA.name} />
          </div>
        </CardContent>
      </Card>
      <Card data-ip-relevant id="public-profile">
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>
            Your page on Partyreel: the events you host and choose to share,
            plus events you joined.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="ip-cards-handle">Profile handle</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                /u/
              </span>
              <Input
                id="ip-cards-handle"
                placeholder="your-name"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ip-cards-bio">Bio</Label>
            <Textarea
              id="ip-cards-bio"
              rows={2}
              placeholder="Weddings, mostly."
              className="resize-none"
            />
          </div>
          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Events you joined
            </p>
            <AttendedSwitches />
          </div>
        </CardContent>
      </Card>
      <UnrelatedCard
        title="Password"
        body="Add a password, or keep signing in with a code."
      />
    </div>
  );
}

/* ── setup: a wizard of three screens, the way the event wizard does ────────── */

const WIZARD_STEPS = ["Handle", "You", "Events"] as const;

export function SetupWizard() {
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState(() => ATTENDED.map((e) => ({ ...e })));

  function toggle(id: string, shown: boolean) {
    setEvents((all) => all.map((e) => (e.id === id ? { ...e, shown } : e)));
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1
              ? "Claim your page"
              : step === 2
                ? "You"
                : "Choose what shows"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "This is your address on Partyreel."
              : step === 2
                ? "How you'll show up on it."
                : "Nothing shows until you turn it on."}
          </CardDescription>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs">
            {WIZARD_STEPS.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <li key={label} data-ip-step className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-micro font-medium",
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
                    className={
                      active
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardHeader>

        {step === 1 && (
          <>
            <CardContent data-ip-relevant>
              <Label htmlFor="ip-wizard-handle">Profile handle</Label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                  /u/
                </span>
                <Input
                  id="ip-wizard-handle"
                  autoFocus
                  defaultValue={PRIYA.slug}
                  className="pl-9"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="button" onClick={() => setStep(2)}>
                Continue
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardContent data-ip-relevant className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar size="lg" seed={PRIYA.seed}>
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm">
                  Change photo
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ip-wizard-name">Display name</Label>
                <Input id="ip-wizard-name" defaultValue={PRIYA.name} />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Continue
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardContent data-ip-relevant>
              <AttendedSwitches events={events} onToggle={toggle} />
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button">Finish</Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

/* ── setup: a single sheet from the follow moment or the claims toast ───────── */

export function SetupSheet() {
  return (
    <div className="relative min-h-full bg-background text-foreground">
      {/* the moment it rides, dimmed behind the sheet it opened */}
      <div className="p-4 opacity-40">
        <Card>
          <CardHeader>
            <CardTitle>Claimed</CardTitle>
            <CardDescription>3 events joined your account.</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-black/10" />
        <div
          data-ip-relevant
          className="fixed inset-x-0 bottom-0 flex max-h-[85%] flex-col gap-4 overflow-y-auto border-t border-border bg-popover bg-clip-padding p-4 text-popover-foreground shadow-layer"
        >
          <div>
            <p className="font-heading text-card-title font-medium text-foreground">
              Set up your page
            </p>
            <p className="text-sm text-muted-foreground">
              Claim your address and choose what shows.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ip-sheet-handle">Profile handle</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                /u/
              </span>
              <Input
                id="ip-sheet-handle"
                defaultValue={PRIYA.slug}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ip-sheet-name">Display name</Label>
            <Input id="ip-sheet-name" defaultValue={PRIYA.name} />
          </div>
          <div className="space-y-2 border-t border-border/60 pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              Events you joined
            </p>
            <AttendedSwitches />
          </div>
          <Button type="button" className="mt-auto">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── attended: the switch list, as shipped (attended-events-visibility.tsx,
   read here, never edited: the markup and classes below are copied from it,
   driven by local state instead of the two server actions it calls) ────────── */

export function AttendedSwitches({
  events: controlled,
  onToggle,
}: {
  events?: readonly AttendedEvent[];
  onToggle?: (id: string, shown: boolean) => void;
}) {
  const [local, setLocal] = useState(() => ATTENDED.map((e) => ({ ...e })));
  const events = controlled ?? local;
  function toggle(id: string, shown: boolean) {
    if (onToggle) onToggle(id, shown);
    else setLocal((all) => all.map((e) => (e.id === id ? { ...e, shown } : e)));
  }
  return (
    <ul className="divide-y divide-border/60">
      {events.map((event) => {
        const switchId = `ip-attended-${event.id}`;
        return (
          <li
            key={event.id}
            data-ip-attended-row
            className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
          >
            <Label
              htmlFor={switchId}
              className="min-w-0 flex-1 cursor-pointer font-normal"
            >
              <span className="block truncate text-sm text-foreground">
                {event.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {event.date}
              </span>
            </Label>
            <Switch
              id={switchId}
              checked={event.shown}
              onCheckedChange={(checked) => toggle(event.id, checked)}
              aria-label={`Show ${event.name} on my profile`}
            />
          </li>
        );
      })}
    </ul>
  );
}

/* ── attended: a picker of event covers you tap to show, the chosen ones
   lifting ────────────────────────────────────────────────────────────────── */

export function AttendedPicker() {
  const [events, setEvents] = useState(() => ATTENDED.map((e) => ({ ...e })));
  function toggle(id: string) {
    setEvents((all) =>
      all.map((e) => (e.id === id ? { ...e, shown: !e.shown } : e)),
    );
  }
  return (
    <div data-ip-relevant className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          data-ip-attended-row
          aria-pressed={event.shown}
          onClick={() => toggle(event.id)}
          className={cn(
            "relative flex flex-col overflow-hidden rounded-[var(--radius-tile)] text-left transition-transform duration-200 ease-emphasis focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
            event.shown ? "-translate-y-1 shadow-lift" : "shadow-layer",
          )}
        >
          <span
            className={cn(
              "relative aspect-[4/5] w-full overflow-hidden bg-black/10",
              event.shown && "ring-2 ring-inset ring-brand",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- stand-in still, bible 18 */}
            <img src={event.cover} alt="" className="size-full object-cover" />
            {event.shown && (
              <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Check className="size-3.5" />
              </span>
            )}
          </span>
          <span className="flex flex-col gap-0.5 px-2 py-2">
            <span className="truncate text-sm font-medium text-foreground">
              {event.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {event.shown ? "Showing on your page" : "Private"}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── attended: each event's own album, once you are verified ────────────────── */

export function AttendedGuestMenu({ event = EVENT }: { event?: AttendedEvent }) {
  const [shown, setShown] = useState(event.shown);
  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="relative aspect-video w-full bg-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- stand-in still, bible 18 */}
          <img src={event.cover} alt="" className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-sm font-medium text-white">{event.name}</p>
          </div>
        </div>
      </div>
      {/* the guest menu, quoted already open: a real DropdownMenu would portal
          out of this frame rather than open inside it */}
      <div
        data-ip-relevant
        data-ip-attended-row
        className="mt-3 w-full max-w-64 rounded-[var(--radius-float)] border border-border/60 bg-popover p-1 text-popover-foreground shadow-layer"
      >
        <MenuRow label="View the album" />
        <MenuRow label="Download my photos" />
        <div className="my-1 h-px bg-border/60" />
        <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5">
          <Label htmlFor="ip-menu-toggle" className="cursor-pointer text-sm font-normal">
            Show this on your page
          </Label>
          <Switch
            id="ip-menu-toggle"
            checked={shown}
            onCheckedChange={setShown}
            aria-label={`Show ${event.name} on my profile`}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Priya&rsquo;s other two events each carry this same row on their own
        album; nothing here shows their state.
      </p>
    </div>
  );
}

/* ── prompt: after the first claim from the dashboard ────────────────────────── */

export function PromptClaim() {
  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle>Photos waiting for you</CardTitle>
          <CardDescription>
            Claimed. 3 events joined your account.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card
        data-ip-prompt="the dashboard, right after Finish"
        className="ring-1 ring-brand/40"
      >
        <CardHeader>
          <CardTitle>Set up your page</CardTitle>
          <CardDescription>
            Choose what shows before anyone sees it.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button type="button" size="sm">
            Set up your page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ── prompt: at the follow moment inside an album ────────────────────────────── */

export function PromptFollow() {
  return (
    <div className="mx-auto max-w-[420px] space-y-3 p-4">
      <Card>
        <CardHeader>
          <CardTitle>You&rsquo;re in</CardTitle>
          <CardDescription>
            Follow {EVENT.host} to see what she shares next.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-wrap gap-2">
          <Button type="button" size="sm">
            Follow {EVENT.host}
          </Button>
          <Button type="button" size="sm" variant="ghost">
            Maybe later
          </Button>
        </CardFooter>
      </Card>
      <Card
        data-ip-prompt="the follow moment, inside the album"
        className="ring-1 ring-brand/40"
      >
        <CardHeader>
          <CardTitle>Set up your page too</CardTitle>
          <CardDescription>
            Choose what {EVENT.name} shows before anyone visits.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button type="button" size="sm" variant="outline">
            Set up your page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ── prompt: from the account page only, unprompted ──────────────────────────── */

export function PromptAccountOnly() {
  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <UnrelatedCard title="Plan" body="Free plan &middot; 0 B used" />
      <Card id="public-profile">
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>Your page on Partyreel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
              /u/
            </span>
            <Input placeholder="your-name" className="pl-9" readOnly />
          </div>
          <p className="text-xs text-muted-foreground">
            Nothing points here from anywhere else; this card is the one door.
          </p>
        </CardContent>
      </Card>
      <UnrelatedCard
        title="Password"
        body="Add a password, or keep signing in with a code."
      />
    </div>
  );
}

/* ── page: what a claimed, empty page says to a visitor ──────────────────────── */

function EmptyIdentityRow() {
  return (
    <div data-pp-page className="flex items-center gap-4">
      <Avatar size="xl" seed={PRIYA.seed}>
        <AvatarFallback>P</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="font-heading text-page text-balance">{PRIYA.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">@{PRIYA.slug}</p>
      </div>
    </div>
  );
}

export function PageNothing() {
  return (
    <div className="mx-auto w-full max-w-[420px] px-5 py-10">
      <EmptyIdentityRow />
      <div data-ip-empty-line className="mt-10">
        <EmptyState variant="quiet" title="Nothing here yet" />
      </div>
    </div>
  );
}

export function PageCount() {
  return (
    <div className="mx-auto w-full max-w-[420px] px-5 py-10">
      <EmptyIdentityRow />
      <div data-ip-empty-line className="mt-10">
        <EmptyState
          variant="quiet"
          title="3 events, kept private"
          description={`${PRIYA.name} joined 3 events and hasn't chosen to show any of them yet.`}
        />
      </div>
    </div>
  );
}

export function PageNotFound() {
  return (
    <div data-ip-404 className="flex flex-1 flex-col items-center justify-center px-5 py-16">
      <NotFoundScreen
        icon={UserRoundSearch}
        eyebrow="Profile"
        title="There's nobody at this address"
        description="This handle isn't in use. Check the spelling, or ask for the link again: a profile only exists while somebody holds its handle."
        actions={
          <Button asChild size="cta">
            <Link href="/">What is Partyreel?</Link>
          </Button>
        }
        help={<HelpLine href="/help">Visit the help center</HelpLine>}
      />
    </div>
  );
}
