"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { careerSchema, type CareerInput } from "@/lib/validation/careers";

import { submitApplication } from "../actions";

/**
 * THE APPLICATION FORM (the careers round, 2026-08-28).
 *
 * Dressed as an instrument rather than a bare field stack, following the
 * contact round's ruling: the card sits on the muted panel and every field is
 * explicitly `bg-background` so white reads against the gray.
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
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<CareerInput>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      name: "",
      email: "",
      links: "",
      message: "",
      website: "",
    },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: CareerInput) {
    const result = await submitApplication(roleSlug, values);
    if (result.ok) {
      track("careers_apply");
      setSubmitted(true);
      form.reset();
      toast.success("Application received, thanks!");
    } else {
      showActionError(result);
    }
  }

  if (submitted) {
    return (
      // The drawn check = the 10-success-check recipe (marketing.css ch. 2):
      // data-state="in" fires on mount, the inline dasharray (24 = path length
      // + 1) scopes the draw, success green is the sanctioned state accent.
      <div className="flex flex-col items-start gap-3 rounded-sm border bg-muted/50 p-6 sm:p-7">
        <span className="mkt-check text-success" data-state="in" aria-hidden>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M20 6 9 17l-5-5"
              style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
            />
          </svg>
        </span>
        <h3 className="font-heading text-base font-medium">
          Application received
        </h3>
        <p className="text-sm text-muted-foreground">
          Thanks for applying to {roleTitle}. We read every one, and we&rsquo;ll
          be in touch if it looks like a fit.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border bg-muted/50 p-6 sm:p-7">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Honeypot - hidden from applicants; bots that fill it are silently dropped. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            {...form.register("website")}
          />
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
              disabled={isSubmitting}
              className="transition-transform active:scale-[0.98]"
            >
              {isSubmitting ? "Sending…" : "Submit application"}
            </Button>
            {/* Inter, not MonoCaption: the R6 mono ruling reserves mono for
                numerals and tabular alignment, and this is a CTA note. */}
            <span className="text-xs text-muted-foreground">
              No resume required.
            </span>
          </div>
        </form>
      </Form>
    </div>
  );
}
