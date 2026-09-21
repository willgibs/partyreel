"use client";

import { useFormContext, useWatch } from "react-hook-form";

import type { HostEvent } from "@/lib/db/queries/events";
import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import type {
  UpdateEventInput,
  UpdateEventValues,
} from "@/lib/validation/event";
import { LockChip } from "@/components/app/pricing/lock-chip";
import { ConfirmSwitch } from "@/components/ui/confirm-switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

// Settings · Guest uploads. The accepting/cap/moderation/verified-email controls + the
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

  // Live "what your guests will experience" summary — recomputed as the host flips the
  // access toggles (visibility/password + verified emails + uploads). Shares one source
  // with the dashboard access line.
  const visibility = useWatch({ control, name: "visibility" }) ?? "open";
  const requireVerifiedEmail =
    useWatch({ control, name: "require_verified_email" }) ?? true;
  const acceptingUploads =
    useWatch({ control, name: "accepting_uploads" }) ?? event.accepting_uploads;
  const guestSummary = guestExperienceSummary({
    visibility,
    requireVerifiedEmail,
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
        {/* moderation_mode is an enum, surfaced as a yes/no switch: on = hold_for_approval, off = live.
            Turning it OFF while items are under review is consequential (those uploads auto-approve
            into the gallery), so ConfirmSwitch asks first - but only when there's a queue (`confirmWhen`
            reads pendingCount, not just the direction). Turning ON, or OFF with nothing pending, is
            instant (`app-vocabulary` r1, `confirm-switch=primitive`: the two hand-rolled dialogs below
            retired into the one primitive that owns the glyph and the deferred-open dance). */}
        <FormField
          control={control}
          name="moderation_mode"
          render={({ field }) => (
            <ConfirmSwitch
              label="Review uploads before they appear"
              description="Hold new photos for your approval instead of showing them live."
              checked={field.value === "hold_for_approval"}
              onCheckedChange={(checked) =>
                field.onChange(checked ? "hold_for_approval" : "live")
              }
              confirmWhen={(next) => !next && pendingCount > 0}
              dialogTitle="Stop reviewing uploads?"
              dialogDescription={
                <>
                  {pendingCount === 1
                    ? "1 photo is under review. Turning this off approves it and shows it to everyone right away."
                    : `${pendingCount} photos are under review. Turning this off approves them and shows them to everyone right away.`}{" "}
                  New uploads will then appear live without your review. You
                  can turn this back on anytime.
                </>
              }
              confirmLabel={
                pendingCount === 1
                  ? "Approve it and stop"
                  : "Approve all and stop"
              }
              cancelLabel="Keep reviewing"
            />
          )}
        />
        {/* No inversion: the field IS what the switch asks. Turning it OFF (skipping email
            verification) is the consequential direction, so ConfirmSwitch asks first; turning
            it back ON is instant. */}
        <FormField
          control={control}
          name="require_verified_email"
          render={({ field }) => (
            <ConfirmSwitch
              label="Require verified emails"
              description="On (recommended): guests confirm their email to see the full gallery and add photos (a few previews show first). Off, guests choose a display name before adding photos, shown with a small unverified mark."
              checked={field.value}
              onCheckedChange={field.onChange}
              confirmWhen={(next) => !next}
              dialogTitle="Let guests upload without verifying?"
              dialogDescription="Guests will type a display name instead of confirming an email. Their photos carry a small unverified mark, abuse is harder to trace, and you won’t capture their email. You can turn this back on anytime."
              confirmLabel="Allow unverified uploads"
              cancelLabel="Keep emails required"
            />
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
            </p>
          </div>
          {/* The fourth of the four sentences that worded one rule four ways
              (`words=chip`). Where the status pill read "Photos only" beside a
              link out to the marketing page, the chip IS the control: it says
              what is locked, what opens it, and opens the sheet. */}
          {videosAllowed ? (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              Photos &amp; video
            </span>
          ) : (
            <LockChip
              feature="video"
              className="shrink-0"
              returnTo={`/dashboard/${event.id}?room=settings`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
