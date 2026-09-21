"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import { DangerZoneSection } from "@/components/app/event-settings/danger-zone-section";
import { DetailsSection } from "@/components/app/event-settings/details-section";
import { UploadsSection } from "@/components/app/event-settings/uploads-section";
import { VisibilitySection } from "@/components/app/event-settings/visibility-section";
import {
  isSettingLocked,
  videosAllowedForTier,
  type Tier,
} from "@/lib/constants/tiers";
import type { HostEvent } from "@/lib/db/queries/events";
import {
  updateEventSchema,
  type UpdateEventInput,
  type UpdateEventValues,
} from "@/lib/validation/event";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

type EventSettingsFormProps = {
  // Hash-free host event (see queries/events.ts): carries `visibility` + `has_password`,
  // never the bcrypt hash.
  event: HostEvent;
  tier: Tier;
  // Under-review count, threaded to UploadsSection's moderation-disable confirm. Optional (default 0)
  // so the form still works standalone (e.g. tests / other mounts).
  pendingCount?: number;
  // Reports the form's dirty state UP to the navigation guard (S4·C). Optional so the
  // form still works standalone (e.g. tests / other mounts).
  onDirtyChange?: (dirty: boolean) => void;
};

/**
 * The host event settings form (Phase 5; decomposed in S4·B). This is the
 * ORCHESTRATOR: it owns the ONE react-hook-form instance + the single <Form>
 * (FormProvider), the one dirty state, and the one "Save changes" button. The
 * field cards are section components that read the form via useFormContext
 * (details / visibility / uploads), so the file stays small while the form stays
 * unified. The danger zone is self-contained and lives OUTSIDE the form.
 *
 * Preserved invariants: isDirty + form.reset(values) re-baseline on save; the
 * password sub-panel re-baselines visibility via resetField (in VisibilitySection);
 * the live guest-experience preview crossfades (in UploadsSection); the Pro-gates
 * (isSettingLocked) flow down as props; the bare open->password save is blocked
 * here (passwordSelectedWithoutHash) AND server-side (defense-in-depth).
 */
export function EventSettingsForm({
  event,
  tier,
  pendingCount = 0,
  onDirtyChange,
}: EventSettingsFormProps) {
  const [isSaving, startSaving] = useTransition();

  // Tier-gated settings: locked controls are disabled with an upgrade hint. The
  // server re-enforces the gate — this is UX, not the boundary. (Require verified emails is
  // not gated; it's free + default-on, with an opt-out-to-unverified confirm in UploadsSection.)
  const passwordLocked = isSettingLocked("password", tier);
  // Video is a paid feature (Phase 2). This is a read-only STATUS, not a toggle —
  // the gate is tier-driven and enforced at upload (create_media), not a host switch.
  const videosAllowed = videosAllowedForTier(tier);

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
      require_verified_email: event.require_verified_email,
      moderation_mode: event.moderation_mode,
      max_upload_bytes: event.max_upload_bytes,
    },
  });

  // Block the general save while "Password" is selected but no password is set — the
  // password sub-panel is the commit for that path, and the server rejects the bare
  // open->password transition anyway (defense-in-depth).
  const visibility =
    useWatch({ control: form.control, name: "visibility" }) ?? "open";
  const passwordSelectedWithoutHash =
    visibility === "password" && !event.has_password;

  // Read isDirty in render so RHF's formState proxy subscribes (re-render on change),
  // then report it UP to the navigation guard. form.reset() on a successful save flips
  // it false, which clears the guard.
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <DetailsSection />
          <VisibilitySection event={event} passwordLocked={passwordLocked} />
          <UploadsSection
            event={event}
            videosAllowed={videosAllowed}
            pendingCount={pendingCount}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving || !isDirty || passwordSelectedWithoutHash}
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>

      <DangerZoneSection eventId={event.id} eventName={event.name} />
    </div>
  );
}
