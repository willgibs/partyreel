"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { HoneypotField } from "@/components/marketing/forms/honeypot-field";
import { useReceiptSwap } from "@/components/marketing/forms/receipt-swap";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/ui/client-form";
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
import { track } from "@/lib/analytics/web";
import { showActionError } from "@/lib/errors";
import { useHydrated } from "@/lib/shared/use-hydrated";
import { cn } from "@/lib/utils";
import { careerSchema, type CareerInput } from "@/lib/validation/careers";
import { HONEYPOT_FIELD } from "@/lib/validation/public-form";

import { submitApplication, type CareerResult } from "../actions";
import {
  ApplicationReceipt,
  applicationReceiptFrom,
  type ApplicationReceiptData,
} from "./application-receipt";

/**
 * THE APPLICATION FORM (the careers round, 2026-08-28).
 *
 * Dressed as an instrument rather than a bare field stack, following the
 * contact round's ruling. The figure/ground is INVERTED from /contact on
 * purpose: there the gray card sits on white paper, here a white card sits on
 * the gray application band, because on this page the band is what separates
 * the application chapter from the description above it. Fields keep their
 * explicit `bg-background` either way.
 *
 * FIELD ORDER IS THE REAL CHANGE. Work samples are the signal for the roles we
 * are actually hiring for, so "Work" moves directly under the email and gets a
 * placeholder that says what we want to see, while the note keeps a SPECIFIC
 * prompt instead of a blank "why you'd be a great fit" box (the highest-
 * friction, lowest-information thing you can put in front of someone with
 * options).
 *
 * ! Work stays OPTIONAL rather than required, which is a deliberate departure
 *   from the round's plan: this same form serves the permanent General
 *   Application, and gating that door on a portfolio link would contradict the
 *   whole point of keeping it open. Making it conditionally required for named
 *   vacancies only is a live option if we ever want the harder gate.
 *
 * ONE CONTRACT WITH /contact (mkt-polish): the same fields, honeypot and
 * Server Function pipeline (`public-form.ts`, `public-form-submit.ts`), and the
 * same ending: the card becomes the application's receipt (`receipt-swap.ts`,
 * `NoteReceipt`), where it used to end on a toast and a bare drawn check. The
 * submit waits for hydration, and a Server Function that never answers is a
 * failed send with every word kept, as /contact's are.
 *
 * `track("careers_apply")` fires on the success branch INCLUDING the honeypot
 * fake-ok, which is the same semantics contact_submit ships: the client cannot
 * tell them apart, and the event name is pinned by an exact-array test.
 */
export function ApplicationForm({
  roleSlug,
  roleTitle,
}: {
  roleSlug: string;
  roleTitle: string;
}) {
  // Send another hands the keyboard back to the name, the first field.
  // Taken apart at once: the wrapper's ref rides beside values a render reads.
  const {
    body,
    receipt,
    leaving,
    frameStyle,
    measure,
    land,
    another,
    formMotion,
  } = useReceiptSwap<ApplicationReceiptData>('input[name="name"]');
  const form = useForm<CareerInput>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      name: "",
      email: "",
      links: "",
      message: "",
      [HONEYPOT_FIELD]: "",
    },
  });
  const { isSubmitting } = form.formState;
  const hydrated = useHydrated();

  async function onSubmit(values: CareerInput) {
    const result: CareerResult = await submitApplication(
      roleSlug,
      values,
    ).catch(() => ({ ok: false as const, code: "send_failed" as const }));
    if (!result.ok) {
      showActionError(result);
      return;
    }
    track("careers_apply");
    await land(applicationReceiptFrom(values, roleTitle), () => form.reset());
  }

  return (
    <div className="rounded-sm border bg-card p-6 sm:p-7">
      <div ref={body} style={frameStyle}>
        {receipt ? (
          <ApplicationReceipt receipt={receipt} onAnother={another} />
        ) : (
          <Form {...form}>
            <ClientForm
              onSubmit={(event) => {
                measure();
                return form.handleSubmit(onSubmit)(event);
              }}
              inert={leaving}
              className={cn("flex flex-col gap-4", formMotion)}
            >
              <HoneypotField registration={form.register(HONEYPOT_FIELD)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="links"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Work{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A portfolio, a repo, a reel, anything you made"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The fastest way to tell us something a resume cannot.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="What would you want to own here, and what in your work should we look at first?"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button
                  type="submit"
                  disabled={!hydrated || isSubmitting}
                  className="transition-transform active:scale-[0.98]"
                >
                  {isSubmitting ? "Sending…" : "Submit application"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  No resume required.
                </span>
              </div>
            </ClientForm>
          </Form>
        )}
      </div>
    </div>
  );
}
