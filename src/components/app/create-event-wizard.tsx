"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Printer,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  createEventInWizard,
  type CreatedEvent,
} from "@/app/(app)/dashboard/actions";
import {
  DEFAULT_QR_PRESET,
  resolveQrPreset,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";
import { type Tier } from "@/lib/constants/tiers";
import { eventUrl, previewJoinUrl } from "@/lib/events/share-urls";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  createEventSchema,
  type CreateEventInput,
  type CreateEventValues,
} from "@/lib/validation/event";
import { cn } from "@/lib/utils";
import { trackAttrs } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import { StyledQr } from "@/components/app/styled-qr";
import { useCopyLink } from "@/components/app/share/use-copy-link";

const STEP_LABELS = ["Name", "Style", "Ready"] as const;

/** One event already filling a slot, as the door names it. */
export type CappedEvent = { id: string; name: string };

type CreateEventWizardProps = {
  siteUrl: string;
  planName: string;
  tier: Tier;
  /** Server-computed with the dashboard's own cap math. */
  atCap: boolean;
  /** The plan's event limit. null = unlimited, so the door never renders. */
  maxEvents: number | null;
  /** The events already filling the plan, so the door can name one. */
  cappedEvents: CappedEvent[];
};

/**
 * THE CREATE FLOW (the `first-event` board, ruled whole by Will 2026-09-21).
 *
 * Four of his eight verdicts land in this one file:
 *
 *  ★ `asks=one` — "Name it and it exists", with his note: "the option 3 design
 *    feels much more exciting along the way. Would love to use that bigger name
 *    edit field." So step 1 is ONE field, drawn as option 3's name-under-a-
 *    cursor: the name at the size it will be on the event, on a rule rather than
 *    in a box. The note and the date LEFT the wizard — they are edited on the
 *    event, under the header that shows them, through the settings sheet that
 *    already holds both.
 *
 *  ★ `style=step` — the step stays, redesigned (qr-preset-picker.tsx), because
 *    his note says what it is for: "Hosts may not know they can adjust it later.
 *    This introduces the feature."
 *
 *  ★ `limit=door` — the refusal arrives before the form, not after the work.
 *
 *  ★ `landing=beat` — Create ends on ONE screen for the one job that is next,
 *    shown exactly once in an event's life. By construction, not by a flag: only
 *    pressing Create reaches step 3, and the route has no other way into it.
 *
 * The event is still created ONCE, at commit, so an abandoned wizard leaves no
 * row (`createEventInWizard` RETURNS the event rather than redirecting, which is
 * what lets the beat draw the real code).
 */
