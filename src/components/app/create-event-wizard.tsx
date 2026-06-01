"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
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
import { eventShareUrls, previewJoinUrl } from "@/lib/events/share-urls";
import {
  createEventSchema,
  type CreateEventInput,
  type CreateEventValues,
} from "@/lib/validation/event";
import { cn } from "@/lib/utils";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";

const STEP_LABELS = ["Details", "Design", "Share"] as const;

type CreateEventWizardProps = {
  siteUrl: string;
  planName: string;
};

// The streamlined create flow (Phase 6 cut #2): details → QR design → share.
// Everything is collected client-side and the event is created ONCE, at commit
// (end of the design step), so nothing is persisted until the host commits (no
// abandoned events). The share step needs the real qr_token/share_token, so this
// uses createEventInWizard (which RETURNS the event) rather than redirecting on
// create. Only `name` is required — the rest is optional/defaulted.
export function CreateEventWizard({
  siteUrl,
  planName,
}: CreateEventWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
  const [isPending, startTransition] = useTransition();

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
  const shareUrls = createdEvent ? eventShareUrls(siteUrl, createdEvent) : null;

  async function goToDesign() {
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
        toast.error(`Event limit reached on the ${planName} plan.`, {
          description: "Delete an event or upgrade to add more.",
          action: { label: "Upgrade", onClick: () => router.push("/pricing") },
        });
        router.push("/dashboard");
        return;
      }
      toast.error("Couldn't create the event.", {
        description: result.message,
      });
    });
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Create an event</CardTitle>
        <CardDescription>
          {step < 3
            ? "Name it, pick a QR style, and you're ready to collect photos."
            : "Your event is live. Share it with your guests."}
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
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event name</FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder="Maya & Sam's Wedding"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="A note your guests will see when they join."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Event date{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Just for your reference: events never expire.
                    </FormDescription>
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
              <Button type="button" onClick={goToDesign}>
                Continue <ArrowRight />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Guest join QR</p>
                <p className="text-sm text-muted-foreground">
                  Pick a style for the QR your guests scan. You can change it
                  anytime.
                </p>
              </div>
              <QrPresetPicker
                value={qrStyle}
                onChange={(k) => form.setValue("qr_style", k)}
                joinUrl={previewJoinUrl(siteUrl)}
              />
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
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

        {step === 3 && createdEvent && shareUrls && (
          <>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <PartyPopper className="size-4 text-brand" />
                <span className="font-medium">
                  {createdEvent.name} is ready.
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Guest join QR</p>
                <p className="text-sm text-muted-foreground">
                  Print or display this so guests can join. No app, no account.
                </p>
                <div className="pt-1">
                  <EventQr
                    joinUrl={shareUrls.joinUrl}
                    eventName={createdEvent.name}
                    style={resolveQrPreset(createdEvent.qr_style)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Public album link</p>
                <CopyShareLink url={shareUrls.albumUrl} />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                onClick={() => router.push(`/dashboard/${createdEvent.id}`)}
              >
                Go to your event <ArrowRight />
              </Button>
            </CardFooter>
          </>
        )}
      </Form>
    </Card>
  );
}
