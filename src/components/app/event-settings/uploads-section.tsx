"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { HostEvent } from "@/lib/db/queries/events";
import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import type {
  UpdateEventInput,
  UpdateEventValues,
} from "@/lib/validation/event";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

// Settings · Guest uploads. The accepting/cap/moderation/accounts controls + the
// live "what your guests will experience" preview (re-keyed so it crossfades on each
// change) + the read-only video status. Consumes the shared form via useFormContext.
export function UploadsSection({
  event,
  videosAllowed,
  pendingCount = 0,
}: {
  event: HostEvent;
  videosAllowed: boolean;
  // Under-review (pending) count: drives the moderation-disable confirm copy AND whether to confirm
  // at all (0 pending → turning moderation off is harmless, apply instantly).
  pendingCount?: number;
}) {
  const { control } = useFormContext<
    UpdateEventInput,
    unknown,
    UpdateEventValues
  >();
  // Opt-in-anon confirmation: turning OFF "Require accounts to upload" opens uploads to
  // anyone with the link, so we confirm the consequences before applying it.
  const [confirmAnonOpen, setConfirmAnonOpen] = useState(false);
  // Moderation-disable confirmation: turning OFF "Review uploads" auto-approves everything currently
  // under review, so confirm first (only when there's a queue to approve).
  const [confirmModerationOpen, setConfirmModerationOpen] = useState(false);

  // Live "what your guests will experience" summary — recomputed as the host flips the
  // access toggles (visibility/password + accounts + uploads). Shares one source with
  // the dashboard access line.
  const visibility = useWatch({ control, name: "visibility" }) ?? "open";
  const accountRequired = !(
    useWatch({ control, name: "allow_anonymous_uploads" }) ?? true
  );
  const acceptingUploads =
    useWatch({ control, name: "accepting_uploads" }) ?? event.accepting_uploads;
  const guestSummary = guestExperienceSummary({
    visibility,
    accountRequired,
    acceptingUploads,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest uploads</CardTitle>
        <CardDescription>
          Control whether and how guests contribute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="accepting_uploads"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <FormLabel>Accepting uploads</FormLabel>
                <FormDescription>
                  Turn off to freeze the album. Guests can still view it.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="max_upload_bytes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max size per upload</FormLabel>
              <FormControl>
                <select
                  className="h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  value={field.value == null ? "" : String(field.value)}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                >
                  {UPLOAD_CAP_PRESETS.map((preset) => (
                    <option
                      key={preset.label}
                      value={preset.bytes == null ? "" : String(preset.bytes)}
                    >
                      {preset.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                Cap how large any single guest upload can be, so one guest
                can&rsquo;t fill your storage. Your own uploads aren&rsquo;t
                affected.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="moderation_mode"
          render={({ field }) => (
            <>
              <FormItem className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <FormLabel>Review uploads before they appear</FormLabel>
                  <FormDescription>
                    Hold new photos for your approval instead of showing them
                    live.
                  </FormDescription>
                </div>
                <FormControl>
                  {/* moderation_mode is an enum, surfaced as a yes/no switch: on = hold_for_approval,
                      off = live. Turning it OFF while items are under review is consequential (those
                      uploads auto-approve into the gallery), so confirm first - but only when there's
                      a queue. The OFF-open is DEFERRED a tick (same radix dismissable-layer race as the
                      anon confirm below). Turning ON, or OFF with nothing pending, is instant. */}
                  <Switch
                    checked={field.value === "hold_for_approval"}
                    onCheckedChange={(checked) => {
                      if (checked) field.onChange("hold_for_approval");
                      else if (pendingCount > 0)
                        setTimeout(() => setConfirmModerationOpen(true), 0);
                      else field.onChange("live");
                    }}
                  />
                </FormControl>
              </FormItem>

              {/* Turning moderation off auto-approves everything currently under review (the server
                  enforces this invariant: live mode never holds pending media). Name the count before
                  applying. Cancel leaves moderation ON (the field never changes). */}
              <Dialog
                open={confirmModerationOpen}
                onOpenChange={setConfirmModerationOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Stop reviewing uploads?</DialogTitle>
                    <DialogDescription>
                      {pendingCount === 1
                        ? "1 photo is under review. Turning this off approves it and shows it to everyone right away."
                        : `${pendingCount} photos are under review. Turning this off approves them and shows them to everyone right away.`}{" "}
                      New uploads will then appear live without your review. You
                      can turn this back on anytime.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Keep reviewing</Button>
                    </DialogClose>
                    <Button
                      onClick={() => {
                        field.onChange("live");
                        setConfirmModerationOpen(false);
                      }}
                    >
                      {pendingCount === 1
                        ? "Approve it and stop"
                        : "Approve all and stop"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        />
        <FormField
          control={control}
          name="allow_anonymous_uploads"
          render={({ field }) => (
            <>
              <FormItem className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <FormLabel>Require accounts to upload</FormLabel>
                  <FormDescription>
                    On (recommended): guests verify a free account to see the
                    full gallery and add photos (a few previews show first), so
                    every upload is tied to an email. Off lets anyone with the
                    link view and add anonymously.
                  </FormDescription>
                </div>
                <FormControl>
                  {/* checked = "require accounts" = !allow_anonymous_uploads. Turning it
                      OFF (allowing anonymous) is the consequential direction → confirm
                      first; turning it back ON is instant. The OFF-open is DEFERRED a tick:
                      opening the Dialog synchronously inside this click lets radix's
                      dismissable-layer catch the same in-flight pointer event and close the
                      confirm instantly. */}
                  <Switch
                    checked={!field.value}
                    onCheckedChange={(checked) => {
                      if (checked) field.onChange(false);
                      else setTimeout(() => setConfirmAnonOpen(true), 0);
                    }}
                  />
                </FormControl>
              </FormItem>

              {/* Spell out the consequences before opening uploads to anyone with the
                  link. Cancel leaves the switch on (the field never changes). */}
              <Dialog open={confirmAnonOpen} onOpenChange={setConfirmAnonOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Allow anonymous uploads?</DialogTitle>
                    <DialogDescription>
                      Anyone with the link will be able to add photos without
                      creating an account. Their uploads won&rsquo;t be tied to a
                      verified email, so abuse is harder to trace and you
                      won&rsquo;t capture contributors. You can turn this back on
                      anytime.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Keep accounts required</Button>
                    </DialogClose>
                    <Button
                      onClick={() => {
                        field.onChange(true);
                        setConfirmAnonOpen(false);
                      }}
                    >
                      Allow anyone to upload
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        />
        {/* Live "what your guests will experience" line — re-keyed so it crossfades on each change. */}
        <p
          key={guestSummary}
          data-settings-reveal
          className="text-sm text-muted-foreground"
        >
          {guestSummary}
        </p>
        {/* Video uploads — a read-only STATUS, not a toggle. The gate is
            tier-driven and enforced at upload (create_media), so there's no
            host switch: a free event is photos-only for guests AND the host. */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Video uploads</p>
            <p className="text-sm text-muted-foreground">
              {videosAllowed
                ? "Guests and you can upload photos and video."
                : "This event accepts photos only."}
              {!videosAllowed && (
                <>
                  {" "}
                  <Link
                    href="/pricing"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Upgrade to allow video
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            {videosAllowed ? "Photos & video" : "Photos only"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
