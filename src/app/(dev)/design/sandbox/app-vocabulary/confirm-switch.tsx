"use client";

import { ShieldCheck } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";

import { UploadsSection } from "@/components/app/event-settings/uploads-section";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type {
  UpdateEventInput,
  UpdateEventValues,
} from "@/lib/validation/event";

import { HOST_EVENT } from "./fixtures";

/**
 * THE CONFIRM SWITCH: three switches on one settings page, three behaviours,
 * no visual cue. `accepting_uploads` flips at once; `moderation_mode` and
 * `allow_anonymous_uploads` each open a confirm dialog on their consequential
 * direction, via the SAME hand-rolled `setTimeout(() => setOpen(true), 0)`
 * dodge, written out twice in one file (the radix dismissable-layer race).
 * Nothing tells a host which switch is which before they tap it.
 *
 * `Today` is the real `UploadsSection`, in a real `FormProvider` — nothing
 * copied. The excerpt below it is the ONE row a cue would land on
 * (`allow_anonymous_uploads`), built from the same real `FormField` furniture
 * `UploadsSection` uses, because the proposed glyph is the one thing that does
 * not exist to import yet.
 */

function useDemoForm() {
  return useForm<UpdateEventInput, unknown, UpdateEventValues>({
    defaultValues: {
      accepting_uploads: HOST_EVENT.accepting_uploads,
      allow_anonymous_uploads: HOST_EVENT.allow_anonymous_uploads,
      moderation_mode: HOST_EVENT.moderation_mode,
      max_upload_bytes: HOST_EVENT.max_upload_bytes,
    },
  });
}

export function Today() {
  const form = useDemoForm();
  return (
    <FormProvider {...form}>
      <UploadsSection event={HOST_EVENT} videosAllowed pendingCount={3} />
    </FormProvider>
  );
}

export type CueOption = "label" | "icon" | "primitive";

/** The one row a cue would land on, illustrated at the option's treatment.
 *  `checked=true` here (accounts required, today's default) so the switch
 *  shown is the one whose OFF direction asks first. */
function CueRow({ option }: { option: CueOption }) {
  const form = useDemoForm();
  const asksFirst = option !== "label";
  return (
    <FormProvider {...form}>
      <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <div className="space-y-0.5">
          <FormLabel className="inline-flex items-center gap-1.5">
            Require accounts to upload
            {asksFirst && (
              <ShieldCheck
                aria-hidden
                className="size-3.5 text-muted-foreground"
              />
            )}
          </FormLabel>
          <FormDescription>
            {option === "label"
              ? "Asks to confirm before it turns off. On (recommended): guests verify a free account to see the full gallery and add photos."
              : "On (recommended): guests verify a free account to see the full gallery and add photos."}
          </FormDescription>
          {option === "primitive" && (
            <p className="text-[10px] text-muted-foreground/80">
              One `ConfirmSwitch` owns the dialog and the glyph; the two
              hand-rolled `setTimeout` dances retire into it.
            </p>
          )}
        </div>
        <FormControl>
          <Switch checked disabled />
        </FormControl>
      </FormItem>
    </FormProvider>
  );
}

export function ConfirmShowcase({ option }: { option: CueOption }) {
  return (
    <div className="min-h-full space-y-4 bg-background p-5 text-foreground">
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-[10px] text-muted-foreground">
          Today: Settings &rsaquo; Guest uploads, unchanged
        </p>
        <Today />
      </div>
      <div>
        <p className="mb-2 px-1 text-[10px] text-muted-foreground">
          The one row a cue lands on, up close
        </p>
        <CueRow option={option} />
      </div>
    </div>
  );
}
