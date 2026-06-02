"use client";

import { useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteEventAction,
  updateEventAction,
} from "@/app/(app)/dashboard/actions";
import { isSettingLocked, type Tier } from "@/lib/constants/tiers";
import type { HostEvent } from "@/lib/db/queries/events";
import {
  updateEventSchema,
  type UpdateEventInput,
  type UpdateEventValues,
} from "@/lib/validation/event";
import { EventPasswordControl } from "@/components/app/event-password-control";
import {
  VISIBILITY_HINTS,
  VisibilitySelector,
} from "@/components/app/visibility-selector";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type EventSettingsFormProps = {
  // Hash-free host event (see queries/events.ts): carries `visibility` + `has_password`,
  // never the bcrypt hash.
  event: HostEvent;
  tier: Tier;
};

export function EventSettingsForm({ event, tier }: EventSettingsFormProps) {
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  // Tier-gated settings: locked controls are disabled with an upgrade hint. The
  // server re-enforces the gate — this is UX, not the boundary.
  const emailLocked = isSettingLocked("require_email", tier);
  const passwordLocked = isSettingLocked("password", tier);

  // updateEventSchema is createEventSchema.partial(), so every field is optional; we
  // still prefill from the row so the controls are controlled from the first render.
  const form = useForm<UpdateEventInput, unknown, UpdateEventValues>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      name: event.name,
      description: event.description ?? "",
      event_date: event.event_date ?? "",
      visibility: event.visibility,
      accepting_uploads: event.accepting_uploads,
      require_display_name: event.require_display_name,
      require_email: event.require_email,
      moderation_mode: event.moderation_mode,
    },
  });

  // Block the general save while "Password" is selected but no password is set — the
  // password sub-panel is the commit for that path, and the server rejects the bare
  // open->password transition anyway (defense-in-depth).
  const visibility =
    useWatch({ control: form.control, name: "visibility" }) ?? "open";
  const passwordSelectedWithoutHash =
    visibility === "password" && !event.has_password;

  function onSubmit(values: UpdateEventValues) {
    startSaving(async () => {
      const result = await updateEventAction(event.id, values);
      if (!result || result.ok) {
        toast.success("Settings saved.");
        // Re-baseline the form so isDirty resets and another save is a no-op.
        form.reset(values);
        return;
      }
      toast.error("Couldn't save settings.", { description: result.message });
    });
  }

  function onDelete() {
    startDeleting(async () => {
      // On success deleteEventAction redirects to /dashboard (throws NEXT_REDIRECT),
      // so we only reach the toast on a real failure.
      const result = await deleteEventAction(event.id);
      if (!result || result.ok) return;
      toast.error("Couldn't delete the event.", {
        description: result.message,
      });
    });
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                What guests see when they land on the join page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea rows={3} {...field} />
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
                      For your reference only: events never expire.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility &amp; access</CardTitle>
              <CardDescription>Control who can see the album.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
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
                          passwordDisabled={
                            passwordLocked && !event.has_password
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {VISIBILITY_HINTS[value]}
                      </FormDescription>
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
                              form.setValue("visibility", "password", {
                                shouldDirty: false,
                              })
                            }
                            onPasswordCleared={() =>
                              form.setValue("visibility", "open", {
                                shouldDirty: false,
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

          <Card>
            <CardHeader>
              <CardTitle>Guest uploads</CardTitle>
              <CardDescription>
                Control whether and how guests contribute.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
                name="moderation_mode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <FormLabel>Review uploads before they appear</FormLabel>
                      <FormDescription>
                        Hold new photos for your approval instead of showing
                        them live.
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
                control={form.control}
                name="require_display_name"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <FormLabel>Require a display name</FormLabel>
                      <FormDescription>
                        Guests pick a name before uploading.
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
                control={form.control}
                name="require_email"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <FormLabel>Require an email</FormLabel>
                      <FormDescription>
                        Ask guests for an email before they can upload.
                        {emailLocked && (
                          <>
                            {" "}
                            <Link
                              href="/pricing"
                              className="font-medium text-foreground underline underline-offset-4"
                            >
                              Upgrade to enable
                            </Link>
                            .
                          </>
                        )}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={emailLocked}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                isSaving ||
                !form.formState.isDirty ||
                passwordSelectedWithoutHash
              }
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Danger zone. Soft-delete ONLY: deleteEventAction sets deleted_at, which
          frees the host's event slot; the R2 media purge is Phase 3. There is
          deliberately NO "end event" path — events have no end date (anti-abuse,
          see tiers.ts), so deletion is the only lifecycle exit. */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting an event removes it and frees up a slot on your plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 /> Delete event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete “{event.name}”?</DialogTitle>
                <DialogDescription>
                  This permanently removes the event and everything guests
                  uploaded. This can&rsquo;t be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={onDelete}
                >
                  {isDeleting ? "Deleting…" : "Delete event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
