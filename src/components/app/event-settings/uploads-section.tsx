"use client";

import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";

import type { HostEvent } from "@/lib/db/queries/events";
import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import type {
  UpdateEventInput,
  UpdateEventValues,
} from "@/lib/validation/event";
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

// Settings · Guest uploads. The accepting/cap/moderation/accounts controls + the
// live "what your guests will experience" preview (re-keyed so it crossfades on each
// change) + the read-only video status. Consumes the shared form via useFormContext.
export function UploadsSection({
  event,
  anonLocked,
  videosAllowed,
}: {
  event: HostEvent;
  anonLocked: boolean;
  videosAllowed: boolean;
}) {
  const { control } = useFormContext<
    UpdateEventInput,
    unknown,
    UpdateEventValues
  >();

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
            <FormItem className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <FormLabel>Review uploads before they appear</FormLabel>
                <FormDescription>
                  Hold new photos for your approval instead of showing them
                  live.
                </FormDescription>
              </div>
              <FormControl>
                {/* moderation_mode is an enum, surfaced as a yes/no switch:
                    on = hold_for_approval, off = live. */}
                <Switch
                  checked={field.value === "hold_for_approval"}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? "hold_for_approval" : "live")
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="allow_anonymous_uploads"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <FormLabel>Require guest accounts</FormLabel>
                <FormDescription>
                  When on, guests create a free account to see the full gallery
                  and add photos (a few previews show first). Off lets anyone
                  with the link view and add anonymously.
                  {anonLocked && (
                    <>
                      {" "}
                      <Link
                        href="/pricing"
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        Upgrade to require an account
                      </Link>
                      .
                    </>
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={!field.value}
                  onCheckedChange={(checked) => field.onChange(!checked)}
                  disabled={anonLocked}
                />
              </FormControl>
            </FormItem>
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