export function CreateEventWizard({
  siteUrl,
  planName,
  tier,
  atCap,
  maxEvents,
  cappedEvents,
}: CreateEventWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
  // The cap refusal's Upgrade no longer LEAVES for /pricing (`first=trigger`):
  // the sheet opens on `room`, knowing the host ran out of events. A toast
  // action has no element to hang a trigger on, so this one is controlled.
  const [pricingOpen, setPricingOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * ★ THE DOOR IS DECIDED ONCE, AT MOUNT, AND THAT IS LOAD-BEARING
   * (`limit=door`, Will: "Letting them do the work of creating a second event,
   * then finding out they can't create it on the free plan is bad user
   * experience design").
   *
   * Creating an event puts a Free host AT their cap, and a Server Action
   * refreshes the route it was called from — so the RSC refresh that follows
   * `createEventInWizard` re-renders /dashboard/new with `atCap` now TRUE. React
   * keeps this island's STATE across that refresh but hands it fresh PROPS, so
   * reading the live prop would swap the beat the host just earned for a
   * refusal. The same fact once made an at-cap `redirect` on this route bounce a
   * host away mid-create (it shipped, and live testing caught it); this is that
   * bug's second shape, and the snapshot answers both.
   */
  const [wasAtCap] = useState(() => atCap);

  const form = useForm<CreateEventInput, unknown, CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      description: "",
      event_date: "",
      qr_style: DEFAULT_QR_PRESET,
    },
  });

  // useWatch (not form.watch) so the subscription is a proper hook — keeps the
  // picker's selection reactive and satisfies the react-hooks compiler lint.
  const qrStyle = (useWatch({ control: form.control, name: "qr_style" }) ??
    DEFAULT_QR_PRESET) as QrStyleKey;
  const eventLink = createdEvent
    ? eventUrl(siteUrl, createdEvent.qr_token)
    : null;

  async function goToStyle() {
    // Only the name gates progress; validate just it before advancing.
    if (await form.trigger("name")) setStep(2);
  }

  function onCreate(values: CreateEventValues) {
    startTransition(async () => {
      const result = await createEventInWizard(values);
      if (result.ok) {
        setCreatedEvent(result.event);
        setStep(3);
        return;
      }
      if (result.code === "limit_reached") {
        // The server's enforce_event_limit stays the guard BEHIND the door: a
        // second tab, a slot spent elsewhere, a page left open for an hour.
        toast.error(`Event limit reached on the ${planName} plan.`, {
          description: "Delete an event or upgrade to add more.",
          action: { label: "Upgrade", onClick: () => setPricingOpen(true) },
        });
        router.push("/dashboard");
        return;
      }
      toast.error("Couldn't create the event.", {
        description: result.message,
      });
    });
  }

  const pricing = (
    <PricingSheet
      open={pricingOpen}
      onOpenChange={setPricingOpen}
      trigger={{ kind: "room" }}
      plan={{ tier, hasBilling: false }}
      returnTo="/dashboard"
    />
  );

  // THE DOOR, before the form opens — and never after a creation in this session.
  if (wasAtCap && !createdEvent) {
    return (
      <>
        {pricing}
        <CapDoor
          planName={planName}
          maxEvents={maxEvents}
          events={cappedEvents}
          onUpgrade={() => setPricingOpen(true)}
        />
      </>
    );
  }

  return (
    <>
      {pricing}
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle>
            {step === 3 && createdEvent
              ? `${createdEvent.name} is live`
              : "Create an event"}
          </CardTitle>
          <CardDescription>
            {step === 3
              ? "One thing left: get the code where your guests will be."
              : "Name it, pick a style for the code, and you're collecting photos."}
          </CardDescription>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <li key={label} className="flex items-center gap-2">
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
                    className={cn(
                      active
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
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
        </CardHeader>

        <Form {...form}>
          {step === 1 && (
            <>
              <CardContent>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      {/* The label is the question, because the field under it
                          is the screen's subject rather than one row of a form. */}
                      <FormLabel className="font-normal text-muted-foreground">
                        What are you collecting photos for?
                      </FormLabel>
                      <FormControl>
                        {/* ★ THE NAME AT THE SIZE IT WILL BE (his "bigger name
                            edit field"). Borderless on a rule: a box would make
                            this one field of a form, and the whole verdict is
                            that it is not. The focus state thickens the RULE
                            rather than drawing a ring — a ring around a
                            borderless field is the box coming back. */}
                        <Input
                          autoFocus
                          placeholder="Maya & Sam's Wedding"
                          className="h-auto rounded-none border-0 border-b-2 border-border bg-transparent px-0 py-2 font-heading !text-section shadow-none transition-colors focus-visible:border-brand focus-visible:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={goToStyle}>
                  Continue <ArrowRight />
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Pick a style for the code
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is what your guests scan. You can change it later from
                    Share.
                  </p>
                </div>
                <QrPresetPicker
                  value={qrStyle}
                  onChange={(k) => form.setValue("qr_style", k)}
                  joinUrl={previewJoinUrl(siteUrl)}
                />
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft /> Back
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={form.handleSubmit(onCreate)}
                >
                  {isPending ? "Creating…" : "Create event"}
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && createdEvent && eventLink && (
            <TheBeat
              eventId={createdEvent.id}
              eventName={createdEvent.name}
              joinUrl={eventLink}
              qrStyle={createdEvent.qr_style}
              onGo={() => router.push(`/dashboard/${createdEvent.id}`)}
            />
          )}
        </Form>
      </Card>
    </>
  );
}

/**
 * THE BEAT (`landing=beat`). One screen, once: the code the host now owns, and
 * the two ways it leaves the screen.
 *
 * ★ THE MAT IS `DemoFrame`'S COMPOSITION, NOT ITS COMPONENT. That object is a
 * photograph in a mat with the code tucked into a corner, and this event has no
 * photograph — it has nothing at all yet, which is the point of the beat. So the
 * mat is borrowed (a card of its own lightness, the layer shadow, the white
 * plate with its contact shadow and hairline on top of it) and the code is its
 * SUBJECT rather than its accent, at a size a phone across a table reads.
 *
 * ★ `EventSlugControl` IS NOT HERE. It rode the old share step; it belongs to
 * the share sheet, where the readable link already lives and where a host comes
 * back to claim one. A beat with a text input on it is not a beat.
 */
function TheBeat({
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  onGo,
}: {
  eventId: string;
  eventName: string;
  joinUrl: string;
  qrStyle: string;
  onGo: () => void;
}) {
  const { copied, copy } = useCopyLink(joinUrl);
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );

  async function shareOrCopy() {
    if (canShare) {
      try {
        await navigator.share({
          title: eventName,
          text: `Add your photos and videos to ${eventName}`,
          url: joinUrl,
        });
        return;
      } catch {
        // Dismissed, or refused. The clipboard is the same intent, so fall to it
        // rather than leaving the press with nothing to show for itself.
      }
    }
    void copy();
  }

  return (
    <>
      <CardContent className="space-y-5">
        <div className="flex justify-center">
          <span className="inline-flex flex-col items-center gap-3 rounded-[var(--radius-tile)] border bg-card p-3 shadow-layer">
            <span className="rounded-md bg-white p-3 shadow-lift ring-1 ring-border">
              <StyledQr
                value={joinUrl}
                size={240}
                style={resolveQrPreset(qrStyle)}
                className="[&>svg]:block"
              />
            </span>
            <span className="max-w-[240px] truncate text-center text-sm font-medium">
              {eventName}
            </span>
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/${eventId}/print`}
              target="_blank"
              rel="noopener noreferrer"
              {...trackAttrs("cta_click", {
                cta: "print-stock",
                location: "create-beat",
              })}
            >
              <Printer /> Print the table cards
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={shareOrCopy}
            {...trackAttrs("cta_click", {
              cta: "copy-event-link",
              location: "create-beat",
            })}
          >
            <span data-copy-pop={copied ? "on" : undefined} className="flex">
              {copied ? <Check /> : canShare ? <Share2 /> : <Copy />}
            </span>
            {copied ? "Copied" : "Share the link"}
          </Button>
        </div>
        <span aria-live="polite" className="sr-only">
          {copied ? "Link copied" : ""}
        </span>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" onClick={onGo}>
          Go to your event <ArrowRight />
        </Button>
      </CardFooter>
    </>
  );
}

/**
 * THE DOOR (`limit=door`, Will: "Should handle upfront with actions to
 * address"). The refusal arrives BEFORE the form, names the plan's real number
 * and the event already holding the slot, and offers both ways forward.
 *
 * ★ THE COPY COMES FROM THE NUMBER, NEVER FROM A LITERAL "ONE". Free holds one
 * event today and an Event Pass holds one, but `profiles.event_slots` is the
 * webhook-derived concurrent-pass count and overrides both (billing-caps.md), so
 * a host who stacked three passes must read "holds 3 events". A sentence with
 * "one" written into it is a sentence that lies the first time somebody stacks.
 */
function CapDoor({
  planName,
  maxEvents,
  events,
  onUpgrade,
}: {
  planName: string;
  maxEvents: number | null;
  events: CappedEvent[];
  onUpgrade: () => void;
}) {
  const limit = maxEvents ?? events.length;
  const holds = limit === 1 ? "one event" : `${limit} events`;
  const named = events[0];
  const rest = events.length - 1;

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>
          {planName} holds {holds}
        </CardTitle>
        <CardDescription>
          {named
            ? rest > 0
              ? `You have ${named.name} and ${rest} more. Pro holds as many events as you want.`
              : `You have ${named.name}. Pro holds as many events as you want.`
            : "Pro holds as many events as you want."}
        </CardDescription>
      </CardHeader>
      {named && (
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/dashboard/${event.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-foreground/30"
                >
                  <span className="min-w-0 truncate font-medium">
                    {event.name}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          {/* The place deleted events wait has one name in the app, "Deleted"
              (the dashboard's filter, the lifecycle emails), and its window
              is the lifecycle constant, never a typed number. */}
          <p className="text-sm text-muted-foreground">
            Deleting an event frees its slot. It waits in Deleted for{" "}
            {RECENTLY_DELETED_WINDOW_DAYS} days first, so nothing is gone the
            moment you press it.
          </p>
        </CardContent>
      )}
      <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
        {named && (
          <Button variant="ghost" asChild>
            <Link href={`/dashboard/${named.id}?room=settings`}>
              <Trash2 /> Delete it
            </Link>
          </Button>
        )}
        <Button
          type="button"
          onClick={onUpgrade}
          {...trackAttrs("cta_click", {
            cta: "upgrade",
            location: "create-cap-door",
          })}
        >
          See Pro
        </Button>
      </CardFooter>
    </Card>
  );
}
