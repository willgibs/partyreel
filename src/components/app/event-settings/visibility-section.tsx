"use client";

import { useFormContext } from "react-hook-form";

import type { HostEvent } from "@/lib/db/queries/events";
import type {
  UpdateEventInput,
  UpdateEventValues,
} from "@/lib/validation/event";
import { EventPasswordControl } from "@/components/app/event-password-control";
import { LockChip } from "@/components/app/pricing/lock-chip";
import { VisibilitySelector } from "@/components/app/visibility-selector";
import { VISIBILITY_HINTS } from "@/lib/events/visibility-labels";
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

// Settings · Visibility & access. The visibility selector + the inline password
// sub-panel. The password panel commits via its OWN action (which persists
// visibility='password'); on set/clear it re-baselines the visibility field
// (resetField, not setValue) so the parent's "Save changes" doesn't linger enabled
// for a now net-zero change. Consumes the shared form via useFormContext.
export function VisibilitySection({
  event,
  passwordLocked,
}: {
  event: HostEvent;
  passwordLocked: boolean;
}) {
  const { control, resetField } = useFormContext<
    UpdateEventInput,
    unknown,
    UpdateEventValues
  >();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visibility &amp; access</CardTitle>
        <CardDescription>Control who can see the album.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="visibility"
          render={({ field }) => {
            const value = field.value ?? "open";
            return (
              <FormItem className="space-y-3">
                <FormLabel>Who can see this album?</FormLabel>
                <FormControl>
                  <VisibilitySelector
                    value={value}
                    onValueChange={field.onChange}
                    passwordDisabled={passwordLocked && !event.has_password}
                  />
                </FormControl>
                <FormDescription>{VISIBILITY_HINTS[value]}</FormDescription>
                {/* One rule, one component (`words=chip`). This sentence and
                    the password panel's used to word the same lock two ways. */}
                {passwordLocked && !event.has_password && (
                  <LockChip
                    feature="password"
                    returnTo={`/dashboard/${event.id}?room=settings`}
                  />
                )}
                {value === "password" && (
                  <div
                    data-settings-reveal
                    className="rounded-lg border border-border/60 bg-muted/30 p-3"
                  >
                    <EventPasswordControl
                      eventId={event.id}
                      hasPassword={event.has_password}
                      locked={passwordLocked}
                      onPasswordSet={() =>
                        // The action already persisted visibility='password';
                        // re-baseline the field (resetField, not setValue) so the
                        // main "Save changes" doesn't linger enabled for what is now
                        // a net-zero change after using the password panel.
                        resetField("visibility", {
                          defaultValue: "password",
                        })
                      }
                      onPasswordCleared={() =>
                        resetField("visibility", {
                          defaultValue: "open",
                        })
                      }
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
