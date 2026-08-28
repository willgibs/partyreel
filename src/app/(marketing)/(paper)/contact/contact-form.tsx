"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
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
import { showActionError } from "@/lib/errors";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";

import { submitContactForm } from "./actions";

// Shared card shell so the live form and the success state render in one identical
// container: submitting swaps the inner content without the frame appearing or
// reflowing (the old success state was a card while the form was bare).
function FormCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
      {children}
    </div>
  );
}

export function ContactForm({
  helpSubjects,
}: {
  /** Build-time slug→title map for the help handoff (?about=<slug>). */
  helpSubjects?: Record<string, string>;
}) {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "",
    },
  });
  const { isSubmitting } = form.formState;

  // Help handoff: prefill the subject from ?about=<slug>, allowlisted against
  // the build-time map so nothing attacker-controlled reaches the field. Read
  // in a mount effect (never useSearchParams: on this static route it would
  // demand a Suspense boundary or deopt the page; the motion-tuner precedent).
  // Server and first client render both produce "" — no hydration mismatch.
  useEffect(() => {
    if (!helpSubjects) return;
    const slug = new URLSearchParams(window.location.search).get("about");
    const title = slug ? helpSubjects[slug] : undefined;
    if (title && !form.getValues("subject")) {
      form.setValue("subject", `Help: ${title}`, { shouldDirty: false });
    }
  }, [form, helpSubjects]);

  async function onSubmit(values: ContactInput) {
    const result = await submitContactForm(values);
    if (result.ok) {
      setSubmitted(true);
      form.reset();
      toast.success("Thanks! Your message is on its way.");
    } else {
      showActionError(result);
    }
  }

  if (submitted) {
    return (
      <FormCard>
        {/* h-full + justify-center so the short confirmation sits centered in the
            stretched card frame (the grid matches its height to the form column).
            The drawn check is the 10-success-check recipe (marketing.css ch. 2):
            data-state="in" fires on mount, the inline dasharray (24 ≈ path length
            + 1, per the recipe's calibration note) scopes the draw to THIS icon,
            and success green is the sanctioned state accent. */}
        <div
          data-contact-success
          className="flex h-full flex-col items-start justify-center gap-3"
        >
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
          <h3 className="font-heading text-lg font-medium">Message sent</h3>
          <p className="text-sm text-muted-foreground">
            Thanks for reaching out. Every note gets a reply, usually within a
            day.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubmitted(false)}
          >
            Send another
          </Button>
        </div>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Honeypot — hidden from real users; bots that fill it are silently dropped. */}
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
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Subject{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="What's this about?" {...field} />
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
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="How can we help?"
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
            {isSubmitting ? "Sending…" : "Send message"}
          </Button>
        </form>
      </Form>
    </FormCard>
  );
}
