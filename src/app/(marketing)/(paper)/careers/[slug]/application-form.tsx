"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
      // data-state="in" fires on mount, the inline dasharray (24 ≈ path length
      // + 1) scopes the draw, success green is the sanctioned state accent.
      <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
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
          Thanks for applying to {roleTitle}. If it looks like a fit,
          we&rsquo;ll be in touch.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Honeypot — hidden from applicants; bots that fill it are silently dropped. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          {...form.register("website")}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
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
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="links"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Links{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Portfolio, LinkedIn, GitHub…" {...field} />
              </FormControl>
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
                  placeholder="Tell us why you'd be a great fit, and anything you'd love to work on."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="self-start transition-transform active:scale-[0.98]"
        >
          {isSubmitting ? "Sending…" : "Submit application"}
        </Button>
      </form>
    </Form>
  );
}
